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
 *
 * Online payments are confirmed automatically (return from checkout + webhook).
 * Manual payments are confirmed by an organiser from the sheet menu
 * "TEDx → Confirm selected payments". Setup: see README.md.
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
  if (!METHODS[method].online && reference.length < 4) return { ok: false, error: "reference" };

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
    fields["Payment ref"] = METHODS[method].online ? "" : reference;
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
    if (SETTINGS.SEND_CONFIRMATION_EMAIL) safeMail_(() => sendReceived_(email, name, METHODS[method].label, reference));
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
  if (SETTINGS.SEND_CONFIRMATION_EMAIL) safeMail_(() => sendConfirmation_(row.email, row.name, ticket));
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

/* ───────── organiser menu (manual payments) ───────── */

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu("TEDx")
    .addItem("Confirm selected payments (D17 / transfer)", "confirmSelected")
    .addItem("Reject selected payments", "rejectSelected")
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
function paidCount_(sheet) {
  return statuses_(sheet).filter((s) => s === STATUS.PAID).length;
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
  const rand = Math.floor(Math.random() * 46656).toString(36).padStart(3, "0");
  return ("T" + Date.now().toString(36) + rand).toUpperCase();
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

function mailShell_(inner) {
  return (
    '<div style="font-family:Montserrat,Arial,sans-serif;max-width:560px;margin:auto;color:#111">' +
    '<div style="background:#000;padding:22px 26px"><span style="color:#e62b1e;font-weight:800;font-size:22px">TED<sup>x</sup></span> ' +
    '<span style="color:#fff;font-size:20px">Thyna Youth</span></div>' +
    '<div style="padding:26px;border:1px solid #eee;border-top:0">' + inner +
    '<p style="color:#777;font-size:12px;margin-top:28px">x = independently organized TED event</p></div></div>'
  );
}

function sendMail_(email, subject, inner) {
  MailApp.sendEmail({ to: email, subject: subject, htmlBody: mailShell_(inner), name: "TEDx Thyna Youth", replyTo: SETTINGS.REPLY_TO });
}

function sendConfirmation_(email, name, ticket) {
  sendMail_(
    email,
    "Your TEDx Thyna Youth pass · " + ticket,
    "<p>Hi " + escape_(name) + ",</p>" +
      "<p>Payment received (" + SETTINGS.PRICE_TND + " TND) — your General Pass for <b>TEDx Thyna Youth 2026 — Break The Pattern</b> is confirmed.</p>" +
      '<p style="font-size:13px;letter-spacing:2px;color:#777;margin:22px 0 4px">TICKET Nº</p>' +
      '<p style="font-size:30px;font-weight:800;margin:0 0 22px">' + ticket + "</p>" +
      "<p><b>15 November 2026</b> · 10:00 – 20:00<br>Complexe Culturel Mohamed Jamoussi, Rue Ibn Al Jazzar, Sfax</p>" +
      '<p>Download your ticket any time at <a href="' + SETTINGS.REGISTER_URL + '" style="color:#e62b1e">' +
      SETTINGS.REGISTER_URL.replace("https://", "") + "</a> → “Already registered? Find my pass”.</p>"
  );
}

function sendReceived_(email, name, method, reference) {
  sendMail_(
    email,
    "We received your TEDx Thyna Youth registration",
    "<p>Hi " + escape_(name) + ",</p>" +
      "<p>Thanks for registering for <b>TEDx Thyna Youth 2026 — Break The Pattern</b>.</p>" +
      "<p>We've noted your " + escape_(method) + " payment of <b>" + SETTINGS.PRICE_TND + " TND</b> (reference <b>" + escape_(reference) + "</b>). " +
      "Our team checks payments by hand — once it's confirmed you'll receive your ticket number by email, usually within 24 hours.</p>"
  );
}

function sendRejected_(email, name) {
  sendMail_(
    email,
    "About your TEDx Thyna Youth payment",
    "<p>Hi " + escape_(name) + ",</p>" +
      "<p>We couldn't match your payment to our account, so your pass isn't confirmed yet.</p>" +
      '<p>Please check the reference and register again at <a href="' + SETTINGS.REGISTER_URL + '" style="color:#e62b1e">' +
      SETTINGS.REGISTER_URL.replace("https://", "") + "</a> with the same email, or reply to this message.</p>"
  );
}

function escape_(s) {
  return String(s).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}
