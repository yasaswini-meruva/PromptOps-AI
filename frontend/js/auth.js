"use strict";

/* ── TOKEN STORAGE ── */
const AUTH_STORAGE_KEY = "promptops_auth_token";

function getAuthToken() {
  return localStorage.getItem(AUTH_STORAGE_KEY);
}

function clearAuthToken() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

function redirectToLogin() {
  window.location.href = "login.html";
}

/* ── VERIFY ON PAGE LOAD ── */
async function verifyAuthToken() {
  const token = getAuthToken();
  if (!token) {
    redirectToLogin();
    return false;
  }

  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      clearAuthToken();
      redirectToLogin();
      return false;
    }
    return true;
  } catch (error) {
    toast("Unable to verify authentication. Check your connection.", "error");
    clearAuthToken();
    redirectToLogin();
    return false;
  }
}
