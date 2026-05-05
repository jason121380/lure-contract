/**
 * 委刊單線上簽署 - Google Apps Script 後端
 *
 * 部署步驟：
 *  1. 在 https://script.google.com 建立新專案，把本檔內容貼進去。
 *  2. 在 Drive 建立一個資料夾（存放簽署完的 PDF），複製資料夾 ID 填入 PDF_FOLDER_ID。
 *  3. 建立一份 Google Sheet（存放每筆簽署紀錄），複製檔案 ID 填入 RESPONSE_SHEET_ID。
 *  4. 執行一次 init() 觸發授權同意視窗（首次需登入並授權 Drive、Sheet）。
 *  5. 點「部署 → 新增部署作業 → 類型：網頁應用程式」，
 *     - 執行身分：我（你的 Google 帳號）
 *     - 誰可以存取：任何人
 *     部署完成後複製 /exec 結尾的 URL，填到前端 src/config.ts 的 SUBMISSION_ENDPOINT_URL。
 *
 * 注意：每次修改本檔後，必須建立「新版本部署」前端拿到的 URL 才會更新。
 */

const PDF_FOLDER_ID = '1hTX-oMo0DdC8CGTs63-FXLsYWqHa1ssc'; // 吸引力合約回傳
const RESPONSE_SHEET_ID = '請填入_紀錄表的Google_Sheet_ID';
const RESPONSE_SHEET_NAME = '簽署紀錄';

function init() {
  // 第一次手動執行此函式，會跳出 Drive / Sheet 授權同意。
  DriveApp.getFolderById(PDF_FOLDER_ID);
  const ss = SpreadsheetApp.openById(RESPONSE_SHEET_ID);
  ensureHeaderRow_(ss);
}

function ensureHeaderRow_(ss) {
  let sheet = ss.getSheetByName(RESPONSE_SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(RESPONSE_SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      '簽署時間',
      '委託主',
      '聯繫人',
      'E-mail',
      '聯繫電話',
      '聯繫地址',
      '方案開始',
      '方案結束',
      '每月金額',
      '付款類型',
      '聯繫窗口',
      'PDF 連結',
      '檔名'
    ]);
  }
  return sheet;
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    const folder = DriveApp.getFolderById(PDF_FOLDER_ID);
    const bytes = Utilities.base64Decode(data.pdfBase64);
    const blob = Utilities.newBlob(bytes, 'application/pdf', data.filename);
    const file = folder.createFile(blob);
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    const pdfUrl = file.getUrl();

    const ss = SpreadsheetApp.openById(RESPONSE_SHEET_ID);
    const sheet = ensureHeaderRow_(ss);
    sheet.appendRow([
      new Date(data.signedAt || Date.now()),
      data.clientName || '',
      data.contactName || '',
      data.contactEmail || '',
      data.contactPhone || '',
      data.contactAddress || '',
      data.periodStart || '',
      data.periodEnd || '',
      data.monthlyFee || '',
      data.paymentType === 'company' ? '公司委託' : '個人委託',
      data.contactWindow || '',
      pdfUrl,
      data.filename || ''
    ]);

    return ContentService.createTextOutput(
      JSON.stringify({ ok: true, pdfUrl: pdfUrl })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ ok: false, error: String(err) })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return ContentService.createTextOutput('lure-contract submission endpoint OK');
}
