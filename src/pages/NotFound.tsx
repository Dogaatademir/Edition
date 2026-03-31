import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, Home, ShoppingBag, Search } from 'lucide-react';

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

const NotFound = () => {
  const location = useLocation();
  const reveal = useReveal();

  return (
    <main className="bg-[#FFFFFF] text-[#000000] min-h-screen font-sans selection:bg-[#000000] selection:text-[#FFFFFF] flex flex-col">
      
      <section className="relative flex-grow flex flex-col items-center justify-center pt-32 pb-20 px-6 md:px-10 overflow-hidden border-b border-[#E5E5E5]">
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
          ref={reveal.ref} 
          className={`relative z-10 mx-auto max-w-3xl text-center transition-all duration-[1000ms] ease-out ${reveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}
        >
          <div className="font-mono text-[0.58rem] tracking-[0.35em] uppercase text-[#888888] mb-6 flex items-center justify-center gap-2 before:content-[''] before:block before:w-5 before:h-[1px] before:bg-[#888888] after:content-[''] after:block after:w-5 after:h-[1px] after:bg-[#888888]">
            Sayfa Bulunamadı
          </div>
          
          <h1 className="font-serif text-[clamp(5rem,15vw,10rem)] text-[#000000] leading-none tracking-[-0.02em] mb-6">
            404
          </h1>

          <p className="mx-auto max-w-xl text-[1rem] font-sans font-light text-[#555555] leading-[1.85] mb-12">
            Aradığınız sayfa taşınmış, silinmiş olabilir ya da adresi yanlış yazmış olabilirsiniz.
          </p>

          {/* İstenen Adres Kartı */}
          <div className="mx-auto mb-12 max-w-xl border border-[#E5E5E5] bg-[#FAFAFA] p-6 text-left flex items-start gap-4">
            <div className="flex h-10 w-10 items-center justify-center border border-[#000000] bg-[#FFFFFF] shrink-0">
              <Search className="h-4 w-4 text-[#000000]" strokeWidth={1.5} />
            </div>
            <div className="min-w-0 flex flex-col justify-center min-h-[2.5rem]">
              <p className="font-mono text-[0.55rem] tracking-[0.2em] text-[#888888] uppercase mb-1">
                İstenen Adres
              </p>
              <p className="break-all font-sans text-[0.9rem] text-[#000000]">
                {location.pathname}
              </p>
            </div>
          </div>

          {/* Aksiyon Butonları */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/"
              className="group flex w-full sm:w-auto items-center justify-center gap-3 bg-[#000000] text-[#FFFFFF] px-10 py-4 border border-[#000000] hover:bg-[#555555] hover:border-[#555555] transition-colors"
            >
              <span className="font-mono text-[0.65rem] tracking-[0.15em] uppercase">Ana Sayfa</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>

            <Link
              to="/kahveler"
              className="flex w-full sm:w-auto items-center justify-center gap-3 bg-[#FFFFFF] text-[#000000] px-10 py-4 border border-[#E5E5E5] hover:border-[#000000] transition-colors"
            >
              <ShoppingBag className="h-4 w-4" />
              <span className="font-mono text-[0.65rem] tracking-[0.15em] uppercase">Tüm Seçki</span>
            </Link>

            <Link
              to="/hakkimizda"
              className="flex w-full sm:w-auto items-center justify-center gap-3 bg-[#FFFFFF] text-[#000000] px-10 py-4 border border-[#E5E5E5] hover:border-[#000000] transition-colors"
            >
              <Home className="h-4 w-4" />
              <span className="font-mono text-[0.65rem] tracking-[0.15em] uppercase">Hakkımızda</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Kısayol Alanı (Siyah Kapanış) */}
      <section className="bg-[#000000] text-[#FFFFFF] py-16 px-6 md:px-10 text-center">
        <div className="max-w-2xl mx-auto flex flex-col items-center">
           <p className="font-sans font-light text-[0.95rem] leading-[1.85] text-[#FFFFFF]/80 mb-8">
              Kısayol: En çok ziyaret edilen sayfamız <span className="font-semibold text-[#FFFFFF]">Tüm Seçki</span>. Nitelikli kahvelerimizi inceleyip doğru seçimi hızlıca yapabilirsiniz.
           </p>
           <Link
            to="/kahveler"
            className="font-mono text-[0.65rem] tracking-[0.15em] uppercase text-[#000000] bg-[#FFFFFF] border border-[#FFFFFF] px-10 py-4 transition-colors hover:bg-[#E5E5E5]"
          >
            Seçkiyi Keşfet
          </Link>
        </div>
      </section>
      
    </main>
  );
};

export default NotFound;