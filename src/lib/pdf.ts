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

  // Reset any visual scaling (used for mobile preview) so the PDF renders at
  // the contract's natural width regardless of viewport.
  const prevTransform = node.style.transform;
  const prevOrigin = node.style.transformOrigin;
  node.style.transform = '';
  node.style.transformOrigin = '';

  let canvas: HTMLCanvasElement;
  try {
    canvas = await html2canvas(node, {
      scale: 2,
      backgroundColor: '#ffffff',
      useCORS: true,
      windowWidth: node.scrollWidth
    });
  } finally {
    node.style.transform = prevTransform;
    node.style.transformOrigin = prevOrigin;
  }

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
  const m = dt.getMonth() + 1;
  const d = dt.getDate();
  const yy = String(dt.getFullYear()).slice(-2);
  const safeName = (clientName || '客戶').replace(/[\\/:*?"<>|]/g, '_');
  const filename = `${safeName} ${m}/${d}/${yy}.pdf`;

  return { blob, base64, filename };
}
