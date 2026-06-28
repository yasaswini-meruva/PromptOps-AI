"use strict";

/* ── CONFIG ── */
const API_BASE = "http://127.0.0.1:8000";

/* ── AUTHENTICATED FETCH ── */
async function api(path, options = {}) {
  try {
    const authPaths = ["/auth/signup", "/auth/login", "/health", "/"];
    let headers = { "Content-Type": "application/json" };

    if (!authPaths.includes(path)) {
      const token = getAuthToken();
      if (!token) {
        return { ok: false, error: "Not authenticated" };
      }
      headers = { ...headers, Authorization: `Bearer ${token}` };
    }

    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: { ...headers, ...(options.headers || {}) },
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { ok: false, error: body.detail || `Server error (${res.status})` };
    }

    const data = await res.json();
    if (data.error) return { ok: false, error: data.error };
    return { ok: true, data };
  } catch (error) {
    return {
      ok: false,
      error: error.message || `Cannot reach server at ${API_BASE}. Is the backend running?`,
    };
  }
}
