/**
 * Google Apps Script — Meal Planner Backend
 *
 * SETUP INSTRUCTIONS:
 * 1. Create a Google Sheet with a tab named "Meals" and these headers in Row 1:
 *    A: Meal Name | B: Ingredients | C: Recipe Link/Notes | D: Tags
 * 2. Open Extensions > Apps Script, paste this code into Code.gs.
 * 3. Click Deploy > New deployment.
 *    - Type: Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 4. Copy the Web App URL and paste it into script.js as WEB_APP_URL.
 * 5. Every time you edit this script, create a NEW deployment version.
 */

const SHEET_NAME = 'Meals';

function getSheet() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
}

/* ---------- READ ---------- */
function doGet() {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  const headers = data.shift(); // remove header row

  const meals = data
    .filter(row => row[0]) // skip empty rows
    .map((row, index) => ({
      id: index + 2, // sheet row number (1-indexed + header)
      name: row[0].toString().trim(),
      ingredients: row[1].toString().trim(),
      link: row[2].toString().trim(),
      tags: row[3].toString().trim(),
    }));

  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', meals }))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ---------- WRITE ---------- */
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const { name, ingredients, link, tags } = body;

    if (!name || !ingredients) {
      return ContentService
        .createTextOutput(JSON.stringify({ status: 'error', message: 'Name and ingredients are required.' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const sheet = getSheet();
    sheet.appendRow([name.trim(), ingredients.trim(), (link || '').trim(), (tags || '').trim()]);

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok', message: 'Meal added.' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
