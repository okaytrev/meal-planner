# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A mobile-first weekly meal planner web app for managing GF/DF meals, selecting weekly plans, and generating grocery lists. Hosted on GitHub Pages at `mealplan.trevarhupf.com`.

## Architecture

**Frontend** (GitHub Pages): Static HTML/CSS/vanilla JS — single-page app with tab-based navigation (Meal Bank, This Week, Add Meal). No build step, no bundler, no framework.

**Backend** (Google Apps Script): `Code.gs` is deployed as a Google Apps Script Web App. It reads/writes to a Google Sheet with two tabs:
- "Meals" tab (columns: Meal Name, Ingredients, Recipe Link/Notes, Tags, Rating, Last Made)
- "WeekPlan" tab (column: Meal ID — row numbers from the Meals sheet)

**Data flow**: `script.js` calls the Apps Script URL (`WEB_APP_URL`) via fetch. GET returns all meals + week plan. POST handles three actions: `addMeal` (default), `deleteMeal`, `saveWeek`. Content-Type is `text/plain` to avoid CORS preflight.

**Meal IDs** are Google Sheet row numbers (1-indexed + header offset), meaning they shift when rows are deleted. The week plan syncs across devices through the shared sheet.

## Development

No build/lint/test commands — open `index.html` directly in a browser. To test backend changes, redeploy `Code.gs` as a new Apps Script version.

## Key Details

- CSS uses custom properties defined in `:root` for theming (green primary, orange accent)
- Dietary tags are limited to GF (Gluten-Free), DF (Dairy-Free), V (Vegan), and VG (Vegetarian) — hardcoded in `parseTags()` and filter chips
- Grocery list deduplication is case-insensitive; ingredients are comma-separated strings
- `escapeHTML()` and `escapeAttr()` in `script.js` handle XSS prevention for user content
