import { useEffect, useRef, useState } from "react";
import { Mail, MapPin, Clock, ArrowRight, CheckCircle2, Phone } from "lucide-react";
import emailjs from "@emailjs/browser";

const IconInstagram = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" />
  </svg>
);


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

const CONTACT_INFO = [
  {
    icon: <MapPin className="w-5 h-5" strokeWidth={1.5} />,
    label: "Adres",
    content: "Yeni Bağlıca Mah. Etimesgut Blv. No:2B-E\nEtimesgut, Ankara, Türkiye",
  },
  {
    icon: <Phone className="w-5 h-5" strokeWidth={1.5} />,
    label: "Çağrı Merkezi",
    content: "+90 (312) 980 00 88",
  },
  {
    icon: <Mail className="w-5 h-5" strokeWidth={1.5} />,
    label: "E-Posta & Destek",
    content: "info@editioncoffee.com.tr",
  },
  {
    icon: <Clock className="w-5 h-5" strokeWidth={1.5} />,
    label: "Çalışma Saatleri",
    content: "Pzt – Cum: 09:00 – 18:00\nCumartesi: 10:00 – 16:00\nPazar: Kapalı",
  },
];

const inputClass = "peer w-full border-b border-[#1b1b1b]/20 bg-transparent py-3 font-sans font-light text-[1rem] text-[#1b1b1b] placeholder-transparent focus:border-[#1b1b1b] focus:outline-none transition-colors";
const labelClass = "absolute left-0 -top-3.5 font-mono text-[0.55rem] tracking-[0.15em] uppercase text-[#7b6a5c] transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-[0.9rem] peer-placeholder-shown:font-sans peer-placeholder-shown:tracking-normal peer-placeholder-shown:normal-case peer-focus:-top-3.5 peer-focus:font-mono peer-focus:text-[0.55rem] peer-focus:tracking-[0.15em] peer-focus:uppercase peer-focus:text-[#1b1b1b]";

