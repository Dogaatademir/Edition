import { useEffect, useRef, useState } from "react";
import { Mail, MapPin, Clock, ArrowRight, CheckCircle2, Phone } from "lucide-react";

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

export default function Iletisim() {
  const heroReveal = useReveal();
  const contentReveal = useReveal();

  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Burada form gönderme işlemleri (API vb.) yapılacak
    setIsSubmitted(true);
    setTimeout(() => setIsSubmitted(false), 5000); // 5 saniye sonra mesajı gizle
  };

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
            İletişim
          </div>
          <h1 className="font-serif text-[clamp(2.5rem,6vw,6rem)] text-[#000000] leading-[1.05] tracking-[-0.02em] max-w-4xl">
            Bizimle İletişime <em className="italic text-[#555555]">Geçin</em>
          </h1>
        </div>
      </section>

      {/* ─── 2. İLETİŞİM BİLGİLERİ VE FORM ─── */}
      <section className="border-b border-[#E5E5E5] bg-[#FFFFFF]">
        <div 
          ref={contentReveal.ref}
          className={`max-w-[1440px] mx-auto flex flex-col lg:flex-row transition-all duration-[1000ms] ease-out delay-200 ${contentReveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}
        >
          
          {/* SOL: BİLGİLER */}
          <div className="flex-1 p-8 md:p-16 lg:p-24 border-b lg:border-b-0 lg:border-r border-[#E5E5E5] bg-[#FAFAFA]">
           

            <div className="space-y-10">
              {/* Adres */}
              <div className="flex items-start gap-5">
                <div className="mt-1">
                  <MapPin className="w-5 h-5 text-[#000000]" strokeWidth={1.5} />
                </div>
                <div>
                  <div className="font-mono text-[0.6rem] tracking-[0.2em] uppercase text-[#888888] mb-2">Adres</div>
                  <div className="font-sans font-light text-[1rem] leading-[1.6] text-[#000000] max-w-[250px]">
                    Yeni Bağlıca Mah. Etimesgut Blv. No:2B-E Etimesgut <br />
                    Ankara, Türkiye
                  </div>
                </div>
              </div>

              {/* Çağrı Merkezi */}
              <div className="flex items-start gap-5">
                <div className="mt-1">
                  <Phone className="w-5 h-5 text-[#000000]" strokeWidth={1.5} />
                </div>
                <div>
                  <div className="font-mono text-[0.6rem] tracking-[0.2em] uppercase text-[#888888] mb-2">Çağrı Merkezi</div>
                  <div className="font-sans font-light text-[1rem] leading-[1.6] text-[#000000]">
                    +90 (312) 980 00 88
                  </div>
                </div>
              </div>

              {/* E-Posta */}
              <div className="flex items-start gap-5">
                <div className="mt-1">
                  <Mail className="w-5 h-5 text-[#000000]" strokeWidth={1.5} />
                </div>
                <div>
                  <div className="font-mono text-[0.6rem] tracking-[0.2em] uppercase text-[#888888] mb-2">E-Posta & Destek</div>
                  <div className="font-sans font-light text-[1rem] leading-[1.6] text-[#000000]">
                    info@editioncoffee.co
                  </div>
                </div>
              </div>

              {/* Çalışma Saatleri */}
              <div className="flex items-start gap-5">
                <div className="mt-1">
                  <Clock className="w-5 h-5 text-[#000000]" strokeWidth={1.5} />
                </div>
                <div>
                  <div className="font-mono text-[0.6rem] tracking-[0.2em] uppercase text-[#888888] mb-2">Çalışma Saatleri</div>
                  <div className="font-sans font-light text-[1rem] leading-[1.6] text-[#000000]">
                    Pazartesi - Cuma: 09:00 - 18:00 <br />
                    Cumartesi: 10:00 - 16:00 <br />
                    <span className="text-[#888888]">Pazar: Kapalı</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* SAĞ: FORM */}
          <div className="flex-1 p-8 md:p-16 lg:p-24 bg-[#FFFFFF]">
            <div className="max-w-md">
              <h3 className="font-serif text-[1.5rem] text-[#000000] mb-2">Bir Mesaj Bırakın</h3>
              <p className="font-sans font-light text-[0.9rem] text-[#555555] mb-10">
                Toptan alım, işbirlikleri veya kahvelerimiz hakkında merak ettikleriniz için formu doldurabilirsiniz.
              </p>

              {isSubmitted ? (
                <div className="flex flex-col items-center justify-center p-10 border border-[#E5E5E5] bg-[#FAFAFA] text-center animate-in fade-in duration-500">
                  <CheckCircle2 className="w-10 h-10 text-[#000000] mb-4" strokeWidth={1} />
                  <h4 className="font-serif text-[1.2rem] text-[#000000] mb-2">Mesajınız Alındı</h4>
                  <p className="font-sans font-light text-[0.85rem] text-[#555555]">
                    En kısa sürede sizinle iletişime geçeceğiz. Kahve kokulu günler dileriz!
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in duration-500">
                  <div className="relative">
                    <input 
                      type="text" 
                      id="name"
                      required
                      className="peer w-full border-b border-[#E5E5E5] bg-transparent py-3 font-sans font-light text-[1rem] text-[#000000] placeholder-transparent focus:border-[#000000] focus:outline-none transition-colors" 
                      placeholder="Adınız Soyadınız" 
                    />
                    <label 
                      htmlFor="name" 
                      className="absolute left-0 -top-3.5 font-mono text-[0.55rem] tracking-[0.15em] uppercase text-[#888888] transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-[0.85rem] peer-placeholder-shown:font-sans peer-placeholder-shown:tracking-normal peer-placeholder-shown:capitalize peer-focus:-top-3.5 peer-focus:font-mono peer-focus:text-[0.55rem] peer-focus:tracking-[0.15em] peer-focus:uppercase peer-focus:text-[#000000]"
                    >
                      Adınız Soyadınız
                    </label>
                  </div>

                  <div className="relative">
                    <input 
                      type="email" 
                      id="email"
                      required
                      className="peer w-full border-b border-[#E5E5E5] bg-transparent py-3 font-sans font-light text-[1rem] text-[#000000] placeholder-transparent focus:border-[#000000] focus:outline-none transition-colors" 
                      placeholder="E-Posta Adresiniz" 
                    />
                    <label 
                      htmlFor="email" 
                      className="absolute left-0 -top-3.5 font-mono text-[0.55rem] tracking-[0.15em] uppercase text-[#888888] transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-[0.85rem] peer-placeholder-shown:font-sans peer-placeholder-shown:tracking-normal peer-placeholder-shown:capitalize peer-focus:-top-3.5 peer-focus:font-mono peer-focus:text-[0.55rem] peer-focus:tracking-[0.15em] peer-focus:uppercase peer-focus:text-[#000000]"
                    >
                      E-Posta Adresiniz
                    </label>
                  </div>

                  <div className="relative">
                    <input 
                      type="text" 
                      id="subject"
                      required
                      className="peer w-full border-b border-[#E5E5E5] bg-transparent py-3 font-sans font-light text-[1rem] text-[#000000] placeholder-transparent focus:border-[#000000] focus:outline-none transition-colors" 
                      placeholder="Konu" 
                    />
                    <label 
                      htmlFor="subject" 
                      className="absolute left-0 -top-3.5 font-mono text-[0.55rem] tracking-[0.15em] uppercase text-[#888888] transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-[0.85rem] peer-placeholder-shown:font-sans peer-placeholder-shown:tracking-normal peer-placeholder-shown:capitalize peer-focus:-top-3.5 peer-focus:font-mono peer-focus:text-[0.55rem] peer-focus:tracking-[0.15em] peer-focus:uppercase peer-focus:text-[#000000]"
                    >
                      Konu
                    </label>
                  </div>

                  <div className="relative">
                    <textarea 
                      id="message"
                      required
                      rows={4}
                      className="peer w-full border-b border-[#E5E5E5] bg-transparent py-3 font-sans font-light text-[1rem] text-[#000000] placeholder-transparent focus:border-[#000000] focus:outline-none transition-colors resize-none" 
                      placeholder="Mesajınız" 
                    />
                    <label 
                      htmlFor="message" 
                      className="absolute left-0 -top-3.5 font-mono text-[0.55rem] tracking-[0.15em] uppercase text-[#888888] transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-[0.85rem] peer-placeholder-shown:font-sans peer-placeholder-shown:tracking-normal peer-placeholder-shown:capitalize peer-focus:-top-3.5 peer-focus:font-mono peer-focus:text-[0.55rem] peer-focus:tracking-[0.15em] peer-focus:uppercase peer-focus:text-[#000000]"
                    >
                      Mesajınız
                    </label>
                  </div>

                  <button 
                    type="submit"
                    className="group flex items-center justify-center gap-4 bg-[#000000] text-[#FFFFFF] w-full py-5 border border-[#000000] hover:bg-[#FFFFFF] hover:text-[#000000] transition-colors mt-4"
                  >
                    <span className="font-mono text-[0.7rem] md:text-[0.8rem] tracking-[0.15em] uppercase">
                      Mesajı Gönder
                    </span>
                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </button>
                </form>
              )}

            </div>
          </div>

        </div>
      </section>

      

    </div>
  );
}