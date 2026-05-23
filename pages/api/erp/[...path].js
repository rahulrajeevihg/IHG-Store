/**
 * ERP Cookie-Forwarding Proxy
 *
 * Why this exists:
 *   Next.js `rewrites()` does NOT forward the browser's cookies to the upstream
 *   server because the cookies are scoped to the Next.js dev/prod domain, not
 *   the ERP server's domain. This means the ERP receives requests with no `sid`
 *   cookie, identifies the user as Guest/None, and throws "User None is disabled".
 *
 *   This API route solves it by acting as a true proxy: it reads `req.headers.cookie`
 *   (which the browser sends to Next.js) and forwards it verbatim to the ERP, so
 *   the ERP sees the valid `sid` session cookie.
 *
 * Usage:
 *   All ERP API calls should use `/erp-proxy/api/method/...` instead of `/api/method/...`
 */

const ERP_BASE_URL = process.env.ERP_BASE_URL || 'https://erp.ihgind.com';
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);
const MAX_UPSTREAM_REDIRECTS = 5;
const MAX_FETCH_ATTEMPTS = 2;
const UPSTREAM_TIMEOUT_MS = 30000;
const STOCK_RECONCILE_METHODS = ['search_products_v2', 'ai_search_products_v2'];
const ERP_GET_PRODUCT_INFO_METHOD = 'igh_search.igh_search.api.get_product_details';
const STOCK_RECONCILE_MAX_HITS = Number(process.env.ERP_STOCK_RECONCILE_MAX_HITS || 20);
const POST_ONLY_MUTATION_METHODS = new Set([
  'insert_cart_items',
  'update_cartitem',
  'delete_cart_items',
  'clear_cartitem',
  'move_all_tocart',
  'start_guided_ai_search',
  'continue_guided_ai_search',
  'create_product_query',
  'post_product_query_message',
  'mark_product_query_read',
  'escalate_product_query_to_ticket',
  'update_product_query',
  'resolve_product_query',
  'rate_product_query_solution',
  'reopen_product_query',
]);

export const config = {
  api: {
    // Allow body to be consumed by us, not Next.js
    bodyParser: false,
  },
};

async function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

