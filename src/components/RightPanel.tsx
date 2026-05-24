import React, { useMemo } from 'react';
import { useStore } from '@nanostores/react';
import { brandStore, invoiceStore, metadataStore } from '@/store/invoiceStore';
import { Lock } from 'lucide-react';

interface RightPanelProps {
  onRemoveWatermark?: () => void;
}

export function RightPanel({ onRemoveWatermark }: RightPanelProps) {
  const brand = useStore(brandStore);
  const invoice = useStore(invoiceStore);
  const metadata = useStore(metadataStore);

  const subtotal = useMemo(() => {
    return invoice.lineItems.reduce((sum, item) => {
      const lineTotal = (item.quantity * item.rate) - (item.discount || 0);
      return sum + Math.max(0, lineTotal);
    }, 0);
  }, [invoice.lineItems]);

  const taxAmount = (subtotal * invoice.taxRate) / 100;
  const total = subtotal + taxAmount - invoice.discount + invoice.shipping;

  const formatIDR = (value: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);
  };

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
                <div className="h-16 flex items-center text-slate-400 italic">Logo Anda</div>
              )}
            </div>
            <div className="text-right">
              <h1 className="text-4xl font-bold mb-6" style={{ color: brand.primaryColor }}>Invoice</h1>
              <table className="ml-auto text-sm">
                <tbody>
                  <tr>
                    <td className="pr-4 text-slate-600 text-right">Referensi</td>
                    <td className="font-medium text-right">{invoice.invoiceNumber || 'INV-XXXX'}</td>
                  </tr>
                  <tr>
                    <td className="pr-4 text-slate-600 text-right">Tanggal</td>
                    <td className="font-medium text-right">{invoice.date || '-'}</td>
                  </tr>
                  {invoice.dueDate && (
                    <tr>
                      <td className="pr-4 text-slate-600 text-right">Tgl. Jatuh Tempo</td>
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
              <h3 className="text-sm font-bold mb-2" style={{ color: brand.headerColor }}>Informasi Perusahaan</h3>
              <div className="border-b-2 mb-4" style={{ borderColor: brand.headerColor }}></div>
              
              {metadata.companyName && (
                <div className="text-base font-bold mb-2" style={{ color: brand.primaryColor }}>{metadata.companyName}</div>
              )}
              <div className="text-sm space-y-0.5 text-slate-600 whitespace-pre-wrap">
                {metadata.companyAddress && <div>{metadata.companyAddress}</div>}
                {metadata.companyPhone && <div>Telp: {metadata.companyPhone}</div>}
                {metadata.companyEmail && <div>Email: {metadata.companyEmail}</div>}
                {metadata.companyWebsite && <div>Web: {metadata.companyWebsite}</div>}
                {metadata.npwp && <div className="mt-2 font-medium" style={{ color: brand.headerColor }}>NPWP: {metadata.npwp}</div>}
              </div>
            </div>

            {/* Client Info */}
            <div>
              <h3 className="text-sm font-bold mb-2" style={{ color: brand.headerColor }}>Tagihan Kepada</h3>
              <div className="border-b-2 mb-4" style={{ borderColor: brand.headerColor }}></div>
              
              <div className="text-base font-bold mb-2" style={{ color: brand.primaryColor }}>{invoice.clientName || 'Nama Klien'}</div>
              {invoice.clientAddress && (
                <div className="text-sm text-slate-600 whitespace-pre-wrap mt-2">{invoice.clientAddress}</div>
              )}
            </div>
          </div>
                </td>
              </tr>
              <tr className="border-b-2" style={{ borderColor: brand.primaryColor }}>
                <th className="py-3 font-bold uppercase text-sm" style={{ color: brand.headerColor }}>Item & Deskripsi</th>
                <th className="py-3 font-bold uppercase text-sm text-center w-20" style={{ color: brand.headerColor }}>Kuantitas</th>
                <th className="py-3 font-bold uppercase text-sm text-right w-32" style={{ color: brand.headerColor }}>Harga Satuan</th>
                {hasItemDiscounts && <th className="py-3 font-bold uppercase text-sm text-right w-24" style={{ color: brand.headerColor }}>Diskon</th>}
                <th className="py-3 font-bold uppercase text-sm text-right w-36" style={{ color: brand.headerColor }}>Jumlah</th>
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
                      <td className="py-4 text-right tabular-nums">{formatIDR(item.rate)}</td>
                      {hasItemDiscounts && (
                        <td className="py-4 text-right text-red-600 tabular-nums">
                          {item.discount ? `-${formatIDR(item.discount)}` : '-'}
                        </td>
                      )}
                      <td className="py-4 text-right font-medium tabular-nums">{formatIDR(lineTotal)}</td>
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
              <h4 className="font-bold text-sm uppercase mb-2" style={{ color: brand.headerColor }}>Detail Pembayaran</h4>
              <div className="text-sm space-y-1">
                <div><span className="font-medium">Bank:</span> {metadata.bankName} {metadata.branch && `(${metadata.branch})`}</div>
                <div><span className="font-medium">No. Rekening:</span> {metadata.accountNumber}</div>
                <div><span className="font-medium">A/N:</span> {metadata.accountName}</div>
              </div>
            </div>

            {/* Totals Box */}
            <div className="w-1/3 tabular-nums">
              <div className="flex justify-between py-1 border-b">
                <span className="text-sm font-medium" style={{ color: brand.headerColor }}>Subtotal</span>
                <span>{formatIDR(subtotal)}</span>
              </div>
              {invoice.taxRate > 0 && (
                <div className="flex justify-between py-1 border-b">
                  <span className="text-sm font-medium" style={{ color: brand.headerColor }}>PPN ({invoice.taxRate}%)</span>
                  <span>{formatIDR(taxAmount)}</span>
                </div>
              )}
              {invoice.discount > 0 && (
                <div className="flex justify-between py-1 border-b">
                  <span className="text-sm font-medium" style={{ color: brand.headerColor }}>Diskon</span>
                  <span className="text-red-600">-{formatIDR(invoice.discount)}</span>
                </div>
              )}
              {invoice.shipping > 0 && (
                <div className="flex justify-between py-1 border-b">
                  <span className="text-sm font-medium" style={{ color: brand.headerColor }}>Pengiriman/Lainnya</span>
                  <span>{formatIDR(invoice.shipping)}</span>
                </div>
              )}
              <div className="flex justify-between py-3 mt-1 border-t-2 font-bold text-lg" style={{ borderColor: brand.primaryColor, color: brand.primaryColor }}>
                <span>Total</span>
                <span>{formatIDR(total)}</span>
              </div>
            </div>
          </div>
          </div>

          {/* Signatures & Meterai */}
          {/* Signatures & Meterai */}
          <div className="mt-16 pb-8 block" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
            <div className="flex items-end justify-end gap-6">
              {hasMeterai && (
                <div className="w-[3cm] h-[3cm] border-2 border-dashed border-slate-300 flex items-center justify-center text-center p-2">
                  <span className="text-xs text-slate-400 font-medium italic">Tempel Meterai Rp 10.000 di sini</span>
                </div>
              )}
              <div className="w-56 text-center">
                <div className="text-sm mb-16" style={{ color: brand.headerColor }}>Dengan Hormat,</div>
                <div className="border-b border-black mb-2"></div>
                <div className="text-sm font-bold" style={{ color: brand.headerColor }}>{metadata.signatureName || 'Tanda Tangan Resmi'}</div>
                <div className="text-xs text-slate-500 mt-1">{metadata.signaturePosition || 'Direktur'}</div>
              </div>
            </div>
          </div>
          
          {invoice.notes && (
            <div className="mt-4 text-xs text-slate-500 whitespace-pre-wrap" style={{ breakInside: 'avoid' }}>
              <span className="font-bold">Catatan / Syarat & Ketentuan:</span><br/>
              {invoice.notes}
            </div>
          )}

          {/* Programmatic Watermark */}
          <div className="mt-12 pt-8 border-t text-center flex flex-col items-center justify-center text-xs text-slate-400 no-print-hide print:flex relative" style={{ breakInside: 'avoid' }}>
            <span>Dibuat secara instan dengan <span className="font-semibold text-slate-500">tagihin.co.id</span></span>
            <img src="/logo.png" alt="Tagihin" className="h-5 mt-3 opacity-50 grayscale" />
            
            {onRemoveWatermark && (
              <button 
                onClick={onRemoveWatermark}
                className="mt-4 px-4 py-1.5 flex items-center gap-2 text-xs font-medium text-[#30a9b1] bg-[#30a9b1]/10 hover:bg-[#30a9b1]/20 rounded-full transition-colors print:hidden"
              >
                <Lock className="w-3 h-3" /> Hapus Watermark
              </button>
            )}
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
