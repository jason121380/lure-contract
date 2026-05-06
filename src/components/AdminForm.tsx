import { useEffect, useState } from 'react';
import type { OrderData, PaymentType, Plan } from '../types';
import { defaultOrder, defaultPlan } from '../types';
import { encryptOrder } from '../lib/crypto';
import {
  buildShortSigningUrl,
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
  const [countdown, setCountdown] = useState(0);
  const [copied, setCopied] = useState(false);
  const [linkError, setLinkError] = useState('');

  const update = <K extends keyof OrderData>(key: K, value: OrderData[K]) => {
    setOrder((prev) => ({ ...prev, [key]: value }));
  };

  const updatePlan = <K extends keyof Plan>(index: number, key: K, value: Plan[K]) => {
    setOrder((prev) => ({
      ...prev,
      plans: prev.plans.map((p, i) => (i === index ? { ...p, [key]: value } : p))
    }));
  };

  const addPlan = () => {
    setOrder((prev) => ({ ...prev, plans: [...prev.plans, { ...defaultPlan }] }));
  };

  const removePlan = (index: number) => {
    setOrder((prev) => ({
      ...prev,
      plans: prev.plans.length > 1 ? prev.plans.filter((_, i) => i !== index) : prev.plans
    }));
  };

  useEffect(() => {
    setLink('');
    setCopied(false);
    setLinkError('');
  }, [order, password]);

  const generateLink = async () => {
    if (!password || generating) return;
    setGenerating(true);
    setLinkError('');
    setCountdown(6);
    const tick = setInterval(() => {
      setCountdown((c) => (c > 1 ? c - 1 : 1));
    }, 1000);
    try {
      const encoded = await encryptOrder(order, password);
      const id = randomShortId(8);
      await storeShortLink(id, encoded);
      setLink(buildShortSigningUrl(id));
      setCopied(false);
    } catch (err) {
      setLinkError(err instanceof Error ? err.message : '產生失敗');
    } finally {
      clearInterval(tick);
      setCountdown(0);
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
        <div className="plan-details-body">
          {order.plans.map((plan, index) => (
            <div key={index} className="plan-card">
              <div className="plan-card-header">
                <span className="plan-card-title">方案 {index + 1}</span>
                {order.plans.length > 1 && (
                  <button
                    type="button"
                    className="plan-remove-btn"
                    onClick={() => removePlan(index)}
                  >
                    移除
                  </button>
                )}
              </div>
              <div className="grid">
                <label className="span-3">
                  <span>服務名稱</span>
                  <input
                    type="text"
                    value={plan.planTitle}
                    onChange={(e) => updatePlan(index, 'planTitle', e.target.value)}
                  />
                </label>
                <label>
                  <span>每月原價（元）</span>
                  <input
                    type="number"
                    min={0}
                    value={plan.originalFee}
                    onChange={(e) =>
                      updatePlan(index, 'originalFee', Number(e.target.value) || 0)
                    }
                  />
                </label>
                <label>
                  <span>每月特惠價（元）</span>
                  <input
                    type="number"
                    min={0}
                    value={plan.monthlyFee}
                    onChange={(e) =>
                      updatePlan(index, 'monthlyFee', Number(e.target.value) || 0)
                    }
                  />
                </label>
                <label>
                  <span>方案期間描述</span>
                  <input
                    type="text"
                    value={plan.planDuration}
                    onChange={(e) => updatePlan(index, 'planDuration', e.target.value)}
                    placeholder="例：3 個月"
                  />
                </label>
                <label className="span-3">
                  <span>計費補充說明</span>
                  <input
                    type="text"
                    value={plan.billingNote}
                    onChange={(e) => updatePlan(index, 'billingNote', e.target.value)}
                  />
                </label>
                <label className="span-3">
                  <span>服務項目（每行一條）</span>
                  <textarea
                    rows={7}
                    value={listToText(plan.planBullets)}
                    onChange={(e) =>
                      updatePlan(index, 'planBullets', textToList(e.target.value))
                    }
                  />
                </label>
              </div>
            </div>
          ))}

          <button type="button" className="add-plan-btn" onClick={addPlan}>
            + 新增方案
          </button>

          <div className="grid">
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
            {generating
              ? `產生中… ${countdown}`
              : link
              ? '重新產生連結'
              : '產生連結'}
          </button>
        </div>

        {linkError && <p className="error">產生失敗：{linkError}</p>}

        {link && (
          <>
            <label className="link-label">客戶簽署連結</label>
            <textarea readOnly value={link} rows={2} />
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
