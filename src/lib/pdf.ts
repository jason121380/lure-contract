import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export interface PdfResult {
  blob: Blob;
  base64: string;
  filename: string;
}

export async function generateContractPdf(
  clientName: string,
  signedAtIso: string
): Promise<PdfResult> {
  const node = document.getElementById('printable-contract') as HTMLElement | null;
  if (!node) throw new Error('printable-contract element not found');

  const canvas = await html2canvas(node, {
    scale: 2,
    backgroundColor: '#ffffff',
    useCORS: true,
    windowWidth: node.scrollWidth
  });

  const pdf = new jsPDF({ unit: 'pt', format: 'a4', compress: true });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  // Multi-page if content height exceeds one A4 page.
  const imgData = canvas.toDataURL('image/png');
  let heightLeft = imgHeight;
  let position = 0;

  pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
  heightLeft -= pageHeight;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
  }

  const blob = pdf.output('blob');
  const base64 = (pdf.output('datauristring') as string).split(',')[1] ?? '';

  const dt = new Date(signedAtIso);
  const ymd = `${dt.getFullYear()}${String(dt.getMonth() + 1).padStart(2, '0')}${String(dt.getDate()).padStart(2, '0')}`;
  const safeName = (clientName || '客戶').replace(/[\\/:*?"<>|]/g, '_');
  const filename = `委刊單_${safeName}_${ymd}.pdf`;

  return { blob, base64, filename };
}
