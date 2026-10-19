/**
 * TEDx Thyna Youth — registration + payment backend (Google Apps Script).
 *
 * Stores every registration in the bound Google Sheet and issues a ticket
 * number (TY2026 - 0001, …) only once the pass is paid.
 *
 * Payment methods
 *   konnect  — online: bank card, e-DINAR, Konnect wallet (verified via Konnect API)
 *   flouci   — online: Flouci wallet + bank card (verified via Flouci API)
 *   clictopay — online: Tunisian & international bank cards via SMT ClicToPay
 *   d17      — manual: D17 transfer, attendee enters the transaction reference
 *   transfer — manual: bank transfer, attendee enters the transfer reference
 *   cash     — manual: attendee pays in person when collecting the ticket
 *
 * Online payments are confirmed automatically (return from checkout + webhook).
 * Manual payments are confirmed by an organiser: set the row's Status to "Paid"
 * (dropdown, works in the Sheets phone app too) or use the sheet menu
 * "TEDx → Confirm selected payments". The ticket is then issued and emailed.
 * Setup: see README.md.
 */

const SETTINGS = {
  SHEET_NAME: "Registrations",
  TICKET_PREFIX: "TY2026",
  PRICE_TND: 40,
  MAX_SEATS: 0, // 0 = unlimited. Counts paid passes + payments awaiting confirmation.
  KONNECT_SANDBOX: true, // true = Konnect test environment. Set false when going live.
  CLICTOPAY_TEST: true, // true = test.clictopay.com. Set false when SMT activates your live account.
  PAYMENT_SESSION_MINUTES: 30,
  SEND_CONFIRMATION_EMAIL: true,
  REGISTER_URL: "https://register.tedxthyna.com",
  REPLY_TO: "affes.zied@tedxthyna.com",
  FROM_NAME: "TEDx Thyna Youth",
  // Leave empty to send from the Google account that owns this script.
  // Or set a TEDx Thyna address that is added in that Gmail under
  // Settings → Accounts → "Send mail as" (see README.md).
  FROM_EMAIL: "",
  // Shown in the email to people who choose "Pay in person". Say where and when they can pay and collect.
  PICKUP_INFO: "Our team will contact you by phone to arrange where and when to pay and collect your ticket.",
};

// Secrets live in Project Settings → Script properties, never in code:
//   KONNECT_API_KEY, KONNECT_WALLET_ID, FLOUCI_PUBLIC_KEY, FLOUCI_PRIVATE_KEY
//   CLICTOPAY_USERNAME, CLICTOPAY_PASSWORD  (API user from SMT, not your dashboard login)
//   CLICTOPAY_LIVE_URL (optional — live REST base if SMT gives you a different one)
//   WEBAPP_URL (optional — the /exec URL, if ScriptApp can't infer it)

const METHODS = {
  konnect: { label: "Konnect (card / e-DINAR)", online: true },
  flouci: { label: "Flouci", online: true },
  clictopay: { label: "ClicToPay (card)", online: true },
  d17: { label: "D17", online: false },
  transfer: { label: "Bank transfer", online: false },
  cash: { label: "Pay in person", online: false, noReference: true },
};

const STATUS = {
  UNPAID: "Unpaid", // online checkout started, not paid (yet)
  AWAITING: "Awaiting confirmation", // manual payment declared, organiser must check
  PAID: "Paid",
  REJECTED: "Rejected", // organiser couldn't find the manual payment
};

const HEADERS = [
  "Timestamp", "Order", "Status", "Ticket", "Full name", "Email", "Phone", "Profile", "School / company", "Source",
  "Method", "Amount (TND)", "Payment ref", "Paid at", "Consent", "Checked in", "User agent",
];
const COL = HEADERS.reduce((o, h, i) => ((o[h] = i + 1), o), {}); // 1-based column numbers

/* ───────── web app entry points ───────── */

function doGet(e) {
  const p = (e && e.parameter) || {};
  // Payment provider webhooks: Konnect → ?payment_ref=…, Flouci → ?payment_id=…&success=…
  const ref = p.payment_ref || p.payment_id;
  if (ref) {
    try {
      const row = findBy_(sheet_(), "Payment ref", String(ref));
      if (row && row.status === STATUS.UNPAID) settleOnline_(row);
    } catch (err) {
      console.warn("Webhook failed for " + ref + ": " + err);
    }
    return ContentService.createTextOutput("ok");
  }
  return json_({ ok: true, service: "tedx-thyna-register" });
}

function doPost(e) {
  let body;
  try {
    body = JSON.parse((e && e.postData && e.postData.contents) || "{}");
  } catch (err) {
    return json_({ ok: false, error: "invalid" });
  }
  try {
    ensureSetup_();
    if (body.action === "register") return json_(register_(body));
    if (body.action === "lookup") return json_(lookup_(body));
    if (body.action === "confirm") return json_(confirm_(body));
    return json_({ ok: false, error: "invalid" });
  } catch (err) {
    console.error(err && err.stack ? err.stack : err);
    return json_({ ok: false, error: "server" });
  }
}

/* ───────── actions ───────── */

