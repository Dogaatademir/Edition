import { useEffect, useRef, useState } from "react";
import { Award, Coffee, Flame, Globe, MapPin } from "lucide-react";

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

export default function Hakkimizda() {
  const heroReveal = useReveal();
  const storyReveal = useReveal();
  const featuresReveal = useReveal();
  const missionReveal = useReveal();

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
            Hikayemiz
          </div>
          <h1 className="font-serif text-[clamp(2.5rem,6vw,6rem)] text-[#000000] leading-[1.05] tracking-[-0.02em] max-w-4xl">
            Kahve yalnızca bir içecek değil, <em className="italic text-[#555555]">emek ve tutkunun</em> birleştiği bir deneyimdir.
          </h1>
        </div>
      </section>

      {/* ─── 2. HİKAYE VE GÖRSEL ─── */}
      <section className="border-b border-[#E5E5E5] bg-[#FAFAFA]">
        <div className="max-w-[1440px] mx-auto flex flex-col lg:flex-row">
          <div 
            ref={storyReveal.ref}
            className={`flex-1 p-8 md:p-16 lg:p-24 flex flex-col justify-center transition-all duration-[1000ms] ease-out delay-200 ${storyReveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}
          >
            <h2 className="font-serif text-[2rem] md:text-[2.5rem] leading-[1.1] mb-8">
              Ankara Merkezli <br />Özel Kahve Markası
            </h2>
            <div className="space-y-6 font-sans font-light text-[1rem] leading-[1.8] text-[#555555]">
              <p>
                Edition Coffee, iyi kahveyi herkes için erişilebilir ve tutarlı kılmayı hedefleyen Ankara merkezli bir özel kahve markasıdır.
              </p>
              <p>
                Dünyanın seçkin bölgelerinden özenle seçilen kahveleri, her çekirdeğin kendi doğasındaki potansiyeli ve karakterini en iyi şekilde ortaya çıkaracak şekilde ustalıkla kavuruyoruz. Bizim için kavurma süreci, çekirdeğin tarladaki hikayesini fincanınıza en doğru şekilde aktarma sanatıdır.
              </p>
            </div>
            
            <div className="mt-12 flex items-center gap-4 border-t border-[#E5E5E5] pt-8">
              <div className="w-12 h-12 rounded-full border border-[#E5E5E5] flex items-center justify-center bg-[#FFFFFF]">
                <MapPin className="w-5 h-5 text-[#000000]" />
              </div>
              <div>
                <div className="font-mono text-[0.6rem] tracking-[0.2em] uppercase text-[#888888]">Merkez / Atölye</div>
                <div className="font-serif text-[1.1rem] text-[#000000]">Ankara, Türkiye</div>
              </div>
            </div>
          </div>

          <div className="flex-1 border-l border-[#E5E5E5] relative min-h-[400px] lg:min-h-[600px] overflow-hidden group">
            {/* DÜZELTME: Fotoğraf daha sıcak ve estetik bir atölye görseliyle değiştirildi, grayscale filtresi kaldırıldı */}
            <img 
              src="https://images.unsplash.com/photo-1587734195503-904fca47e0e9?q=80&w=1600&auto=format&fit=crop" 
              alt="Coffee Roasting Process" 
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-[10s] group-hover:scale-105"
            />
            {/* Hafif karartma overlay'i */}
            <div className="absolute inset-0 bg-[#000000]/10 mix-blend-multiply pointer-events-none" />
          </div>
        </div>
      </section>

      {/* ─── 3. DEĞERLERİMİZ (GRID) ─── */}
      <section className="bg-[#FFFFFF] border-b border-[#E5E5E5]">
        <div ref={featuresReveal.ref} className={`max-w-[1440px] mx-auto transition-all duration-[1000ms] ease-out ${featuresReveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}>
          
          <div className="p-8 md:p-16 lg:px-24 border-b border-[#E5E5E5]">
            <h3 className="font-serif text-[2rem] md:text-[3rem] text-[#000000] leading-none">
              Kahvemiz <em className="italic text-[#888888]">Neden Özel?</em>
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            
            {/* KART 1 */}
            <div className="p-8 md:p-12 border-b lg:border-b-0 lg:border-r border-[#E5E5E5] flex flex-col group hover:bg-[#FAFAFA] transition-colors">
              <div className="w-12 h-12 bg-[#000000] text-[#FFFFFF] flex items-center justify-center mb-8 shrink-0 transition-transform duration-500 group-hover:-translate-y-2">
                <Globe className="w-5 h-5" strokeWidth={1.5} />
              </div>
              <div className="font-mono text-[0.6rem] tracking-[0.2em] uppercase text-[#888888] mb-3">
                Kaynağından Gelen Fark
              </div>
              <h4 className="font-serif text-[1.4rem] text-[#000000] mb-4 leading-tight">%100 Arabica</h4>
              <p className="font-sans font-light text-[0.9rem] text-[#555555] leading-relaxed">
                Dünya çapında en seçkin kahve bölgelerinden seçilen %100 Arabica çekirdeklerimizle benzersiz bir lezzet sunuyoruz.
              </p>
            </div>

            {/* KART 2 */}
            <div className="p-8 md:p-12 border-b lg:border-b-0 lg:border-r border-[#E5E5E5] flex flex-col group hover:bg-[#FAFAFA] transition-colors">
              <div className="w-12 h-12 bg-[#000000] text-[#FFFFFF] flex items-center justify-center mb-8 shrink-0 transition-transform duration-500 group-hover:-translate-y-2">
                <Flame className="w-5 h-5" strokeWidth={1.5} />
              </div>
              <div className="font-mono text-[0.6rem] tracking-[0.2em] uppercase text-[#888888] mb-3">
                Atölyemizden
              </div>
              <h4 className="font-serif text-[1.4rem] text-[#000000] mb-4 leading-tight">Özel Kavurma Profilleri</h4>
              <p className="font-sans font-light text-[0.9rem] text-[#555555] leading-relaxed">
                Her çekirdeğin potansiyelini ortaya çıkarmak için bölgesine özel kavurma profilleri geliştiriyoruz. Kendi fabrikamızdaki kavurma süreci sayesinde her zaman taze ve dengeli bir lezzet sunuyoruz.
              </p>
            </div>

            {/* KART 3 */}
            <div className="p-8 md:p-12 border-b md:border-b-0 md:border-r border-[#E5E5E5] flex flex-col group hover:bg-[#FAFAFA] transition-colors">
              <div className="w-12 h-12 bg-[#000000] text-[#FFFFFF] flex items-center justify-center mb-8 shrink-0 transition-transform duration-500 group-hover:-translate-y-2">
                <Award className="w-5 h-5" strokeWidth={1.5} />
              </div>
              <div className="font-mono text-[0.6rem] tracking-[0.2em] uppercase text-[#888888] mb-3">
                Tescillenmiş Kalite
              </div>
              <h4 className="font-serif text-[1.4rem] text-[#000000] mb-4 leading-tight">80+ Q-Grader Puanı</h4>
              <p className="font-sans font-light text-[0.9rem] text-[#555555] leading-relaxed">
                Q Grader sertifikalı profesyonel kahve tadımcıları tarafından 80 puan üzerinde değerlendirilen, sadece en seçkin ve nitelikli kahveleri kullanıyoruz.
              </p>
            </div>

            {/* KART 4 */}
            <div className="p-8 md:p-12 flex flex-col group hover:bg-[#FAFAFA] transition-colors">
             <div className="w-12 h-12 bg-[#000000] text-[#FFFFFF] flex items-center justify-center mb-8 shrink-0 transition-transform duration-500 group-hover:-translate-y-2">
                <Coffee className="w-5 h-5" strokeWidth={1.5} />
              </div>
              <div className="font-mono text-[0.6rem] tracking-[0.2em] uppercase text-[#888888] mb-3">
                İmza Lezzet
              </div>
              <h4 className="font-serif text-[1.4rem] text-[#000000] mb-4 leading-tight">Özel Harmanlar</h4>
              <p className="font-sans font-light text-[0.9rem] text-[#555555] leading-relaxed">
                Seçkin kahve çekirdeklerini ustalıkla bir araya getirerek, kendine özgü karaktere sahip özel karışımlar geliştiriyor, yüksek kalite anlayışımızı sürdürüyoruz.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ─── 4. MİSYON (DÜZELTME: Siyah footer'dan ayrışması için açık renge çevrildi) ─── */}
      <section className="bg-[#FAFAFA] text-[#000000] py-24 px-6 md:px-10 text-center overflow-hidden border-b border-[#E5E5E5]">
        <div ref={missionReveal.ref} className={`max-w-4xl mx-auto flex flex-col items-center transition-all duration-[1000ms] ease-out ${missionReveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}>
          <div className="w-[1px] h-16 bg-[#000000]/20 mb-8"></div>
          <h3 className="font-serif text-[1.8rem] md:text-[2.5rem] leading-[1.3] text-[#000000] mb-8">
            Ankara’daki kavurma tesisimizde siparişe göre taze kavurma yapar, özenle paketleyerek doğrudan size ulaştırırız.
          </h3>
          <div className="font-mono text-[0.65rem] md:text-[0.75rem] tracking-[0.2em] uppercase text-[#000000] border border-[#000000]/20 px-8 py-3 bg-[#FFFFFF]">
            Taze Kavrum · Siparişe Özel · Tüm Türkiye'ye
          </div>
        </div>
      </section>

    </div>
  );
}