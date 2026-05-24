import React, { useEffect, useState } from 'react';
import { useStore } from '@nanostores/react';
import { isStoreReady, initStore, invoiceStore, brandStore, metadataStore } from '@/store/invoiceStore';
import { LeftPanel } from './LeftPanel';
import { RightPanel } from './RightPanel';
import { Download, FileSpreadsheet } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { exportUniversalExcel } from '@/lib/excel-export';

export function Workspace() {
  const ready = useStore(isStoreReady);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  useEffect(() => {
    initStore();
  }, []);

  const handleDownload = async () => {
    setIsGeneratingPdf(true);
    try {
      const data = invoiceStore.get();
      const brand = brandStore.get();
      const metadata = metadataStore.get();
      
      const { pdf } = await import('@react-pdf/renderer');
      const { InvoicePDF } = await import('@/lib/pdf-generator');
      
      const blob = await pdf(<InvoicePDF invoice={data} brand={brand} metadata={metadata} />).toBlob();
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Invoice_${data.invoiceNumber || 'Export'}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to generate PDF', error);
      alert('Gagal menghasilkan PDF. Silakan coba lagi.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handleExcelExport = async () => {
    const data = invoiceStore.get();
    await exportUniversalExcel([data], `Invoice_${data.invoiceNumber || 'Export'}`);
  };

  if (!ready) {
    return <div className="flex h-[800px] items-center justify-center">Memuat Workspace...</div>;
  }

  return (
    <Tabs defaultValue="data" className="flex flex-col h-[800px] w-full overflow-hidden bg-white print:h-auto print:overflow-visible">
      <div className="h-16 bg-white border-b flex items-center justify-between px-6 no-print print:hidden z-20">
        <div className="flex-1">
          <div className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
            Live Editor
          </div>
        </div>

        <TabsList className="bg-slate-100/80 p-1 rounded-full h-10">
          <TabsTrigger value="data" className="rounded-full px-6 text-sm font-medium">Data Invoice</TabsTrigger>
          <TabsTrigger value="brand" className="rounded-full px-6 text-sm font-medium">Brand & Pengaturan</TabsTrigger>
        </TabsList>

        <div className="flex items-center justify-end gap-3 flex-1">
          <Button onClick={handleExcelExport} variant="outline" className="h-9 text-[#30a9b1] border-[#30a9b1]/30 hover:bg-[#30a9b1]/5 font-medium">
            <FileSpreadsheet className="w-4 h-4 mr-2" /> Ekspor ke Excel
          </Button>
          <Button onClick={handleDownload} disabled={isGeneratingPdf} className="h-9 bg-[#30a9b1] hover:bg-[#288c93] text-white shadow-md shadow-[#30a9b1]/20 font-medium">
            <Download className={`w-4 h-4 mr-2 ${isGeneratingPdf ? 'animate-bounce' : ''}`} /> 
            {isGeneratingPdf ? 'Menyiapkan...' : 'Download PDF'}
          </Button>
        </div>
      </div>
      
      <div className="flex flex-1 overflow-hidden">
        <div className="w-[45%] border-r bg-white h-full overflow-y-auto no-print print:hidden z-10">
          <LeftPanel />
        </div>
        <div className="w-[55%] h-full overflow-y-auto bg-[#f8fafc] block py-10 print:w-full print:bg-white print:py-0 print:overflow-visible relative">
          <RightPanel />
        </div>
      </div>
    </Tabs>
  );
}