function register_(body) {
  const email = cleanEmail_(body.email);
  const name = clean_(body.name, 40);
  const phone = String(body.phone || "").replace(/[^\d+ ()-]/g, "").trim().slice(0, 25); // stored with a leading ' so "+" is safe
  const method = String(body.method || "");
  const reference = clean_(body.reference, 60);
  if (!email || name.length < 3 || phone.replace(/\D/g, "").length < 8 || !body.consent) return { ok: false, error: "invalid" };
  if (!METHODS[method]) return { ok: false, error: "invalid" };
  if (!methodEnabled_(method)) return { ok: false, error: "method-unavailable" };
  if (!METHODS[method].online && !METHODS[method].noReference && reference.length < 4) return { ok: false, error: "reference" };

  const sheet = sheet_();
  const fields = {
    "Full name": name,
    Email: email,
    Phone: "'" + phone,
    Profile: clean_(body.profile, 40),
    "School / company": clean_(body.organization, 80),
    Source: clean_(body.source, 40),
    Method: METHODS[method].label,
    "Amount (TND)": SETTINGS.PRICE_TND,
    Consent: "Yes",
    "User agent": clean_(body.userAgent, 180),
  };

  let order;
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const existing = findBy_(sheet, "Email", email);
    if (existing && existing.status === STATUS.PAID) return passOf_(existing, true);
    if (existing && existing.status === STATUS.AWAITING) return { ok: true, status: "awaiting", name: existing.name };

    if (!existing && SETTINGS.MAX_SEATS && seatsTaken_(sheet) >= SETTINGS.MAX_SEATS) return { ok: false, error: "full" };

    fields.Status = METHODS[method].online ? STATUS.UNPAID : STATUS.AWAITING;
    fields["Payment ref"] = METHODS[method].online || METHODS[method].noReference ? "" : reference;
    if (existing) {
      // Unpaid / rejected earlier: reuse the same row and order so nothing is duplicated.
      order = existing.order;
      writeRow_(sheet, existing.index, fields);
    } else {
      order = newOrder_();
      fields.Timestamp = new Date();
      fields.Order = order;
      sheet.appendRow(HEADERS.map((h) => (h in fields ? fields[h] : "")));
    }
    SpreadsheetApp.flush();
  } finally {
    lock.releaseLock();
  }

  if (!METHODS[method].online) {
    if (SETTINGS.SEND_CONFIRMATION_EMAIL)
      safeMail_(() => (method === "cash" ? sendPickup_(email, name) : sendReceived_(email, name, METHODS[method].label, reference)));
    return { ok: true, status: "awaiting", name: name };
  }

  // Online: open a checkout session with the provider, then send the attendee there.
  let session;
  try {
    session =
      method === "konnect" ? konnectCreate_(order, name, email)
      : method === "flouci" ? flouciCreate_(order)
      : clictopayCreate_(order, email);
  } catch (err) {
    console.error("Payment init failed (" + method + "): " + err);
    return { ok: false, error: "payment-init" };
  }
  const row = findBy_(sheet, "Order", order);
  if (row) writeRow_(sheet, row.index, { "Payment ref": session.ref });
  return { ok: true, status: "redirect", payUrl: session.url, order: order };
}

/** Called by the page when the attendee comes back from checkout. */
function confirm_(body) {
  const order = String(body.order || "").replace(/[^A-Z0-9]/gi, "").toUpperCase();
  if (!order) return { ok: false, error: "invalid" };
  const row = findBy_(sheet_(), "Order", order);
  if (!row) return { ok: false, error: "not-found" };
  if (row.status === STATUS.PAID) return passOf_(row, false);
  if (row.status === STATUS.AWAITING) return { ok: true, status: "awaiting", name: row.name };
  if (row.status === STATUS.REJECTED) return { ok: false, error: "rejected" };
  if (row.status !== STATUS.UNPAID || !row.ref) return { ok: false, error: "unpaid" };
  const result = settleOnline_(row);
  if (result.ticket) return { ok: true, status: "paid", ticket: result.ticket, name: row.name, existing: false };
  return result.state === "pending" ? { ok: true, status: "processing" } : { ok: false, error: "unpaid" };
}

function lookup_(body) {
  const email = cleanEmail_(body.email);
  if (!email) return { ok: false, error: "invalid" };
  const row = findBy_(sheet_(), "Email", email);
  if (!row) return { ok: false, error: "not-found" };
  if (row.status === STATUS.PAID) return passOf_(row, true);
  if (row.status === STATUS.AWAITING) return { ok: true, status: "awaiting", name: row.name };
  if (row.status === STATUS.REJECTED) return { ok: false, error: "rejected" };
  if (row.ref) {
    // The webhook may have been missed — ask the provider directly.
    const result = settleOnline_(row);
    if (result.ticket) return { ok: true, status: "paid", ticket: result.ticket, name: row.name, existing: true };
  }
  return { ok: false, error: "unpaid" };
}

/* ───────── settlement ───────── */

/** Verifies an online payment with its provider; issues the ticket when paid. */
function settleOnline_(row) {
  const method = methodKey_(row.method);
  const state =
    method === "konnect" ? konnectStatus_(row.ref)
    : method === "flouci" ? flouciStatus_(row.ref)
    : method === "clictopay" ? clictopayStatus_(row.ref)
    : "failed";
  if (state !== "paid") return { state: state };
  return { state: "paid", ticket: issueTicket_(row.order) };
}

