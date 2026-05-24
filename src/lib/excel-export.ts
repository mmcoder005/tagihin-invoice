import * as ExcelJS from 'exceljs';
import pkg from 'file-saver';
const { saveAs } = pkg;

function formatIDDate(dateStr: string) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const [yyyy, mm, dd] = parts;
    return `${dd}/${mm}/${yyyy}`;
  }
  return dateStr;
}

export async function exportUniversalExcel(invoices: any[], filenamePrefix = 'Export_Invoice') {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Data Invoice');

  // Define The Simplified Universal Master Schema
  worksheet.columns = [
    { header: 'Tanggal Invoice', key: 'tanggal', width: 15 },
    { header: 'Nomor Invoice', key: 'nomor', width: 20 },
    { header: 'Nama Pelanggan', key: 'pelanggan', width: 25 },
    { header: 'Deskripsi Item', key: 'deskripsi', width: 35 },
    { header: 'Harga Satuan', key: 'harga', width: 15 },
    { header: 'Kuantitas', key: 'kuantitas', width: 10 },
    { header: 'Pajak (PPN %)', key: 'pajak', width: 12 },
    { header: 'Total Baris', key: 'total_baris', width: 15 },
    { header: 'Total Tagihan', key: 'total_tagihan', width: 20 },
  ];

  invoices.forEach((inv) => {
    const lineItems = inv.line_items || inv.lineItems || [];
    const taxRate = typeof inv.tax_rate === 'number' ? inv.tax_rate : (typeof inv.taxRate === 'number' ? inv.taxRate : 0);
    const discount = typeof inv.discount === 'number' ? inv.discount : 0;
    const shipping = typeof inv.shipping === 'number' ? inv.shipping : 0;
    
    // Calculate Grand Total for the Invoice
    const subtotal = lineItems.reduce((sum: number, item: any) => sum + ((item.rate || 0) * (item.quantity || 1)), 0);
    const afterDiscount = subtotal - discount;
    const taxAmount = (afterDiscount * taxRate) / 100;
    const grandTotal = afterDiscount + taxAmount + shipping;

    const formattedDate = formatIDDate(inv.date);
    const invoiceNumber = inv.invoice_number || inv.invoiceNumber;
    const clientName = inv.client_name || inv.clientName;

    if (lineItems.length === 0) {
      // Fallback row if no line items exist
      worksheet.addRow({
        tanggal: formattedDate,
        nomor: invoiceNumber,
        pelanggan: clientName,
        deskripsi: '-',
        harga: 0,
        kuantitas: 0,
        pajak: taxRate,
        total_baris: 0,
        total_tagihan: grandTotal,
      });
      return;
    }

    lineItems.forEach((item: any) => {
      // Deskripsi Item maps to item name + description
      const itemName = item.name || '';
      const itemDesc = item.description || '';
      const fullDesc = itemName && itemDesc ? `${itemName} - ${itemDesc}` : (itemName || itemDesc || '-');
      
      const qty = item.quantity || 1;
      const rate = item.rate || 0;
      const rowTotal = qty * rate;

      worksheet.addRow({
        tanggal: formattedDate,
        nomor: invoiceNumber,
        pelanggan: clientName,
        deskripsi: fullDesc,
        harga: rate,
        kuantitas: qty,
        pajak: taxRate,
        total_baris: rowTotal,
        total_tagihan: grandTotal,
      });
    });
  });

  // Styling: Make headers bold and format numeric columns
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true };
  
  // Format numbers
  worksheet.getColumn('harga').numFmt = '#,##0.00';
  worksheet.getColumn('total_baris').numFmt = '#,##0.00';
  worksheet.getColumn('total_tagihan').numFmt = '#,##0.00';
  
  // Lock Invoice Number as text to prevent dropping leading zeros
  worksheet.getColumn('nomor').numFmt = '@';

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${filenamePrefix}_${new Date().toISOString().split('T')[0]}.xlsx`);
}
