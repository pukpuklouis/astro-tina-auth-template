import type { D1Database } from "@cloudflare/workers-types";
import { auth } from "./auth";

type RuntimeEnv = {
  DB: D1Database;
  BETTER_AUTH_SECRET?: string;
  BETTER_AUTH_URL?: string;
  SITE_URL?: string;
};

function getRuntimeEnv(locals: unknown): RuntimeEnv | null {
  const env = (locals as { runtime?: { env?: RuntimeEnv } }).runtime?.env;
  return env ?? null;
}

export async function hasValidAuthSession(request: Request, locals: unknown): Promise<boolean> {
  const env = getRuntimeEnv(locals);

  if (!env?.DB || !env.BETTER_AUTH_SECRET) {
    return false;
  }

  const authInstance = auth(env.DB, {
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL || env.SITE_URL || new URL(request.url).origin,
  });

  try {
    const session = await authInstance.api.getSession({
      headers: new Headers(request.headers),
    });

    return Boolean(session?.session?.id && session?.user?.id);
  } catch {
    return false;
  }
}
