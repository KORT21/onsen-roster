# Onsen Roster

A focused, phone-first roster for the Onsen team. The application is deliberately
split into two portable pieces:

1. **This repository** contains a static React website that can be hosted by any
   static host.
2. **Google Apps Script** reads the private Google Sheet under the Google account
   that owns the roster.

No personal account IDs, spreadsheet IDs, tokens, or hosting credentials belong
in the repository. That makes it safe to develop in one GitHub account and move
the project to an Onsen-owned organization later.

## What is included

- Personal **My week** screen after a staff member chooses their name.
- Complete roster with week, day, and morning/afternoon navigation.
- Ordered row model that preserves duplicate labels and unlabeled rows.
- Exact employee names, including trailing initials such as `Maria S`.
- Live data, cached offline fallback, and a sanitized demo mode.
- Installable PWA with a network-first service worker.
- Google Apps Script reader that discovers `WC d/m` tabs dynamically.
- Netlify and Vercel deployment configuration.
- TypeScript parser tests and GitHub Actions validation.

## Local development

Requirements: Node.js 22 or newer.

```bash
npm install
copy .env.example .env.local
npm run dev
```

With `VITE_ROSTER_API_URL` empty, the app uses fake demo data and is safe to
share publicly.

Before committing:

```bash
npm test
npm run build
```

## Connect the real Google roster

Follow [`google-apps-script/README.md`](google-apps-script/README.md). Once the
Apps Script web app has a final `/exec` URL, set this environment variable in
the hosting dashboard:

```text
VITE_ROSTER_API_URL=https://script.google.com/macros/s/.../exec
```

Do not put the spreadsheet ID in the frontend. It belongs in Apps Script's
`SPREADSHEET_ID` Script Property, controlled by the Onsen Google account.

## Deploy

### Netlify — recommended default

1. Import the GitHub repository into the Onsen Netlify account.
2. Netlify reads `netlify.toml`; the build is `npm run build` and output is
   `dist`.
3. Add `VITE_ROSTER_API_URL` under environment variables.
4. Deploy. A free `*.netlify.app` address is provided automatically.
5. Optionally connect a domain or subdomain Onsen already owns.

### Vercel — supported, but not the free production recommendation

1. Import the repository into the Onsen Vercel account.
2. Vercel detects Vite and reads `vercel.json`.
3. Add `VITE_ROSTER_API_URL` under environment variables.
4. Deploy. A free `*.vercel.app` address is provided automatically.
5. Optionally connect an existing Onsen domain.

Both providers can host this project. However, as checked in November 2026,
Vercel restricts its free Hobby tier to personal, non-commercial use. An
Onsen-operated staff roster should therefore use Netlify Free or a paid Vercel
plan. The host contains no roster backend, so moving between providers is simply
a new import plus the one environment variable.

> Hosting and SSL can be free. Registering a brand-new custom domain normally
> costs money; attaching a domain Onsen already owns does not require a paid
> hosting plan. A provider URL such as `onsen-roster.netlify.app` is free.

## Transfer to Onsen ownership

When the new accounts are ready:

1. Create an Onsen-owned GitHub organization or GitHub account.
2. Transfer the repository in **GitHub → Settings → General → Transfer** or push
   a mirror into a fresh Onsen-owned repository.
3. Import that repository into the Onsen-owned Netlify or Vercel account.
4. Deploy the Apps Script project from the Onsen Google account and set
   `SPREADSHEET_ID` there.
5. Add the Apps Script `/exec` URL to the host as `VITE_ROSTER_API_URL`.
6. Point the chosen domain at the new hosting project.
7. Remove the old personal deployment after the new site is verified.

Git history, issues, and pull requests can stay intact when GitHub's repository
transfer feature is used.

## Data contract

The frontend consumes versioned JSON:

```json
{
  "version": 1,
  "fetchedAt": "2026-11-03T00:00:00.000Z",
  "source": { "name": "Onsen Google Sheet" },
  "weeks": [
    {
      "id": "sheet-id",
      "label": "WC 2/11",
      "start": "2026-11-02",
      "days": [{ "date": "2026-11-02", "shortLabel": "Mon" }],
      "rows": [{ "id": "row-id", "label": "Runner 1 7:30am", "cells": ["Alex"] }]
    }
  ]
}
```

Rows remain arrays and each one has a stable sheet-row ID. Duplicate role labels
therefore cannot overwrite each other.

## Security

- Never commit `.env`, spreadsheet IDs, tokens, or account credentials.
- A public Apps Script endpoint exposes the returned roster data to anyone who
  obtains its URL, even though the spreadsheet itself remains private.
- Before a staff-wide production launch, decide whether roster privacy requires
  Google Workspace sign-in or another authentication layer.
- Keep write operations out of the public roster endpoint. This first version is
  deliberately read-only.

## License

MIT. This makes future maintenance, transfer, and modification straightforward.
