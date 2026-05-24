import React, { useEffect, useState } from 'react';
import { useStore } from '@nanostores/react';
import { isStoreReady, initStore, invoiceStore, brandStore, metadataStore, languageStore } from '@/store/invoiceStore';
import { translations } from '@/lib/i18n';
import { LeftPanel } from './LeftPanel';
import { RightPanel } from './RightPanel';
import { Download, FileSpreadsheet } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { exportUniversalExcel } from '@/lib/excel-export';

export function Workspace() {
  const ready = useStore(isStoreReady);
  const lang = useStore(languageStore);
  const t = translations[lang];
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [activeTab, setActiveTab] = useState('data');

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
      
      const blob = await pdf(<InvoicePDF invoice={data} brand={brand} metadata={metadata} lang={lang} />).toBlob();
      
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
    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-[800px] w-full overflow-hidden bg-white print:h-auto print:overflow-visible">
      <div className="h-auto py-3 lg:h-16 lg:py-0 bg-white border-b flex flex-col lg:flex-row items-center justify-between px-4 lg:px-6 gap-3 no-print print:hidden z-20">
        <div className="flex-1 w-full lg:w-auto flex justify-between items-center">
          <div className="text-sm font-semibold text-slate-800 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
            {t.liveEditor}
          </div>
          
          <div className="flex items-center gap-2 lg:hidden">
             <Button onClick={() => languageStore.set(lang === 'en' ? 'id' : 'en')} variant="outline" className="h-8 font-medium text-xs px-2 border-slate-200">
               {lang === 'en' ? 'ID' : 'EN'}
             </Button>
             <Button onClick={handleExcelExport} variant="outline" className="h-8 text-[#30a9b1] border-[#30a9b1]/30 hover:bg-[#30a9b1]/5 font-medium text-xs px-3">
               <FileSpreadsheet className="w-3 h-3 mr-1" /> Excel
             </Button>
             <Button onClick={handleDownload} disabled={isGeneratingPdf} className="h-8 bg-[#30a9b1] hover:bg-[#288c93] text-white shadow-md shadow-[#30a9b1]/20 font-medium text-xs px-3">
              <Download className={`w-3 h-3 mr-1 ${isGeneratingPdf ? 'animate-bounce' : ''}`} /> 
              {isGeneratingPdf ? t.preparing : 'PDF'}
            </Button>
          </div>
        </div>

        <TabsList className="bg-slate-100/80 p-1 rounded-full h-10 w-full lg:w-auto flex justify-start lg:justify-center overflow-x-auto shrink-0">
          <TabsTrigger value="data" className="rounded-full px-4 lg:px-6 text-sm font-medium whitespace-nowrap">{t.dataInvoice}</TabsTrigger>
          <TabsTrigger value="brand" className="rounded-full px-4 lg:px-6 text-sm font-medium whitespace-nowrap">{t.brand}</TabsTrigger>
          <TabsTrigger value="preview" className="rounded-full px-4 lg:px-6 text-sm font-medium whitespace-nowrap flex lg:hidden">{t.preview}</TabsTrigger>
        </TabsList>

        <div className="hidden lg:flex items-center justify-end gap-3 flex-1">
          <Button onClick={() => languageStore.set(lang === 'en' ? 'id' : 'en')} variant="outline" className="h-9 font-medium border-slate-200">
            {lang === 'en' ? 'ID' : 'EN'}
          </Button>
          <Button onClick={handleExcelExport} variant="outline" className="h-9 text-[#30a9b1] border-[#30a9b1]/30 hover:bg-[#30a9b1]/5 font-medium">
            <FileSpreadsheet className="w-4 h-4 mr-2" /> {t.exportExcel}
          </Button>
          <Button onClick={handleDownload} disabled={isGeneratingPdf} className="h-9 bg-[#30a9b1] hover:bg-[#288c93] text-white shadow-md shadow-[#30a9b1]/20 font-medium">
            <Download className={`w-4 h-4 mr-2 ${isGeneratingPdf ? 'animate-bounce' : ''}`} /> 
            {isGeneratingPdf ? t.preparing : t.downloadPdf}
          </Button>
        </div>
      </div>
      
      <div className="flex flex-1 overflow-hidden relative">
        <div className={`w-full lg:w-[45%] border-r bg-white h-full overflow-y-auto no-print print:hidden z-10 ${activeTab === 'preview' ? 'hidden lg:block' : 'block'}`}>
          <LeftPanel />
        </div>
        <div className={`w-full lg:w-[55%] h-full overflow-y-auto bg-slate-200/50 block py-4 lg:py-10 print:w-full print:bg-white print:py-0 print:overflow-visible relative ${activeTab === 'preview' ? 'block' : 'hidden lg:block'}`}>
          <div className="w-full overflow-x-auto flex justify-center pb-8">
             <div className="origin-top shrink-0 transform scale-[0.55] sm:scale-[0.65] md:scale-75 lg:scale-[0.6] xl:scale-[0.65] 2xl:scale-[0.75]">
               <RightPanel />
             </div>
          </div>
        </div>
      </div>
    </Tabs>
  );
}
