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
  const paymentLabel = order.paymentType === 'company' ? '公司委託' : '個人委託';

  return (
    <div id="printable-contract" className="printable-contract">
      <h1 className="contract-title">吸引力整合行銷 專案委刊單</h1>

      <p className="contract-intro">
        請仔細閱讀並填表，確認後簽章或蓋公司大小章，即表示您已閱讀並同意此委刊單所有內容，
        此委刊登一經製作正、副本完成同時即視為正式合約，
        (正本本公司留存，副本委託刊登廣告者留存)雙方即需履行合約義務。
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
            <td className="label">聯繫地址</td>
            <td colSpan={2}>{order.contactAddress || ' '}</td>
          </tr>
          <tr>
            <td className="label">委刊內容</td>
            <td colSpan={2}></td>
          </tr>
          <tr>
            <td className="label">☑ {order.planTitle}</td>
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
            <td className="payment-cell">
              <p>☑ {paymentLabel}</p>
              {order.payeeInfo && (
                <p style={{ whiteSpace: 'pre-line' }}>{order.payeeInfo}</p>
              )}
              <p className="amount">$ {monthlyFee.toLocaleString()} 元整 / 月</p>
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