/** Marks the order paid and assigns the next ticket number (idempotent). */
function issueTicket_(order) {
  const sheet = sheet_();
  let row, ticket;
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    row = findBy_(sheet, "Order", order);
    if (!row) throw new Error("Order not found: " + order);
    if (row.status === STATUS.PAID && row.ticket) return row.ticket;
    const props = PropertiesService.getScriptProperties();
    const next = Math.max(Number(props.getProperty("LAST_TICKET") || 0), paidCount_(sheet)) + 1;
    props.setProperty("LAST_TICKET", String(next));
    ticket = SETTINGS.TICKET_PREFIX + " - " + String(next).padStart(4, "0");
    writeRow_(sheet, row.index, { Status: STATUS.PAID, Ticket: ticket, "Paid at": new Date() });
    SpreadsheetApp.flush();
  } finally {
    lock.releaseLock();
  }
  if (SETTINGS.SEND_CONFIRMATION_EMAIL) safeMail_(() => sendConfirmation_(row.email, row.name, ticket, row.order));
  return ticket;
}

/* ───────── Konnect ───────── */

function konnectBase_() {
  return SETTINGS.KONNECT_SANDBOX ? "https://api.preprod.konnect.network/api/v2/" : "https://api.konnect.network/api/v2/";
}

function konnectCreate_(order, name, email) {
  const props = PropertiesService.getScriptProperties();
  const parts = name.split(" ");
  const res = fetchJson_(konnectBase_() + "payments/init-payment", {
    method: "post",
    contentType: "application/json",
    headers: { "x-api-key": props.getProperty("KONNECT_API_KEY") },
    payload: JSON.stringify({
      receiverWalletId: props.getProperty("KONNECT_WALLET_ID"),
      token: "TND",
      amount: SETTINGS.PRICE_TND * 1000, // millimes
      type: "immediate",
      description: "TEDx Thyna Youth 2026 — General Pass",
      acceptedPaymentMethods: ["bank_card", "e-DINAR", "wallet"],
      lifespan: SETTINGS.PAYMENT_SESSION_MINUTES,
      checkoutForm: false,
      addPaymentFeesToAmount: false,
      firstName: parts[0],
      lastName: parts.slice(1).join(" ") || parts[0],
      email: email,
      orderId: order,
      webhook: webAppUrl_(),
      silentWebhook: true,
      successUrl: returnUrl_(order, "ok"),
      failUrl: returnUrl_(order, "failed"),
      theme: "light",
    }),
  });
  if (!res.payUrl || !res.paymentRef) throw new Error("Konnect: " + JSON.stringify(res).slice(0, 300));
  return { url: res.payUrl, ref: res.paymentRef };
}

function konnectStatus_(ref) {
  const res = fetchJson_(konnectBase_() + "payments/" + encodeURIComponent(ref), {
    headers: { "x-api-key": PropertiesService.getScriptProperties().getProperty("KONNECT_API_KEY") },
  });
  const p = res.payment || {};
  const expected = SETTINGS.PRICE_TND * 1000;
  const txOk = (p.transactions || []).some((t) => t.status === "success");
  const amountOk = Number(p.amount) >= expected;
  if (amountOk && (p.status === "completed" || (txOk && Number(p.amountDue || 0) <= 0))) return "paid";
  return /expired|failed|cancel/i.test(String(p.status)) ? "failed" : "pending";
}

/* ───────── Flouci ───────── */

function flouciAuth_() {
  const props = PropertiesService.getScriptProperties();
  return "Bearer " + props.getProperty("FLOUCI_PUBLIC_KEY") + ":" + props.getProperty("FLOUCI_PRIVATE_KEY");
}

function flouciCreate_(order) {
  const res = fetchJson_("https://developers.flouci.com/api/v2/generate_payment", {
    method: "post",
    contentType: "application/json",
    headers: { Authorization: flouciAuth_() },
    payload: JSON.stringify({
      amount: String(SETTINGS.PRICE_TND * 1000), // millimes
      accept_card: true,
      session_timeout_secs: SETTINGS.PAYMENT_SESSION_MINUTES * 60,
      success_link: returnUrl_(order, "ok"),
      fail_link: returnUrl_(order, "failed"),
      developer_tracking_id: order,
      webhook: webAppUrl_(),
    }),
  });
  const r = res.result || {};
  if (!r.link || !r.payment_id) throw new Error("Flouci: " + JSON.stringify(res).slice(0, 300));
  return { url: r.link, ref: r.payment_id };
}

function flouciStatus_(ref) {
  const res = fetchJson_("https://developers.flouci.com/api/v2/verify_payment/" + encodeURIComponent(ref), {
    headers: { Authorization: flouciAuth_() },
  });
  const r = res.result || {};
  if (res.success && r.status === "SUCCESS" && Number(r.amount) >= SETTINGS.PRICE_TND * 1000) return "paid";
  return r.status === "PENDING" ? "pending" : "failed";
}

/* ───────── ClicToPay (SMT) ───────── */

function clictopayBase_() {
  if (SETTINGS.CLICTOPAY_TEST) return "https://test.clictopay.com/payment/rest/";
  return PropertiesService.getScriptProperties().getProperty("CLICTOPAY_LIVE_URL") || "https://ipay.clictopay.com/payment/rest/";
}

