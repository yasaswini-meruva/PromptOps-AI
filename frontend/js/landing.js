"use strict";

/* ── Cursor glow ── */
const glow = document.getElementById("glow");
let rafId;
window.addEventListener("mousemove", (e) => {
  cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(() => {
    glow.style.left = e.clientX + "px";
    glow.style.top = e.clientY + "px";
  });
}, { passive: true });

/* ── Bento card mouse tracking ── */
document.querySelectorAll(".bcard").forEach((card) => {
  card.addEventListener("mousemove", (e) => {
    const r = card.getBoundingClientRect();
    card.style.setProperty("--mx", (e.clientX - r.left) + "px");
    card.style.setProperty("--my", (e.clientY - r.top) + "px");
  }, { passive: true });
});

/* ── Particles ── */
const stage = document.getElementById("orbStage");
for (let i = 0; i < 18; i++) {
  const p = document.createElement("div");
  p.className = "particle";
  const angle = Math.random() * Math.PI * 2;
  const dist = 110 + Math.random() * 140;
  p.style.setProperty("--dx", Math.cos(angle) * dist + "px");
  p.style.setProperty("--dy", Math.sin(angle) * dist + "px");
  p.style.left = "50%";
  p.style.top = "50%";
  p.style.animationDuration = (3 + Math.random() * 4) + "s";
  p.style.animationDelay = (Math.random() * 5) + "s";
  stage.appendChild(p);
}

/* ── Typed text animation ── */
const typedEl = document.getElementById("typed-text");
const text = "Write a system prompt for a RAG-based support agent that cites sources and replies in under 120 words.";
let i = 0;
function type() {
  if (i <= text.length) {
    typedEl.innerHTML = text.slice(0, i) + '<span class="cursor-blink" aria-hidden="true"></span>';
    i++;
    setTimeout(type, i === 1 ? 600 : 20);
  }
}
type();

/* ── Dashboard bars ── */
const barsEl = document.getElementById("bars");
const heights = [40, 68, 54, 92, 72, 100, 60, 84, 48, 76];
heights.forEach((h) => {
  const b = document.createElement("div");
  b.className = "bar";
  b.style.height = "0%";
  barsEl.appendChild(b);
  requestAnimationFrame(() => setTimeout(() => {
    b.style.transition = "height 1s ease";
    b.style.height = h + "%";
  }, 200));
});

/* ── Scroll reveal ── */
const reveals = document.querySelectorAll(".reveal");
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("in");
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });
reveals.forEach((r) => observer.observe(r));