export default function Iletisim() {
  const heroReveal    = useReveal();
  const contentReveal = useReveal();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formRef.current) return;
    setIsSending(true);
    setError(null);

    const serviceId  = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
    const publicKey  = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

    console.group("📧 EmailJS — Form Gönderimi");
    console.log("Service ID :", serviceId  || "❌ TANIMLANMADI");
    console.log("Template ID:", templateId || "❌ TANIMLANMADI");
    console.log("Public Key :", publicKey  ? "✅ mevcut" : "❌ TANIMLANMADI");
    console.log("Form verisi:", Object.fromEntries(new FormData(formRef.current)));
    console.groupEnd();

    emailjs.sendForm(serviceId, templateId, formRef.current, publicKey)
      .then((result) => {
        console.log("✅ EmailJS başarılı:", result.status, result.text);
        setIsSubmitted(true);
        formRef.current?.reset();
      })
      .catch((err) => {
        console.error("❌ EmailJS hatası:", err);
        setError("Mesaj gönderilemedi. Lütfen tekrar deneyin veya doğrudan e-posta gönderin.");
      })
      .finally(() => {
        setIsSending(false);
      });
  };

  return (
    <div className="bg-[#f7f0e7] text-[#1b1b1b] min-h-screen font-sans selection:bg-[#1b1b1b] selection:text-[#f7f0e7]">

      {/* 1. HERO */}
      <section className="relative border-b border-[#1b1b1b]/10 bg-[#1b1b1b] text-[#f7f0e7] overflow-hidden px-6 pb-24 pt-48 md:px-10">
        <img
          src="https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?q=80&w=2000&auto=format&fit=crop"
          alt="Edition Coffee"
          className="absolute inset-0 h-full w-full object-cover opacity-20"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1b1b1b]/95 via-[#1b1b1b]/50 to-transparent" />

        <div
          ref={heroReveal.ref}
          className={`relative z-10 mx-auto max-w-[1440px] transition-all duration-1000 ${heroReveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
        >
          <p className="mb-6 font-mono text-[0.58rem] uppercase tracking-[0.35em] text-[#c38152]">İletişim</p>
          <h1 className="font-serif text-[clamp(2.4rem,6vw,5.5rem)] leading-[1.05] tracking-[-0.02em] max-w-3xl mb-10">
            Bizimle <em className="italic text-[#c38152]">iletişime</em> geçin.
          </h1>
          <div className="flex items-center gap-3">
            <div className="h-[1px] w-12 bg-[#f7f0e7]/30" />
            <span className="font-mono text-[0.58rem] uppercase tracking-[0.2em] text-[#f7f0e7]/40">Ankara · Türkiye</span>
          </div>
        </div>
      </section>

      {/* 2. İLETİŞİM BİLGİLERİ + FORM */}
      <section className="border-b border-[#1b1b1b]/10">
        <div
          ref={contentReveal.ref}
          className={`mx-auto max-w-[1440px] flex flex-col lg:flex-row transition-all duration-1000 delay-100 ${contentReveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
        >
          {/* Sol: Bilgiler */}
          <div className="flex-1 border-b lg:border-b-0 lg:border-r border-[#1b1b1b]/10 bg-[#efe5d8] p-8 md:p-16 lg:p-24 flex flex-col justify-between gap-12">
            <div>
              <p className="mb-5 font-mono text-[0.58rem] uppercase tracking-[0.32em] text-[#c38152]">Bize Ulaşın</p>
              <h2 className="font-serif text-[clamp(1.6rem,2.5vw,2.5rem)] leading-[1.1] tracking-[-0.02em] mb-10">
                Her sorunuz için<br />buradayız.
              </h2>

              <div className="space-y-8">
                {CONTACT_INFO.map((item) => (
                  <div key={item.label} className="flex items-start gap-5">
                    <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center border border-[#1b1b1b]/15 bg-[#f7f0e7]">
                      {item.icon}
                    </div>
                    <div>
                      <div className="mb-1 font-mono text-[0.55rem] uppercase tracking-[0.2em] text-[#7b6a5c]">{item.label}</div>
                      <div className="font-sans font-light text-[0.95rem] leading-[1.7] text-[#1b1b1b] whitespace-pre-line">{item.content}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sosyal medya */}
            <div>
              <div className="mb-4 font-mono text-[0.55rem] uppercase tracking-[0.2em] text-[#7b6a5c]">Sosyal Medya</div>
              <div className="flex gap-4">
                <a href="https://www.instagram.com/editioncoffeeroastery" target="_blank" rel="noopener noreferrer" className="flex h-10 w-10 items-center justify-center border border-[#1b1b1b]/15 bg-[#f7f0e7] text-[#1b1b1b] hover:bg-[#1b1b1b] hover:text-[#f7f0e7] transition-colors">
                  <IconInstagram />
                </a>
              </div>
            </div>
          </div>

          {/* Sağ: Form */}
          <div className="flex-1 p-8 md:p-16 lg:p-24 bg-[#f7f0e7]">
            <p className="mb-5 font-mono text-[0.58rem] uppercase tracking-[0.32em] text-[#c38152]">Mesaj Gönderin</p>
            <h3 className="font-serif text-[clamp(1.6rem,2.5vw,2.5rem)] leading-[1.1] tracking-[-0.02em] mb-3">
              Bir mesaj bırakın.
            </h3>
            <p className="mb-10 font-sans font-light text-[0.9rem] text-[#1b1b1b]/60 leading-relaxed">
              Toptan alım, işbirliği veya kahvelerimiz hakkında merak ettikleriniz için formu doldurabilirsiniz.
            </p>

            {isSubmitted ? (
              <div className="flex flex-col items-center justify-center py-16 border border-[#1b1b1b]/10 bg-[#efe5d8] text-center animate-in fade-in duration-500">
                <CheckCircle2 className="w-10 h-10 text-[#1b1b1b] mb-5" strokeWidth={1} />
                <h4 className="font-serif text-[1.3rem] text-[#1b1b1b] mb-2">Mesajınız Alındı</h4>
                <p className="font-sans font-light text-[0.85rem] text-[#1b1b1b]/60">
                  En kısa sürede sizinle iletişime geçeceğiz.<br />Kahve kokulu günler dileriz!
                </p>
              </div>
            ) : (
              <form ref={formRef} onSubmit={handleSubmit} className="space-y-8 animate-in fade-in duration-500">
                <div className="relative">
                  <input type="text" id="name" name="from_name" required className={inputClass} placeholder="Adınız Soyadınız" />
                  <label htmlFor="name" className={labelClass}>Adınız Soyadınız</label>
                </div>

                <div className="relative">
                  <input type="email" id="email" name="from_email" required className={inputClass} placeholder="E-Posta Adresiniz" />
                  <label htmlFor="email" className={labelClass}>E-Posta Adresiniz</label>
                </div>

                <div className="relative">
                  <input type="text" id="subject" name="subject" required className={inputClass} placeholder="Konu" />
                  <label htmlFor="subject" className={labelClass}>Konu</label>
                </div>

                <div className="relative">
                  <textarea id="message" name="message" required rows={4} className={`${inputClass} resize-none`} placeholder="Mesajınız" />
                  <label htmlFor="message" className={labelClass}>Mesajınız</label>
                </div>

                {error && (
                  <p className="font-mono text-[0.58rem] uppercase tracking-[0.12em] text-red-600">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={isSending}
                  className="group flex w-full items-center justify-center gap-4 border border-[#1b1b1b] bg-[#1b1b1b] py-5 text-[#f7f0e7] font-mono text-[0.65rem] uppercase tracking-[0.15em] hover:bg-transparent hover:text-[#1b1b1b] transition-colors mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSending ? "Gönderiliyor..." : "Mesajı Gönder"}
                  {!isSending && <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* 3. KVKK NOTU */}
      <section className="px-6 py-10 md:px-10 bg-[#f7f0e7]">
        <div className="mx-auto max-w-[1440px]">
          <p className="font-mono text-[0.55rem] uppercase tracking-[0.15em] text-[#1b1b1b]/35 leading-relaxed max-w-2xl">
            Bu form aracılığıyla iletilen kişisel verileriniz, 6698 sayılı KVKK kapsamında yalnızca tarafınıza yanıt vermek amacıyla işlenmekte olup üçüncü kişilerle paylaşılmamaktadır.
          </p>
        </div>
      </section>

    </div>
  );
}