function clictopayAuth_() {
  const props = PropertiesService.getScriptProperties();
  return { userName: props.getProperty("CLICTOPAY_USERNAME"), password: props.getProperty("CLICTOPAY_PASSWORD") };
}

function clictopayCreate_(order, email) {
  // ClicToPay refuses a reused orderNumber, so each checkout attempt gets its own suffix.
  const attempt = order + "-" + Date.now().toString(36).toUpperCase();
  const res = fetchJson_(clictopayBase_() + "register.do", {
    method: "post",
    payload: Object.assign(clictopayAuth_(), {
      orderNumber: attempt,
      amount: String(SETTINGS.PRICE_TND * 1000), // millimes
      currency: "788", // TND
      returnUrl: returnUrl_(order, "ok"),
      failUrl: returnUrl_(order, "failed"),
      description: "TEDx Thyna Youth 2026 - General Pass",
      language: "fr",
      jsonParams: JSON.stringify({ email: email }),
    }),
  });
  if (!res.orderId || !res.formUrl) throw new Error("ClicToPay: " + JSON.stringify(res).slice(0, 300));
  return { url: res.formUrl, ref: res.orderId };
}

function clictopayStatus_(ref) {
  const res = fetchJson_(clictopayBase_() + "getOrderStatusExtended.do", {
    method: "post",
    payload: Object.assign(clictopayAuth_(), { orderId: ref, language: "en" }),
  });
  const status = Number(res.orderStatus);
  if (status === 2 && Number(res.amount) >= SETTINGS.PRICE_TND * 1000) return "paid"; // 2 = deposited / paid
  return status === 0 || status === 1 || isNaN(status) ? "pending" : "failed"; // 3 reversed, 4 refunded, 6 declined
}

/* ───────── organiser: confirm by changing Status ───────── */

/**
 * Installable "on edit" trigger (created automatically by ensureSetup_).
 * Setting Status to "Paid" issues + emails the ticket; "Rejected" emails the attendee.
 */
function onStatusEdit(e) {
  if (!e || !e.range) return;
  const sh = e.range.getSheet();
  if (sh.getName() !== SETTINGS.SHEET_NAME || e.range.getColumn() !== COL.Status || e.range.getNumColumns() !== 1) return;
  for (let i = 0; i < e.range.getNumRows(); i++) {
    const index = e.range.getRow() + i;
    if (index < 2) continue;
    const row = rowAt_(sh, index);
    if (!row.order) continue;
    const single = e.range.getNumRows() === 1; // oldValue is only known for single-cell edits
    if (row.status === STATUS.PAID && !row.ticket) {
      issueTicket_(row.order); // adds ticket number + paid date, emails the pass
    } else if (row.status === STATUS.PAID && single && e.oldValue === STATUS.REJECTED) {
      // Reinstated after a cancellation: same ticket number, pass emailed again.
      if (SETTINGS.SEND_CONFIRMATION_EMAIL) safeMail_(() => sendConfirmation_(row.email, row.name, row.ticket, row.order));
    } else if (row.status === STATUS.REJECTED && single && e.oldValue === STATUS.PAID && row.ticket) {
      // Was confirmed, now cancelled: the pass stops working on the site (lookup/confirm return "rejected").
      if (SETTINGS.SEND_CONFIRMATION_EMAIL) safeMail_(() => sendCancelled_(row.email, row.name, row.ticket));
    } else if (row.status === STATUS.REJECTED && single && e.oldValue === STATUS.AWAITING) {
      if (SETTINGS.SEND_CONFIRMATION_EMAIL) safeMail_(() => sendRejected_(row.email, row.name));
    }
  }
}

/** One-time setup: status dropdown, row colours, and the on-edit trigger. Safe to call often. */
function ensureSetup_() {
  const props = PropertiesService.getScriptProperties();
  if (props.getProperty("SETUP_V2") === "done") return;
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sh = sheet_();
    const statusRange = sh.getRange(2, COL.Status, sh.getMaxRows() - 1, 1);
    statusRange.setDataValidation(
      SpreadsheetApp.newDataValidation().requireValueInList([STATUS.AWAITING, STATUS.PAID, STATUS.REJECTED, STATUS.UNPAID], true).setAllowInvalid(true).build()
    );
    const whole = sh.getRange(2, 1, sh.getMaxRows() - 1, HEADERS.length);
    const col = String.fromCharCode(64 + COL.Status);
    const rule = (status, colour) =>
      SpreadsheetApp.newConditionalFormatRule().whenFormulaSatisfied('=$' + col + '2="' + status + '"').setBackground(colour).setRanges([whole]).build();
    sh.setConditionalFormatRules([rule(STATUS.AWAITING, "#fff1c2"), rule(STATUS.PAID, "#dff3dc"), rule(STATUS.REJECTED, "#f6d6d6")]);
    const has = ScriptApp.getProjectTriggers().some((t) => t.getHandlerFunction() === "onStatusEdit");
    if (!has) ScriptApp.newTrigger("onStatusEdit").forSpreadsheet(ss).onEdit().create();
    props.setProperty("SETUP_V2", "done");
  } catch (err) {
    console.warn("Setup skipped: " + err);
  }
}

