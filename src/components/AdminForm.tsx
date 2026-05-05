import { useEffect, useState } from 'react';
import type { OrderData, PaymentType } from '../types';
import { defaultOrder } from '../types';
import { buildSigningUrl, encryptOrder } from '../lib/crypto';
import {
  buildShortSigningUrl,
  fetchShortLink,
  randomShortId,
  storeShortLink
} from '../lib/shortener';

function todayIso(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addMonths(iso: string, months: number): string {
  if (!iso) return '';
  const d = new Date(iso);
  d.setMonth(d.getMonth() + months);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function listToText(arr: string[]): string {
  return arr.join('\n');
}

function textToList(text: string): string[] {
  return text.split('\n').map((s) => s.trim()).filter(Boolean);
}

export default function AdminForm() {
  const [order, setOrder] = useState<OrderData>(() => {
    const t = todayIso();
    return { ...defaultOrder, fillDate: t, periodStart: t, periodEnd: addMonths(t, 3) };
  });
  const [password, setPassword] = useState('');
  const [link, setLink] = useState('');
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shortening, setShortening] = useState(false);
  const [shortError, setShortError] = useState('');

  const update = <K extends keyof OrderData>(key: K, value: OrderData[K]) => {
    setOrder((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    setLink('');
    setCopied(false);
    setShortError('');
  }, [order, password]);

  const generateLink = async () => {
    if (!password || generating) return;
    setGenerating(true);
    setShortError('');
    try {
      const encoded = await encryptOrder(order, password);
      setLink(buildSigningUrl(encoded));
    } finally {
      setGenerating(false);
    }
  };

  const copyLink = async () => {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const shortenLink = async () => {
    if (!link || shortening) return;
    setShortening(true);
    setShortError('');
    try {
      const url = new URL(link);
      const blob = url.searchParams.get('e');
      if (!blob) throw new Error('原始連結缺少加密內容');

      const id = randomShortId(8);
      await storeShortLink(id, blob);

      // Verify storage round-trips before swapping the link.
      const got = await fetchShortLink(id);
      if (got !== blob) throw new Error('儲存後讀回不一致');

      setLink(buildShortSigningUrl(id));
      setCopied(false);
    } catch (err) {
      setShortError(err instanceof Error ? err.message : '縮短失敗');
    } finally {
      setShortening(false);
    }
  };

  return (
    <div className="admin-wrap">
      <h1>吸引力外案委刊單 後台</h1>
      <p className="hint">填寫下方資料，完成後複製連結傳給客戶，他開啟後簽名即可送出。</p>

      <h2 className="section-title">客戶資料</h2>
      <div className="grid">
        <label>
          <span>填表日期</span>
          <input
            type="date"
            value={order.fillDate}
            onChange={(e) => update('fillDate', e.target.value)}
          />
        </label>
        <label>
          <span>方案開始</span>
          <input
            type="date"
            value={order.periodStart}
            onChange={(e) => update('periodStart', e.target.value)}
          />
        </label>
        <label>
          <span>方案結束</span>
          <input
            type="date"
            value={order.periodEnd}
            onChange={(e) => update('periodEnd', e.target.value)}
          />
        </label>

        <label className="span-2">
          <span>委託單位</span>
          <input
            type="text"
            placeholder="例：one corner botan"
            value={order.clientName}
            onChange={(e) => update('clientName', e.target.value)}
          />
        </label>
        <label>
          <span>付款類型</span>
          <select
            value={order.paymentType}
            onChange={(e) => update('paymentType', e.target.value as PaymentType)}
          >
            <option value="personal">個人委託</option>
            <option value="company">公司委託</option>
          </select>
        </label>

        <label>
          <span>聯繫人姓名</span>
          <input
            type="text"
            value={order.contactName}
            onChange={(e) => update('contactName', e.target.value)}
          />
        </label>
        <label>
          <span>E-mail</span>
          <input
            type="email"
            value={order.contactEmail}
            onChange={(e) => update('contactEmail', e.target.value)}
          />
        </label>
        <label>
          <span>聯繫電話</span>
          <input
            type="tel"
            value={order.contactPhone}
            onChange={(e) => update('contactPhone', e.target.value)}
          />
        </label>

        <label>
          <span>聯繫窗口</span>
          <input
            type="text"
            value={order.contactWindow}
            onChange={(e) => update('contactWindow', e.target.value)}
          />
        </label>
      </div>

      <details className="plan-details">
        <summary>方案內容</summary>
        <div className="grid">
          <label className="span-3">
            <span>服務名稱</span>
          <input
            type="text"
            value={order.planTitle}
            onChange={(e) => update('planTitle', e.target.value)}
          />
        </label>
        <label>
          <span>每月原價（元）</span>
          <input
            type="number"
            min={0}
            value={order.originalFee}
            onChange={(e) => update('originalFee', Number(e.target.value) || 0)}
          />
        </label>
        <label>
          <span>每月特惠價（元）</span>
          <input
            type="number"
            min={0}
            value={order.monthlyFee}
            onChange={(e) => update('monthlyFee', Number(e.target.value) || 0)}
          />
        </label>
        <label>
          <span>方案期間描述</span>
          <input
            type="text"
            value={order.planDuration}
            onChange={(e) => update('planDuration', e.target.value)}
            placeholder="例：3 個月"
          />
        </label>

        <label className="span-3">
          <span>計費補充說明</span>
          <input
            type="text"
            value={order.billingNote}
            onChange={(e) => update('billingNote', e.target.value)}
          />
        </label>

        <label className="span-3">
          <span>服務項目（每行一條）</span>
          <textarea
            rows={7}
            value={listToText(order.planBullets)}
            onChange={(e) => update('planBullets', textToList(e.target.value))}
          />
        </label>

        <label className="span-3">
          <span>其他約定條款（每行一條）</span>
          <textarea
            rows={8}
            value={listToText(order.terms)}
            onChange={(e) => update('terms', textToList(e.target.value))}
          />
        </label>

        <label className="span-3">
          <span>個人委託收款資訊（付款類型選「個人委託」時顯示）</span>
          <textarea
            rows={3}
            value={order.payeeInfoPersonal}
            onChange={(e) => update('payeeInfoPersonal', e.target.value)}
          />
        </label>
        <label className="span-3">
          <span>公司委託收款資訊（付款類型選「公司委託」時顯示）</span>
          <textarea
            rows={3}
            value={order.payeeInfoCompany}
            onChange={(e) => update('payeeInfoCompany', e.target.value)}
          />
        </label>
        </div>
      </details>

      <div className="link-box">
        <label>連結密碼</label>
        <input
          type="text"
          className="password-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="自訂一組密碼，請另外用電話/訊息告知客戶"
        />
        <p className="password-hint">
          客戶開啟連結時必須輸入這組密碼才能看到委刊單內容。即使連結外流，沒有密碼也無法解開。
        </p>

        <div className="link-actions">
          <button
            type="button"
            className="primary"
            onClick={generateLink}
            disabled={!password || generating}
          >
            {generating ? '加密中…' : link ? '重新產生連結' : '產生加密連結'}
          </button>
        </div>

        {link && (
          <>
            <label className="link-label">客戶簽署連結</label>
            <textarea readOnly value={link} rows={3} />
            <div className="link-actions">
              <button type="button" onClick={copyLink}>
                {copied ? '已複製 ✓' : '複製連結'}
              </button>
              <button
                type="button"
                onClick={shortenLink}
                disabled={shortening || link.includes('?k=')}
              >
                {shortening
                  ? '縮短中…'
                  : link.includes('?k=')
                  ? '已縮短 ✓'
                  : '縮短連結'}
              </button>
              <a href={link} target="_blank" rel="noreferrer" className="preview-link">
                預覽客戶看到的畫面
              </a>
            </div>
            {shortError && <p className="error">縮短失敗：{shortError}</p>}
          </>
        )}
      </div>
    </div>
  );
}
