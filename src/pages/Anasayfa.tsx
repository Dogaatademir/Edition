import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { products, type CoffeeProduct } from "../data/products";
import { useCart } from "../context/CartContext";

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

// ─── ALT BİLEŞEN: ÜRÜN KARTI ──────────────────────────────────────────────────
const ProductCard = ({ p, onAdd }: { p: CoffeeProduct, onAdd: (p: CoffeeProduct) => void }) => {
  const [, setIsHovered] = useState(false);
  const navigate = useNavigate(); 

  return (
    <div
      onClick={() => navigate(`/urun/${p.id}`)}
      className="group relative border-r border-b border-[#E5E5E5] p-4 md:p-7 cursor-pointer bg-[#FAFAFA] transition-colors hover:bg-[#F0F0F0] flex flex-col h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex justify-between items-start mb-4 md:mb-6">
        <span className="font-mono text-[0.45rem] md:text-[0.55rem] tracking-[0.12em] text-[#888888]">{p.code}</span>
        {p.badge && (
          <span className="font-mono text-[0.45rem] md:text-[0.5rem] font-semibold tracking-[0.15em] uppercase text-[#FFFFFF] bg-[#000000] px-1.5 md:px-2 py-0.5">
            {p.badge}
          </span>
        )}
      </div>

      <div className="w-full aspect-square bg-[#FFFFFF] border border-[#E5E5E5] flex items-center justify-center mb-4 md:mb-5 relative overflow-hidden">
        {p.image ? (
          <img src={p.image} alt={p.name} className="h-full w-full object-contain mix-blend-multiply p-2 md:p-4" />
        ) : (
          <svg width="60" height="60" viewBox="0 0 80 80" fill="none" className="opacity-20 md:w-[80px] md:h-[80px]">
            <ellipse cx="40" cy="40" rx="28" ry="36" stroke="#000000" strokeWidth="1.5" />
            <path d="M40 10 Q55 25 55 40 Q55 55 40 70" stroke="#000000" strokeWidth="1.5" strokeDasharray="3 3" />
            <path d="M40 10 Q25 25 25 40 Q25 55 40 70" stroke="#000000" strokeWidth="1" strokeDasharray="2 4" />
            <ellipse cx="40" cy="40" rx="4" ry="6" stroke="#000000" strokeWidth="1" />
          </svg>
        )}
        <span className="absolute bottom-2 right-2 font-mono text-[0.45rem] md:text-[0.5rem] tracking-[0.12em] text-[#888888]">
          {p.roast}
        </span>
      </div>

      <div className="flex-grow">
        <div className="font-mono text-[0.45rem] md:text-[0.55rem] tracking-[0.2em] uppercase text-[#888888] mb-1">
          {p.origin} · {p.process}
        </div>
        <div className="font-serif text-[0.95rem] md:text-[1.15rem] text-[#000000] leading-[1.15] mb-1.5">{p.name}</div>
        <div className="font-mono text-[0.5rem] md:text-[0.58rem] tracking-[0.08em] text-[#888888] mb-3 md:mb-4">{p.process} işlem</div>
        
        <div className="flex flex-wrap gap-1 md:gap-1.5 mb-4 md:mb-5">
          {p.notes?.map((n) => (
            <span key={n} className="font-mono text-[0.45rem] md:text-[0.56rem] tracking-[0.05em] text-[#555555] border border-[#E5E5E5] px-1.5 md:px-2 py-0.5 transition-colors group-hover:border-[#888888]">
              {n}
            </span>
          ))}
        </div>
      </div>
      
      <div className="flex items-center justify-between pt-3 md:pt-4 border-t border-[#E5E5E5] mt-auto">
        <div className="flex flex-col">
          {p.oldPrice && (
            <span className="font-mono text-[0.55rem] md:text-[0.7rem] text-[#888888] line-through mb-0.5">
              {p.oldPrice}
            </span>
          )}
          <span className="font-mono font-semibold text-[0.9rem] md:text-[1.1rem] text-[#000000]">
            {p.price}
          </span>
        </div>

        <button 
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            onAdd(p);
          }}
          className="w-7 h-7 md:w-8 md:h-8 border border-[#000000] bg-[#000000] text-[#FFFFFF] flex items-center justify-center font-mono opacity-100 md:opacity-0 md:translate-y-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 hover:bg-[#555555] hover:border-[#555555]"
        >
          +
        </button>
      </div>
    </div>
  );
};

