# Meal Planner

A simple, mobile-first web app for weekly meal planning and grocery list generation. Built for a couple eating primarily Gluten-Free and Dairy-Free.

## Features

- **Meal Bank** — Browse, search, and filter your saved meals by dietary tags (GF/DF)
- **Weekly Plan** — Select meals for the week, synced across devices
- **Grocery List** — Auto-generate a consolidated, categorized ingredient list from your weekly picks
- **Extra Items** — Add one-off grocery items that aren't tied to a meal
- **Add Meals** — Add new recipes directly from the app

## Tech Stack

- **Frontend:** HTML, CSS, Vanilla JavaScript — hosted on GitHub Pages (no build step)
- **Backend:** Google Sheets + Google Apps Script Web App

---

## Setup

### 1. Create the Google Sheet

1. Go to [Google Sheets](https://sheets.google.com) and create a new spreadsheet.
2. Create three tabs with these exact names and headers:

   **Meals** tab — headers in row 1:
   | A: Meal Name | B: Ingredients | C: Recipe Link/Notes | D: Tags |
   |---|---|---|---|

   **WeekPlan** tab — header in row 1:
   | A: Meal ID |
   |---|

   **ExtraItems** tab — header in row 1:
   | A: Item |
   |---|

   > Ingredients should be comma-separated (e.g. `chicken breast, olive oil, garlic, lemon`).  
   > Tags are space-separated: `GF`, `DF`, or `GF DF`.

### 2. Set up the Apps Script backend

1. In your Google Sheet, go to **Extensions > Apps Script**.
2. Delete any existing code and paste in the contents of [`Code.gs`](Code.gs) from this repo.
3. Click **Deploy > New deployment**.
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Click **Deploy** and authorize the permissions when prompted.
5. Copy the **Web App URL** — it will look like:  
   `https://script.google.com/macros/s/XXXXXXXXXX/exec`

> **Note:** Every time you edit `Code.gs`, you must create a **new deployment version** (Deploy > Manage deployments > New version) for changes to take effect.

### 3. Configure the frontend

1. Fork this repo (or clone it).
2. Open `script.js` and replace the `WEB_APP_URL` value at the top of the file with your Web App URL from the previous step:
   ```js
   const WEB_APP_URL = 'https://script.google.com/macros/s/YOUR_URL_HERE/exec';
   ```

### 4. Enable GitHub Pages

1. In your forked repo, go to **Settings > Pages**.
2. Set source to **Deploy from a branch**, branch: `main`, folder: `/ (root)`.
3. Save — your app will be live at `https://<your-username>.github.io/<repo-name>`.

Optionally, add a `CNAME` file with a custom domain if you have one pointed at GitHub Pages.

---

## Usage tips

- Ingredients are deduplicated case-insensitively when generating the grocery list.
- The weekly plan and extra items sync across devices via the Google Sheet.
- Meal IDs are Google Sheet row numbers — if you manually delete rows in the sheet, re-save your week plan from the app to avoid stale references.
