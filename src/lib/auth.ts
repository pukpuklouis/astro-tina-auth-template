import { betterAuth } from "better-auth";
import { magicLink } from "better-auth/plugins/magic-link";
import type { D1Database } from "@cloudflare/workers-types";

export interface AuthConfig {
  secret: string;
  baseURL?: string;
  isLocal?: boolean;
  emailConfig?: {
    resendApiKey?: string;
    emailFrom?: string;
  };
}

// 工廠函數：為每請求創建一個 auth 實例
export function auth(db: D1Database, config: AuthConfig) {
  const { secret, baseURL, isLocal = false, emailConfig } = config;
  const { resendApiKey, emailFrom = "noreply@example.com" } = emailConfig || {};

  return betterAuth({
    database: db,
    secret,
    baseURL,
    plugins: [
      magicLink({
        sendMagicLink: async ({ email, url }) => {
          // 本地模式：輸出到 console
          if (isLocal) {
            console.log(`[Magic Link] Email: ${email}`);
            console.log(`[Magic Link] URL: ${url}`);
            return;
          }

          // 生產模式：呼叫 email 服務 API
          if (!resendApiKey) {
            throw new Error("RESEND_API_KEY is required for sending emails in production");
          }

          const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${resendApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: emailFrom,
              to: email,
              subject: "Your login link",
              html: `
                <h1>Click the link below to log in</h1>
                <p><a href="${url}">Log in to your account</a></p>
                <p>This link will expire in 5 minutes.</p>
              `,
            }),
          });

          if (!response.ok) {
            throw new Error(`Failed to send email: ${response.statusText}`);
          }
        },
        expiresIn: 60 * 5, // 5 分鐘
        disableSignUp: false,
        rateLimit: {
          window: 60,
          max: 5,
        },
      }),
    ],
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 天
      updateAge: 60 * 60 * 24, // 每天更新一次
    },
  });
}

// 匯出類型給前端使用
export type Auth = ReturnType<typeof auth>;
