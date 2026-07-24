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
  ArrowLeft,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { fetchShopifyProductByHandle, type CoffeeProduct, type ProductVariant } from '../lib/shopify';
import ProductInfoSection from '../components/ProductInfoSection';
import { useMetaProductView } from '../hooks/useMetaAnalytics';

const grindOptions = [
  { id: 'Çekirdek',      image: '/highlightcovers/cekirdek.png'     },
  { id: 'Espresso',      image: '/highlightcovers/espresso.png'     },
  { id: 'French Press',  image: '/highlightcovers/french_press.png' },
  { id: 'V60',           image: '/highlightcovers/v60.png'          },
  { id: 'Chemex',        image: '/highlightcovers/chemex.png'       },
  { id: 'Kağıt Filtre',  image: '/highlightcovers/kagit_filtre.png' },
];

// --- YARDIMCI BİLEŞENLER ---
const QuantitySelector = ({ quantity, setQuantity }: { quantity: number, setQuantity: (q: number) => void }) => (
  <div className="flex items-center border border-[#1b1b1b]/15 h-12 w-32 bg-[#fdfaf6]">
    <button 
      onClick={() => setQuantity(Math.max(1, quantity - 1))}
      className="flex-1 flex items-center justify-center text-[#1b1b1b] hover:bg-[#f0e8dc] transition-colors h-full border-r border-[#1b1b1b]/15"
    >
      <Minus className="w-4 h-4" />
    </button>
    <span className="flex-1 text-center font-mono font-bold text-[#1b1b1b] text-sm">{quantity}</span>
    <button 
      onClick={() => setQuantity(quantity + 1)}
      className="flex-1 flex items-center justify-center text-[#1b1b1b] hover:bg-[#f0e8dc] transition-colors h-full border-l border-[#1b1b1b]/15"
    >
      <Plus className="w-4 h-4" />
    </button>
  </div>
);

