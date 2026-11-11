// src/pages/Urun.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Truck,
  ShieldCheck,
  Coffee,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { fetchShopifyProductByHandle, type CoffeeProduct, type ProductVariant } from '../lib/shopify';
import { buyNow } from '../lib/buyNow';
import { cartItemKey } from '../lib/cartKey';
import ProductInfoSection from '../components/ProductInfoSection';
import { useMetaProductView } from '../hooks/useMetaAnalytics';
import { useSeo } from '../hooks/useSeo';
import { getShippingStatus, hasFreeShipping } from '../lib/shipping';
import ShippingNotice from '../components/ShippingNotice';
import { parsePrice, formatPriceTR, needsGrind, grindOptions } from '../lib/productOptions';
import {
  GrindPicker,
  QuantitySelector,
  PriceRow,
  CoffeeFacts,
  VariantPicker,
} from '../components/ProductOptions';

const SITE_URL = 'https://editioncoffee.com.tr';

// Shopify'daki bazı ürün adları "… |" ile bitiyor; SEO başlığında çift ayraç oluşmasın.
const cleanProductName = (name: string) => name.replace(/[\s|]+$/, '').trim();

const toMetaDescription = (text: string) => {
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length > 155 ? `${clean.slice(0, 152).trimEnd()}…` : clean;
};