async function fetchUpstreamWithRetry(url, options) {
  let lastError;

  for (let attempt = 1; attempt <= MAX_FETCH_ATTEMPTS; attempt += 1) {
    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => {
      timeoutController.abort(new DOMException('Upstream request timed out', 'TimeoutError'));
    }, UPSTREAM_TIMEOUT_MS);

    const mergedSignal = timeoutController.signal;
    try {
      return await fetch(url, {
        ...options,
        signal: mergedSignal,
      });
    } catch (error) {
      lastError = error;
      if (error?.name === 'TimeoutError' || error?.message?.toLowerCase?.().includes('timed out')) {
        lastError.__proxy_timeout = true;
      }
      console.error(
        `[ERP Proxy] Upstream fetch attempt ${attempt}/${MAX_FETCH_ATTEMPTS} failed:`,
        error?.message,
        error?.cause?.message || ''
      );

      if (attempt < MAX_FETCH_ATTEMPTS) {
        await new Promise((resolve) => setTimeout(resolve, 250 * attempt));
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }

  throw lastError;
}

function normalizeSetCookieForProxy(cookieValue, req) {
  if (!cookieValue || typeof cookieValue !== 'string') return cookieValue;

  const host = (req?.headers?.host || '').split(':')[0]?.toLowerCase() || '';
  const xfProto = req?.headers?.['x-forwarded-proto'];
  const protoHeader = Array.isArray(xfProto) ? xfProto[0] : xfProto;
  const isHttps = String(protoHeader || '').toLowerCase() === 'https';
  const isLocalhost = host === 'localhost' || host === '127.0.0.1';

  let normalized = cookieValue;

  // Host-only cookies are safer for our proxy origin; Domain from ERP can break
  // local/dev session persistence when proxying across hosts.
  normalized = normalized.replace(/;\s*Domain=[^;]*/gi, '');

  if (isLocalhost && !isHttps) {
    // On local HTTP, Secure cookies may be ignored by some browsers.
    normalized = normalized.replace(/;\s*Secure/gi, '');
    // SameSite=None requires Secure; downgrade to Lax for localhost HTTP.
    normalized = normalized.replace(/;\s*SameSite=None/gi, '; SameSite=Lax');
  }

  return normalized;
}

function parseJsonSafe(value) {
  if (!value || typeof value !== 'string') return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function looksLikeSku(value) {
  const trimmed = String(value || '').trim();
  if (!trimmed || trimmed.length < 6) return false;
  return /[A-Za-z]/.test(trimmed) && /[0-9]/.test(trimmed) && /[.\-_/]/.test(trimmed);
}

function extractTargetSkuFromSearchPayload(payload) {
  if (!payload || typeof payload !== 'object') return '';

  const hint = String(payload.item_code_hint || '').trim();
  if (hint) return hint;

  const query = String(payload.query || payload.q || '').trim();
  if (query && looksLikeSku(query)) return query;

  return '';
}

function getMethodNameFromPath(path = '') {
  return STOCK_RECONCILE_METHODS.find((methodName) => path.includes(methodName)) || '';
}

async function fetchLiveStockForItem(itemCode, forwardHeaders) {
  if (!itemCode) return null;

  const response = await fetch(`${ERP_BASE_URL}/api/method/${ERP_GET_PRODUCT_INFO_METHOD}`, {
    method: 'POST',
    headers: {
      ...forwardHeaders,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ item_code: itemCode }),
    redirect: 'manual',
  });

  if (!response.ok) {
    return null;
  }

  const payload = await response.json().catch(() => null);
  const data = payload?.message || payload;
  if (!data || typeof data !== 'object') {
    return null;
  }

  const totalStock = Number(data.total_stock);
  const freshnessTs = new Date().toISOString();
  return {
    item_code: String(data.item_code || itemCode),
    total_stock: Number.isFinite(totalStock) ? totalStock : 0,
    in_stock:
      data.in_stock === true ||
      data.in_stock === 1 ||
      data.in_stock === '1' ||
      (Number.isFinite(totalStock) && totalStock > 0),
    stock_freshness_source: 'runtime_reconciled',
    stock_freshness_ts: freshnessTs,
  };
}

function applyStockOverrideToHits(hits = [], stockOverride = null) {
  if (!Array.isArray(hits) || !stockOverride?.item_code) return hits;

  const targetSku = String(stockOverride.item_code).trim().toLowerCase();
  if (!targetSku) return hits;

  return hits.map((hit) => {
    const safeHit = hit && typeof hit === 'object' ? hit : {};
    const doc = safeHit?.document && typeof safeHit.document === 'object' ? safeHit.document : safeHit;
    const itemCode = String(doc?.item_code || doc?.name || '').trim().toLowerCase();
    if (!itemCode || itemCode !== targetSku) {
      return hit;
    }

    const nextDoc = {
      ...doc,
      stock: stockOverride.total_stock,
      total_stock: stockOverride.total_stock,
      in_stock: stockOverride.in_stock ? 1 : 0,
      stock_freshness_source: stockOverride.stock_freshness_source || 'runtime_reconciled',
      stock_freshness_ts: stockOverride.stock_freshness_ts || new Date().toISOString(),
    };

    if (safeHit?.document && typeof safeHit.document === 'object') {
      return {
        ...safeHit,
        document: nextDoc,
      };
    }

    return nextDoc;
  });
}

function extractItemCodeFromHit(hit) {
  const safeHit = hit && typeof hit === 'object' ? hit : {};
  const doc = safeHit?.document && typeof safeHit.document === 'object' ? safeHit.document : safeHit;
  return String(doc?.item_code || doc?.name || '').trim();
}

async function fetchLiveStocksForItems(itemCodes = [], forwardHeaders) {
  const deduped = Array.from(
    new Set(
      (Array.isArray(itemCodes) ? itemCodes : [])
        .map((value) => String(value || '').trim())
        .filter(Boolean)
    )
  );

  const result = new Map();
  const maxItems = Math.min(Math.max(STOCK_RECONCILE_MAX_HITS, 0), deduped.length);
  for (let index = 0; index < maxItems; index += 1) {
    const itemCode = deduped[index];
    const liveStock = await fetchLiveStockForItem(itemCode, forwardHeaders);
    if (!liveStock) continue;
    result.set(String(liveStock.item_code || itemCode).trim().toLowerCase(), liveStock);
  }

  return result;
}

function applyStockMapToHits(hits = [], stockMap = new Map()) {
  if (!Array.isArray(hits) || !(stockMap instanceof Map) || stockMap.size === 0) {
    return hits;
  }

  return hits.map((hit) => {
    const safeHit = hit && typeof hit === 'object' ? hit : {};
    const doc = safeHit?.document && typeof safeHit.document === 'object' ? safeHit.document : safeHit;
    const itemCode = String(doc?.item_code || doc?.name || '').trim().toLowerCase();
    if (!itemCode || !stockMap.has(itemCode)) {
      return hit;
    }

    const liveStock = stockMap.get(itemCode);
    const nextDoc = {
      ...doc,
      stock: liveStock.total_stock,
      total_stock: liveStock.total_stock,
      in_stock: liveStock.in_stock ? 1 : 0,
      stock_freshness_source: liveStock.stock_freshness_source || 'runtime_reconciled',
      stock_freshness_ts: liveStock.stock_freshness_ts || new Date().toISOString(),
    };

    if (safeHit?.document && typeof safeHit.document === 'object') {
      return {
        ...safeHit,
        document: nextDoc,
      };
    }

    return nextDoc;
  });
}

export default async function handler(req, res) {
  const { path } = req.query;

  // Reconstruct the upstream path: /api/method/... or /api/resource/...
  const upstreamPath = Array.isArray(path) ? path.join('/') : path;
  const requestUrl = new URL(req.url, `http://localhost`);
  requestUrl.searchParams.delete('path'); // remove the catch-all param
  const queryString = requestUrl.search; // e.g. "?country=UAE" or ""
  const upstreamUrl = `${ERP_BASE_URL}/${upstreamPath}${queryString}`;
  const matchedMutationMethod = Array.from(POST_ONLY_MUTATION_METHODS).find((methodName) =>
    upstreamPath?.includes(methodName)
  );

  if (matchedMutationMethod && req.method !== 'POST') {
    const referer = req.headers.referer || '';
    const origin = req.headers.origin || '';
    const userAgent = req.headers['user-agent'] || '';
    const xForwardedFor = req.headers['x-forwarded-for'] || '';
    const realIp = req.headers['x-real-ip'] || '';
    const clientIp = (Array.isArray(xForwardedFor) ? xForwardedFor[0] : xForwardedFor)?.split(',')[0]?.trim() || realIp || req.socket?.remoteAddress || '';

    console.warn('[ERP Proxy] Rejected non-POST mutation request', {
      received_method: req.method,
      required_method: 'POST',
      method_name: matchedMutationMethod,
      upstream_path: upstreamPath,
      upstream_url: upstreamUrl,
      referer,
      origin,
      user_agent: userAgent,
      client_ip: clientIp,
    });

    return res.status(405).json({
      message: `Method ${req.method} not allowed. Allowed methods: POST`,
      received_method: req.method,
      required_method: 'POST',
      method_name: matchedMutationMethod,
    });
  }

  if (matchedMutationMethod && req.method === 'POST') {
    const cookieHeader = req.headers.cookie || '';
    const hasSidCookie = /(?:^|;\s*)sid=/.test(cookieHeader);
    const hasCsrfCookie = /(?:^|;\s*)csrf_token=/.test(cookieHeader);
    const referer = req.headers.referer || '';
    const origin = req.headers.origin || '';

    console.info('[ERP Proxy] Mutation POST auth context', {
      method_name: matchedMutationMethod,
      upstream_path: upstreamPath,
      has_sid_cookie: hasSidCookie,
      has_csrf_cookie: hasCsrfCookie,
      referer,
      origin,
    });
  }

  // Build forwarded headers — critically including the browser's cookies
  const forwardHeaders = {
    'Content-Type': req.headers['content-type'] || 'application/json',
    'Accept': req.headers['accept'] || 'application/json',
    'Connection': 'close',
  };

  // Forward the browser's cookies verbatim — this is the key fix
  if (req.headers.cookie) {
    forwardHeaders['Cookie'] = req.headers.cookie;
  }

  // Forward CSRF token: prefer the explicit header set by postMethod (most reliable),
  // fall back to extracting it from the cookie string.
  if (req.headers['x-frappe-csrf-token']) {
    forwardHeaders['X-Frappe-CSRF-Token'] = req.headers['x-frappe-csrf-token'];
  } else if (req.headers.cookie) {
    const csrfMatch = req.headers.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
    if (csrfMatch) {
      forwardHeaders['X-Frappe-CSRF-Token'] = decodeURIComponent(csrfMatch[1]);
    }
  }

  // Forward Authorization header only if the client sends it
  // (used only for unauthenticated/system-level calls)
  if (req.headers.authorization) {
    forwardHeaders['Authorization'] = req.headers.authorization;
  }

  // Forward request body for POST/PUT/PATCH
  let body;
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    body = await readBody(req);
  }

  try {
    const startedAt = Date.now();
    const startedAtIso = new Date(startedAt).toISOString();
    console.log('[ERP Proxy] Forwarding to:', upstreamUrl);
    console.log('[ERP Proxy] Method:', req.method);
    console.log('[ERP Proxy] Headers:', forwardHeaders);
    console.log('[ERP Proxy] started_at:', startedAtIso);
    if (body) console.log('[ERP Proxy] Body:', body.toString());

    let finalResponse = null;
    let currentUrl = upstreamUrl;
    let currentMethod = req.method;
    let redirectCount = 0;

    while (redirectCount <= MAX_UPSTREAM_REDIRECTS) {
      const currentBody =
        ['POST', 'PUT', 'PATCH', 'DELETE'].includes(currentMethod) && body && body.length > 0
          ? body
          : undefined;

      const erpResponse = await fetchUpstreamWithRetry(currentUrl, {
        method: currentMethod,
        headers: forwardHeaders,
        body: currentBody,
        // Important: manual redirect handling prevents 301/302 from silently
        // changing write methods to GET.
        redirect: 'manual',
      });

      if (!REDIRECT_STATUSES.has(erpResponse.status)) {
        finalResponse = erpResponse;
        break;
      }

      const location = erpResponse.headers.get('location');
      console.warn(
        '[ERP Proxy] Upstream redirect:',
        erpResponse.status,
        'from',
        currentUrl,
        'to',
        location
      );

      if (!location) {
        finalResponse = erpResponse;
        break;
      }

      currentUrl = new URL(location, currentUrl).toString();
      redirectCount += 1;

      if (erpResponse.status === 303) {
        currentMethod = 'GET';
      }
    }

    if (!finalResponse) {
      throw new Error('Too many upstream redirects while contacting ERP');
    }

    // Forward all response headers from ERP back to the browser.
    // Critically: Content-Type must be forwarded so the client can
    // correctly parse the response (e.g. application/json for API calls).
    const headersToForward = [
      'content-type',
      'x-frame-options',
      'cache-control',
    ];
    headersToForward.forEach((header) => {
      const value = finalResponse.headers.get(header);
      if (value) {
        res.setHeader(header, value);
      }
    });

    // Forward Set-Cookie headers — must use getAll() to handle multiple cookies.
    // Each Frappe login sets multiple cookies (sid, user_id, full_name, etc.).
    const setCookies = finalResponse.headers.getSetCookie
      ? finalResponse.headers.getSetCookie()
      : finalResponse.headers.get('set-cookie')
        ? [finalResponse.headers.get('set-cookie')]
        : [];
    if (setCookies.length > 0) {
      const normalizedCookies = setCookies
        .map((cookieValue) => normalizeSetCookieForProxy(cookieValue, req))
        .filter(Boolean);
      res.setHeader('Set-Cookie', normalizedCookies);
    }

    // Forward response status
    res.status(finalResponse.status);

    // Forward response body
    let responseBody = await finalResponse.text();
    const matchedStockMethod = getMethodNameFromPath(upstreamPath || '');
    // Proxy-side stock reconciliation is OFF by default. The backend
    // search_products_v2 now reconciles the full returned page in a single
    // batched SQL (get_authoritative_stock_snapshot), so the old behaviour of
    // firing up to STOCK_RECONCILE_MAX_HITS sequential get_product_details
    // calls here only added latency. Set ERP_PROXY_STOCK_RECONCILE=1 to restore.
    const proxyStockReconcileEnabled = process.env.ERP_PROXY_STOCK_RECONCILE === '1';
    const shouldAttemptStockReconcile =
      proxyStockReconcileEnabled &&
      Boolean(matchedStockMethod) &&
      finalResponse.status === 200 &&
      String(finalResponse.headers.get('content-type') || '').includes('application/json');

    if (shouldAttemptStockReconcile) {
      try {
        const parsedRequest = body ? parseJsonSafe(body.toString()) : null;
        const targetSku = extractTargetSkuFromSearchPayload(parsedRequest);
        const parsedResponse = parseJsonSafe(responseBody);
        const messageBlock =
          parsedResponse?.message && typeof parsedResponse.message === 'object'
            ? parsedResponse.message
            : parsedResponse;

        if (messageBlock && Array.isArray(messageBlock.hits)) {
          if (targetSku) {
            const liveStock = await fetchLiveStockForItem(targetSku, forwardHeaders);
            if (liveStock) {
              const patchedHits = applyStockOverrideToHits(messageBlock.hits, liveStock);
              if (parsedResponse?.message && typeof parsedResponse.message === 'object') {
                parsedResponse.message = {
                  ...parsedResponse.message,
                  hits: patchedHits,
                };
              } else if (parsedResponse && typeof parsedResponse === 'object') {
                parsedResponse.hits = patchedHits;
              }
              responseBody = JSON.stringify(parsedResponse);
              console.info('[ERP Proxy] Stock reconciled from live ERP', {
                method: matchedStockMethod,
                item_code: liveStock.item_code,
                total_stock: liveStock.total_stock,
                in_stock: liveStock.in_stock,
              });
            }
          } else {
            const hitItemCodes = messageBlock.hits
              .map((hit) => extractItemCodeFromHit(hit))
              .filter(Boolean);
            const stockMap = await fetchLiveStocksForItems(hitItemCodes, forwardHeaders);
            if (stockMap.size > 0) {
              const patchedHits = applyStockMapToHits(messageBlock.hits, stockMap);
              if (parsedResponse?.message && typeof parsedResponse.message === 'object') {
                parsedResponse.message = {
                  ...parsedResponse.message,
                  hits: patchedHits,
                };
              } else if (parsedResponse && typeof parsedResponse === 'object') {
                parsedResponse.hits = patchedHits;
              }
              responseBody = JSON.stringify(parsedResponse);
              console.info('[ERP Proxy] Stock reconciled from live ERP (batch)', {
                method: matchedStockMethod,
                reconciled_hits: stockMap.size,
                requested_hits: Math.min(hitItemCodes.length, STOCK_RECONCILE_MAX_HITS),
              });
            }
          }
        }
      } catch (stockError) {
        console.warn('[ERP Proxy] Stock reconciliation skipped:', stockError?.message || stockError);
      }
    }

    const durationMs = Date.now() - startedAt;
    console.log('[ERP Proxy] completed', {
      upstream_status: finalResponse.status,
      duration_ms: durationMs,
      started_at: startedAtIso,
      upstream_path: upstreamPath,
    });
    res.send(responseBody);

  } catch (err) {
    const isTimeout = Boolean(err?.__proxy_timeout);
    console.error(
      '[ERP Proxy] Upstream request failed:',
      err?.message,
      err?.cause?.message || ''
    );
    if (isTimeout) {
      res.status(504).json({
        message: 'Upstream ERP request timed out.',
        code: 'upstream_timeout',
        timeout_ms: UPSTREAM_TIMEOUT_MS,
      });
      return;
    }
    res.status(502).json({
      message: 'ERP proxy error: could not reach upstream server.',
      error: err?.cause?.message || err?.message,
    });
  }
}
