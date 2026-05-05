export type PaymentType = 'personal' | 'company';

export interface OrderData {
  fillDate: string;
  periodStart: string;
  periodEnd: string;
  clientName: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  monthlyFee: number;
  paymentType: PaymentType;
  contactWindow: string;
}

export interface SubmittedPayload extends OrderData {
  signatureDataUrl: string;
  signedAt: string;
  pdfBase64: string;
  filename: string;
}

export const defaultOrder: OrderData = {
  fillDate: '',
  periodStart: '',
  periodEnd: '',
  clientName: '',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  contactAddress: '',
  monthlyFee: 4200,
  paymentType: 'personal',
  contactWindow: 'clare'
};
