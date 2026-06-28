"use strict";

/* ─────────────────────────────────────────────────────
   PROMPT EVALUATOR
───────────────────────────────────────────────────── */
function evaluateTpl() {
  return `
    <div class="page-head">
      <h2>Prompt Evaluator</h2>
      <p>Score any prompt across 5 dimensions: clarity, context, constraints, structure, and output format.</p>
    </div>
    <div class="card">
      <label for="eval-input">Prompt to evaluate</label>
      <textarea id="eval-input" placeholder="Paste or type your prompt here…" style="min-height:140px;" class="mono"></textarea>
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
        <button class="btn btn-primary" id="eval-btn" onclick="runEvaluate()">⚡ Evaluate with AI</button>
        <div class="loading-row" id="eval-loading" style="display:none;"><span class="spinner"></span> AI is scoring your prompt…</div>
      </div>
    </div>

    <div id="eval-results" style="display:none;">
      <div class="card">
        <div class="card-head">
          <h3>Score</h3>
          <div id="eval-verdict-badge"></div>
        </div>
        <div class="score-display">
          <div class="gauge">
            <svg width="108" height="108" viewBox="0 0 108 108" aria-hidden="true">
              <circle class="gauge-bg" cx="54" cy="54" r="45"></circle>
              <circle class="gauge-fg" id="gauge-fg" cx="54" cy="54" r="45"
                stroke-dasharray="283" stroke-dashoffset="283"></circle>
            </svg>
            <div class="gauge-num" aria-label="Total score">
              <span id="gauge-num">0</span>
              <span class="gauge-label">/ 100</span>
            </div>
          </div>
          <div class="score-breakdown" id="score-dims"></div>
        </div>
        <div class="verdict" id="eval-verdict-text"></div>
      </div>

      <div class="eval-insight-grid">
        <div class="insight-card strengths">
          <h4>Strengths</h4>
          <ul id="eval-strengths"></ul>
        </div>
        <div class="insight-card weaknesses">
          <h4>Weaknesses</h4>
          <ul id="eval-weaknesses"></ul>
        </div>
        <div class="insight-card suggestions">
          <h4>Suggestions</h4>
          <ul id="eval-suggestions"></ul>
        </div>
      </div>

      <div class="card" style="margin-top:12px;">
        <div class="card-head">
          <h3>Better Prompt Example</h3>
          <button class="btn btn-sm btn-ghost" onclick="useBetterPrompt()">Use in Optimizer →</button>
        </div>
        <div class="better-prompt-box">
          <div class="better-label">AI-improved version (90+ score)</div>
          <div id="eval-better-prompt"></div>
        </div>
        <div style="margin-top:10px;">
          <button class="btn btn-sm" onclick="copyText('eval-better-prompt')">Copy</button>
        </div>
      </div>
    </div>

    <div class="result-box error" id="eval-error"></div>
  `;
}

let _evalBetterPrompt = "";

async function runEvaluate() {
  const input = document.getElementById("eval-input");
  const prompt = input.value.trim();
  if (!prompt) { toast("Please enter a prompt.", "error"); input.focus(); return; }

  setLoading("eval", true);
  document.getElementById("eval-results").style.display = "none";
  document.getElementById("eval-error").classList.remove("show");

  const { ok, data, error } = await api("/evaluate/ai", {
    method: "POST",
    body: JSON.stringify({ prompt }),
  });
  setLoading("eval", false);

  if (!ok) {
    showError("eval-error", error);
    toast(error, "error");
    return;
  }

  const s = data.scores;
  _evalBetterPrompt = s.better_example || "";

  // Gauge animation
  const circ = 2 * Math.PI * 45;
  const offset = circ - (circ * s.total_score) / 100;
  const fg = document.getElementById("gauge-fg");
  fg.setAttribute("stroke-dasharray", circ);
  fg.setAttribute("stroke-dashoffset", offset);
  fg.style.stroke =
    s.total_score >= 80 ? "var(--green)" :
    s.total_score >= 60 ? "var(--cyan)"  :
    s.total_score >= 40 ? "var(--amber)" : "var(--red)";
  document.getElementById("gauge-num").textContent = s.total_score;

  // Verdict badge
  const scoreClass =
    s.total_score >= 80 ? "green" :
    s.total_score >= 60 ? "cyan"  :
    s.total_score >= 40 ? "amber" : "red";
  document.getElementById("eval-verdict-badge").innerHTML =
    `<span class="badge ${scoreClass}">${getScoreLabel(s.total_score)}</span>`;

  // Dimension bars
  const dims = [
    { l: "Clarity",       v: s.clarity },
    { l: "Context",       v: s.context },
    { l: "Constraints",   v: s.constraints },
    { l: "Structure",     v: s.structure },
    { l: "Output Format", v: s.output_format },
  ];
  document.getElementById("score-dims").innerHTML = dims
    .map(
      (d) => `
    <div class="score-dim">
      <div class="dim-label">${d.l}</div>
      <div class="dim-track"><div class="dim-fill" style="width:${(d.v / 20) * 100}%"></div></div>
      <div class="dim-val">${d.v}/20</div>
    </div>
  `
    )
    .join("");

  // Verdict text
  document.getElementById("eval-verdict-text").innerHTML =
    `<strong>Verdict:</strong> ${esc(s.verdict || "")}`;

  // Insight lists
  function renderList(arr, elId) {
    const el = document.getElementById(elId);
    if (!arr?.length) { el.innerHTML = "<li>—</li>"; return; }
    el.innerHTML = arr.map((item) => `<li>${esc(item)}</li>`).join("");
  }
  renderList(s.strengths,   "eval-strengths");
  renderList(s.weaknesses,  "eval-weaknesses");
  renderList(s.suggestions, "eval-suggestions");

  // Better prompt
  document.getElementById("eval-better-prompt").textContent = s.better_example || "—";

  document.getElementById("eval-results").style.display = "block";
  toast("Evaluation complete.", "success");
}

function getScoreLabel(score) {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 50) return "Fair";
  if (score >= 30) return "Weak";
  return "Poor";
}

function useBetterPrompt() {
  if (!_evalBetterPrompt) return;
  goTo("optimize");
  setTimeout(() => {
    const el = document.getElementById("opt-input");
    if (el) el.value = _evalBetterPrompt;
  }, 150);
  toast("Loaded into Optimizer.", "success");
}
