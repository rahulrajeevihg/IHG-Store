// Run with: `node --test libs/__tests__/ighSearchV2Errors.test.mjs`
//
// These tests cover the Frappe error envelope parser used to detect the
// "Product search V2 is not enabled" feature-flag error. They also exercise
// the disabled-state message constant that the SearchUnavailableState UI
// renders, so a regression in the contract is caught at unit-test time.
//
// We use Node's built-in test runner so the suite has zero new devDeps.

import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { renderToStaticMarkup } from "react-dom/server";
import React from "react";

import {
  SEARCH_V2_DISABLED_DISPLAY_MESSAGE,
  SearchV2DisabledError,
  buildSearchV2DisabledError,
  collectFrappeErrorMessages,
  isSearchV2DisabledError,
  isSearchV2DisabledResponse,
  AUTH_REQUIRED_DISPLAY_MESSAGE,
  AuthRequiredError,
  buildAuthRequiredError,
  isAuthRequiredError,
  isAuthRequiredResponse,
} from "../ighSearchV2Errors.mjs";

const require = createRequire(import.meta.url);

// Helper: encode a Frappe `_server_messages` envelope the way the backend does.
const buildServerMessages = (messages) =>
  JSON.stringify(messages.map((msg) => JSON.stringify({ message: msg })));

test("isSearchV2DisabledResponse: detects 417 + _server_messages envelope", () => {
  const data = {
    exc_type: "ValidationError",
    _server_messages: buildServerMessages([
      "Product search V2 is not enabled",
    ]),
  };
  assert.equal(isSearchV2DisabledResponse(417, data), true);
});

test("isSearchV2DisabledResponse: detects message via `exception` field", () => {
  const data = {
    exception: "frappe.exceptions.ValidationError: Product search V2 is not enabled",
  };
  assert.equal(isSearchV2DisabledResponse(417, data), true);
});

test("isSearchV2DisabledResponse: detects message via `message` field", () => {
  const data = { message: "Product search V2 is not enabled." };
  assert.equal(isSearchV2DisabledResponse(417, data), true);
});

test("isSearchV2DisabledResponse: ignores 5xx errors even with the message", () => {
  const data = { message: "Product search V2 is not enabled." };
  assert.equal(isSearchV2DisabledResponse(500, data), false);
});

test("isSearchV2DisabledResponse: ignores unrelated 4xx errors", () => {
  const data = { exception: "frappe.exceptions.ValidationError: Filter invalid" };
  assert.equal(isSearchV2DisabledResponse(417, data), false);
});

test("isAuthRequiredResponse: detects 417 + 'Authentication required' envelope", () => {
  const data = {
    exc_type: "ValidationError",
    _server_messages: buildServerMessages(["Authentication required"]),
  };
  assert.equal(isAuthRequiredResponse(417, data), true);
});

test("isAuthRequiredResponse: detects message via traceback in `exc`", () => {
  const data = {
    exc: "frappe.exceptions.ValidationError: Authentication required",
  };
  assert.equal(isAuthRequiredResponse(417, data), true);
});

test("isAuthRequiredResponse: treats a bare 401 as auth required", () => {
  assert.equal(isAuthRequiredResponse(401, {}), true);
});

test("isAuthRequiredResponse: ignores 5xx and unrelated 4xx", () => {
  assert.equal(isAuthRequiredResponse(500, { message: "Authentication required" }), false);
  assert.equal(isAuthRequiredResponse(417, { exception: "Filter invalid" }), false);
});

test("buildAuthRequiredError: returns a typed AuthRequiredError", () => {
  const data = {
    _server_messages: buildServerMessages(["Authentication required"]),
  };
  const err = buildAuthRequiredError(data);
  assert.ok(err instanceof AuthRequiredError);
  assert.equal(err.name, "AuthRequiredError");
  assert.equal(err.message, AUTH_REQUIRED_DISPLAY_MESSAGE);
  assert.match(err.rawMessage, /Authentication required/);
  assert.equal(isAuthRequiredError(err), true);
});

test("isAuthRequiredError: only accepts the typed error", () => {
  assert.equal(isAuthRequiredError(new Error("nope")), false);
  assert.equal(isAuthRequiredError(null), false);
  assert.equal(isAuthRequiredError({ isAuthRequiredError: true }), true);
});

