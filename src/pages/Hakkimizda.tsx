import { useEffect, useRef, useState } from "react";
import { MapPin, Flame, Globe, Award, Coffee } from "lucide-react";

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

const storyImage = "https://images.unsplash.com/photo-1587734195503-904fca47e0e9?q=80&w=1600&auto=format&fit=crop";

export default function Hakkimizda() {
  const heroReveal   = useReveal();
  const storyReveal  = useReveal();
  const valuesReveal = useReveal();
  const missionReveal = useReveal();

  return (
    <div className="bg-[#f7f0e7] text-[#1b1b1b] min-h-screen font-sans selection:bg-[#1b1b1b] selection:text-[#f7f0e7]">

      {/* 1. HERO */}
      <section className="relative border-b border-[#1b1b1b]/10 bg-[#1b1b1b] text-[#f7f0e7] px-6 pb-20 pt-48 md:px-10 md:pb-28 overflow-hidden">
        <img
          src={storyImage}
          alt="Edition Coffee Atölyesi"
          className="absolute inset-0 h-full w-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1b1b1b]/90 via-[#1b1b1b]/40 to-transparent" />

        <div
          ref={heroReveal.ref}
          className={`relative z-10 mx-auto max-w-[1440px] transition-all duration-1000 ${heroReveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
        >
          <p className="mb-6 font-mono text-[0.58rem] uppercase tracking-[0.35em] text-[#f7f0e7]/60">
            Hikayemiz
          </p>
          <h1 className="font-serif text-[clamp(2.4rem,6vw,5.5rem)] leading-[1.05] tracking-[-0.02em] max-w-4xl">
            Kahve yalnızca bir içecek değil,{" "}
            <em className="italic text-[#c38152]">emek ve tutkunun</em>{" "}
            birleştiği bir deneyimdir.
          </h1>
        </div>
      </section>

      {/* 2. HİKAYE */}
      <section className="border-b border-[#1b1b1b]/10">
        <div className="mx-auto max-w-[1440px] flex flex-col lg:flex-row">
          <div
            ref={storyReveal.ref}
            className={`flex-1 p-8 md:p-16 lg:p-24 flex flex-col justify-center transition-all duration-1000 delay-200 ${storyReveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
          >
            <p className="mb-5 font-mono text-[0.58rem] uppercase tracking-[0.32em] text-[#c38152]">
              Biz Kimiz
            </p>
            <h2 className="font-serif text-[clamp(1.8rem,3vw,3rem)] leading-[1.1] tracking-[-0.02em] mb-8">
              Edition Coffee Roastery<br />
            </h2>
            <div className="space-y-5 font-sans font-light text-[1rem] leading-[1.85] text-[#1b1b1b]/70">
              <p>
                Edition Coffee, iyi kahveyi herkes için erişilebilir ve tutarlı kılmayı hedefleyen Ankara merkezli bir özel kahve markasıdır.
              </p>
              <p>
                Dünyanın seçkin bölgelerinden özenle seçilen kahveleri, her çekirdeğin kendi doğasındaki potansiyeli ve karakterini en iyi şekilde ortaya çıkaracak şekilde ustalıkla kavuruyoruz. Bizim için kavurma süreci, çekirdeğin tarladaki hikayesini fincanınıza en doğru şekilde aktarma sanatıdır.
              </p>
              <p>
                Siparişiniz geldikten sonra çekirdekler atölyemizde taze olarak kavrulur, seçtiğiniz öğütme yöntemine göre işlenir ve valfli özel ambalajlarında kapınıza ulaştırılır.
              </p>
            </div>

            <div className="mt-12 flex items-center gap-4 border-t border-[#1b1b1b]/10 pt-8">
              <div className="w-12 h-12 border border-[#1b1b1b]/15 bg-[#efe5d8] flex items-center justify-center shrink-0">
                <MapPin className="w-5 h-5 text-[#1b1b1b]" />
              </div>
              <div>
                <div className="font-mono text-[0.58rem] tracking-[0.2em] uppercase text-[#7b6a5c]">Merkez / Atölye</div>
                <div className="font-serif text-[1.1rem] text-[#1b1b1b]">Ankara, Türkiye</div>
              </div>
            </div>
          </div>

          <div className="flex-1 relative min-h-[380px] lg:min-h-[600px] overflow-hidden border-t lg:border-t-0 lg:border-l border-[#1b1b1b]/10 group">
            <img
              src={storyImage}
              alt="Edition Coffee Kavurma"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-[8s] group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-[#1b1b1b]/10" />
          </div>
        </div>
      </section>

      {/* 3. DEĞERLERİMİZ */}
      <section className="border-b border-[#1b1b1b]/10 bg-[#efe5d8]">
        <div
          ref={valuesReveal.ref}
          className={`mx-auto max-w-[1440px] transition-all duration-1000 ${valuesReveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
        >
          <div className="border-b border-[#1b1b1b]/10 p-8 md:p-16 lg:px-24">
            <p className="mb-4 font-mono text-[0.58rem] uppercase tracking-[0.32em] text-[#c38152]">Farkımız</p>
            <h3 className="font-serif text-[clamp(1.8rem,3vw,3rem)] leading-[1.05] tracking-[-0.02em] text-[#1b1b1b]">
              Kahvemiz <em className="italic text-[#1b1b1b]/50">Neden Özel?</em>
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: <Globe className="w-5 h-5" strokeWidth={1.5} />,
                label: "Kaynağından Gelen Fark",
                title: "%100 Arabica",
                text: "Dünya çapında en seçkin kahve bölgelerinden seçilen %100 Arabica çekirdeklerimizle benzersiz bir lezzet sunuyoruz.",
              },
              {
                icon: <Flame className="w-5 h-5" strokeWidth={1.5} />,
                label: "Atölyemizden",
                title: "Siparişe Özel Kavrulmuş",
                text: "Her çekirdeğin potansiyelini ortaya çıkarmak için bölgesine özel kavurma profilleri geliştiriyoruz. Her sipariş taze kavrulur.",
              },
              {
                icon: <Award className="w-5 h-5" strokeWidth={1.5} />,
                label: "Tescillenmiş Kalite",
                title: "80+ Q-Grader Puanı",
                text: "Q Grader sertifikalı profesyonel kahve tadımcıları tarafından 80 puan üzerinde değerlendirilen en seçkin kahveleri kullanıyoruz.",
              },
              {
                icon: <Coffee className="w-5 h-5" strokeWidth={1.5} />,
                label: "İmza Lezzet",
                title: "Özel Harmanlar",
                text: "Seçkin çekirdekleri ustalıkla bir araya getirerek kendine özgü karaktere sahip özel karışımlar geliştiriyoruz.",
              },
            ].map((item, i) => (
              <div
                key={i}
                className="flex flex-col p-8 md:p-12 border-b lg:border-b-0 lg:border-r border-[#1b1b1b]/10 last:border-r-0 group hover:bg-[#f7f0e7] transition-colors duration-300"
              >
                <div className="mb-8 flex h-12 w-12 shrink-0 items-center justify-center bg-[#1b1b1b] text-[#f7f0e7] transition-transform duration-500 group-hover:-translate-y-1">
                  {item.icon}
                </div>
                <div className="mb-3 font-mono text-[0.58rem] uppercase tracking-[0.2em] text-[#7b6a5c]">{item.label}</div>
                <h4 className="mb-4 font-serif text-[1.3rem] leading-tight text-[#1b1b1b]">{item.title}</h4>
                <p className="font-sans font-light text-[0.9rem] leading-relaxed text-[#1b1b1b]/70">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. MİSYON */}
      <section className="border-b border-[#1b1b1b]/10 bg-[#1b1b1b] py-24 px-6 md:px-10 text-center text-[#f7f0e7]">
        <div
          ref={missionReveal.ref}
          className={`mx-auto max-w-3xl flex flex-col items-center transition-all duration-1000 ${missionReveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
        >
          <div className="mb-8 h-16 w-[1px] bg-[#f7f0e7]/20" />
          <p className="mb-6 font-mono text-[0.58rem] uppercase tracking-[0.32em] text-[#c38152]">Misyonumuz</p>
          <h3 className="font-serif text-[clamp(1.6rem,3vw,2.8rem)] leading-[1.3] mb-10">
            Ankara'daki kavurma atölyemizde siparişe göre taze kavurur, özenle paketleyerek doğrudan size ulaştırırız.
          </h3>
          <div className="font-mono text-[0.62rem] tracking-[0.2em] uppercase text-[#f7f0e7]/50 border border-[#f7f0e7]/15 px-8 py-3">
            Taze Kavrulmuş · Siparişe Özel · Tüm Türkiye'ye
          </div>
        </div>
      </section>

    </div>
  );
}
