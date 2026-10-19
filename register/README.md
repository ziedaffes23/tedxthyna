# register.tedxthyna.com

Standalone registration site for TEDx Thyna Youth 2026. Plain HTML/CSS/JS — no build step.

- General Pass at 40 TND — pay by D17, bank transfer or in person (card payments ready in the code for later)
- Ticket drawn on the official General Pass design, issued once the payment is confirmed
- Sequential ticket numbers + duplicate protection (Google Sheets backend)
- Download the pass as PNG, share it, add the event to a calendar
- "I already registered" mode to recover a pass by email

## Deploy on Vercel

1. Vercel → **Add New… → Project** → import `ziedaffes23/tedxthyna`.
2. **Root Directory:** `register` · **Framework Preset:** Other · leave Build/Output empty.
3. Deploy, then **Settings → Domains → Add** `register.tedxthyna.com`
   and create the DNS record Vercel shows (CNAME `register` → `cname.vercel-dns.com`).

## Connect the backend

Follow [`apps-script/README.md`](./apps-script/README.md), then set `ENDPOINT` and the
D17 / bank details under `PAYMENT` in [`config.js`](./config.js).
Until `ENDPOINT` is set, the form shows "Registration is being set up".

## Local preview

```bash
npx serve register
```
