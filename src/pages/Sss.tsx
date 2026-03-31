import { useEffect, useRef, useState } from 'react';
import type { ComponentType } from 'react';
import { Link } from 'react-router-dom';
import {
  Coffee,
  Package,
  ShieldCheck,
  Truck,
  RefreshCw,
  Infinity,
  ChevronDown,
  ArrowRight,
  ThermometerSun
} from 'lucide-react';

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

// --- TİPLER ---
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

// --- BİLEŞENLER ---
const FAQAccordion = ({ group }: { group: FAQGroup }) => {
  const reveal = useReveal(0.1);

  return (
    <div 
      ref={reveal.ref}
      className={`border border-[#E5E5E5] bg-[#FFFFFF] overflow-hidden transition-all duration-[800ms] ease-out ${reveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
    >
      <div className="flex items-center gap-4 px-6 md:px-8 py-6 border-b border-[#E5E5E5] bg-[#FAFAFA]">
        <div className="flex h-10 w-10 items-center justify-center bg-[#FFFFFF] text-[#000000] border border-[#E5E5E5]">
          <group.icon className="h-5 w-5" strokeWidth={1.5} />
        </div>
        <h2 className="font-mono text-[0.65rem] tracking-[0.2em] uppercase text-[#000000]">{group.title}</h2>
      </div>

      <div className="divide-y divide-[#E5E5E5]">
        {group.items.map((item, idx) => (
          <details key={idx} className="group px-6 md:px-8 py-6 open:bg-[#FFFFFF] transition-colors">
            <summary className="flex cursor-pointer list-none items-start justify-between gap-6 outline-none">
              <span className="font-serif text-[1.1rem] text-[#000000] leading-snug">{item.q}</span>
              <ChevronDown className="h-5 w-5 text-[#888888] transition-transform duration-300 group-open:rotate-180 shrink-0" />
            </summary>

            <div className="mt-5 space-y-4 font-sans font-light text-[0.95rem] leading-[1.85] text-[#555555]">
              <p>{item.a}</p>

              {item.bullets && item.bullets.length > 0 && (
                <ul className="space-y-2 pl-5 list-disc marker:text-[#888888]">
                  {item.bullets.map((b, i) => (
                    <li key={i}>{b}</li>
                  ))}
                </ul>
              )}

              {item.note && (
                <div className="border border-[#E5E5E5] bg-[#FAFAFA] px-5 py-4 mt-4">
                  <p className="text-[0.85rem] text-[#555555]">
                    <span className="font-mono text-[0.55rem] font-bold text-[#000000] uppercase tracking-widest mr-3">Not</span>
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
      title: 'Çekirdek & Kavurma',
      icon: Coffee,
      items: [
        {
          q: 'Nitelikli (Specialty) kahve nedir?',
          a: 'Nitelikli kahve, SCA (Specialty Coffee Association) standartlarına göre 80 ve üzeri puan alan, izlenebilir ve özenle yetiştirilmiş kahve çekirdekleridir. Edition Coffee olarak atölyemizde yalnızca bu standartlardaki %100 Arabica çekirdeklerini kullanıyoruz.',
        },
        {
          q: 'Kahveleriniz nerede ve nasıl kavruluyor?',
          a: 'Tüm kahvelerimiz Ankara\'daki atölyemizde sipariş üzerine taze olarak kavrulmaktadır. Her çekirdeğin kendi yöresel karakterini ve potansiyelini en iyi yansıtacak özel kavurma profilleri uyguluyoruz.',
        },
        {
          q: 'Degassing (Gaz Salınımı) süreci nedir?',
          a: 'Kahve kavrulduktan sonra içinde biriken karbondioksiti dışarı atar. Bu sürece degassing denir. Kahvenizin tam aromasına ulaşması için kavrum tarihinden itibaren çekirdeğine göre 7 ila 14 gün dinlenmesini öneriyoruz.',
        },
      ],
    },
    {
      title: 'Saklama & Öğütme',
      icon: ThermometerSun,
      items: [
        {
          q: 'Kahvemi nasıl saklamalıyım?',
          a: 'Kahvenizi direkt güneş ışığından, ısıdan ve nemden uzak, serin ve karanlık bir dolapta saklamalısınız. Gönderdiğimiz içi alüminyum ve valfli ambalajlarda ağzı sıkıca kapalı tutmanız tazeliği korumak için en idealidir.',
          note: 'Kahveyi buzdolabına veya dondurucuya koymaktan kaçının; ani ısı değişimleri ve nem kahvenin yapısını bozar.',
        },
        {
          q: 'Hangi öğütme derecesini seçmeliyim?',
          a: 'Demleme yapacağınız ekipmana uygun bir öğütme derecesi seçmeniz kahvenizin lezzeti için kritiktir:',
          bullets: [
            'French Press: Kalın (Coarse)',
            'Filtre Kahve Makinesi & Chemex: Orta-Kalın (Medium-Coarse)',
            'V60: Orta (Medium)',
            'Moka Pot & Aeropress: İnce (Fine)',
            'Espresso: Çok İnce (Extra Fine)',
            'Türk Kahvesi: Pudra Kıvamında (Super Fine)'
          ]
        },
      ],
    },
    {
      title: 'Kargo & Teslimat',
      icon: Truck,
      items: [
        {
          q: 'Siparişim ne zaman kargoya verilir?',
          a: 'Siparişleriniz atölyemizin kavurma planına göre taze taze hazırlanır ve en geç 1-3 iş günü içerisinde kargoya teslim edilir. Hafta sonu verilen siparişler Pazartesi günü işleme alınır.',
        },
        {
          q: 'Kargo ücreti ne kadar?',
          a: 'Tüm siparişlerde 750 TL ve üzeri kargo ücretsizdir. Bu tutarın altındaki siparişlerinizde kargo bedeli ödeme ekranında sepetinize yansıtılmaktadır.',
        },
      ],
    },
    {
      title: 'Abonelik Sistemi',
      icon: Infinity,
      items: [
        {
          q: 'Kahve aboneliği nasıl çalışır?',
          a: 'Tüketim alışkanlığınıza uygun profili (Filtre veya Espresso) ve gramajı seçersiniz. Atölyemiz her ay sizin için seçtiği en taze çekirdekleri otomatik olarak adresinize gönderir.',
        },
        {
          q: 'Abonelikte taahhüt var mı? İptal edebilir miyim?',
          a: 'Hayır, aboneliklerimizde hiçbir bağlayıcı taahhüt bulunmaz. Kullanıcı paneliniz üzerinden aboneliğinizi dilediğiniz an tek tıkla duraklatabilir veya tamamen iptal edebilirsiniz.',
          note: 'Abonelik paketlerinde her siparişte kargo ücretsizdir ve normal fiyatlara göre %10 indirim uygulanır.'
        },
      ],
    },
    {
      title: 'İade & Değişim',
      icon: RefreshCw,
      items: [
        {
          q: 'Kahveleri iade edebilir veya değiştirebilir miyim?',
          a: 'Kahve, tazelik hassasiyeti olan bir gıda ürünü olduğu için, ambalajı açılmış veya öğütülmüş kahvelerde iade ve değişim yapılamamaktadır. Ürünlerin lezzet profillerine dair sorularınızı sipariş öncesi bize iletebilirsiniz.',
        },
        {
          q: 'Kargom hasarlı geldi, ne yapmalıyım?',
          a: 'Teslimat sırasında pakette gözle görülür bir hasar varsa kargo görevlisine tutanak tutturarak paketi teslim almayınız. Ardından bizimle iletişime geçmeniz halinde yeni siparişiniz hemen hazırlanıp kargolanacaktır.',
        },
      ],
    },
    {
      title: 'Güven & Kurumsal',
      icon: ShieldCheck,
      items: [
        {
          q: 'Kafem / Ofisim için toptan kahve alabilir miyim?',
          a: 'Elbette. İşletmelere özel profil oluşturma, bar operasyonu danışmanlığı ve taze tedarik süreçleri için Toptan Satış sayfamızdan form doldurarak bizimle iletişime geçebilirsiniz.',
        },
        {
          q: 'Kişisel verilerim nasıl korunuyor?',
          a: 'Kişisel verileriniz üst düzey güvenlik önlemleriyle saklanır ve yalnızca sipariş operasyonunuzu tamamlamak amacıyla kullanılır. Ayrıntılar için KVKK Aydınlatma Metni sayfamızı inceleyebilirsiniz.',
        },
      ],
    },
  ];

  return (
    <main className="bg-[#FFFFFF] text-[#000000] min-h-screen font-sans selection:bg-[#000000] selection:text-[#FFFFFF] flex flex-col pt-[130px]">
      
      {/* --- HERO BÖLÜMÜ --- */}
      <section className="relative flex flex-col pt-20 pb-20 px-6 md:px-10 bg-[#FFFFFF] overflow-hidden border-b border-[#E5E5E5]">
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
            Destek Merkezi
          </div>
          <h1 className="font-serif text-[clamp(2.5rem,6vw,5rem)] text-[#000000] leading-[1.05] tracking-[-0.02em] max-w-3xl mx-auto mb-6">
            Sıkça Sorulan <em className="italic text-[#555555]">Sorular</em>
          </h1>
          <p className="font-sans font-light text-[1rem] leading-[1.85] text-[#555555] max-w-2xl mx-auto">
            Çekirdeklerimiz, kavurma felsefemiz, kargo süreçleri ve abonelik sistemiyle ilgili en çok merak edilenleri burada derledik.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              to="/kahveler"
              className="group flex w-full sm:w-auto items-center justify-center gap-3 bg-[#000000] text-[#FFFFFF] px-10 py-4 border border-[#000000] hover:bg-[#555555] hover:border-[#555555] transition-colors"
            >
              <span className="font-mono text-[0.65rem] tracking-[0.15em] uppercase">Seçkiyi Keşfet</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to="/iletisim"
              className="flex w-full sm:w-auto items-center justify-center gap-3 bg-[#FFFFFF] text-[#000000] px-10 py-4 border border-[#E5E5E5] hover:border-[#000000] transition-colors"
            >
              <span className="font-mono text-[0.65rem] tracking-[0.15em] uppercase">Bize Ulaşın</span>
            </Link>
          </div>
        </div>
      </section>

      {/* --- SSS İÇERİK BÖLÜMÜ --- */}
      <section className="px-6 py-20 bg-[#FFFFFF]">
        <div className="mx-auto max-w-[900px]">
          
          {/* Tazelik İpucu Kutusu */}
          <div 
            ref={infoReveal.ref}
            className={`mb-12 border border-[#E5E5E5] bg-[#FAFAFA] p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6 transition-all duration-[1000ms] ease-out ${infoReveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          >
            <div className="flex h-12 w-12 items-center justify-center bg-[#FFFFFF] border border-[#E5E5E5] shrink-0">
              <Package className="h-5 w-5 text-[#000000]" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="font-serif text-[1.4rem] text-[#000000] mb-2">Tazelik Notu</h3>
              <p className="font-sans font-light text-[0.95rem] text-[#555555] leading-relaxed">
                Kavrulmuş kahve bir meyve çekirdeğidir ve canlıdır. En iyi fincan deneyimi için paketinizi teslim aldıktan sonra valfinden hafifçe koklayarak degassing sürecini tamamlamasını beklemenizi tavsiye ederiz.
              </p>
            </div>
          </div>

          {/* SSS Akordiyon Listesi */}
          <div className="flex flex-col gap-8">
            {groups.map((g, i) => (
              <FAQAccordion key={i} group={g} />
            ))}
          </div>

        </div>
      </section>

      {/* --- KAPANIŞ (SIYAH BÖLÜM) --- */}
      <section className="bg-[#000000] text-[#FFFFFF] py-24 px-6 md:px-10 text-center">
        <div className="max-w-2xl mx-auto flex flex-col items-center">
          <h3 className="font-serif text-[2rem] md:text-[2.5rem] leading-[1.2] text-[#FFFFFF] mb-4">
            Aradığınızı <em className="italic text-[#888888]">bulamadınız mı?</em>
          </h3>
          <p className="font-sans font-light text-[1rem] leading-[1.85] text-[#888888] mb-10">
            Size yardımcı olmaktan mutluluk duyarız. Sorunuzu mail veya iletişim formu aracılığıyla iletin, atölye ekibimiz en kısa sürede dönüş yapsın.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
            <Link
              to="/iletisim"
              className="flex w-full sm:w-auto items-center justify-center gap-3 bg-[#FFFFFF] text-[#000000] px-10 py-4 border border-[#FFFFFF] transition-colors hover:bg-[#E5E5E5]"
            >
              <span className="font-mono text-[0.65rem] tracking-[0.15em] uppercase">İletişim Formu</span>
            </Link>
            <a
              href="mailto:hq@editionroastery.com"
              className="flex w-full sm:w-auto items-center justify-center gap-3 bg-transparent text-[#FFFFFF] px-10 py-4 border border-[#555555] transition-colors hover:border-[#FFFFFF]"
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