const buildProductJsonLd = (product: CoffeeProduct, path: string) => {
  const url = `${SITE_URL}${path}`;
  const images = [product.image, ...product.variants.map(v => v.image)]
    .filter((img): img is string => Boolean(img));

  const offers = product.variants
    .map(v => {
      const price = parsePrice(v.price);
      if (isNaN(price) || price <= 0) return null;
      return {
        '@type': 'Offer',
        name: v.weight,
        url,
        price: price.toFixed(2),
        priceCurrency: 'TRY',
        itemCondition: 'https://schema.org/NewCondition',
        ...(v.available !== undefined && {
          availability: v.available ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
        }),
        seller: { '@type': 'Organization', name: 'Edition Coffee Roastery' },
      };
    })
    .filter(Boolean);

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: cleanProductName(product.name),
    description: product.description,
    url,
    ...(images.length > 0 && { image: [...new Set(images)] }),
    brand: { '@type': 'Brand', name: 'Edition Coffee Roastery' },
    ...(offers.length > 0 && { offers }),
  };
};

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
  
  const { addToCart, cartItems, setIsCartOpen } = useCart();
  
  const [product, setProduct] = useState<CoffeeProduct | null>(null);
  const [loading, setLoading] = useState(true);

  const [quantity, setQuantity] = useState(1);
  const [openSection, setOpenSection] = useState<string | null>('desc');
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [grind, setGrind] = useState<string>('');

  const [showStickyBar, setShowStickyBar] = useState(false);
  const [imageHovered, setImageHovered] = useState(false);
  const addToCartRef = useRef<HTMLDivElement>(null);
  const grindRef = useRef<HTMLDivElement>(null);
  const stickyBarRef = useRef<HTMLDivElement>(null);
  const [grindHighlight, setGrindHighlight] = useState(false);
  const [buyNowLoading, setBuyNowLoading] = useState(false);
  const [buyNowError, setBuyNowError] = useState<string | null>(null);

  // Ödeme sayfasından tarayıcının geri tuşuyla dönülürse "açılıyor" durumunu sıfırla
  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) setBuyNowLoading(false);
    };
    window.addEventListener('pageshow', onPageShow);
    return () => window.removeEventListener('pageshow', onPageShow);
  }, []);

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

  // SEO — başlık, açıklama, canonical ve Product yapısal verisi
  const seoPath = handle ? `/urun/${handle}` : undefined;
  useSeo(
    product ? `${cleanProductName(product.name)} | Edition Coffee Roastery` : 'Edition Coffee Roastery',
    product ? toMetaDescription(product.description) : '',
    product ? seoPath : undefined,
    product && seoPath ? buildProductJsonLd(product, seoPath) : null,
    !loading && !product,
  );

  // Sticky Bar — ana "Sepete Ekle" düğmesi ekranın üstünden (sabit menünün altından)
  // çıktığında görünür; düğme ekranda veya henüz aşağıdaysa gizli kalır.
  useEffect(() => {
    const handleScroll = () => {
      if (addToCartRef.current) {
        const rect = addToCartRef.current.getBoundingClientRect();
        const headerBottom = document.querySelector('header')?.getBoundingClientRect().bottom ?? 130;
        setShowStickyBar(rect.bottom < headerBottom);
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

  // Tek varyantlı ürünlerde gramaj seçimi gösterilmez (ör. 4 x 100 gr set)
  const hasMultipleVariants = (product.variants?.length ?? 0) > 1;

  // Seçili varyant, öğütme ve adetle sepet satırı oluşturur
  const buildCartItem = () => {
    const showsGrind = product.category.includes('filtre') || product.category.includes('espresso');

    let cartProductName = product.name;

    if (selectedVariant && selectedVariant.weight !== "Default Title") {
      // Tek varyantlı üründe varyant adı ürün adının devamıdır (ör. "… | 4 x" + "100 gr")
      // Shopify'daki adı "… |" ile bitenlerde ayraç zaten var
      const joinsDirectly = !hasMultipleVariants || cartProductName.trimEnd().endsWith('|');
      cartProductName = `${cartProductName.trimEnd()}${joinsDirectly ? ' ' : ' - '}${selectedVariant.weight}`;
    }

    if (showsGrind) cartProductName += ` (${grind})`;

    const cartProductObj = {
      ...product,
      // Aynı varyant + öğütme her zaman aynı satır (adet artar, yeni satır açılmaz)
      id: cartItemKey(selectedVariant ? selectedVariant.id : product.variants?.[0]?.id, showsGrind ? grind : undefined),
      variantId: selectedVariant ? selectedVariant.id : product.variants?.[0]?.id,
      name: cartProductName,
      price: selectedVariant ? selectedVariant.price : product.price,
      grind: showsGrind ? grind : undefined,
      // Varyanta özel ücretsiz kargo (custom.ucretsiz_kargo); ürün etiketi ayrıca category'den okunur
      freeShipping: selectedVariant?.freeShipping === true,
    };

    return cartProductObj;
  };

  const handleAddToCart = () => {
    if (isFiltre && !grind) return;
    addToCart(buildCartItem(), quantity);
  };

  // Hızlı Satın Al: ürünü sepete ekler ve sepetin tamamıyla (önceki ürünler + bu ürün)
  // doğrudan Shopify ödeme sayfasını açar
  const handleBuyNow = async () => {
    if (isFiltre && !grind) {
      grindRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setGrindHighlight(true);
      return;
    }
    setBuyNowError(null);
    setBuyNowLoading(true);
    try {
      await buyNow({ item: buildCartItem(), quantity, cartItems, addToCart, setIsCartOpen });
    } catch (err) {
      setBuyNowError(err instanceof Error ? err.message : 'Ödeme sayfası açılamadı. Lütfen tekrar deneyin.');
      setBuyNowLoading(false);
    }
  };

  const isFiltre = needsGrind(product);
  const displayPrice = formatPriceTR(selectedVariant ? selectedVariant.price : product.price);
  const displayOldPrice = formatPriceTR(selectedVariant ? selectedVariant.oldPrice : product.oldPrice);
  const mainImage = selectedVariant?.image ?? product.image;
  const secondImage = selectedVariant?.hoverImage ?? null;

  const productHasFreeShipping = hasFreeShipping(product) || selectedVariant?.freeShipping === true;

  // Sabit çubuk: öğütme seçilmemişse çubuktaki öğütme kutusunu aç / vurgula
  const handleStickyAddToCart = () => {
    if (isFiltre && !grind) {
      setGrindHighlight(true);
      const select = [...(stickyBarRef.current?.querySelectorAll<HTMLSelectElement>('select[data-grind]') ?? [])]
        .find((el) => el.offsetParent !== null);
      if (select) {
        select.focus();
        try {
          (select as HTMLSelectElement & { showPicker?: () => void }).showPicker?.();
        } catch {
          // showPicker desteklenmiyorsa odak ve vurgu yeterli
        }
      } else {
        grindRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    handleAddToCart();
  };
  const shipping = getShippingStatus(cartItems);

  return (
    <>
      <main className="bg-[#fdfaf6] min-h-screen pt-0 md:pt-28 pb-10 md:pb-16 font-sans selection:bg-[#1b1b1b] selection:text-[#f7f0e7]">
        <div className="mx-auto max-w-[1440px] px-0 md:px-10">
          
          {/* Breadcrumb */}
          <div className="flex items-center gap-3 px-5 py-3 md:px-0 md:pt-0 font-mono text-[0.6rem] md:text-[0.55rem] tracking-[0.2em] uppercase text-[#7b6a5c] md:mb-8 md:pb-4 border-b border-[#1b1b1b]/15">
            <Link to="/kahveler" className="hover:text-[#1b1b1b] transition-colors flex shrink-0 items-center gap-1.5 whitespace-nowrap">
              <ArrowLeft className="w-3 h-3" /> Tüm Seçki
            </Link>
            <span className="opacity-30">/</span>
            <span className="min-w-0 truncate text-[#1b1b1b]">{product.name}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 md:border md:border-[#1b1b1b]/15 bg-[#f0e8dc]">
            
            {/* SOL: GÖRSEL */}
            <div className="w-full border-b lg:border-b-0 lg:border-r border-[#1b1b1b]/10 bg-[#efe5d8]">
              <div
                className="relative w-full aspect-[4/3] md:aspect-square lg:aspect-auto lg:h-[calc(100vh-130px)] lg:sticky lg:top-[130px] flex items-center justify-center overflow-hidden p-4 lg:p-6 group"
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
                      className={`h-full w-full scale-110 md:scale-150 object-contain mix-blend-multiply transition-all duration-1000 group-hover:scale-[1.55] z-10 ${secondImage ? (imageHovered ? 'opacity-0' : 'opacity-100') : ''}`}
                    />
                    {secondImage && (
                      <img
                        src={secondImage}
                        alt={product.name}
                        className={`absolute inset-0 h-full w-full scale-110 md:scale-150 object-contain mix-blend-multiply transition-all duration-1000 group-hover:scale-[1.55] z-10 ${imageHovered ? 'opacity-100' : 'opacity-0'}`}
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

                <div className="absolute bottom-3 right-3 md:bottom-6 md:right-6 z-20">
                  <span className="font-mono text-[0.55rem] tracking-[0.2em] text-[#5c4635] uppercase border border-[#1b1b1b]/15 px-3 py-1 bg-[#fdfaf6]">
                    Haftalık Taze Kavrulmuş
                  </span>
                </div>
              </div>
            </div>

            {/* SAĞ: BİLGİ */}
            <div className="flex flex-col px-5 pt-5 pb-8 md:p-8 lg:p-14 bg-[#fdfaf6]">
              
              <div className="mb-5 md:mb-6">
              

                <h1 className="font-serif text-[1.6rem] leading-[1.15] md:text-[clamp(2rem,3.5vw,3.5rem)] md:leading-[1.05] text-[#1b1b1b] tracking-[-0.02em] mb-3 md:mb-6">
                  {product.name}
                  {selectedVariant && selectedVariant.weight !== "Default Title" && (
                    <span> {selectedVariant.weight}</span>
                  )}
                </h1>
                
                <PriceRow
                  price={selectedVariant ? selectedVariant.price : product.price}
                  oldPrice={selectedVariant ? selectedVariant.oldPrice : product.oldPrice}
                  freeShipping={productHasFreeShipping}
                />
              </div>

              {/* KAHVE KÜNYESİ — yalnızca Shopify'da dolu olan alanlar gösterilir */}
              <CoffeeFacts product={product} className="mb-6 md:mb-8" />

              {/* SEÇENEKLER */}
              <div className="mb-3 md:mb-8">
                {hasMultipleVariants && product.variants[0].weight !== "Default Title" && (
                  <div className="mb-6">
                    <VariantPicker
                      variants={product.variants}
                      selectedId={selectedVariant?.id}
                      onSelect={setSelectedVariant}
                    />
                  </div>
                )}

                {isFiltre && (
                  <div className="mb-0 md:mb-6 scroll-mt-40" ref={grindRef}>
                    <GrindPicker
                      value={grind}
                      highlight={grindHighlight}
                      onChange={(id) => {
                        setGrind(id);
                        setGrindHighlight(false);
                      }}
                    />
                  </div>
                )}
              </div>

              {/* SEPET İŞLEMLERİ */}
              <div className="flex flex-col gap-5 mb-8 md:mb-12">
                <div className="flex flex-row gap-3 md:gap-4" ref={addToCartRef}>
                  <QuantitySelector quantity={quantity} setQuantity={setQuantity} />
                  <button
                    onClick={handleAddToCart}
                    disabled={isFiltre && !grind}
                    className={`flex-1 flex items-center justify-center gap-3 px-3 py-2 min-h-12 text-center leading-snug font-mono text-[0.65rem] font-bold tracking-[0.12em] md:tracking-[0.2em] uppercase transition-colors border ${
                      isFiltre && !grind
                        ? 'border-[#1b1b1b]/10 bg-[#1b1b1b]/10 text-[#7b6a5c] cursor-not-allowed'
                        : 'border-[#1b1b1b] bg-[#1b1b1b] text-[#f7f0e7] hover:bg-[#3a3530] hover:border-[#3a3530]'
                    }`}
                  >
                    {isFiltre && !grind ? 'Lütfen Öğütme Türünüzü Seçin' : 'Sepete Ekle'}
                  </button>
                </div>

                {/* Hızlı Satın Al — doğrudan Shopify ödeme sayfası */}
                <div className="-mt-2 md:-mt-1 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={handleBuyNow}
                    disabled={buyNowLoading}
                    className="flex w-full min-h-12 items-center justify-center gap-2.5 border border-[#a64b2a] bg-[#a64b2a] px-3 py-2 font-mono text-[0.65rem] font-bold uppercase tracking-[0.12em] md:tracking-[0.2em] text-[#FDFAF6] transition-colors hover:bg-[#8a3c21] hover:border-[#8a3c21] disabled:cursor-wait disabled:opacity-70"
                  >
                    {buyNowLoading ? 'Ödeme sayfası açılıyor…' : (<>Hızlı Satın Al <ArrowRight className="h-4 w-4" /></>)}
                  </button>
                  {buyNowError && (
                    <p className="font-sans text-[0.8rem] text-[#8b2f22]">{buyNowError}</p>
                  )}
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-2.5">
                    {productHasFreeShipping ? (
                      <div className="flex items-center gap-2 font-sans text-[0.85rem] font-medium text-[#1b1b1b]">
                        <Truck className="h-4 w-4 text-[#c17a3a]" /> Bu ürün ücretsiz kargo ile gönderilir.
                      </div>
                    ) : (
                      <>
                        <div className="font-sans text-[0.8rem] text-[#5c4635]">
                          <ShippingNotice status={shipping} />
                        </div>
                        <div className="h-1.5 w-full bg-[#1b1b1b]/10 overflow-hidden">
                          <div 
                            className="h-full bg-[#1b1b1b] transition-all duration-700 ease-out"
                            style={{ width: `${shipping.progress}%` }}
                          />
                        </div>
                      </>
                    )}
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
          <div className="mt-4 md:mt-6 border-t border-[#1b1b1b]/15 pt-10 md:pt-14 pb-6 md:pb-10 relative overflow-hidden">
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
        ref={stickyBarRef}
        className={`fixed bottom-0 left-0 right-0 z-50 bg-[#fdfaf6] border-t border-[#1b1b1b]/15 p-3 md:p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.06)] transform transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden ${showStickyBar ? 'translate-y-0' : 'translate-y-full pointer-events-none'}`}
      >
        <div className="max-w-[1440px] mx-auto w-full flex items-center justify-between gap-2 px-2 md:px-10">
          
          <div className="flex min-w-0 flex-1 items-center gap-2.5 md:gap-6">
            {product.image ? (
              // Çerçeve boyutu aynı; ürün görseli çerçeve içinde büyütülür (görsellerin kenar boşluğu geniş)
              <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-[#f0e8dc] border border-[#1b1b1b]/15 overflow-hidden flex items-center justify-center shrink-0">
                <img src={product.image} alt={product.name} className="w-full h-full object-contain mix-blend-multiply scale-[1.6]" />
              </div>
            ) : (
              <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-[#f0e8dc] border border-[#1b1b1b]/15 p-1 flex items-center justify-center shrink-0">
                <Coffee className="w-5 h-5 text-[#7b6a5c] opacity-50" />
              </div>
            )}
            
            <div className="flex min-w-0 flex-col justify-center gap-1.5">
              <span className="truncate font-serif text-[0.95rem] md:text-[1.1rem] text-[#1b1b1b] leading-none">{product.name}</span>
              <div className="flex min-w-0 items-center gap-2">
                {hasMultipleVariants && product.variants[0].weight !== "Default Title" && (
                  <div className="relative shrink-0">
                    <select
                      value={selectedVariant?.id || ''}
                      onChange={(e) => {
                        const variant = product.variants.find(v => v.id === e.target.value);
                        if (variant) setSelectedVariant(variant);
                      }}
                      className="w-full appearance-none bg-transparent border border-[#1b1b1b]/15 pl-1.5 pr-5 md:px-2 md:pr-6 py-1 font-mono text-[0.62rem] md:text-[0.55rem] tracking-[0.02em] md:tracking-[0.05em] uppercase text-[#5c4635] hover:text-[#1b1b1b] hover:border-[#1b1b1b] focus:outline-none transition-colors cursor-pointer"
                    >
                      {product.variants.map(v => (
                        <option key={v.id} value={v.id}>{v.weight}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-1 md:right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-[#7b6a5c] pointer-events-none" />
                  </div>
                )}

                {isFiltre && (
                  <div className="relative min-w-0">
                    <select
                      data-grind
                      value={grind}
                      onChange={(e) => {
                        setGrind(e.target.value);
                        setGrindHighlight(false);
                      }}
                      className={`w-full appearance-none bg-transparent border pl-1.5 pr-5 md:px-2 md:pr-6 py-1 font-mono text-[0.62rem] md:text-[0.55rem] tracking-[0.02em] md:tracking-[0.05em] uppercase hover:text-[#1b1b1b] hover:border-[#1b1b1b] focus:outline-none transition-colors cursor-pointer ${
                        grind ? 'border-[#1b1b1b]/15 text-[#5c4635]' : 'border-[#c17a3a] text-[#c17a3a]'
                      }`}
                    >
                      <option value="" disabled>Öğütme</option>
                      {grindOptions.map(({ id }) => (
                        <option key={id} value={id}>{id}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-1 md:right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-[#7b6a5c] pointer-events-none" />
                  </div>
                )}

                {!hasMultipleVariants && !isFiltre && (
                  <span className="hidden md:inline font-mono text-[0.5rem] md:text-[0.55rem] tracking-[0.1em] text-[#7b6a5c] uppercase">
                    Haftalık Taze Kavrulmuş
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex shrink-0 items-center gap-4 md:gap-8">
            <div className="flex-col items-end hidden md:flex">
              {displayOldPrice && <span className="font-mono text-[0.55rem] line-through text-[#7b6a5c] mb-0.5">{displayOldPrice}</span>}
              <span className="font-mono font-semibold text-[1.1rem] text-[#1b1b1b] leading-none">{displayPrice}</span>
            </div>
            
            <button
              onClick={handleStickyAddToCart}
              className="flex items-center justify-center font-mono text-[0.65rem] font-bold tracking-[0.08em] md:tracking-[0.2em] uppercase transition-colors border px-3 py-3.5 md:px-10 md:py-4 whitespace-nowrap border-[#1b1b1b] bg-[#1b1b1b] text-[#f7f0e7] hover:bg-[#3a3530] hover:border-[#3a3530]"
            >
              {isFiltre && !grind ? 'Öğütme Seçin' : 'Sepete Ekle'}
            </button>
          </div>

        </div>
      </div>
    </>
  );
};

export default Urun;