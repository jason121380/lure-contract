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
  // Convert to ROC year (民國年): year - 1911
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
            <td className="label" colSpan={2}>刊登申請</td>
            <td></td>
          </tr>
          <tr>
            <td className="label">日期</td>
            <td colSpan={2}>
              填表日期： {fmtDate(order.fillDate)}
              方案期間： {fmtDate(order.periodStart)} – {fmtDate(order.periodEnd)}
            </td>
          </tr>
          <tr>
            <td className="label">委託主</td>
            <td colSpan={2}>{order.clientName || ' '}</td>
          </tr>
          <tr>
            <td className="label">聯繫人</td>
            <td colSpan={2}>
              姓名：{order.contactName}　　　E-mail：{order.contactEmail}
            </td>
          </tr>
          <tr>
            <td className="label">聯繫電話</td>
            <td colSpan={2}>{order.contactPhone || ' '}</td>
          </tr>
          <tr>
            <td className="label">聯繫地址</td>
            <td colSpan={2}>{order.contactAddress || ' '}</td>
          </tr>
          <tr>
            <td className="label">委刊內容</td>
            <td>本專案付款方式</td>
            <td>付款方式</td>
          </tr>
          <tr>
            <td className="label">☑ 廣告代投放</td>
            <td className="content-cell">
              <p>
                每月 6,000 元，特惠價 {monthlyFee.toLocaleString()} 元
                <br />
                Meta 廣告費用每月依實際投放金額 + 服務費 10%，計算於次月請款
              </p>
              <p>方案期間：3 個月</p>
              <ul className="bullets">
                <li>一對一專屬顧問群組</li>
                <li>設計師社群帳號健檢與定位</li>
                <li>IG 版面優化建議及調整</li>
                <li>特色化 IP 人設經營建議</li>
                <li>廣告素材製作</li>
                <li>廣告投放數據成效回報</li>
                <li>私訊回覆追蹤</li>
              </ul>
              <p className="terms-title">其他約定條款事項</p>
              <ol className="terms">
                <li>
                  本人同意已付款之款項不得要求退還，廣告/貼文上線刊出後（含贈送刊登期），
                  本人同意不得中途任意取消廣告之刊登及申請退費。
                </li>
                <li>
                  委刊者所刊登的廣告與網站必須符合國家相關法令以及本公司「廣告審核標準」，
                  本公司有權拒絕刊登，如因委刊者因素導致或有違法令規定時，
                  委刊者不得要求退費或折價。
                </li>
                <li>
                  委刊者保證所交付予本公司任何資料皆無侵害他人權益或違法之行為，
                  倘若因此而造成相關違法情事時，委刊者必須自負法律責任，與本公司無關。
                </li>
                <li>
                  委刊者負責所提供的網站連線正常、無損害他人電腦之程式等，
                  本公司僅負依您所指定網址連結設定正確不負其他之責。
                </li>
                <li>
                  本專案委託內容如額外產生拍攝照片服務，拍攝照片版權屬本公司所有，
                  拍攝所有照片僅限本公司所屬網站使用，委刊者未經授權不得自逕複製、
                  重製、改作並挪為他用，否則視為侵權，本公司必依法追究並要求賠償，委刊者不得異議。
                </li>
                <li>
                  本專案委刊單即視為合約，一經委刊者於客戶簽章欄簽名或支付本專案款項費用後本合約立即生效。
                </li>
              </ol>
            </td>
            <td className="payment-cell">
              <p>☑ {paymentLabel}</p>
              <p>
                兆豐銀行 017
                <br />
                南京東路分行
                <br />
                07010000354 鄭仲傑
              </p>
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
