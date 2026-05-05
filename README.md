# 吸引力整合行銷 — 委刊單線上簽署

客戶拿到連結 → 簽名 → 送出 → PDF 自動存到 Google Drive + Google Sheet 紀錄。

## 流程

1. **後台**（網站首頁）：你填寫客戶基本資料、方案期間、金額，點「複製連結」。
2. **客戶端**：客戶開啟連結，看到已預填好的委刊單，於下方畫板簽名，點「確認簽名並送出」。
3. **後端**：前端把渲染好的合約轉 PDF（base64）+ 表單資料 POST 到 Apps Script。
4. Apps Script 把 PDF 存到指定 Google Drive 資料夾、把資料 append 到 Google Sheet，並回傳 PDF 連結。

## 開發

```bash
npm install
npm run dev
```

開瀏覽器到 `http://localhost:5173/` 是後台，連結會帶 `?d=...` 進客戶端。

```bash
npm run build
```

`dist/` 可直接部署到 Vercel / Netlify / GitHub Pages。

## Apps Script 部署

1. 到 https://script.google.com 建立新專案，把 `apps-script/submit.gs` 內容貼上。
2. 在 Drive 開好「PDF 存放資料夾」與一份「紀錄表 Google Sheet」，分別把 ID 填到檔案最上方常數：
   - `PDF_FOLDER_ID`
   - `RESPONSE_SHEET_ID`
3. 執行一次 `init()` 完成 Drive / Sheet 授權。
4. 「部署 → 新增部署作業 → 網頁應用程式」：
   - 執行身分：**我**
   - 誰可以存取：**任何人**
5. 複製 `/exec` 結尾的 URL，填到 `src/config.ts` 的 `SUBMISSION_ENDPOINT_URL`。

> 每次修改 `submit.gs` 都需要「新版本部署」，否則前端拿到的 URL 仍指向舊版。

## 注意

- Apps Script Web App 不支援 CORS 標頭，前端用 `mode: 'no-cors'` 送 `text/plain`，所以拿不到回應內容；成功與否以「Drive 上是否有檔案 + Sheet 是否多一列」來判斷。
- 客戶簽署後會在裝置自動下載一份 PDF 副本。
- 連結把表單資料用 base64 編進 query string，本身不需要伺服器資料庫；連結太敏感不要外流。
