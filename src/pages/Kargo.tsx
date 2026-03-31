import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  Truck,
  Package,
  Clock,
  MapPin,
  ShieldCheck,
  RefreshCw,
  Mail,
  ArrowRight,
  AlertTriangle,
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

// ─── YARDIMCI BİLEŞENLER ──────────────────────────────────────────────────────
const SectionHeading = ({ label, children }: { label: string; children: ReactNode }) => {
  const reveal = useReveal();
  return (
    <div ref={reveal.ref} className={`mb-12 transition-all duration-[1000ms] ease-out ${reveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
      <span className="font-mono text-[0.6rem] tracking-[0.2em] uppercase text-[#888888] mb-4 flex items-center gap-2 before:content-[''] before:block before:w-5 before:h-[1px] before:bg-[#888888]">
        {label}
      </span>
      <h2 className="font-serif text-[2rem] md:text-[2.5rem] leading-[1.1] text-[#000000]">
        {children}
      </h2>
    </div>
  );
};

const InfoCard = ({ icon: Icon, title, children }: { icon: typeof Truck; title: string; children: ReactNode }) => {
  const reveal = useReveal(0.1);
  return (
    <div ref={reveal.ref} className={`border border-[#E5E5E5] bg-[#FFFFFF] p-8 lg:p-10 transition-all duration-[800ms] ease-out hover:border-[#000000] hover:bg-[#FAFAFA] ${reveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}>
      <div className="flex flex-col sm:flex-row items-start gap-6">
        <div className="flex h-12 w-12 items-center justify-center border border-[#000000] bg-[#FFFFFF] shrink-0">
          <Icon className="h-5 w-5 text-[#000000]" strokeWidth={1.5} />
        </div>
        <div>
          <h3 className="font-serif text-[1.4rem] text-[#000000] mb-4">{title}</h3>
          <div className="font-sans font-light text-[0.95rem] leading-[1.85] text-[#555555]">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

const Kargo = () => {
  const heroReveal = useReveal();
  const summaryReveal = useReveal(0.2);

  return (
    <main className="bg-[#FFFFFF] text-[#000000] min-h-screen font-sans selection:bg-[#000000] selection:text-[#FFFFFF] flex flex-col pt-[130px]">
      
      {/* ─── HERO BÖLÜMÜ ─── */}
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
            Süreçler
          </div>
          <h1 className="font-serif text-[clamp(2.5rem,6vw,5rem)] text-[#000000] leading-[1.05] tracking-[-0.02em] max-w-4xl mx-auto mb-6">
            Kargo, Teslimat <em className="italic text-[#555555]">ve İade</em>
          </h1>
          <p className="font-sans font-light text-[1rem] leading-[1.85] text-[#555555] max-w-2xl mx-auto">
            Türkiye'nin her yerine taze kavrulmuş nitelikli kahve gönderimi yapıyoruz. Siparişinizden fincanınıza kadar olan operasyonel süreci aşağıda şeffafça bulabilirsiniz.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              to="/kahveler"
              className="group flex w-full sm:w-auto items-center justify-center gap-3 bg-[#000000] text-[#FFFFFF] px-10 py-4 border border-[#000000] hover:bg-[#555555] hover:border-[#555555] transition-colors"
            >
              <span className="font-mono text-[0.65rem] tracking-[0.15em] uppercase">Seçkiye Dön</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── İÇERİK BÖLÜMÜ ─── */}
      <section className="px-6 py-24 bg-[#FFFFFF]">
        <div className="mx-auto max-w-[900px]">
          
          <SectionHeading label="Operasyon">Sipariş Akışı</SectionHeading>

          <div className="grid grid-cols-1 gap-6 mb-20">
            <InfoCard icon={Clock} title="Kavrum & Hazırlık">
              <p>
                Siparişleriniz stoktan değil, atölyemizin taze kavurma planına sadık kalınarak hazırlanır. Hafta içi oluşturulan siparişler genellikle <strong>1-3 iş günü</strong> içinde kavrulup, degassing (gaz salınımı) süreci göz önünde bulundurularak kargoya teslim edilir.
              </p>
            </InfoCard>

            <InfoCard icon={Truck} title="Teslimat Süresi">
              <p>
                Kargo firmasının teslimat süresi adrese göre değişmekle birlikte, Türkiye içinde çoğu noktaya <strong>1-4 iş günü</strong> aralığındadır.
              </p>
              <p className="mt-4">
                Siparişiniz kargoya verildiğinde takip numaranız e-posta adresinize otomatik olarak iletilir.
              </p>
            </InfoCard>

            <InfoCard icon={MapPin} title="Gönderim Bölgesi">
              <p>
                Şu an yalnızca <strong>Türkiye içi</strong> gönderim yapıyoruz. Sorunsuz bir teslimat için adres bilgilerinizi (il, ilçe, mahalle, açık adres ve telefon) eksiksiz girdiğinizden emin olunuz.
              </p>
            </InfoCard>
          </div>

          <div 
            ref={summaryReveal.ref}
            className={`mb-20 border border-[#E5E5E5] bg-[#FAFAFA] p-8 lg:p-10 flex flex-col sm:flex-row items-start gap-6 transition-all duration-[1000ms] ease-out ${summaryReveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          >
            <div className="flex h-12 w-12 items-center justify-center border border-[#000000] bg-[#FFFFFF] shrink-0">
              <Package className="h-5 w-5 text-[#000000]" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="font-serif text-[1.4rem] text-[#000000] mb-3">Kargo Ücreti & Avantajlar</h3>
              <p className="font-sans font-light text-[0.95rem] leading-[1.85] text-[#555555]">
                Edition Coffee Roastery'de <strong>750 TL ve üzeri tüm siparişlerinizde kargo ücretsizdir.</strong> Bu tutarın altında kalan siparişleriniz için güncel kargo bedeli ödeme ekranında sepetinize şeffaf bir şekilde yansıtılır. Abonelik paketlerimizde ise kargo her zaman tarafımızca karşılanır.
              </p>
            </div>
          </div>

          <SectionHeading label="Prosedür">İade & Değişim</SectionHeading>

          <div className="grid grid-cols-1 gap-6">
            <InfoCard icon={RefreshCw} title="İade Koşulları">
              <p>
                Kahve, tazelik hassasiyeti yüksek olan bir gıda ürünüdür. Bu nedenle <strong>ambalajı açılmış, valfi zedelenmiş veya sizin isteğiniz üzerine özel öğütülmüş</strong> kahvelerde iade ve değişim yapılamamaktadır.
              </p>
              <p className="mt-4">
                Yanlış gönderilmiş veya açılmamış çekirdek kahve iade talepleriniz için siparişiniz elinize ulaştıktan sonraki 14 gün içinde bizimle e-posta yoluyla iletişime geçebilirsiniz.
              </p>
            </InfoCard>

            <InfoCard icon={ShieldCheck} title="Hasarlı Teslimat">
              <p>
                Paketinizi kargo görevlisinden teslim alırken dış ambalajı mutlaka kontrol ediniz. Ezilme, yırtılma veya ıslanma gibi bir hasar durumu varsa kargo görevlisine <strong>"Hasar Tespit Tutanağı"</strong> tutturmanızı önemle rica ederiz.
              </p>
              <p className="mt-4">
                Hasarlı kargonun fotoğrafını tutanakla birlikte bize ilettiğinizde, mağduriyetiniz en hızlı şekilde giderilecek ve yeni siparişiniz ücretsiz olarak tarafınıza gönderilecektir.
              </p>
            </InfoCard>
          </div>

        </div>
      </section>

      {/* ─── KAPANIŞ (SIYAH BÖLÜM) ─── */}
      <section className="bg-[#000000] text-[#FFFFFF] py-24 px-6 md:px-10 text-center">
        <div className="max-w-2xl mx-auto flex flex-col items-center">
          <div className="flex h-16 w-16 items-center justify-center border border-[#FFFFFF]/20 bg-transparent mb-8">
             <AlertTriangle className="h-6 w-6 text-[#FFFFFF]" strokeWidth={1.5} />
          </div>
          <h3 className="font-serif text-[2rem] md:text-[2.5rem] leading-[1.2] text-[#FFFFFF] mb-4">
            Operasyonel bir <em className="italic text-[#888888]">sorununuz mu var?</em>
          </h3>
          <p className="font-sans font-light text-[1rem] leading-[1.85] text-[#888888] mb-10">
            Kargo takip durumunuz, adres değişikliği veya iade süreçlerinizle ilgili destek ekibimize doğrudan ulaşabilirsiniz. Çözüm için buradayız.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
            <a
              href="mailto:hq@editionroastery.com"
              className="flex w-full sm:w-auto items-center justify-center gap-3 bg-[#FFFFFF] text-[#000000] px-10 py-4 border border-[#FFFFFF] transition-colors hover:bg-[#E5E5E5]"
            >
              <Mail className="w-4 h-4" />
              <span className="font-mono text-[0.65rem] tracking-[0.15em] uppercase">E-Posta Gönder</span>
            </a>
            <Link
              to="/sss"
              className="flex w-full sm:w-auto items-center justify-center gap-3 bg-transparent text-[#FFFFFF] px-10 py-4 border border-[#555555] transition-colors hover:border-[#FFFFFF]"
            >
              <span className="font-mono text-[0.65rem] tracking-[0.15em] uppercase">Sıkça Sorulanlar</span>
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
};

export default Kargo;