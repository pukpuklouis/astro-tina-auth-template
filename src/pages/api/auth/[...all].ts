import type { APIRoute } from "astro";
import type { D1Database } from "@cloudflare/workers-types";
import { auth } from "../../../lib/auth";

type RuntimeEnv = {
  DB: D1Database;
  BETTER_AUTH_SECRET?: string;
  BETTER_AUTH_URL?: string;
  SITE_URL?: string;
};

export const ALL: APIRoute = async ({ locals, request }) => {
  // 從 Astro.locals 取得 Cloudflare runtime 環境
  const env = (locals as { runtime?: { env?: RuntimeEnv } }).runtime?.env;

  if (!env?.DB) {
    return new Response(JSON.stringify({ error: "Database not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
  
  if (!env.BETTER_AUTH_SECRET) {
    return new Response(JSON.stringify({ error: "BETTER_AUTH_SECRET not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // 從環境變數讀取配置
  const secret = env.BETTER_AUTH_SECRET;
  const baseURL = env.BETTER_AUTH_URL || env.SITE_URL || new URL(request.url).origin;

  // 創建 auth 實例
  const authInstance = auth(env.DB as D1Database, {
    secret,
    baseURL,
  });

  // 使用 handler 處理請求（支援所有 Better Auth 路由）
  return authInstance.handler(request);
};
