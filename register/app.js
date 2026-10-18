/* TEDx Thyna Youth — registration app (vanilla JS, no build step).
   Flow: 01 About you → 02 Your profile → 03 Your pass (ticket revealed only after a successful registration or lookup). */
(function () {
  "use strict";

  const CFG = window.TEDX_REGISTER || {};
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
    setProgress(step === "lookup" ? 1 : Number(step));
    $('[name="lookupEmail"]').required = step === "lookup";
    if (focus) {
      const first = $(`.step[data-step="${step}"] input:not([type=hidden]), .step[data-step="${step}"] select`);
      if (first) first.focus({ preventScroll: true });
      const top = $("#flow").getBoundingClientRect().top + window.scrollY - 70;
      if (window.scrollY > top + 40 || window.scrollY < top - window.innerHeight / 2) window.scrollTo({ top, behavior: "smooth" });
    }
  }

  $$("[data-next]").forEach((b) => b.addEventListener("click", () => validate("1") || go(2)));
  $$("[data-back]").forEach((b) => b.addEventListener("click", () => go(1, { back: true })));
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
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (val("website")) return; // bot honeypot
    if (step === "1") return validate("1") || go(2); // Enter on step 1 moves forward
    if (validate(step)) return;

    const btn = step === "lookup" ? $("#lookupBtn") : $("#submitBtn");
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
              userAgent: navigator.userAgent.slice(0, 180),
            };
      const out = await call(payload);
      if (!out || !out.ok) throw new Error((out && out.error) || "unknown");
      await issue(out.ticket, out.name, out.existing || step === "lookup");
    } catch (err) {
      const key = String(err && err.message);
      showError(MESSAGES[key] || "Something went wrong. Please check your connection and try again.");
    } finally {
      btn.disabled = false;
      btn.classList.remove("is-loading");
    }
  });

  /* ───────── step 3: the pass ───────── */

  async function issue(ticket, name, existing) {
    issued = { ticket, name };
    await draw(name, ticket);
    sheet.hidden = true;
    setProgress(3);
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

  $("#againBtn").addEventListener("click", () => {
    issued = null;
    form.reset();
    reveal.hidden = true;
    reveal.classList.remove("is-live");
    sheet.hidden = false;
    go(1);
  });

  go(1, { focus: false });
})();