/** Menu item / manual run from the editor: runs the setup again. */
function setupSheet() {
  PropertiesService.getScriptProperties().deleteProperty("SETUP_V2");
  ensureSetup_();
  SpreadsheetApp.getUi().alert("Done. Change a row's Status to “Paid” to issue and email its ticket.");
}

/* ───────── organiser menu (manual payments) ───────── */

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("TEDx")
    .addItem("Confirm selected payments (D17 / transfer)", "confirmSelected")
    .addItem("Reject selected payments", "rejectSelected")
    .addSeparator()
    .addItem("Set up Status dropdown (run once)", "setupSheet")
    .addToUi();
}

function confirmSelected() {
  const rows = selectedRows_();
  let done = 0;
  rows.forEach((r) => {
    if (r.status === STATUS.AWAITING || r.status === STATUS.REJECTED) {
      issueTicket_(r.order);
      done++;
    }
  });
  SpreadsheetApp.getUi().alert(done + " payment(s) confirmed — tickets issued and emailed.\n" + (rows.length - done) + " row(s) skipped (already paid or online).");
}

function rejectSelected() {
  const sheet = sheet_();
  let done = 0;
  selectedRows_().forEach((r) => {
    if (r.status !== STATUS.AWAITING) return;
    writeRow_(sheet, r.index, { Status: STATUS.REJECTED });
    if (SETTINGS.SEND_CONFIRMATION_EMAIL) safeMail_(() => sendRejected_(r.email, r.name));
    done++;
  });
  SpreadsheetApp.getUi().alert(done + " payment(s) marked as rejected. The attendees were emailed and can register again.");
}

function selectedRows_() {
  const sheet = sheet_();
  const active = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  if (!active || active.getName() !== SETTINGS.SHEET_NAME) return [];
  const range = active.getActiveRange();
  if (!range) return [];
  const out = [];
  for (let i = range.getRow(); i < range.getRow() + range.getNumRows(); i++) {
    if (i < 2) continue;
    out.push(rowAt_(sheet, i));
  }
  return out;
}

/* ───────── sheet helpers ───────── */

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SETTINGS.SHEET_NAME);
  if (sh && sh.getLastRow() > 0) {
    // A tab from the free-registration version has different columns. Keep it untouched
    // under another name and start a fresh tab with the payment columns.
    const width = Math.max(sh.getLastColumn(), HEADERS.length);
    const header = sh.getRange(1, 1, 1, width).getValues()[0].map(String);
    const matches = HEADERS.every((h, i) => header[i] === h);
    if (!matches) {
      const lock = LockService.getScriptLock();
      lock.waitLock(20000);
      try {
        sh = ss.getSheetByName(SETTINGS.SHEET_NAME); // re-check after waiting
        const hdr = sh.getRange(1, 1, 1, Math.max(sh.getLastColumn(), HEADERS.length)).getValues()[0].map(String);
        if (!HEADERS.every((h, i) => hdr[i] === h)) {
          let name = "Registrations (before payments)";
          for (let n = 2; ss.getSheetByName(name); n++) name = "Registrations (before payments " + n + ")";
          sh.setName(name);
          sh = null;
        }
      } finally {
        lock.releaseLock();
      }
      if (!sh) sh = ss.getSheetByName(SETTINGS.SHEET_NAME);
    }
  }
  if (!sh) {
    sh = ss.insertSheet(SETTINGS.SHEET_NAME);
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold").setBackground("#e62b1e").setFontColor("#ffffff");
  }
  return sh;
}

function toRow_(values, index) {
  const v = (h) => values[COL[h] - 1];
  return {
    index: index,
    order: String(v("Order")),
    status: String(v("Status")),
    ticket: String(v("Ticket")),
    name: String(v("Full name")),
    email: String(v("Email")).trim().toLowerCase(),
    method: String(v("Method")),
    ref: String(v("Payment ref")),
  };
}

function rowAt_(sheet, index) {
  return toRow_(sheet.getRange(index, 1, 1, HEADERS.length).getValues()[0], index);
}

/** Latest row whose column `header` equals `value` (case-insensitive for email). */
function findBy_(sheet, header, value) {
  const last = sheet.getLastRow();
  if (last < 2) return null;
  const needle = header === "Email" ? String(value).toLowerCase() : String(value);
  const col = sheet.getRange(2, COL[header], last - 1, 1).getValues();
  for (let i = col.length - 1; i >= 0; i--) {
    const cell = header === "Email" ? String(col[i][0]).trim().toLowerCase() : String(col[i][0]);
    if (cell && cell === needle) return rowAt_(sheet, i + 2);
  }
  return null;
}

function writeRow_(sheet, index, fields) {
  Object.keys(fields).forEach((h) => sheet.getRange(index, COL[h]).setValue(fields[h]));
}

function statuses_(sheet) {
  const last = sheet.getLastRow();
  return last < 2 ? [] : sheet.getRange(2, COL.Status, last - 1, 1).getValues().map((r) => r[0]);
}
/** Tickets already issued (Paid rows that have a ticket number). */
function paidCount_(sheet) {
  const last = sheet.getLastRow();
  if (last < 2) return 0;
  return sheet.getRange(2, COL.Ticket, last - 1, 1).getValues().filter((r) => String(r[0]).trim() !== "").length;
}
function seatsTaken_(sheet) {
  return statuses_(sheet).filter((s) => s === STATUS.PAID || s === STATUS.AWAITING).length;
}

