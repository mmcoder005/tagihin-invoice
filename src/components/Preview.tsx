import React, { useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { isStoreReady, initStore } from '@/store/invoiceStore';
import { RightPanel } from './RightPanel';

export function Preview() {
  const ready = useStore(isStoreReady);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const invoiceId = params.get('id');
    initStore(invoiceId || undefined);
  }, []);

  if (!ready) {
    return <div className="flex h-screen items-center justify-center text-slate-500">Memuat PDF...</div>;
  }

  return (
    <div className="w-full flex justify-center bg-white print:block">
      <RightPanel />
    </div>
  );
}
