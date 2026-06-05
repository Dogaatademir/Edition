// src/components/ProductInfoSection.tsx
import React, { useState } from 'react';
import type { CoffeeProduct } from '../lib/shopify';

const IconTasting = ({ active }: { active: boolean }) => (
  <svg width="26" height="26" viewBox="0 0 32 32" fill="none"
    stroke={active ? '#f7f0e7' : '#1b1b1b'}
    strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 7 Q10 5 11 3" /><path d="M16 7 Q15 5 16 3" /><path d="M21 7 Q20 5 21 3" />
    <path d="M8 10 h16 l-2 13 H10 Z" />
    <path d="M24 13 Q29 13 29 17 Q29 21 24 21" />
    <path d="M6 25 h20" />
  </svg>
);

const IconBlend = ({ active }: { active: boolean }) => (
  <svg width="26" height="26" viewBox="0 0 32 32" fill="none"
    stroke={active ? '#f7f0e7' : '#1b1b1b'}
    strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="11" cy="16" rx="5.5" ry="8.5" transform="rotate(-18 11 16)" />
    <path d="M7.5 10.5 Q11 16 14.5 21.5" />
    <ellipse cx="21" cy="16" rx="5.5" ry="8.5" transform="rotate(18 21 16)" />
    <path d="M17.5 21.5 Q21 16 24.5 10.5" />
  </svg>
);

const IconProduct = ({ active }: { active: boolean }) => (
  <svg width="26" height="26" viewBox="0 0 32 32" fill="none"
    stroke={active ? '#f7f0e7' : '#1b1b1b'}
    strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 11 L8 27 H24 L23 11 Z" />
    <path d="M9 11 Q10 8 13 8 L19 8 Q22 8 23 11" />
    <circle cx="16" cy="19" r="2.5" />
    <path d="M11 14 H21" />
  </svg>
);

type TabId = 'tasting' | 'blend' | 'product';

interface TabDef { id: TabId; label: string; Icon: React.FC<{ active: boolean }>; }

const CUP_ROTATION_DESKTOP: Record<TabId, number> = { tasting: -23, blend: 0, product: 23 };
const CUP_ROTATION_MOBILE: Record<TabId, number>  = { tasting: 115, blend: 88, product: 60 };

const TABS: TabDef[] = [
  { id: 'tasting', label: 'Tadım ve Kavurma', Icon: IconTasting },
  { id: 'blend',   label: 'Harman',            Icon: IconBlend   },
  { id: 'product', label: 'Ürün Bilgisi',       Icon: IconProduct },
];

const ContentBlock: React.FC<{ title: string; body: React.ReactNode }> = ({ title, body }) => (
  <div className="border-l-2 border-[#1b1b1b]/10 pl-5">
    <h3 className="font-mono font-bold text-[0.65rem] tracking-[0.2em] uppercase text-[#1b1b1b] mb-2">{title}</h3>
    <p className="font-sans font-light text-[1.05rem] leading-[1.85] text-[#1b1b1b]">{body}</p>
  </div>
);