function passOf_(row, existing) {
  return { ok: true, status: "paid", existing: existing, ticket: row.ticket, name: row.name };
}

/* ───────── misc helpers ───────── */

function methodKey_(label) {
  return Object.keys(METHODS).filter((k) => METHODS[k].label === label)[0] || "";
}

function methodEnabled_(method) {
  const props = PropertiesService.getScriptProperties();
  if (method === "konnect") return !!(props.getProperty("KONNECT_API_KEY") && props.getProperty("KONNECT_WALLET_ID"));
  if (method === "flouci") return !!(props.getProperty("FLOUCI_PUBLIC_KEY") && props.getProperty("FLOUCI_PRIVATE_KEY"));
  if (method === "clictopay") return !!(props.getProperty("CLICTOPAY_USERNAME") && props.getProperty("CLICTOPAY_PASSWORD"));
  return true;
}

function newOrder_() {
  // Random, unguessable: the order code is also the key of the "open my pass" link.
  const raw = typeof Utilities !== "undefined" ? Utilities.getUuid() : String(Math.random()) + Math.random() + Date.now();
  return ("T" + raw.replace(/[^0-9a-z]/gi, "").slice(0, 15)).toUpperCase();
}

function webAppUrl_() {
  return PropertiesService.getScriptProperties().getProperty("WEBAPP_URL") || ScriptApp.getService().getUrl();
}

function returnUrl_(order, result) {
  return SETTINGS.REGISTER_URL + "/?order=" + order + "&result=" + result;
}

function fetchJson_(url, options) {
  const res = UrlFetchApp.fetch(url, Object.assign({ muteHttpExceptions: true }, options));
  const text = res.getContentText();
  try {
    return JSON.parse(text);
  } catch (err) {
    throw new Error("HTTP " + res.getResponseCode() + ": " + text.slice(0, 300));
  }
}

function cleanEmail_(v) {
  const email = String(v || "").trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) ? email : "";
}

