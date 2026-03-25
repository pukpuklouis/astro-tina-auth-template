# AGENT.md

此專案使用 `pnpm` 作為唯一套件管理器。

## 工作規則

- 安裝依賴請使用 `pnpm install`
- 開發請使用 `pnpm dev`
- 建置請使用 `pnpm build`
- 預覽請使用 `pnpm preview`
- Cloudflare 一鍵初始化與部署請使用 `pnpm deploy:bootstrap`
- 執行 Wrangler 指令時，優先使用 `pnpm exec wrangler ...`

## Bootstrap 注意事項

- `scripts/bootstrap-cloudflare.sh` 預期在專案根目錄執行
- 腳本會先檢查 `pnpm` 與本機安裝的 `wrangler`
- 若尚未安裝依賴，先執行 `pnpm install`
- 若未提供 `BETTER_AUTH_SECRET`，腳本會自動產生

## 維護原則

- 變更前先讀檔，避免直接假設現況
- 保持修改最小且一致，避免引入多餘抽象
- 文件、腳本與 `package.json` 的指令名稱必須一致
