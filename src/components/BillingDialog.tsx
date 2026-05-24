import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { CreditCard, Download, AlertTriangle, Key, CheckCircle } from 'lucide-react';

interface BillingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BillingDialog({ open, onOpenChange }: BillingDialogProps) {
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [redeemCode, setRedeemCode] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [redeemStatus, setRedeemStatus] = useState<{success?: boolean, message?: string} | null>(null);

  // Mock data for UI demonstration
  const mockBillingHistory = [
    { id: 'INV-2026-001', date: '24 Mei 2026', amount: 'Rp 49.000', status: 'Lunas' },
    { id: 'INV-2026-002', date: '24 Apr 2026', amount: 'Rp 49.000', status: 'Lunas' },
    { id: 'INV-2026-003', date: '24 Mar 2026', amount: 'Rp 49.000', status: 'Lunas' },
  ];

  const handleCancelSubscription = () => {
    setIsCancelling(true);
    // Mock API call
    setTimeout(() => {
      setIsCancelling(false);
      setShowCancelConfirm(false);
      alert('Fitur ini akan segera tersedia setelah integrasi payment gateway selesai.');
    }, 1500);
  };

  const handleRedeem = async () => {
    if (!redeemCode.trim()) return;
    setIsRedeeming(true);
    setRedeemStatus(null);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // 1. Check if license is valid
      const { data: license, error: checkError } = await supabase
        .from('licenses')
        .select('*')
        .eq('code', redeemCode.trim().toUpperCase())
        .eq('status', 'unused')
        .single();
        
      if (checkError || !license) {
        if (checkError?.code === '42P01') {
           // Table doesn't exist, mock success
           setTimeout(() => {
             setRedeemStatus({ success: true, message: 'Lisensi berhasil diklaim! (Mock Mode)' });
             setIsRedeeming(false);
             setRedeemCode('');
           }, 1000);
           return;
        }
        throw new Error('Kode lisensi tidak valid atau sudah digunakan.');
      }

      // 2. Mark as redeemed
      const { error: updateError } = await supabase
        .from('licenses')
        .update({ status: 'redeemed', redeemed_by: user.id, redeemed_at: new Date().toISOString() })
        .eq('id', license.id);
        
      if (updateError) throw updateError;
      
      // 3. Upgrade user profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ subscription_tier: 'pro' })
        .eq('id', user.id);
        
      if (profileError && profileError.code !== '42703') {
        console.warn('Profile update issue:', profileError);
      }

      setRedeemStatus({ success: true, message: 'Selamat! Akun Anda kini menjadi Pro.' });
      setRedeemCode('');
    } catch (err: any) {
      setRedeemStatus({ success: false, message: err.message || 'Gagal klaim lisensi.' });
    } finally {
      setIsRedeeming(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      if (!val) setShowCancelConfirm(false);
      onOpenChange(val);
    }}>
      <DialogContent className="sm:max-w-xl bg-white p-0 overflow-hidden border-0 shadow-2xl">
        <div className="bg-[#30a9b1] h-2 w-full absolute top-0 left-0" />
        
        <div className="p-6 max-h-[85vh] overflow-y-auto">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#30a9b1]" />
              Tagihan & Langganan
            </DialogTitle>
            <DialogDescription className="text-slate-500">
              Kelola paket berlangganan dan riwayat pembayaran Anda.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-8">
            {/* Current Plan */}
            <div className="p-4 rounded-xl border border-[#30a9b1]/20 bg-[#30a9b1]/5 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-900 mb-1">Paket Pro (Bulanan)</h3>
                <p className="text-sm text-slate-600">Siklus tagihan berikutnya: 24 Jun 2026</p>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-[#30a9b1]">Rp 49.000</div>
                <div className="text-xs text-slate-500">/ bulan</div>
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-3">Metode Pembayaran</h3>
              <div className="flex items-center justify-between p-4 rounded-lg border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-8 bg-slate-100 rounded flex items-center justify-center font-bold text-blue-900 text-xs italic border">
                    VISA
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 text-sm">Visa berakhiran 4242</p>
                    <p className="text-xs text-slate-500">Kedaluwarsa 12/28</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="text-xs">Ubah</Button>
              </div>
            </div>

            {/* Billing History */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-3">Riwayat Tagihan</h3>
              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-slate-500 border-b">
                    <tr>
                      <th className="px-4 py-2 font-medium">Tanggal</th>
                      <th className="px-4 py-2 font-medium">Jumlah</th>
                      <th className="px-4 py-2 font-medium">Status</th>
                      <th className="px-4 py-2 text-right font-medium">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {mockBillingHistory.map((inv) => (
                      <tr key={inv.id}>
                        <td className="px-4 py-3 text-slate-900">{inv.date}</td>
                        <td className="px-4 py-3 text-slate-900 font-medium">{inv.amount}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                            {inv.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-[#30a9b1]">
                            <Download className="w-3.5 h-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Redeem License */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Key className="w-4 h-4 text-[#30a9b1]" /> Tukarkan Kode Lisensi
              </h3>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={redeemCode}
                  onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                  placeholder="TAGIHIN-PRO-XXXXXX"
                  className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#30a9b1]/20 focus:border-[#30a9b1] outline-none text-sm font-mono uppercase"
                />
                <Button 
                  onClick={handleRedeem} 
                  disabled={isRedeeming || !redeemCode.trim()}
                  className="bg-[#30a9b1] hover:bg-[#288c93]"
                >
                  {isRedeeming ? 'Memproses...' : 'Klaim'}
                </Button>
              </div>
              {redeemStatus && (
                <div className={`mt-3 p-3 rounded-lg text-sm flex items-start gap-2 ${redeemStatus.success ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                  {redeemStatus.success ? <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" /> : <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />}
                  <span>{redeemStatus.message}</span>
                </div>
              )}
            </div>

            {/* Danger Zone */}
            <div className="pt-6 border-t border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 mb-2">Pemberhentian Langganan</h3>
              <p className="text-sm text-slate-500 mb-4">
                Jika Anda membatalkan langganan, Anda masih dapat mengakses fitur Pro hingga akhir siklus penagihan Anda saat ini.
              </p>
              
              {showCancelConfirm ? (
                <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                  <div className="flex gap-3 text-red-800 mb-4 text-sm">
                    <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                    <div>
                      <p className="font-semibold mb-1">Yakin ingin membatalkan?</p>
                      <p>Semua data invoice Anda akan tetap aman, namun fitur Pro tidak akan bisa diakses setelah tanggal 24 Jun 2026.</p>
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowCancelConfirm(false)}
                      className="bg-white"
                      disabled={isCancelling}
                    >
                      Kembali
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={handleCancelSubscription}
                      disabled={isCancelling}
                    >
                      {isCancelling ? 'Memproses...' : 'Ya, Batalkan'}
                    </Button>
                  </div>
                </div>
              ) : (
                <Button 
                  variant="outline" 
                  className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                  onClick={() => setShowCancelConfirm(true)}
                >
                  Batalkan Langganan
                </Button>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
