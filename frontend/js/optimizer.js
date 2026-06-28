"use strict";

/* ─────────────────────────────────────────────────────
   PROMPT OPTIMIZER
───────────────────────────────────────────────────── */
function optimizeTpl() {
  return `
    <div class="page-head">
      <h2>Prompt Optimizer</h2>
      <p>Paste a rough prompt and get a rewritten version with a full breakdown of what changed and why.</p>
    </div>
    <div class="card">
      <label for="opt-input">Your original prompt</label>
      <textarea id="opt-input" placeholder="e.g. write code for a button" style="min-height:130px;" class="mono"></textarea>
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
        <button class="btn btn-primary" id="opt-btn" onclick="runOptimize()">⚡ Optimize with AI</button>
        <div class="loading-row" id="opt-loading" style="display:none;"><span class="spinner"></span> Rewriting with AI…</div>
      </div>
    </div>

    <div id="opt-results" style="display:none;">
      <div class="split" style="margin-bottom:16px;">
        <div class="card">
          <div class="card-head"><h3>Original</h3></div>
          <div class="result-box show mono" id="opt-original"></div>
        </div>
        <div class="card">
          <div class="card-head">
            <h3>Optimized</h3>
            <div style="display:flex;gap:8px;">
              <button class="btn btn-sm" onclick="copyText('opt-optimized')">Copy</button>
              <button class="btn btn-sm" onclick="saveOptimizedVersion()">Save Version</button>
              <button class="btn btn-sm" onclick="evaluateOptimized()">Evaluate →</button>
            </div>
          </div>
          <div class="result-box show mono" id="opt-optimized"></div>
        </div>
      </div>

      <div class="opt-flow" id="opt-flow"></div>
    </div>

    <div class="result-box error" id="opt-error"></div>
  `;
}

let _lastOptimized = "";

async function runOptimize() {
  const input = document.getElementById("opt-input");
  const prompt = input.value.trim();
  if (!prompt) { toast("Please enter a prompt.", "error"); input.focus(); return; }

  setLoading("opt", true);
  document.getElementById("opt-results").style.display = "none";
  document.getElementById("opt-error").classList.remove("show");

  const { ok, data, error } = await api("/optimize/ai", {
    method: "POST",
    body: JSON.stringify({ prompt }),
  });
  setLoading("opt", false);

  if (!ok) { showError("opt-error", error); toast(error, "error"); return; }

  _lastOptimized = data.optimized_prompt || "";

  document.getElementById("opt-original").textContent  = data.original_prompt;
  document.getElementById("opt-optimized").textContent = data.optimized_prompt;

  const changes = Array.isArray(data.what_changed) ? data.what_changed : [data.what_changed];
  const flowSteps = [
    {
      icon: "✦",
      title: "What Changed",
      content: `<ul class="change-list">${changes.map((c) => `<li>${esc(c)}</li>`).join("")}</ul>`,
    },
    {
      icon: "→",
      title: "Why It's Better",
      content: `<span class="flow-step-text">${esc(data.why_better)}</span>`,
    },
    {
      icon: "◎",
      title: "Expected Improvement",
      content: `<span class="flow-step-text">${esc(data.expected_improvement)}</span>`,
    },
  ];

  document.getElementById("opt-flow").innerHTML = flowSteps
    .map(
      (s) => `
    <div class="flow-step">
      <div class="flow-step-icon">${s.icon}</div>
      <div class="flow-step-content">
        <div class="flow-step-title">${s.title}</div>
        ${s.content}
      </div>
    </div>
  `
    )
    .join("");

  document.getElementById("opt-results").style.display = "block";
  toast("Prompt optimized.", "success");
}

async function saveOptimizedVersion() {
  if (!_lastOptimized) return;
  const name = `Optimized — ${new Date().toLocaleString()}`;
  const { ok, error } = await api("/versions/save", {
    method: "POST",
    body: JSON.stringify({ name, prompt: _lastOptimized }),
  });
  if (ok) toast("Saved to Version History.", "success");
  else toast(error, "error");
}

function evaluateOptimized() {
  if (!_lastOptimized) return;
  goTo("evaluate");
  setTimeout(() => {
    const el = document.getElementById("eval-input");
    if (el) el.value = _lastOptimized;
  }, 150);
  toast("Loaded into Evaluator.", "success");
}
