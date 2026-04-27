// src/components/ProductInfoSection.tsx
import React, { useState } from 'react';
import type { CoffeeProduct } from '../lib/shopify';

// Tadım: yan fincan + buhar
const IconTasting = ({ active }: { active: boolean }) => (
  <svg width="26" height="26" viewBox="0 0 32 32" fill="none"
    stroke={active ? '#FFFFFF' : '#1A1A1A'}
    strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    {/* buhar */}
    <path d="M11 7 Q10 5 11 3" />
    <path d="M16 7 Q15 5 16 3" />
    <path d="M21 7 Q20 5 21 3" />
    {/* fincan gövdesi */}
    <path d="M8 10 h16 l-2 13 H10 Z" />
    {/* kulp */}
    <path d="M24 13 Q29 13 29 17 Q29 21 24 21" />
    {/* tabak */}
    <path d="M6 25 h20" />
  </svg>
);

// Harman: iki kahve çekirdeği
const IconBlend = ({ active }: { active: boolean }) => (
  <svg width="26" height="26" viewBox="0 0 32 32" fill="none"
    stroke={active ? '#FFFFFF' : '#1A1A1A'}
    strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    {/* sol çekirdek */}
    <ellipse cx="11" cy="16" rx="5.5" ry="8.5" transform="rotate(-18 11 16)" />
    <path d="M7.5 10.5 Q11 16 14.5 21.5" />
    {/* sağ çekirdek */}
    <ellipse cx="21" cy="16" rx="5.5" ry="8.5" transform="rotate(18 21 16)" />
    <path d="M17.5 21.5 Q21 16 24.5 10.5" />
  </svg>
);

// Ürün Bilgisi: kahve paketi / torba
const IconProduct = ({ active }: { active: boolean }) => (
  <svg width="26" height="26" viewBox="0 0 32 32" fill="none"
    stroke={active ? '#FFFFFF' : '#1A1A1A'}
    strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
    {/* torba gövdesi */}
    <path d="M9 11 L8 27 H24 L23 11 Z" />
    {/* katlı üst kenar */}
    <path d="M9 11 Q10 8 13 8 L19 8 Q22 8 23 11" />
    {/* degassing valfi (küçük daire) */}
    <circle cx="16" cy="19" r="2.5" />
    {/* zip çizgisi */}
    <path d="M11 14 H21" />
  </svg>
);

type TabId = 'tasting' | 'blend' | 'product';

interface TabDef {
  id: TabId;
  label: string;
  Icon: React.FC<{ active: boolean }>;
}

// Masaüstü: butonlar sağda → saat-3 (0deg) bazlı
const CUP_ROTATION_DESKTOP: Record<TabId, number> = {
  tasting: -23,
  blend: 0,
  product: 23,
};

// Mobil: butonlar altta → saat-6 (90deg) bazlı
const CUP_ROTATION_MOBILE: Record<TabId, number> = {
  tasting: 115,
  blend: 88,
  product: 60,
};

const TABS: TabDef[] = [
  { id: 'tasting', label: 'Tadım ve Kavurma', Icon: IconTasting },
  { id: 'blend',   label: 'Harman',            Icon: IconBlend   },
  { id: 'product', label: 'Ürün Bilgisi',       Icon: IconProduct },
];

interface ProductInfoSectionProps {
  product: CoffeeProduct;
}

