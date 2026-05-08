export type PaymentType = 'personal' | 'company';
export type BillingType = 'monthly' | 'oneTime';

export interface Plan {
  planTitle: string;
  billingType: BillingType;
  originalFee: number;
  amount: number;
  planDuration: string;
  billingNote: string;
  planBullets: string[];
}

export interface OrderData {
  fillDate: string;
  periodStart: string;
  periodEnd: string;
  clientName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  paymentType: PaymentType;
  contactWindow: string;

  plans: Plan[];

  terms: string[];
  payeeInfoPersonal: string;
  payeeInfoCompany: string;
}

export interface SubmittedPayload extends OrderData {
  signatureDataUrl: string;
  signedAt: string;
  pdfBase64: string;
  filename: string;
}

export const defaultPlan: Plan = {
  planTitle: '一對一行銷陪跑顧問 + 廣告代投放',
  billingType: 'monthly',
  originalFee: 6000,
  amount: 3600,
  planDuration: '3 個月',
  billingNote: 'Meta 廣告費用每月依實際投放金額 + 服務費 10%，計算於次月請款',
  planBullets: [
    '一對一專屬顧問群組',
    '設計師社群帳號健檢與定位',
    'IG 版面優化建議及調整',
    '特色化 IP 人設經營建議',
    '廣告素材製作',
    '廣告投放數據成效回報',
    '私訊回覆追蹤'
  ]
};

export const defaultOrder: OrderData = {
  fillDate: '',
  periodStart: '',
  periodEnd: '',
  clientName: '',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  paymentType: 'personal',
  contactWindow: '',

  plans: [defaultPlan],

  terms: [
    '本人同意已付款之款項不得要求退還，廣告/貼文上線刊出後（含贈送刊登期），本人同意不得中途任意取消廣告之刊登及申請退費。',
    '委刊者所刊登的廣告與網站必須符合國家相關法令以及本公司「廣告審核標準」，本公司有權拒絕刊登，如因委刊者因素導致或有違法令規定時，委刊者不得要求退費或折價。',
    '委刊者保證所交付予本公司任何資料皆無侵害他人權益或違法之行為，倘若因此而造成相關違法情事時，委刊者必須自負法律責任，與本公司無關。',
    '委刊者負責所提供的網站連線正常、無損害他人電腦之程式等，本公司僅負依您所指定網址連結設定正確不負其他之責。',
    '本專案委刊單即視為合約，一經委刊者於客戶簽章欄簽名或支付本專案款項費用後本合約立即生效。'
  ],
  payeeInfoPersonal: '兆豐銀行 017\n南京東路分行\n07010000354 鄭仲傑',
  payeeInfoCompany: '兆豐銀行 017\n南京東路分行\n07009100610\n吸引力科技有限公司'
};
