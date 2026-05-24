import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText, Key, Plus, CheckCircle, Clock } from 'lucide-react';

// For simplicity in this implementation, we will mock the table if it fails to load
// as the user needs to create the `licenses` table in Supabase.

export function OwnerDashboard() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [stats, setStats] = useState({ users: 0, invoices: 0, activeLicenses: 0 });
  const [licenses, setLicenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    const passed = sessionStorage.getItem('owner_gate_passed');
    if (passed === 'true') {
      checkAdminAccess();
    } else {
      setShowLogin(true);
      setIsAdmin(false);
    }
  }, []);

  const checkAdminAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    // In a production app, verify this via a secure backend or JWT claim.
    // We check against an env variable or fallback admin email.
    const adminEmail = import.meta.env.PUBLIC_ADMIN_EMAIL || 'dyfo45@gmail.com';
    
    if (!user || user.email !== adminEmail) {
      setShowLogin(true);
      setIsAdmin(false);
      return;
    }
    
    setIsAdmin(true);
    setShowLogin(false);
    fetchData();
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError('');

    const targetEmail = 'dyfo45@gmail.com';
    const targetPass = '24VYmThMLXqxgZBagW51';

    if (email !== targetEmail || password !== targetPass) {
      setLoginError('Akses ditolak: Kredensial tidak valid.');
      setIsLoggingIn(false);
      return;
    }

    sessionStorage.setItem('owner_gate_passed', 'true');

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
      // If user doesn't exist, attempt to sign up
      if (error.message.includes('Invalid login credentials')) {
        const { error: signUpError } = await supabase.auth.signUp({ email, password });
        if (signUpError) {
          setLoginError('Gagal membuat akun admin: ' + signUpError.message);
        } else {
          window.location.reload();
        }
      } else {
        setLoginError(error.message);
      }
    } else {
      window.location.reload();
    }
    setIsLoggingIn(false);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // We can get rough counts
      const { count: usersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
      const { count: invoicesCount } = await supabase.from('invoices').select('*', { count: 'exact', head: true });
      
      // Try to fetch licenses (might fail if table doesn't exist yet)
      const { data: licenseData, error: licenseError } = await supabase.from('licenses').select('*').order('created_at', { ascending: false });
      
      if (licenseError && licenseError.code === '42P01') {
        console.warn('Licenses table does not exist yet. Using mock data.');
        // Set mock data if table is missing
        setLicenses([
          { id: '1', code: 'TAGIHIN-PRO-MOCK1', status: 'unused', created_at: new Date().toISOString() },
        ]);
        setStats({ users: usersCount || 0, invoices: invoicesCount || 0, activeLicenses: 0 });
      } else {
        setLicenses(licenseData || []);
        const activeCount = (licenseData || []).filter(l => l.status === 'redeemed').length;
        setStats({ users: usersCount || 0, invoices: invoicesCount || 0, activeLicenses: activeCount });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateLicense = async () => {
    setGenerating(true);
    const code = 'TAGIHIN-PRO-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    
    try {
      const { data, error } = await supabase.from('licenses').insert([
        { code, status: 'unused' }
      ]).select().single();
      
      if (error) throw error;
      
      setLicenses([data, ...licenses]);
    } catch (err: any) {
      if (err.code === '42P01') {
        alert('Tabel "licenses" belum dibuat di Supabase! Mohon jalankan SQL script.');
        // Mock fallback
        setLicenses([{ id: Math.random().toString(), code, status: 'unused', created_at: new Date().toISOString() }, ...licenses]);
      } else {
        console.error('Generate error:', err);
        alert('Gagal generate lisensi');
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleRevokeLicense = async (id: string) => {
    if (!confirm('Yakin ingin menghapus lisensi ini secara permanen?')) return;
    try {
      const { error } = await supabase.from('licenses').delete().eq('id', id);
      if (error) {
        if (error.code === '42501') {
           alert('Gagal menghapus: pastikan RLS policy untuk DELETE sudah diatur.');
        } else {
           throw error;
        }
      } else {
        setLicenses(licenses.filter((l) => l.id !== id));
        // Update stats roughly
        setStats(prev => ({ ...prev, activeLicenses: Math.max(0, prev.activeLicenses - 1) }));
      }
    } catch (err) {
      console.error(err);
      alert('Gagal menghapus lisensi');
    }
  };

  if (isAdmin === null && !showLogin) return <div className="min-h-screen flex items-center justify-center">Memeriksa akses...</div>;

  if (showLogin) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <img src="/logo.png" alt="Tagihin" className="mx-auto h-12 w-auto grayscale opacity-80" />
          <h2 className="mt-6 text-center text-2xl font-bold tracking-tight text-slate-900">
            Owner Access Only
          </h2>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-slate-100">
            <form className="space-y-6" onSubmit={handleAdminLogin}>
              <div>
                <label className="block text-sm font-medium text-slate-700">Email address</label>
                <div className="mt-1">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full appearance-none rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-[#30a9b1] focus:outline-none focus:ring-[#30a9b1] sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Password</label>
                <div className="mt-1">
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full appearance-none rounded-md border border-slate-300 px-3 py-2 shadow-sm focus:border-[#30a9b1] focus:outline-none focus:ring-[#30a9b1] sm:text-sm"
                  />
                </div>
              </div>

              {loginError && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-100">
                  {loginError}
                </div>
              )}

              <div>
                <Button type="submit" className="w-full bg-[#30a9b1] hover:bg-[#288c93]" disabled={isLoggingIn}>
                  {isLoggingIn ? 'Verifying...' : 'Sign In'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto w-full flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Tagihin" className="h-8 grayscale opacity-80" />
            <span className="font-bold text-slate-800 border-l pl-3 ml-1 text-lg tracking-tight">Owner Dashboard</span>
          </div>
          <Button variant="ghost" onClick={() => window.location.href = '/'}>
            Kembali ke Aplikasi
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 space-y-8 mt-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                <Users className="w-4 h-4" /> Total Pengguna
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{stats.users}</div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                <FileText className="w-4 h-4" /> Total Invoice Dibuat
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{stats.invoices}</div>
            </CardContent>
          </Card>
          
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 flex items-center gap-2">
                <Key className="w-4 h-4" /> Lisensi Aktif (Pro)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">{stats.activeLicenses}</div>
            </CardContent>
          </Card>
        </div>

        {/* License Manager */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Manajemen Lisensi</h2>
              <p className="text-sm text-slate-500">Buat dan kelola kode aktivasi akun Pro.</p>
            </div>
            <Button onClick={handleGenerateLicense} disabled={generating} className="bg-[#30a9b1] hover:bg-[#288c93]">
              <Plus className="w-4 h-4 mr-2" /> {generating ? 'Membuat...' : 'Buat Kode Lisensi'}
            </Button>
          </div>
          
          <div className="p-0">
            {loading ? (
              <div className="p-8 text-center text-slate-500">Memuat data...</div>
            ) : licenses.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <Key className="w-12 h-12 mx-auto mb-4 opacity-20" />
                <p>Belum ada kode lisensi yang dibuat.</p>
              </div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 border-b">
                  <tr>
                    <th className="px-6 py-3 font-medium">Kode Lisensi</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium">Dibuat Pada</th>
                    <th className="px-6 py-3 font-medium">Diklaim Oleh</th>
                    <th className="px-6 py-3 font-medium text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {licenses.map((lic) => (
                    <tr key={lic.id} className="hover:bg-slate-50/50">
                      <td className="px-6 py-4 font-mono font-bold text-[#30a9b1]">
                        {lic.code}
                      </td>
                      <td className="px-6 py-4">
                        {lic.status === 'redeemed' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            <CheckCircle className="w-3 h-3" /> Digunakan
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                            <Clock className="w-3 h-3" /> Belum Digunakan
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {new Date(lic.created_at).toLocaleDateString('id-ID')}
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {lic.redeemed_by || '-'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 px-3"
                          onClick={() => handleRevokeLicense(lic.id)}
                        >
                          Hapus
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
