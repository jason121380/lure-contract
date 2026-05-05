import { useRef, useState } from 'react';
import type { OrderData, SubmittedPayload } from '../types';
import PrintableContract from './PrintableContract';
import SignaturePad, { type SignaturePadHandle } from './SignaturePad';
import { downloadBlob, generateContractPdf } from '../lib/pdf';
import { submitSignedContract } from '../lib/submission';

interface Props {
  order: OrderData;
}

type Status = 'idle' | 'submitting' | 'done' | 'error';

export default function CustomerView({ order }: Props) {
  const padRef = useRef<SignaturePadHandle>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | undefined>();
  const [signedAt, setSignedAt] = useState<string | undefined>();

  const handleClear = () => padRef.current?.clear();

  const handleSubmit = async () => {
    if (!padRef.current || padRef.current.isEmpty()) {
      alert('請先簽名');
      return;
    }
    setStatus('submitting');
    setErrorMsg('');
    try {
      const dataUrl = padRef.current.toDataURL();
      const nowIso = new Date().toISOString();
      const niceTime = new Date(nowIso).toLocaleString('zh-TW', { hour12: false });

      // Render signature into the printable contract before rasterizing.
      setSignatureDataUrl(dataUrl);
      setSignedAt(niceTime);

      // Wait one frame so React commits the signature image into the DOM.
      await new Promise((r) => requestAnimationFrame(() => r(null)));
      await new Promise((r) => requestAnimationFrame(() => r(null)));

      const pdf = await generateContractPdf(order.clientName, nowIso);

      const payload: SubmittedPayload = {
        ...order,
        signatureDataUrl: dataUrl,
        signedAt: nowIso,
        pdfBase64: pdf.base64,
        filename: pdf.filename
      };

      await submitSignedContract(payload);
      downloadBlob(pdf.blob, pdf.filename);
      setStatus('done');
    } catch (err) {
      console.error(err);
      setErrorMsg(err instanceof Error ? err.message : String(err));
      setStatus('error');
    }
  };

  return (
    <div className="customer-wrap">
      <PrintableContract
        order={order}
        signatureDataUrl={signatureDataUrl}
        signedAt={signedAt}
      />

      {status !== 'done' && (
        <div className="sign-area">
          <h3>請於下方簽名後送出</h3>
          <SignaturePad ref={padRef} />
          <div className="sign-actions">
            <button type="button" onClick={handleClear} disabled={status === 'submitting'}>
              清除
            </button>
            <button
              type="button"
              className="primary"
              onClick={handleSubmit}
              disabled={status === 'submitting'}
            >
              {status === 'submitting' ? '送出中…' : '確認簽名並送出'}
            </button>
          </div>
          {status === 'error' && <p className="error">送出失敗：{errorMsg}</p>}
        </div>
      )}

      {status === 'done' && (
        <div className="done-area">
          <h2>已送出，感謝您！</h2>
          <p>我們已收到您的簽署委刊單，副本 PDF 已下載至您的裝置。</p>
        </div>
      )}
    </div>
  );
}
