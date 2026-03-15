import type { APIRoute } from "astro";
import { hasValidAuthSession } from "../../lib/session";

type AssetEnv = {
  ASSETS: { fetch: (request: Request) => Promise<Response> };
};

function buildLoginRedirect(requestUrl: URL): Response {
  const loginUrl = new URL("/login", requestUrl.origin);
  const callback = requestUrl.pathname + requestUrl.search;
  loginUrl.searchParams.set("callbackUrl", callback);
  return Response.redirect(loginUrl.toString(), 302);
}

async function handleAdminRequest(request: Request, locals: unknown): Promise<Response> {
  const isAuthed = await hasValidAuthSession(request, locals);

  if (!isAuthed) {
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
