import React from 'react';
import { useStore } from '@nanostores/react';
import { languageStore } from '@/store/invoiceStore';

const heroTranslations = {
  en: {
    title1: "Create Branded Invoices",
    title2: "That Match Your Identity",
    desc: "Personalize fonts, color palettes, and logos to create premium invoices that represent your brand—instantly, free, and hassle-free."
  },
  id: {
    title1: "Buat Invoice Profesional",
    title2: "Sesuai Identitas Brand Anda",
    desc: "Personalisasi font, palet warna, dan logo untuk menciptakan invoice premium yang merepresentasikan brand Anda—langsung jadi, gratis, tanpa ribet."
  }
};

export function HeroText() {
  const lang = useStore(languageStore);
  const t = heroTranslations[lang];

  return (
    <>
      <h1 className="text-display-xxl mb-6 print:hidden text-[#20324c]">
        {t.title1}<br/>{t.title2}
      </h1>
      <p className="text-lg text-slate-500 mb-12 max-w-2xl mx-auto leading-relaxed print:hidden font-light">
        {t.desc}
      </p>
    </>
  );
}
