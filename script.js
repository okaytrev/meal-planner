/* ========================================================
   Meal Planner — Frontend Logic
   ======================================================== */

const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbwVaqs8KNz_GVfawBCIJn50BvXuEunV-aHhbtVOACgo41l9yLdRfzPmJKSu-tw16pg3/exec';

/* ---------- State ---------- */
let allMeals = [];
let weekMeals = [];
let extraItems = [];
let groceryList = [];
let activeFilter = 'all';
let searchQuery = '';

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
const extraInput       = $('#extra-item-input');
const btnAddExtra      = $('#btn-add-extra');
const extraListEl      = $('#extra-items-list');

/* ========================================================
   INIT
   ======================================================== */
document.addEventListener('DOMContentLoaded', () => {
  bindTabs();
  bindFilters();
  bindSearch();
  bindAddForm();
  bindWeekActions();
  bindExtras();
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
    weekMeals = data.weekPlan || [];
    extraItems = data.extraItems || [];
    groceryList = data.groceryList || [];
  } catch (err) {
    console.error('Failed to load meals:', err);
    allMeals = [];
  }

  bankLoaderEl.classList.add('hidden');
  renderBank();
  renderExtras();

  if (groceryList.length > 0) {
    renderGroceryItems(groceryList);
    grocerySectionEl.classList.remove('hidden');
  }
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
      <div class="card-actions">
        <button class="btn-select ${isAdded ? 'added' : ''}" data-id="${meal.id}">
          ${isAdded ? 'Added' : '+ Add'}
        </button>
        <button class="btn-delete" data-id="${meal.id}" title="Delete meal">✕</button>
      </div>
    </div>
  `;

  card.querySelector('.btn-select').addEventListener('click', () => toggleWeekMeal(meal.id));
  card.querySelector('.btn-delete').addEventListener('click', () => deleteMeal(meal));
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
    if (groceryList.length === 0) grocerySectionEl.classList.add('hidden');
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
  saveWeekToSheet();
  renderBank();
  grocerySectionEl.classList.add('hidden');
}

async function deleteMeal(meal) {
  if (!confirm(`Delete "${meal.name}" from the meal bank?`)) return;

  try {
    const res = await fetch(WEB_APP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: 'deleteMeal', id: meal.id }),
    });
    const data = await res.json();

    if (data.status === 'ok') {
      const idx = weekMeals.indexOf(meal.id);
      if (idx > -1) {
        weekMeals.splice(idx, 1);
        saveWeekToSheet();
      }
      toast('Meal deleted');
      await fetchMeals();
    } else {
      toast(data.message || 'Failed to delete');
    }
  } catch (err) {
    console.error(err);
    toast('Network error. Try again.');
  }
}

async function saveWeekToSheet() {
  try {
    await fetch(WEB_APP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: 'saveWeek', weekPlan: weekMeals }),
    });
  } catch (err) {
    console.error('Failed to save week plan:', err);
  }
}

/* ========================================================
   EXTRA GROCERY ITEMS
   ======================================================== */
function bindExtras() {
  btnAddExtra.addEventListener('click', addExtraItem);
  extraInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); addExtraItem(); }
  });
  renderExtras();
}

function addExtraItem() {
  const val = extraInput.value.trim();
  if (!val) return;
  extraItems.push(val);
  saveExtras();
  extraInput.value = '';
  renderExtras();
  grocerySectionEl.classList.add('hidden');
}

function removeExtraItem(index) {
  extraItems.splice(index, 1);
  saveExtras();
  renderExtras();
  grocerySectionEl.classList.add('hidden');
}

async function saveExtras() {
  try {
    await fetch(WEB_APP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: 'saveExtraItems', items: extraItems }),
    });
  } catch (err) {
    console.error('Failed to save extra items:', err);
  }
}

function renderExtras() {
  extraListEl.innerHTML = '';
  extraItems.forEach((item, i) => {
    const li = document.createElement('li');
    li.innerHTML = `<span>${escapeHTML(item)}</span><button class="btn-remove-extra" title="Remove">&times;</button>`;
    li.querySelector('button').addEventListener('click', () => removeExtraItem(i));
    extraListEl.appendChild(li);
  });
}

/* ========================================================
   GROCERY LIST GENERATOR
   ======================================================== */
function bindWeekActions() {
  btnGenerate.addEventListener('click', generateGroceryList);
  btnClearWeek.addEventListener('click', () => {
    weekMeals = [];
    extraItems = [];
    groceryList = [];
    saveExtras();
    saveWeekToSheet();
    saveGroceryListToSheet();
    renderWeek();
    renderExtras();
    renderBank();
    grocerySectionEl.classList.add('hidden');
    toast('Week cleared');
  });
  btnCopy.addEventListener('click', copyGroceryList);
}

function generateGroceryList() {
  const items = computeGroceryItems();
  groceryList = items;
  renderGroceryItems(items);
  saveGroceryListToSheet();
  grocerySectionEl.classList.remove('hidden');
  grocerySectionEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function computeGroceryItems() {
  const selected = allMeals.filter(m => weekMeals.includes(m.id));
  const map = new Map();

  selected.forEach(meal => {
    meal.ingredients.split(',').forEach(raw => {
      const trimmed = raw.trim();
      if (!trimmed || isSpice(trimmed)) return;
      const key = trimmed.toLowerCase();
      if (!map.has(key)) map.set(key, trimmed);
    });
  });

  extraItems.forEach(item => {
    const key = item.toLowerCase();
    if (!map.has(key)) map.set(key, item);
  });

  const sorted = [...map.values()].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
  return sorted.map(item => ({ group: categorizeIngredient(item), item }));
}

function renderGroceryItems(items) {
  let draggedLi = null;

  const GROUP_ORDER = ['Produce', 'Meat', 'Dry Goods', 'Misc'];
  const groups = {};
  GROUP_ORDER.forEach(g => { groups[g] = []; });
  items.forEach(({ group, item }) => {
    const g = GROUP_ORDER.includes(group) ? group : 'Misc';
    groups[g].push(item);
  });

  function makeItem(item, groupEl, ul) {
    const li = document.createElement('li');

    const handle = document.createElement('span');
    handle.className = 'drag-handle';
    handle.setAttribute('aria-hidden', 'true');
    handle.textContent = '⠿';

    const span = document.createElement('span');
    span.className = 'grocery-item-text';
    span.contentEditable = 'true';
    span.textContent = item;
    span.addEventListener('keydown', e => { if (e.key === 'Enter') e.preventDefault(); });
    span.addEventListener('blur', () => debouncedSaveGroceryList());

    const btnRemove = document.createElement('button');
    btnRemove.className = 'btn-remove-grocery';
    btnRemove.title = 'Remove item';
    btnRemove.textContent = '×';
    btnRemove.addEventListener('click', () => {
      li.remove();
      if (ul.children.length === 0) groupEl.classList.add('empty');
      debouncedSaveGroceryList();
    });

    handle.addEventListener('mousedown', () => { li.draggable = true; });
    li.addEventListener('dragstart', e => {
      draggedLi = li;
      e.dataTransfer.effectAllowed = 'move';
      setTimeout(() => li.classList.add('dragging'), 0);
    });
    li.addEventListener('dragend', () => {
      li.draggable = false;
      li.classList.remove('dragging');
      draggedLi = null;
      groceryListEl.querySelectorAll('.grocery-group').forEach(g => g.classList.remove('drag-over'));
    });

    li.appendChild(handle);
    li.appendChild(span);
    li.appendChild(btnRemove);
    return li;
  }

  groceryListEl.innerHTML = '';

  GROUP_ORDER.forEach(groupName => {
    const groupItems = groups[groupName];
    const groupEl = document.createElement('div');
    groupEl.className = 'grocery-group' + (groupItems.length === 0 ? ' empty' : '');

    const title = document.createElement('h3');
    title.className = 'grocery-group-title';
    title.textContent = groupName;
    groupEl.appendChild(title);

    const ul = document.createElement('ul');
    groupItems.forEach(item => ul.appendChild(makeItem(item, groupEl, ul)));

    groupEl.addEventListener('dragover', e => {
      if (!draggedLi) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      groupEl.classList.add('drag-over');
    });
    groupEl.addEventListener('dragleave', e => {
      if (!groupEl.contains(e.relatedTarget)) groupEl.classList.remove('drag-over');
    });
    groupEl.addEventListener('drop', e => {
      e.preventDefault();
      groupEl.classList.remove('drag-over');
      if (!draggedLi || ul.contains(draggedLi)) return;
      const srcGroup = draggedLi.closest('.grocery-group');
      const srcUl = srcGroup.querySelector('ul');
      ul.appendChild(draggedLi);
      groupEl.classList.remove('empty');
      if (srcUl.children.length === 0) srcGroup.classList.add('empty');
      debouncedSaveGroceryList();
    });

    groupEl.appendChild(ul);
    groceryListEl.appendChild(groupEl);
  });
}

function readGroceryListFromDOM() {
  const items = [];
  groceryListEl.querySelectorAll('.grocery-group').forEach(group => {
    const groupName = group.querySelector('.grocery-group-title').textContent;
    group.querySelectorAll('.grocery-item-text').forEach(span => {
      const text = span.textContent.trim();
      if (text) items.push({ group: groupName, item: text });
    });
  });
  return items;
}

let _grocerySaveTimer = null;
function debouncedSaveGroceryList() {
  clearTimeout(_grocerySaveTimer);
  _grocerySaveTimer = setTimeout(() => saveGroceryListToSheet(), 500);
}

async function saveGroceryListToSheet() {
  const items = readGroceryListFromDOM();
  groceryList = items;
  try {
    await fetch(WEB_APP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: 'saveGroceryList', items }),
    });
  } catch (err) {
    console.error('Failed to save grocery list:', err);
  }
}

async function copyGroceryList() {
  const lines = [];
  groceryListEl.querySelectorAll('.grocery-group').forEach(group => {
    const title = group.querySelector('.grocery-group-title').textContent;
    const items = [...group.querySelectorAll('.grocery-item-text')].map(s => `- ${s.textContent.trim()}`);
    if (items.length) {
      lines.push(title + ':');
      lines.push(...items);
      lines.push('');
    }
  });
  const text = lines.join('\n').trim();

  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      toast('Copied to clipboard!');
      return;
    } catch {
      // fall through to textarea fallback
    }
  }

  // iOS-compatible fallback
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;';
  ta.setAttribute('readonly', '');
  document.body.appendChild(ta);
  ta.focus();
  ta.setSelectionRange(0, text.length);
  document.execCommand('copy');
  document.body.removeChild(ta);
  toast('Copied to clipboard!');
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
        headers: { 'Content-Type': 'text/plain' },
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
function isSpice(name) {
  const lower = name.toLowerCase().trim();
  if (lower.includes('butter') || lower.includes('saltine') || lower.includes('salt pork')) return false;
  const SPICE_KEYWORDS = [
    'salt','cumin','paprika','oregano','cinnamon','turmeric','curry powder',
    'cayenne','chili powder','chili flake','chili flakes','garlic powder','onion powder',
    'cardamom','clove','nutmeg','allspice','caraway','saffron','bay leaf',
    'mustard powder','dried thyme','dried rosemary','dried sage','dried dill',
    'dried basil','dried parsley','dried oregano','dried mint','italian seasoning',
    'taco seasoning','garam masala','spice blend','seasoning blend','black pepper',
    'white pepper','ground pepper','peppercorn','red pepper flake','crushed red pepper',
  ];
  return SPICE_KEYWORDS.some(k => lower.includes(k));
}

function categorizeIngredient(name) {
  const lower = name.toLowerCase();
  const PRODUCE = ['apple','banana','lemon','lime','orange','berry','berries','lettuce','spinach','kale','arugula','cabbage','broccoli','cauliflower','carrot','celery','cucumber','zucchini','squash','bell pepper','jalapeño','pepper','tomato','onion','garlic','ginger','mushroom','potato','sweet potato','avocado','guacamole','corn','pea','green bean','snap pea','edamame','asparagus','beet','radish','cilantro','parsley','basil','mint','rosemary','thyme','sage','dill','scallion','leek','shallot','fennel','eggplant','mango','pineapple','grape','peach','plum','pear','melon','watermelon','cantaloupe','brussels','brussel','sprout','artichoke','bok choy','chard','collard','endive','watercress','turnip','parsnip','yam','okra','tomatillo','plantain','jicama','kohlrabi','rutabaga','fruit','vegetable','veggie','produce','herb','fresh'];
  const MEAT = ['chicken','beef','pork','lamb','turkey','salmon','tuna','shrimp','fish','steak','ground beef','ground turkey','sausage','bacon','ham','prosciutto','pancetta','crab','lobster','scallop','tilapia','cod','halibut','duck','bison','meat','seafood'];
  const DRY_GOODS = ['rice','pasta','flour','oat','bread','cereal','cracker','chip','noodle','quinoa','lentil','bean','chickpea','barley','bulgur','couscous','panko','breadcrumb','tortilla','wrap','pita','grain','canned','sauce','stock','broth','olive oil','oil','vinegar','soy sauce','tamari','ketchup','mustard','mayo','mayonnaise','salt','sugar','honey','syrup','jam','jelly','peanut butter','almond butter','nut','almond','walnut','pecan','cashew','pistachio','seed','coconut','chocolate','cocoa','coffee','tea','powder','spice','seasoning','cumin','paprika','oregano','cinnamon','turmeric','curry','chili flake','pepper flake','baking soda','baking powder','yeast','bouillon'];
  if (PRODUCE.some(k => lower.includes(k))) return 'Produce';
  if (MEAT.some(k => lower.includes(k))) return 'Meat';
  if (DRY_GOODS.some(k => lower.includes(k))) return 'Dry Goods';
  return 'Misc';
}

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