// ─── HOMEPAGE ─────────────────────────────────────────────────────────────────
export default function Anasayfa() {
  const { addToCart } = useCart();
  const [isPageLoaded, setIsPageLoaded] = useState(false);

  useEffect(() => {
    // Sayfa yüklendiğinde hero animasyonlarını tetiklemek için
    setIsPageLoaded(true);
  }, []);
  
  const turkKahveleri = products.filter(p => p.category.includes('turk-kahvesi') && p.showOnHome).slice(0, 4);
  const filtreKahveler = products.filter(p => p.category.includes('filtre') && p.showOnHome).slice(0, 4);
  const espressolar = products.filter(p => p.category.includes('espresso') && p.showOnHome).slice(0, 4);
  const paketler = products.filter(p => p.category.includes('paket') && p.showOnHome).slice(0, 4);

  const turkKahvesiSection = useReveal();
  const filtreKahveSection = useReveal();
  const espressoSection    = useReveal();
  const paketlerSection    = useReveal();

  const [currentSlide, setCurrentSlide] = useState(0);
  const [dragStartX, setDragStartX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const heroSlides = [
    {
      title: "Türk Kahvesi",
      subtitle: "Geleneksel & Nitelikli",
      image: "https://plus.unsplash.com/premium_photo-1732818135469-3bfc10ed83a2?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8dHVya2lzaCUyMGNvZmZlZXxlbnwwfDB8MHx8fDA%3D",
      link: "/kahveler?kategori=turk-kahvesi"
    },
    {
      title: "Filtre Kahve",
      subtitle: "Demleme Profilleri",
      image: "https://images.unsplash.com/photo-1638202518327-956c496a5240?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8ZmlsdGVyJTIwY29mZmVlfGVufDB8MHwwfHx8MA%3D%3D", 
      link: "/kahveler?kategori=filtre"
    },
    {
      title: "Espresso",
      subtitle: "Yoğun & Gövdeli",
      image: "https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?q=80&w=2000&auto=format&fit=crop", 
      link: "/kahveler?kategori=espresso"
    },
    {
      title: "Avantajlı Paketler",
      subtitle: "Özel Seçkiler",
      image: "https://images.unsplash.com/photo-1559525839-b184a4d698c7?q=80&w=2000&auto=format&fit=crop", 
      link: "/kahveler?kategori=paket" 
    }
  ];

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev === 0 ? heroSlides.length - 1 : prev - 1));

  useEffect(() => {
    if (isDragging) return;
    const timer = setInterval(nextSlide, 5000);
    return () => clearInterval(timer);
  }, [isDragging, heroSlides.length]);

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    setDragStartX('touches' in e ? e.touches[0].clientX : e.clientX);
    setIsDragging(true);
  };

  const handleDragEnd = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    setIsDragging(false);
    
    const endX = 'changedTouches' in e ? e.changedTouches[0].clientX : (e as React.MouseEvent).clientX;
    const diffX = dragStartX - endX;

    if (Math.abs(diffX) > 50) {
      if (diffX > 0) nextSlide();
      else prevSlide();
    }
  };

  return (
    <div className="bg-[#FFFFFF] text-[#000000] min-h-screen font-sans selection:bg-[#000000] selection:text-[#FFFFFF] overflow-hidden">
      
      <style>{`
        @keyframes tickerRun { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .animate-ticker { animation: tickerRun 35s linear infinite; display: inline-flex; }
      `}</style>

      {/* ─── 1. FOTOĞRAFLI HERO SLIDER ─── */}
      <section 
        className="relative w-full h-[80vh] min-h-[500px] overflow-hidden bg-[#000000]"
        onMouseDown={handleDragStart}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
        onTouchStart={handleDragStart}
        onTouchEnd={handleDragEnd}
      >
        <div 
          className="flex w-full h-full transition-transform duration-1000 ease-[cubic-bezier(0.25,1,0.5,1)]"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {heroSlides.map((slide, idx) => (
            <div 
              key={idx} 
              className="w-full h-full flex-shrink-0 relative group cursor-pointer"
              onClick={() => {
                if (!isDragging) window.location.href = slide.link;
              }}
            >
              <img 
                src={slide.image} 
                alt={slide.title} 
                className="w-full h-full object-cover opacity-90 transition-transform duration-[15s] group-hover:scale-105" 
                draggable="false"
              />
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none" />
              
              <div className="absolute inset-0 flex flex-col items-center justify-center text-[#FFFFFF] pointer-events-none z-10 px-4 text-center">
                {/* Alt başlık: En erken gelir */}
                <span className={`font-mono text-[0.55rem] md:text-[0.65rem] tracking-[0.3em] uppercase mb-4 transition-all duration-[1000ms] ease-out ${isPageLoaded && currentSlide === idx ? 'opacity-80 translate-y-0 delay-[200ms]' : 'opacity-0 translate-y-8'}`}>
                  {slide.subtitle}
                </span>
                
                {/* Ana Başlık: Biraz daha gecikmeli gelir */}
                <h2 className={`font-serif text-[clamp(2.5rem,8vw,7rem)] leading-none tracking-[-0.02em] mb-8 drop-shadow-lg transition-all duration-[1000ms] ease-out ${isPageLoaded && currentSlide === idx ? 'opacity-100 translate-y-0 delay-[400ms]' : 'opacity-0 translate-y-8'}`}>
                  <em className="italic">{slide.title}</em>
                </h2>
                
                {/* Buton: En son gelir */}
                <span className={`font-mono text-[0.55rem] md:text-[0.65rem] tracking-[0.15em] uppercase border border-[#FFFFFF]/50 px-6 py-2.5 md:px-8 md:py-3 backdrop-blur-sm transition-all group-hover:bg-[#FFFFFF] group-hover:text-[#000000] duration-[1000ms] ease-out ${isPageLoaded && currentSlide === idx ? 'opacity-100 translate-y-0 delay-[600ms]' : 'opacity-0 translate-y-8'}`}>
                  Keşfet
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Sol Ok */}
        <button 
          onClick={(e) => { e.stopPropagation(); prevSlide(); }}
          className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full border border-[#FFFFFF]/30 text-[#FFFFFF] bg-black/20 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-[#FFFFFF] hover:text-[#000000] md:opacity-100"
          aria-label="Önceki"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Sağ Ok */}
        <button 
          onClick={(e) => { e.stopPropagation(); nextSlide(); }}
          className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full border border-[#FFFFFF]/30 text-[#FFFFFF] bg-black/20 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-[#FFFFFF] hover:text-[#000000] md:opacity-100"
          aria-label="Sonraki"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Alt Nokta (Dot) İndikatörleri */}
        <div className="absolute bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 flex gap-2 md:gap-3 z-20">
          {heroSlides.map((_, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentSlide(idx);
              }}
              className={`h-1.5 transition-all duration-300 ${
                currentSlide === idx ? "w-6 md:w-8 bg-[#FFFFFF]" : "w-1.5 bg-[#FFFFFF]/40 hover:bg-[#FFFFFF]/80"
              }`}
            />
          ))}
        </div>
      </section>

      {/* ─── 2. REFERANS BANNER (TICKER) ─── */}
      <div className="bg-[#000000] py-2 md:py-2.5 overflow-hidden whitespace-nowrap border-y border-[#000000]">
        <div className="animate-ticker">
          {[...Array(2)].map((_, ri) => (
            <span key={ri} className="flex">
              {["%100 Arabica", "80+ Q-Grader Puanı", "Siparişe Özel Kavrum", "Özel Harmanlar", "Ankara Merkezli", "Erişilebilir Kalite", "Taze Teslimat", "Uzman Profiller"].map((t, i) => (
                <span key={i} className="font-mono text-[0.55rem] md:text-[0.62rem] tracking-[0.18em] uppercase text-[#FFFFFF]/70 px-6 md:px-8">
                  {t} <span className="text-[#FFFFFF]/30 ml-6 md:ml-8">—</span>
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      {/* ─── 3. TÜRK KAHVESİ ─── */}
      <div className="bg-[#FAFAFA] border-b border-[#E5E5E5] overflow-hidden">
        <div ref={turkKahvesiSection.ref} className="max-w-[1440px] mx-auto py-12 md:py-20 px-4 md:px-10">
          {/* Başlık Animasyonu */}
          <div className={`grid grid-cols-1 sm:grid-cols-[1fr_auto] items-end gap-4 md:gap-8 mb-8 md:mb-12 pb-4 md:pb-6 border-b border-[#E5E5E5] transition-all duration-[1000ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${turkKahvesiSection.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}>
            <div>
              <div className="font-mono text-[0.5rem] md:text-[0.58rem] tracking-[0.35em] uppercase text-[#888888] mb-2 flex items-center gap-2 before:content-[''] before:block before:w-5 before:h-[1px] before:bg-[#888888]">
                Geleneksel & Nitelikli
              </div>
              <h2 className="font-serif text-[clamp(1.5rem,3.5vw,3rem)] text-[#000000] leading-[1.05] tracking-[-0.02em]">
                Türk <em className="italic text-[#555555]">Kahvesi</em>
              </h2>
            </div>
            <a href="/kahveler?kategori=turk-kahvesi" className="font-mono text-[0.55rem] md:text-[0.6rem] tracking-[0.15em] uppercase text-[#888888] flex items-center gap-1.5 transition-colors hover:text-[#000000] whitespace-nowrap">
              Tümünü Gör →
            </a>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 border-l border-t border-[#E5E5E5]">
            {turkKahveleri.map((p, idx) => (
              <div 
                key={`turk-${p.id}`}
                className={`h-full transition-all duration-[1000ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${turkKahvesiSection.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-16"}`}
                style={{ transitionDelay: `${idx * 150}ms` }}
              >
                <ProductCard p={p} onAdd={addToCart} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── 4. FİLTRE KAHVE ─── */}
      <div className="bg-[#FFFFFF] border-b border-[#E5E5E5] overflow-hidden">
        <div ref={filtreKahveSection.ref} className="max-w-[1440px] mx-auto py-12 md:py-20 px-4 md:px-10">
          <div className={`grid grid-cols-1 sm:grid-cols-[1fr_auto] items-end gap-4 md:gap-8 mb-8 md:mb-12 pb-4 md:pb-6 border-b border-[#E5E5E5] transition-all duration-[1000ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${filtreKahveSection.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}>
            <div>
              <div className="font-mono text-[0.5rem] md:text-[0.58rem] tracking-[0.35em] uppercase text-[#888888] mb-2 flex items-center gap-2 before:content-[''] before:block before:w-5 before:h-[1px] before:bg-[#888888]">
                Demleme Profilleri
              </div>
              <h2 className="font-serif text-[clamp(1.5rem,3.5vw,3rem)] text-[#000000] leading-[1.05] tracking-[-0.02em]">
                Filtre <em className="italic text-[#555555]">Kahve</em>
              </h2>
            </div>
            <a href="/kahveler?kategori=filtre" className="font-mono text-[0.55rem] md:text-[0.6rem] tracking-[0.15em] uppercase text-[#888888] flex items-center gap-1.5 transition-colors hover:text-[#000000] whitespace-nowrap">
              Tümünü Gör →
            </a>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 border-l border-t border-[#E5E5E5]">
            {filtreKahveler.map((p, idx) => (
              <div 
                key={`filtre-${p.id}`}
                className={`h-full transition-all duration-[1000ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${filtreKahveSection.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-16"}`}
                style={{ transitionDelay: `${idx * 150}ms` }}
              >
                <ProductCard p={p} onAdd={addToCart} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── 5. ESPRESSO ─── */}
      <div className="bg-[#FAFAFA] border-b border-[#E5E5E5] overflow-hidden">
        <div ref={espressoSection.ref} className="max-w-[1440px] mx-auto py-12 md:py-20 px-4 md:px-10">
          <div className={`grid grid-cols-1 sm:grid-cols-[1fr_auto] items-end gap-4 md:gap-8 mb-8 md:mb-12 pb-4 md:pb-6 border-b border-[#E5E5E5] transition-all duration-[1000ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${espressoSection.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}>
            <div>
              <div className="font-mono text-[0.5rem] md:text-[0.58rem] tracking-[0.35em] uppercase text-[#888888] mb-2 flex items-center gap-2 before:content-[''] before:block before:w-5 before:h-[1px] before:bg-[#888888]">
                Yoğun & Gövdeli
              </div>
              <h2 className="font-serif text-[clamp(1.5rem,3.5vw,3rem)] text-[#000000] leading-[1.05] tracking-[-0.02em]">
                Espresso <em className="italic text-[#555555]">Çekirdekleri</em>
              </h2>
            </div>
            <a href="/kahveler?kategori=espresso" className="font-mono text-[0.55rem] md:text-[0.6rem] tracking-[0.15em] uppercase text-[#888888] flex items-center gap-1.5 transition-colors hover:text-[#000000] whitespace-nowrap">
              Tümünü Gör →
            </a>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 border-l border-t border-[#E5E5E5]">
            {espressolar.map((p, idx) => (
              <div 
                key={`espresso-${p.id}`}
                className={`h-full transition-all duration-[1000ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${espressoSection.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-16"}`}
                style={{ transitionDelay: `${idx * 150}ms` }}
              >
                <ProductCard p={p} onAdd={addToCart} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── 6. AVANTAJLI PAKETLER ─── */}
      <div className="bg-[#FFFFFF] border-b border-[#E5E5E5] overflow-hidden">
        <div ref={paketlerSection.ref} className="max-w-[1440px] mx-auto py-12 md:py-20 px-4 md:px-10">
          <div className={`grid grid-cols-1 sm:grid-cols-[1fr_auto] items-end gap-4 md:gap-8 mb-8 md:mb-12 pb-4 md:pb-6 border-b border-[#E5E5E5] transition-all duration-[1000ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${paketlerSection.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}>
            <div>
              <div className="font-mono text-[0.5rem] md:text-[0.58rem] tracking-[0.35em] uppercase text-[#888888] mb-2 flex items-center gap-2 before:content-[''] before:block before:w-5 before:h-[1px] before:bg-[#888888]">
                Özel Seçkiler
              </div>
              <h2 className="font-serif text-[clamp(1.5rem,3.5vw,3rem)] text-[#000000] leading-[1.05] tracking-[-0.02em]">
                Avantajlı <em className="italic text-[#555555]">Paketler</em>
              </h2>
            </div>
            <a href="/kahveler?kategori=paket" className="font-mono text-[0.55rem] md:text-[0.6rem] tracking-[0.15em] uppercase text-[#888888] flex items-center gap-1.5 transition-colors hover:text-[#000000] whitespace-nowrap">
              Tümünü Gör →
            </a>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 border-l border-t border-[#E5E5E5]">
            {paketler.map((p, idx) => (
              <div 
                key={`paket-${p.id}`}
                className={`h-full transition-all duration-[1000ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${paketlerSection.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-16"}`}
                style={{ transitionDelay: `${idx * 150}ms` }}
              >
                <ProductCard p={p} onAdd={addToCart} />
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}