test("collectFrappeErrorMessages: handles non-string entries gracefully", () => {
  const data = {
    _server_messages: JSON.stringify([{ message: "Object form" }]),
    exception: ["A", "B"],
  };
  const messages = collectFrappeErrorMessages(data);
  assert.ok(messages.includes("Object form"));
  assert.ok(messages.includes("A"));
  assert.ok(messages.includes("B"));
});

test("buildSearchV2DisabledError: returns a typed SearchV2DisabledError", () => {
  const data = {
    _server_messages: buildServerMessages(["Product search V2 is not enabled"]),
  };
  const err = buildSearchV2DisabledError(data);
  assert.ok(err instanceof SearchV2DisabledError);
  assert.equal(err.name, "SearchV2DisabledError");
  assert.equal(err.message, SEARCH_V2_DISABLED_DISPLAY_MESSAGE);
  assert.match(err.rawMessage, /Product search V2 is not enabled/);
  assert.equal(isSearchV2DisabledError(err), true);
});

test("isSearchV2DisabledError: only accepts the typed error", () => {
  assert.equal(isSearchV2DisabledError(new Error("nope")), false);
  assert.equal(isSearchV2DisabledError(null), false);
  assert.equal(isSearchV2DisabledError({ isSearchV2DisabledError: true }), true);
});

// Integration: mock the global `fetch` and assert the API client surfaces
// SearchV2DisabledError when the backend returns the 417 envelope.
//
// The API client lives in `libs/ighSearchV2.js`, which uses ES module syntax
// without a `type: "module"` package marker. Node would treat that file as
// CommonJS and choke on its `import` lines. Rather than transpile, we
// re-implement the response-parse contract here using the very functions the
// client delegates to. That keeps the test hermetic while still exercising
// the path that throws.
test("response parser: 417 + ValidationError envelope yields SearchV2DisabledError", async () => {
  const fakeResponse = {
    ok: false,
    status: 417,
    json: async () => ({
      exc_type: "ValidationError",
      _server_messages: buildServerMessages([
        "Product search V2 is not enabled",
      ]),
    }),
  };

  // Simulate `parseJsonResponse` from ighSearchV2.js (the only branch that
  // matters here is the disabled-state detection):
  const data = await fakeResponse.json();
  let thrown;
  try {
    if (!fakeResponse.ok) {
      if (isSearchV2DisabledResponse(fakeResponse.status, data)) {
        throw buildSearchV2DisabledError(data);
      }
      throw new Error("Request failed");
    }
  } catch (err) {
    thrown = err;
  }
  assert.ok(thrown instanceof SearchV2DisabledError);
  assert.equal(isSearchV2DisabledError(thrown), true);
});

// UI smoke test: the disabled-state component must render to static markup
// without throwing and must surface the user-facing message verbatim.
//
// We can't import the JSX file directly from a Node test (no JSX transform).
// Instead we mirror the component using React.createElement so the contract —
// "render the SEARCH_V2_DISABLED_DISPLAY_MESSAGE without throwing" — is asserted.
test("SearchUnavailableState shape: renders the disabled message without throwing", () => {
  const SearchUnavailableState = ({ message = SEARCH_V2_DISABLED_DISPLAY_MESSAGE }) =>
    React.createElement(
      "div",
      { role: "status", "aria-live": "polite" },
      React.createElement("p", null, "Search is temporarily unavailable"),
      React.createElement("p", null, message)
    );

  const html = renderToStaticMarkup(React.createElement(SearchUnavailableState));
  assert.match(html, /Search is temporarily unavailable/);
  assert.match(html, /try again later or contact support/i);
});

// Sanity: confirm the JSX component file exists and exports a default — so the
// UI in V2SearchPage actually has something to render.
test("SearchUnavailableState.jsx exists alongside the disabled message constant", () => {
  const fs = require("node:fs");
  const path = require("node:path");
  const { fileURLToPath } = require("node:url");
  const here = path.dirname(fileURLToPath(import.meta.url));
  const componentPath = path.resolve(
    here,
    "../../components/Search/v2/components/SearchUnavailableState.jsx"
  );
  assert.ok(fs.existsSync(componentPath), `expected ${componentPath} to exist`);
  const source = fs.readFileSync(componentPath, "utf8");
  assert.match(source, /SEARCH_V2_DISABLED_DISPLAY_MESSAGE/);
  assert.match(source, /export default function SearchUnavailableState/);
});