function clean_(v, max) {
  return String(v || "")
    .replace(/[\u0000-\u001f<>]/g, "")
    .replace(/^[=+\-@]+/, "") // block spreadsheet formula injection
    .trim()
    .slice(0, max);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function safeMail_(fn) {
  try {
    fn();
  } catch (mailErr) {
    console.warn("Email failed: " + mailErr);
  }
}

/* ───────── emails ───────── */
// Paper / poster look of register.tedxthyna.com. Table layout + inline styles so it
// renders the same in Gmail, Apple Mail and Outlook. Fonts fall back to Georgia / Arial.

const MAIL = {
  paper: "#ece7e2",
  sheet: "#f6f2ed",
  ink: "#0b0b0b",
  dim: "#6b6560",
  line: "#d9d2ca",
  red: "#c32b30",
  serif: "'Playfair Display', Georgia, 'Times New Roman', serif",
  sans: "'DM Sans', Helvetica, Arial, sans-serif",
  mono: "'IBM Plex Mono', 'Courier New', monospace",
};

function mailKicker_(text, colour) {
  return '<div style="font:500 11px/1.4 ' + MAIL.mono + ";letter-spacing:3px;text-transform:uppercase;color:" + (colour || MAIL.dim) + '">' + text + "</div>";
}

/** Big two-line title: red italic script-like line + serif caps line. */
function mailTitle_(small, big) {
  return (
    '<div style="font:italic 400 30px/1 ' + MAIL.serif + ";color:" + MAIL.red + ';margin:18px 0 2px">' + small + "</div>" +
    '<div style="font:600 40px/1.02 ' + MAIL.serif + ";color:" + MAIL.ink + ';text-transform:uppercase;letter-spacing:.5px">' + big + "</div>"
  );
}

function mailP_(html) {
  return '<p style="margin:16px 0 0;font:400 15px/1.6 ' + MAIL.sans + ";color:" + MAIL.ink + '">' + html + "</p>";
}

function mailButton_(label, url) {
  return (
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:26px 0 0"><tr>' +
    '<td style="border-radius:999px;background:' + MAIL.red + '">' +
    '<a href="' + url + '" style="display:inline-block;padding:15px 30px;font:600 15px ' + MAIL.sans +
    ';color:#ffffff;text-decoration:none;border-radius:999px">' + label + " &rarr;</a></td></tr></table>"
  );
}

/** Label / value rows (Date, Venue, …). */
function mailFacts_(rows) {
  return (
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:26px 0 0;border-top:1.5px solid ' + MAIL.ink + '">' +
    rows
      .map(function (r) {
        return (
          '<tr><td style="padding:12px 12px 12px 0;border-bottom:1px solid ' + MAIL.line + ';width:110px;vertical-align:top">' + mailKicker_(r[0], MAIL.red) + "</td>" +
          '<td style="padding:11px 0;border-bottom:1px solid ' + MAIL.line + ";font:600 15px/1.45 " + MAIL.sans + ";color:" + MAIL.ink + '">' + r[1] +
          (r[2] ? '<div style="font:400 13px/1.45 ' + MAIL.sans + ";color:" + MAIL.dim + '">' + r[2] + "</div>" : "") + "</td></tr>"
        );
      })
      .join("") +
    "</table>"
  );
}

/** The pass: black ticket, perforated line, ticket number below (stacks well on phones). */
function mailTicket_(name, ticket) {
  return (
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:26px 0 0;background:' + MAIL.ink + ';border-radius:12px">' +
    '<tr><td style="padding:22px 24px 18px">' +
    mailKicker_("General Pass", "#ef4a50") +
    '<div style="font:600 22px/1.15 ' + MAIL.serif + ';color:#ffffff;text-transform:uppercase;margin:10px 0 0">' + escape_(name) + "</div>" +
    '<div style="font:400 13px/1.5 ' + MAIL.sans + ';color:#bdb6ae;margin:8px 0 0">15 Nov 2026 &middot; 10:00 – 20:00 &middot; Complexe Culturel Mohamed Jamoussi, Sfax</div>' +
    "</td></tr>" +
    '<tr><td style="padding:0 24px"><div style="border-top:2px dashed #3a3a3a;height:0;line-height:0;font-size:0">&nbsp;</div></td></tr>' +
    '<tr><td style="padding:16px 24px 20px">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>' +
    '<td style="vertical-align:middle">' + mailKicker_("Ticket Nº", "#9c958d") + "</td>" +
    '<td align="right" style="vertical-align:middle;font:700 22px/1.2 ' + MAIL.mono + ';color:#ffffff;white-space:nowrap">' + escape_(ticket) + "</td>" +
    "</tr></table></td></tr></table>"
  );
}

/** Highlighted box (payment summary, next steps). */
function mailBox_(html) {
  return (
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 0"><tr>' +
    '<td style="padding:18px 20px;border:1.5px dashed ' + MAIL.ink + ";background:#fbf9f6;font:400 14.5px/1.6 " + MAIL.sans + ";color:" + MAIL.ink + '">' + html + "</td></tr></table>"
  );
}

function mailLayout_(o) {
  const url = SETTINGS.REGISTER_URL;
  return (
    '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"></head>' +
    '<body style="margin:0;padding:0;background:' + MAIL.paper + '">' +
    '<div style="display:none;max-height:0;overflow:hidden;opacity:0">' + escape_(o.preheader || "") + "</div>" +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:' + MAIL.paper + '"><tr><td align="center" style="padding:28px 14px">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:580px">' +
    // header
    '<tr><td style="padding:0 6px 18px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>' +
    '<td><a href="https://tedxthyna.com"><img src="' + url + '/assets/wordmark-dark.png" width="160" alt="TEDx Thyna Youth" style="display:block;border:0;width:160px;height:auto"></a></td>' +
    '<td align="right">' + mailKicker_("15 · 11 · 2026") + "</td></tr></table></td></tr>" +
    // sheet
    '<tr><td style="background:' + MAIL.sheet + ";border-top:6px solid " + MAIL.red + ';padding:34px 30px 34px;border-radius:2px">' +
    mailKicker_(o.kicker || "TEDx Thyna Youth 2026 &middot; Break The Pattern") +
    mailTitle_(o.small, o.big) +
    o.body +
    "</td></tr>" +
    // footer
    '<tr><td style="padding:22px 6px 0;text-align:center">' +
    '<div style="font:italic 500 17px/1.3 ' + MAIL.serif + ";color:" + MAIL.ink + '">Break <span style="color:' + MAIL.red + '">the</span> pattern.</div>' +
    '<div style="margin:12px 0 0;font:400 12.5px/1.7 ' + MAIL.sans + ";color:" + MAIL.dim + '">' +
    '<a href="https://tedxthyna.com" style="color:' + MAIL.dim + '">tedxthyna.com</a> &middot; ' +
    '<a href="https://www.instagram.com/tedxthyna/" style="color:' + MAIL.dim + '">Instagram</a> &middot; ' +
    "Questions? Just reply to this email.</div>" +
    '<div style="margin:10px 0 0;font:400 10.5px/1.5 ' + MAIL.mono + ";letter-spacing:1.5px;text-transform:uppercase;color:#9c958d" + '">x = independently organized TED event</div>' +
    "</td></tr></table></td></tr></table></body></html>"
  );
}

function plainText_(html) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<div/gi, "\n<div")
    .replace(/<\/(p|div|tr|h\d)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&middot;/g, "·").replace(/&rarr;/g, "→").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&")
    .replace(/\n\s*\n\s*\n+/g, "\n\n")
    .trim();
}

/** Sends from SETTINGS.FROM_EMAIL (a Gmail "Send mail as" alias) when set, else from the script owner. */
function sendMail_(email, subject, o) {
  const html = mailLayout_(o);
  const opts = { htmlBody: html, name: SETTINGS.FROM_NAME, replyTo: SETTINGS.REPLY_TO };
  if (SETTINGS.FROM_EMAIL) {
    GmailApp.sendEmail(email, subject, plainText_(html), Object.assign({ from: SETTINGS.FROM_EMAIL }, opts));
  } else {
    MailApp.sendEmail(Object.assign({ to: email, subject: subject, body: plainText_(html) }, opts));
  }
}

