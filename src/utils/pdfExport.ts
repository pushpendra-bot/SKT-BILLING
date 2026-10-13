import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Invoice, BusinessProfile } from '../types';
import { formatINR } from './gstUtils';

export const generateInvoicePdfFile = (invoice: Invoice, profile: BusinessProfile): File => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  (doc as any).autoTable = (options: any) => autoTable(doc, options);

  const pageWidth = doc.internal.pageSize.getWidth();
  let currentY = 15;

  // Header - Business Name & GSTIN
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(profile.businessName || 'SKT BILLING BUSINESS', pageWidth / 2, currentY, { align: 'center' });
  currentY += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139); // slate-500
  const addressLine = `${profile.address || ''}, City: ${profile.city || ''} - ${profile.pincode || ''}, State: ${profile.state || ''}`;
  doc.text(addressLine, pageWidth / 2, currentY, { align: 'center' });
  currentY += 5;
  doc.text(`GSTIN: ${profile.gstin || 'N/A'} | Phone: ${profile.phone || 'N/A'} | Email: ${profile.email || 'N/A'}`, pageWidth / 2, currentY, { align: 'center' });
  currentY += 8;

  // Divider line
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.5);
  doc.line(14, currentY, pageWidth - 14, currentY);
  currentY += 8;

  // Invoice Title & Meta
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(225, 29, 72); // rose-600
  const titleText = invoice.type === 'sale' ? 'TAX INVOICE' : invoice.type === 'purchase' ? 'PURCHASE BILL' : invoice.type === 'quotation' ? 'QUOTATION' : 'DELIVERY CHALLAN';
  doc.text(titleText, 14, currentY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  doc.text(`Invoice #: ${invoice.invoiceNumber}`, pageWidth - 14, currentY, { align: 'right' });
  currentY += 5;
  doc.text(`Date: ${invoice.date}`, pageWidth - 14, currentY, { align: 'right' });
  currentY += 6;

  // Buyer / Party Details Box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, currentY, pageWidth - 28, 22, 2, 2, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('Billed To / Buyer Details:', 18, currentY + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Name: ${invoice.partyName}`, 18, currentY + 12);
  doc.text(`GSTIN: ${invoice.partyGstin || 'Unregistered / Consumer'}`, 18, currentY + 17);
  doc.text(`State: ${invoice.partyState || 'N/A'} (POS: ${invoice.placeOfSupply})`, pageWidth / 2 + 10, currentY + 12);
  doc.text(`Phone: ${invoice.partyPhone || 'N/A'}`, pageWidth / 2 + 10, currentY + 17);

  currentY += 28;

  // Items Table
  const tableHeaders = [
    ['#', 'Item Description', 'HSN/SAC', 'Qty', 'Price (₹)', 'Taxable (₹)', 'Tax (%)', 'Total (₹)']
  ];

  const tableData = invoice.items.map((item, index) => [
    index + 1,
    item.itemName,
    item.hsnSac || '-',
    item.isSecondaryUnit && item.baseQuantity
      ? `${item.quantity} ${item.unit} (${item.baseQuantity})`
      : `${item.quantity} ${item.unit}`,
    formatINR(item.price),
    formatINR(item.taxableAmount),
    `${item.taxRate}%`,
    formatINR(item.totalAmount)
  ]);

  autoTable(doc, {
    startY: currentY,
    head: tableHeaders,
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontSize: 8, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8, textColor: [51, 65, 85] },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 18, halign: 'center' },
      3: { cellWidth: 18, halign: 'center' },
      4: { cellWidth: 22, halign: 'right' },
      5: { cellWidth: 24, halign: 'right' },
      6: { cellWidth: 16, halign: 'center' },
      7: { cellWidth: 26, halign: 'right' },
    },
    margin: { left: 14, right: 14 },
  });

  currentY = (doc as any).lastAutoTable.finalY + 8;

  // Totals & Bank details footer
  if (currentY > 240) {
    doc.addPage();
    currentY = 20;
  }

  // Right Side Totals Box
  const totalsX = pageWidth - 80;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(totalsX, currentY, 66, 32, 2, 2, 'F');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Subtotal:', totalsX + 4, currentY + 6);
  doc.text(formatINR(invoice.subTotal), pageWidth - 18, currentY + 6, { align: 'right' });

  doc.text('Taxable Value:', totalsX + 4, currentY + 12);
  doc.text(formatINR(invoice.totalTaxable), pageWidth - 18, currentY + 12, { align: 'right' });

  doc.text(`Total Tax (${invoice.isInterState ? 'IGST' : 'CGST+SGST'}):`, totalsX + 4, currentY + 18);
  doc.text(formatINR(invoice.totalTax), pageWidth - 18, currentY + 18, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(225, 29, 72);
  doc.text('Grand Total:', totalsX + 4, currentY + 26);
  doc.text(formatINR(invoice.grandTotal), pageWidth - 18, currentY + 26, { align: 'right' });

  // Left Side Bank Details & Amount in Words
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Amount in Words:`, 14, currentY + 6);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(doc.splitTextToSize(invoice.grandTotal ? `INR ${invoice.grandTotal}` : '', 100), 14, currentY + 11);

  currentY += 40;

  // Footer Signatures
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Receiver\'s Signature', 14, currentY + 15);
  doc.text(`For ${profile.businessName || 'Business'}`, pageWidth - 14, currentY + 5, { align: 'right' });
  doc.text('Authorized Signatory', pageWidth - 14, currentY + 15, { align: 'right' });

  const pdfBlob = doc.output('blob');
  const safeParty = (invoice.partyName || 'Customer').replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `Invoice_${invoice.invoiceNumber}_${safeParty}.pdf`;
  return new File([pdfBlob], fileName, { type: 'application/pdf' });
};

export const generateInvoicePdf = (invoice: Invoice, profile: BusinessProfile) => {
  const file = generateInvoicePdfFile(invoice, profile);
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  a.click();
  URL.revokeObjectURL(url);
};

export const generateMonthlyReportPdf = (
  reportTitle: string,
  profile: BusinessProfile,
  headers: string[],
  data: any[][],
  summaryText: string
) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  (doc as any).autoTable = (options: any) => autoTable(doc, options);

  const pageWidth = doc.internal.pageSize.getWidth();
  let currentY = 15;

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text(`SKT BILLING - ${reportTitle}`, pageWidth / 2, currentY, { align: 'center' });
  currentY += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Business: ${profile.businessName} | GSTIN: ${profile.gstin} | State: ${profile.state} (${profile.stateCode})`, pageWidth / 2, currentY, { align: 'center' });
  currentY += 8;

  doc.setDrawColor(203, 213, 225);
  doc.line(14, currentY, pageWidth - 14, currentY);
  currentY += 6;

  if (summaryText) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);
    doc.text(summaryText, 14, currentY);
    currentY += 6;
  }

  autoTable(doc, {
    startY: currentY,
    head: [headers],
    body: data,
    theme: 'grid',
    headStyles: { fillColor: [225, 29, 72], textColor: [255, 255, 255], fontSize: 9, fontStyle: 'bold' },
    bodyStyles: { fontSize: 8, textColor: [51, 65, 85] },
    margin: { left: 14, right: 14 },
  });

  doc.save(`SKTBilling_${reportTitle.replace(/\s+/g, '_')}_Report.pdf`);
};
