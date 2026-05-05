/**
 * 委刊單線上簽署 - Google Apps Script 後端
 *
 * 部署步驟：
 *  1. 在 https://script.google.com 建立新專案，把本檔內容貼進去。
 *  2. 在 Drive 建立一個資料夾（存放簽署完的 PDF），複製資料夾 ID 填入 PDF_FOLDER_ID。
 *  3. 建立一份 Google Sheet（存放每筆簽署紀錄與短連結），複製檔案 ID 填入 RESPONSE_SHEET_ID。
 *  4. 執行一次 init() 觸發授權同意視窗（首次需登入並授權 Drive、Sheet）。
 *  5. 點「部署 → 新增部署作業 → 類型：網頁應用程式」，
 *     - 執行身分：我（你的 Google 帳號）
 *     - 誰可以存取：任何人
 *     部署完成後複製 /exec 結尾的 URL，填到前端 src/config.ts 的 SUBMISSION_ENDPOINT_URL。
 *
 * 注意：每次修改本檔後，必須建立「新版本部署」前端拿到的 URL 才會更新。
 *
 * 端點同時負責三件事：
 *  - POST {action:'shorten', id, blob}     → 寫入「短連結」工作表
 *  - GET  ?k=<id>&callback=<fn>            → JSONP 取回 blob
 *  - POST {pdfBase64,...}（無 action）     → 簽署完成，存 PDF + 寫紀錄表
 */

const PDF_FOLDER_ID = '1hTX-oMo0DdC8CGTs63-FXLsYWqHa1ssc'; // 吸引力合約回傳
const RESPONSE_SHEET_ID = '13LKthJEK1p_J0Rvef7wnFYZZ_mBLtCU9d6sKrWOe-EI';
const RESPONSE_SHEET_NAME = '簽署紀錄';
const SHORTLINK_SHEET_NAME = '短連結';

function init() {
  // 第一次手動執行此函式，會跳出 Drive / Sheet 授權同意。
  DriveApp.getFolderById(PDF_FOLDER_ID);
  const ss = SpreadsheetApp.openById(RESPONSE_SHEET_ID);
  ensureHeaderRow_(ss);
  ensureShortSheet_(ss);
}

function ensureHeaderRow_(ss) {
  let sheet = ss.getSheetByName(RESPONSE_SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(RESPONSE_SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      '簽署時間',
      '委託單位',
      '聯繫人',
      'E-mail',
      '聯繫電話',
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

function ensureShortSheet_(ss) {
  let sheet = ss.getSheetByName(SHORTLINK_SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHORTLINK_SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['ID', 'Blob', '建立時間']);
  }
  return sheet;
}

function lookupShortBlob_(id) {
  const ss = SpreadsheetApp.openById(RESPONSE_SHEET_ID);
  const sheet = ensureShortSheet_(ss);
  const last = sheet.getLastRow();
  if (last < 2) return '';
  const values = sheet.getRange(2, 1, last - 1, 2).getValues();
  for (let i = values.length - 1; i >= 0; i--) {
    if (values[i][0] === id) return values[i][1];
  }
  return '';
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    if (data.action === 'shorten') return handleShorten_(data);
    return handleSubmit_(data);
  } catch (err) {
    Logger.log('doPost error: %s', err && err.stack ? err.stack : err);
    return ContentService.createTextOutput(
      JSON.stringify({ ok: false, error: String(err) })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

function handleShorten_(data) {
  if (!data.id || !data.blob) {
    return ContentService.createTextOutput(
      JSON.stringify({ ok: false, error: 'missing id or blob' })
    ).setMimeType(ContentService.MimeType.JSON);
  }
  const ss = SpreadsheetApp.openById(RESPONSE_SHEET_ID);
  const sheet = ensureShortSheet_(ss);
  sheet.appendRow([String(data.id), String(data.blob), new Date()]);
  Logger.log('shortlink stored, id=%s len=%s', data.id, String(data.blob).length);
  return ContentService.createTextOutput(
    JSON.stringify({ ok: true })
  ).setMimeType(ContentService.MimeType.JSON);
}

function handleSubmit_(data) {
  Logger.log('submit start, clientName=%s filename=%s', data.clientName, data.filename);

  const folder = DriveApp.getFolderById(PDF_FOLDER_ID);
  const bytes = Utilities.base64Decode(data.pdfBase64);
  const blob = Utilities.newBlob(bytes, 'application/pdf', data.filename);
  const file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  const pdfUrl = file.getUrl();
  Logger.log('drive saved, pdfUrl=%s', pdfUrl);

  const ss = SpreadsheetApp.openById(RESPONSE_SHEET_ID);
  const sheet = ensureHeaderRow_(ss);
  sheet.appendRow([
    new Date(data.signedAt || Date.now()),
    data.clientName || '',
    data.contactName || '',
    data.contactEmail || '',
    data.contactPhone || '',
    data.periodStart || '',
    data.periodEnd || '',
    data.monthlyFee || '',
    data.paymentType === 'company' ? '公司委託' : '個人委託',
    data.contactWindow || '',
    pdfUrl,
    data.filename || ''
  ]);
  Logger.log('appendRow done, newLastRow=%s', sheet.getLastRow());

  return ContentService.createTextOutput(
    JSON.stringify({ ok: true, pdfUrl: pdfUrl })
  ).setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  const params = (e && e.parameter) || {};
  const id = params.k;
  const callback = params.callback;

  if (id) {
    let blob = '';
    try {
      blob = lookupShortBlob_(String(id));
    } catch (err) {
      Logger.log('lookup error: %s', err && err.stack ? err.stack : err);
    }
    const payload = JSON.stringify({ blob: blob });
    if (callback) {
      const safe = String(callback).replace(/[^a-zA-Z0-9_$]/g, '');
      return ContentService.createTextOutput(safe + '(' + payload + ');')
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }
    return ContentService.createTextOutput(payload)
      .setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService.createTextOutput('lure-contract endpoint OK');
}
