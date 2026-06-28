"use strict";

/* ─────────────────────────────────────────────────────
   EXPERIMENT LAB (A/B TESTING)
───────────────────────────────────────────────────── */
function abtestTpl() {
  return `
    <div class="page-head">
      <h2>Experiment Lab</h2>
      <p>Run Prompt A and B against multiple test inputs. An AI judge scores each response objectively.</p>
    </div>
    <div class="card">
      <div class="split">
        <div>
          <label for="ab-a">Prompt A</label>
          <textarea id="ab-a" placeholder="e.g. Answer the question." style="min-height:110px;" class="mono"></textarea>
        </div>
        <div>
          <label for="ab-b">Prompt B</label>
          <textarea id="ab-b" placeholder="e.g. Answer clearly in 2–3 sentences with an example." style="min-height:110px;" class="mono"></textarea>
        </div>
      </div>
      <label for="ab-inputs">Test inputs <span style="font-weight:400;color:var(--slate-dim)">(one per line, max 10)</span></label>
      <textarea id="ab-inputs" placeholder="What is recursion?&#10;What is a REST API?&#10;Explain async/await."></textarea>
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
        <button class="btn btn-primary" id="ab-btn" onclick="runABTest()">⊛ Run Experiment</button>
        <div class="loading-row" id="ab-loading" style="display:none;"><span class="spinner"></span> Running experiment — this may take 20–40s…</div>
      </div>
    </div>

    <div id="ab-summary" style="display:none;">
      <div class="card">
        <div class="card-head"><h3>Result</h3></div>
        <div class="kpis" id="ab-kpis"></div>
        <div class="verdict" id="ab-recommendation"></div>
      </div>
    </div>
    <div id="ab-results"></div>
  `;
}

async function runABTest() {
  const a   = document.getElementById("ab-a").value.trim();
  const b   = document.getElementById("ab-b").value.trim();
  const raw = document.getElementById("ab-inputs").value.trim();
  if (!a || !b || !raw) {
    toast("Fill in Prompt A, B, and at least one test input.", "error");
    return;
  }

  const test_inputs = raw.split("\n").map((s) => s.trim()).filter(Boolean);
  if (test_inputs.length > 10) { toast("Maximum 10 test inputs.", "error"); return; }

  setLoading("ab", true);
  document.getElementById("ab-summary").style.display = "none";
  document.getElementById("ab-results").innerHTML = "";

  const { ok, data, error } = await api("/ab-test", {
    method: "POST",
    body: JSON.stringify({ prompt_a: a, prompt_b: b, test_inputs }),
  });
  setLoading("ab", false);

  if (!ok) { toast(error, "error"); return; }

  document.getElementById("ab-summary").style.display = "block";
  document.getElementById("ab-kpis").innerHTML = `
    <div class="kpi"><div class="kv">${data.average_score_a}</div><div class="kl">Avg Score A</div></div>
    <div class="kpi"><div class="kv">${data.average_score_b}</div><div class="kl">Avg Score B</div></div>
    <div class="kpi"><div class="kv" style="color:var(--cyan)">${esc(data.winner)}</div><div class="kl">Winner</div></div>
    <div class="kpi"><div class="kv">${test_inputs.length}</div><div class="kl">Tests Run</div></div>
  `;
  document.getElementById("ab-recommendation").innerHTML =
    `<strong>Recommendation:</strong> ${esc(data.recommendation)}`;

  document.getElementById("ab-results").innerHTML = data.results_per_test
    .map(
      (r, i) => `
    <div class="card">
      <div class="card-head">
        <h3 style="font-size:12.5px;color:var(--slate);">Test ${i + 1}: ${esc(r.test_input)}</h3>
        <span class="badge ${r.winner === "A" ? "" : r.winner === "B" ? "cyan" : "amber"}">${r.winner === "Tie" ? "Tie" : r.winner + " wins"}</span>
      </div>
      <div class="ab-test-cards">
        <div class="ab-result">
          <div class="ab-result-header">
            <div class="ab-prompt-label">Prompt A</div>
            <span class="badge">${r.score_a}/100</span>
          </div>
          <div class="ab-output">${esc(r.output_a)}</div>
        </div>
        <div class="ab-result">
          <div class="ab-result-header">
            <div class="ab-prompt-label">Prompt B</div>
            <span class="badge cyan">${r.score_b}/100</span>
          </div>
          <div class="ab-output">${esc(r.output_b)}</div>
        </div>
      </div>
    </div>
  `
    )
    .join("");

  toast(`Experiment complete — ${data.winner} wins.`, "success");
}
