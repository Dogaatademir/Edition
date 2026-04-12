// src/pages/Urun.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Minus, 
  Plus, 
  Truck, 
  ShieldCheck, 
  Coffee,
  ChevronDown,
  ChevronUp,
  ArrowLeft
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { fetchShopifyProductByHandle, type CoffeeProduct, type ProductVariant } from '../lib/shopify';

// --- ÖZEL İKONLAR (ÖĞÜTME DERECELERİ İÇİN) ---
const grindOptions = [
  {
    id: 'Çekirdek',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22C6.5 22 2 17.5 2 12S6.5 2 12 2s10 4.5 10 10-4.5 10-10 10z"/>
        <path d="M12 22c-2-4-2-16 0-20"/>
      </svg>
    )
  },
  {
    id: 'French Press',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="7" y="6" width="10" height="16" rx="1" />
        <path d="M17 10h2a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-2" />
        <line x1="12" y1="2" x2="12" y2="6" />
        <line x1="9" y1="2" x2="15" y2="2" />
      </svg>
    )
  },
  {
    id: 'V60',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 3h16l-5.5 11h-5L4 3z" />
        <path d="M9.5 14v6a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-6" />
      </svg>
    )
  },
  {
    id: 'Chemex',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 3h8l-2.5 8h-3L8 3z" />
        <path d="M9.5 11C7 11 5 13.5 5 17v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2c0-3.5-2-6-4.5-6" />
        <line x1="8" y1="11" x2="16" y2="11" />
      </svg>
    )
  }
];

// --- YARDIMCI BİLEŞENLER ---
const QuantitySelector = ({ quantity, setQuantity }: { quantity: number, setQuantity: (q: number) => void }) => (
  <div className="flex items-center border border-[#E5E5E5] h-12 w-32 bg-[#FFFFFF]">
    <button 
      onClick={() => setQuantity(Math.max(1, quantity - 1))}
      className="flex-1 flex items-center justify-center text-[#000000] hover:bg-[#FAFAFA] transition-colors h-full border-r border-[#E5E5E5]"
    >
      <Minus className="w-4 h-4" />
    </button>
    <span className="flex-1 text-center font-mono font-bold text-[#000000] text-sm">{quantity}</span>
    <button 
      onClick={() => setQuantity(quantity + 1)}
      className="flex-1 flex items-center justify-center text-[#000000] hover:bg-[#FAFAFA] transition-colors h-full border-l border-[#E5E5E5]"
    >
      <Plus className="w-4 h-4" />
    </button>
  </div>
);

const AccordionItem = ({ title, children, isOpen, onClick }: { title: string, children: React.ReactNode, isOpen: boolean, onClick: () => void }) => (
  <div className="border-b border-[#E5E5E5]">
    <button 
      onClick={onClick}
      className="w-full py-5 flex items-center justify-between text-left group bg-[#FFFFFF] hover:bg-[#FAFAFA] transition-colors px-2"
    >
      <span className="font-mono text-[0.65rem] tracking-[0.15em] uppercase text-[#000000]">
        {title}
      </span>
      {isOpen ? <ChevronUp className="w-4 h-4 text-[#000000]" /> : <ChevronDown className="w-4 h-4 text-[#888888]" />}
    </button>
    <div className={`overflow-hidden transition-all duration-300 ease-in-out px-2 ${isOpen ? 'max-h-96 opacity-100 pb-5' : 'max-h-0 opacity-0'}`}>
      <div className="text-[#555555] font-sans font-light leading-relaxed text-[0.9rem]">
        {children}
      </div>
    </div>
  </div>
);