const ProductInfoSection: React.FC<{ product: CoffeeProduct }> = ({ product }) => {
  const [active, setActive] = useState<TabId>('tasting');

  const renderContent = () => {
    switch (active) {
      case 'tasting': return (
        <>
          <ContentBlock title="Tat Profili" body={product.notes?.length ? product.notes.join(' · ') : 'Dengeli gövde, yumuşak asidite, uzun bitiş.'} />
          <ContentBlock title="Kavurma" body={product.roast ? `${product.roast}` : 'Orta-koyu kavrum'} />
        </>
      );
      case 'blend': return (
        <>
          <ContentBlock title="Çekirdek Türü" body="Arabica" />
          <ContentBlock title="Menşei" body={product.origin ?? 'Afrika, Güney ve Orta Amerika'} />
          <ContentBlock title="İşlem" body={product.process ?? 'Yıkanmış / Doğal kombinasyonu'} />
        </>
      );
      case 'product': return (
        <>
          <ContentBlock title="Gramaj" body={
            product.variants?.length > 0 && product.variants[0].weight !== 'Default Title'
              ? product.variants.map(v => v.weight).join(' · ')
              : '250 Gr · 500 Gr · 1000 Gr'
          } />
          <ContentBlock title="Ambalaj" body="Zipli & Valfli Flat Bottom paket" />
          <ContentBlock title="Raf Ömrü" body="Üretim tarihinden itibaren 12 ay" />
        </>
      );
    }
  };

  return (
    <section className="mt-16 md:mt-24 border-t border-[#1b1b1b]/10 pt-16 md:pt-24 pb-12 bg-[#fdfaf6]">
      <div className="mx-auto max-w-[1200px] px-5 md:px-10">

        {/* Başlık */}
        <div className="flex flex-col items-center text-center mb-12 md:mb-16">
          <span className="font-mono text-[0.65rem] tracking-[0.3em] uppercase text-[#7b6a5c] mb-4 flex items-center gap-2 before:content-[''] before:block before:w-5 before:h-[1px] before:bg-[#7b6a5c] after:content-[''] after:block after:w-5 after:h-[1px] after:bg-[#7b6a5c]">
            Ürün Detayı
          </span>
          <h2 className="font-serif text-[clamp(2rem,3.5vw,3.2rem)] text-[#1b1b1b] leading-[1.15] tracking-[-0.02em]">
            Fincanınızın İçindekiler
          </h2>
        </div>

        {/* Ana layout */}
        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1.6fr)_auto_minmax(0,1fr)] items-center gap-8 md:gap-10 lg:gap-12">

          {/* Fincan görseli */}
          <div className="min-w-0 flex justify-center md:justify-end">
            <div
              className="cup-container w-[340px] sm:w-[420px] md:w-[480px] max-w-full aspect-square rounded-full overflow-hidden"
              style={{
                ['--rot-mobile' as string]: `${CUP_ROTATION_MOBILE[active]}deg`,
                ['--rot-desktop' as string]: `${CUP_ROTATION_DESKTOP[active]}deg`,
              } as React.CSSProperties}
            >
              <img src="/cup1.png" alt="Kahve fincanı" className="w-full h-full object-cover" />
            </div>
          </div>

          {/* Sekmeler */}
          <div className="flex md:flex-col flex-row w-full md:w-auto gap-0 md:gap-8 justify-center items-stretch">
            {TABS.map(tab => {
              const isActive = active === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActive(tab.id)}
                  className="flex-1 md:flex-none flex md:flex-row flex-col items-center justify-start md:justify-start gap-2 md:gap-4 group outline-none pt-1 md:pt-0"
                >
                  <span className={`w-12 h-12 md:w-14 md:h-14 border flex items-center justify-center transition-all duration-300 shrink-0 ${
                    isActive
                      ? 'bg-[#1b1b1b] border-[#1b1b1b]'
                      : 'bg-transparent border-[#1b1b1b]/20 group-hover:border-[#1b1b1b]'
                  }`}>
                    <tab.Icon active={isActive} />
                  </span>
                  <span className={`font-mono font-semibold text-[0.72rem] tracking-[0.15em] uppercase text-center md:text-left transition-colors duration-300 ${
                    isActive ? 'text-[#1b1b1b]' : 'text-[#7b6a5c] group-hover:text-[#1b1b1b]'
                  }`}>
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* İçerik */}
          <div className="relative min-h-[220px]">
            <div key={active} className="flex flex-col gap-6 animate-[fadeIn_0.4s_ease-out]">
              {renderContent()}
            </div>
          </div>

        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .cup-container { transform: rotate(var(--rot-mobile)); transition: transform 0.6s cubic-bezier(0.34,1.56,0.64,1); }
        @media (min-width: 768px) { .cup-container { transform: rotate(var(--rot-desktop)); } }
      `}</style>
    </section>
  );
};

export default ProductInfoSection;
