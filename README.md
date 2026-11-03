# Onsen Roster

A reliable, read-only staff roster with the same visual language as the public
[Onsen website](https://www.onsen.co.nz/). It is phone-first, comfortable on
desktop, installable as a PWA, and designed to move from a personal GitHub
account to an Onsen-owned account without rewriting the application.

## What it does

- Downloads the permanent public Google Sheet as an XLSX workbook on the server.
- Finds roster tabs by their contents, not by fragile tab names.
- Infers dates from weekday headings and compact names such as `WC 2610`.
- Preserves duplicate roles, blank-label notes, training markers, and row order.
- Provides a personal week plus the complete morning/afternoon roster.
- Keeps the last successful roster in the browser for an offline fallback.
- Uses sanitized demo data only when live and saved data are unavailable.

The source spreadsheet is public and its link is expected to remain stable, so
this version needs no Google login, API key, Apps Script, or owner-account access.

## Architecture

```text
Public Google Sheet
        ↓ XLSX export
Serverless /api/roster function
        ↓ resilient workbook normalizer
Versioned JSON response
        ↓
React roster + saved offline copy
```

`server/roster-core.mjs` contains the provider-neutral reader. The thin files in
`netlify/functions/` and `api/` adapt it to Netlify and Vercel, keeping the data
logic portable if hosting changes later.

## Local development

Requirements: Node.js 22 or newer.

```bash
npm install
copy .env.example .env.local
npm run dev
```

The example environment uses safe demo data because Vite alone does not run the
serverless function. Remove the override when testing through a Netlify or
Vercel local runtime.

```bash
npm test
npm run build
npm run test:live
```

`test:live` downloads the current workbook and prints every recognized week
with parser diagnostics. Run it after spreadsheet layout changes.

## Production deployment

### Netlify — recommended

1. Import this repository into an Onsen-owned Netlify account.
2. Netlify reads `netlify.toml`, builds the app, and deploys the roster function.
3. Deploy; no environment variables or Google credentials are required.
4. Keep the free `*.netlify.app` address or attach an Onsen-owned domain.

Netlify is the practical free production default. Vercel is also configured,
but its free Hobby plan is intended for personal, non-commercial projects.

A provider address is free. A new custom domain normally costs money; connecting
a domain Onsen already owns does not require paid hosting.

## Transfer to Onsen ownership

1. Create or choose the Onsen GitHub account or organization.
2. Transfer the repository in GitHub settings, or push it into a new Onsen repo.
3. Import that repository into the Onsen Netlify account.
4. Attach the chosen Onsen domain or subdomain.
5. Verify the live roster, then remove any personal-account deployment.

The public sheet ID is intentionally in the server code because the sheet itself
is public and its permanent link is the app's data source. If the sheet becomes
private, replace the fetch layer with authenticated Google access; the frontend
contract does not need to change.

## Workbook tolerance

The normalizer accepts the variations already present in the live workbook:

- changing and compact week-tab names;
- month boundaries such as `October/November`;
- unlabeled operational notes and duplicate role labels;
- stray backticks and inconsistent whitespace;
- training, start/finish, and driver notes inside cells;
- placeholders such as `to fill`, `Spa Side`, and `no driver needed`.

It rejects tabs without a seven-day heading and at least five recognizable
roster roles, reducing the chance of publishing a notes or archive tab.

## Data contract

`/api/roster` returns versioned JSON. Rows keep a stable sheet-row ID and remain
ordered arrays so duplicate labels cannot overwrite each other.

```json
{
  "version": 1,
  "fetchedAt": "2026-11-03T00:00:00.000Z",
  "source": { "name": "Onsen public Google Sheet" },
  "weeks": [{
    "id": "sheet-id",
    "label": "WC 211",
    "start": "2026-11-02",
    "days": [{ "date": "2026-11-02", "shortLabel": "Mon" }],
    "rows": [{ "id": "sheet-id-r12", "kind": "role", "label": "Runner 1", "cells": ["Alex"] }]
  }]
}
```

## Security and scope

- The app is read-only and never writes to the spreadsheet.
- Do not put private credentials or account tokens in the repository.
- Roster data is currently public because the source spreadsheet is public.
- Authentication can be added later if Onsen makes the sheet private.
- Feature upgrades are deferred until this reliable baseline is checked by staff.

## License

MIT, so future Onsen maintainers can transfer and modify it freely.
