export const SESSION_TIMEOUT_MS = 20 * 60 * 1000;
export const SESSION_LAST_ACTIVITY_KEY = "session_last_activity";
export const SESSION_EXPIRED_FLAG = "session_expired";

export function hasAuthSession() {
  if (typeof window === "undefined") {
    return false;
  }

  return Boolean(localStorage.getItem("api_key") && localStorage.getItem("api_secret"));
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

  localStorage.clear();
  document.cookie.split(";").forEach((cookie) => {
    const cookieName = cookie.split("=")[0]?.trim();
    if (cookieName) {
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    }
  });
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

  logoutAndRedirect("expired");
  return true;
}

export function enforceSessionTimeout() {
  if (!isSessionExpired()) {
    return false;
  }

  logoutAndRedirect("timeout");
  return true;
}
