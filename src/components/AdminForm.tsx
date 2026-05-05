import { useEffect, useState } from 'react';
import type { OrderData, PaymentType } from '../types';
import { defaultOrder } from '../types';
import { buildSigningUrl, encryptOrder } from '../lib/crypto';

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

export default function AdminForm() {
  const [order, setOrder] = useState<OrderData>(() => {
    const t = todayIso();
    return { ...defaultOrder, fillDate: t, periodStart: t, periodEnd: addMonths(t, 3) };
  });
  const [password, setPassword] = useState('');
  const [link, setLink] = useState('');
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const update = <K extends keyof OrderData>(key: K, value: OrderData[K]) => {
    setOrder((prev) => ({ ...prev, [key]: value }));
  };

  // Any change to the form data or password invalidates the previously generated link.
  useEffect(() => {
    setLink('');
    setCopied(false);
  }, [order, password]);

  const generateLink = async () => {
    if (!password || generating) return;
    setGenerating(true);
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

  return (
    <div className="admin-wrap">
      <h1>後台 — 產生委刊單簽署連結</h1>
      <p className="hint">填寫下方資料，完成後複製連結傳給客戶，他開啟後簽名即可送出。</p>

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
          <span>委託主</span>
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

        <label className="span-3">
          <span>聯繫地址</span>
          <input
            type="text"
            value={order.contactAddress}
            onChange={(e) => update('contactAddress', e.target.value)}
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
          <span>聯繫窗口</span>
          <input
            type="text"
            value={order.contactWindow}
            onChange={(e) => update('contactWindow', e.target.value)}
          />
        </label>
      </div>

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
              <a href={link} target="_blank" rel="noreferrer" className="preview-link">
                預覽客戶看到的畫面
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