const ProductInfoSection: React.FC<ProductInfoSectionProps> = ({ product }) => {
  const [active, setActive] = useState<TabId>('tasting');

  const renderContent = () => {
    switch (active) {
      case 'tasting':
        return (
          <>
            <ContentBlock
              title="Zengin ve Güçlü"
              body={
                product.description
                ?? `Bu kahve çekirdeklerimiz ${product.roast ?? 'özel'} profilinde, yani yoğun ve karakterli kavrulmuştur. Özellikle sert ve canlandırıcı bir kahve deneyimi arayanlar için oldukça ideal bir seçenektir.`
              }
            />
            <ContentBlock
              title="Tat Profili"
              body={
                product.notes && product.notes.length > 0
                  ? product.notes.join(', ')
                  : 'Dengeli gövde, yumuşak asidite, uzun bitiş.'
              }
            />
            <ContentBlock
              title="Kavurma Notları"
              body={product.roast ? `${product.roast} · Yoğun ve koyu kavrum` : 'Orta-koyu kavrum'}
            />
          </>
        );
      case 'blend':
        return (
          <>
            <ContentBlock title="Çekirdek Türü" body="Arabica ve Robusta" />
            <ContentBlock title="Menşei" body={product.origin ?? 'Afrika, Güney ve Orta Amerika'} />
            <ContentBlock title="İşlem" body={product.process ?? 'Yıkanmış / Doğal kombinasyonu'} />
          </>
        );
      case 'product':
        return (
          <>
            <ContentBlock
              title="Gramaj"
              body={
                product.variants && product.variants.length > 0 && product.variants[0].weight !== 'Default Title'
                  ? product.variants.map(v => v.weight).join(' · ')
                  : '250 Gr · 500 Gr · 1000 Gr'
              }
            />
            <ContentBlock title="Ambalaj" body="Zipli & Valfli Flat Bottom (oturan) paket" />
            <ContentBlock title="Raf Ömrü" body="Üretim tarihinden itibaren 12 ay" />
          </>
        );
    }
  };

  return (
    <section className="mt-16 md:mt-24 border-t border-[#E5E5E5] pt-16 md:pt-24 pb-12">
      <div className="mx-auto max-w-[1200px] px-6 md:px-10">

        <div className="flex flex-col items-center text-center mb-12 md:mb-16">
          <span className="font-mono text-[0.6rem] tracking-[0.3em] uppercase text-[#888888] mb-4
            flex items-center gap-2
            before:content-[''] before:block before:w-5 before:h-[1px] before:bg-[#888888]
            after:content-[''] after:block after:w-5 after:h-[1px] after:bg-[#888888]">
            Ürün Detayı
          </span>
          <h2 className="font-serif text-[clamp(2rem,3vw,2.8rem)] text-[#000000] leading-[1.15] tracking-[-0.02em]">
            Fincanınızın <em className="italic text-[#555555]">İçindekiler</em>
          </h2>
        </div>

        {/* Ana layout: [Fincan] [Sekmeler] [İçerik] */}
        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1.6fr)_auto_minmax(0,1fr)] items-center gap-8 md:gap-10 lg:gap-12">

          {/* SOL: Fincan fotoğrafı */}
          <div className="min-w-0 flex justify-center md:justify-end">
            <div
              className="cup-container w-[390px] sm:w-[460px] md:w-[520px] max-w-full aspect-square rounded-full overflow-hidden"
              style={{
                ['--rot-mobile' as string]: `${CUP_ROTATION_MOBILE[active]}deg`,
                ['--rot-desktop' as string]: `${CUP_ROTATION_DESKTOP[active]}deg`,
              } as React.CSSProperties}
            >
              <img
                src="/cup1.png"
                alt="Kahve fincanı"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* ORTA: Dikey sekmeler */}
          <div className="flex md:flex-col flex-row w-full md:w-auto gap-0 md:gap-8 justify-center md:justify-start">
            {TABS.map(tab => {
              const isActive = active === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActive(tab.id)}
                  aria-pressed={isActive}
                  className="flex-1 md:flex-none flex md:flex-row flex-col items-center justify-center md:justify-start gap-3 md:gap-4 group outline-none"
                >
                  <span
                    className={`w-14 h-14 md:w-16 md:h-16 rounded-xl border flex items-center justify-center
                      transition-all duration-300 shrink-0
                      ${isActive
                        ? 'bg-[#000000] border-[#000000] shadow-[0_6px_20px_rgba(0,0,0,0.15)]'
                        : 'bg-[#FFFFFF] border-[#E5E5E5] group-hover:border-[#000000]'
                      }`}
                  >
                    <tab.Icon active={isActive} />
                  </span>
                  <span
                    className={`font-mono text-[0.65rem] tracking-[0.15em] uppercase
                      text-center md:text-left transition-colors duration-300
                      ${isActive ? 'text-[#000000]' : 'text-[#888888] group-hover:text-[#000000]'}`}
                  >
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* SAĞ: İçerik */}
          <div className="relative min-h-[220px]">
            <div
              key={active}
              className="flex flex-col gap-5 md:gap-6 animate-[fadeIn_0.5s_ease-out]"
            >
              {renderContent()}
            </div>
          </div>

        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .cup-container {
          transform: rotate(var(--rot-mobile));
          transition: transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @media (min-width: 768px) {
          .cup-container {
            transform: rotate(var(--rot-desktop));
          }
        }
      `}</style>
    </section>
  );
};

const ContentBlock: React.FC<{ title: string; body: React.ReactNode }> = ({ title, body }) => (
  <div>
    <h3 className="font-serif text-[1.25rem] md:text-[1.4rem] text-[#000000] leading-tight mb-2 tracking-[-0.01em]">
      {title}
    </h3>
    <p className="font-sans font-light text-[0.95rem] leading-[1.85] text-[#555555]">
      {body}
    </p>
  </div>
);

export default ProductInfoSection;
