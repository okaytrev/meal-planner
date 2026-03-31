# Meal Planner

A simple, mobile-first web app for weekly meal planning and grocery list generation. Built for a couple eating primarily Gluten-Free and Dairy-Free.

## Features

- **Meal Bank** — Browse, search, and filter your saved meals by dietary tags (GF/DF)
- **Weekly Plan** — Select meals for the week from your bank
- **Grocery List** — Auto-generate a consolidated ingredient list from your weekly picks
- **Copy to Clipboard** — One tap to copy your grocery list for easy sharing
- **Add Meals** — Add new recipes directly from the app

## Tech Stack

- **Frontend:** HTML, CSS, Vanilla JavaScript (hosted on GitHub Pages)
- **Backend:** Google Sheets + Google Apps Script (Web App)

## Setup

1. Create a Google Sheet with a "Meals" tab and headers: `Meal Name | Ingredients | Recipe Link/Notes | Tags`
2. Deploy the Google Apps Script from `Code.gs` as a Web App
3. Paste your Web App URL into `script.js`
4. Enable GitHub Pages on this repo (source: main branch, root)
