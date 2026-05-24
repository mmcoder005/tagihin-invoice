import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';

interface PremiumDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PremiumDialog({ open, onOpenChange }: PremiumDialogProps) {
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    if (open) checkPro();
  }, [open]);

  const checkPro = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('profiles').select('subscription_tier').eq('id', user.id).single();
    if (data?.subscription_tier === 'pro') {
      setIsPro(true);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        <div className="bg-[#20324c] px-6 py-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-2">Tagihin Pro</h2>
          <p className="text-slate-300 text-sm mb-6">Akses penuh tanpa batas untuk profesional.</p>
          <div className="flex justify-center items-baseline gap-1 tabular-nums">
            <span className="text-4xl font-bold">Rp 49.000</span>
            <span className="text-slate-300">/ bulan</span>
          </div>
        </div>
        <div className="p-6 bg-white">
          <p className="text-sm text-slate-600 mb-6 text-center">
            Satu paket komplit untuk semua kebutuhan penagihan Anda.
          </p>
          <div className="flex flex-col gap-4 mb-8">
            <div className="flex items-center gap-3 text-sm text-slate-700">
              <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              </div>
              <span className="font-medium">Hapus watermark selamanya</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-700">
              <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              </div>
              <span className="font-medium">Buat invoice tanpa batas</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-700">
              <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              </div>
              <span className="font-medium">Simpan riwayat klien otomatis</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-700">
              <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
              </div>
              <span className="font-medium">Kustomisasi font & warna brand</span>
            </div>
          </div>
          {isPro ? (
            <div className="text-center p-4 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100 font-medium">
              Anda sudah berlangganan Tagihin Pro!
            </div>
          ) : (
            <>
              <Button type="button" onClick={() => window.location.href = '/checkout'} className="w-full btn-primary py-6 text-base font-semibold shadow-xl shadow-[#30a9b1]/20">
                Upgrade ke Pro Sekarang
              </Button>
              <p className="text-center text-xs text-slate-400 mt-4">
                Dapat dibatalkan kapan saja.
              </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
