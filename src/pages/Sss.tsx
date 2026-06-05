import { useEffect, useRef, useState } from 'react';
import type { ComponentType } from 'react';
import { Link } from 'react-router-dom';
import {
  Coffee,
  Package,
  ShieldCheck,
  Truck,
  ChevronDown,
  ArrowRight,
} from 'lucide-react';

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

type FAQItem = {
  q: string;
  a: string;
  bullets?: string[];
  note?: string;
};

type FAQGroup = {
  title: string;
  icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  items: FAQItem[];
};

const FAQAccordion = ({ group }: { group: FAQGroup }) => {
  const reveal = useReveal(0.1);

  return (
    <div
      ref={reveal.ref}
      className={`border border-[#1b1b1b]/10 bg-[#fdfaf6] overflow-hidden transition-all duration-[800ms] ease-out ${reveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
    >
      <div className="flex items-center gap-4 px-6 md:px-8 py-6 border-b border-[#1b1b1b]/10 bg-[#f0e8dc]">
        <div className="flex h-10 w-10 items-center justify-center bg-[#fdfaf6] text-[#1b1b1b] border border-[#1b1b1b]/10">
          <group.icon className="h-5 w-5" strokeWidth={1.5} />
        </div>
        <h2 className="font-mono text-[0.65rem] tracking-[0.2em] uppercase text-[#1b1b1b]">{group.title}</h2>
      </div>

      <div className="divide-y divide-[#1b1b1b]/10">
        {group.items.map((item, idx) => (
          <details key={idx} className="group px-6 md:px-8 py-6 open:bg-[#fdfaf6] transition-colors">
            <summary className="flex cursor-pointer list-none items-start justify-between gap-6 outline-none">
              <span className="font-serif text-[1.1rem] text-[#1b1b1b] leading-snug">{item.q}</span>
              <ChevronDown className="h-5 w-5 text-[#C17A3A] transition-transform duration-300 group-open:rotate-180 shrink-0" />
            </summary>

            <div className="mt-5 space-y-4 font-sans font-light text-[0.95rem] leading-[1.85] text-[#5c4635]">
              <p>{item.a}</p>

              {item.bullets && item.bullets.length > 0 && (
                <ul className="space-y-2 pl-5 list-disc marker:text-[#c38152]">
                  {item.bullets.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              )}

              {item.note && (
                <div className="border-l-2 border-[#c38152] bg-[#f0e8dc] px-5 py-4 mt-4">
                  <p className="text-[0.85rem] text-[#5c4635]">
                    <span className="font-mono text-[0.55rem] font-bold text-[#C17A3A] uppercase tracking-widest mr-3">Not</span>
                    {item.note}
                  </p>
                </div>
              )}
            </div>
          </details>
        ))}
      </div>
    </div>
  );
};

const Sss = () => {
  const heroReveal = useReveal();
  const infoReveal = useReveal(0.2);

  const groups: FAQGroup[] = [
    {
      title: 'Kargo & Teslimat',
      icon: Truck,
      items: [
        {
          q: 'Siparişim ne zaman kargoya verilir?',
          a: 'Siparişler genellikle 1–3 iş günü içinde kargoya teslim edilmektedir.',
        },
      ],
    },
    {
      title: 'Ürünlerimiz',
      icon: Coffee,
      items: [
        {
          q: 'Kahveleriniz taze mi?',
          a: 'Evet. Tüm kahvelerimiz siparişe göre kavrulur ve tazeliğini koruyacak şekilde paketlenerek gönderilir.',
        },
        {
          q: 'Kahve çekirdekleri hangi ülkelerden geliyor?',
          a: 'Kahve çekirdeklerimiz Etiyopya, Kolombiya, Brezilya ve Guatemala gibi dünyanın önde gelen özel kahve üretici ülkelerinden temin edilmektedir.',
        },
        {
          q: 'Özel kahve nedir?',
          a: 'Özel kahve (Specialty Coffee), Q Grader sertifikalı uzmanlar tarafından 80 puan ve üzeri değerlendirilen yüksek kaliteli kahvelerdir.',
        },
      ],
    },
    {
      title: 'Kurumsal & Ödeme',
      icon: ShieldCheck,
      items: [
        {
          q: 'Toplu veya kurumsal satış yapıyor musunuz?',
          a: 'Evet. Kafeler, ofisler ve işletmeler için özel fiyatlandırma ve çözümler sunmaktayız.',
        },
        {
          q: 'Hangi ödeme yöntemlerini kullanabilirim?',
          a: 'Kredi kartı veya banka kartın ile ödemenizi güvenli bir şekilde yapabilirsiniz.',
        },
      ],
    },
  ];

  return (
    <main className="bg-[#f7f0e7] text-[#1b1b1b] min-h-screen font-sans selection:bg-[#1b1b1b] selection:text-[#f7f0e7] flex flex-col pt-[130px]">

      {/* HERO */}
      <section className="relative flex flex-col pt-20 pb-20 px-6 md:px-10 bg-[#f7f0e7] overflow-hidden border-b border-[#1b1b1b]/10">
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <svg className="w-full h-full" viewBox="0 0 1440 300" fill="none" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
            {[120, 360, 720, 1080, 1320].map((x) => (
              <line key={x} x1={x} y1="0" x2={x} y2="300" stroke="#1b1b1b" strokeWidth="0.4" strokeOpacity="0.06" />
            ))}
            <line x1="0" y1="150" x2="1440" y2="150" stroke="#1b1b1b" strokeWidth="0.4" strokeOpacity="0.06" />
          </svg>
        </div>

        <div
          ref={heroReveal.ref}
          className={`relative z-10 max-w-[1440px] mx-auto w-full text-center transition-all duration-[1000ms] ease-out ${heroReveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}
        >
          <div className="font-mono text-[0.58rem] tracking-[0.35em] uppercase text-[#C17A3A] mb-6 flex items-center justify-center gap-2 before:content-[''] before:block before:w-5 before:h-[1px] before:bg-[#C17A3A] after:content-[''] after:block after:w-5 after:h-[1px] after:bg-[#C17A3A]">
            Destek Merkezi
          </div>
          <h1 className="font-serif text-[clamp(2.5rem,6vw,5rem)] text-[#1b1b1b] leading-[1.05] tracking-[-0.02em] max-w-3xl mx-auto mb-6">
            Sıkça Sorulan <em className="italic text-[#C17A3A]">Sorular</em>
          </h1>
          <p className="font-sans font-light text-[1rem] leading-[1.85] text-[#5c4635] max-w-2xl mx-auto">
            Çekirdeklerimiz, kavurma felsefemiz, kargo süreçleri ve abonelik sistemiyle ilgili en çok merak edilenleri burada derledik.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              to="/kahveler"
              className="group flex w-full sm:w-auto items-center justify-center gap-3 bg-[#1b1b1b] text-[#f7f0e7] px-10 py-4 border border-[#1b1b1b] hover:bg-[#C17A3A] hover:border-[#C17A3A] transition-colors"
            >
              <span className="font-mono text-[0.65rem] tracking-[0.15em] uppercase">Seçkiyi Keşfet</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to="/iletisim"
              className="flex w-full sm:w-auto items-center justify-center gap-3 bg-transparent text-[#1b1b1b] px-10 py-4 border border-[#1b1b1b]/20 hover:border-[#1b1b1b] transition-colors"
            >
              <span className="font-mono text-[0.65rem] tracking-[0.15em] uppercase">Bize Ulaşın</span>
            </Link>
          </div>
        </div>
      </section>

      {/* SSS İÇERİK */}
      <section className="px-6 py-20 bg-[#f7f0e7]">
        <div className="mx-auto max-w-[900px]">

          <div
            ref={infoReveal.ref}
            className={`mb-12 border border-[#1b1b1b]/10 bg-[#efe5d8] p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6 transition-all duration-[1000ms] ease-out ${infoReveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          >
            <div className="flex h-12 w-12 items-center justify-center bg-[#fdfaf6] border border-[#1b1b1b]/10 shrink-0">
              <Package className="h-5 w-5 text-[#c38152]" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="font-serif text-[1.4rem] text-[#1b1b1b] mb-2">Tazelik Notu</h3>
              <p className="font-sans font-light text-[0.95rem] text-[#5c4635] leading-relaxed">
                Kavrulmuş kahve bir meyve çekirdeğidir ve canlıdır. En iyi fincan deneyimi için paketinizi teslim aldıktan sonra valfinden hafifçe koklayarak degassing sürecini tamamlamasını beklemenizi tavsiye ederiz.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-8">
            {groups.map((g, i) => (
              <FAQAccordion key={i} group={g} />
            ))}
          </div>

        </div>
      </section>

      {/* KAPANIŞ */}
      <section className="bg-[#1b1b1b] text-[#f7f0e7] py-24 px-6 md:px-10 text-center">
        <div className="max-w-2xl mx-auto flex flex-col items-center">
          <h3 className="font-serif text-[2rem] md:text-[2.5rem] leading-[1.2] text-[#f7f0e7] mb-4">
            Aradığınızı <em className="italic text-[#c38152]">bulamadınız mı?</em>
          </h3>
          <p className="font-sans font-light text-[1rem] leading-[1.85] text-[#f7f0e7]/60 mb-10">
            Size yardımcı olmaktan mutluluk duyarız. Sorunuzu mail veya iletişim formu aracılığıyla iletin, atölye ekibimiz en kısa sürede dönüş yapsın.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
            <Link
              to="/iletisim"
              className="flex w-full sm:w-auto items-center justify-center gap-3 bg-[#f7f0e7] text-[#1b1b1b] px-10 py-4 border border-[#f7f0e7] transition-colors hover:bg-[#efe5d8]"
            >
              <span className="font-mono text-[0.65rem] tracking-[0.15em] uppercase">İletişim Formu</span>
            </Link>
            <a
              href="mailto:hq@editionroastery.com"
              className="flex w-full sm:w-auto items-center justify-center gap-3 bg-transparent text-[#f7f0e7] px-10 py-4 border border-[#f7f0e7]/20 transition-colors hover:border-[#f7f0e7]"
            >
              <span className="font-mono text-[0.65rem] tracking-[0.15em] uppercase">Mail Gönder</span>
            </a>
          </div>
        </div>
      </section>

    </main>
  );
};

export default Sss;
