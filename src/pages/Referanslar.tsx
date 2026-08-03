import { useEffect, useRef, useState } from "react";
import { Building2 } from "lucide-react";

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

const REFERANSLAR = [
  { name: "Total Energies İstasyonları", logo: "/referanslar/total.webp" },
  { name: "Newcastle Pub with Restaurant Zincirleri", logo: "/referanslar/newcastle.webp" },
  { name: "T.C. Aile ve Sosyal Hizmetler Bakanlığı", logo: "/referanslar/aile.webp" },
  { name: "Devlet Su İşleri", logo: "/referanslar/dsi.webp" },
  { name: "Makine ve Kimya Endüstrisi", logo: "/referanslar/mke.webp" },
  { name: "ODTÜ Kantinleri", logo: "/referanslar/odtü.webp" },
  { name: "Barrelworks", logo: null },
];

export default function Referanslar() {
  const heroReveal = useReveal();
  const gridReveal = useReveal();

  return (
    <div className="bg-[#f7f0e7] text-[#1b1b1b] min-h-screen font-sans selection:bg-[#1b1b1b] selection:text-[#f7f0e7]">

      {/* 1. HERO */}
      <section className="relative border-b border-[#1b1b1b]/10 bg-[#1b1b1b] text-[#f7f0e7] px-6 pb-20 pt-48 md:px-10 md:pb-28 overflow-hidden">
        <div
          ref={heroReveal.ref}
          className={`relative z-10 mx-auto max-w-[1440px] transition-all duration-1000 ${heroReveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
        >
          <p className="mb-6 font-mono text-[0.58rem] uppercase tracking-[0.35em] text-[#f7f0e7]/60">
            Referanslarımız
          </p>
          <h1 className="font-serif text-[clamp(2.4rem,6vw,5.5rem)] leading-[1.05] tracking-[-0.02em] max-w-4xl">
            Bize güvenen{" "}
            <em className="italic text-[#c38152]">işletmeler ve</em>{" "}
            iş ortaklarımız.
          </h1>
        </div>
      </section>

      {/* 2. AÇIKLAMA */}
      <section className="border-b border-[#1b1b1b]/10">
        <div className="mx-auto max-w-[1440px] px-6 py-16 md:px-10 md:py-24">
          <p className="max-w-2xl font-sans font-light text-[1rem] leading-[1.85] text-[#1b1b1b]/70">
            Ankara merkezli atölyemizden yola çıkarak Türkiye genelinde otel, ofis, kafe ve
            işletmelere taze kavrulmuş kahve tedarik ediyoruz. Kurumsal iş ortaklarımızla
            uzun soluklu ve güvene dayalı ilişkiler kuruyoruz.
          </p>
        </div>
      </section>

      {/* 3. REFERANS GRID */}
      <section className="bg-[#efe5d8]">
        <div
          ref={gridReveal.ref}
          className={`mx-auto max-w-[1440px] transition-all duration-1000 ${gridReveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {REFERANSLAR.map((item, i) => (
              <div
                key={i}
                className="flex flex-col items-center justify-center gap-6 border-b border-r border-[#1b1b1b]/10 p-12 text-center [&:nth-child(3n)]:border-r-0 group hover:bg-[#f7f0e7] transition-colors duration-300"
              >
                <div className="flex h-32 w-full max-w-[260px] shrink-0 items-center justify-center bg-[#f7f0e7] border border-[#1b1b1b]/10">
                  {item.logo ? (
                    <img src={item.logo} alt={item.name} className="max-h-24 max-w-[85%] object-contain" />
                  ) : (
                    <Building2 className="w-6 h-6 text-[#1b1b1b]/30" strokeWidth={1.3} />
                  )}
                </div>
                <h4 className="font-serif text-[1.15rem] leading-tight text-[#1b1b1b]">{item.name}</h4>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. CTA */}
      <section className="border-t border-[#1b1b1b]/10 bg-[#1b1b1b] py-24 px-6 md:px-10 text-center text-[#f7f0e7]">
        <div className="mx-auto max-w-3xl flex flex-col items-center">
          <div className="mb-8 h-16 w-[1px] bg-[#f7f0e7]/20" />
          <p className="mb-6 font-mono text-[0.58rem] uppercase tracking-[0.32em] text-[#c38152]">İş Birliği</p>
          <h3 className="font-serif text-[clamp(1.6rem,3vw,2.8rem)] leading-[1.3] mb-10">
            İşletmeniz için özel kahve tedariği hakkında bizimle iletişime geçin.
          </h3>
          <a
            href="/iletisim"
            className="font-mono text-[0.62rem] tracking-[0.2em] uppercase text-[#1b1b1b] bg-[#f7f0e7] border border-[#f7f0e7] px-8 py-4 transition-colors hover:bg-transparent hover:text-[#f7f0e7]"
          >
            İletişime Geç
          </a>
        </div>
      </section>

    </div>
  );
}
