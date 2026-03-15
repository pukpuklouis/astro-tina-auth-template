import { defineMiddleware } from "astro:middleware";
import { sequence } from "astro:middleware";
import { hasValidAuthSession } from "./lib/session";

// Paths that require authentication
const PROTECTED_PATHS = ["/admin"];

// Public paths that should bypass auth check
const PUBLIC_PATHS = [
  "/api/auth", // Auth API routes
  "/_astro", // Astro static assets
  "/login", // Login page
];

// Paths that should not be indexed
const NOINDEX_PATHS = ["/admin", "/login", "/api/auth"];

/**
 * Check if path matches any pattern in the list
 */
function matchesPath(pathname: string, patterns: string[]): boolean {
  return patterns.some((pattern) => pathname.startsWith(pattern));
}

/**
 * Auth middleware - protects /admin routes
 */
const authMiddleware = defineMiddleware(async (context, next) => {
  const { pathname, search, origin } = context.url;
  console.log(`[Middleware] pathname: ${pathname}`);

  // Skip auth check for public paths
  if (matchesPath(pathname, PUBLIC_PATHS)) {
    const response = await next();

    if (matchesPath(pathname, NOINDEX_PATHS)) {
      response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
    }

    return response;
  }

  // Check if this is a protected path
  const isProtectedPath = PROTECTED_PATHS.some((path) => pathname.startsWith(path));

  if (!isProtectedPath) {
    return next();
  }

  // For /admin routes, verify the session with Better Auth
  const isAuthed = await hasValidAuthSession(context.request, context.locals);

  if (!isAuthed) {
    const loginUrl = new URL("/login", origin);
    loginUrl.searchParams.set("callbackUrl", `${pathname}${search}`);
    return context.redirect(loginUrl.toString(), 302);
  }

  const response = await next();
  response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  return response;
});

export const onRequest = sequence(authMiddleware);
