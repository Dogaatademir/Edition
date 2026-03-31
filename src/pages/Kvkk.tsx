import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  FileText,
  Database,
  Lock,
  Users,
  Clock,
  Mail,
  ArrowRight,
  Info,
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
const Section = ({
  id,
  icon: Icon,
  title,
  children,
}: {
  id: string;
  icon: typeof FileText;
  title: string;
  children: ReactNode;
}) => {
  const reveal = useReveal(0.1);
  return (
    <section 
      id={id} 
      ref={reveal.ref}
      className={`scroll-mt-32 border border-[#E5E5E5] bg-[#FFFFFF] p-8 lg:p-10 transition-all duration-[800ms] ease-out hover:border-[#000000] hover:bg-[#FAFAFA] ${reveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}
    >
      <div className="flex flex-col sm:flex-row items-start gap-6">
        <div className="flex h-12 w-12 items-center justify-center border border-[#000000] bg-[#FFFFFF] shrink-0">
          <Icon className="h-5 w-5 text-[#000000]" strokeWidth={1.5} />
        </div>
        <div className="min-w-0">
          <h2 className="font-serif text-[1.4rem] text-[#000000] mb-4">{title}</h2>
          <div className="font-sans font-light text-[0.95rem] leading-[1.85] text-[#555555] space-y-4">
            {children}
          </div>
        </div>
      </div>
    </section>
  );
};

const BulletList = ({ items }: { items: string[] }) => (
  <ul className="space-y-2 pl-5 list-disc marker:text-[#888888]">
    {items.map((t, i) => (
      <li key={i}>{t}</li>
    ))}
  </ul>
);

const Kvkk = () => {
  const heroReveal = useReveal();
  const alertReveal = useReveal(0.2);

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
            Hukuki
          </div>
          <h1 className="font-serif text-[clamp(2.5rem,5vw,4.5rem)] text-[#000000] leading-[1.05] tracking-[-0.02em] max-w-4xl mx-auto mb-6">
            KVKK Aydınlatma <em className="italic text-[#555555]">Metni</em>
          </h1>
          <p className="font-sans font-light text-[1rem] leading-[1.85] text-[#555555] max-w-2xl mx-auto">
            Kişisel verilerinizi nasıl topladığımızı, hangi amaçlarla işlediğimizi ve haklarınızı şeffaf bir şekilde açıklıyoruz. Edition Coffee Roastery olarak verilerinizin güvenliği bizim için esastır.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              to="/kahveler"
              className="group flex w-full sm:w-auto items-center justify-center gap-3 bg-[#000000] text-[#FFFFFF] px-10 py-4 border border-[#000000] hover:bg-[#555555] hover:border-[#555555] transition-colors"
            >
              <span className="font-mono text-[0.65rem] tracking-[0.15em] uppercase">Seçkiye Dön</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to="/iletisim"
              className="flex w-full sm:w-auto items-center justify-center gap-3 bg-[#FFFFFF] text-[#000000] px-10 py-4 border border-[#E5E5E5] hover:border-[#000000] transition-colors"
            >
              <span className="font-mono text-[0.65rem] tracking-[0.15em] uppercase">İletişim</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── İÇERİK BÖLÜMÜ ─── */}
      <section className="px-6 py-24 bg-[#FFFFFF]">
        <div className="mx-auto max-w-[900px]">
          
          <div 
            ref={alertReveal.ref}
            className={`mb-12 border border-[#E5E5E5] bg-[#FAFAFA] p-8 lg:p-10 flex flex-col sm:flex-row items-start sm:items-center gap-6 transition-all duration-[1000ms] ease-out ${alertReveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
          >
            <div className="flex h-12 w-12 items-center justify-center border border-[#000000] bg-[#FFFFFF] shrink-0">
              <Info className="h-5 w-5 text-[#000000]" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="font-serif text-[1.4rem] text-[#000000] mb-2">Bilgilendirme Notu</h3>
              <p className="font-sans font-light text-[0.95rem] leading-[1.85] text-[#555555]">
                Aşağıdaki metin Edition Coffee Roastery'nin temel KVKK politikalarını içerir. Şirketinizin resmi vergi levhası/ünvan ve mersis numarası gibi yasal kimlik bilgileri oluşturulduğunda metin içerisindeki ilgili alanlara eklenmelidir.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <Section id="veri-sorumlusu" icon={FileText} title="1) Veri Sorumlusu">
              <p>
                6698 sayılı Kişisel Verilerin Korunması Kanunu (“KVKK”) uyarınca kişisel verileriniz; veri sorumlusu sıfatıyla
                <strong> Edition Coffee Roastery</strong> tarafından işlenebilecektir.
              </p>
              <BulletList
                items={[
                  'Adres: Yeni Bağlıca Mah. Etimesgut Blv. No:2B-E Etimesgut, Ankara, Türkiye',
                  'E-posta: info@editioncoffee.co',
                  'Çağrı Merkezi: +90 (312) 980 00 88',
                  'Vergi Dairesi/Mersis No: [Doldurulacak]',
                ]}
              />
            </Section>

            <Section id="toplama" icon={Database} title="2) Kişisel Verilerin Toplanma Yöntemi">
              <p>Kişisel verileriniz aşağıdaki kanallar üzerinden, otomatik veya kısmen otomatik yöntemlerle toplanabilir:</p>
              <BulletList
                items={[
                  'Web sitemizdeki üyelik/iletişim formları, sipariş adımları ve abonelik işlemleri.',
                  'E-posta, telefon ve sosyal medya hesaplarımız üzerinden kurulan iletişimler.',
                  'Kargo ve teslimat süreçlerinde zorunlu olarak iletilen sipariş bilgileri.',
                  'Çerezler ve benzeri analiz teknolojileri.',
                ]}
              />
            </Section>

            <Section id="amac" icon={Users} title="3) İşleme Amaçları">
              <p>Kişisel verileriniz; taze kahve operasyonlarımızın kusursuz işleyişi ve müşteri deneyiminin iyileştirilmesi amacıyla işlenebilir:</p>
              <BulletList
                items={[
                  'Siparişe özel kavurma işlemlerinin planlanması ve kargo teslimatının sağlanması.',
                  'Üyelik profillerinin ve kahve abonelik planlarının yönetimi.',
                  'Fatura düzenlenmesi ve yasal muhasebe kayıtlarının oluşturulması.',
                  'İletişim talepleri, iade/değişim ve şikayet yönetim süreçleri.',
                  'Dolandırıcılık tespiti ve bilgi güvenliği süreçlerinin işletilmesi.',
                ]}
              />
            </Section>

            <Section id="hukuki-sebep" icon={Lock} title="4) Hukuki Sebepler">
              <p>Kişisel verileriniz KVKK’nın 5. ve 6. maddelerinde belirtilen yasal dayanaklara (hukuki sebeplere) göre işlenmektedir:</p>
              <BulletList
                items={[
                  'Satış sözleşmesinin kurulması veya ifasıyla doğrudan doğruya ilgili olması.',
                  'Veri sorumlusunun hukuki yükümlülüklerini yerine getirebilmesi (örn: faturalandırma).',
                  'Bir hakkın tesisi, kullanılması veya korunması için veri işlemenin zorunlu olması.',
                  'Temel hak ve özgürlüklerinize zarar vermemek kaydıyla meşru menfaatlerimiz için zorunlu olması.',
                  'Gerekli hallerde ve sadece izin verilmesi durumunda açık rızanızın bulunması.',
                ]}
              />
            </Section>

            <Section id="aktarim" icon={ShieldCheck} title="5) Verilerin Aktarımı">
              <p>
                Kişisel verileriniz, işleme amaçlarıyla sınırlı olmak üzere, gizlilik prensiplerimiz doğrultusunda sadece yetkili iş ortaklarımıza aktarılabilir:
              </p>
              <BulletList
                items={[
                  'Kargo firmaları: Siparişlerinizin kapınıza teslim edilebilmesi için ad, soyad, adres ve telefon bilgileriniz.',
                  'Ödeme altyapısı sağlayıcıları: Güvenli kredi kartı ve sanal pos işlemlerinin yürütülmesi için.',
                  'Altyapı/Sunucu sağlayıcıları: E-ticaret sitemizin kesintisiz ve güvenli işletilmesi amacıyla.',
                ]}
              />
            </Section>

            <Section id="saklama" icon={Clock} title="6) Saklama Süreleri">
              <p>
                Kişisel verileriniz; ilgili ticaret mevzuatında öngörülen yasal süreler boyunca saklanır. Süre sonunda periyodik imha politikamıza uygun olarak silinir veya anonim hale getirilir:
              </p>
              <BulletList
                items={[
                  'Sipariş/Fatura verileri: İlgili vergi ve ticaret mevzuatında belirlenen yıllar boyunca.',
                  'Üyelik verileri: Üyeliğiniz devam ettiği sürece veya hesabınız silinene kadar.',
                  'Destek/İletişim kayıtları: Olası uyuşmazlıklar için makul ve yasal süre boyunca.',
                ]}
              />
            </Section>

            <Section id="haklar" icon={FileText} title="7) Haklarınız (KVKK Madde 11)">
              <p>KVKK kapsamında kişisel verilerinizle ilgili her zaman aşağıdaki haklara sahipsiniz:</p>
              <BulletList
                items={[
                  'Verilerinizin işlenip işlenmediğini ve işlenme amacını öğrenme.',
                  'Eksik veya yanlış işlenmişse bunların düzeltilmesini talep etme.',
                  'Kanunda öngörülen şartlar çerçevesinde silinmesini veya yok edilmesini isteme.',
                  'Verilerinizin aktarıldığı üçüncü kişilere bu işlemlerin bildirilmesini talep etme.',
                  'Otomatik analiz sistemleri aleyhinize bir sonuç doğurduysa itiraz etme.',
                ]}
              />
            </Section>

            <Section id="basvuru" icon={Mail} title="8) İletişim ve Başvuru">
              <p>
                Kişisel verilerinize ilişkin tüm haklarınızı kullanmak ve taleplerinizi iletmek için{' '}
                <a className="font-semibold hover:underline" href="mailto:info@editioncoffee.co">info@editioncoffee.co</a> adresinden bize e-posta yoluyla ulaşabilirsiniz.
                Başvurunuz, talebinizin niteliğine göre en kısa sürede ve yasal sınırlar içerisinde sonuçlandırılacaktır.
              </p>
            </Section>
          </div>
        </div>
      </section>

      {/* ─── KAPANIŞ (SIYAH BÖLÜM) ─── */}
      <section className="bg-[#000000] text-[#FFFFFF] py-24 px-6 md:px-10 text-center">
        <div className="max-w-2xl mx-auto flex flex-col items-center">
          <h3 className="font-serif text-[2rem] md:text-[2.5rem] leading-[1.2] text-[#FFFFFF] mb-4">
            Bilgiye <em className="italic text-[#888888]">ihtiyacınız var mı?</em>
          </h3>
          <p className="font-sans font-light text-[1rem] leading-[1.85] text-[#888888] mb-10">
            Tedarik süreçlerimiz, kargo politikalarımız veya iade adımları hakkında tüm cevapları ilgili sayfalarda bulabilirsiniz.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
            <Link
              to="/kargo"
              className="flex w-full sm:w-auto items-center justify-center gap-3 bg-[#FFFFFF] text-[#000000] px-10 py-4 border border-[#FFFFFF] transition-colors hover:bg-[#E5E5E5]"
            >
              <span className="font-mono text-[0.65rem] tracking-[0.15em] uppercase">Kargo & Teslimat</span>
            </Link>
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

export default Kvkk;