const EVENT_FACTS = [
  ["Date", "Sunday 15 November 2026", "10:00 – 20:00"],
  ["Venue", "Complexe Culturel Mohamed Jamoussi", "Rue Ibn Al Jazzar, Sfax"],
];

/** Link that opens this attendee's pass (same design as on the site) ready to download. */
function passUrl_(order) {
  return order ? SETTINGS.REGISTER_URL + "/?order=" + encodeURIComponent(order) + "&view=pass" : SETTINGS.REGISTER_URL;
}

function sendConfirmation_(email, name, ticket, order) {
  sendMail_(email, "Your TEDx Thyna Youth pass · " + ticket, {
    preheader: "Payment received — your General Pass " + ticket + " is confirmed. See you on 15 November.",
    small: "You're in,",
    big: escape_(String(name).split(" ")[0]) + '<span style="color:' + MAIL.red + '">.</span>',
    body:
      mailP_("We've received your payment of <b>" + SETTINGS.PRICE_TND + " TND</b>. Your General Pass for <b>TEDx Thyna Youth 2026 — Break The Pattern</b> is confirmed.") +
      mailTicket_(name, ticket) +
      mailButton_("Open &amp; download my pass", passUrl_(order)) +
      mailP_('<span style="color:' + MAIL.dim + ';font-size:13.5px">The button opens your official General Pass — tap <b>Download ticket</b> to save it. Show it at the entrance, on your phone or printed. You can also find it any time on the site with <b>Already registered? Find my pass</b>.</span>') +
      mailFacts_(EVENT_FACTS),
  });
}

function sendReceived_(email, name, method, reference) {
  sendMail_(email, "We received your TEDx Thyna Youth registration", {
    preheader: "Thanks " + String(name).split(" ")[0] + " — we're checking your " + method + " payment. Your ticket follows by email.",
    small: "Almost there,",
    big: escape_(String(name).split(" ")[0]) + '<span style="color:' + MAIL.red + '">.</span>',
    body:
      mailP_("Thanks for registering for <b>TEDx Thyna Youth 2026 — Break The Pattern</b>. Our team checks every payment by hand.") +
      mailBox_(
        mailKicker_("Your payment", MAIL.red) +
        '<div style="margin:8px 0 0">' + escape_(method) + " &middot; <b>" + SETTINGS.PRICE_TND + " TND</b></div>" +
        '<div style="margin:2px 0 0;color:' + MAIL.dim + '">Reference: <span style="font-family:' + MAIL.mono + ";color:" + MAIL.ink + '">' + escape_(reference) + "</span></div>"
      ) +
      mailP_("As soon as it's confirmed — usually within 24 hours — you'll get a second email with your <b>ticket number</b>.") +
      mailFacts_(EVENT_FACTS),
  });
}

function sendPickup_(email, name) {
  sendMail_(email, "We received your TEDx Thyna Youth registration", {
    preheader: "You're registered — pay " + SETTINGS.PRICE_TND + " TND in person and collect your ticket.",
    small: "You're registered,",
    big: escape_(String(name).split(" ")[0]) + '<span style="color:' + MAIL.red + '">.</span>',
    body:
      mailP_("Thanks for registering for <b>TEDx Thyna Youth 2026 — Break The Pattern</b>. You chose to <b>pay in person</b>.") +
      mailBox_(
        mailKicker_("Next step", MAIL.red) +
        '<div style="margin:8px 0 0">' + escape_(SETTINGS.PICKUP_INFO) + "</div>" +
        '<div style="margin:6px 0 0">Bring <b>' + SETTINGS.PRICE_TND + " TND</b> in cash.</div>"
      ) +
      mailP_("Once you've paid, your <b>ticket number</b> is emailed to you straight away.") +
      mailFacts_(EVENT_FACTS),
  });
}

function sendCancelled_(email, name, ticket) {
  sendMail_(email, "Your TEDx Thyna Youth pass " + ticket + " has been cancelled", {
    preheader: "We couldn't confirm your payment, so pass " + ticket + " is no longer valid.",
    small: "Hi " + escape_(String(name).split(" ")[0]) + ",",
    big: "Pass <span style=\"color:" + MAIL.red + '">cancelled</span>',
    body:
      mailP_("After checking our accounts we couldn't confirm your payment, so your General Pass <b>" + escape_(ticket) + "</b> has been cancelled and is no longer valid at the entrance.") +
      mailP_("If you did pay, simply reply to this email with a screenshot of your payment and we'll restore your pass with the same ticket number.") +
      mailButton_("Register again", SETTINGS.REGISTER_URL),
  });
}

function sendRejected_(email, name) {
  sendMail_(email, "About your TEDx Thyna Youth payment", {
    preheader: "We couldn't find your payment yet — here's what to do.",
    small: "Hi " + escape_(String(name).split(" ")[0]) + ",",
    big: "One more <span style=\"color:" + MAIL.red + '">step</span>',
    body:
      mailP_("We couldn't match your payment to our account, so your pass isn't confirmed yet.") +
      mailP_("Please check the reference on your receipt and register again with <b>the same email</b> — or simply reply to this email with a screenshot of your payment and we'll sort it out.") +
      mailButton_("Register again", SETTINGS.REGISTER_URL),
  });
}

function escape_(s) {
  return String(s).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}
