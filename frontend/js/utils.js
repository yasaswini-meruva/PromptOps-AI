"use strict";

/* ── HTML ESCAPE ── */
function esc(str) {
  const d = document.createElement("div");
  d.textContent = String(str ?? "");
  return d.innerHTML;
}

/* ── TOAST NOTIFICATIONS ── */
function toast(message, type = "info") {
  const container = document.getElementById("toast-container");
  const el = document.createElement("div");
  el.className = `toast ${type === "error" ? "error" : type === "success" ? "success" : ""}`;
  el.textContent = message;
  container.appendChild(el);
  setTimeout(() => {
    el.style.transition = "opacity 0.3s, transform 0.3s";
    el.style.opacity = "0";
    el.style.transform = "translateX(12px)";
    setTimeout(() => el.remove(), 350);
  }, 3800);
}

/* ── CLIPBOARD ── */
function copyText(elementId) {
  const el = document.getElementById(elementId);
  if (!el) return;
  navigator.clipboard.writeText(el.textContent.trim()).then(() =>
    toast("Copied to clipboard.", "success")
  );
}

function copyRaw(text) {
  navigator.clipboard.writeText(text).then(() =>
    toast("Copied to clipboard.", "success")
  );
}

/* ── LOADING STATE ── */
function setLoading(prefix, on) {
  const btn = document.getElementById(`${prefix}-btn`);
  const loading = document.getElementById(`${prefix}-loading`);
  if (btn) btn.disabled = on;
  if (loading) loading.style.display = on ? "flex" : "none";
}

/* ── INLINE ERROR BOX ── */
function showError(elId, message) {
  const el = document.getElementById(elId);
  if (!el) return;
  el.textContent = message;
  el.classList.add("show");
}
