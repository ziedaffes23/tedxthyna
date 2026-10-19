/* TEDx Thyna Youth — registration app (vanilla JS, no build step).
   Flow: 01 About you → 02 Your profile → 03 Payment → 04 Your pass.
   Online payments (Konnect, Flouci) leave the page for checkout and come back with ?order=…;
   manual payments (D17, bank transfer) end on an "awaiting confirmation" screen. */
(function () {
  "use strict";

  const CFG = window.TEDX_REGISTER || {};
  const PAY = CFG.PAYMENT || {};
  const PRICE = PAY.PRICE || 40;
  const CUR = PAY.CURRENCY || "TND";
  const ONLINE = ["konnect", "flouci", "clictopay"];
  const NEEDS_REF = ["d17", "transfer"];
  const SAVED_FORM = "tedx-thyna-form";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  const canvas = $("#ticket");
  const ctx = canvas.getContext("2d");
  const tilt = $("#ticketTilt");
  const form = $("#form");
  const sheet = $("#sheet");
  const reveal = $("#reveal");
  const errorBox = $("#error");
  let step = "1";
  let issued = null; // { ticket, name }

  /* ───────── torn paper edges (same generator as tedxthyna.com) ───────── */

  function rand(seed) {
    let s = seed >>> 0;
    return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  }
  $$("[data-torn]").forEach((el) => {
    const r = rand(Number(el.dataset.torn) || 3);
    const pts = [];
    for (let x = 0; x < 1000; x += 4 + r() * 16) pts.push(`${x.toFixed(1)},${(8 + r() * 22 + (r() > 0.85 ? r() * 14 : 0)).toFixed(1)}`);
    el.innerHTML = `<svg viewBox="0 0 1000 60" preserveAspectRatio="none" aria-hidden="true"><path fill="currentColor" d="M0,60 L0,20 L${pts.join(" L")} L1000,18 L1000,60 Z"/></svg>`;
  });

  /* ───────── hero speaker carousel (same rhythm as tedxthyna.com) ───────── */

  const HERO_SPEAKERS = [
    { first: "Hamza", last: "Belloumi", label: "Speaker", photo: "hamza-belloumi" },
    { first: "Sawsen", last: "Haj Amor", label: "Speaker", photo: "sawsen-haj-amor" },
    { first: "Mohamed", last: "Khammessi", label: "Speaker", photo: "mohamed-khammessi" },
    { first: "Sawsen", last: "Maalej", label: "Speaker", photo: "sawsen-maalej" },
  ];
  const hcPhoto = $("#hcPhoto");
  const hcProgress = $("#hcProgress");
  if (hcPhoto) {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const hcRole = $("#hcRole");
    const hcFirst = $("#hcFirst");
    const hcLast = $("#hcLast");
    const hcFrame = hcPhoto.closest(".hc-frame");
    let hcIndex = 0;
    let timer = null;

    const buttons = HERO_SPEAKERS.map((s, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.role = "tab";
      btn.ariaLabel = `${s.first} ${s.last}`;
      btn.innerHTML = "<i></i>";
      btn.addEventListener("click", () => render(i, true));
      hcProgress.appendChild(btn);
      return btn;
    });

    function paintButtons() {
      buttons.forEach((btn, i) => {
        btn.classList.toggle("is-on", i === hcIndex);
        btn.classList.toggle("is-done", i < hcIndex);
        btn.setAttribute("aria-selected", i === hcIndex ? "true" : "false");
        if (i === hcIndex) {
          const bar = btn.querySelector("i");
          bar.style.animation = "none";
          void bar.offsetWidth;
          bar.style.animation = "";
        }
      });
    }

    function render(index, manual) {
      hcIndex = (index + HERO_SPEAKERS.length) % HERO_SPEAKERS.length;
      const s = HERO_SPEAKERS[hcIndex];
      hcPhoto.style.opacity = "0";
      setTimeout(() => {
        hcPhoto.src = `/assets/speakers/${s.photo}.webp`;
        hcPhoto.alt = `${s.first} ${s.last}, ${s.label}`;
        hcRole.textContent = `Meet Our ${s.label}`;
        hcFirst.textContent = s.first;
        hcLast.textContent = s.last;
        hcPhoto.style.opacity = "1";
      }, reduce ? 0 : 350);
      paintButtons();
      if (manual && !reduce) restart();
    }

    function restart() {
      if (timer) window.clearInterval(timer);
      if (reduce) return;
      timer = window.setInterval(() => render(hcIndex + 1), 4000);
    }

    if (hcFrame) hcFrame.addEventListener("click", () => render(hcIndex + 1, true));
    paintButtons();
    restart();
  }

  /* ───────── ticket rendering ───────── */

  // Positions are in the template's native pixels (1772 × 709).
  const SPOT = {
    name: { x: 915, y: 566, maxW: 230, size: 21 },
    number: { x: 1592, y: 636, maxW: 270, size: 34 },
  };

  const template = new Image();
  template.decoding = "async";
  template.src = "/assets/ticket-template.webp";
  const templateReady = new Promise((res) => {
    if (template.complete && template.naturalWidth) res();
    template.addEventListener("load", res);
    template.addEventListener("error", res);
  });
  const fontsReady = document.fonts && document.fonts.load
    ? Promise.all([document.fonts.load('600 20px "Montserrat"'), document.fonts.load('700 30px "Montserrat"')]).catch(() => {})
    : Promise.resolve();

  function fitFont(text, weight, size, maxW) {
    let s = size;
    do {
      ctx.font = `${weight} ${s}px Montserrat, "DM Sans", sans-serif`;
      if (ctx.measureText(text).width <= maxW) break;
      s -= 1;
    } while (s > 10);
  }

  async function draw(name, number) {
    await Promise.all([templateReady, fontsReady]);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (template.naturalWidth) ctx.drawImage(template, 0, 0, canvas.width, canvas.height);
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";

    const holder = String(name || "").trim().toUpperCase();
    fitFont(holder, 600, SPOT.name.size, SPOT.name.maxW);
    ctx.fillStyle = "#111111";
    if ("letterSpacing" in ctx) ctx.letterSpacing = "1px";
    ctx.fillText(holder, SPOT.name.x, SPOT.name.y);

    fitFont(number, 700, SPOT.number.size, SPOT.number.maxW);
    ctx.fillStyle = "#0b0b0b";
    if ("letterSpacing" in ctx) ctx.letterSpacing = "0px";
    ctx.fillText(number, SPOT.number.x, SPOT.number.y);
  }

  // gentle 3D tilt on pointer devices (after the reveal)
  const wrap = $("#ticketWrap");
  wrap.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse" || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = wrap.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    tilt.style.transform = `rotateY(${x * 8}deg) rotateX(${-y * 8}deg)`;
  });
  wrap.addEventListener("pointerleave", () => (tilt.style.transform = ""));

  /* ───────── steps ───────── */

  function setProgress(n) {
    $$("#progress li").forEach((li) => {
      const s = Number(li.dataset.step);
      li.classList.toggle("is-on", s === n);
      li.classList.toggle("is-done", s < n);
      if (s === n) li.setAttribute("aria-current", "step");
      else li.removeAttribute("aria-current");
    });
  }

  function go(next, { back = false, focus = true } = {}) {
    step = String(next);
    hideError();
    $$(".step").forEach((fs) => {
      const on = fs.dataset.step === step;
      fs.hidden = !on;
      fs.disabled = !on;
      fs.classList.toggle("is-back", on && back);
    });
    setProgress({ lookup: 1, processing: 3, awaiting: 3 }[step] || Number(step));
    $('[name="lookupEmail"]').required = step === "lookup";
    if (focus) {
      const first = $(`.step[data-step="${step}"] input:not([type=hidden]), .step[data-step="${step}"] select`);
      if (first) first.focus({ preventScroll: true });
      const top = $("#flow").getBoundingClientRect().top + window.scrollY - 70;
      if (window.scrollY > top + 40 || window.scrollY < top - window.innerHeight / 2) window.scrollTo({ top, behavior: "smooth" });
    }
  }

  $$("[data-next]").forEach((b) => b.addEventListener("click", () => validate(step) || go(Number(step) + 1)));
  $$("[data-back]").forEach((b) => b.addEventListener("click", () => go(Number(step) - 1, { back: true })));
  $$("[data-go]").forEach((b) => b.addEventListener("click", () => go(b.dataset.go, { back: b.dataset.go === "1" })));

  /* ───────── validation ───────── */

  function showError(msg) {
    errorBox.textContent = msg;
    errorBox.hidden = false;
  }
  function hideError() {
    errorBox.hidden = true;
    $$(".is-bad").forEach((el) => el.classList.remove("is-bad"));
  }
  const emailOk = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
  const phoneOk = (v) => v.replace(/[^\d]/g, "").length >= 8;
  const val = (n) => {
    const el = form.elements[n];
    if (!el) return "";
    if (el.type === "checkbox") return el.checked;
    return (el.value || "").trim();
  };

  /** Returns true when the step has a problem (and shows it). */
  function validate(which) {
    hideError();
    const bad = [];
    if (which === "1") {
      if (val("name").length < 3) bad.push("name");
      if (!emailOk(val("email"))) bad.push("email");
      if (!phoneOk(val("phone"))) bad.push("phone");
    } else if (which === "2") {
      if (!val("profile")) bad.push("profile");
      if (!val("source")) bad.push("source");
      if (!val("consent")) bad.push("consent");
    } else if (which === "3") {
      const m = val("method");
      if (!m) bad.push("method");
      else if (NEEDS_REF.includes(m) && val("reference").length < 4) bad.push("reference");
    } else if (which === "lookup") {
      if (!emailOk(val("lookupEmail"))) bad.push("lookupEmail");
    }
    if (!bad.length) return false;
    bad.forEach((n) => {
      const el = form.elements[n];
      const node = el instanceof RadioNodeList ? el[0] : el;
      (node.closest(".field") || node.closest(".check")).classList.add("is-bad");
    });
    const first = form.elements[bad[0]];
    (first instanceof RadioNodeList ? first[0] : first).focus();
    const msg =
      bad.length === 1 && bad[0] === "consent" ? "Please accept the consent checkbox to continue."
      : bad.length === 1 && bad[0] === "profile" ? "Tell us who you are — pick one option."
      : bad.length === 1 && bad[0] === "method" ? "Choose how you'd like to pay."
      : bad.length === 1 && bad[0] === "reference" ? "Enter the reference of your transfer so we can find your payment."
      : "Please check the highlighted fields.";
    showError(msg);
    return true;
  }

  /* ───────── submit ───────── */

  async function call(payload) {
    if (!CFG.ENDPOINT) throw new Error("not-configured");
    const res = await fetch(CFG.ENDPOINT, { method: "POST", body: JSON.stringify(payload), redirect: "follow" });
    if (!res.ok) throw new Error("http-" + res.status);
    return res.json();
  }

  const MESSAGES = {
    "not-configured": "Registration is being set up — please try again in a few minutes.",
    "not-found": "We couldn't find a pass for that email. Check the spelling, or register.",
    full: "We're sorry — all seats have been claimed. Follow @tedxthyna for any released seats.",
    invalid: "Some details look incorrect. Please check the form.",
    reference: "Enter the reference of your transfer so we can find your payment.",
    unpaid: "Your payment wasn't completed, so no pass was issued. Choose a payment method to try again.",
    rejected: "This pass isn't valid: we couldn't confirm the payment. Check your email, or register again with the same address.",
    "payment-init": "The payment page couldn't be opened. Please try again, or choose another payment method.",
    "backend-outdated": "Registration is being updated — please try again in a few minutes.",
    "method-unavailable": "This payment method isn't available right now — please choose another one.",
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (val("website")) return; // bot honeypot
    if (step === "1" || step === "2") return validate(step) || go(Number(step) + 1); // Enter moves forward
    if (step !== "3" && step !== "lookup") return;
    if (validate(step)) return;

    const btn = step === "lookup" ? $("#lookupBtn") : $("#submitBtn");
    let leaving = false;
    btn.disabled = true;
    btn.classList.add("is-loading");
    try {
      const payload =
        step === "lookup"
          ? { action: "lookup", email: val("lookupEmail").toLowerCase() }
          : {
              action: "register",
              name: val("name").replace(/\s+/g, " "),
              email: val("email").toLowerCase(),
              phone: val("phone"),
              profile: val("profile"),
              organization: val("organization"),
              source: val("source"),
              consent: true,
              method: val("method"),
              reference: NEEDS_REF.includes(val("method")) ? val("reference") : "",
              userAgent: navigator.userAgent.slice(0, 180),
            };
      const out = await call(payload);
      if (!out || !out.ok) throw new Error((out && out.error) || "unknown");
      // The payment backend always answers with a status. A ticket without one means the
      // Apps Script deployment still runs the old free-registration code: never show a pass.
      if (step !== "lookup" && !out.status) throw new Error("backend-outdated");
      if (out.status === "redirect" && out.payUrl) {
        saveForm();
        leaving = true;
        window.location.assign(out.payUrl);
        return; // keep the button spinning while the checkout page loads
      }
      await handleResult(out, step === "lookup");
    } catch (err) {
      const key = String(err && err.message);
      showError(MESSAGES[key] || "Something went wrong. Please check your connection and try again.");
    } finally {
      if (!leaving) {
        btn.disabled = false;
        btn.classList.remove("is-loading");
      }
    }
  });

  /* ───────── step 3: the pass ───────── */

  async function issue(ticket, name, existing) {
    issued = { ticket, name };
    await draw(name, ticket);
    sheet.hidden = true;
    setProgress(4);
    clearSavedForm();
    $("#stampNo").textContent = ticket;
    $("#revealKicker").textContent = existing ? `Welcome back · ${ticket}` : `You're in · ${ticket}`;
    $("#revealText").textContent = existing
      ? "Here is your pass again. Download it and show it at the entrance — on your phone or printed."
      : "Your pass is ready. Download it and show it at the entrance — on your phone or printed. A confirmation is on its way to your inbox.";
    buildCalendar();
    $("#shareBtn").hidden = !navigator.canShare;
    reveal.classList.remove("is-live");
    reveal.hidden = false;
    void reveal.offsetWidth;
    reveal.classList.add("is-live");
    const top = $("#flow").getBoundingClientRect().top + window.scrollY - 60;
    window.scrollTo({ top, behavior: "smooth" });
    try {
      localStorage.setItem("tedx-thyna-pass", JSON.stringify(issued));
    } catch (_) {
      /* storage unavailable */
    }
  }

  const fileName = () => `TEDxThynaYouth-Pass-${issued.ticket.replace(/\s+/g, "")}.png`;
  const toBlob = () => new Promise((resolve) => canvas.toBlob(resolve, "image/png"));

  $("#downloadBtn").addEventListener("click", async () => {
    const blob = await toBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName();
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  });

  $("#shareBtn").addEventListener("click", async () => {
    const blob = await toBlob();
    const file = new File([blob], fileName(), { type: "image/png" });
    const data = { files: [file], title: "My TEDx Thyna Youth pass", text: "See you on 15 November at TEDx Thyna Youth! Get yours: https://register.tedxthyna.com" };
    try {
      if (navigator.canShare(data)) await navigator.share(data);
      else await navigator.share({ title: data.title, text: data.text, url: "https://register.tedxthyna.com" });
    } catch (_) {
      /* user cancelled */
    }
  });

  function buildCalendar() {
    const esc = (s) => String(s).replace(/[,;\\]/g, (m) => "\\" + m);
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//TEDx Thyna Youth//Register//EN",
      "BEGIN:VEVENT",
      `UID:${issued.ticket.replace(/\s+/g, "")}@tedxthyna.com`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "")}`,
      `DTSTART;TZID=${CFG.EVENT_TZ}:${CFG.EVENT_START}`,
      `DTEND;TZID=${CFG.EVENT_TZ}:${CFG.EVENT_END}`,
      `SUMMARY:${esc(CFG.EVENT_TITLE)}`,
      `LOCATION:${esc(CFG.EVENT_LOCATION)}`,
      `DESCRIPTION:${esc(`General Pass ${issued.ticket} — ${issued.name}. Bring your ticket (phone or printed).`)}`,
      "URL:https://tedxthyna.com",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    $("#calendarBtn").href = "data:text/calendar;charset=utf-8," + encodeURIComponent(ics);
  }

  function startOver() {
    issued = null;
    form.reset();
    updateMethod();
    clearSavedForm();
    reveal.hidden = true;
    reveal.classList.remove("is-live");
    sheet.hidden = false;
    go(1);
  }
  $("#againBtn").addEventListener("click", startOver);
  $("#againPending").addEventListener("click", startOver);

  /* ───────── payment ───────── */

  async function handleResult(out, existing) {
    if (out.status === "awaiting") {
      $("#awaitingText").textContent = !existing && val("method") === "cash"
        ? `You're registered. ${PAY.PICKUP || "Our team will contact you by phone to arrange where and when to pay and collect your ticket."} Bring ${PRICE} ${CUR} — once you've paid, your ticket number arrives by email.`
        : existing
        ? "We have your registration and our team is still checking your payment. Your ticket number arrives by email as soon as it's confirmed (usually within 24 hours)."
        : "We've received your registration. Our team is checking your payment — once it's confirmed, your ticket number arrives by email (usually within 24 hours). You can also come back here and use “Find my pass”.";
      clearSavedForm();
      return go("awaiting");
    }
    if (out.status === "processing") return go("processing");
    if (out.ticket) return issue(out.ticket, out.name, !!out.existing);
    throw new Error("unknown");
  }

  $$("[data-price]").forEach((el) => (el.textContent = PRICE));

  // Offer only the methods that are configured.
  const offered = (PAY.METHODS || ONLINE).filter((m) =>
    m === "d17" ? !!PAY.D17_NUMBER : m === "transfer" ? !!(PAY.BANK && PAY.BANK.RIB) : m === "cash" || ONLINE.includes(m)
  );
  const soon = PAY.COMING_SOON || [];
  $$(".method").forEach((el) => {
    el.hidden = !offered.includes(el.dataset.method);
    if (!soon.includes(el.dataset.method)) return;
    el.classList.add("is-soon");
    $("input", el).disabled = true;
    const tag = $(".tag", el);
    tag.textContent = "Coming soon";
    tag.className = "tag is-slow";
  });
  const payable = offered.filter((m) => !soon.includes(m));
  if (payable.length === 1) $(`.method[data-method="${payable[0]}"] input`).checked = true;

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  function payRow(label, value, copy) {
    if (!value) return "";
    return `<div><dt class="mono">${esc(label)}</dt><dd><span>${esc(value)}</span>${
      copy ? `<button type="button" class="copy mono" data-copy="${esc(value)}">Copy</button>` : ""
    }</dd></div>`;
  }

  function updateMethod() {
    const m = val("method");
    const manual = !!m && !ONLINE.includes(m);
    $("#paybox").hidden = !manual;
    $("#onlineNote").hidden = !ONLINE.includes(m);
    const needsRef = NEEDS_REF.includes(m);
    form.elements.reference.required = needsRef;
    $("#refField").hidden = !needsRef;
    $("#payNote").textContent = needsRef
      ? "Your pass is issued once our team confirms the payment — usually within 24 hours. You'll get it by email."
      : "Your seat is held for you. Your ticket number is emailed to you as soon as you've paid.";
    $("#submitLabel").innerHTML =
      m === "cash" ? "Register — pay in person" : manual ? "I've sent the payment" : `Pay <span data-price>${PRICE}</span> ${CUR}`;
    if (m === "d17") {
      $("#payLead").innerHTML = `Open the <b>D17</b> app and send <b>${PRICE} ${CUR}</b> to the number below. Put your full name in the note.`;
      $("#payList").innerHTML = payRow("D17 number", PAY.D17_NUMBER, true) + payRow("Account name", PAY.D17_NAME) + payRow("Amount", `${PRICE} ${CUR}`);
      $("#refLabel").textContent = "D17 transaction reference *";
    } else if (m === "transfer") {
      const b = PAY.BANK || {};
      $("#payLead").innerHTML = `Transfer <b>${PRICE} ${CUR}</b> to the account below. Write your full name as the transfer reason.`;
      $("#payList").innerHTML = payRow("Account holder", b.HOLDER) + payRow("Bank", b.NAME) + payRow("RIB", b.RIB, true) + payRow("Amount", `${PRICE} ${CUR}`);
      $("#refLabel").textContent = "Transfer reference *";
    } else if (m === "cash") {
      $("#payLead").innerHTML = `Pay <b>${PRICE} ${CUR}</b> in cash when you collect your ticket. ${esc(PAY.PICKUP || "Our team will contact you by phone to arrange where and when.")}`;
      $("#payList").innerHTML = payRow("Amount", `${PRICE} ${CUR}`);
    }
  }
  $$('[name="method"]').forEach((r) => r.addEventListener("change", () => (hideError(), updateMethod())));

  $("#payList").addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-copy]");
    if (!btn) return;
    try {
      await navigator.clipboard.writeText(btn.dataset.copy.replace(/\s+/g, ""));
      btn.textContent = "Copied";
      setTimeout(() => (btn.textContent = "Copy"), 1600);
    } catch (_) {
      /* clipboard unavailable */
    }
  });

  // Keep the form across the trip to the checkout page, so a failed payment can be retried.
  const FORM_FIELDS = ["name", "email", "phone", "profile", "organization", "source", "consent"];
  function saveForm() {
    try {
      sessionStorage.setItem(SAVED_FORM, JSON.stringify(Object.fromEntries(FORM_FIELDS.map((n) => [n, val(n)]))));
    } catch (_) {
      /* storage unavailable */
    }
  }
  function restoreForm() {
    try {
      const data = JSON.parse(sessionStorage.getItem(SAVED_FORM) || "null");
      if (!data) return false;
      FORM_FIELDS.forEach((n) => {
        const el = form.elements[n];
        if (!el) return;
        if (el instanceof RadioNodeList) {
          const r = Array.from(el).find((x) => x.value === data[n]);
          if (r) r.checked = true;
        } else if (el.type === "checkbox") el.checked = !!data[n];
        else el.value = data[n] || "";
      });
      return true;
    } catch (_) {
      return false;
    }
  }
  function clearSavedForm() {
    try {
      sessionStorage.removeItem(SAVED_FORM);
    } catch (_) {
      /* storage unavailable */
    }
  }

  // Back from Konnect / Flouci: ?order=…&result=ok|failed
  let returnOrder = null;
  function backToPayment(error) {
    restoreForm();
    go(3, { focus: false });
    showError(MESSAGES[error] || MESSAGES.unpaid);
  }
  async function confirmReturn(tries, failed) {
    $("#processingFoot").hidden = true;
    $("#processingText").innerHTML = '<span class="spinner is-dark" aria-hidden="true"></span> Confirming your payment…';
    for (let i = 0; i < tries; i++) {
      try {
        const out = await call({ action: "confirm", order: returnOrder });
        if (out && out.ok && out.status !== "processing") return await handleResult(out, false);
        if (out && !out.ok) return backToPayment(out.error);
        if (failed) return backToPayment("unpaid"); // checkout reported failure and nothing was paid
      } catch (err) {
        if (String(err && err.message) === "not-configured") break;
      }
      await new Promise((r) => setTimeout(r, 3000));
    }
    $("#processingText").textContent =
      "Your bank hasn't confirmed the payment yet. If you paid, your pass will be emailed to you as soon as it's confirmed — or check again in a minute.";
    $("#processingFoot").hidden = false;
  }
  $("#retryConfirm").addEventListener("click", () => confirmReturn(3, false));

  const params = new URLSearchParams(location.search);
  const orderParam = (params.get("order") || "").match(/^[A-Za-z0-9]+/);

  // "Open my pass" link from the confirmation email: ?order=…&view=pass
  async function openPass() {
    go("processing", { focus: false });
    $("#processingFoot").hidden = true;
    $("#processingText").innerHTML = '<span class="spinner is-dark" aria-hidden="true"></span> Opening your pass…';
    try {
      const out = await call({ action: "confirm", order: returnOrder });
      if (out && out.ok && out.ticket) return await issue(out.ticket, out.name, true);
      if (out && out.ok && out.status === "awaiting") return await handleResult(out, true);
      go("lookup", { focus: false });
      const e = (out && out.error) || "";
      showError(e === "rejected" ? MESSAGES.rejected : "We couldn't open this pass link. Enter the email you registered with to find your pass.");
    } catch (err) {
      go("lookup", { focus: false });
      showError(MESSAGES[String(err && err.message)] || "We couldn't open your pass right now. Enter your email to find it, or try again in a minute.");
    }
  }

  if (orderParam && params.get("view") === "pass") {
    returnOrder = orderParam[0];
    history.replaceState(null, "", location.pathname);
    window.scrollTo({ top: $("#flow").getBoundingClientRect().top + window.scrollY - 70 });
    openPass();
  } else if (orderParam) {
    returnOrder = orderParam[0];
    history.replaceState(null, "", location.pathname);
    go("processing", { focus: false });
    window.scrollTo({ top: $("#flow").getBoundingClientRect().top + window.scrollY - 70 });
    confirmReturn(6, params.get("result") === "failed");
  } else {
    go(1, { focus: false });
  }
  updateMethod();
})();
