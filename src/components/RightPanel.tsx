import React, { useMemo } from 'react';
import { useStore } from '@nanostores/react';
import { brandStore, invoiceStore, metadataStore, languageStore } from '@/store/invoiceStore';
import { translations } from '@/lib/i18n';
import { formatCurrency } from '@/lib/formatCurrency';
import { Lock } from 'lucide-react';

interface RightPanelProps {
  onRemoveWatermark?: () => void;
}

export function RightPanel({ onRemoveWatermark }: RightPanelProps) {
  const brand = useStore(brandStore);
  const invoice = useStore(invoiceStore);
  const metadata = useStore(metadataStore);
  const lang = useStore(languageStore);
  const t = translations[lang];

  const subtotal = useMemo(() => {
    return invoice.lineItems.reduce((sum, item) => {
      const lineTotal = (item.quantity * item.rate) - (item.discount || 0);
      return sum + Math.max(0, lineTotal);
    }, 0);
  }, [invoice.lineItems]);

  const taxAmount = (subtotal * invoice.taxRate) / 100;
  const total = subtotal + taxAmount - invoice.discount + invoice.shipping;

  const hasMeterai = total >= 5000000;
  const hasItemDiscounts = invoice.lineItems.some(item => (item.discount || 0) > 0);

  return (
    <>
      {brand.fontBase64 && (
        <style dangerouslySetInnerHTML={{
          __html: `
            @font-face {
              font-family: 'CustomBrandFont';
              src: url(${brand.fontBase64});
            }
            .brand-font {
              font-family: 'CustomBrandFont', sans-serif !important;
            }
          `
        }} />
      )}
      <div 
        className="relative bg-white shadow-xl print:shadow-none mx-auto p-12 brand-font block print:m-0 print:border-none print:min-h-0"
        style={{ 
          width: '210mm', 
          minHeight: '297mm',
          backgroundColor: '#ffffff'
        }}
      >


        <div className="relative z-10">
          <table className="w-full text-left border-collapse">
            <thead className="table-header-group">
              <tr>
                <td colSpan={hasItemDiscounts ? 5 : 4} className="pb-12 border-none p-0">
          {/* Top Header */}
          <div className="flex justify-between items-start mb-12">
            <div>
              {brand.logoBase64 ? (
                <img src={brand.logoBase64} alt="Company Logo" className="h-16 object-contain" />
              ) : (
                <div className="h-16 flex items-center text-slate-400 italic">{t.logoPlaceholderPreview}</div>
              )}
            </div>
            <div className="text-right">
              <h1 className="text-4xl font-bold mb-6" style={{ color: brand.primaryColor }}>{t.invoice}</h1>
              <table className="ml-auto text-sm">
                <tbody>
                  <tr>
                    <td className="pr-4 text-slate-600 text-right">{t.reference}</td>
                    <td className="font-medium text-right">{invoice.invoiceNumber || 'INV-XXXX'}</td>
                  </tr>
                  <tr>
                    <td className="pr-4 text-slate-600 text-right">{t.date}</td>
                    <td className="font-medium text-right">{invoice.date || '-'}</td>
                  </tr>
                  {invoice.dueDate && (
                    <tr>
                      <td className="pr-4 text-slate-600 text-right">{t.dueDate}</td>
                      <td className="font-medium text-right">{invoice.dueDate}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Info Section */}
          <div className="grid grid-cols-2 gap-12 mb-12">
            {/* Company Info */}
            <div>
              <h3 className="text-sm font-bold mb-2" style={{ color: brand.headerColor }}>{t.companyInfo}</h3>
              <div className="border-b-2 mb-4" style={{ borderColor: brand.headerColor }}></div>
              
              {metadata.companyName && (
                <div className="text-base font-bold mb-2" style={{ color: brand.primaryColor }}>{metadata.companyName}</div>
              )}
              <div className="text-sm space-y-0.5 text-slate-600 whitespace-pre-wrap">
                {metadata.companyAddress && <div>{metadata.companyAddress}</div>}
                {metadata.companyPhone && <div>Tel: {metadata.companyPhone}</div>}
                {metadata.companyEmail && <div>Email: {metadata.companyEmail}</div>}
                {metadata.companyWebsite && <div>Web: {metadata.companyWebsite}</div>}
                {metadata.npwp && <div className="mt-2 font-medium" style={{ color: brand.headerColor }}>{lang === 'en' ? 'Tax ID' : 'NPWP'}: {metadata.npwp}</div>}
              </div>
            </div>

            {/* Client Info */}
            <div>
              <h3 className="text-sm font-bold mb-2" style={{ color: brand.headerColor }}>{t.billTo}</h3>
              <div className="border-b-2 mb-4" style={{ borderColor: brand.headerColor }}></div>
              
              <div className="text-base font-bold mb-2" style={{ color: brand.primaryColor }}>{invoice.clientName || (lang === 'en' ? 'Client Name' : 'Nama Klien')}</div>
              {invoice.clientAddress && (
                <div className="text-sm text-slate-600 whitespace-pre-wrap mt-2">{invoice.clientAddress}</div>
              )}
            </div>
          </div>
                </td>
              </tr>
              <tr className="border-b-2" style={{ borderColor: brand.primaryColor }}>
                <th className="py-3 font-bold uppercase text-sm" style={{ color: brand.headerColor }}>{t.itemDescription}</th>
                <th className="py-3 font-bold uppercase text-sm text-center w-20" style={{ color: brand.headerColor }}>{t.quantity}</th>
                <th className="py-3 font-bold uppercase text-sm text-right w-32" style={{ color: brand.headerColor }}>{t.unitPrice}</th>
                {hasItemDiscounts && <th className="py-3 font-bold uppercase text-sm text-right w-24" style={{ color: brand.headerColor }}>{t.discount}</th>}
                <th className="py-3 font-bold uppercase text-sm text-right w-36" style={{ color: brand.headerColor }}>{t.amount}</th>
              </tr>
            </thead>
            <tbody>
                {invoice.lineItems.map((item, i) => {
                  const lineTotal = Math.max(0, (item.quantity * item.rate) - (item.discount || 0));
                  return (
                    <tr key={i} className="border-b" style={{ backgroundColor: i % 2 === 0 ? 'transparent' : brand.mutedColor, breakInside: 'avoid' }}>
                      <td className="py-4 pr-4">
                        {item.name && <div className="font-semibold">{item.name}</div>}
                        {item.description && <div className="text-sm text-slate-600 mt-0.5 whitespace-pre-wrap">{item.description}</div>}
                        {!item.name && !item.description && <span className="text-slate-400">...</span>}
                      </td>
                      <td className="py-4 text-center tabular-nums">{item.quantity}</td>
                      <td className="py-4 text-right tabular-nums">{formatCurrency(item.rate, invoice.currency)}</td>
                      {hasItemDiscounts && (
                        <td className="py-4 text-right text-red-600 tabular-nums">
                          {item.discount ? `-${formatCurrency(item.discount, invoice.currency)}` : '-'}
                        </td>
                      )}
                      <td className="py-4 text-right font-medium tabular-nums">{formatCurrency(lineTotal, invoice.currency)}</td>
                    </tr>
                  );
                })}
              {/* Footer & Totals */}
              <tr>
                <td colSpan={hasItemDiscounts ? 5 : 4} className="p-0 border-0 pt-12">
                  <div className="block" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
            <div className="flex justify-between items-end">
              {/* Payment Details */}
              <div className="w-1/2 p-4 rounded-md" style={{ backgroundColor: brand.mutedColor }}>
              <h4 className="font-bold text-sm uppercase mb-2" style={{ color: brand.headerColor }}>{t.paymentInfo}</h4>
              <div className="text-sm space-y-1">
                <div><span className="font-medium">Bank:</span> {metadata.bankName} {metadata.branch && `(${metadata.branch})`}</div>
                <div><span className="font-medium">{lang === 'en' ? 'Acc No:' : 'No. Rekening:'}</span> {metadata.accountNumber}</div>
                <div><span className="font-medium">{lang === 'en' ? 'Acc Name:' : 'A/N:'}</span> {metadata.accountName}</div>
              </div>
            </div>

            {/* Totals Box */}
            <div className="w-1/3 tabular-nums">
              <div className="flex justify-between py-1 border-b">
                <span className="text-sm font-medium" style={{ color: brand.headerColor }}>{t.subtotal}</span>
                <span>{formatCurrency(subtotal, invoice.currency)}</span>
              </div>
              {invoice.taxRate > 0 && (
                <div className="flex justify-between py-1 border-b">
                  <span className="text-sm font-medium" style={{ color: brand.headerColor }}>{t.tax} ({invoice.taxRate}%)</span>
                  <span>{formatCurrency(taxAmount, invoice.currency)}</span>
                </div>
              )}
              {invoice.discount > 0 && (
                <div className="flex justify-between py-1 border-b">
                  <span className="text-sm font-medium" style={{ color: brand.headerColor }}>{t.discount}</span>
                  <span className="text-red-600">-{formatCurrency(invoice.discount, invoice.currency)}</span>
                </div>
              )}
              {invoice.shipping > 0 && (
                <div className="flex justify-between py-1 border-b">
                  <span className="text-sm font-medium" style={{ color: brand.headerColor }}>{t.shipping}</span>
                  <span>{formatCurrency(invoice.shipping, invoice.currency)}</span>
                </div>
              )}
              <div className="flex justify-between py-3 mt-1 border-t-2 font-bold text-lg" style={{ borderColor: brand.primaryColor, color: brand.primaryColor }}>
                <span>{t.total}</span>
                <span>{formatCurrency(total, invoice.currency)}</span>
              </div>
            </div>
          </div>
          </div>

          {/* Signatures & Meterai */}
          <div className="mt-16 pb-8 block" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
            <div className="flex items-end justify-end gap-6">
              {hasMeterai && (
                <div className="w-[3cm] h-[3cm] border-2 border-dashed border-slate-300 flex items-center justify-center text-center p-2">
                  <span className="text-xs text-slate-400 font-medium italic">{lang === 'en' ? 'Duty Stamp Rp 10.000' : 'Tempel Meterai Rp 10.000 di sini'}</span>
                </div>
              )}
              <div className="w-56 text-center">
                <div className="text-sm mb-16" style={{ color: brand.headerColor }}>{lang === 'en' ? 'Sincerely,' : 'Dengan Hormat,'}</div>
                <div className="border-b border-black mb-2"></div>
                <div className="text-sm font-bold" style={{ color: brand.headerColor }}>{metadata.signatureName || t.signature}</div>
                <div className="text-xs text-slate-500 mt-1">{metadata.signaturePosition || ''}</div>
              </div>
            </div>
          </div>
          
          {invoice.notes && (
            <div className="mt-4 text-xs text-slate-500 whitespace-pre-wrap" style={{ breakInside: 'avoid' }}>
              <span className="font-bold">{t.notes}:</span><br/>
              {invoice.notes}
            </div>
          )}

          {/* Programmatic Watermark */}
          <div className="mt-12 pt-8 border-t text-center flex flex-col items-center justify-center text-xs text-slate-400 no-print-hide print:flex relative" style={{ breakInside: 'avoid' }}>
            <span>{t.watermark}</span>
            <a href="https://tagihin-invoice.vercel.app/" target="_blank" rel="noopener noreferrer" className="hover:opacity-100 transition-opacity">
              <img src="/logo.png" alt="Tagihin" className="h-5 mt-3 opacity-50 grayscale hover:grayscale-0 transition-all duration-300" />
            </a>
          </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
