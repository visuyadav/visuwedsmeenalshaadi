/**
 * SETUP
 * 1. Paste SHEET_ID below (ID or full Google Sheets URL)
 * 2. Extensions → Apps Script → replace all → Save
 * 3. Run testSendRsvpEmail once → approve Gmail permission
 * 4. Deploy → Manage deployments → Edit → New version → Deploy
 *
 * Guests receive a confirmation email at the address they enter on the form.
 */

const SHEET_ID = '1OUgh0jwbFvJuNusYFiKq7kOwggOhmt15UX9X7YEZAag';
const HEADERS = ['Timestamp', 'Name', 'Email', 'Phone', 'Guests'];

function doGet(e) {
  try {
    if (e && e.parameter && e.parameter.name) {
      return json_(appendRsvp_({
        name: e.parameter.name,
        email: e.parameter.email,
        phone: e.parameter.phone,
        guestCount: e.parameter.guestCount
      }));
    }
    const ss = openSpreadsheet_();
    return json_({
      ok: true,
      message: 'RSVP endpoint is live',
      spreadsheet: ss.getName(),
      url: ss.getUrl(),
      tab: ss.getSheets()[0].getName()
    });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function doPost(e) {
  try {
    const data = parsePayload_(e);
    return json_(appendRsvp_(data));
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  }
}

function parsePayload_(e) {
  if (e && e.postData && e.postData.contents) {
    return JSON.parse(e.postData.contents);
  }
  const p = (e && e.parameter) || {};
  return {
    name: p.name,
    email: p.email,
    phone: p.phone,
    guestCount: p.guestCount
  };
}

function resolveSheetId_(raw) {
  const s = String(raw || '').trim();
  const m = s.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (m) return m[1];
  if (/^[a-zA-Z0-9-_]+$/.test(s)) return s;
  throw new Error('SHEET_ID must be the spreadsheet ID or full Google Sheets URL');
}

function openSpreadsheet_() {
  if (!SHEET_ID || SHEET_ID === 'PASTE_SHEET_ID_HERE') {
    throw new Error('Set SHEET_ID in the Apps Script');
  }
  return SpreadsheetApp.openById(resolveSheetId_(SHEET_ID));
}

function sendRsvpEmail_(data) {
  const to = String(data.email || '').trim();
  if (!to || to.indexOf('@') < 1) {
    return { emailed: false, reason: 'guest email missing or invalid' };
  }

  const name = data.name || 'Guest';
  const phone = data.phone || '(not provided)';
  const guests = data.guestCount || '(none)';

  const sangeetDate = 'Sunday, 22 November 2026';
  const sangeetVenue = 'Mannat';
  const sangeetAddress = '4591 NJ-27, Kingston, NJ 08528';
  const sangeetMapsUrl = 'https://www.google.com/maps/search/?api=1&query=' +
    encodeURIComponent(sangeetVenue + ' ' + sangeetAddress);

  const weddingDate = 'Wednesday, 25 November 2026';
  const weddingVenue = 'Rasoi III';
  const weddingAddress = '620 Georges Rd, Monmouth Junction, NJ';
  const weddingMapsUrl = 'https://www.google.com/maps/search/?api=1&query=' +
    encodeURIComponent(weddingVenue + ' ' + weddingAddress);

  const subject = 'You\'re on the list — Visu & Meenal Wedding RSVP';
  const body =
    'Dear ' + name + ',\n\n' +
    'Thank you for your RSVP. We are so glad you will celebrate with Visu & Meenal.\n\n' +
    '—— Your RSVP ——\n' +
    'Name: ' + name + '\n' +
    'Email: ' + to + '\n' +
    'Phone: ' + phone + '\n' +
    'Number of guests: ' + guests + '\n\n' +
    '—— Sangeet ——\n' +
    'Date: ' + sangeetDate + '\n' +
    'Venue: ' + sangeetVenue + '\n' +
    'Address: ' + sangeetAddress + '\n' +
    'Map: ' + sangeetMapsUrl + '\n\n' +
    '—— Wedding ——\n' +
    'Date: ' + weddingDate + '\n' +
    'Venue: ' + weddingVenue + '\n' +
    'Address: ' + weddingAddress + '\n' +
    'Map: ' + weddingMapsUrl + '\n\n' +
    'With love,\nVisu & Meenal\n';

  const htmlBody =
    '<p>Dear <b>' + escapeHtml_(name) + '</b>,</p>' +
    '<p>Thank you for your RSVP. We are so glad you will celebrate with <b>Visu &amp; Meenal</b>.</p>' +
    '<h3>Your RSVP</h3>' +
    '<ul>' +
      '<li><b>Name:</b> ' + escapeHtml_(name) + '</li>' +
      '<li><b>Email:</b> ' + escapeHtml_(to) + '</li>' +
      '<li><b>Phone:</b> ' + escapeHtml_(phone) + '</li>' +
      '<li><b>Number of guests:</b> ' + escapeHtml_(guests) + '</li>' +
    '</ul>' +
    '<h3>Sangeet</h3>' +
    '<ul>' +
      '<li><b>Date:</b> ' + sangeetDate + '</li>' +
      '<li><b>Venue:</b> ' + sangeetVenue + '</li>' +
      '<li><b>Address:</b> <a href="' + sangeetMapsUrl + '">' + sangeetAddress + '</a></li>' +
    '</ul>' +
    '<h3>Wedding</h3>' +
    '<ul>' +
      '<li><b>Date:</b> ' + weddingDate + '</li>' +
      '<li><b>Venue:</b> ' + weddingVenue + '</li>' +
      '<li><b>Address:</b> <a href="' + weddingMapsUrl + '">' + weddingAddress + '</a></li>' +
    '</ul>' +
    '<p>With love,<br>Visu &amp; Meenal</p>';

  MailApp.sendEmail({
    to: to,
    subject: subject,
    body: body,
    htmlBody: htmlBody
  });
  return { emailed: true, to: to };
}

/**
 * Run once from the Apps Script editor (select testSendRsvpEmail → Run)
 * to approve Gmail send permission.
 */
function testSendRsvpEmail() {
  const result = sendRsvpEmail_({
    name: 'Test Guest',
    email: Session.getEffectiveUser().getEmail() || Session.getActiveUser().getEmail(),
    phone: '555-0100',
    guestCount: '2'
  });
  Logger.log(JSON.stringify(result));
  if (!result.emailed) {
    throw new Error('Email did not send: ' + JSON.stringify(result));
  }
}

function escapeHtml_(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function appendRsvp_(data) {
  const ss = openSpreadsheet_();
  const sheet = ss.getSheets()[0];
  const last = sheet.getLastRow();
  if (last === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    sheet.setFrozenRows(1);
  } else {
    const a1 = String(sheet.getRange(1, 1).getValue() || '');
    if (a1 !== 'Timestamp' && last === 0) {
      sheet.appendRow(HEADERS);
    } else if (a1 !== 'Timestamp' && last > 0 && sheet.getRange(1, 1).getValue() === '') {
      sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
      sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
    }
  }

  sheet.appendRow([
    new Date(),
    data.name || '',
    data.email || '',
    data.phone || '',
    data.guestCount || ''
  ]);

  let mail = { emailed: false };
  try {
    mail = sendRsvpEmail_(data);
  } catch (err) {
    mail = { emailed: false, error: String(err) };
  }

  // Still save the RSVP even if email fails, but report email status clearly
  return {
    ok: true,
    wrote: true,
    spreadsheet: ss.getName(),
    url: ss.getUrl(),
    tab: sheet.getName(),
    row: sheet.getLastRow(),
    email: mail,
    emailOk: !!(mail && mail.emailed)
  };
}

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
