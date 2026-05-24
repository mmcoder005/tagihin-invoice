import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setMessage('Registration successful! You can now log in.');
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        window.location.href = '/dashboard';
      }
    } catch (error: any) {
      setError(error.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen relative p-4 overflow-hidden">
      <div className="absolute inset-0 z-0 bg-mesh-hero pointer-events-none"></div>
      <Card className="w-full max-w-md shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-200 z-10 bg-white/90 backdrop-blur-sm">
        <CardHeader className="space-y-1 text-center pb-6">
          <a href="/"><img src="/logo.png" alt="Tagihin Logo" className="h-8 mx-auto mb-4 hover:opacity-80 transition-opacity" /></a>
          <CardTitle className="text-2xl font-semibold tracking-tight text-[#20324c]">
            {isSignUp ? 'Buat Akun' : 'Masuk ke Tagihin'}
          </CardTitle>
          <CardDescription className="text-slate-500 font-light">
            {isSignUp ? 'Mulai buat invoice otomatis sekarang.' : 'Masukkan email Anda untuk masuk.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            {error && <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md border border-red-200">{error}</div>}
            {message && <div className="p-3 text-sm text-green-600 bg-green-50 rounded-md border border-green-200">{message}</div>}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="m@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            
            <Button type="submit" className="w-full btn-primary mt-6" disabled={loading}>
              {loading ? 'Memproses...' : (isSignUp ? 'Daftar' : 'Masuk')}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500">
            {isSignUp ? "Sudah punya akun?" : "Belum punya akun?"}{' '}
            <button 
              type="button"
              className="font-semibold text-[#30a9b1] hover:text-[#20324c] transition-colors"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
                setMessage(null);
              }}
            >
              {isSignUp ? 'Masuk sekarang' : 'Daftar sekarang'}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
