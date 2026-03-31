/* ========================================================
   Meal Planner — Frontend Logic
   ======================================================== */

// TODO: Replace with your deployed Google Apps Script Web App URL
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwVaqs8KNz_GVfawBCIJn50BvXuEunV-aHhbtVOACgo41l9yLdRfzPmJKSu-tw16pg3/exec';

/* ---------- State ---------- */
let allMeals = [];           // full list from the sheet
let weekMeals = [];          // ids selected for the week (persisted in localStorage)
let activeFilter = 'all';
let searchQuery = '';

const STORAGE_KEY = 'mealplanner_week';

/* ---------- DOM refs ---------- */
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const mealListEl       = $('#meal-list');
const bankEmptyEl      = $('#bank-empty');
const bankLoaderEl     = $('#bank-loader');
const weekListEl       = $('#week-list');
const weekEmptyEl      = $('#week-empty');
const grocerySectionEl = $('#grocery-section');
const groceryListEl    = $('#grocery-list');
const btnGenerate      = $('#btn-generate');
const btnClearWeek     = $('#btn-clear-week');
const btnCopy          = $('#btn-copy');
const searchInput      = $('#search-input');
const addForm          = $('#add-form');
const formStatus       = $('#form-status');
const toastEl          = $('#toast');

/* ========================================================
   INIT
   ======================================================== */
document.addEventListener('DOMContentLoaded', () => {
  loadWeekFromStorage();
  bindTabs();
  bindFilters();
  bindSearch();
  bindAddForm();
  bindWeekActions();
  fetchMeals();
});

/* ========================================================
   TABS
   ======================================================== */
function bindTabs() {
  $$('.tab').forEach(btn => {
    btn.addEventListener('click', () => {
      $$('.tab').forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');

      $$('.panel').forEach(p => { p.classList.remove('active'); p.classList.add('hidden'); });
      const panel = $(`#panel-${btn.dataset.tab}`);
      panel.classList.remove('hidden');
      panel.classList.add('active');

      // Re-render the week panel when switching to it
      if (btn.dataset.tab === 'week') renderWeek();
    });
  });
}

/* ========================================================
   FETCH MEALS (GET)
   ======================================================== */
async function fetchMeals() {
  bankLoaderEl.classList.remove('hidden');
  bankEmptyEl.classList.add('hidden');
  mealListEl.innerHTML = '';

  try {
    const res = await fetch(WEB_APP_URL);
    const data = await res.json();
    allMeals = data.meals || [];
  } catch (err) {
    console.error('Failed to load meals:', err);
    allMeals = [];
  }

  bankLoaderEl.classList.add('hidden');
  renderBank();
}

/* ========================================================
   RENDER — MEAL BANK
   ======================================================== */
function renderBank() {
  const filtered = allMeals.filter(meal => {
    const matchesFilter = activeFilter === 'all' || meal.tags.toUpperCase().includes(activeFilter);
    const matchesSearch = !searchQuery || meal.name.toLowerCase().includes(searchQuery);
    return matchesFilter && matchesSearch;
  });

  mealListEl.innerHTML = '';

  if (filtered.length === 0) {
    bankEmptyEl.classList.remove('hidden');
    return;
  }
  bankEmptyEl.classList.add('hidden');

  filtered.forEach(meal => {
    mealListEl.appendChild(createBankCard(meal));
  });
}

function createBankCard(meal) {
  const card = document.createElement('div');
  card.className = 'meal-card' + (weekMeals.includes(meal.id) ? ' selected' : '');

  const tags = parseTags(meal.tags);
  const tagHTML = tags.map(t => `<span class="tag tag-${t.toLowerCase()}">${t}</span>`).join('');

  const linkHTML = meal.link
    ? `<a class="card-link" href="${escapeAttr(meal.link)}" target="_blank" rel="noopener">View Recipe</a>`
    : '<span></span>';

  const isAdded = weekMeals.includes(meal.id);

  card.innerHTML = `
    <div class="card-header">
      <span class="card-name" title="${escapeAttr(meal.name)}">${escapeHTML(meal.name)}</span>
      <div class="card-tags">${tagHTML}</div>
    </div>
    <p class="card-ingredients">${escapeHTML(meal.ingredients)}</p>
    <div class="card-footer">
      ${linkHTML}
      <button class="btn-select ${isAdded ? 'added' : ''}" data-id="${meal.id}">
        ${isAdded ? 'Added' : '+ Add'}
      </button>
    </div>
  `;

  card.querySelector('.btn-select').addEventListener('click', () => toggleWeekMeal(meal.id));
  return card;
}

/* ========================================================
   RENDER — THIS WEEK
   ======================================================== */
function renderWeek() {
  const selected = allMeals.filter(m => weekMeals.includes(m.id));
  weekListEl.innerHTML = '';

  if (selected.length === 0) {
    weekEmptyEl.classList.remove('hidden');
    btnGenerate.classList.add('hidden');
    btnClearWeek.classList.add('hidden');
    grocerySectionEl.classList.add('hidden');
    return;
  }

  weekEmptyEl.classList.add('hidden');
  btnGenerate.classList.remove('hidden');
  btnClearWeek.classList.remove('hidden');

  selected.forEach(meal => {
    weekListEl.appendChild(createWeekCard(meal));
  });
}

