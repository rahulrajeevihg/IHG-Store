/**
 * Realtime transport for the Product Query Desk chat.
 *
 * Design (see plan "Rebuild the Product Query Desk as a realtime chat"):
 *   - BASE layer: an adaptive HTTP poller over the existing whitelisted methods
 *     (`getProductQuery`, `pollProductQueryUpdates`). It polls fast (~1.2s) while
 *     a thread is active and the tab is visible, backs off to ~4s when idle, and
 *     pauses when the tab is hidden. This is the only path used in production
 *     today and works with the proxied-cookie auth model.
 *   - OPTIONAL accelerator: if `NEXT_PUBLIC_ERP_SOCKET_URL` is set, a socket.io
 *     connection (authenticated by a short-lived ticket, NOT a cross-site cookie)
 *     pushes events. A socket event simply pokes the poller to fetch immediately
 *     and forwards typing events — the poller stays the single source of truth,
 *     so realtime is a pure accelerator and any socket failure degrades silently
 *     to polling.
 *
 * Components consume this via `subscribeToQuery` / `subscribeToBadge` and never
 * need to know which transport delivered an update.
 */

import {
  getProductQuery,
  pollProductQueryUpdates,
  getSocketTicket,
  normalizeProductQueryMessage,
} from "@/libs/api";

const FAST_INTERVAL_MS = 1200;
const SLOW_INTERVAL_MS = 4000;
const IDLE_AFTER_MS = 30000;
const BADGE_INTERVAL_MS = 15000;
const RECONCILE_INTERVAL_MS = 35000; // safety poll even when the socket is healthy

const SOCKET_URL =
  (typeof process !== "undefined" && process.env && process.env.NEXT_PUBLIC_ERP_SOCKET_URL) || "";

const isBrowser = () => typeof window !== "undefined";
const isHidden = () => typeof document !== "undefined" && document.hidden;

// ──────────────────────────────────────────────────────────────────────────────
// Optional shared socket (dormant unless NEXT_PUBLIC_ERP_SOCKET_URL is set)
// ──────────────────────────────────────────────────────────────────────────────
let socketSingleton = null; // { socket, listeners:Map<event,Set<fn>>, refCount }
let socketConnecting = null;

async function ensureSocket() {
  if (!SOCKET_URL || !isBrowser()) return null;
  if (socketSingleton?.socket?.connected) return socketSingleton;
  if (socketConnecting) return socketConnecting;

  socketConnecting = (async () => {
    try {
      const ticketInfo = await getSocketTicket();
      if (!ticketInfo?.ticket) return null;

      // Variable specifier + webpackIgnore keeps the build from trying to bundle
      // socket.io-client (not installed until a gateway is set up). If the module
      // can't be loaded at runtime we just stay on polling.
      const moduleName = "socket.io-client";
      const mod = await import(/* webpackIgnore: true */ moduleName).catch(() => null);
      const io = mod?.io || mod?.default;
      if (typeof io !== "function") return null;

      const socket = io(SOCKET_URL, {
        transports: ["websocket"],
        auth: { ticket: ticketInfo.ticket, user: ticketInfo.user },
        reconnectionDelay: 1000,
        reconnectionDelayMax: 30000,
      });

      const listeners = new Map();
      socketSingleton = { socket, listeners, refCount: 0 };

      const dispatch = (event) => (payload) => {
        const set = listeners.get(event);
        if (set) set.forEach((fn) => { try { fn(payload); } catch (_) {} });
      };
      socket.on("product_query_message", dispatch("product_query_message"));
      socket.on("product_query_typing", dispatch("product_query_typing"));

      return socketSingleton;
    } catch (_) {
      return null;
    } finally {
      socketConnecting = null;
    }
  })();

  return socketConnecting;
}