// --- ANA BİLEŞEN ---
const Urun = () => {
  const { id: handle } = useParams(); 
  const navigate = useNavigate();
  
  const { addToCart, totalPrice } = useCart();
  
  const [product, setProduct] = useState<CoffeeProduct | null>(null);
  const [loading, setLoading] = useState(true);

  // Stateler
  const [quantity, setQuantity] = useState(1);
  const [openSection, setOpenSection] = useState<string | null>('desc');
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [grind, setGrind] = useState<string>('Çekirdek');
  const [viewers, setViewers] = useState(Math.floor(Math.random() * 11) + 10);
  
  // Floating Bar Stateleri
  const [showStickyBar, setShowStickyBar] = useState(false);
  const addToCartRef = useRef<HTMLDivElement>(null);

  // Ürün Çekme
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (!handle) return;
    
    setLoading(true);
    fetchShopifyProductByHandle(handle)
      .then(data => {
        setProduct(data);
        if (data && data.variants && data.variants.length > 0) {
          setSelectedVariant(data.variants[0]);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [handle]);

  // İzleyici Simülasyonu
  useEffect(() => {
    const interval = setInterval(() => {
      setViewers(prev => {
        const diff = Math.floor(Math.random() * 3) - 1;
        let next = prev + diff;
        if (next < 10) next = 10;
        if (next > 20) next = 20;
        return next;
      });
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  // Sticky Bar Scroll Dinleyicisi (Sadece Buton Altına İnildiğinde)
  useEffect(() => {
    const handleScroll = () => {
      if (addToCartRef.current) {
        const rect = addToCartRef.current.getBoundingClientRect();
        setShowStickyBar(rect.bottom < 130);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [product]);

  if (loading) {
    return (
      <main className="bg-[#FFFFFF] min-h-screen pt-28 pb-20 flex items-center justify-center">
         <div className="animate-pulse flex flex-col items-center">
            <Coffee className="w-8 h-8 text-[#E5E5E5] mb-4 animate-spin-slow" />
            <span className="font-mono text-[0.65rem] tracking-[0.2em] text-[#888888] uppercase">Seçki Hazırlanıyor...</span>
         </div>
      </main>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FFFFFF] text-[#000000] border-t border-[#E5E5E5]">
        <div className="font-mono text-[0.8rem] tracking-[0.15em] text-[#888888] uppercase mb-4">
          Hata 404
        </div>
        <p className="font-serif text-[2rem] mb-8">Aradığınız seçki bulunamadı.</p>
        <button 
          onClick={() => navigate('/kahveler')} 
          className="font-mono text-[0.65rem] tracking-[0.15em] uppercase text-[#FFFFFF] bg-[#000000] border border-[#000000] px-8 py-3 transition-colors hover:bg-[#555555] hover:border-[#555555]"
        >
          Seçkiye Dön
        </button>
      </div>
    );
  }

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  const handleAddToCart = () => {
    let cartProductName = product.name;
    
    if (selectedVariant && selectedVariant.weight !== "Default Title") {
      cartProductName += ` - ${selectedVariant.weight}`;
    }
    
    if (product.category.includes('filtre')) cartProductName += ` (${grind})`;

    const cartProductObj = {
      ...product,
      id: Date.now().toString(), 
      variantId: selectedVariant ? selectedVariant.id : product.variants?.[0]?.id,
      name: cartProductName,
      price: selectedVariant ? selectedVariant.price : product.price,
    };

    addToCart(cartProductObj as any, quantity); 
  };

  const displayPrice = selectedVariant ? selectedVariant.price : product.price;
  const displayOldPrice = selectedVariant ? selectedVariant.oldPrice : product.oldPrice;
  const isFiltre = product.category.includes('filtre');

  const freeShippingThreshold = 750;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - totalPrice);
  const progressPercentage = Math.min(100, (totalPrice / freeShippingThreshold) * 100);

  return (
    <>
      <main className="bg-[#FFFFFF] min-h-screen pt-28 pb-32 font-sans selection:bg-[#000000] selection:text-[#FFFFFF]">
        <div className="mx-auto max-w-[1440px] px-6 md:px-10">
          
          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-3 font-mono text-[0.55rem] tracking-[0.2em] uppercase text-[#888888] mb-8 pb-4 border-b border-[#E5E5E5]">
            <Link to="/kahveler" className="hover:text-[#000000] transition-colors flex items-center gap-1.5">
              <ArrowLeft className="w-3 h-3" /> Tüm Seçki
            </Link>
            <span className="opacity-30">/</span>
            <span className="text-[#000000]">{product.name}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 border border-[#E5E5E5] bg-[#FAFAFA]">
            
            {/* SOL: GÖRSEL ALANI (KAPSAYICI) */}
            <div className="w-full border-b lg:border-b-0 lg:border-r border-[#E5E5E5] bg-[#FFFFFF]">
              
              {/* YAPIŞKAN (STICKY) GÖRSEL */}
              <div className="relative w-full aspect-square lg:aspect-auto lg:h-[calc(100vh-130px)] lg:sticky lg:top-[130px] flex items-center justify-center overflow-hidden p-12 lg:p-20 group">

                {product.image ? (
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="h-full w-full object-contain mix-blend-multiply transition-transform duration-1000 group-hover:scale-105 z-10"
                  />
                ) : (
                  <svg width="120" height="120" viewBox="0 0 80 80" fill="none" className="opacity-20 z-10">
                    <ellipse cx="40" cy="40" rx="28" ry="36" stroke="#000000" strokeWidth="1.5" />
                    <path d="M40 10 Q55 25 55 40 Q55 55 40 70" stroke="#000000" strokeWidth="1.5" strokeDasharray="3 3" />
                    <path d="M40 10 Q25 25 25 40 Q25 55 40 70" stroke="#000000" strokeWidth="1" strokeDasharray="2 4" />
                    <ellipse cx="40" cy="40" rx="4" ry="6" stroke="#000000" strokeWidth="1" />
                  </svg>
                )}
                
                <div className="absolute top-6 left-6 flex flex-col gap-2 z-20">
                   <span className="font-mono text-[0.6rem] tracking-[0.2em] text-[#888888] uppercase">
                     {product.code || 'NO-CODE'}
                   </span>
                   {product.badge && (
                     <span className="font-mono text-[0.55rem] font-semibold tracking-[0.15em] uppercase text-[#FFFFFF] bg-[#000000] px-3 py-1 self-start">
                       {product.badge}
                     </span>
                   )}
                </div>

                <div className="absolute bottom-6 right-6 z-20">
                   <span className="font-mono text-[0.55rem] tracking-[0.2em] text-[#555555] uppercase border border-[#E5E5E5] px-3 py-1 bg-[#FFFFFF]">
                     {product.roast || 'Özel Kavrum'}
                   </span>
                </div>
              </div>
              
            </div>

            {/* SAĞ: BİLGİ ALANI */}
            <div className="flex flex-col p-8 lg:p-14 bg-[#FFFFFF]">
              
              <div className="mb-6">
                <div className="font-mono text-[0.6rem] tracking-[0.2em] uppercase text-[#888888] mb-3 flex items-center gap-2 before:content-[''] before:block before:w-5 before:h-[1px] before:bg-[#888888]">
                  {product.origin || 'Bilinmeyen Köken'} {product.process ? `· ${product.process}` : ''}
                </div>

                <h1 className="font-serif text-[clamp(2rem,3.5vw,3.5rem)] text-[#000000] leading-[1.05] tracking-[-0.02em] mb-6">
                  {product.name}
                </h1>
                
                <div className="flex items-end gap-4 border-b border-[#E5E5E5] pb-6">
                  <span className="font-mono text-[1.5rem] text-[#000000] font-semibold tracking-tight transition-all">
                    {displayPrice}
                  </span>
                  {displayOldPrice && (
                    <span className="font-mono text-[1rem] text-[#888888] line-through mb-1">
                      {displayOldPrice}
                    </span>
                  )}
                </div>
              </div>

              {/* SEÇENEKLER ALANI (GRAMAJ VE ÖĞÜTME) */}
              <div className="mb-8">
                {product.variants && product.variants.length > 0 && product.variants[0].weight !== "Default Title" && (
                  <div className="mb-6">
                    <span className="font-mono text-[0.6rem] tracking-[0.15em] text-[#888888] uppercase block mb-3">Gramaj Seçimi</span>
                    <div className="flex flex-wrap gap-3">
                      {product.variants.map((variant) => (
                        <button
                          key={variant.id}
                          onClick={() => setSelectedVariant(variant)}
                          className={`px-5 py-2.5 border font-mono text-[0.65rem] tracking-[0.15em] uppercase transition-colors ${
                            selectedVariant?.id === variant.id 
                              ? 'border-[#000000] bg-[#000000] text-[#FFFFFF]' 
                              : 'border-[#E5E5E5] bg-[#FFFFFF] text-[#555555] hover:border-[#000000]'
                          }`}
                        >
                          {variant.weight}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {isFiltre && (
                  <div className="mb-6">
                    <span className="font-mono text-[0.6rem] tracking-[0.15em] text-[#888888] uppercase block mb-3">Öğütme Derecesi</span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {grindOptions.map((g) => (
                        <button
                          key={g.id}
                          onClick={() => setGrind(g.id)}
                          className={`flex flex-col items-center justify-center gap-3 p-4 border transition-all duration-300 ${
                            grind === g.id 
                              ? 'border-[#000000] bg-[#000000] text-[#FFFFFF] shadow-sm' 
                              : 'border-[#E5E5E5] bg-[#FFFFFF] text-[#555555] hover:border-[#000000] hover:text-[#000000]'
                          }`}
                        >
                          <div className={`transition-transform duration-300 ${grind === g.id ? 'scale-110' : ''}`}>
                            {g.icon}
                          </div>
                          <span className="font-mono text-[0.55rem] tracking-[0.05em] uppercase text-center">
                            {g.id}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Kısa Açıklama */}
              <p className="text-[#555555] font-sans font-light text-[0.95rem] leading-[1.85] mb-10 line-clamp-3">
                {product.description}
              </p>

              {/* SEPET İŞLEMLERİ */}
              <div className="flex flex-col gap-5 mb-12" ref={addToCartRef}>
                <div className="flex flex-col sm:flex-row gap-4">
                  <QuantitySelector quantity={quantity} setQuantity={setQuantity} />
                  <button 
                    onClick={handleAddToCart}
                    className="flex-1 flex items-center justify-center gap-3 py-4 font-mono text-[0.65rem] font-bold tracking-[0.2em] uppercase transition-colors border border-[#000000] bg-[#000000] text-[#FFFFFF] hover:bg-[#555555] hover:border-[#555555]"
                  >
                    Sepete Ekle
                  </button>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2.5 font-sans font-light text-[0.8rem] text-[#555555] bg-[#FAFAFA] border border-[#E5E5E5] px-4 py-2 w-max">
                    <span className="text-[1rem]">👀</span>
                    <span><strong className="text-[#000000] font-medium">{viewers}</strong> müşteri bu ürünü görüntülüyor</span>
                  </div>

                  <div className="bg-[#FAFAFA] border border-[#E5E5E5] px-4 py-3 flex flex-col gap-2.5">
                    <div className="font-sans text-[0.8rem] text-[#555555]">
                      {remainingForFreeShipping > 0 ? (
                        <>Ücretsiz Kargo için <strong className="text-[#000000] font-medium">{remainingForFreeShipping.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</strong> değerinde ürün ekleyin.</>
                      ) : (
                        <span className="text-[#000000] font-medium">🎉 Sepetiniz ücretsiz kargo hakkı kazandı!</span>
                      )}
                    </div>
                    <div className="h-1.5 w-full bg-[#E5E5E5] overflow-hidden">
                      <div 
                        className="h-full bg-[#000000] transition-all duration-700 ease-out"
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Dinamik Accordion Bölümü */}
              <div className="mb-10 border-t border-[#E5E5E5]">
                <AccordionItem 
                  title="Profil Özellikleri" 
                  isOpen={openSection === 'desc'} 
                  onClick={() => toggleSection('desc')}
                >
                  {product.process || product.roast || (product.notes && product.notes.length > 0) ? (
                    <>
                      Bu nitelikli harmanımız {product.process ? `${product.process} işlem görmüş olup, ` : ''} 
                      {product.roast ? `${product.roast} profilinde kavrulmaktadır.` : ''}
                      {product.notes && product.notes.length > 0 && ` Fincanınızda ${product.notes.join(', ')} gibi karakteristik notaları ön plana çıkarır.`}
                    </>
                  ) : (
                    "Bu kahvenin profil özellikleri atölyemizde özenle saklanmaktadır."
                  )}
                </AccordionItem>
                
                <AccordionItem 
                  title="Demleme Önerisi" 
                  isOpen={openSection === 'usage'} 
                  onClick={() => toggleSection('usage')}
                >
                  {product.brewingGuide}
                </AccordionItem>

                <AccordionItem 
                  title="Taze Teslimat" 
                  isOpen={openSection === 'delivery'} 
                  onClick={() => toggleSection('delivery')}
                >
                  Kahvelerimiz siparişiniz üzerine atölyemizde taze olarak kavrulur ve degassing (gaz salınımı) süreci göz önünde bulundurularak valfli özel ambalajlarında kargoya teslim edilir.
                </AccordionItem>
              </div>

              {/* İkonlu Özellikler */}
              <div className="grid grid-cols-3 gap-6 pt-6 opacity-80">
                <div className="flex flex-col items-start gap-2 border-l-2 border-[#E5E5E5] pl-4">
                  <Coffee className="w-5 h-5 text-[#000000]" strokeWidth={1.5} />
                  <span className="font-mono text-[0.55rem] uppercase tracking-[0.15em] text-[#555555]">Özel Harman</span>
                </div>
                <div className="flex flex-col items-start gap-2 border-l-2 border-[#E5E5E5] pl-4">
                  <Truck className="w-5 h-5 text-[#000000]" strokeWidth={1.5} />
                  <span className="font-mono text-[0.55rem] uppercase tracking-[0.15em] text-[#555555]">Taze Teslimat</span>
                </div>
                <div className="flex flex-col items-start gap-2 border-l-2 border-[#E5E5E5] pl-4">
                  <ShieldCheck className="w-5 h-5 text-[#000000]" strokeWidth={1.5} />
                  <span className="font-mono text-[0.55rem] uppercase tracking-[0.15em] text-[#555555]">Güvenli Ödeme</span>
                </div>
              </div>

            </div>
          </div>
          
          {/* TAM GENİŞLİKTE UZUN AÇIKLAMA BÖLÜMÜ */}
          <div className="mt-16 md:mt-24 border-t border-[#E5E5E5] pt-16 md:pt-24 pb-12 relative overflow-hidden">
            <div className="max-w-[900px] mx-auto relative z-10 flex flex-col items-center">
              <span className="font-mono text-[0.6rem] tracking-[0.3em] uppercase text-[#888888] mb-4 flex items-center gap-2 before:content-[''] before:block before:w-5 before:h-[1px] before:bg-[#888888] after:content-[''] after:block after:w-5 after:h-[1px] after:bg-[#888888]">
                Hikayesi & Profili
              </span>
              <h2 className="font-serif text-[clamp(2rem,4vw,3rem)] text-[#000000] leading-[1.1] tracking-[-0.02em] mb-10 text-center">
                Bu Seçkiyi <em className="italic text-[#555555]">Yakından Tanıyın</em>
              </h2>
              <div className="font-sans font-light text-[1rem] md:text-[1.1rem] leading-[2.2] text-[#555555] whitespace-pre-line text-center md:text-justify px-4">
                {product.description}
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* YAPIŞKAN (STICKY) SEPETE EKLE BARI VE SEÇİCİLER */}
      <div 
        className={`fixed bottom-0 left-0 right-0 z-50 bg-[#FFFFFF] border-t border-[#E5E5E5] p-3 md:p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.06)] transform transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${showStickyBar ? 'translate-y-0' : 'translate-y-full'}`}
      >
        <div className="max-w-[1440px] mx-auto w-full flex items-center justify-between px-2 md:px-10">
          
          <div className="flex items-center gap-3 md:gap-6">
            {product.image ? (
              <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-[#FAFAFA] border border-[#E5E5E5] p-1 flex items-center justify-center shrink-0">
                <img src={product.image} alt={product.name} className="w-full h-full object-contain mix-blend-multiply" />
              </div>
            ) : (
              <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-[#FAFAFA] border border-[#E5E5E5] p-1 flex items-center justify-center shrink-0">
                <Coffee className="w-5 h-5 text-[#888888] opacity-50" />
              </div>
            )}
            
            <div className="flex flex-col justify-center gap-1.5">
              <span className="font-serif text-[0.95rem] md:text-[1.1rem] text-[#000000] leading-none">{product.name}</span>
              
              <div className="flex items-center gap-2">
                {/* Gramaj Açılır Menüsü */}
                {product.variants && product.variants.length > 0 && product.variants[0].weight !== "Default Title" && (
                  <div className="relative">
                    <select 
                      value={selectedVariant?.id || ''} 
                      onChange={(e) => {
                        const variant = product.variants.find(v => v.id === e.target.value);
                        if (variant) setSelectedVariant(variant);
                      }}
                      className="appearance-none bg-transparent border border-[#E5E5E5] px-2 py-1 pr-6 font-mono text-[0.5rem] md:text-[0.55rem] tracking-[0.05em] uppercase text-[#555555] hover:text-[#000000] hover:border-[#888888] focus:outline-none transition-colors cursor-pointer"
                    >
                      {product.variants.map(v => (
                        <option key={v.id} value={v.id}>{v.weight}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-[#888888] pointer-events-none" />
                  </div>
                )}

                {/* Öğütme Açılır Menüsü */}
                {isFiltre && (
                  <div className="relative">
                    <select 
                      value={grind} 
                      onChange={(e) => setGrind(e.target.value)}
                      className="appearance-none bg-transparent border border-[#E5E5E5] px-2 py-1 pr-6 font-mono text-[0.5rem] md:text-[0.55rem] tracking-[0.05em] uppercase text-[#555555] hover:text-[#000000] hover:border-[#888888] focus:outline-none transition-colors cursor-pointer"
                    >
                      {grindOptions.map(g => (
                        <option key={g.id} value={g.id}>{g.id}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-[#888888] pointer-events-none" />
                  </div>
                )}

                {/* Eğer hiçbir seçici yoksa sadece kavrum tipini göster */}
                {(!product.variants || product.variants.length === 0 || product.variants[0].weight === "Default Title") && !isFiltre && (
                  <span className="font-mono text-[0.5rem] md:text-[0.55rem] tracking-[0.1em] text-[#888888] uppercase">
                    {product.roast || 'Özel Kavrum'}
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4 md:gap-8">
            <div className="flex-col items-end hidden md:flex">
              {displayOldPrice && <span className="font-mono text-[0.55rem] line-through text-[#888888] mb-0.5">{displayOldPrice}</span>}
              <span className="font-mono font-semibold text-[1.1rem] text-[#000000] leading-none">{displayPrice}</span>
            </div>
            
            <button 
              onClick={handleAddToCart}
              className="flex items-center justify-center font-mono text-[0.6rem] md:text-[0.65rem] font-bold tracking-[0.2em] uppercase transition-colors border border-[#000000] bg-[#000000] text-[#FFFFFF] px-6 py-3.5 md:px-10 md:py-4 hover:bg-[#555555] hover:border-[#555555] whitespace-nowrap"
            >
              Sepete Ekle
            </button>
          </div>

        </div>
      </div>
    </>
  );
};

export default Urun;