"use strict";

/* ── PAGE REGISTRY ── */
const PAGES = [
  { id: "home",       label: "Dashboard",       icon: "⊞" },
  { id: "evaluate",   label: "Prompt Evaluator", icon: "◎" },
  { id: "optimize",   label: "Prompt Optimizer", icon: "⚡" },
  { id: "library",    label: "Prompt Library",   icon: "◈" },
  { id: "playground", label: "Playground",       icon: "⊿" },
  { id: "abtest",     label: "Experiment Lab",   icon: "⊛" },
  { id: "versions",   label: "Version History",  icon: "⊙" },
  { id: "analytics",  label: "Analytics",        icon: "↗" },
];

/* ── BUILD SIDEBAR NAV ── */
function buildNav() {
  const navEl = document.getElementById("nav");
  PAGES.forEach((p) => {
    const btn = document.createElement("button");
    btn.className = "nav-btn";
    btn.id = `nav-${p.id}`;
    btn.setAttribute("aria-label", p.label);
    btn.innerHTML = `<span class="ic" aria-hidden="true">${p.icon}</span><span>${p.label}</span>`;
    btn.onclick = () => {
      goTo(p.id);
      if (window.innerWidth <= 900) toggleSidebar();
    };
    navEl.appendChild(btn);
  });
}

/* ── MOBILE SIDEBAR TOGGLE ── */
function toggleSidebar() {
  document.getElementById("sidebar").classList.toggle("open");
  document.getElementById("sidebar-overlay").classList.toggle("open");
}

/* ── TIME-BASED GREETING ── */
function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

/* ── CLIENT-SIDE ROUTER ── */
let currentPage = null;

function goTo(pageId) {
  document.querySelectorAll(".nav-btn").forEach((b) => b.classList.remove("active"));
  document.getElementById(`nav-${pageId}`)?.classList.add("active");

  const wrap = document.getElementById("workspace-wrap");
  const existing = document.getElementById("workspace");
  if (existing) existing.classList.remove("active");

  setTimeout(() => {
    wrap.innerHTML = `<div class="workspace" id="workspace" role="region" aria-label="${pageId}">${renderPage(pageId)}</div>`;
    requestAnimationFrame(() =>
      document.getElementById("workspace")?.classList.add("active")
    );
    initPage(pageId);
    currentPage = pageId;
    wrap.scrollTop = 0;
  }, existing ? 100 : 0);
}

function renderPage(id) {
  const map = {
    home:       homeTpl,
    evaluate:   evaluateTpl,
    optimize:   optimizeTpl,
    library:    libraryTpl,
    playground: playgroundTpl,
    abtest:     abtestTpl,
    versions:   versionsTpl,
    analytics:  analyticsTpl,
  };
  return (map[id] || (() => ""))();
}

function initPage(id) {
  const map = {
    home:      initHome,
    library:   loadLibrary,
    versions:  loadVersions,
    analytics: loadAnalytics,
  };
  if (map[id]) map[id]();
}
