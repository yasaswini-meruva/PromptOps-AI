"use strict";

/* ─────────────────────────────────────────────────────
   PROMPT LIBRARY
───────────────────────────────────────────────────── */
const CATEGORIES = [
  "Resume",
  "UI Design",
  "AI Agents",
  "Content Writing",
  "Full Stack Apps",
  "Marketing",
];

let _favorites      = new Set();
let _libSearchTimer = null;
let _currentCat     = "";

function libraryTpl() {
  return `
    <div class="page-head">
      <h2>Prompt Library</h2>
      <p>Curated templates organized by use case. Copy, favorite, or load into the optimizer.</p>
    </div>
    <div class="card">
      <div class="lib-toolbar">
        <input type="search" id="lib-search" placeholder="Search prompts…" oninput="debouncedLibSearch()" aria-label="Search library">
      </div>
      <div class="chips" id="lib-chips"></div>
      <div class="loading-row" id="lib-loading" style="display:none;"><span class="spinner"></span> Loading…</div>
      <div id="lib-grid"></div>
    </div>
  `;
}

function debouncedLibSearch() {
  clearTimeout(_libSearchTimer);
  _libSearchTimer = setTimeout(loadLibrary, 320);
}

async function loadLibrary() {
  const search = document.getElementById("lib-search")?.value.trim() || "";

  // Rebuild category chips
  const chipsEl = document.getElementById("lib-chips");
  if (chipsEl) {
    chipsEl.innerHTML =
      `<span class="chip ${!_currentCat ? "active" : ""}" onclick="selectCat('')">All</span>` +
      CATEGORIES.map(
        (c) =>
          `<span class="chip ${c === _currentCat ? "active" : ""}" onclick="selectCat('${c}')">${c}</span>`
      ).join("");
  }

  const libLoading = document.getElementById("lib-loading");
  const libGrid    = document.getElementById("lib-grid");
  if (!libLoading || !libGrid) return;

  libLoading.style.display = "flex";
  libGrid.innerHTML = "";

  const params = new URLSearchParams();
  if (_currentCat) params.set("category", _currentCat);
  if (search)      params.set("search",   search);

  const { ok, data, error } = await api(`/library?${params}`);
  libLoading.style.display = "none";

  if (!ok) {
    libGrid.innerHTML = `<div class="empty"><div class="empty-icon">⚠️</div>${esc(error)}</div>`;
    return;
  }

  if (!data.prompts.length) {
    libGrid.innerHTML = `<div class="empty"><div class="empty-icon">🔍</div>No prompts found<p>Try a different search or category.</p></div>`;
    return;
  }

  libGrid.innerHTML =
    `<div class="lib-grid">` +
    data.prompts
      .map(
        (p) => `
    <div class="lib-card">
      <div class="lib-card-top">
        <span class="lib-cat">${esc(p.category)}</span>
        <span class="lib-star ${_favorites.has(p.id) ? "active" : ""}"
          onclick="toggleFav(${p.id}, this)" title="Favorite" aria-label="Favorite">★</span>
      </div>
      <div class="lib-title">${esc(p.title)}</div>
      <div class="lib-text">${esc(p.prompt)}</div>
      <div class="lib-actions">
  <button
    class="btn btn-sm"
    data-prompt="${encodeURIComponent(p.prompt)}"
    onclick="copyRaw(decodeURIComponent(this.dataset.prompt))">
    Copy
  </button>

  <button
    class="btn btn-sm"
    data-prompt="${encodeURIComponent(p.prompt)}"
    onclick="loadIntoOptimizer(decodeURIComponent(this.dataset.prompt))">
    Use in Optimizer
  </button>

  <button
    class="btn btn-sm"
    data-prompt="${encodeURIComponent(p.prompt)}"
    onclick="loadIntoEvaluator(decodeURIComponent(this.dataset.prompt))">
    Evaluate
  </button>
</div>
    </div>
  `
      )
      .join("") +
    `</div>`;
}

function selectCat(cat) {
  _currentCat = cat;
  loadLibrary();
}

function toggleFav(id, el) {
  if (_favorites.has(id)) {
    _favorites.delete(id);
    el.classList.remove("active");
  } else {
    _favorites.add(id);
    el.classList.add("active");
    toast("Added to favorites.", "success");
  }
}

function loadIntoOptimizer(text) {
  goTo("optimize");
  setTimeout(() => {
    const el = document.getElementById("opt-input");
    if (el) el.value = text;
  }, 150);
  toast("Loaded into Optimizer.", "success");
}

function loadIntoEvaluator(text) {
  goTo("evaluate");
  setTimeout(() => {
    const el = document.getElementById("eval-input");
    if (el) el.value = text;
  }, 150);
  toast("Loaded into Evaluator.", "success");
}