function addSocketListener(event, fn) {
  let removed = false;
  let attached = null;
  ensureSocket().then((mgr) => {
    if (removed || !mgr) return;
    attached = mgr;
    mgr.refCount += 1;
    if (!mgr.listeners.has(event)) mgr.listeners.set(event, new Set());
    mgr.listeners.get(event).add(fn);
  });

  return () => {
    removed = true;
    if (!attached) return;
    attached.listeners.get(event)?.delete(fn);
    attached.refCount -= 1;
    if (attached.refCount <= 0) {
      try { attached.socket.disconnect(); } catch (_) {}
      if (socketSingleton === attached) socketSingleton = null;
    }
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// subscribeToQuery — live message stream for one thread
// ──────────────────────────────────────────────────────────────────────────────
/**
 * @param {string} queryId
 * @param {object} handlers
 * @param {(msg:object)=>void} handlers.onMessage   normalized new message
 * @param {(detail:object)=>void} handlers.onThread  full normalized detail (query + perms)
 * @param {(payload:object)=>void} handlers.onTyping  {user, sender_name, side, is_typing}
 * @param {string} [handlers.since]  only emit messages created after this timestamp
 * @returns {() => void} unsubscribe
 */
export function subscribeToQuery(queryId, { onMessage, onThread, onTyping, since } = {}) {
  if (!queryId) return () => {};

  let stopped = false;
  let timer = null;
  let inFlight = false;
  let lastTs = since || null;
  let lastActivity = Date.now();

  const schedule = (ms) => {
    if (stopped) return;
    timer = setTimeout(tick, ms);
  };

  async function tick() {
    if (stopped) return;
    if (isHidden()) { schedule(SLOW_INTERVAL_MS); return; }
    if (inFlight) { schedule(FAST_INTERVAL_MS); return; }

    inFlight = true;
    try {
      const detail = await getProductQuery(queryId, lastTs);
      if (!stopped && detail) {
        const messages = Array.isArray(detail.messages) ? detail.messages : [];
        if (messages.length) {
          for (const msg of messages) {
            if (msg?.created_at && (!lastTs || msg.created_at > lastTs)) lastTs = msg.created_at;
            onMessage && onMessage(msg);
          }
          lastActivity = Date.now();
        }
        onThread && onThread(detail);
      }
    } catch (_) {
      /* keep last-good state, no error spam */
    } finally {
      inFlight = false;
    }

    const active = Date.now() - lastActivity < IDLE_AFTER_MS;
    schedule(active ? FAST_INTERVAL_MS : SLOW_INTERVAL_MS);
  }

  // Fetch one increment immediately (used by the socket accelerator).
  const pokeNow = () => {
    lastActivity = Date.now();
    if (timer) clearTimeout(timer);
    tick();
  };

  // Base poller starts right away.
  schedule(FAST_INTERVAL_MS);

  // Optional socket accelerator.
  const detachMsg = addSocketListener("product_query_message", (payload) => {
    if (!payload || payload.query !== queryId) return;
    pokeNow();
  });
  const detachTyping = addSocketListener("product_query_typing", (payload) => {
    if (!payload || payload.query !== queryId) return;
    onTyping && onTyping(payload);
  });

  return () => {
    stopped = true;
    if (timer) clearTimeout(timer);
    detachMsg();
    detachTyping();
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// subscribeToBadge — global unread / open-count stream
// ──────────────────────────────────────────────────────────────────────────────
/**
 * @param {object} handlers
 * @param {(payload:object)=>void} handlers.onBadge  {unread_total, open_count, is_admin, threads}
 * @returns {() => void} unsubscribe
 */
export function subscribeToBadge({ onBadge, onError } = {}) {
  let stopped = false;
  let timer = null;
  let inFlight = false;
  let debounce = null;

  const schedule = (ms) => {
    if (stopped) return;
    timer = setTimeout(tick, ms);
  };

  async function tick() {
    if (stopped) return;
    if (isHidden()) { schedule(BADGE_INTERVAL_MS); return; }
    if (inFlight) { schedule(BADGE_INTERVAL_MS); return; }
    inFlight = true;
    try {
      const payload = await pollProductQueryUpdates();
      if (!stopped && payload) onBadge && onBadge(payload);
    } catch (error) {
      // Surface a hard "not deployed" signal so the caller can hide the badge;
      // transient failures are otherwise ignored (last-good state kept).
      if (!stopped && onError) onError(error);
    } finally {
      inFlight = false;
    }
    // Without a socket, poll on the base interval. With a socket healthy, this
    // doubles as the slow reconcile.
    schedule(SOCKET_URL && socketSingleton?.socket?.connected ? RECONCILE_INTERVAL_MS : BADGE_INTERVAL_MS);
  }

  schedule(0);

  // Socket accelerator: any thread message → recompute the badge promptly.
  const detach = addSocketListener("product_query_message", () => {
    if (debounce) clearTimeout(debounce);
    debounce = setTimeout(() => { if (!stopped && !inFlight) tick(); }, 400);
  });

  return () => {
    stopped = true;
    if (timer) clearTimeout(timer);
    if (debounce) clearTimeout(debounce);
    detach();
  };
}
