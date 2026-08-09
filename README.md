# Visu & Meenal — Wedding RSVP

Single-page wedding invitation with an RSVP form that saves responses to Google Sheets and emails a confirmation to the guest.

## Project layout

```
WeddingRSVP/
├── index.html                 # Invitation site + RSVP form
├── rsvp-google-apps-script.gs # Backend for Sheets + guest email
├── wedding images/            # All media referenced by the page
└── README.md
```

Keep the folder name exactly as `wedding images` (with the space). Paths in `index.html` use `wedding%20images/...`.

### Media used by the page

| File | Role |
|------|------|
| `ganesh.jpg`, `shiv.jpg` | Floating background art |
| `diya_left.jpg`, `diya_right.jpg` | Blessing / diya section |
| `entrance.jpg` | Entrance / welcome visual |
| `emoji_sangeet.png`, `emoji_wedding.png` | Timeline icons |
| `bells.png`, `bells-right.png` | Sangeet section accents |
| `sangeet.png` | Sangeet venue image |
| `garland.png`, `garland-right.png` | Wedding section accents |
| `mandap.png` | Mandap visual |
| `rasoi-mark.png` | Venue mark |
| `background_music.m4a` | Looping background audio |

Other files in the folder (backups, unused variants) are optional.

---

## 1. Preview the site locally

Serve the project folder over HTTP (file:// can break audio / fetch). From this directory:

```bash
python3 -m http.server 8765
```

Open [http://localhost:8765](http://localhost:8765).

For the RSVP form to save responses, complete the Google Apps Script setup below and keep `RSVP_WEB_APP_URL` set in `index.html`.

---

## 2. Google Sheet (RSVP storage)

1. Create a Google Spreadsheet (or reuse an existing one).
2. Copy the spreadsheet **ID** from the URL:

   `https://docs.google.com/spreadsheets/d/`**`SHEET_ID_HERE`**`/edit`

3. You do not need to create headers by hand. On the first successful RSVP, the script writes:

   `Timestamp | Name | Email | Phone | Guests`

   on the **first sheet** (tab) in the workbook.

Share the sheet with the Google account that will own the Apps Script (Editor access), if they are different accounts.

---

## 3. Google Apps Script backend

File: `rsvp-google-apps-script.gs`

### Paste and configure

1. Open the spreadsheet → **Extensions → Apps Script**.
2. Delete any default code and paste the full contents of `rsvp-google-apps-script.gs`.
3. Set `SHEET_ID` near the top to your spreadsheet ID or full Sheets URL:

   ```javascript
   const SHEET_ID = 'PASTE_SHEET_ID_OR_URL_HERE';
   ```

4. Save the project.

### Approve Gmail (guest confirmation emails)

1. In the Apps Script editor, select function `testSendRsvpEmail`.
2. Click **Run**.
3. Approve the requested permissions (Sheets + Gmail send).
4. Confirm you received the test email.

Guests get a confirmation at the email they enter on the form. RSVPs are still saved to the sheet even if email send fails.

### Deploy as a web app

1. **Deploy → New deployment** (or **Manage deployments → Edit → New version**).
2. Type: **Web app**.
3. Settings:
   - **Execute as:** Me
   - **Who has access:** Anyone
4. Deploy and copy the **Web app URL**  
   (`https://script.google.com/macros/s/.../exec`).

After any future script change, create a **new version** and deploy again so the live URL picks up the update.

### Quick health check

Open the web app URL in a browser. You should see JSON like:

```json
{ "ok": true, "message": "RSVP endpoint is live", ... }
```

---

## 4. Connect the site to the script

In `index.html`, find:

```javascript
const RSVP_WEB_APP_URL = 'https://script.google.com/macros/s/.../exec';
```

Paste your deployed web app URL there. If this is empty, the form shows a “not connected” message and does not save RSVPs.

The form submits name, email, phone, and guest count (1–9) to the script. The script appends a row to the sheet and emails the guest.

---

## 5. Host the site

Upload the whole project so relative paths stay intact:

- `index.html`
- `wedding images/` (entire folder, same name)
- Optionally keep `rsvp-google-apps-script.gs` in the repo for reference; it is not needed on the static host.

Examples: GitHub Pages, Netlify, Cloudflare Pages, or any static file host. Point the site root at this folder so `/` serves `index.html` and `/wedding%20images/...` resolves.

---

## RSVP flow (summary)

```
Guest fills form in index.html
        ↓
GET/POST to Google Apps Script web app
        ↓
Row written to Google Sheet
        ↓
Confirmation email sent to guest (MailApp)
```

## Troubleshooting

| Issue | What to check |
|-------|----------------|
| Images or music missing | Folder must be named `wedding images` next to `index.html` |
| “RSVP storage is not connected” | `RSVP_WEB_APP_URL` in `index.html` |
| Sheet not updating | `SHEET_ID`, first tab exists, redeployed latest script version |
| No confirmation email | Run `testSendRsvpEmail` and re-approve Gmail; guest email must be valid |
| CORS / network errors | Redeploy with **Anyone** access; test the `/exec` URL in a browser first |
| Local preview quirks | Use `python3 -m http.server`, not opening the HTML file directly |

## Customize

- Event dates, venues, and email copy: edit `sendRsvpEmail_` in `rsvp-google-apps-script.gs`, and matching text in `index.html`.
- Look and layout: CSS and markup in `index.html`.
- Assets: replace files in `wedding images/` using the same filenames, or update `src` paths in `index.html`.
