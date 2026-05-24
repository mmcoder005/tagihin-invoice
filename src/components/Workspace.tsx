import React, { useEffect, useState } from 'react';
import { useStore } from '@nanostores/react';
import { isStoreReady, initStore, isSaving, invoiceStore } from '@/store/invoiceStore';
import { LeftPanel } from './LeftPanel';
import { RightPanel } from './RightPanel';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Save, Download, FileSpreadsheet } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PremiumDialog } from '@/components/PremiumDialog';
import { Button } from '@/components/ui/button';
import { exportUniversalExcel } from '@/lib/excel-export';
import { brandStore, metadataStore } from '@/store/invoiceStore';

export function Workspace({ isPublic = false }: { isPublic?: boolean }) {
  const ready = useStore(isStoreReady);
  const saving = useStore(isSaving);
  const [showPremiumDialog, setShowPremiumDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  useEffect(() => {
    checkAuthAndInit();
  }, []);

  const checkAuthAndInit = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user && !isPublic) {
      window.location.href = '/login';
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const invoiceId = params.get('id');
    setIsEditing(!!invoiceId);
    initStore(invoiceId || undefined, isPublic);
  };

  const handleDownload = async () => {
    if (isPublic) {
      const generated = parseInt(localStorage.getItem('freeInvoicesGenerated') || '0', 10);
      if (generated >= 3) {
        setShowPremiumDialog(true);
        return;
      }
      localStorage.setItem('freeInvoicesGenerated', (generated + 1).toString());
    }

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
    return <div className="flex h-screen items-center justify-center">Loading Workspace...</div>;
  }

  return (
    <Tabs defaultValue="data" className={`flex flex-col ${isPublic ? 'h-[800px] rounded-2xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.06)]' : 'h-screen'} w-full overflow-hidden bg-gray-50/50 print:h-auto print:overflow-visible`}>
      <div className="h-14 bg-white border-b flex items-center justify-between px-4 no-print print:hidden z-20">
        <div className="flex-1">
          {!isPublic ? (
            <button onClick={() => window.location.href = '/dashboard'} className="flex items-center text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
            </button>
          ) : (
            <div className="text-sm font-medium text-slate-500">Live Preview</div>
          )}
        </div>

        <TabsList className="bg-slate-100/50 p-1 rounded-full h-10">
          <TabsTrigger value="data" className="rounded-full px-6 text-sm">Data Invoice</TabsTrigger>
          {!isEditing && <TabsTrigger value="brand" className="rounded-full px-6 text-sm">Brand & Pengaturan</TabsTrigger>}
        </TabsList>

        <div className="flex items-center justify-end text-sm text-slate-500 gap-4 flex-1">
          {!isPublic && (
            <div className="flex items-center gap-2 tabular-nums">
              {saving ? (
                <><div className="w-2 h-2 rounded-full bg-[#30a9b1] animate-pulse"></div> Menyimpan...</>
              ) : (
                <><Save className="w-4 h-4 text-[#23af8c]" /> Tersimpan</>
              )}
            </div>
          )}
          <Button onClick={handleExcelExport} variant="outline" className="h-8 text-[#30a9b1] border-[#30a9b1] hover:bg-[#30a9b1]/5">
            <FileSpreadsheet className="w-4 h-4 mr-2" /> Ekspor ke Excel
          </Button>
          <Button onClick={handleDownload} disabled={isGeneratingPdf} className="h-8 btn-primary">
            <Download className={`w-4 h-4 mr-2 ${isGeneratingPdf ? 'animate-bounce' : ''}`} /> 
            {isGeneratingPdf ? 'Menyiapkan...' : 'Download PDF'}
          </Button>
        </div>
      </div>
      
      <div className="flex flex-1 overflow-hidden">
        <div className="w-[45%] border-r bg-white h-full overflow-y-auto no-print print:hidden shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10">
          <LeftPanel />
        </div>
        <div className="w-[55%] h-full overflow-y-auto bg-[#f8fafc] block py-10 print:w-full print:bg-white print:py-0 print:overflow-visible print:block relative">
          <RightPanel onRemoveWatermark={isPublic ? () => setShowPremiumDialog(true) : undefined} />
        </div>
      </div>

      <PremiumDialog open={showPremiumDialog} onOpenChange={setShowPremiumDialog} />
    </Tabs>
  );
}
