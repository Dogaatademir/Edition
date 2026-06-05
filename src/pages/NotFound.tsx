import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, Home, ShoppingBag, Search } from 'lucide-react';

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
    <main className="bg-[#f7f0e7] text-[#1b1b1b] min-h-screen font-sans selection:bg-[#1b1b1b] selection:text-[#f7f0e7] flex flex-col">

      <section className="relative flex-grow flex flex-col items-center justify-center pt-32 pb-20 px-6 md:px-10 overflow-hidden border-b border-[#1b1b1b]/10">
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <svg className="w-full h-full" viewBox="0 0 1440 300" fill="none" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
            {[120, 360, 720, 1080, 1320].map((x) => (
              <line key={x} x1={x} y1="0" x2={x} y2="300" stroke="#1b1b1b" strokeWidth="0.4" strokeOpacity="0.06" />
            ))}
            <line x1="0" y1="150" x2="1440" y2="150" stroke="#1b1b1b" strokeWidth="0.4" strokeOpacity="0.06" />
          </svg>
        </div>

        <div
          ref={reveal.ref}
          className={`relative z-10 mx-auto max-w-3xl text-center transition-all duration-[1000ms] ease-out ${reveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}
        >
          <div className="font-mono text-[0.58rem] tracking-[0.35em] uppercase text-[#C17A3A] mb-6 flex items-center justify-center gap-2 before:content-[''] before:block before:w-5 before:h-[1px] before:bg-[#C17A3A] after:content-[''] after:block after:w-5 after:h-[1px] after:bg-[#C17A3A]">
            Sayfa Bulunamadı
          </div>

          <h1 className="font-serif text-[clamp(5rem,15vw,10rem)] text-[#1b1b1b] leading-none tracking-[-0.02em] mb-6">
            404
          </h1>

          <p className="mx-auto max-w-xl text-[1rem] font-sans font-light text-[#5c4635] leading-[1.85] mb-12">
            Aradığınız sayfa taşınmış, silinmiş olabilir ya da adresi yanlış yazmış olabilirsiniz.
          </p>

          <div className="mx-auto mb-12 max-w-xl border border-[#1b1b1b]/10 bg-[#efe5d8] p-6 text-left flex items-start gap-4">
            <div className="flex h-10 w-10 items-center justify-center border border-[#1b1b1b]/10 bg-[#fdfaf6] shrink-0">
              <Search className="h-4 w-4 text-[#c38152]" strokeWidth={1.5} />
            </div>
            <div className="min-w-0 flex flex-col justify-center min-h-[2.5rem]">
              <p className="font-mono text-[0.55rem] tracking-[0.2em] text-[#C17A3A] uppercase mb-1">
                İstenen Adres
              </p>
              <p className="break-all font-sans text-[0.9rem] text-[#1b1b1b]">
                {location.pathname}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/"
              className="group flex w-full sm:w-auto items-center justify-center gap-3 bg-[#1b1b1b] text-[#f7f0e7] px-10 py-4 border border-[#1b1b1b] hover:bg-[#C17A3A] hover:border-[#C17A3A] transition-colors"
            >
              <span className="font-mono text-[0.65rem] tracking-[0.15em] uppercase">Ana Sayfa</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>

            <Link
              to="/kahveler"
              className="flex w-full sm:w-auto items-center justify-center gap-3 bg-transparent text-[#1b1b1b] px-10 py-4 border border-[#1b1b1b]/20 hover:border-[#1b1b1b] transition-colors"
            >
              <ShoppingBag className="h-4 w-4" />
              <span className="font-mono text-[0.65rem] tracking-[0.15em] uppercase">Tüm Seçki</span>
            </Link>

            <Link
              to="/hakkimizda"
              className="flex w-full sm:w-auto items-center justify-center gap-3 bg-transparent text-[#1b1b1b] px-10 py-4 border border-[#1b1b1b]/20 hover:border-[#1b1b1b] transition-colors"
            >
              <Home className="h-4 w-4" />
              <span className="font-mono text-[0.65rem] tracking-[0.15em] uppercase">Hakkımızda</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-[#1b1b1b] text-[#f7f0e7] py-16 px-6 md:px-10 text-center">
        <div className="max-w-2xl mx-auto flex flex-col items-center">
          <p className="font-sans font-light text-[0.95rem] leading-[1.85] text-[#f7f0e7]/60 mb-8">
            Kısayol: En çok ziyaret edilen sayfamız <span className="font-medium text-[#f7f0e7]">Tüm Seçki</span>. Nitelikli kahvelerimizi inceleyip doğru seçimi hızlıca yapabilirsiniz.
          </p>
          <Link
            to="/kahveler"
            className="font-mono text-[0.65rem] tracking-[0.15em] uppercase text-[#1b1b1b] bg-[#f7f0e7] border border-[#f7f0e7] px-10 py-4 transition-colors hover:bg-[#efe5d8]"
          >
            Seçkiyi Keşfet
          </Link>
        </div>
      </section>

    </main>
  );
};

export default NotFound;
