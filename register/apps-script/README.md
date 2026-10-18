# Registration backend — Google Sheets + Apps Script

Registrations and payments are saved in a Google Sheet. The script:

- takes payment for the **General Pass (40 TND)** through four methods:
  - **Konnect** — bank card, e-DINAR, Konnect wallet (confirmed automatically)
  - **Flouci** — Flouci app or card (confirmed automatically)
  - **D17** — attendee sends money in the D17 app and enters the reference (confirmed by you)
  - **Bank transfer** — attendee transfers to your RIB and enters the reference (confirmed by you)
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

   Keys stay in the script, never in the website or the repo. A method with no keys is refused by the backend — remove it from `METHODS` in `../config.js` too.
5. **Deploy → New deployment** → **Web app** · Execute as **Me** · Access **Anyone** → Deploy, and authorise
   (Sheets, email, and *connect to an external service* — needed to talk to Konnect/Flouci).
6. Copy the **Web app URL** (`https://script.google.com/macros/s/…/exec`) into [`../config.js`](../config.js) as `ENDPOINT`.
7. In `../config.js` fill `PAYMENT.D17_NUMBER` / `D17_NAME` and `PAYMENT.BANK` (holder, bank, RIB).
   D17 / bank transfer only appear on the page once those are filled.
8. Commit and push.

The first registration creates the **Registrations** tab. Reload the sheet once to see the **TEDx** menu.

## Testing, then going live

- **Konnect:** `KONNECT_SANDBOX: true` uses Konnect's test environment — use your *sandbox* API key and wallet ID.
  When ready: set `KONNECT_SANDBOX: false`, swap in the production key and wallet ID, redeploy (new version).
- **Flouci:** use the keys of the **TEST APP** in your developer account (test card `4509 2111 1111 1119`, 12/26, CVV 748).
  When ready, replace them with your live app's keys. No code change.

## Daily work: confirming D17 / bank transfers

Rows paid by D17 or transfer arrive with **Status = Awaiting confirmation** and the attendee's reference in **Payment ref**.

1. Check the reference against your D17 history / bank statement.
2. Select the row(s) → **TEDx → Confirm selected payments** → ticket numbers are issued and emailed.
3. Can't find the money? **TEDx → Reject selected payments** → the attendee is emailed and can register again.

Statuses: `Unpaid` (online checkout started, not paid) · `Awaiting confirmation` · `Paid` · `Rejected`.
Only `Paid` rows have a ticket. `MAX_SEATS` counts Paid + Awaiting.

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
