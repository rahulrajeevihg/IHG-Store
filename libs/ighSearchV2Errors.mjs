// Pure-ESM helpers for detecting the "search V2 disabled" state surfaced by
// the ERP backend when `igh_search_v2_query_enabled` is off in site_config.
// Kept in a .mjs file so it is directly importable from a `node:test` runner
// without a bundler.

export const SEARCH_V2_DISABLED_MESSAGE_PATTERN =
  /product\s+search\s+v2\s+is\s+not\s+enabled/i;

export const SEARCH_V2_DISABLED_DISPLAY_MESSAGE =
  "Search is temporarily unavailable. Please try again later or contact support.";

export class SearchV2DisabledError extends Error {
  constructor(rawMessage) {
    super(SEARCH_V2_DISABLED_DISPLAY_MESSAGE);
    this.name = "SearchV2DisabledError";
    this.isSearchV2DisabledError = true;
    this.rawMessage = rawMessage || "Product search V2 is not enabled.";
  }
}

export const isSearchV2DisabledError = (error) =>
  Boolean(
    error &&
      (error.name === "SearchV2DisabledError" ||
        error.isSearchV2DisabledError === true)
  );

const pushIfString = (target, value) => {
  if (typeof value === "string" && value.trim() !== "") {
    target.push(value);
  }
};

// Frappe wraps user-facing errors in `_server_messages` as a JSON-encoded array
// of JSON-encoded message objects. Other shapes seen in the wild: `exception`
// (string or array), `exc` (string or array), `message` (string or { message }).
export const collectFrappeErrorMessages = (data) => {
  const messages = [];
  if (!data || typeof data !== "object") return messages;

  if (typeof data._server_messages === "string") {
    try {
      const outer = JSON.parse(data._server_messages);
      if (Array.isArray(outer)) {
        for (const entry of outer) {
          if (typeof entry === "string") {
            try {
              const inner = JSON.parse(entry);
              pushIfString(messages, inner?.message);
              pushIfString(messages, inner?.raw_message);
            } catch {
              pushIfString(messages, entry);
            }
          } else if (entry && typeof entry === "object") {
            pushIfString(messages, entry.message);
            pushIfString(messages, entry.raw_message);
          }
        }
      }
    } catch {
      // ignore
    }
  }

  if (Array.isArray(data.exception)) {
    data.exception.forEach((entry) => pushIfString(messages, entry));
  } else {
    pushIfString(messages, data.exception);
  }

  if (Array.isArray(data.exc)) {
    data.exc.forEach((entry) => pushIfString(messages, entry));
  } else {
    pushIfString(messages, data.exc);
  }

  if (typeof data.message === "string") {
    pushIfString(messages, data.message);
  } else if (data.message && typeof data.message === "object") {
    pushIfString(messages, data.message.message);
  }

  return messages;
};

// Returns true when the response envelope unambiguously indicates the V2 search
// feature flag is off. We accept any 4xx response whose payload carries the
// known message — the canonical case from Frappe is HTTP 417 + ValidationError,
// but we don't require an exact exc_type match because Frappe sometimes omits it
// from the envelope.
export const isSearchV2DisabledResponse = (status, data) => {
  if (typeof status === "number" && status >= 500) return false;
  const messages = collectFrappeErrorMessages(data);
  return messages.some((msg) => SEARCH_V2_DISABLED_MESSAGE_PATTERN.test(msg));
};

export const buildSearchV2DisabledError = (data) => {
  const messages = collectFrappeErrorMessages(data);
  const raw = messages.find((msg) => SEARCH_V2_DISABLED_MESSAGE_PATTERN.test(msg));
  return new SearchV2DisabledError(raw);
};
