// src/pages/Anasayfa.tsx
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Matter from "matter-js";
import { useCart } from "../context/CartContext";
import { fetchShopifyProducts, type CoffeeProduct } from "../lib/shopify";

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

function useScrollProgress(ref: React.RefObject<HTMLDivElement | null>) {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const handle = () => {
      const el = ref.current;
      if (!el) return;
      const { top, height } = el.getBoundingClientRect();
      const total = height - window.innerHeight;
      if (total <= 0) return;
      setProgress(Math.max(0, Math.min(1, -top / total)));
    };
    window.addEventListener('scroll', handle, { passive: true });
    handle();
    return () => window.removeEventListener('scroll', handle);
  }, [ref]);
  return progress;
}

// ─── ALT BİLEŞEN: ÜRÜN KARTI ─────────────────────────────────────────────────
const ProductCard = ({
  p,
  onAdd,
}: {
  p: CoffeeProduct;
  onAdd: (p: CoffeeProduct) => void;
}) => {
  const navigate = useNavigate();
  const [added, setAdded] = useState(false);

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onAdd(p);
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  };

  // İndirim oranını hesaplayan fonksiyon
  const getDiscountPercent = () => {
    if (!p.oldPrice) return null;
    try {
      // Temel sayısal parse işlemi (Farklı formatları desteklemek için)
      const cleanPrice = (s: string) => {
        // Binlik ayracı olan noktaları temizle, virgülü noktaya çevir, harfleri at
        const cleanStr = s.replace(/\./g, '').replace(/,/g, '.').replace(/[^\d.]/g, '');
        return parseFloat(cleanStr);
      };
      
      const oldVal = cleanPrice(p.oldPrice);
      const curVal = cleanPrice(p.price);

      if (!isNaN(oldVal) && !isNaN(curVal) && oldVal > curVal && curVal > 0) {
        return Math.round(((oldVal - curVal) / oldVal) * 100);
      }
    } catch (e) {
      console.warn("Fiyat hesaplama hatası:", e);
    }
    return null;
  };

  const discount = getDiscountPercent();

  return (
    <div
      onClick={() => navigate(`/urun/${p.handle}`)}
      className="group cursor-pointer flex flex-col w-full h-full"
    >
      <div className="relative w-full overflow-hidden mb-3 bg-[#EDE3D8] flex items-center justify-center">
        {/* Normal Badge (Örn: YENİ, TÜKENDİ) */}
        {p.badge && (
          <span className="absolute top-3 left-3 z-10 font-mono text-[0.4rem] tracking-[0.15em] uppercase bg-[#1A0F08] text-[#FFFFFF] px-2.5 py-1">
            {p.badge}
          </span>
        )}
        
        {/* İndirim Etiketi Görseli */}
        {discount && (
          <span className="absolute top-3 right-3 z-10 flex items-center justify-center font-mono text-[0.6rem] font-bold tracking-widest bg-[#A83C3C] text-[#FFFFFF] px-2 py-1 shadow-sm">
            -%{discount}
          </span>
        )}

        {p.image ? (
          <img
            src={p.image}
            alt={p.name}
            className="w-full h-auto object-contain group-hover:scale-[1.04] transition-transform duration-500 ease-out"
          />
        ) : (
          <div className="w-full aspect-square flex items-center justify-center">
            <svg width="48" height="48" viewBox="0 0 80 80" fill="none" className="opacity-15">
              <ellipse cx="40" cy="40" rx="28" ry="36" stroke="#1A0F08" strokeWidth="1.5" />
              <path d="M40 10 Q55 25 55 40 Q55 55 40 70" stroke="#1A0F08" strokeWidth="1.5" strokeDasharray="3 3" />
            </svg>
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 h-14 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={handleAdd}
            className={`font-mono text-[0.5rem] tracking-[0.2em] uppercase px-6 py-2.5 transition-all duration-200 ${
              added
                ? "bg-[#1A0F08] text-[#FAF6EF]"
                : "bg-[#C17A3A] text-[#FFFFFF] hover:bg-[#9E5820]"
            }`}
          >
            {added ? "✓ Eklendi" : "+ Sepete Ekle"}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2 flex-1 justify-between">
        <div>
          <h3 className="font-sans font-semibold text-[#1A0F08] text-[0.9rem] md:text-[0.95rem] leading-snug group-hover:text-[#C17A3A] transition-colors duration-300 line-clamp-2">
            {p.name}
          </h3>
          {(p.origin || p.roast) && (
            <p className="font-mono text-[0.38rem] tracking-[0.25em] uppercase text-[#9E8E7E] mt-1.5">
              {p.origin}{p.roast ? ` · ${p.roast}` : ""}
            </p>
          )}
        </div>

        {/* Fiyat Alanı - Ürün İsminin Altında */}
        <div className="flex items-center gap-2 mt-auto">
          <span className={`font-mono font-semibold text-[0.95rem] leading-tight ${p.oldPrice ? 'text-[#A83C3C]' : 'text-[#1A0F08]'}`}>
            {p.price}
          </span>
          {p.oldPrice && (
            <span className="font-mono text-[0.7rem] text-[#B0A090] line-through leading-tight">
              {p.oldPrice}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── YÜKLEME İSKELETİ ─────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="flex flex-col animate-pulse min-w-[240px] md:min-w-[280px] h-full">
    <div className="w-full aspect-square bg-[#E8DDD5] mb-3" />
    <div className="flex flex-col gap-2 flex-1">
      <div className="h-4 bg-[#E5E5E5] rounded w-4/5 mb-1" />
      <div className="h-[4px] bg-[#E5E5E5] rounded w-2/5" />
      <div className="h-4 bg-[#E5E5E5] rounded w-1/3 mt-auto" />
    </div>
  </div>
);

// ─── SIKÇA SORULAN SORULAR BİLEŞENİ ───────────────────────────────────────────
const FaqItem = ({ question, answer }: { question: string, answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-[#E5D8C5] pb-4 mb-4">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left group"
      >
        <span className="font-sans font-medium text-[#1A0F08] text-[0.95rem] group-hover:text-[#C17A3A] transition-colors pr-4">
          {question}
        </span>
        <span className="font-mono text-xl text-[#C17A3A] shrink-0 leading-none">
          {isOpen ? '−' : '+'}
        </span>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-40 opacity-100 mt-3' : 'max-h-0 opacity-0'}`}>
        <p className="font-sans font-light text-[#6B5A4E] text-[0.85rem] leading-relaxed">
          {answer}
        </p>
      </div>
    </div>
  );
};

// ─── HOMEPAGE ─────────────────────────────────────────────────────────────────
const CATEGORY_LABELS = ['Türk Kahvesi', 'Filtre Kahve', 'Espresso', 'Paketler'];
const CATEGORY_IMAGE_MAP: Record<string, string> = {
  'Türk Kahvesi': '/turkkahvesi.png',
  'Filtre Kahve':  '/filtre.png',
  'Espresso':      '/espresso.png',
  'Paketler':      '/paket.png',
};

const FAQ_DATA = [
  { question: "Siparişler ne zaman kargolanır?", answer: "Siparişleriniz, kahvenizin en taze haliyle size ulaşması için kavrum gününü takip eden 2 iş günü içerisinde özenle paketlenerek kargoya verilir." },
  { question: "Hangi kargo şirketi ile çalışıyorsunuz?", answer: "Hızlı ve güvenli teslimat için Yurtiçi Kargo ile çalışmaktayız. Ankara içi özel durumlarda kurye seçeneğimiz de mevcuttur." },
  { question: "Kahveler ne sıklıkla kavruluyor?", answer: "Atölyemizde haftalık planlı kavrumlar yapıyoruz. Böylece elinize her zaman zirve notasında, demlenmeye hazır taze kahveler ulaşır." },
  { question: "Ekipmanıma göre öğütme yapıyor musunuz?", answer: "Evet, sipariş aşamasında demleme yönteminizi (V60, French Press, Espresso vb.) seçerseniz, çekirdeklerinizi o ekipmana en uygun derecede öğüterek gönderiyoruz." },
  { question: "İade politikanız nedir?", answer: "Gıda ürünü olması sebebiyle, ambalajı açılmış kahvelerde iade kabul edemiyoruz. Ancak kargo kaynaklı hasarlarda yenisini hemen gönderiyoruz." },
  { question: "Toptan kahve alımı yapabilir miyiz?", answer: "Elbette. Kafe, ofis veya restoranınız için toptan alım ve kurumsal işbirlikleri için iletişim sayfamızdan bize ulaşabilirsiniz." }
];

export default function Anasayfa() {
  const { addToCart } = useCart();
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [autoCycleCategory, setAutoCycleCategory] = useState<string>(CATEGORY_LABELS[0]);
  const [activeTab, setActiveTab] = useState<string>('Filtre Kahve');
  
  const hoveredRef = useRef<string | null>(null);
  const heroRef = useRef<HTMLElement>(null);
  const beansCanvasRef = useRef<HTMLCanvasElement>(null);

  const [allProducts, setAllProducts] = useState<CoffeeProduct[]>([]);
  const [loading, setLoading] = useState(true);

  // Reveal Hooks
  const shopReveal = useReveal();
  const storyReveal = useReveal();

  // Scroll-driven picks
  const picksContainerRef = useRef<HTMLDivElement>(null);
  const picksProgress = useScrollProgress(picksContainerRef);

  useEffect(() => {
    setIsPageLoaded(true);
    fetchShopifyProducts()
      .then(setAllProducts)
      .catch((err) => console.error("Ürünler yüklenemedi:", err))
      .finally(() => setLoading(false));
  }, []);

  // Otomatik kategori geçişi (Hero için)
  useEffect(() => {
    let idx = 0;
    const interval = setInterval(() => {
      if (!hoveredRef.current) {
        idx = (idx + 1) % CATEGORY_LABELS.length;
        setAutoCycleCategory(CATEGORY_LABELS[idx]);
      }
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  // Matter.js kahve çekirdeği fiziği
  useEffect(() => {
    const section = heroRef.current;
    const canvas  = beansCanvasRef.current;
    if (!section || !canvas) return;

    let { width, height } = section.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    const resizeCanvas = (w: number, h: number) => {
      canvas.width  = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width  = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const ctx = canvas.getContext('2d')!;
    resizeCanvas(width, height);

    const engine = Matter.Engine.create({ gravity: { x: 0, y: 2 } });

    const floor = Matter.Bodies.rectangle(width / 2, height + 25, width * 3, 50, { isStatic: true, friction: 0.9, restitution: 0.1 });
    const wallL = Matter.Bodies.rectangle(-25, height / 2, 50, height * 3, { isStatic: true });
    const wallR = Matter.Bodies.rectangle(width + 25, height / 2, 50, height * 3, { isStatic: true });
    Matter.Composite.add(engine.world, [floor, wallL, wallR]);

    const ro = new ResizeObserver(entries => {
      const r   = entries[0].contentRect;
      const newW = r.width;
      const newH = r.height;

      resizeCanvas(newW, newH);
      Matter.Body.setPosition(floor, { x: newW / 2,  y: newH + 25 });
      Matter.Body.setPosition(wallL, { x: -25,        y: newH / 2  });
      Matter.Body.setPosition(wallR, { x: newW + 25, y: newH / 2  });

      beans.forEach(bean => {
        const br = (bean as any).circleRadius ?? 14;
        const clampedX = Math.max(br + 5, Math.min(newW - br - 5, bean.position.x));
        const clampedY = Math.min(bean.position.y, newH - br - 8);
        Matter.Body.setPosition(bean, { x: clampedX, y: clampedY });
        Matter.Body.setVelocity(bean, {
          x: (Math.random() - 0.5) * 4,
          y: -(8 + Math.random() * 10),
        });
      });

      width  = newW;
      height = newH;
    });
    ro.observe(section);

    const mouse = Matter.Mouse.create(section);
    section.removeEventListener('wheel',      (mouse as any).mousewheel);
    section.removeEventListener('touchstart', (mouse as any).mousedown);
    section.removeEventListener('touchmove',  (mouse as any).mousemove);
    const mc = Matter.MouseConstraint.create(engine, {
      mouse,
      constraint: { stiffness: 0.14, render: { visible: false } },
    });
    Matter.Composite.add(engine.world, mc);

    const beans: Matter.Body[] = [];
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    const BEAN_COUNT = window.innerWidth >= 768 ? 48 : 26;

    for (let i = 0; i < BEAN_COUNT; i++) {
      const t = setTimeout(() => {
        const x = 80 + Math.random() * (width - 160);
        const y = -(30 + Math.random() * 100);
        const r = 10 + Math.random() * 8;
        const bean = Matter.Bodies.circle(x, y, r, {
          restitution: 0.18,
          friction: 0.7,
          frictionAir: 0.008,
          density: 0.003,
          angle: Math.random() * Math.PI * 2,
        });
        Matter.Body.setVelocity(bean, { x: (Math.random() - 0.5) * 5, y: 2 + Math.random() * 3 });
        Matter.Body.setAngularVelocity(bean, (Math.random() - 0.5) * 0.4);
        Matter.Composite.add(engine.world, bean);
        beans.push(bean);
      }, i * 160 + Math.random() * 80);
      timeouts.push(t);
    }

    const drawBean = (x: number, y: number, r: number, angle: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 0.72, r, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#7B4528';
      ctx.fill();
      ctx.strokeStyle = '#3E1E0A';
      ctx.lineWidth = 0.9;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.88);
      ctx.bezierCurveTo(-r * 0.38, -r * 0.22, -r * 0.38, r * 0.22, 0, r * 0.88);
      ctx.strokeStyle = '#3E1E0A';
      ctx.lineWidth = 1.1;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, -r * 0.88);
      ctx.bezierCurveTo(r * 0.38, -r * 0.22, r * 0.38, r * 0.22, 0, r * 0.88);
      ctx.stroke();
      ctx.restore();
    };

    const mousePos = { x: -9999, y: -9999 };
    const onMouseMove = (e: MouseEvent) => {
      const rect = section.getBoundingClientRect();
      mousePos.x = e.clientX - rect.left;
      mousePos.y = e.clientY - rect.top;
    };
    section.addEventListener('mousemove', onMouseMove);
    section.addEventListener('mouseleave', () => { mousePos.x = -9999; mousePos.y = -9999; });

    const REPEL_RADIUS = 90;
    const REPEL_FORCE  = 0.006;

    let raf: number;
    const loop = () => {
      Matter.Engine.update(engine, 1000 / 60);
      beans.forEach(b => {
        const dx = b.position.x - mousePos.x;
        const dy = b.position.y - mousePos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < REPEL_RADIUS && dist > 1) {
          const strength = REPEL_FORCE * (1 - dist / REPEL_RADIUS);
          Matter.Body.applyForce(b, b.position, {
            x: (dx / dist) * strength,
            y: (dy / dist) * strength,
          });
        }
      });
      ctx.clearRect(0, 0, width, height);
      beans.forEach(b => drawBean(b.position.x, b.position.y, (b as any).circleRadius ?? 14, b.angle));
      raf = requestAnimationFrame(loop);
    };
    loop();

    return () => {
      cancelAnimationFrame(raf);
      timeouts.forEach(clearTimeout);
      section.removeEventListener('mousemove', onMouseMove);
      ro.disconnect();
      Matter.Engine.clear(engine);
      Matter.Composite.clear(engine.world, false);
    };
  }, []);

  const heroCategories = [
    { label: 'Türk Kahvesi', link: '/kahveler?kategori=turk-kahvesi', icon: <svg width="26" height="26" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M8 10h16l-2 13H10Z"/><path d="M24 13h3a2 2 0 0 1 0 4h-3"/><path d="M12 7c0-2 2-2 2-4"/><path d="M16 7c0-2 2-2 2-4"/><path d="M6 25h20"/></svg> },
    { label: 'Filtre Kahve', link: '/kahveler?kategori=filtre', icon: <svg width="26" height="26" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M7 6h18l-6 12H13Z"/><path d="M13 18v7h6v-7"/><path d="M11 25h10"/></svg> },
    { label: 'Espresso', link: '/kahveler?kategori=espresso', icon: <svg width="26" height="26" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="13" width="14" height="10" rx="1"/><path d="M23 17h2a2 2 0 0 1 0 4h-2"/><path d="M9 8h14v5H9z"/><path d="M7 25h18"/><path d="M13 5v3"/><path d="M19 5v3"/></svg> },
    { label: 'Paketler', link: '/kahveler?kategori=paket', icon: <svg width="26" height="26" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M6 12l10-6 10 6v13l-10 6-10-6Z"/><path d="M16 6v19"/><path d="M6 12l10 6 10-6"/></svg> },
  ];

  const displayCategory = hoveredCategory || autoCycleCategory;

  // Dükkan sekmesi için aktif ürünleri filtreleme
  const tabFilterMap: Record<string, string> = {
    'Türk Kahvesi': 'turk-kahvesi',
    'Filtre Kahve': 'filtre',
    'Espresso': 'espresso',
    'Paketler': 'paket'
  };
  
  const activeProducts = allProducts.filter(p => 
    p.category.some(t => t.toLowerCase().includes(tabFilterMap[activeTab]))
  );

  return (
    <div className="bg-[#FDFAF6] text-[#000000] min-h-screen font-sans selection:bg-[#1A0F08] selection:text-[#FAF6EF]">
      <style>{`
        @keyframes tickerRun { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        .animate-ticker { animation: tickerRun 35s linear infinite; display: inline-flex; }
        .animate-ticker:hover { animation-play-state: paused; }
        @keyframes heroCatDrop { from { opacity: 0; transform: translateY(-140px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes gradientMove { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
        .animate-gradient-bg { background: linear-gradient(-45deg, #1A0F08, #2a160c, #1A0F08, #180d07); background-size: 400% 400%; animation: gradientMove 12s ease infinite; }
        
        /* Gizli Scrollbar Sınıfı */
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* ─── 1. HERO + TICKER ─── */}
      <div className="flex flex-col h-[calc(100vh-130px)]">
        <section ref={heroRef as React.RefObject<HTMLElement>} className="relative w-full flex-1 min-h-0 bg-[#F5EEE6] overflow-hidden flex items-center border-b border-[#E5D8C5]">
          <canvas ref={beansCanvasRef} className="absolute inset-0 z-30 pointer-events-none" />
          <div className="absolute inset-0 flex items-center justify-start pl-6 md:pl-10 pointer-events-none select-none overflow-hidden z-10">
            <span className="font-serif text-[clamp(6rem,16vw,18rem)] text-[#000000]/[0.04] leading-none tracking-[-0.04em] whitespace-nowrap">
              EDITION
            </span>
          </div>
          <div className="absolute right-[10%] top-1/2 -translate-y-1/2 w-[600px] h-[600px] md:w-[780px] md:h-[780px] rounded-full bg-gradient-to-br from-[#E8D5BF] to-[#C9A87A] pointer-events-none opacity-60" />
          
          <div className="relative z-20 w-full max-w-[1440px] mx-auto px-6 md:px-10 py-4 md:py-0 flex items-center h-full">
            <div className="w-full grid grid-cols-[1fr_auto] md:grid-cols-[1fr_1fr_auto] items-center gap-4 md:gap-6 lg:gap-16">
              
              <div className={`col-span-2 md:col-span-1 flex flex-col gap-4 md:gap-7 transition-all duration-[1000ms] ease-out ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                <div className="font-mono text-[0.5rem] tracking-[0.35em] uppercase text-[#C17A3A] flex items-center gap-2.5">
                  <span className="block w-5 h-[1px] bg-[#C17A3A]" />
                  Ankara · Taze Kavrum
                </div>
                <h1 className="font-serif text-[clamp(3rem,7vw,6.5rem)] leading-[0.95] tracking-[-0.03em] text-[#1A0F08]">
                  Gerçek Kahve,<br />
                  <em className="italic text-[#C17A3A]">Gerçek Lezzet.</em>
                </h1>
                <p className="font-sans font-light text-[0.92rem] leading-[1.85] text-[#6B5A4E] max-w-[360px]">
                  Siparişiniz üzerine taze kavrulmuş, nitelikli çekirdekler. Her fincan, özenle seçilmiş menşeilerden hazırlanır.
                </p>
                <div className={`flex items-center gap-4 transition-all duration-[1000ms] delay-300 ease-out ${isPageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
                  <button onClick={() => document.getElementById('dukkan')?.scrollIntoView({ behavior: 'smooth' })}
                     className="inline-flex items-center gap-3 font-mono text-[0.65rem] tracking-[0.15em] uppercase bg-[#1A0F08] text-[#FAF6EF] pl-6 pr-2 py-2 rounded-full transition-colors hover:bg-[#2D1A0E]">
                    Seçkiyi Keşfet
                    <span className="w-8 h-8 rounded-full bg-[#C17A3A] flex items-center justify-center shrink-0">
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 8h10M9 4l4 4-4 4"/>
                      </svg>
                    </span>
                  </button>
                </div>
              </div>

              <div className="relative flex items-center justify-center">
                <div className="w-[240px] h-[240px] sm:w-[300px] sm:h-[300px] md:w-[440px] md:h-[440px] rounded-full bg-[#E4D8CC] transition-colors duration-500" />
                <div className="absolute inset-0 flex items-center justify-center overflow-hidden rounded-full">
                  <img
                    key={displayCategory}
                    src={CATEGORY_IMAGE_MAP[displayCategory] ?? 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=800&auto=format&fit=crop&q=80'}
                    alt={displayCategory}
                    className="w-full h-full object-contain drop-shadow-2xl"
                    style={{ animation: 'heroCatDrop 0.9s cubic-bezier(0.22, 1, 0.36, 1) forwards' }}
                  />
                </div>
                <div className="absolute bottom-4 right-4 md:bottom-6 md:right-0 w-20 h-20 md:w-24 md:h-24 animate-[spin_20s_linear_infinite]">
                  <svg viewBox="0 0 100 100" className="w-full h-full opacity-40">
                    <defs>
                      <path id="circle-text" d="M 50,50 m -37,0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0"/>
                    </defs>
                    <text className="font-mono" fontSize="10.5" fill="#C17A3A" letterSpacing="3">
                      <textPath href="#circle-text">EDITION COFFEE · ANKARA · TAZE KAVRUM ·</textPath>
                    </text>
                  </svg>
                </div>
              </div>

              <div className={`relative flex flex-col gap-4 md:gap-7 justify-center md:justify-start -translate-x-3 -translate-y-10 transition-all duration-[1000ms] delay-300 ease-out ${isPageLoaded ? 'opacity-100' : 'opacity-0 translate-x-6'}`}>
                {heroCategories.map((cat) => {
                  const isActive = displayCategory === cat.label;
                  return (
                    <div key={cat.label}
                      className="flex flex-col items-center gap-2 group cursor-pointer"
                      onClick={() => {
                        setActiveTab(cat.label);
                        document.getElementById('dukkan')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      onMouseEnter={() => { hoveredRef.current = cat.label; setHoveredCategory(cat.label); }}
                      onMouseLeave={() => { hoveredRef.current = null; setHoveredCategory(null); }}
                    >
                      <span className={`w-14 h-14 md:w-16 md:h-16 rounded-full border flex items-center justify-center transition-all duration-300
                        ${isActive
                          ? 'bg-[#1A0F08] border-[#1A0F08] text-[#FAF6EF] scale-110 shadow-[0_6px_24px_rgba(26,15,8,0.28)]'
                          : 'bg-[#EDE3D8] border-[#D8C8B4] text-[#7B4528] group-hover:bg-[#1A0F08] group-hover:text-[#FAF6EF] group-hover:border-[#1A0F08] group-hover:scale-105'
                        }`}>
                        {cat.icon}
                      </span>
                      <span className={`font-mono text-[0.5rem] md:text-[0.55rem] tracking-[0.12em] uppercase text-center transition-colors duration-300
                        ${isActive ? 'text-[#1A0F08] font-semibold' : 'text-[#9E8E7E] group-hover:text-[#1A0F08]'}`}>
                        {cat.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        <div className="relative py-3.5 md:py-4 overflow-hidden whitespace-nowrap border-y border-[#3E2B1E] animate-gradient-bg shadow-[inset_0_0_20px_rgba(0,0,0,0.6)]">
          <div className="animate-ticker flex items-center cursor-default">
            {[...Array(2)].map((_, ri) => (
              <span key={ri} className="flex items-center">
                {["%100 Arabica", "80+ Q-Grader Puanı", "Siparişe Özel Kavrum", "Özel Harmanlar", "Ankara Merkezli", "Erişilebilir Kalite", "Taze Teslimat", "Uzman Profiller"].map((t, i) => (
                  <span key={i} className="flex items-center font-mono text-[0.55rem] md:text-[0.65rem] tracking-[0.2em] uppercase text-[#FAF6EF]/90 px-4">
                    {t}
                    <svg className="w-3 h-3 text-[#C17A3A] animate-[spin_4s_linear_infinite] ml-8 md:ml-12 mr-4 md:mr-8 opacity-80" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2l2.4 7.6 7.6 2.4-7.6 2.4L12 22l-2.4-7.6-7.6-2.4 7.6-2.4L12 2z" />
                    </svg>
                  </span>
                ))}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ─── 2. SİZİN İÇİN SEÇTİKLERİMİZ ─── */}
      <div ref={picksContainerRef} style={{ height: '350vh' }} className="border-b border-[#E5D8C5]">
        <section className="sticky top-0 h-screen bg-[#F5EEE6] overflow-hidden">

          {/* Content */}
          <div className="h-full flex flex-col max-w-[1440px] mx-auto w-full px-4 md:px-10" style={{ paddingTop: '154px', paddingBottom: '24px' }}>

            {/* Header — dükkan bölümüyle aynı stil */}
            <div className="text-center mb-8 md:mb-10 shrink-0">
              <p className="font-mono text-[0.5rem] tracking-[0.3em] uppercase text-[#9E8E7E] mb-3">Öne Çıkanlar</p>
              <h2 className="font-serif text-[clamp(2rem,4vw,3.5rem)] text-[#1A0F08] leading-none">
                Sizin İçin <em className="italic text-[#C17A3A]">Seçtiklerimiz</em>
              </h2>
            </div>

            {/* Product grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-x-5 gap-y-8 md:gap-x-7 items-start">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i}><SkeletonCard /></div>
                ))
              ) : (
                allProducts.slice(0, 4).map((p, idx) => {
                  const SETTLE = [0.24, 0.46, 0.68, 0.90][idx];
                  const RANGE = 0.18;
                  const t = Math.max(0, Math.min(1, (picksProgress - (SETTLE - RANGE)) / RANGE));
                  return (
                    <div
                      key={`picks-${p.id}`}
                      className="w-full"
                      style={{
                        opacity: t,
                        transform: `translateY(${-80 * (1 - t)}px)`,
                        transition: 'none',
                      }}
                    >
                      <ProductCard p={p} onAdd={addToCart} />
                    </div>
                  );
                })
              )}
            </div>

            {/* Bottom progress dots */}
            <div
              className="shrink-0 flex items-center justify-center gap-2 pt-5"
              style={{ opacity: picksProgress > 0.10 ? 1 : 0, transition: 'opacity 0.6s ease' }}
            >
              {[0, 1, 2, 3].map(i => {
                const settled = picksProgress >= [0.24, 0.46, 0.68, 0.90][i];
                return (
                  <span key={i} className="block rounded-full transition-all duration-300" style={{
                    width: settled ? '16px' : '6px',
                    height: '6px',
                    backgroundColor: settled ? '#C17A3A' : 'rgba(193,122,58,0.25)',
                  }} />
                );
              })}
            </div>
          </div>
        </section>
      </div>

      {/* ─── 3. DÜKKAN (KAYDIRILABİLİR KATEGORİLER) ─── */}
      <section id="dukkan" className="bg-[#F5EEE6] border-b border-[#E5D8C5] overflow-hidden scroll-mt-20">
        <div ref={shopReveal.ref} className={`max-w-[1440px] mx-auto pt-16 md:pt-24 pb-16 md:pb-24 transition-all duration-[1000ms] ease-out ${shopReveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}>
          
          {/* Ortalanmış Başlık ve Sekmeler */}
          <div className="px-4 md:px-10 flex flex-col items-center text-center justify-center mb-10 md:mb-14 gap-6 md:gap-8">
            <div>
              <p className="font-mono text-[0.5rem] tracking-[0.3em] uppercase text-[#9E8E7E] mb-3">Koleksiyon</p>
              <h2 className="font-serif text-[clamp(2rem,4vw,3.5rem)] text-[#1A0F08] leading-none">
                Kahve <em className="italic text-[#C17A3A]">Dükkanı</em>
              </h2>
            </div>

            {/* Tab Butonları (Başlığın Altında Ortalanmış) */}
            <div className="flex flex-wrap justify-center gap-2 md:gap-4">
              {CATEGORY_LABELS.map(tab => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`font-mono text-[0.6rem] tracking-[0.15em] uppercase px-6 py-3 rounded-full transition-all duration-300 ${
                    activeTab === tab 
                    ? 'bg-[#1A0F08] text-[#FAF6EF]' 
                    : 'border border-[#D8C8B4] text-[#7B4528] hover:border-[#1A0F08] hover:text-[#1A0F08]'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Scrollable Container */}
          <div className="w-full overflow-hidden pl-4 md:pl-10">
            <div className="flex overflow-x-auto gap-6 pb-10 pt-4 snap-x snap-mandatory scrollbar-hide pr-10">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <div key={i} className="snap-start"><SkeletonCard /></div>)
              ) : activeProducts.length > 0 ? (
                activeProducts.map((p) => (
                  <div key={`shop-${p.id}`} className="min-w-[260px] md:min-w-[300px] max-w-[300px] snap-start shrink-0">
                    <ProductCard p={p} onAdd={addToCart} />
                  </div>
                ))
              ) : (
                <div className="w-full flex items-center justify-center py-20 text-[#9E8E7E] font-mono text-sm tracking-widest uppercase">
                  Bu kategoride ürün bulunamadı.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ─── 4. BİLGİ ŞERİDİ (FEATURES BANNER) ─── */}
      <section className="bg-[#1A0F08] py-16 md:py-20 border-y border-[#1A0F08]">
        <div className="max-w-[1440px] mx-auto px-6 md:px-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-y-10 gap-x-4 md:gap-6 md:divide-x divide-[#3E2B1E]">
            {[
              { title: "HEP TAZE", subtitle: "Haftalık kavrulur" },
              { title: "ÖZEL ÖĞÜTME", subtitle: "Tam istediğin gibi" },
              { title: "ZENGİN AROMA", subtitle: "Tadı damağında" },
              { title: "DİKKAT!", subtitle: "Bağımlılık yapar" }
            ].map((feat, i) => (
              <div key={i} className="flex flex-col items-center text-center">
                <h4 className="font-serif text-lg sm:text-xl md:text-2xl text-[#C17A3A] mb-2">{feat.title}</h4>
                <p className="font-mono text-[0.55rem] sm:text-[0.6rem] md:text-[0.65rem] tracking-[0.1em] md:tracking-[0.2em] uppercase text-[#FAF6EF]/60">{feat.subtitle}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 5. SIKÇA SORULAN SORULAR (FAQ) ─── */}
      <section className="bg-[#FDFAF6] border-b border-[#E5E5E5]">
        <div className="max-w-[1440px] mx-auto px-4 md:px-10 pt-16 md:pt-24 pb-16 md:pb-24">
          <div className="text-center mb-12 md:mb-16">
            <p className="font-mono text-[0.5rem] tracking-[0.3em] uppercase text-[#9E8E7E] mb-3">Merak Ettikleriniz</p>
            <h2 className="font-serif text-[clamp(2rem,3.5vw,3rem)] text-[#1A0F08] leading-none">
              Sıkça Sorulan <em className="italic text-[#C17A3A]">Sorular</em>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-12 gap-y-4 md:gap-y-8">
            {FAQ_DATA.map((faq, index) => (
              <FaqItem key={index} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── 6. KAHVEYE BAKIŞIMIZ ─── */}
      {/* mb-16 md:mb-24 eklenerek, alt taraftaki muhtemel koyu renkli footer ile arasında boşluk (body rengi) bırakıldı */}
      <section className="bg-[#F5EEE6] overflow-hidden mb-16 md:mb-24">
        <div ref={storyReveal.ref} className={`max-w-[1440px] mx-auto transition-all duration-[1200ms] ease-out ${storyReveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}>
          <div className="grid grid-cols-1 lg:grid-cols-2">
            <div className="aspect-square lg:aspect-auto lg:h-[600px] w-full overflow-hidden">
              <img 
                src="https://images.unsplash.com/photo-1611162458324-aae1eb4129a4?q=80&w=1200&auto=format&fit=crop" 
                alt="Kahve Kavurma Atölyesi" 
                className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
              />
            </div>
            
            <div className="flex flex-col justify-center p-8 md:p-16 lg:p-24 bg-[#1A0F08] text-[#FAF6EF]">
              <p className="font-mono text-[0.5rem] tracking-[0.3em] uppercase text-[#C17A3A] mb-4 flex items-center gap-3">
                <span className="block w-6 h-[1px] bg-[#C17A3A]" />
                Ankara Atölyesi
              </p>
              <h2 className="font-serif text-[clamp(2rem,3.5vw,3rem)] leading-[1.1] mb-6">
                Kahveye <em className="italic text-[#C17A3A]">Bakışımız</em>
              </h2>
              <p className="font-sans font-light text-[0.95rem] leading-relaxed text-[#FAF6EF]/80 mb-8 max-w-[480px]">
                Kahve bizim için sadece bir içecek değil, çekirdeğin tarladan fincana uzanan o muazzam yolculuğuna duyduğumuz saygıdır. Nitelikli yeşil çekirdekleri özenle seçiyor, atölyemizde profillerine en uygun şekilde haftalık olarak kavuruyoruz. Amacımız her yudumda dürüst, kompleks ve tadı damağınızda kalacak o kusursuz fincanı sunmak.
              </p>
              <a href="/hakkimizda" className="inline-flex items-center gap-2 font-mono text-[0.6rem] tracking-[0.2em] uppercase text-[#C17A3A] hover:text-[#FAF6EF] transition-colors w-max pb-1 border-b border-[#C17A3A] hover:border-[#FAF6EF]">
                Hikayemizi Okuyun <span>→</span>
              </a>
            </div>
          </div>
        </div>
      </section>
      
    </div>
  );
}