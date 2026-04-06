/**
 * Google Apps Script — Meal Planner Backend
 *
 * SETUP INSTRUCTIONS:
 * 1. Create a Google Sheet with:
 *    - A tab named "Meals" with headers: A: Meal Name | B: Ingredients | C: Recipe Link/Notes | D: Tags
 *    - A tab named "WeekPlan" with header: A: Meal ID
 * 2. Open Extensions > Apps Script, paste this code into Code.gs.
 * 3. Click Deploy > New deployment.
 *    - Type: Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 4. Copy the Web App URL and paste it into script.js as WEB_APP_URL.
 * 5. Every time you edit this script, create a NEW deployment version.
 */

const SHEET_NAME = 'Meals';
const WEEK_SHEET_NAME = 'WeekPlan';
const EXTRA_SHEET_NAME = 'ExtraItems';

function getSheet() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
}

function getWeekSheet() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(WEEK_SHEET_NAME);
}

function getExtraSheet() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(EXTRA_SHEET_NAME);
}

/* ---------- READ ---------- */
function doGet() {
  // Meals
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  data.shift(); // remove header row

  const meals = data
    .filter(row => row[0]) // skip empty rows
    .map((row, index) => ({
      id: index + 2, // sheet row number (1-indexed + header)
      name: row[0].toString().trim(),
      ingredients: row[1].toString().trim(),
      link: row[2].toString().trim(),
      tags: row[3].toString().trim(),
    }));

  // Week plan
  const weekSheet = getWeekSheet();
  const weekData = weekSheet.getDataRange().getValues();
  weekData.shift(); // remove header
  const weekPlan = weekData
    .filter(row => row[0])
    .map(row => Number(row[0]));

  // Extra items
  const extraSheet = getExtraSheet();
  let extraItems = [];
  if (extraSheet) {
    const extraData = extraSheet.getDataRange().getValues();
    extraData.shift(); // remove header
    extraItems = extraData.filter(row => row[0]).map(row => row[0].toString().trim());
  }

  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', meals, weekPlan, extraItems }))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ---------- WRITE ---------- */
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const action = body.action || 'addMeal';

    if (action === 'saveWeek') {
      return saveWeekPlan(body.weekPlan || []);
    }

    if (action === 'saveExtraItems') {
      return saveExtraItemsList(body.items || []);
    }

    if (action === 'deleteMeal') {
      return deleteMeal(body.id);
    }

    return addMeal(body);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function addMeal({ name, ingredients, link, tags }) {
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
}

function deleteMeal(id) {
  if (!id) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: 'Meal ID is required.' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const sheet = getSheet();
  sheet.deleteRow(Number(id));

  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', message: 'Meal deleted.' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function saveExtraItemsList(items) {
  const sheet = getExtraSheet();
  if (!sheet) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: 'ExtraItems sheet not found. Create a tab named "ExtraItems" with header "Item" in A1.' }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, 1).clearContent();
  }
  items.forEach(item => sheet.appendRow([item]));
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', message: 'Extra items saved.' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function saveWeekPlan(ids) {
  const sheet = getWeekSheet();
  // Clear existing data (keep header)
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, 1).clearContent();
  }
  // Write new IDs
  ids.forEach(id => sheet.appendRow([id]));

  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok', message: 'Week plan saved.' }))
    .setMimeType(ContentService.MimeType.JSON);
}