const AccordionItem = ({ title, children, isOpen, onClick }: { title: string, children: React.ReactNode, isOpen: boolean, onClick: () => void }) => (
  <div className="border-b border-[#1b1b1b]/15">
    <button 
      onClick={onClick}
      className="w-full py-5 flex items-center justify-between text-left group bg-[#fdfaf6] hover:bg-[#f0e8dc] transition-colors px-2"
    >
      <span className="font-mono text-[0.65rem] tracking-[0.15em] uppercase text-[#1b1b1b]">
        {title}
      </span>
      {isOpen ? <ChevronUp className="w-4 h-4 text-[#1b1b1b]" /> : <ChevronDown className="w-4 h-4 text-[#7b6a5c]" />}
    </button>
    <div className={`overflow-hidden transition-all duration-300 ease-in-out px-2 ${isOpen ? 'max-h-96 opacity-100 pb-5' : 'max-h-0 opacity-0'}`}>
      <div className="text-[#5c4635] font-sans font-light leading-relaxed text-[0.9rem]">
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

  const [quantity, setQuantity] = useState(1);
  const [openSection, setOpenSection] = useState<string | null>('desc');
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [grind, setGrind] = useState<string>('Çekirdek');
  const [viewers, setViewers] = useState(Math.floor(Math.random() * 11) + 10);
  
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [imageHovered, setImageHovered] = useState(false);
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

  // Meta Pixel — ViewContent (ürün yüklenince tetiklenir)
  useMetaProductView(
    product
      ? {
          id:    product.id,
          title: product.name ?? '',
          price: parseFloat(
            String(selectedVariant?.price ?? product.price ?? 0)
              .replace(/[^\d.,]/g, '')
              .replace(',', '.')
          ) || 0,
        }
      : null
  );

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

  // Sticky Bar
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
      <main className="bg-[#fdfaf6] min-h-screen pt-28 pb-20 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <Coffee className="w-8 h-8 text-[#1b1b1b/20] mb-4 animate-spin-slow" />
          <span className="font-mono text-[0.65rem] tracking-[0.2em] text-[#7b6a5c] uppercase">Seçki Hazırlanıyor...</span>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#fdfaf6] text-[#1b1b1b] border-t border-[#1b1b1b]/15">
        <div className="font-mono text-[0.8rem] tracking-[0.15em] text-[#7b6a5c] uppercase mb-4">
          Hata 404
        </div>
        <p className="font-serif text-[2rem] mb-8">Aradığınız seçki bulunamadı.</p>
        <button 
          onClick={() => navigate('/kahveler')} 
          className="font-mono text-[0.65rem] tracking-[0.15em] uppercase text-[#f7f0e7] bg-[#1b1b1b] border border-[#1b1b1b] px-8 py-3 transition-colors hover:bg-[#3a3530] hover:border-[#3a3530]"
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
    
    const showsGrind = product.category.includes('filtre') || product.category.includes('espresso');
    if (showsGrind) cartProductName += ` (${grind})`;

    const cartProductObj = {
      ...product,
      id: Date.now().toString(),
      variantId: selectedVariant ? selectedVariant.id : product.variants?.[0]?.id,
      name: cartProductName,
      price: selectedVariant ? selectedVariant.price : product.price,
      grind: showsGrind ? grind : undefined,
    };

    addToCart(cartProductObj as any, quantity); 
  };

  const displayPrice = selectedVariant ? selectedVariant.price : product.price;
  const displayOldPrice = selectedVariant ? selectedVariant.oldPrice : product.oldPrice;
  const isFiltre = product.category.includes('filtre') || product.category.includes('espresso');
  const mainImage = selectedVariant?.image ?? product.image;
  const secondImage = selectedVariant?.hoverImage ?? null;

  const freeShippingThreshold = 750;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - totalPrice);
  const progressPercentage = Math.min(100, (totalPrice / freeShippingThreshold) * 100);

  return (
    <>
      <main className="bg-[#fdfaf6] min-h-screen pt-28 pb-32 font-sans selection:bg-[#1b1b1b] selection:text-[#f7f0e7]">
        <div className="mx-auto max-w-[1440px] px-6 md:px-10">
          
          {/* Breadcrumb */}
          <div className="flex items-center gap-3 font-mono text-[0.55rem] tracking-[0.2em] uppercase text-[#7b6a5c] mb-8 pb-4 border-b border-[#1b1b1b]/15">
            <Link to="/kahveler" className="hover:text-[#1b1b1b] transition-colors flex items-center gap-1.5">
              <ArrowLeft className="w-3 h-3" /> Tüm Seçki
            </Link>
            <span className="opacity-30">/</span>
            <span className="text-[#1b1b1b]">{product.name}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 border border-[#1b1b1b]/15 bg-[#f0e8dc]">
            
            {/* SOL: GÖRSEL */}
            <div className="w-full border-b lg:border-b-0 lg:border-r border-[#1b1b1b]/10 bg-[#efe5d8]">
              <div
                className="relative w-full aspect-square lg:aspect-auto lg:h-[calc(100vh-130px)] lg:sticky lg:top-[130px] flex items-center justify-center overflow-hidden p-4 lg:p-6 group"
                onMouseEnter={() => setImageHovered(true)}
                onMouseLeave={() => setImageHovered(false)}
                onTouchStart={() => setImageHovered(true)}
                onTouchEnd={() => setImageHovered(false)}
              >
                {mainImage ? (
                  <>
                    <img
                      src={mainImage}
                      alt={product.name}
                      className={`h-full w-full scale-150 object-contain mix-blend-multiply transition-all duration-1000 group-hover:scale-[1.55] z-10 ${secondImage ? (imageHovered ? 'opacity-0' : 'opacity-100') : ''}`}
                    />
                    {secondImage && (
                      <img
                        src={secondImage}
                        alt={product.name}
                        className={`absolute inset-0 h-full w-full scale-150 object-contain mix-blend-multiply transition-all duration-1000 group-hover:scale-[1.55] z-10 ${imageHovered ? 'opacity-100' : 'opacity-0'}`}
                      />
                    )}
                  </>
                ) : (
                  <svg width="120" height="120" viewBox="0 0 80 80" fill="none" className="opacity-20 z-10">
                    <ellipse cx="40" cy="40" rx="28" ry="36" stroke="#1b1b1b" strokeWidth="1.5" />
                    <path d="M40 10 Q55 25 55 40 Q55 55 40 70" stroke="#1b1b1b" strokeWidth="1.5" strokeDasharray="3 3" />
                    <path d="M40 10 Q25 25 25 40 Q25 55 40 70" stroke="#1b1b1b" strokeWidth="1" strokeDasharray="2 4" />
                    <ellipse cx="40" cy="40" rx="4" ry="6" stroke="#1b1b1b" strokeWidth="1" />
                  </svg>
                )}
                
                <div className="absolute top-6 left-6 flex flex-col gap-2 z-20">
                  {product.badge && (
                    <span className="font-mono text-[0.55rem] font-semibold tracking-[0.15em] uppercase text-[#f7f0e7] bg-[#1b1b1b] px-3 py-1 self-start">
                      {product.badge}
                    </span>
                  )}
                </div>

                <div className="absolute bottom-6 right-6 z-20">
                  <span className="font-mono text-[0.55rem] tracking-[0.2em] text-[#5c4635] uppercase border border-[#1b1b1b]/15 px-3 py-1 bg-[#fdfaf6]">
                    Haftalık Taze Kavrum
                  </span>
                </div>
              </div>
            </div>

            {/* SAĞ: BİLGİ */}
            <div className="flex flex-col p-8 lg:p-14 bg-[#fdfaf6]">
              
              <div className="mb-6">
              

                <h1 className="font-serif text-[clamp(2rem,3.5vw,3.5rem)] text-[#1b1b1b] leading-[1.05] tracking-[-0.02em] mb-6">
                  {product.name}
                  {selectedVariant && selectedVariant.weight !== "Default Title" && (
                    <span> {selectedVariant.weight}</span>
                  )}
                </h1>
                
                <div className="flex items-end gap-4 border-b border-[#1b1b1b]/15 pb-6">
                  <span className="font-mono text-[1.5rem] text-[#1b1b1b] font-semibold tracking-tight transition-all">
                    {displayPrice}
                  </span>
                  {displayOldPrice && (
                    <span className="font-mono text-[1rem] text-[#7b6a5c] line-through mb-1">
                      {displayOldPrice}
                    </span>
                  )}
                </div>
              </div>

              {/* SEÇENEKLER */}
              <div className="mb-8">
                {product.variants && product.variants.length > 0 && product.variants[0].weight !== "Default Title" && (
                  <div className="mb-6">
                    <span className="font-mono text-[0.6rem] tracking-[0.15em] text-[#7b6a5c] uppercase block mb-3">Gramaj Seçimi</span>
                    <div className="flex flex-wrap gap-3">
                      {product.variants.map((variant) => (
                        <button
                          key={variant.id}
                          onClick={() => setSelectedVariant(variant)}
                          className={`px-7 py-4 border font-mono text-[0.8rem] tracking-[0.15em] uppercase transition-colors bg-[#fdfaf6] ${
                            selectedVariant?.id === variant.id
                              ? 'border-[#1b1b1b] text-[#1b1b1b]'
                              : 'border-[#1b1b1b]/15 text-[#5c4635] hover:border-[#1b1b1b]'
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
                    <span className="font-mono text-[0.6rem] tracking-[0.15em] text-[#7b6a5c] uppercase block mb-3">Öğütme Derecesi</span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {grindOptions.map(({ id, image }) => (
                        <button
                          key={id}
                          onClick={() => setGrind(id)}
                          className={`flex items-center justify-center p-2 border transition-all duration-300 ${
                            grind === id ? 'border-[#1b1b1b] opacity-100' : 'border-[#1b1b1b]/15 opacity-40 hover:opacity-70'
                          }`}
                        >
                          <img src={image} alt={id} className="w-full h-auto object-contain" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Kısa Açıklama */}
              <p className="text-[#5c4635] font-sans font-light text-[0.95rem] leading-[1.85] mb-10 whitespace-pre-line">
                {product.description}
              </p>

              {/* SEPET İŞLEMLERİ */}
              <div className="flex flex-col gap-5 mb-12" ref={addToCartRef}>
                <div className="flex flex-col sm:flex-row gap-4">
                  <QuantitySelector quantity={quantity} setQuantity={setQuantity} />
                  <button 
                    onClick={handleAddToCart}
                    className="flex-1 flex items-center justify-center gap-3 py-4 font-mono text-[0.65rem] font-bold tracking-[0.2em] uppercase transition-colors border border-[#1b1b1b] bg-[#1b1b1b] text-[#f7f0e7] hover:bg-[#3a3530] hover:border-[#3a3530]"
                  >
                    Sepete Ekle
                  </button>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2.5 font-sans font-light text-[0.8rem] text-[#5c4635]">
                    <span className="text-[1rem]">👀</span>
                    <span><strong className="text-[#1b1b1b] font-medium">{viewers}</strong> müşteri bu ürünü görüntülüyor</span>
                  </div>

                  <div className="flex flex-col gap-2.5">
                    <div className="font-sans text-[0.8rem] text-[#5c4635]">
                      {remainingForFreeShipping > 0 ? (
                        <>Ücretsiz Kargo için <strong className="text-[#1b1b1b] font-medium">{remainingForFreeShipping.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</strong> değerinde ürün ekleyin.</>
                      ) : (
                        <span className="text-[#1b1b1b] font-medium">🎉 Sepetiniz ücretsiz kargo hakkı kazandı!</span>
                      )}
                    </div>
                    <div className="h-1.5 w-full bg-[#1b1b1b/10] overflow-hidden">
                      <div 
                        className="h-full bg-[#1b1b1b] transition-all duration-700 ease-out"
                        style={{ width: `${progressPercentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Accordion */}
              <div className="mb-10 border-t border-[#1b1b1b]/15">
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
                <div className="flex flex-col items-center gap-3">
                  <Coffee className="w-7 h-7 text-[#1b1b1b]" strokeWidth={1.3} />
                  <span className="font-mono text-[0.65rem] uppercase tracking-[0.15em] text-[#5c4635] text-center">Özel Harman</span>
                </div>
                <div className="flex flex-col items-center gap-3">
                  <Truck className="w-7 h-7 text-[#1b1b1b]" strokeWidth={1.3} />
                  <span className="font-mono text-[0.65rem] uppercase tracking-[0.15em] text-[#5c4635] text-center">Taze Teslimat</span>
                </div>
                <div className="flex flex-col items-center gap-3">
                  <ShieldCheck className="w-7 h-7 text-[#1b1b1b]" strokeWidth={1.3} />
                  <span className="font-mono text-[0.65rem] uppercase tracking-[0.15em] text-[#5c4635] text-center">Güvenli Ödeme</span>
                </div>
              </div>

            </div>
          </div>

          {/* Sekmeli Ürün Bilgisi */}
          <ProductInfoSection product={product} />
          
          {/* Uzun Açıklama */}
          <div className="mt-16 md:mt-24 border-t border-[#1b1b1b]/15 pt-16 md:pt-24 pb-12 relative overflow-hidden">
            <div className="max-w-[900px] mx-auto relative z-10 flex flex-col items-center">
              <span className="font-mono text-[0.6rem] tracking-[0.3em] uppercase text-[#7b6a5c] mb-4 flex items-center gap-2 before:content-[''] before:block before:w-5 before:h-[1px] before:bg-[#7b6a5c] after:content-[''] after:block after:w-5 after:h-[1px] after:bg-[#7b6a5c]">
                Hikayesi & Profili
              </span>
              <h2 className="font-serif text-[clamp(2rem,4vw,3rem)] text-[#1b1b1b] leading-[1.1] tracking-[-0.02em] mb-10 text-center">
                Bu Seçkiyi Yakından Tanıyın
              </h2>
              <div className="font-sans font-light text-[1rem] md:text-[1.1rem] leading-[2.2] text-[#5c4635] whitespace-pre-line text-center md:text-justify px-4">
                {product.description}
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* STICKY SEPETE EKLE BARI */}
      <div 
        className={`fixed bottom-0 left-0 right-0 z-50 bg-[#fdfaf6] border-t border-[#1b1b1b]/15 p-3 md:p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.06)] transform transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${showStickyBar ? 'translate-y-0' : 'translate-y-full'}`}
      >
        <div className="max-w-[1440px] mx-auto w-full flex items-center justify-between px-2 md:px-10">
          
          <div className="flex items-center gap-3 md:gap-6">
            {product.image ? (
              <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-[#f0e8dc] border border-[#1b1b1b]/15 p-1 flex items-center justify-center shrink-0">
                <img src={product.image} alt={product.name} className="w-full h-full object-contain mix-blend-multiply" />
              </div>
            ) : (
              <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-[#f0e8dc] border border-[#1b1b1b]/15 p-1 flex items-center justify-center shrink-0">
                <Coffee className="w-5 h-5 text-[#7b6a5c] opacity-50" />
              </div>
            )}
            
            <div className="flex flex-col justify-center gap-1.5">
              <span className="font-serif text-[0.95rem] md:text-[1.1rem] text-[#1b1b1b] leading-none">{product.name}</span>
              
              <div className="flex items-center gap-2">
                {product.variants && product.variants.length > 0 && product.variants[0].weight !== "Default Title" && (
                  <div className="relative">
                    <select 
                      value={selectedVariant?.id || ''} 
                      onChange={(e) => {
                        const variant = product.variants.find(v => v.id === e.target.value);
                        if (variant) setSelectedVariant(variant);
                      }}
                      className="appearance-none bg-transparent border border-[#1b1b1b]/15 px-2 py-1 pr-6 font-mono text-[0.5rem] md:text-[0.55rem] tracking-[0.05em] uppercase text-[#5c4635] hover:text-[#1b1b1b] hover:border-[#1b1b1b] focus:outline-none transition-colors cursor-pointer"
                    >
                      {product.variants.map(v => (
                        <option key={v.id} value={v.id}>{v.weight}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-[#7b6a5c] pointer-events-none" />
                  </div>
                )}

                {isFiltre && (
                  <div className="relative">
                    <select 
                      value={grind} 
                      onChange={(e) => setGrind(e.target.value)}
                      className="appearance-none bg-transparent border border-[#1b1b1b]/15 px-2 py-1 pr-6 font-mono text-[0.5rem] md:text-[0.55rem] tracking-[0.05em] uppercase text-[#5c4635] hover:text-[#1b1b1b] hover:border-[#1b1b1b] focus:outline-none transition-colors cursor-pointer"
                    >
                      {grindOptions.map(({ id }) => (
                        <option key={id} value={id}>{id}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-[#7b6a5c] pointer-events-none" />
                  </div>
                )}

                {(!product.variants || product.variants.length === 0 || product.variants[0].weight === "Default Title") && !isFiltre && (
                  <span className="font-mono text-[0.5rem] md:text-[0.55rem] tracking-[0.1em] text-[#7b6a5c] uppercase">
                    Haftalık Taze Kavrum
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4 md:gap-8">
            <div className="flex-col items-end hidden md:flex">
              {displayOldPrice && <span className="font-mono text-[0.55rem] line-through text-[#7b6a5c] mb-0.5">{displayOldPrice}</span>}
              <span className="font-mono font-semibold text-[1.1rem] text-[#1b1b1b] leading-none">{displayPrice}</span>
            </div>
            
            <button 
              onClick={handleAddToCart}
              className="flex items-center justify-center font-mono text-[0.6rem] md:text-[0.65rem] font-bold tracking-[0.2em] uppercase transition-colors border border-[#1b1b1b] bg-[#1b1b1b] text-[#f7f0e7] px-6 py-3.5 md:px-10 md:py-4 hover:bg-[#3a3530] hover:border-[#3a3530] whitespace-nowrap"
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