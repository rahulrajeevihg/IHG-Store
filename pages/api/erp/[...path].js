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

const ERP_BASE_URL = 'http://167.71.204.41';
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);
const MAX_UPSTREAM_REDIRECTS = 5;

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

export default async function handler(req, res) {
  const { path } = req.query;

  // Reconstruct the upstream path: /api/method/... or /api/resource/...
  const upstreamPath = Array.isArray(path) ? path.join('/') : path;
  const requestUrl = new URL(req.url, `http://localhost`);
  requestUrl.searchParams.delete('path'); // remove the catch-all param
  const queryString = requestUrl.search; // e.g. "?country=UAE" or ""
  const upstreamUrl = `${ERP_BASE_URL}/${upstreamPath}${queryString}`;

  // Build forwarded headers — critically including the browser's cookies
  const forwardHeaders = {
    'Content-Type': req.headers['content-type'] || 'application/json',
    'Accept': req.headers['accept'] || 'application/json',
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
    console.log('[ERP Proxy] Forwarding to:', upstreamUrl);
    console.log('[ERP Proxy] Method:', req.method);
    console.log('[ERP Proxy] Headers:', forwardHeaders);
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

      const erpResponse = await fetch(currentUrl, {
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
      'content-length',
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
      res.setHeader('Set-Cookie', setCookies);
    }

    // Forward response status
    res.status(finalResponse.status);

    // Forward response body
    const responseBody = await finalResponse.text();
    res.send(responseBody);

  } catch (err) {
    console.error('[ERP Proxy] Upstream request failed:', err.message);
    res.status(502).json({
      message: 'ERP proxy error: could not reach upstream server.',
      error: err.message,
    });
  }
}
