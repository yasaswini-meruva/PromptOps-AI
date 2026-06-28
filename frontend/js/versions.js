"use strict";

/* ─────────────────────────────────────────────────────
   VERSION HISTORY
───────────────────────────────────────────────────── */
function versionsTpl() {
  return `
    <div class="page-head">
      <h2>Version History</h2>
      <p>Every saved prompt version, newest first. Restore, copy, or delete any entry.</p>
    </div>
    <div class="card">
      <label for="ver-name">Version name</label>
      <input id="ver-name" type="text" placeholder="e.g. Resume Prompt v2">
      <label for="ver-prompt">Prompt text</label>
      <textarea id="ver-prompt" class="mono"></textarea>
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
        <button class="btn btn-primary" id="ver-btn" onclick="saveVersion()">Save Version</button>
        <div class="loading-row" id="ver-loading" style="display:none;"><span class="spinner"></span> Saving…</div>
      </div>
    </div>
    <div class="card">
      <div class="card-head"><h3>Saved Versions</h3></div>
      <div class="lib-toolbar">
        <input type="search" id="ver-search" placeholder="Search by name…" oninput="filterVersions()" aria-label="Search versions">
      </div>
      <div id="ver-timeline"></div>
    </div>
  `;
}

let _allVersions = [];

async function saveVersion() {
  const name   = document.getElementById("ver-name").value.trim();
  const prompt = document.getElementById("ver-prompt").value.trim();
  if (!name || !prompt) { toast("Fill in both name and prompt.", "error"); return; }

  setLoading("ver", true);
  const { ok, error } = await api("/versions/save", {
    method: "POST",
    body: JSON.stringify({ name, prompt }),
  });
  setLoading("ver", false);

  if (ok) {
    document.getElementById("ver-name").value   = "";
    document.getElementById("ver-prompt").value = "";
    toast("Version saved.", "success");
    loadVersions();
  } else {
    toast(error, "error");
  }
}

async function loadVersions() {
  const el = document.getElementById("ver-timeline");
  if (!el) return;
  el.innerHTML = `<div class="loading-row"><span class="spinner"></span> Loading…</div>`;

  const { ok, data, error } = await api("/versions");
  if (!ok) {
    el.innerHTML = `<div class="empty"><div class="empty-icon">⚠️</div>${esc(error)}</div>`;
    return;
  }

  _allVersions = data.versions;
  renderTimeline(_allVersions);
}

function filterVersions() {
  const q = document.getElementById("ver-search")?.value.trim().toLowerCase() || "";
  renderTimeline(
    q ? _allVersions.filter((v) => v.name.toLowerCase().includes(q)) : _allVersions
  );
}

function renderTimeline(versions) {
  const el = document.getElementById("ver-timeline");
  if (!el) return;

  if (!versions.length) {
    el.innerHTML = `<div class="empty"><div class="empty-icon">🕒</div>No versions yet<p>Save your first prompt version above.</p></div>`;
    return;
  }

  el.innerHTML =
    `<div class="timeline">` +
    versions
      .map((v) => {
        const date = v.created_at ? new Date(v.created_at + "Z").toLocaleString() : "";
        return `
      <div class="tl-entry">
        <div class="tl-card">
          <div class="tl-name">${esc(v.name)}</div>
          <div class="tl-meta">
            <span class="tl-id">#${v.id}</span>
            ${v.score ? `<span class="badge">${v.score}/100</span>` : ""}
            ${date ? `<span class="tl-id">${date}</span>` : ""}
          </div>
          <div class="tl-text">${esc(v.prompt)}</div>
          <div class="tl-actions">
            <button class="btn btn-sm" onclick='copyRaw(${JSON.stringify(v.prompt)})'>Copy</button>
            <button class="btn btn-sm" onclick='restoreVersion(${JSON.stringify(v.prompt)})'>Use in Optimizer</button>
            <button class="btn btn-sm" onclick='loadIntoEvaluator(${JSON.stringify(v.prompt)})'>Evaluate</button>
            <button class="btn btn-sm btn-danger" onclick='deleteVersion(${v.id}, this)'>Delete</button>
          </div>
        </div>
      </div>
    `;
      })
      .join("") +
    `</div>`;
}

function restoreVersion(prompt) {
  goTo("optimize");
  setTimeout(() => {
    const el = document.getElementById("opt-input");
    if (el) el.value = prompt;
  }, 150);
  toast("Loaded into Optimizer.", "success");
}

async function deleteVersion(id, btn) {
  if (!confirm("Delete this version? This cannot be undone.")) return;
  btn.disabled = true;
  const { ok, error } = await api(`/versions/${id}`, { method: "DELETE" });
  if (ok) {
    toast("Version deleted.", "success");
    loadVersions();
  } else {
    toast(error, "error");
    btn.disabled = false;
  }
}
