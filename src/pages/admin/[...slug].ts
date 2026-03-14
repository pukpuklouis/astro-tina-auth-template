import type { APIRoute } from "astro";

type AssetEnv = {
  ASSETS: { fetch: (request: Request) => Promise<Response> };
};

const SESSION_COOKIE = "better-auth.session_token";

function hasSessionCookie(request: Request): boolean {
  const cookies = request.headers.get("cookie") || "";
  return cookies.includes(SESSION_COOKIE);
}

function buildLoginRedirect(requestUrl: URL): Response {
  const loginUrl = new URL("/login", requestUrl.origin);
  const callback = requestUrl.pathname + requestUrl.search;
  loginUrl.searchParams.set("callbackUrl", callback);
  return Response.redirect(loginUrl.toString(), 302);
}

async function handleAdminRequest(request: Request, locals: unknown): Promise<Response> {
  if (!hasSessionCookie(request)) {
    return buildLoginRedirect(new URL(request.url));
  }

  const env = (locals as { runtime?: { env?: AssetEnv } }).runtime?.env;

  if (!env?.ASSETS) {
    return new Response("ASSETS binding is not configured", { status: 500 });
  }

  return env.ASSETS.fetch(request);
}

export const GET: APIRoute = async ({ request, locals }) => handleAdminRequest(request, locals);
export const POST: APIRoute = async ({ request, locals }) => handleAdminRequest(request, locals);
export const PUT: APIRoute = async ({ request, locals }) => handleAdminRequest(request, locals);
export const PATCH: APIRoute = async ({ request, locals }) => handleAdminRequest(request, locals);
export const DELETE: APIRoute = async ({ request, locals }) => handleAdminRequest(request, locals);
export const HEAD: APIRoute = async ({ request, locals }) => handleAdminRequest(request, locals);
