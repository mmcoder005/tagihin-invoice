import React, { useRef } from 'react';
import { useStore } from '@nanostores/react';
import { brandStore, invoiceStore, metadataStore } from '@/store/invoiceStore';
import { TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { NumericFormat } from 'react-number-format';
import { Plus, Trash2 } from 'lucide-react';

const toBase64 = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => resolve(reader.result as string);
  reader.onerror = error => reject(error);
});

export function LeftPanel() {
  const brand = useStore(brandStore);
  const invoice = useStore(invoiceStore);
  const metadata = useStore(metadataStore);

  const handlePrint = () => {
    window.print();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, key: keyof typeof brand) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
        alert("File size exceeds 4MB limit");
        return;
      }
      const base64 = await toBase64(file);
      brandStore.setKey(key as any, base64);
    }
  };

  const updateLineItem = (id: string, field: string, value: any) => {
    const items = invoice.lineItems.map(item => item.id === id ? { ...item, [field]: value } : item);
    invoiceStore.setKey('lineItems', items);
  };

  const removeLineItem = (id: string) => {
    invoiceStore.setKey('lineItems', invoice.lineItems.filter(item => item.id !== id));
  };

  const addLineItem = () => {
    invoiceStore.setKey('lineItems', [...invoice.lineItems, { id: Math.random().toString(), name: '', description: '', quantity: 1, rate: 0, discount: 0 }]);
  };

  const isExportDisabled = !invoice.invoiceNumber || !invoice.clientName || !metadata.bankName || !metadata.accountNumber || invoice.lineItems.length === 0;

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex-1 p-6 overflow-y-auto">
          
          <TabsContent value="data" className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nomor Invoice</Label>
                <Input value={invoice.invoiceNumber} onChange={e => invoiceStore.setKey('invoiceNumber', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Nama Klien / Perusahaan</Label>
                <Input value={invoice.clientName} onChange={e => invoiceStore.setKey('clientName', e.target.value)} />
              </div>
              <div className="space-y-2 col-span-2">
                <Label>Alamat Klien (Opsional)</Label>
                <Input value={invoice.clientAddress} onChange={e => invoiceStore.setKey('clientAddress', e.target.value)} placeholder="Alamat penagihan klien..." />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tanggal</Label>
                <Input type="date" value={invoice.date} onChange={e => invoiceStore.setKey('date', e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Jatuh Tempo (Opsional)</Label>
                <Input type="date" value={invoice.dueDate} onChange={e => invoiceStore.setKey('dueDate', e.target.value)} />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-semibold">Daftar Item</Label>
                <Button variant="outline" size="sm" onClick={addLineItem}><Plus className="w-4 h-4 mr-1" /> Tambah Item</Button>
              </div>
              {invoice.lineItems.map((item, index) => (
                <Card key={item.id} className="shadow-sm border-slate-200/60 bg-white">
                  <CardContent className="p-4 flex gap-3 items-start flex-wrap">
                    <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-[#20324c] uppercase tracking-wide">Nama Item</Label>
                        <Input value={item.name} onChange={e => updateLineItem(item.id, 'name', e.target.value)} placeholder="Jasa Konsultasi" className="h-10 text-sm font-medium input-hairline" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-[#20324c] uppercase tracking-wide">Deskripsi</Label>
                        <Input value={item.description} onChange={e => updateLineItem(item.id, 'description', e.target.value)} placeholder="Deskripsi proyek..." className="h-10 text-sm input-hairline" />
                      </div>
                    </div>
                    
                    <div className="flex w-full gap-4 items-end flex-wrap">
                      <div className="w-24 space-y-2">
                        <Label className="text-xs font-semibold text-[#20324c] uppercase tracking-wide">Jml</Label>
                        <Input type="number" value={item.quantity} onChange={e => updateLineItem(item.id, 'quantity', parseFloat(e.target.value) || 0)} className="h-10 text-sm tabular-nums input-hairline" />
                      </div>
                      <div className="flex-1 min-w-[120px] space-y-2">
                        <Label className="text-xs font-semibold text-[#20324c] uppercase tracking-wide">Harga Satuan (IDR)</Label>
                      <NumericFormat
                        customInput={Input}
                        thousandSeparator="."
                        decimalSeparator=","
                        prefix="Rp "
                        value={item.rate}
                        onValueChange={(values) => updateLineItem(item.id, 'rate', values.floatValue || 0)}
                        className="h-10 text-sm tabular-nums input-hairline"
                      />
                    </div>
                    <div className="flex-1 min-w-[120px] space-y-2">
                      <Label className="text-xs font-semibold text-[#20324c] uppercase tracking-wide">Diskon (IDR)</Label>
                      <NumericFormat
                        customInput={Input}
                        thousandSeparator="."
                        decimalSeparator=","
                        prefix="Rp "
                        value={item.discount}
                        onValueChange={(values) => updateLineItem(item.id, 'discount', values.floatValue || 0)}
                        className="h-10 text-sm text-red-600 tabular-nums input-hairline"
                      />
                    </div>
                    <div className="pb-1">
                      <Button variant="ghost" size="icon" className="h-10 w-10 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-full" onClick={() => removeLineItem(item.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              <div className="space-y-2">
                <Label>Pajak (PPN %)</Label>
                <Input type="number" value={invoice.taxRate} onChange={e => invoiceStore.setKey('taxRate', parseFloat(e.target.value) || 0)} className="tabular-nums" />
              </div>
              <div className="space-y-2">
                <Label>Diskon (IDR)</Label>
                <NumericFormat customInput={Input} thousandSeparator="." decimalSeparator="," prefix="Rp " value={invoice.discount} onValueChange={(v) => invoiceStore.setKey('discount', v.floatValue || 0)} className="tabular-nums" />
              </div>
              <div className="space-y-2">
                <Label>Pengiriman/Lainnya (IDR)</Label>
                <NumericFormat customInput={Input} thousandSeparator="." decimalSeparator="," prefix="Rp " value={invoice.shipping} onValueChange={(v) => invoiceStore.setKey('shipping', v.floatValue || 0)} className="tabular-nums" />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Catatan / Syarat & Ketentuan</Label>
              <textarea 
                className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                value={invoice.notes} onChange={e => invoiceStore.setKey('notes', e.target.value)} 
              />
            </div>
          </TabsContent>
          
          <TabsContent value="brand" className="space-y-8">
            <div className="space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2">Aset Brand</h3>
              <div className="space-y-2">
                <Label>Logo Perusahaan (PNG/SVG)</Label>
                <Input type="file" accept="image/*" onChange={e => handleFileUpload(e, 'logoBase64')} className="cursor-pointer file:bg-slate-100 file:text-slate-700 file:border-0 file:rounded-md file:mr-4 file:px-3 file:py-1 hover:file:bg-slate-200" />
              </div>
              <div className="space-y-2">
                <Label>Tipografi Kustom (.ttf, .otf, .woff2)</Label>
                <Input type="file" accept=".ttf,.otf,.woff2" onChange={e => handleFileUpload(e, 'fontBase64')} className="cursor-pointer file:bg-slate-100 file:text-slate-700 file:border-0 file:rounded-md file:mr-4 file:px-3 file:py-1 hover:file:bg-slate-200" />
                <p className="text-xs text-slate-500">Ukuran maks 4MB. Otomatis diterapkan pada pratinjau.</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2">Pengaturan Warna</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2 flex flex-col">
                  <Label>Warna Utama</Label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={brand.primaryColor} onChange={e => brandStore.setKey('primaryColor', e.target.value)} className="h-9 w-9 p-0 border-0 rounded cursor-pointer" />
                    <Input value={brand.primaryColor} onChange={e => brandStore.setKey('primaryColor', e.target.value)} className="font-mono text-xs uppercase" />
                  </div>
                </div>
                <div className="space-y-2 flex flex-col">
                  <Label>Teks Header</Label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={brand.headerColor} onChange={e => brandStore.setKey('headerColor', e.target.value)} className="h-9 w-9 p-0 border-0 rounded cursor-pointer" />
                    <Input value={brand.headerColor} onChange={e => brandStore.setKey('headerColor', e.target.value)} className="font-mono text-xs uppercase" />
                  </div>
                </div>
                <div className="space-y-2 flex flex-col">
                  <Label>Latar Belakang Tabel</Label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={brand.mutedColor} onChange={e => brandStore.setKey('mutedColor', e.target.value)} className="h-9 w-9 p-0 border-0 rounded cursor-pointer" />
                    <Input value={brand.mutedColor} onChange={e => brandStore.setKey('mutedColor', e.target.value)} className="font-mono text-xs uppercase" />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-lg border-b pb-2">Data Perusahaan</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label>Nama Perusahaan</Label>
                  <Input value={metadata.companyName} onChange={e => metadataStore.setKey('companyName', e.target.value)} placeholder="PT Kledo Berhati Nyaman" />
                </div>
                <div className="space-y-2">
                  <Label>Alamat Perusahaan (Opsional)</Label>
                  <Input value={metadata.companyAddress} onChange={e => metadataStore.setKey('companyAddress', e.target.value)} placeholder="Jl. Jend. Sudirman No. 123" />
                </div>
                <div className="space-y-2">
                  <Label>Nomor Telepon (Opsional)</Label>
                  <Input value={metadata.companyPhone} onChange={e => metadataStore.setKey('companyPhone', e.target.value)} placeholder="+62 812 3456 7890" />
                </div>
                <div className="space-y-2">
                  <Label>Email Perusahaan (Opsional)</Label>
                  <Input type="email" value={metadata.companyEmail} onChange={e => metadataStore.setKey('companyEmail', e.target.value)} placeholder="billing@perusahaan.com" />
                </div>
                <div className="space-y-2">
                  <Label>Website Perusahaan (Opsional)</Label>
                  <Input value={metadata.companyWebsite} onChange={e => metadataStore.setKey('companyWebsite', e.target.value)} placeholder="www.perusahaan.com" />
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t">
                <Label>NPWP</Label>
                <Input value={metadata.npwp} onChange={e => metadataStore.setKey('npwp', e.target.value)} placeholder="00.000.000.0-000.000" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nama Bank</Label>
                  <Input value={metadata.bankName} onChange={e => metadataStore.setKey('bankName', e.target.value)} placeholder="Bank Central Asia" />
                </div>
                <div className="space-y-2">
                  <Label>Kantor Cabang (Opsional)</Label>
                  <Input value={metadata.branch} onChange={e => metadataStore.setKey('branch', e.target.value)} placeholder="KCP Sudirman" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nomor Rekening</Label>
                  <Input value={metadata.accountNumber} onChange={e => metadataStore.setKey('accountNumber', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Nama Pemilik Rekening (A/N)</Label>
                  <Input value={metadata.accountName} onChange={e => metadataStore.setKey('accountName', e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                <div className="space-y-2">
                  <Label>Nama Penandatangan</Label>
                  <Input value={metadata.signatureName} onChange={e => metadataStore.setKey('signatureName', e.target.value)} placeholder="Budi Santoso" />
                </div>
                <div className="space-y-2">
                  <Label>Jabatan</Label>
                  <Input value={metadata.signaturePosition} onChange={e => metadataStore.setKey('signaturePosition', e.target.value)} placeholder="Direktur" />
                </div>
              </div>
            </div>

          </TabsContent>
      </div>
    </div>
  );
}
