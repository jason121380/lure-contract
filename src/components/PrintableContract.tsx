import type { OrderData } from '../types';

interface Props {
  order: OrderData;
  signatureDataUrl?: string;
  signedAt?: string;
}

function fmtDate(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const roc = d.getFullYear() - 1911;
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${roc} / ${m} / ${day}`;
}

export default function PrintableContract({
  order,
  signatureDataUrl,
  signedAt
}: Props) {
  const monthlyFee = order.monthlyFee || 0;
  const originalFee = order.originalFee || 0;
  const isCompany = order.paymentType === 'company';
  const paymentLabel = isCompany ? '公司委託' : '個人委託';
  const payeeInfo = isCompany ? order.payeeInfoCompany : order.payeeInfoPersonal;

  return (
    <div id="printable-contract" className="printable-contract">
      <h1 className="contract-title">吸引力整合行銷 專案委刊單</h1>

      <p className="contract-intro">
        請仔細閱讀以下委刊單內容，確認無誤後於下方簽名欄完成電子簽署並送出，
        即表示您已閱讀並同意本委刊單所有內容。
        本委刊單一經電子簽署完成即視為正式合約，雙方即需履行合約義務。
      </p>

      <table className="contract-table">
        <tbody>
          <tr>
            <td className="label">日期</td>
            <td colSpan={2}>
              填表日期： {fmtDate(order.fillDate)}
              方案期間： {fmtDate(order.periodStart)} – {fmtDate(order.periodEnd)}
            </td>
          </tr>
          <tr>
            <td className="label">委託單位</td>
            <td colSpan={2}>{order.clientName || ' '}</td>
          </tr>
          <tr>
            <td className="label">聯繫人</td>
            <td colSpan={2}>
              姓名：{order.contactName}　　　E-mail：{order.contactEmail}
            </td>
          </tr>
          <tr>
            <td className="label">聯繫電話</td>
            <td colSpan={2}>{order.contactPhone || ' '}</td>
          </tr>
          <tr>
            <td className="label">委刊內容</td>
            <td className="content-cell">
              <p className="plan-title-line">☑ {order.planTitle}</p>
            </td>
            <td className="payment-cell" rowSpan={2}>
              <p>☑ {paymentLabel}</p>
              {payeeInfo && (
                <p style={{ whiteSpace: 'pre-line' }}>{payeeInfo}</p>
              )}
              <p className="amount">$ {monthlyFee.toLocaleString()} 元整 / 月</p>
            </td>
          </tr>
          <tr>
            <td className="label">方案細項</td>
            <td className="content-cell">
              <p>
                每月 {originalFee.toLocaleString()} 元，特惠價 {monthlyFee.toLocaleString()} 元
                {order.billingNote && (
                  <>
                    <br />
                    {order.billingNote}
                  </>
                )}
              </p>
              {order.planDuration && <p>方案期間：{order.planDuration}</p>}
              {order.planBullets.length > 0 && (
                <ul className="bullets">
                  {order.planBullets.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              )}
              {order.terms.length > 0 && (
                <>
                  <p className="terms-title">其他約定條款事項</p>
                  <ol className="terms">
                    {order.terms.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ol>
                </>
              )}
            </td>
          </tr>
          <tr>
            <td className="label">聯繫窗口</td>
            <td>{order.contactWindow}</td>
            <td className="signature-cell">
              <div className="signature-cell-label">客戶簽章</div>
              {signatureDataUrl ? (
                <img
                  src={signatureDataUrl}
                  alt="客戶簽章"
                  className="signature-img"
                />
              ) : (
                <div className="signature-placeholder" />
              )}
              {signedAt && <div className="signed-at">簽署時間：{signedAt}</div>}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