function createWeekCard(meal) {
  const card = document.createElement('div');
  card.className = 'meal-card';

  const tags = parseTags(meal.tags);
  const tagHTML = tags.map(t => `<span class="tag tag-${t.toLowerCase()}">${t}</span>`).join('');

  card.innerHTML = `
    <div class="card-header">
      <span class="card-name" title="${escapeAttr(meal.name)}">${escapeHTML(meal.name)}</span>
      <div class="card-tags">${tagHTML}</div>
    </div>
    <p class="card-ingredients">${escapeHTML(meal.ingredients)}</p>
    <div class="card-footer">
      <span></span>
      <button class="btn-remove" data-id="${meal.id}">Remove</button>
    </div>
  `;

  card.querySelector('.btn-remove').addEventListener('click', () => {
    toggleWeekMeal(meal.id);
    renderWeek();
  });
  return card;
}

/* ========================================================
   WEEK SELECTION LOGIC
   ======================================================== */
function toggleWeekMeal(id) {
  const idx = weekMeals.indexOf(id);
  if (idx > -1) {
    weekMeals.splice(idx, 1);
  } else {
    weekMeals.push(id);
  }
  saveWeekToStorage();
  renderBank();   // update "Added" state
  grocerySectionEl.classList.add('hidden'); // hide stale list
}

function loadWeekFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    weekMeals = raw ? JSON.parse(raw) : [];
  } catch { weekMeals = []; }
}

function saveWeekToStorage() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(weekMeals));
}

/* ========================================================
   GROCERY LIST GENERATOR
   ======================================================== */
function bindWeekActions() {
  btnGenerate.addEventListener('click', generateGroceryList);
  btnClearWeek.addEventListener('click', () => {
    weekMeals = [];
    saveWeekToStorage();
    renderWeek();
    renderBank();
    toast('Week cleared');
  });
  btnCopy.addEventListener('click', copyGroceryList);
}

function generateGroceryList() {
  const selected = allMeals.filter(m => weekMeals.includes(m.id));
  const map = new Map(); // lowercase ingredient -> display name

  selected.forEach(meal => {
    meal.ingredients.split(',').forEach(raw => {
      const trimmed = raw.trim();
      if (!trimmed) return;
      const key = trimmed.toLowerCase();
      if (!map.has(key)) map.set(key, trimmed);
    });
  });

  const items = [...map.values()].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

  groceryListEl.innerHTML = '';
  items.forEach(item => {
    const li = document.createElement('li');
    li.textContent = item;
    groceryListEl.appendChild(li);
  });

  grocerySectionEl.classList.remove('hidden');
  grocerySectionEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function copyGroceryList() {
  const items = [...groceryListEl.querySelectorAll('li')].map(li => `- ${li.textContent}`);
  const text = items.join('\n');

  try {
    await navigator.clipboard.writeText(text);
    toast('Copied to clipboard!');
  } catch {
    // Fallback
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
    toast('Copied to clipboard!');
  }
}

/* ========================================================
   FILTERS & SEARCH
   ======================================================== */
function bindFilters() {
  $$('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      $$('.chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      activeFilter = chip.dataset.filter;
      renderBank();
    });
  });
}

function bindSearch() {
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.trim().toLowerCase();
    renderBank();
  });
}

/* ========================================================
   ADD MEAL (POST)
   ======================================================== */
function bindAddForm() {
  addForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = $('#btn-submit');
    btn.disabled = true;
    btn.textContent = 'Saving...';
    formStatus.classList.add('hidden');

    const name = $('#input-name').value.trim();
    const ingredients = $('#input-ingredients').value.trim();
    const link = $('#input-link').value.trim();
    const tags = [...$$('.tag-fieldset input:checked')].map(cb => cb.value).join(', ');

    try {
      const res = await fetch(WEB_APP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' }, // plain to avoid CORS preflight
        body: JSON.stringify({ name, ingredients, link, tags }),
      });
      const data = await res.json();

      if (data.status === 'ok') {
        showFormStatus('Meal added! Refreshing...', 'success');
        addForm.reset();
        await fetchMeals();
      } else {
        showFormStatus(data.message || 'Something went wrong.', 'error');
      }
    } catch (err) {
      console.error(err);
      showFormStatus('Network error. Please try again.', 'error');
    }

    btn.disabled = false;
    btn.textContent = 'Add Meal';
  });
}

function showFormStatus(msg, type) {
  formStatus.textContent = msg;
  formStatus.className = `form-status ${type}`;
  formStatus.classList.remove('hidden');
}

/* ========================================================
   HELPERS
   ======================================================== */
function parseTags(tagStr) {
  return tagStr
    .split(',')
    .map(t => t.trim().toUpperCase())
    .filter(t => ['GF', 'DF'].includes(t));
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function escapeAttr(str) {
  return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function toast(msg) {
  toastEl.textContent = msg;
  toastEl.classList.remove('hidden');
  toastEl.classList.add('show');
  setTimeout(() => {
    toastEl.classList.remove('show');
    setTimeout(() => toastEl.classList.add('hidden'), 300);
  }, 2000);
}
