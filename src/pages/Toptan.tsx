import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Coffee, Truck, Sliders, Users } from "lucide-react";

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

export default function Toptan() {
  const heroReveal = useReveal();
  const introReveal = useReveal();
  const featuresReveal = useReveal();
  const ctaReveal = useReveal();

  return (
    <div className="bg-[#FFFFFF] text-[#000000] min-h-screen font-sans selection:bg-[#000000] selection:text-[#FFFFFF]">
      
      {/* ─── 1. HERO BÖLÜMÜ ─── */}
      <section className="relative flex flex-col pt-32 pb-20 px-6 md:px-10 bg-[#FFFFFF] overflow-hidden border-b border-[#E5E5E5]">
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
          className={`relative z-10 max-w-[1440px] mx-auto w-full transition-all duration-[1000ms] ease-out ${heroReveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}
        >
          <div className="font-mono text-[0.58rem] tracking-[0.35em] uppercase text-[#888888] mb-6 flex items-center gap-2 before:content-[''] before:block before:w-5 before:h-[1px] before:bg-[#888888]">
            Kurumsal Çözümler
          </div>
          <h1 className="font-serif text-[clamp(2.5rem,6vw,6rem)] text-[#000000] leading-[1.05] tracking-[-0.02em] max-w-4xl">
            İşletmenize Özel <em className="italic text-[#555555]">Kahve Deneyimleri</em>
          </h1>
        </div>
      </section>

      {/* ─── 2. GİRİŞ VE VİZYON ─── */}
      <section className="border-b border-[#E5E5E5] bg-[#FAFAFA]">
        <div className="max-w-[1440px] mx-auto flex flex-col lg:flex-row">
          <div 
            ref={introReveal.ref}
            className={`flex-1 p-8 md:p-16 lg:p-24 flex flex-col justify-center transition-all duration-[1000ms] ease-out delay-200 ${introReveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}
          >
            <h2 className="font-serif text-[2rem] md:text-[2.5rem] leading-[1.1] mb-8">
              Sadece Tedarikçi Değil, <br />Çözüm Ortağınız
            </h2>
            <div className="space-y-6 font-sans font-light text-[1rem] leading-[1.8] text-[#555555]">
              <p>
                Toptan satışlarımızda, sunduğumuz geniş kahve yelpazesi ve yüksek kalite standartlarımızla öne çıkıyoruz. Uzun yıllara dayanan kavurma tecrübemizle, butik kafelerden kurumsal ofislere kadar her türlü işletmenin ihtiyacına uygun, nitelikli kahve çözümleri üretiyoruz.
              </p>
              <p>
                Hangi demleme yöntemini veya kahve türünü tercih ederseniz edin; misafirlerinize her zaman aynı kalitede, taze ve akılda kalıcı bir kahve deneyimi sunmanız için arkaplandaki gücünüz olmaya hazırız.
              </p>
            </div>
          </div>

          <div className="flex-1 border-t lg:border-t-0 lg:border-l border-[#E5E5E5] relative min-h-[400px] lg:min-h-[600px] overflow-hidden group">
            <img 
              src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=2000&auto=format&fit=crop" 
              alt="Barista preparing coffee" 
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-[10s] group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-[#000000]/5 mix-blend-multiply pointer-events-none" />
          </div>
        </div>
      </section>

      {/* ─── 3. HİZMETLERİMİZ (GRID) ─── */}
      <section className="bg-[#FFFFFF] border-b border-[#E5E5E5]">
        <div ref={featuresReveal.ref} className={`max-w-[1440px] mx-auto transition-all duration-[1000ms] ease-out ${featuresReveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}>
          
          <div className="p-8 md:p-16 lg:px-24 border-b border-[#E5E5E5]">
            <h3 className="font-serif text-[2rem] md:text-[3rem] text-[#000000] leading-none">
              Neden <em className="italic text-[#888888]">Edition Coffee?</em>
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            
            {/* KART 1 */}
            <div className="p-8 md:p-12 border-b lg:border-b-0 lg:border-r border-[#E5E5E5] flex flex-col group hover:bg-[#FAFAFA] transition-colors">
              <div className="w-12 h-12 bg-[#000000] text-[#FFFFFF] flex items-center justify-center mb-8 shrink-0 transition-transform duration-500 group-hover:-translate-y-2">
                <Sliders className="w-5 h-5" strokeWidth={1.5} />
              </div>
              <div className="font-mono text-[0.6rem] tracking-[0.2em] uppercase text-[#888888] mb-3">
                Kişiselleştirme
              </div>
              <h4 className="font-serif text-[1.4rem] text-[#000000] mb-4 leading-tight">Size Özel Profilleme</h4>
              <p className="font-sans font-light text-[0.9rem] text-[#555555] leading-relaxed">
                İşletmenizin karakterine ve beklentilerine uygun aroma, gövde, asidite ve kavurma derecesi gibi özellikleri dikkate alarak size tamamen özel bir kahve menüsü yaratıyoruz.
              </p>
            </div>

            {/* KART 2 */}
            <div className="p-8 md:p-12 border-b lg:border-b-0 lg:border-r border-[#E5E5E5] flex flex-col group hover:bg-[#FAFAFA] transition-colors">
              <div className="w-12 h-12 bg-[#000000] text-[#FFFFFF] flex items-center justify-center mb-8 shrink-0 transition-transform duration-500 group-hover:-translate-y-2">
                <Coffee className="w-5 h-5" strokeWidth={1.5} />
              </div>
              <div className="font-mono text-[0.6rem] tracking-[0.2em] uppercase text-[#888888] mb-3">
                Ürün Çeşitliliği
              </div>
              <h4 className="font-serif text-[1.4rem] text-[#000000] mb-4 leading-tight">Geniş Çekirdek Seçkisi</h4>
              <p className="font-sans font-light text-[0.9rem] text-[#555555] leading-relaxed">
                Single origin yöresel kahvelerden, işletmenizin demirbaşı olacak imza espresso harmanlarına kadar, Q-Grader onaylı, nitelikli ve sürdürülebilir bir kahve tedariği sağlıyoruz.
              </p>
            </div>

            {/* KART 3 */}
            <div className="p-8 md:p-12 border-b md:border-b-0 md:border-r border-[#E5E5E5] flex flex-col group hover:bg-[#FAFAFA] transition-colors">
              <div className="w-12 h-12 bg-[#000000] text-[#FFFFFF] flex items-center justify-center mb-8 shrink-0 transition-transform duration-500 group-hover:-translate-y-2">
                <Truck className="w-5 h-5" strokeWidth={1.5} />
              </div>
              <div className="font-mono text-[0.6rem] tracking-[0.2em] uppercase text-[#888888] mb-3">
                Tazelik & Operasyon
              </div>
              <h4 className="font-serif text-[1.4rem] text-[#000000] mb-4 leading-tight">Etkili Lojistik</h4>
              <p className="font-sans font-light text-[0.9rem] text-[#555555] leading-relaxed">
                Stok beklemiş kahveler değil, siparişinize özel kavrulmuş çekirdekler gönderiyoruz. Ürünlerimizi aromalarını maksimum seviyede koruyacak şekilde paketliyor ve zamanında ulaştırıyoruz.
              </p>
            </div>

            {/* KART 4 */}
            <div className="p-8 md:p-12 flex flex-col group hover:bg-[#FAFAFA] transition-colors">
              <div className="w-12 h-12 bg-[#000000] text-[#FFFFFF] flex items-center justify-center mb-8 shrink-0 transition-transform duration-500 group-hover:-translate-y-2">
                <Users className="w-5 h-5" strokeWidth={1.5} />
              </div>
              <div className="font-mono text-[0.6rem] tracking-[0.2em] uppercase text-[#888888] mb-3">
                Destek & Eğitim
              </div>
              <h4 className="font-serif text-[1.4rem] text-[#000000] mb-4 leading-tight">Eğitim Danışmanlığı</h4>
              <p className="font-sans font-light text-[0.9rem] text-[#555555] leading-relaxed">
                Sadece kahve çekirdeği sağlamakla kalmıyor; doğru ekipman seçimi, reçete oluşturma ve barista eğitimi konularında da işletmenize profesyonel danışmanlık veriyoruz.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ─── 4. İLETİŞİM (CTA) BÖLÜMÜ ─── */}
      <section className="bg-[#FFFFFF] py-24 px-6 md:px-10 border-b border-[#E5E5E5]">
        <div ref={ctaReveal.ref} className={`max-w-[1440px] mx-auto flex flex-col lg:flex-row items-center justify-between gap-12 transition-all duration-[1000ms] ease-out ${ctaReveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}>
          
          <div className="flex-1 text-center lg:text-left">
            <h3 className="font-serif text-[2rem] md:text-[3rem] text-[#000000] leading-[1.1] mb-6">
              İşletmeniz için doğru kahveyi <br className="hidden lg:block"/>
              <em className="italic text-[#555555]">birlikte seçelim.</em>
            </h3>
            <p className="font-sans font-light text-[1rem] text-[#888888] max-w-xl mx-auto lg:mx-0">
              Menünüzü tasarlamak, tadım talebinde bulunmak ve toptan fiyatlandırma politikalarımız hakkında detaylı bilgi almak için bizimle iletişime geçin.
            </p>
          </div>

          <div className="flex-shrink-0">
            <Link 
              to="/iletisim" 
              className="group flex items-center gap-4 bg-[#000000] text-[#FFFFFF] px-8 md:px-12 py-5 border border-[#000000] hover:bg-[#FFFFFF] hover:text-[#000000] transition-colors"
            >
              <span className="font-mono text-[0.7rem] md:text-[0.8rem] tracking-[0.15em] uppercase">
                İletişime Geçin
              </span>
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

        </div>
      </section>

    </div>
  );
}