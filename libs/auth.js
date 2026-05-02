export const SESSION_TIMEOUT_MS = 20 * 60 * 1000;
export const SESSION_LAST_ACTIVITY_KEY = "session_last_activity";
export const SESSION_EXPIRED_FLAG = "session_expired";

/**
 * hasAuthSession — returns true if the user has an active session.
 *
 * We use `localStorage['full_name']` as the logged-in signal because the
 * Frappe `sid` session cookie is HttpOnly and cannot be read by JavaScript.
 * `full_name` is written on successful login and cleared on logout.
 */
export function hasAuthSession() {
  if (typeof window === "undefined") {
    return false;
  }

  return Boolean(localStorage.getItem("full_name"));
}

export function touchSessionActivity() {
  if (typeof window === "undefined" || !hasAuthSession()) {
    return;
  }

  localStorage.setItem(SESSION_LAST_ACTIVITY_KEY, String(Date.now()));
}

export function isSessionExpired() {
  if (typeof window === "undefined" || !hasAuthSession()) {
    return false;
  }

  const lastActivity = Number(localStorage.getItem(SESSION_LAST_ACTIVITY_KEY) || 0);

  if (!lastActivity) {
    touchSessionActivity();
    return false;
  }

  return Date.now() - lastActivity > SESSION_TIMEOUT_MS;
}

export function clearAuthSession() {
  if (typeof window === "undefined") {
    return;
  }

  // Clear all frontend state. Do NOT attempt to manually delete the `sid`
  // HttpOnly cookie — it is cleared automatically by the server via
  // Set-Cookie on the /api/method/logout response.
  localStorage.clear();
}

export function redirectToLogin(reason = "expired") {
  if (typeof window === "undefined") {
    return;
  }

  sessionStorage.setItem(SESSION_EXPIRED_FLAG, reason);
  window.location.href = "/login";
}

export function logoutAndRedirect(reason = "expired") {
  clearAuthSession();
  redirectToLogin(reason);
}

export function handleUnauthorizedResponse(response) {
  if (typeof window === "undefined" || !response || response.status !== 401) {
    return false;
  }

  // Only redirect if we were previously logged in
  if (hasAuthSession()) {
    logoutAndRedirect("expired");
    return true;
  }

  return false;
}

export function enforceSessionTimeout() {
  if (!isSessionExpired()) {
    return false;
  }

  logoutAndRedirect("timeout");
  return true;
}
