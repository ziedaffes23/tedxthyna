/**
 * TEDx Thyna Youth — registration settings.
 *
 * ENDPOINT: the Google Apps Script "Web app" URL that stores registrations
 * in your Google Sheet, handles payments and issues ticket numbers.
 * See apps-script/README.md. It looks like: https://script.google.com/macros/s/AKfy.../exec
 */
window.TEDX_REGISTER = {
  ENDPOINT: "",
  TICKET_PREFIX: "TY2026",
  EVENT_TITLE: "TEDx Thyna Youth 2026 — Break The Pattern",
  EVENT_START: "20261115T100000",
  EVENT_END: "20261115T200000",
  EVENT_TZ: "Africa/Tunis",
  EVENT_LOCATION: "Complexe Culturel Mohamed Jamoussi, Rue Ibn Al Jazzar, Sfax 3079, Tunisia",

  /**
   * Payment. PRICE is what the page shows — the amount actually charged is
   * PRICE_TND in apps-script/Code.gs, keep both equal.
   * METHODS: remove any you don't want to offer. D17 is only shown when
   * D17_NUMBER is filled, bank transfer only when BANK.RIB is filled.
   */
  PAYMENT: {
    PRICE: 40,
    CURRENCY: "TND",
    METHODS: ["konnect", "flouci", "clictopay", "d17", "transfer"],
    D17_NUMBER: "+216 93 072 842", // phone number linked to your D17 account, e.g. "+216 XX XXX XXX"
    D17_NAME: "", // name shown in D17 for that account
    BANK: {
      HOLDER: "", // account holder, e.g. "Association …"
      NAME: "UIB", // bank name, e.g. "BIAT — Agence Sfax"
      RIB: "12 068 0000093007970 28", // 20-digit RIB
    },
  },
};
