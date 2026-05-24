import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, LogOut, FileText, Clock, Download, FileSpreadsheet, Trash2, Filter, User, Settings, CreditCard } from 'lucide-react';
import { invoiceStore, resetStore } from '@/store/invoiceStore';
import { PremiumDialog } from '@/components/PremiumDialog';
import { exportUniversalExcel } from '@/lib/excel-export';
import { AccountDialog } from '@/components/AccountDialog';
import { BillingDialog } from '@/components/BillingDialog';

export function Dashboard() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [showPremiumDialog, setShowPremiumDialog] = useState(false);
  const [selectedInvoices, setSelectedInvoices] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const itemsPerPage = 10;
  
  const [showAccountDialog, setShowAccountDialog] = useState(false);
  const [showBillingDialog, setShowBillingDialog] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [currentPage, startDate, endDate]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.href = '/login';
        return;
      }

      let query = supabase
        .from('invoices')
        .select('*', { count: 'exact' });

      if (startDate) {
        query = query.gte('date', startDate);
      }
      if (endDate) {
        query = query.lte('date', endDate);
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1);

      if (error) throw error;
      setInvoices(data || []);
      setTotalPages(Math.ceil((count || 0) / itemsPerPage) || 1);
    } catch (error) {
      console.error('Error fetching invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    resetStore();
    window.location.href = '/login';
  };

  const handleBulkExport = async () => {
    if (selectedInvoices.size === 0) return;
    setExportLoading(true);
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*, line_items(*)')
        .in('id', Array.from(selectedInvoices))
        .order('created_at', { ascending: true }); // Grouped sequentially

      if (error) throw error;
      await exportUniversalExcel(data, 'Bulk_Export');
    } catch (err) {
      console.error('Export failed:', err);
      alert('Gagal melakukan export');
    } finally {
      setExportLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedInvoices.size === 0) return;
    if (!confirm(`Apakah Anda yakin ingin menghapus ${selectedInvoices.size} invoice?`)) return;
    
    try {
      setLoading(true);
      const { error } = await supabase
        .from('invoices')
        .delete()
        .in('id', Array.from(selectedInvoices));

      if (error) throw error;
      setSelectedInvoices(new Set());
      
      // If we deleted all items on the current page and it's not page 1, go back a page
      if (selectedInvoices.size === invoices.length && currentPage > 1) {
        setCurrentPage(p => p - 1);
      } else {
        fetchInvoices();
      }
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Gagal menghapus invoice');
    } finally {
      setLoading(false);
    }
  };

  const handleSingleExport = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*, line_items(*)')
        .eq('id', id)
        .single();

      if (error) throw error;
      await exportUniversalExcel([data], `Invoice_${data.invoice_number}`);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Gagal melakukan export');
    }
  };

  const toggleSelection = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newSet = new Set(selectedInvoices);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedInvoices(newSet);
  };

  const toggleAll = () => {
    if (selectedInvoices.size === invoices.length) {
      setSelectedInvoices(new Set());
    } else {
      setSelectedInvoices(new Set(invoices.map(inv => inv.id)));
    }
  };

  const handleUpgrade = () => {
    setShowPremiumDialog(true);
  };

  const handleNewInvoice = () => {
    resetStore(); // ensure a fresh store for a new invoice
    window.location.href = '/editor';
  };

  const openInvoicePreview = (e: React.MouseEvent, invoiceId: string) => {
    e.stopPropagation();
    window.open(`/preview?id=${invoiceId}`, '_blank');
  };

  const navigateToEdit = (e: React.MouseEvent, invoiceId: string) => {
    e.stopPropagation();
    window.location.href = `/editor?id=${invoiceId}`;
  };

  const totalBilled = invoices.reduce((sum, inv) => {
    // A rough calculation just for the dashboard display based on what was saved
    // True calculation would sum line items, but for now we'll just show the count
    return sum;
  }, 0);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white/60 backdrop-blur-xl border-b border-white/20 shadow-sm px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="max-w-6xl mx-auto w-full flex justify-between items-center">
          <a href="/"><img src="/logo.png" alt="Tagihin Logo" className="h-8 hover:opacity-80 transition-opacity" /></a>
          <div className="flex gap-4 items-center">
            <Button onClick={handleUpgrade} variant="outline" className="btn-pill border-[#30a9b1] text-[#30a9b1] hover:bg-[#30a9b1]/5 shadow-sm">
              Upgrade ke Pro
            </Button>
            <Button onClick={handleNewInvoice} className="btn-primary">
              <Plus className="w-4 h-4 mr-2" /> Buat Invoice Baru
            </Button>
            
            <div className="relative" ref={dropdownRef}>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)} 
                className="rounded-full bg-slate-100 hover:bg-slate-200"
              >
                <User className="w-5 h-5 text-slate-600" />
              </Button>
              
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 py-1 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <button 
                    onClick={() => { setIsDropdownOpen(false); setShowAccountDialog(true); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <Settings className="w-4 h-4 text-slate-400" /> Pengaturan Akun
                  </button>
                  <button 
                    onClick={() => { setIsDropdownOpen(false); setShowBillingDialog(true); }}
                    className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <CreditCard className="w-4 h-4 text-slate-400" /> Tagihan & Langganan
                  </button>
                  <div className="border-t border-slate-100 my-1"></div>
                  <button 
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <LogOut className="w-4 h-4 text-red-500" /> Keluar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 space-y-8 mt-4">
        {/* Analytics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900 tabular-nums">{invoices.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* History Table */}
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="p-6 border-b bg-white flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <h2 className="text-lg font-semibold">Riwayat Invoice</h2>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
              <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border">
                <Filter className="w-4 h-4" />
                <input type="date" value={startDate} onChange={e => {setStartDate(e.target.value); setCurrentPage(1);}} className="bg-transparent border-none outline-none text-slate-700 font-medium cursor-pointer" title="Tanggal Mulai" />
                <span>-</span>
                <input type="date" value={endDate} onChange={e => {setEndDate(e.target.value); setCurrentPage(1);}} className="bg-transparent border-none outline-none text-slate-700 font-medium cursor-pointer" title="Tanggal Akhir" />
              </div>
              <div className="flex items-center gap-2">
                {selectedInvoices.size > 0 && (
                  <>
                    <Button onClick={handleBulkDelete} disabled={loading} variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 h-9 text-xs font-medium">
                      <Trash2 className="w-3.5 h-3.5 mr-2" /> Hapus Terpilih ({selectedInvoices.size})
                    </Button>
                    <Button onClick={handleBulkExport} disabled={exportLoading} className="btn-primary text-xs h-9">
                      <FileSpreadsheet className="w-3.5 h-3.5 mr-2" /> Ekspor Rekap ({selectedInvoices.size})
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="bg-white">
            {loading ? (
              <div className="p-8 text-center text-slate-500">Memuat data...</div>
            ) : invoices.length === 0 ? (
              <div className="p-16 text-center">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-1">Belum ada invoice</h3>
                <p className="text-slate-500 mb-6">Mulai buat invoice pertama Anda sekarang.</p>
                <Button onClick={handleNewInvoice}><Plus className="w-4 h-4 mr-2" /> Buat Invoice</Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 border-b text-sm font-medium text-slate-500">
                      <th className="py-3 px-6 w-12 text-center">
                        <input type="checkbox" className="rounded border-slate-300" checked={invoices.length > 0 && selectedInvoices.size === invoices.length} onChange={toggleAll} />
                      </th>
                      <th className="py-3 px-6">Nomor</th>
                      <th className="py-3 px-6">Tanggal</th>
                      <th className="py-3 px-6">Jatuh Tempo</th>
                      <th className="py-3 px-6 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50 transition-colors group cursor-pointer" onClick={(e) => openInvoicePreview(e, inv.id)}>
                        <td className="py-4 px-6 text-center" onClick={(e) => toggleSelection(e, inv.id)}>
                          <input type="checkbox" className="rounded border-slate-300" checked={selectedInvoices.has(inv.id)} readOnly />
                        </td>
                        <td className="py-4 px-6 font-medium text-slate-900 tabular-nums">{inv.invoice_number}</td>
                        <td className="py-4 px-6 text-slate-600 tabular-nums">{inv.date || '-'}</td>
                        <td className="py-4 px-6 text-slate-600 tabular-nums">
                          {inv.due_date ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                              <Clock className="w-3 h-3" /> {inv.due_date}
                            </span>
                          ) : '-'}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-[#30a9b1] hover:bg-[#30a9b1]/10 hover:text-[#30a9b1]" onClick={(e) => handleSingleExport(e, inv.id)} title="Ekspor ke Excel">
                              <FileSpreadsheet className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={(e) => openInvoicePreview(e, inv.id)}>Buka</Button>
                            <Button variant="outline" size="sm" onClick={(e) => navigateToEdit(e, inv.id)} className="text-[#30a9b1] border-[#30a9b1] hover:bg-[#30a9b1]/5">Edit</Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-6 py-4 border-t bg-slate-50/50">
                    <div className="text-sm text-slate-500">
                      Halaman <span className="font-medium text-slate-900">{currentPage}</span> dari <span className="font-medium text-slate-900">{totalPages}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1 || loading}
                      >
                        Sebelumnya
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages || loading}
                      >
                        Selanjutnya
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      </main>

      <PremiumDialog open={showPremiumDialog} onOpenChange={setShowPremiumDialog} />
      <AccountDialog open={showAccountDialog} onOpenChange={setShowAccountDialog} />
      <BillingDialog open={showBillingDialog} onOpenChange={setShowBillingDialog} />
    </div>
  );
}
