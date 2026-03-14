#!/usr/bin/env bash
set -euo pipefail

# 一鍵初始化 Cloudflare 資源 + 部署
# 用法：
#   RESEND_API_KEY=xxx BETTER_AUTH_SECRET=xxx ./scripts/bootstrap-cloudflare.sh
# 若 BETTER_AUTH_SECRET 未提供，會自動產生 32-byte hex secret。

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

CONFIG_FILE="wrangler.jsonc"
MIGRATION_FILE="migrations/0001_better_auth_init.sql"
DB_BINDING="DB"

read_jsonc_string() {
  local key="$1"
  local line
  line="$(grep -E "\"${key}\"\s*:\s*\"" "$CONFIG_FILE" | head -n1 || true)"
  if [[ -z "$line" ]]; then
    return 1
  fi
  echo "$line" | sed -E "s/.*\"${key}\"\s*:\s*\"([^\"]+)\".*/\1/"
}

if [[ ! -f "$CONFIG_FILE" ]]; then
  echo "❌ 找不到 $CONFIG_FILE"
  exit 1
fi

if [[ ! -f "$MIGRATION_FILE" ]]; then
  echo "❌ 找不到 migration 檔案: $MIGRATION_FILE"
  exit 1
fi

if ! command -v wrangler >/dev/null 2>&1; then
  echo "❌ 找不到 wrangler，請先 npm install"
  exit 1
fi

if [[ -z "${RESEND_API_KEY:-}" ]]; then
  echo "❌ 請先設定 RESEND_API_KEY 環境變數"
  echo "   例如: RESEND_API_KEY=re_xxx ./scripts/bootstrap-cloudflare.sh"
  exit 1
fi

if [[ -z "${BETTER_AUTH_SECRET:-}" ]]; then
  if ! command -v openssl >/dev/null 2>&1; then
    echo "❌ 缺少 openssl，且未提供 BETTER_AUTH_SECRET"
    exit 1
  fi
  BETTER_AUTH_SECRET="$(openssl rand -hex 32)"
  echo "ℹ️ 未提供 BETTER_AUTH_SECRET，已自動產生新的 secret"
fi

WORKER_NAME="${WORKER_NAME:-$(read_jsonc_string name)}"

echo "==> 驗證 Cloudflare 登入狀態"
wrangler whoami >/dev/null

echo "==> 驗證 wrangler 設定"
wrangler check >/dev/null

echo "==> 檢查/建立 D1 資料庫"
if DB_NAME_FROM_CONFIG="$(read_jsonc_string database_name 2>/dev/null)"; then
  DB_NAME="$DB_NAME_FROM_CONFIG"
  echo "   使用既有 D1: $DB_NAME"
else
  DB_NAME="${WORKER_NAME}-auth-db"
  echo "   wrangler.jsonc 尚未有 d1_databases，建立: $DB_NAME"
  wrangler d1 create "$DB_NAME" --location apac --binding "$DB_BINDING" --update-config
fi

echo "==> 套用 D1 migrations"
wrangler d1 migrations apply "$DB_NAME" --remote

echo "==> 確保 Better Auth 基礎 schema 已建立"
wrangler d1 execute "$DB_NAME" --remote --file "$MIGRATION_FILE"

echo "==> 更新 Worker secrets"
printf '%s' "$BETTER_AUTH_SECRET" | wrangler secret put BETTER_AUTH_SECRET
printf '%s' "$RESEND_API_KEY" | wrangler secret put RESEND_API_KEY

echo "==> Build"
npm run build

echo "==> Deploy"
wrangler deploy

WORKER_URL="${WORKER_URL:-}"
if [[ -z "$WORKER_URL" ]]; then
  WORKER_URL="$(read_jsonc_string BETTER_AUTH_URL 2>/dev/null || true)"
fi

if [[ -n "$WORKER_URL" ]]; then
  echo "==> Smoke test: $WORKER_URL/api/auth/ok"
  curl -fsS "$WORKER_URL/api/auth/ok"
  echo
else
  echo "⚠️ 略過 smoke test（未提供 WORKER_URL，且 wrangler.jsonc 未設定 BETTER_AUTH_URL）"
fi

echo

echo "✅ 完成"
echo "   Worker: $WORKER_NAME"
echo "   D1: $DB_NAME"
