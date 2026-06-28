"use strict";

/* ─────────────────────────────────────────────────────
   DASHBOARD (home page)
───────────────────────────────────────────────────── */
function homeTpl() {
  return `
    <div class="welcome">
      <h2>${greeting()} 👋</h2>
      <p>Engineer better prompts, faster.</p>
    </div>
    <div class="quick-actions">
      <button class="qa-card" onclick="goTo('evaluate')">
        <div class="qic">◎</div>
        <div class="qt">Evaluate Prompt</div>
        <div class="qs">Score across 5 dimensions</div>
      </button>
      <button class="qa-card" onclick="goTo('optimize')">
        <div class="qic">⚡</div>
        <div class="qt">Optimize Prompt</div>
        <div class="qs">AI rewrites your draft</div>
      </button>
      <button class="qa-card" onclick="goTo('playground')">
        <div class="qic">⊿</div>
        <div class="qt">Playground</div>
        <div class="qs">Compare A vs B</div>
      </button>
      <button class="qa-card" onclick="goTo('library')">
        <div class="qic">◈</div>
        <div class="qt">Prompt Library</div>
        <div class="qs">Browse templates</div>
      </button>
    </div>
    <div class="kpis" id="home-kpis">
      ${["Avg Score", "Optimizations", "Saved Versions", "Library Prompts"]
        .map((l) => `<div class="kpi"><div class="kv">—</div><div class="kl">${l}</div></div>`)
        .join("")}
    </div>
    <div class="dash-grid">
      <div class="card">
        <div class="card-head"><h3>Recent Activity</h3></div>
        <div id="home-activity"><div class="loading-row"><span class="spinner"></span> Loading...</div></div>
      </div>
      <div class="card">
        <div class="card-head"><h3>Usage Breakdown</h3></div>
        <div id="home-bars"><div class="loading-row"><span class="spinner"></span> Loading...</div></div>
      </div>
    </div>
  `;
}

async function initHome() {
  const { ok, data } = await api("/analytics");
  if (!ok) {
    document.getElementById("home-kpis").innerHTML = `
      <div class="kpi" style="grid-column:span 4">
        <div class="empty"><div class="empty-icon">⚠️</div>Could not load stats — is the backend running?</div>
      </div>`;
    return;
  }

  document.getElementById("home-kpis").innerHTML = `
    <div class="kpi"><div class="kv">${data.average_score || "—"}</div><div class="kl">Avg Score</div>${data.average_score ? `<div class="kd">↑ ai-powered</div>` : ""}</div>
    <div class="kpi"><div class="kv">${data.optimize_calls}</div><div class="kl">Optimizations</div></div>
    <div class="kpi"><div class="kv">${data.versions_saved}</div><div class="kl">Saved Versions</div></div>
    <div class="kpi"><div class="kv">${data.prompts_in_library}</div><div class="kl">Library Prompts</div></div>
  `;

  const actEl = document.getElementById("home-activity");
  if (!data.recent_activity?.length) {
    actEl.innerHTML = `<div class="empty"><div class="empty-icon">💤</div>No activity yet<p>Try evaluating or saving a prompt.</p></div>`;
  } else {
    actEl.innerHTML = data.recent_activity
      .map(
        (a) => `
      <div class="activity-item">
        <div class="activity-dot"></div>
        <div>
          <div>${esc(a.label)}</div>
          <div class="activity-time">${a.created_at ? new Date(a.created_at + "Z").toLocaleString() : ""}</div>
        </div>
      </div>
    `
      )
      .join("");
  }

  const max = Math.max(data.evaluate_calls, data.optimize_calls, data.versions_saved, 1);
  const items = [
    { name: "Evaluate", value: data.evaluate_calls },
    { name: "Optimize", value: data.optimize_calls },
    { name: "Versions", value: data.versions_saved },
  ];
  document.getElementById("home-bars").innerHTML = items
    .map(
      (b) => `
    <div class="bar-row">
      <div class="bar-label">${b.name}</div>
      <div class="bar-track"><div class="bar-fill" style="width:${(b.value / max) * 100}%"></div></div>
      <div class="bar-val">${b.value}</div>
    </div>
  `
    )
    .join("");
}

/* ─────────────────────────────────────────────────────
   ANALYTICS PAGE
───────────────────────────────────────────────────── */
function analyticsTpl() {
  return `
    <div class="page-head">
      <h2>Analytics</h2>
      <p>Live usage statistics pulled from the database.</p>
    </div>
    <div class="kpis" id="an-kpis">
      <div class="loading-row" style="grid-column:span 4"><span class="spinner"></span> Loading…</div>
    </div>
    <div class="dash-grid">
      <div class="card">
        <div class="card-head"><h3>Usage Breakdown</h3></div>
        <div id="an-bars"></div>
      </div>
      <div class="card">
        <div class="card-head"><h3>Recent Activity</h3></div>
        <div id="an-activity"></div>
      </div>
    </div>
  `;
}

async function loadAnalytics() {
  const { ok, data, error } = await api("/analytics");
  if (!ok) {
    document.getElementById("an-kpis").innerHTML = `<div class="empty" style="grid-column:span 4"><div class="empty-icon">⚠️</div>${esc(error)}</div>`;
    return;
  }

  document.getElementById("an-kpis").innerHTML = `
    <div class="kpi"><div class="kv">${data.evaluate_calls}</div><div class="kl">Evaluations</div></div>
    <div class="kpi"><div class="kv">${data.optimize_calls}</div><div class="kl">Optimizations</div></div>
    <div class="kpi"><div class="kv">${data.average_score || "—"}</div><div class="kl">Avg Score</div></div>
    <div class="kpi"><div class="kv">${data.prompts_in_library}</div><div class="kl">Library Prompts</div></div>
  `;

  const max = Math.max(data.evaluate_calls, data.optimize_calls, data.versions_saved, 1);
  const items = [
    { name: "Evaluations",   value: data.evaluate_calls },
    { name: "Optimizations", value: data.optimize_calls },
    { name: "Versions",      value: data.versions_saved },
  ];
  document.getElementById("an-bars").innerHTML =
    `<div class="analytics-chart">` +
    items
      .map(
        (b) => `
    <div class="chart-bar-row">
      <div class="chart-bar-label">${b.name}</div>
      <div class="chart-bar-outer">
        ${
          b.value > 0
            ? `<div class="chart-bar-inner" style="width:${(b.value / max) * 100}%"><span class="chart-bar-count">${b.value}</span></div>`
            : `<span class="chart-bar-zero">0</span>`
        }
      </div>
    </div>
  `
      )
      .join("") +
    `</div>`;

  const actEl = document.getElementById("an-activity");
  if (!data.recent_activity?.length) {
    actEl.innerHTML = `<div class="empty"><div class="empty-icon">💤</div>No activity yet</div>`;
  } else {
    actEl.innerHTML = data.recent_activity
      .map(
        (a) => `
      <div class="activity-item">
        <div class="activity-dot"></div>
        <div>
          <div>${esc(a.label)}</div>
          <div class="activity-time">${a.created_at ? new Date(a.created_at + "Z").toLocaleString() : ""}</div>
        </div>
      </div>
    `
      )
      .join("");
  }
}
