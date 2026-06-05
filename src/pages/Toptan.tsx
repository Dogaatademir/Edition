import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Coffee, Truck, Sliders, Users } from "lucide-react";

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

const SERVICES = [
  {
    icon: <Sliders className="w-5 h-5" strokeWidth={1.5} />,
    label: "Kişiselleştirme",
    title: "Size Özel Profilleme",
    text: "İşletmenizin karakterine ve beklentilerine uygun aroma, gövde, asidite ve kavurma derecesi gibi özellikleri dikkate alarak size tamamen özel bir kahve menüsü yaratıyoruz.",
  },
  {
    icon: <Coffee className="w-5 h-5" strokeWidth={1.5} />,
    label: "Ürün Çeşitliliği",
    title: "Geniş Çekirdek Seçkisi",
    text: "Single origin yöresel kahvelerden imza espresso harmanlarına kadar, Q-Grader onaylı, nitelikli ve sürdürülebilir bir kahve tedariği sağlıyoruz.",
  },
  {
    icon: <Truck className="w-5 h-5" strokeWidth={1.5} />,
    label: "Tazelik & Operasyon",
    title: "Etkili Lojistik",
    text: "Stok beklemiş kahveler değil, siparişinize özel kavrulmuş çekirdekler gönderiyoruz. Ürünlerimizi aromalarını maksimum seviyede koruyacak şekilde paketliyor ve zamanında ulaştırıyoruz.",
  },
  {
    icon: <Users className="w-5 h-5" strokeWidth={1.5} />,
    label: "Destek & Eğitim",
    title: "Eğitim Danışmanlığı",
    text: "Sadece kahve çekirdeği sağlamakla kalmıyor; doğru ekipman seçimi, reçete oluşturma ve barista eğitimi konularında da işletmenize profesyonel danışmanlık veriyoruz.",
  },
];



