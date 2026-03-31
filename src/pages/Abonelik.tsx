import React, { useState, useEffect, useRef } from 'react';
import { 
  Check, 
  Truck, 
  RefreshCw,
  Coffee,
  ArrowRight
} from 'lucide-react';
import { useCart } from '../context/CartContext';

// ─── HOOK ─────────────────────────────────────────────────────────────────────
function useReveal(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { 
      if (e.isIntersecting) { setVisible(true); obs.disconnect(); } 
    }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

// --- YARDIMCI BİLEŞENLER ---

const SectionHeading = ({ children, label }: { children: React.ReactNode; label?: string }) => (
  <div className="mb-12 text-center md:mb-16 relative flex flex-col items-center">
    {label && (
      <div className="font-mono text-[0.58rem] tracking-[0.35em] uppercase text-[#888888] mb-4 flex items-center justify-center gap-2 before:content-[''] before:block before:w-5 before:h-[1px] before:bg-[#888888] after:content-[''] after:block after:w-5 after:h-[1px] after:bg-[#888888]">
        {label}
      </div>
    )}
    <h2 className="font-serif text-[clamp(2rem,4vw,3rem)] text-[#000000] leading-[1.05] tracking-[-0.02em]">
      {children}
    </h2>
  </div>
);

// --- PLAN KARTI ---

interface PlanProps {
  id: number;
  title: string;
  subtitle: string;
  volume: string; 
  price: string;
  oldPrice: string;
  popular?: boolean;
  profile: 'filtre' | 'espresso';
  delay: number;
}

const PlanCard = ({ title, subtitle, volume, price, oldPrice, popular, id, profile, delay }: PlanProps) => {
  const { addToCart } = useCart();
  const reveal = useReveal(0.1);

  const handleSelectPlan = () => {
    const planProduct = {
      id: 500 + id,
      code: `SUB-${profile.substring(0,3).toUpperCase()}-${id}`,
      name: `Abonelik: ${title} (${profile === 'filtre' ? 'Filtre' : 'Espresso'} Profil)`,
      price: price,
      category: ['paket'],
      origin: "Abonelik Özel Seçki",
      process: "Karışık",
      roast: profile === 'filtre' ? "Açık-Orta" : "Orta-Koyu",
      notes: ["Sürpriz Notalar", "Taze Kavrum"],
      badge: "ABONELİK",
      showOnHome: false,
      description: "Aylık düzenli olarak gönderilecek abonelik paketiniz.",
      brewingGuide: "Ekipmanınıza göre öğütüp taze taze demleyin.",
      variants: []
    };
    
    // Sepete eklerken isSubscription: true olarak geçiyoruz (Mevcut mantığınızı koruyarak)
    addToCart(planProduct, 1); 
  };

  return (
    <div 
      ref={reveal.ref}
      className={`relative flex flex-col bg-[#FFFFFF] p-8 md:p-12 transition-all duration-[800ms] ease-out ${
        popular ? 'border-2 border-[#000000] shadow-sm z-10 scale-[1.02]' : 'border border-[#E5E5E5] hover:border-[#000000]'
      } ${reveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      
      {popular && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#000000] text-[#FFFFFF] px-4 py-1 text-[0.55rem] font-mono tracking-[0.2em] uppercase">
          En Popüler
        </span>
      )}

      <div className="text-center mb-10">
        <h3 className="font-serif text-[1.8rem] text-[#000000] mb-2">{title}</h3>
        <span className="font-mono text-[0.6rem] tracking-[0.15em] text-[#888888] uppercase">{subtitle}</span>
      </div>

      <div className="mb-10 flex flex-col items-center justify-center border-y border-[#E5E5E5] py-8 bg-[#FAFAFA]">
        <span className="block text-4xl font-mono text-[#000000] mb-2">{volume}</span>
        <span className="text-[0.55rem] font-mono tracking-[0.2em] uppercase text-[#888888]">Aylık Teslimat</span>
      </div>

      <ul className="mb-12 space-y-4 w-full text-[0.85rem] text-[#555555] font-sans font-light">
        <li className="flex items-center gap-3">
          <Check className="h-4 w-4 text-[#000000]" strokeWidth={1.5} /> 
          Sabit %10 Abonelik İndirimi
        </li>
        <li className="flex items-center gap-3">
          <Check className="h-4 w-4 text-[#000000]" strokeWidth={1.5} /> 
          Taahhüt Yok, Dilediğinde İptal Et
        </li>
        <li className="flex items-center gap-3">
          <Check className="h-4 w-4 text-[#000000]" strokeWidth={1.5} /> 
          Ücretsiz & Taze Kargo
        </li>
      </ul>

      <div className="mt-auto w-full text-center">
        <div className="mb-6 flex flex-col items-center gap-1">
          <span className="text-[0.55rem] font-mono text-[#888888] uppercase tracking-[0.2em]">Aylık</span>
          <div className="flex items-end justify-center gap-3">
            <span className="text-[0.9rem] font-mono text-[#888888] line-through mb-1">{oldPrice}</span>
            <span className="text-[1.8rem] font-mono font-semibold text-[#000000]">{price}</span>
          </div>
        </div>
        
        <button 
          onClick={handleSelectPlan}
          className={`w-full group flex items-center justify-center gap-3 py-4 font-mono text-[0.65rem] tracking-[0.15em] uppercase transition-colors border border-[#000000] ${
            popular 
              ? 'bg-[#000000] text-[#FFFFFF] hover:bg-[#555555] hover:border-[#555555]' 
              : 'bg-[#FFFFFF] text-[#000000] hover:bg-[#000000] hover:text-[#FFFFFF]'
          }`}
        >
          Planı Seç
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </div>
  );
};

const SubscriptionPlans = () => {
  const [selectedProfile, setSelectedProfile] = useState<'filtre' | 'espresso'>('filtre');
  const sectionReveal = useReveal(0.1);

  // Gerçek fiyatları formatlamak için yardımcılar
  const formatTL = (val: number) => `₺${val.toLocaleString('tr-TR', { minimumFractionDigits: 0 })}`;
  
  // Base Fiyatlar (Sanal Fiyatlandırma Modeli)
  const basePrices = {
    filtre: { small: 640, medium: 1280, large: 1100 }, // 2x250, 4x250, 1000g
    espresso: { small: 700, medium: 1400, large: 1200 }
  };

  const currentPrices = basePrices[selectedProfile];

  const plans: PlanProps[] = [
    { 
      id: 1, 
      title: "Hafif İçici", 
      subtitle: "Günde 1-2 Fincan", 
      volume: "2 x 250g", 
      price: formatTL(currentPrices.small * 0.9), 
      oldPrice: formatTL(currentPrices.small),
      profile: selectedProfile,
      delay: 0
    },
    { 
      id: 2, 
      title: "Düzenli İçici", 
      subtitle: "Günde 3-4 Fincan", 
      volume: "4 x 250g", 
      price: formatTL(currentPrices.medium * 0.9), 
      oldPrice: formatTL(currentPrices.medium), 
      popular: true,
      profile: selectedProfile,
      delay: 200
    },
    { 
      id: 3, 
      title: "Ev & Ofis", 
      subtitle: "Yüksek Tüketim", 
      volume: "1000g", 
      price: formatTL(currentPrices.large * 0.9), 
      oldPrice: formatTL(currentPrices.large),
      profile: selectedProfile,
      delay: 400
    },
  ];

  return (
    <section className="px-6 py-20 bg-[#FAFAFA] border-y border-[#E5E5E5]">
      <div className="mx-auto max-w-[1440px]">
        <div ref={sectionReveal.ref} className={`transition-all duration-[1000ms] ease-out ${sectionReveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}>
          <SectionHeading label="Sana Uygun Olanı Seç">Abonelik Seçenekleri</SectionHeading>
          
          {/* Profil Seçici (Minimal Toggle) */}
          <div className="mb-16 flex justify-center">
            <div className="flex border border-[#E5E5E5] p-1 bg-[#FFFFFF] max-w-sm w-full">
              <button
                onClick={() => setSelectedProfile('filtre')}
                className={`flex-1 py-3 font-mono text-[0.6rem] tracking-[0.15em] uppercase transition-colors ${
                  selectedProfile === 'filtre' 
                    ? 'bg-[#000000] text-[#FFFFFF]' 
                    : 'text-[#888888] hover:text-[#000000] bg-transparent'
                }`}
              >
                Filtre Profil
              </button>
              <button
                onClick={() => setSelectedProfile('espresso')}
                className={`flex-1 py-3 font-mono text-[0.6rem] tracking-[0.15em] uppercase transition-colors ${
                  selectedProfile === 'espresso' 
                    ? 'bg-[#000000] text-[#FFFFFF]' 
                    : 'text-[#888888] hover:text-[#000000] bg-transparent'
                }`}
              >
                Espresso Profil
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-[#E5E5E5] bg-[#FFFFFF] max-w-5xl mx-auto">
          {plans.map((plan) => (
            <PlanCard key={`${plan.profile}-${plan.id}`} {...plan} />
          ))}
        </div>
        
        <div className="mt-12 text-center max-w-2xl mx-auto">
          <p className="text-[0.65rem] font-mono tracking-[0.1em] text-[#888888] uppercase leading-relaxed">
            * Belirtilen fiyatlar tekil alım üzerinden %10 abonelik indirimi uygulanmış tutarlardır. <br />
            Her ay gönderilecek kahveler, o dönemin en taze ve seçkin lotlarından özenle seçilir.
          </p>
        </div>
      </div>
    </section>
  );
};

// --- ŞARTLAR VE BİLGİLENDİRME ---

const SubscriptionTerms = () => {
  const termsReveal = useReveal(0.1);

  return (
    <section className="px-6 py-24 bg-[#FFFFFF]">
      <div 
        ref={termsReveal.ref}
        className={`mx-auto max-w-[1440px] transition-all duration-[1000ms] ease-out ${termsReveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-[#E5E5E5]">
          <div className="p-12 border-b md:border-b-0 md:border-r border-[#E5E5E5] text-center hover:bg-[#FAFAFA] transition-colors">
            <div className="w-12 h-12 border border-[#000000] flex items-center justify-center mx-auto mb-6 bg-[#FFFFFF]">
              <Coffee className="h-5 w-5 text-[#000000]" strokeWidth={1.5} />
            </div>
            <h4 className="font-serif text-[1.4rem] text-[#000000] mb-4">Her Zaman Taze</h4>
            <p className="font-sans font-light text-[0.9rem] text-[#555555] leading-relaxed">
              Abonelik kahveleriniz, kargo günü atölyemizde taze taze kavrulur ve dinlenme (degassing) süreci gözetilerek valfli ambalajlarda yola çıkar.
            </p>
          </div>
          
          <div className="p-12 border-b md:border-b-0 md:border-r border-[#E5E5E5] text-center hover:bg-[#FAFAFA] transition-colors">
            <div className="w-12 h-12 border border-[#000000] flex items-center justify-center mx-auto mb-6 bg-[#FFFFFF]">
              <RefreshCw className="h-5 w-5 text-[#000000]" strokeWidth={1.5} />
            </div>
            <h4 className="font-serif text-[1.4rem] text-[#000000] mb-4">Özgür Abonelik</h4>
            <p className="font-sans font-light text-[0.9rem] text-[#555555] leading-relaxed">
              Aboneliğiniz herhangi bir taahhüt içermez. İhtiyacınıza göre planınızı değiştirebilir veya dilediğiniz an tek tıkla duraklatabilirsiniz.
            </p>
          </div>
          
          <div className="p-12 text-center hover:bg-[#FAFAFA] transition-colors">
            <div className="w-12 h-12 border border-[#000000] flex items-center justify-center mx-auto mb-6 bg-[#FFFFFF]">
              <Truck className="h-5 w-5 text-[#000000]" strokeWidth={1.5} />
            </div>
            <h4 className="font-serif text-[1.4rem] text-[#000000] mb-4">Ücretsiz Teslimat</h4>
            <p className="font-sans font-light text-[0.9rem] text-[#555555] leading-relaxed">
              Abonelik paketlerinizde kargo ücreti ödemezsiniz. Belirlediğiniz periyotta, en güvendiğimiz kargo partnerlerimizle kapınıza kadar teslim edilir.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

const Abonelik = () => {
  const heroReveal = useReveal(0.1);

  return (
    <main className="bg-[#FFFFFF] w-full min-h-screen selection:bg-[#000000] selection:text-[#FFFFFF]">
      
      {/* ─── HERO BÖLÜMÜ ─── */}
      <section className="relative flex flex-col pt-32 pb-20 px-6 md:px-10 bg-[#FFFFFF] overflow-hidden">
        {/* Mimari Arka Plan Çizgileri */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 opacity-40">
          <svg className="w-full h-full" viewBox="0 0 1440 300" fill="none" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
            {[120, 360, 720, 1080, 1320].map((x) => (
              <line key={x} x1={x} y1="0" x2={x} y2="300" stroke="#000000" strokeWidth="0.4" strokeOpacity="0.08" />
            ))}
            <line x1="0" y1="150" x2="1440" y2="150" stroke="#000000" strokeWidth="0.4" strokeOpacity="0.08" />
          </svg>
        </div>

        <div 
          ref={heroReveal.ref}
          className={`relative z-10 max-w-[1440px] mx-auto w-full text-center transition-all duration-[1000ms] ease-out ${heroReveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}
        >
          <div className="font-mono text-[0.58rem] tracking-[0.35em] uppercase text-[#888888] mb-6 flex items-center justify-center gap-2 before:content-[''] before:block before:w-5 before:h-[1px] before:bg-[#888888] after:content-[''] after:block after:w-5 after:h-[1px] after:bg-[#888888]">
            Atölye Kulübü
          </div>
          <h1 className="font-serif text-[clamp(2.5rem,6vw,5rem)] text-[#000000] leading-[1.05] tracking-[-0.02em] max-w-4xl mx-auto mb-6">
            Nitelikli Kahve <em className="italic text-[#555555]">Aboneliği</em>
          </h1>
          <p className="font-sans font-light text-[1rem] leading-[1.85] text-[#555555] max-w-xl mx-auto">
            Evde veya ofiste kahvesiz kalmayın. Taze kavrulmuş nitelikli çekirdekler, belirlediğiniz profilde ve aralıklarda kapınıza gelsin.
          </p>
        </div>
      </section>
      
      <SubscriptionPlans />
      <SubscriptionTerms />
    </main>
  );
};

export default Abonelik;