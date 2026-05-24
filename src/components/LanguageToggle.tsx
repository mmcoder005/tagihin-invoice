import React from 'react';
import { useStore } from '@nanostores/react';
import { languageStore } from '@/store/invoiceStore';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';

export function LanguageToggle() {
  const lang = useStore(languageStore);

  return (
    <Button 
      onClick={() => languageStore.set(lang === 'en' ? 'id' : 'en')} 
      variant="outline" 
      size="sm"
      className="h-9 px-3 font-medium border-slate-200 hover:bg-slate-100 flex items-center gap-2 rounded-full"
    >
      <Globe className="w-4 h-4 text-slate-500" />
      <span>{lang === 'en' ? 'ID' : 'EN'}</span>
    </Button>
  );
}
