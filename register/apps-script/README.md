# Registration backend — Google Sheets + Apps Script

Registrations and payments are saved in a Google Sheet. The script:

- takes payment for the **General Pass (40 TND)** through four methods:
  - **Konnect** — bank card, e-DINAR, Konnect wallet (confirmed automatically)
  - **Flouci** — Flouci app or card (confirmed automatically)
  - **ClicToPay** — Tunisian & international bank cards via SMT (confirmed automatically)
  - **D17** — attendee sends money in the D17 app and enters the reference (confirmed by you)
  - **Bank transfer** — attendee transfers to your RIB and enters the reference (confirmed by you)
  - **Pay in person** — attendee pays cash when collecting the ticket (confirmed by you)
- issues ticket numbers (`TY2026 - 0001`, …) **only once the pass is paid**,
- blocks duplicates by email (paying twice is impossible; an unpaid attempt is reused),
- emails the attendee at each step.

## Setup (≈15 minutes)

1. Create a Google Sheet, e.g. **TEDx Thyna Youth 2026 — Registrations**.
2. **Extensions → Apps Script**, replace `Code.gs` with [`Code.gs`](./Code.gs). Save.
3. Edit `SETTINGS` at the top if needed (`PRICE_TND`, `MAX_SEATS`, `REPLY_TO`, `KONNECT_SANDBOX`).
4. **Project Settings (⚙) → Script properties → Add**, one per key you use:

   | Property | Where to find it |
   |---|---|
   | `KONNECT_API_KEY` | Konnect dashboard → Integration / API keys |
   | `KONNECT_WALLET_ID` | Konnect dashboard → your wallet ID |
   | `FLOUCI_PUBLIC_KEY` | Flouci developer portal → your app → public key |
   | `FLOUCI_PRIVATE_KEY` | Flouci developer portal → your app → private key |
   | `CLICTOPAY_USERNAME` | API user sent by SMT when your ClicToPay merchant account is opened (via your bank) |
   | `CLICTOPAY_PASSWORD` | Password of that API user |
   | `CLICTOPAY_LIVE_URL` | Optional — only if SMT gives a live REST address other than `https://ipay.clictopay.com/payment/rest/` |

   Keys stay in the script, never in the website or the repo. A method with no keys is refused by the backend — remove it from `METHODS` in `../config.js` too.
5. **Deploy → New deployment** → **Web app** · Execute as **Me** · Access **Anyone** → Deploy, and authorise
   (Sheets, email, and *connect to an external service* — needed to talk to Konnect/Flouci).
6. Copy the **Web app URL** (`https://script.google.com/macros/s/…/exec`) into [`../config.js`](../config.js) as `ENDPOINT`.
7. In `../config.js` fill `PAYMENT.D17_NUMBER` / `D17_NAME` and `PAYMENT.BANK` (holder, bank, RIB).
   D17 / bank transfer only appear on the page once those are filled.
8. Commit and push.

The first registration creates the **Registrations** tab. Reload the sheet once to see the **TEDx** menu.

## Sending emails from a TEDx Thyna address

Emails are sent by the Google account that **deployed** the script (shown as "TEDx Thyna Youth").
Replies always go to `REPLY_TO`. To send from a TEDx Thyna address, pick one:

**A — Deploy from the TEDx Thyna Google account (recommended).**
1. Share the sheet with the TEDx Thyna Google account as *Editor*.
2. Sign in to Google **as that account**, open the sheet → Extensions → Apps Script.
3. Deploy → New deployment → Web app, *Execute as: Me*, *Who has access: Anyone* → authorise.
4. Put the new `/exec` URL in `../config.js` (`ENDPOINT`). Emails now come from that account.

**B — Keep your account, send "as" the TEDx address.**
1. In the Gmail of the account that deployed the script: Settings → Accounts → *Send mail as* →
   add the TEDx Thyna address and confirm it.
2. Set `FROM_EMAIL` in `SETTINGS` to that address, save, Deploy → Manage deployments → ✏️ → New version.

## Testing, then going live

- **Konnect:** `KONNECT_SANDBOX: true` uses Konnect's test environment — use your *sandbox* API key and wallet ID.
  When ready: set `KONNECT_SANDBOX: false`, swap in the production key and wallet ID, redeploy (new version).
- **ClicToPay:** `CLICTOPAY_TEST: true` uses `test.clictopay.com` with the test credentials SMT gives you.
  When SMT activates your live account: set `CLICTOPAY_TEST: false`, swap in the live user/password, redeploy.
  ClicToPay has no webhook here — the pass is issued when the attendee returns, or when they use **Find my pass**.
- **Flouci:** use the keys of the **TEST APP** in your developer account (test card `4509 2111 1111 1119`, 12/26, CVV 748).
  When ready, replace them with your live app's keys. No code change.

## Daily work: confirming payments (D17 · bank transfer · pay in person)

Every new registration arrives as a row with **Status = Awaiting confirmation** (highlighted yellow).
The **Method** column says how they're paying; for D17 / transfer, **Payment ref** holds the reference they typed.

1. **Check the money arrived**
   - **D17:** open the D17 app → history. Find a 40 TND payment matching the **Payment ref** (or the name / phone).
   - **Bank transfer:** check your UIB account (app or statement) for 40 TND with that reference or the attendee's name.
     Transfers between banks can take 1–2 working days.
   - **Pay in person:** call the attendee (Phone column), meet, collect 40 TND cash.
2. **Confirm:** change that row's **Status** to **Paid** (dropdown). The ticket number is filled in, the row turns green
   and the attendee gets their pass by email within a few seconds. Works in the Google Sheets phone app too.
   On a computer you can also select several rows → **TEDx → Confirm selected payments**.
3. **Money not found?** Set **Status** to **Rejected** (turns red). The attendee is emailed and can register again
   with the same email.
4. **Confirmed by mistake?** Change a **Paid** row to **Rejected**: the attendee gets a "pass cancelled" email and the
   pass stops opening on the site. Set it back to **Paid** and the **same ticket number** is restored and emailed again.

The confirmation email has an **Open & download my pass** button that opens the attendee's official pass (same design
as on the site) ready to download.

The dropdown, colours and automatic emails switch on by themselves after the first registration. If the dropdown is
missing, open the sheet on a computer → **TEDx → Set up Status dropdown (run once)**.

Statuses: `Awaiting confirmation` · `Paid` · `Rejected` (`Unpaid` is only used by online card payments).
Only `Paid` rows have a ticket. Never type a ticket number by hand — set Status to Paid and let the script number it.
`MAX_SEATS` counts Paid + Awaiting.

## How online payment is confirmed

The page sends the attendee to the Konnect/Flouci checkout, which returns them to
`register.tedxthyna.com/?order=…`; the page then asks the script to verify the payment with the provider.
The provider also calls the script directly (webhook), so a pass is still issued if the attendee closes the
tab after paying — they get it by email and with **Find my pass**. The script always re-checks the payment
and the amount with the provider's API; it never trusts the redirect alone.

## Updating the script later

**Deploy → Manage deployments → ✏️ → Version: New version → Deploy.** The URL stays the same.

## On event day

Filter the sheet by **Status = Paid**, search by ticket number or name, and fill **Checked in** at the door.

## Limits

Gmail allows ~100 emails/day on a free account (1,500 on Workspace). If the quota is reached the
registration and payment are still saved; only the email is skipped.
Provider fees: `addPaymentFeesToAmount` is off, so Konnect/Flouci fees are taken from the 40 TND you receive.
