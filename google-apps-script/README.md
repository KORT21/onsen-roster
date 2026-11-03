# Google roster service

This small Google Apps Script turns the roster spreadsheet into the stable JSON
format used by the website. It should be created and deployed from the Google
account that Onsen controls.

## Set it up

1. Sign in to the Onsen Google account and open
   [script.google.com](https://script.google.com/).
2. Create a standalone project named **Onsen Roster Service**.
3. Replace the editor contents with `Code.gs` and copy the settings from
   `appsscript.json`.
4. Open **Project Settings → Script properties** and add:
   `SPREADSHEET_ID` = the ID from the roster spreadsheet URL.
5. Choose **Deploy → New deployment → Web app**.
6. Execute as the Onsen account. Select the access level appropriate for the
   intended audience. The current frontend expects an endpoint it can request
   without an interactive Google sign-in.
7. Copy the final `/exec` URL into `VITE_ROSTER_API_URL` in Netlify or Vercel.

The spreadsheet ID is configuration, not source code. It never needs to be
committed to GitHub. The service automatically discovers every sheet tab named
`WC d/m`, preserves duplicate and unlabeled rows, and uses the actual underlying
date cells when available, so a mistyped tab name does not shift the week.

## Privacy note

An Apps Script web app available to anyone with its URL does not make the source
spreadsheet public, but its returned roster data is still accessible to anyone
who has the service URL. Add an authentication layer before launch if the roster
must be restricted to staff accounts.

