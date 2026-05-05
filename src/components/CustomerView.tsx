import { useLayoutEffect, useRef, useState } from 'react';
import type { OrderData, SubmittedPayload } from '../types';
import PrintableContract from './PrintableContract';
import SignaturePad, { type SignaturePadHandle } from './SignaturePad';
import { generateContractPdf } from '../lib/pdf';
import { submitSignedContract } from '../lib/submission';

interface Props {
  order: OrderData;
}

type Status = 'idle' | 'rendering' | 'submitting' | 'done' | 'error';

export default function CustomerView({ order }: Props) {
  const padRef = useRef<SignaturePadHandle>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | undefined>();
  const [signedAt, setSignedAt] = useState<string | undefined>();

  useLayoutEffect(() => {
    const fit = () => {
      const viewport = viewportRef.current;
      if (!viewport) return;
      const contract = viewport.querySelector('.printable-contract') as HTMLElement | null;
      if (!contract) return;
      contract.style.transform = '';
      contract.style.transformOrigin = '';
      const containerWidth = viewport.clientWidth;
      const naturalWidth = contract.offsetWidth;
      if (naturalWidth <= containerWidth + 1 || naturalWidth === 0) {
        viewport.style.height = '';
        return;
      }
      const scale = containerWidth / naturalWidth;
      contract.style.transformOrigin = 'top left';
      contract.style.transform = `scale(${scale})`;
      viewport.style.height = `${contract.offsetHeight * scale}px`;
    };
    fit();
    window.addEventListener('resize', fit);
    window.addEventListener('orientationchange', fit);
    return () => {
      window.removeEventListener('resize', fit);
      window.removeEventListener('orientationchange', fit);
    };
  }, [signatureDataUrl, signedAt, order]);

  const handleClear = () => padRef.current?.clear();

  const handleSubmit = async () => {
    if (!padRef.current || padRef.current.isEmpty()) {
      alert('請先簽名');
      return;
    }
    setErrorMsg('');
    setStatus('rendering');
    try {
      const dataUrl = padRef.current.toDataURL();
      const nowIso = new Date().toISOString();
      const niceTime = new Date(nowIso).toLocaleString('zh-TW', { hour12: false });

      setSignatureDataUrl(dataUrl);
      setSignedAt(niceTime);

      await new Promise((r) => requestAnimationFrame(() => r(null)));
      await new Promise((r) => requestAnimationFrame(() => r(null)));

      const pdf = await generateContractPdf(order.clientName, nowIso);

      setStatus('submitting');

      const payload: SubmittedPayload = {
        ...order,
        signatureDataUrl: dataUrl,
        signedAt: nowIso,
        pdfBase64: pdf.base64,
        filename: pdf.filename
      };

      await submitSignedContract(payload);
      setStatus('done');
    } catch (err) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : String(err));
      setStatus('error');
    }
  };

  const busy = status === 'rendering' || status === 'submitting';

  return (
    <div className="customer-wrap">
      <p className="contract-hint">以下為您的委刊單，可雙指縮放查看細節</p>

      <div ref={viewportRef} className="contract-viewport">
        <PrintableContract
          order={order}
          signatureDataUrl={signatureDataUrl}
          signedAt={signedAt}
        />
      </div>

      {status !== 'done' && (
        <div className="sign-area">
          <h3>請於下方簽名後送出</h3>
          <SignaturePad ref={padRef} />
          <div className="sign-actions">
            <button type="button" onClick={handleClear} disabled={busy}>
              清除
            </button>
            <button
              type="button"
              className="primary"
              onClick={handleSubmit}
              disabled={busy}
            >
              {busy ? '送出中…' : '確認簽名並送出'}
            </button>
          </div>
          {status === 'error' && <p className="error">送出失敗：{errorMsg}</p>}
        </div>
      )}

      {status === 'done' && (
        <div className="done-area">
          <h2>已送出，感謝您！</h2>
          <p>我們已收到您的簽署委刊單，承辦人會儘快與您聯繫。</p>
        </div>
      )}

      {busy && (
        <div className="progress-overlay" role="status" aria-live="polite">
          <div className="progress-card">
            <div className="spinner" />
            <p className="progress-text">資料回傳中…</p>
          </div>
        </div>
      )}
    </div>
  );
}
