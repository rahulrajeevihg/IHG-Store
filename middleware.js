import { NextResponse } from "next/server";

// ┌─────────────────────────────────────────────────────────────────────────┐
// │  MAINTENANCE / UNDER-CONSTRUCTION REDIRECT                                │
// │  While this is true, EVERY page is redirected to /maintenance.            │
// │  >>> To turn the site back on after the resync: set this to false         │
// │      (or delete this middleware.js file) and redeploy. <<<                │
// └─────────────────────────────────────────────────────────────────────────┘
const MAINTENANCE_ON = true;

export function middleware(request) {
  if (!MAINTENANCE_ON) {
    return NextResponse.next();
  }
  // Temporary (307) redirect so the browser URL becomes /maintenance.
  return NextResponse.redirect(new URL("/maintenance", request.url));
}

export const config = {
  matcher: [
    // Match everything EXCEPT: api routes, Next.js internals, the maintenance
    // page itself, the favicon, and any static asset with a file extension
    // (so the page's logo + GIF still load).
    "/((?!api/|_next/static|_next/image|maintenance|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|webp|svg|ico|css|js|mjs|woff2?|ttf|otf|map|json|txt|xml)).*)",
  ],
};