export default function Toptan() {
  const heroReveal    = useReveal();
  const introReveal   = useReveal();
  const servicesReveal = useReveal();
  const ctaReveal     = useReveal();

  return (
    <div className="bg-[#f7f0e7] text-[#1b1b1b] min-h-screen font-sans selection:bg-[#1b1b1b] selection:text-[#f7f0e7]">

      {/* 1. HERO */}
      <section className="relative border-b border-[#1b1b1b]/10 bg-[#1b1b1b] text-[#f7f0e7] overflow-hidden px-6 pb-24 pt-48 md:px-10">
        <img
          src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=2000&auto=format&fit=crop"
          alt="Toptan Kahve"
          className="absolute inset-0 h-full w-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1b1b1b]/95 via-[#1b1b1b]/50 to-transparent" />

        <div
          ref={heroReveal.ref}
          className={`relative z-10 mx-auto max-w-[1440px] transition-all duration-1000 ${heroReveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
        >
          <p className="mb-6 font-mono text-[0.58rem] uppercase tracking-[0.35em] text-[#c38152]">Kurumsal Çözümler</p>
          <h1 className="font-serif text-[clamp(2.4rem,6vw,5.5rem)] leading-[1.05] tracking-[-0.02em] max-w-4xl mb-10">
            İşletmenize özel{" "}
            <em className="italic text-[#c38152]">kahve deneyimleri.</em>
          </h1>
          <div className="flex items-center gap-3">
            <div className="h-[1px] w-12 bg-[#f7f0e7]/30" />
            <span className="font-mono text-[0.58rem] uppercase tracking-[0.2em] text-[#f7f0e7]/40">Ankara · Türkiye</span>
          </div>
        </div>
      </section>

     

      {/* 3. GİRİŞ VE VİZYON */}
      <section className="border-b border-[#1b1b1b]/10">
        <div className="mx-auto max-w-[1440px] flex flex-col lg:flex-row">
          <div
            ref={introReveal.ref}
            className={`flex-1 p-8 md:p-16 lg:p-24 flex flex-col justify-center transition-all duration-1000 delay-100 ${introReveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
          >
            <p className="mb-5 font-mono text-[0.58rem] uppercase tracking-[0.32em] text-[#c38152]">Neden Edition Coffee?</p>
            <h2 className="font-serif text-[clamp(1.8rem,3vw,3rem)] leading-[1.1] tracking-[-0.02em] mb-8">
              Sadece Tedarikçi Değil,<br />Çözüm Ortağınız
            </h2>
            <div className="space-y-5 font-sans font-light text-[1rem] leading-[1.85] text-[#1b1b1b]/70">
              <p>
                Toptan satışlarımızda, sunduğumuz geniş kahve yelpazesi ve yüksek kalite standartlarımızla öne çıkıyoruz. Uzun yıllara dayanan kavurma tecrübemizle, butik kafelerden kurumsal ofislere kadar her türlü işletmenin ihtiyacına uygun, nitelikli kahve çözümleri üretiyoruz.
              </p>
              <p>
                Hangi demleme yöntemini veya kahve türünü tercih ederseniz edin; misafirlerinize her zaman aynı kalitede, taze ve akılda kalıcı bir kahve deneyimi sunmanız için arkaplanınızdaki güç olmaya hazırız.
              </p>
            </div>

            <div className="mt-12 pt-8 border-t border-[#1b1b1b]/10 flex flex-col sm:flex-row gap-4">
              <Link
                to="/iletisim"
                className="group inline-flex items-center gap-3 border border-[#1b1b1b] bg-[#1b1b1b] px-8 py-4 font-mono text-[0.62rem] uppercase tracking-[0.18em] text-[#f7f0e7] transition-all hover:bg-transparent hover:text-[#1b1b1b]"
              >
                Teklif Alın <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Link>
            
            </div>
          </div>

          <div className="flex-1 relative min-h-[380px] lg:min-h-[600px] overflow-hidden border-t lg:border-t-0 lg:border-l border-[#1b1b1b]/10 group">
            <img
              src="https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=2000&auto=format&fit=crop"
              alt="Toptan Kahve"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-[8s] group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-[#1b1b1b]/10" />
          </div>
        </div>
      </section>

      {/* 4. HİZMETLER */}
      <section className="border-b border-[#1b1b1b]/10 bg-[#efe5d8]">
        <div
          ref={servicesReveal.ref}
          className={`mx-auto max-w-[1440px] transition-all duration-1000 ${servicesReveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
        >
          <div className="border-b border-[#1b1b1b]/10 p-8 md:p-16 lg:px-24">
            <p className="mb-4 font-mono text-[0.58rem] uppercase tracking-[0.32em] text-[#c38152]">Hizmetlerimiz</p>
            <h3 className="font-serif text-[clamp(1.8rem,3vw,3rem)] leading-[1.05] tracking-[-0.02em]">
              Neden <em className="italic text-[#1b1b1b]/40">Edition Coffee?</em>
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
            {SERVICES.map((item, i) => (
              <div
                key={i}
                className="flex flex-col p-8 md:p-12 border-b lg:border-b-0 lg:border-r border-[#1b1b1b]/10 last:border-r-0 group hover:bg-[#f7f0e7] transition-colors duration-300"
              >
                <div className="mb-8 flex h-12 w-12 shrink-0 items-center justify-center bg-[#1b1b1b] text-[#f7f0e7] transition-transform duration-500 group-hover:-translate-y-1">
                  {item.icon}
                </div>
                <div className="mb-3 font-mono text-[0.58rem] uppercase tracking-[0.2em] text-[#7b6a5c]">{item.label}</div>
                <h4 className="mb-4 font-serif text-[1.3rem] leading-tight text-[#1b1b1b]">{item.title}</h4>
                <p className="font-sans font-light text-[0.9rem] leading-relaxed text-[#1b1b1b]/65">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. CTA */}
      <section className="border-b border-[#1b1b1b]/10 bg-[#1b1b1b] py-28 px-6 md:px-10 text-[#f7f0e7]">
        <div
          ref={ctaReveal.ref}
          className={`mx-auto max-w-[1440px] flex flex-col lg:flex-row items-center justify-between gap-12 transition-all duration-1000 ${ctaReveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
        >
          <div className="flex-1">
            <p className="mb-5 font-mono text-[0.58rem] uppercase tracking-[0.32em] text-[#c38152]">Hadi Başlayalım</p>
            <h3 className="font-serif text-[clamp(1.8rem,3.5vw,3.5rem)] leading-[1.15] tracking-[-0.02em] mb-6">
              İşletmeniz için doğru kahveyi<br className="hidden lg:block" />{" "}
              <em className="italic text-[#f7f0e7]/50">birlikte seçelim.</em>
            </h3>
            <p className="font-sans font-light text-[1rem] text-[#f7f0e7]/50 max-w-xl leading-relaxed">
              Menünüzü tasarlamak, tadım talebinde bulunmak ve toptan fiyatlandırma politikalarımız hakkında detaylı bilgi almak için bizimle iletişime geçin.
            </p>
          </div>

          <div className="flex-shrink-0 flex flex-col sm:flex-row gap-4">
            <Link
              to="/iletisim"
              className="group flex items-center justify-center gap-3 border border-[#f7f0e7]/30 px-10 py-5 font-mono text-[0.65rem] uppercase tracking-[0.2em] text-[#f7f0e7] transition-all hover:bg-[#f7f0e7] hover:text-[#1b1b1b] hover:border-[#f7f0e7]"
            >
              İletişime Geçin <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
