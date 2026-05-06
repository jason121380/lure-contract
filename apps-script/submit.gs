/**
 * 委刊單線上簽署 - Google Apps Script 後端
 *
 * 部署步驟：
 *  1. 在 https://script.google.com 建立新專案，把本檔內容貼進去。
 *  2. 在 Drive 建立一個資料夾（存放簽署完的 PDF），複製資料夾 ID 填入 PDF_FOLDER_ID。
 *  3. 建立一份 Google Sheet（存放簽署紀錄），複製檔案 ID 填入 RESPONSE_SHEET_ID。
 *  4. 執行一次 init() 觸發授權同意視窗（首次需登入並授權 Drive、Sheet）。
 *  5. 點「部署 → 新增部署作業 → 類型：網頁應用程式」，
 *     - 執行身分：我（你的 Google 帳號）
 *     - 誰可以存取：任何人
 *     部署完成後複製 /exec 結尾的 URL，填到前端 src/config.ts 的 SUBMISSION_ENDPOINT_URL。
 *
 * 注意：每次修改本檔後，必須建立「新版本部署」前端拿到的 URL 才會更新。
 *
 * 端點同時負責三件事：
 *  - POST {action:'shorten', id, blob}     → 寫入 ScriptProperties (KV，~100ms)
 *  - GET  ?k=<id>&callback=<fn>            → JSONP 取回 blob
 *  - POST {pdfBase64,...}（無 action）     → 簽署完成，存 PDF + 寫紀錄表
 *
 * 短連結用 PropertiesService 而非 Sheet：
 *  - 上限 500KB，每筆 blob 約 1.5KB → 約可存 300+ 條短連結
 *  - 比 Sheet 快約 10 倍，後台與客戶端皆受惠
 *  - 需清理時：在 Apps Script 編輯器執行 cleanupShortLinks_() 一次砍掉所有 sl_* key
 */

const PDF_FOLDER_ID = '1hTX-oMo0DdC8CGTs63-FXLsYWqHa1ssc'; // 吸引力合約回傳
const RESPONSE_SHEET_ID = '13LKthJEK1p_J0Rvef7wnFYZZ_mBLtCU9d6sKrWOe-EI';
const RESPONSE_SHEET_NAME = '簽署紀錄';
const SHORT_KEY_PREFIX = 'sl_';

function init() {
  // 第一次手動執行此函式，會跳出 Drive / Sheet 授權同意。
  DriveApp.getFolderById(PDF_FOLDER_ID);
  const ss = SpreadsheetApp.openById(RESPONSE_SHEET_ID);
  ensureHeaderRow_(ss);
  PropertiesService.getScriptProperties();
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

function lookupShortBlob_(id) {
  return (
    PropertiesService.getScriptProperties().getProperty(SHORT_KEY_PREFIX + id) || ''
  );
}

function cleanupShortLinks_() {
  const props = PropertiesService.getScriptProperties();
  const all = props.getProperties();
  let removed = 0;
  for (const key in all) {
    if (key.indexOf(SHORT_KEY_PREFIX) === 0) {
      props.deleteProperty(key);
      removed++;
    }
  }
  Logger.log('cleanupShortLinks_ removed=%s', removed);
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
  PropertiesService.getScriptProperties().setProperty(
    SHORT_KEY_PREFIX + String(data.id),
    String(data.blob)
  );
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

  let totalMonthly = 0;
  if (data.plans && data.plans.length) {
    for (let i = 0; i < data.plans.length; i++) {
      totalMonthly += Number(data.plans[i].monthlyFee) || 0;
    }
  } else if (data.monthlyFee) {
    totalMonthly = Number(data.monthlyFee) || 0;
  }

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
    totalMonthly || '',
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
