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
  const isCompany = order.paymentType === 'company';
  const payeeInfo = isCompany ? order.payeeInfoCompany : order.payeeInfoPersonal;
  const period =
    order.periodStart || order.periodEnd
      ? `${fmtDate(order.periodStart)} – ${fmtDate(order.periodEnd)}`
      : '';
  const planAmount = (p: { amount: number; originalFee: number }) =>
    Number(p.amount) || Number(p.originalFee) || 0;
  const monthlyTotal = order.plans
    .filter((p) => p.billingType === 'monthly')
    .reduce((sum, p) => sum + planAmount(p), 0);
  const oneTimeTotal = order.plans
    .filter((p) => p.billingType === 'oneTime')
    .reduce((sum, p) => sum + planAmount(p), 0);
  const multiplePlans = order.plans.length > 1;

  return (
    <div id="printable-contract" className="printable-contract">
      <h1 className="contract-title">吸引力整合行銷 專案委刊單</h1>

      <p className="contract-intro">
        請仔細閱讀以下委刊單內容，確認無誤後於下方簽名欄完成電子簽署並送出，
        即表示您已閱讀並同意本委刊單所有內容。
        本委刊單一經電子簽署完成即視為正式合約，雙方即需履行合約義務。
      </p>

      <table className="contract-table">
        <colgroup>
          <col className="col-label-left" />
          <col className="col-content-left" />
          <col className="col-label-mid" />
          <col className="col-content-right" />
        </colgroup>
        <tbody>
          <tr>
            <td className="label">日期</td>
            <td>{fmtDate(order.fillDate)}</td>
            <td className="label">方案期間</td>
            <td>{period}</td>
          </tr>
          <tr>
            <td className="label">委託單位</td>
            <td>{order.clientName || ' '}</td>
            <td className="label">專案窗口</td>
            <td>{order.contactWindow || ' '}</td>
          </tr>
          <tr>
            <td className="label">聯繫人姓名</td>
            <td colSpan={3}>{order.contactName || ' '}</td>
          </tr>
          <tr>
            <td className="label">聯繫電話</td>
            <td colSpan={3}>{order.contactPhone || ' '}</td>
          </tr>
          <tr>
            <td className="label">委託內容</td>
            <td colSpan={3}>
              {order.plans.map((p, i) => (
                <div key={i} className="plan-title-line">
                  {p.planTitle}
                </div>
              ))}
            </td>
          </tr>
          <tr>
            <td className="section-header" colSpan={3}>方案細項</td>
            <td className="section-header">付款方式</td>
          </tr>
          <tr>
            <td className="content-cell" colSpan={3} rowSpan={2}>
              {order.plans.map((p, i) => {
                const orig = Number(p.originalFee) || 0;
                const amt = Number(p.amount) || 0;
                const showPrice = orig > 0 || amt > 0;
                const showCompare = orig > 0 && amt > 0 && orig !== amt;
                const headlineAmount = amt > 0 ? amt : orig;
                return (
                  <div
                    key={i}
                    className={`plan-detail-block${i > 0 ? ' plan-detail-block--sep' : ''}`}
                  >
                    {multiplePlans && (
                      <p className="plan-detail-name">{p.planTitle}</p>
                    )}
                    {(showPrice || p.billingNote) && (
                      <p>
                        {showPrice && p.billingType === 'oneTime' && (
                          showCompare ? (
                            <>
                              原價 {orig.toLocaleString()} 元，一次性特惠價{' '}
                              {amt.toLocaleString()} 元
                            </>
                          ) : (
                            <>
                              一次性支付 總價 {headlineAmount.toLocaleString()} 元
                            </>
                          )
                        )}
                        {showPrice && p.billingType !== 'oneTime' && (
                          showCompare ? (
                            <>
                              每月 {orig.toLocaleString()} 元，特惠價{' '}
                              {amt.toLocaleString()} 元
                            </>
                          ) : (
                            <>每月 {headlineAmount.toLocaleString()} 元</>
                          )
                        )}
                        {showPrice && p.billingNote && <br />}
                        {p.billingNote}
                      </p>
                    )}
                    {p.planDuration && <p>方案期間：{p.planDuration}</p>}
                    {p.planBullets.length > 0 && (
                      <ul className="bullets">
                        {p.planBullets.map((item, j) => (
                          <li key={j}>{item}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
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
              {payeeInfo && (
                <p style={{ whiteSpace: 'pre-line' }}>{payeeInfo}</p>
              )}
              {monthlyTotal > 0 && (
                <p className="amount">
                  $ {monthlyTotal.toLocaleString()} 元整 / 月
                </p>
              )}
              {oneTimeTotal > 0 && (
                <p className="amount">
                  $ {oneTimeTotal.toLocaleString()} 元整（一次性）
                </p>
              )}
            </td>
          </tr>
          <tr>
            <td className="signature-cell">
              <div className="signature-cell-label">客戶簽名</div>
              {signatureDataUrl ? (
                <img
                  src={signatureDataUrl}
                  alt="客戶簽名"
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
