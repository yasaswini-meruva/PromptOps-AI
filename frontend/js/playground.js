"use strict";

/* ─────────────────────────────────────────────────────
   PROMPT PLAYGROUND
───────────────────────────────────────────────────── */
function playgroundTpl() {
  return `
    <div class="page-head">
      <h2>Prompt Playground</h2>
      <p>Run two prompts through the AI simultaneously and compare real outputs side by side.</p>
    </div>
    <div class="card">
      <div class="split">
        <div>
          <div class="pg-header">
            <div class="pg-label">Prompt A</div>
            <span class="badge">Original</span>
          </div>
          <textarea id="pg-a" placeholder="Your original prompt…" style="min-height:130px;" class="mono"></textarea>
        </div>
        <div>
          <div class="pg-header">
            <div class="pg-label">Prompt B</div>
            <span class="badge cyan">Improved</span>
          </div>
          <textarea id="pg-b" placeholder="Your improved prompt…" style="min-height:130px;" class="mono"></textarea>
        </div>
      </div>
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
        <button class="btn btn-primary" id="pg-btn" onclick="runPlayground()">⊿ Run Both</button>
        <div class="loading-row" id="pg-loading" style="display:none;"><span class="spinner"></span> Running both through AI…</div>
      </div>
    </div>

    <div id="pg-results" style="display:none;">
      <div class="split">
        <div class="card">
          <div class="card-head">
            <h3>Response A</h3>
            <div id="pg-score-a"></div>
          </div>
          <div class="result-box show mono" id="pg-result-a"></div>
          <div style="margin-top:10px;"><button class="btn btn-sm" onclick="copyText('pg-result-a')">Copy</button></div>
        </div>
        <div class="card">
          <div class="card-head">
            <h3>Response B</h3>
            <div id="pg-score-b"></div>
          </div>
          <div class="result-box show mono" id="pg-result-b"></div>
          <div style="margin-top:10px;"><button class="btn btn-sm" onclick="copyText('pg-result-b')">Copy</button></div>
        </div>
      </div>
      <div class="comparison-result show" id="pg-comparison">
        <div class="comparison-winner" id="pg-winner"></div>
        <div class="comparison-summary" id="pg-summary"></div>
      </div>
    </div>

    <div class="result-box error" id="pg-error"></div>
  `;
}

async function runPlayground() {
  const a = document.getElementById("pg-a").value.trim();
  const b = document.getElementById("pg-b").value.trim();
  if (!a || !b) { toast("Fill in both Prompt A and Prompt B.", "error"); return; }

  setLoading("pg", true);
  document.getElementById("pg-results").style.display = "none";
  document.getElementById("pg-error").classList.remove("show");

  const { ok, data, error } = await api("/playground/compare", {
    method: "POST",
    body: JSON.stringify({ prompt_a: a, prompt_b: b }),
  });
  setLoading("pg", false);

  if (!ok) { showError("pg-error", error); toast(error, "error"); return; }

  document.getElementById("pg-result-a").textContent = data.output_a;
  document.getElementById("pg-result-b").textContent = data.output_b;

  if (data.score_a)
    document.getElementById("pg-score-a").innerHTML = `<span class="badge">${data.score_a}/100</span>`;
  if (data.score_b)
    document.getElementById("pg-score-b").innerHTML = `<span class="badge cyan">${data.score_b}/100</span>`;

  const winnerMap = {
    A:   "🏆 Prompt A wins",
    B:   "🏆 Prompt B wins",
    Tie: "🤝 It's a tie",
  };
  document.getElementById("pg-winner").textContent  = winnerMap[data.winner] || data.winner;
  document.getElementById("pg-summary").textContent = data.comparison_summary || "";

  document.getElementById("pg-results").style.display = "block";
  toast("Comparison complete.", "success");
}
