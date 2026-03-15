import { betterAuth } from "better-auth";
import type { D1Database } from "@cloudflare/workers-types";

export interface AuthConfig {
  secret: string;
  baseURL?: string;
}

// 工廠函數：為每請求創建一個 auth 實例
export function auth(db: D1Database, config: AuthConfig) {
  const { secret, baseURL } = config;

  return betterAuth({
    database: db,
    secret,
    baseURL,
    emailAndPassword: {
      enabled: true,
      disableSignUp: false,
      minPasswordLength: 8,
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 天
      updateAge: 60 * 60 * 24, // 每天更新一次
    },
  });
}

// 匯出類型給前端使用
export type Auth = ReturnType<typeof auth>;
