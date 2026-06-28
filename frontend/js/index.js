"use strict";

/* ─────────────────────────────────────────────────────
   APP ENTRY POINT
   Runs after all other scripts have loaded.
   Responsibilities:
     1. Wire static DOM event listeners (logout button)
     2. Build the sidebar navigation
     3. Verify auth token, then navigate to Dashboard
───────────────────────────────────────────────────── */

/* ── Logout button ── */
const logoutButton = document.getElementById("logout-button");
if (logoutButton) {
  logoutButton.addEventListener("click", () => {
    clearAuthToken();
    redirectToLogin();
  });
}

/* ── Build sidebar nav from PAGES registry ── */
buildNav();

/* ── Auth check → boot ── */
verifyAuthToken().then((authenticated) => {
  if (authenticated) {
    goTo("home");
  }
});
