import { defineMiddleware } from 'astro:middleware';
import { sequence } from 'astro:middleware';

// Better Auth session cookie name
const SESSION_COOKIE = 'better-auth.session_token';

// Paths that require authentication
const PROTECTED_PATHS = ['/admin'];

// Public paths that should bypass auth check
const PUBLIC_PATHS = [
  '/api/auth',  // Auth API routes
  '/_astro',    // Astro static assets
  '/login',     // Login page
];

/**
 * Check if user has a valid session
 */
async function isAuthenticated(request: Request): Promise<boolean> {
  const cookies = request.headers.get('cookie') || '';
  return cookies.includes(SESSION_COOKIE);
}

/**
 * Check if path matches any pattern in the list
 */
function matchesPath(pathname: string, patterns: string[]): boolean {
  return patterns.some(pattern => pathname.startsWith(pattern));
}

/**
 * Auth middleware - protects /admin routes
 */
const authMiddleware = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;
  
  // Skip auth check for public paths
  if (matchesPath(pathname, PUBLIC_PATHS)) {
    return next();
  }
  
  // Check if this is a protected path
  const isProtectedPath = PROTECTED_PATHS.some(path => pathname.startsWith(path));
  
  if (!isProtectedPath) {
    return next();
  }
  
  // For /admin routes, check authentication
  const isAuthed = await isAuthenticated(context.request);
  
  if (!isAuthed) {
    // Redirect to login page
    const loginUrl = new URL('/login', context.url.origin);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return context.redirect(loginUrl.toString(), 302);
  }
  
  return next();
});

export const onRequest = sequence(authMiddleware);
