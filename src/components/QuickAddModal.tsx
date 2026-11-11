// src/components/QuickAddModal.tsx
// Hızlı ekleme penceresi — ürün sayfasıyla aynı seçim düzeni (ortak parçalar: ProductOptions.tsx)
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, ArrowRight, Check, Truck } from "lucide-react";
import { useCart } from "../context/CartContext";
import { fetchShopifyProductByHandle, type CoffeeProduct, type ProductVariant } from "../lib/shopify";
import { cartItemKey } from '../lib/cartKey';
import { buyNow } from '../lib/buyNow';
import { getShippingStatus, hasFreeShipping } from '../lib/shipping';
import ShippingNotice from './ShippingNotice';
import { needsGrind, formatPriceTR, discountPercentOf } from '../lib/productOptions';
import {
  GrindPicker,
  QuantitySelector,
  PriceRow,
  CoffeeFactsCompact,
  VariantPicker,
} from './ProductOptions';

const QuickAddModal = ({
  handle,
  onClose,
  initialVariantId,
}: {
  handle: string;
  onClose: () => void;
  /** Açılışta seçili gelecek varyant (ör. sepetteki kargo önerisi) */
  initialVariantId?: string;
}) => {
  const navigate = useNavigate();
  const { addToCart, cartItems, setIsCartOpen } = useCart();
  const [product, setProduct] = useState<CoffeeProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [grind, setGrind] = useState("");
  const [grindHighlight, setGrindHighlight] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [buyNowLoading, setBuyNowLoading] = useState(false);
  const [buyNowError, setBuyNowError] = useState<string | null>(null);
  const grindRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchShopifyProductByHandle(handle)
      .then((data) => {
        setProduct(data);
        if (data?.variants?.length) {
          setSelectedVariant(data.variants.find((v) => v.id === initialVariantId) ?? data.variants[0]);
        }
      })
      .finally(() => setLoading(false));
  }, [handle, initialVariantId]);

  // Üst bileşenler onClose'u her çizimde yeniden oluşturuyor; etkiyi tekrar kurmamak için ref'te tut
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onCloseRef.current(); };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  // Ödeme sayfasından geri tuşuyla dönülürse "açılıyor" durumunu sıfırla
  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => { if (e.persisted) setBuyNowLoading(false); };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  const isFiltre = product ? needsGrind(product) : false;
  const hasMultipleVariants = (product?.variants?.length ?? 0) > 1 && product?.variants[0].weight !== "Default Title";

  // Ürün sayfasındaki sepet satırıyla aynı (aynı varyant + öğütme → aynı satır)
  const buildCartItem = () => {
    const p = product!;
    let name = p.name;
    if (selectedVariant && selectedVariant.weight !== "Default Title") {
      // Tek varyantlı üründe varyant adı ürün adının devamıdır (ör. "… | 4 x" + "100 gr")
      // Shopify'daki adı "… |" ile bitenlerde ayraç zaten var
      const joinsDirectly = !hasMultipleVariants || name.trimEnd().endsWith('|');
      name = `${name.trimEnd()}${joinsDirectly ? ' ' : ' - '}${selectedVariant.weight}`;
    }
    if (isFiltre) name += ` (${grind})`;
    return {
      ...p,
      id: cartItemKey(selectedVariant?.id ?? p.variants?.[0]?.id, isFiltre ? grind : undefined),
      variantId: selectedVariant?.id ?? p.variants?.[0]?.id,
      name,
      price: selectedVariant?.price ?? p.price,
      grind: isFiltre ? grind : undefined,
      freeShipping: selectedVariant?.freeShipping === true,
    };
  };

  const requireGrind = () => {
    if (isFiltre && !grind) {
      setGrindHighlight(true);
      grindRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return false;
    }
    return true;
  };

  const handleAdd = () => {
    if (!product || !requireGrind()) return;
    addToCart(buildCartItem(), quantity);
    setAdded(true);
    setTimeout(() => { setAdded(false); onClose(); }, 1200);
  };

  const handleBuyNow = async () => {
    if (!product || !requireGrind()) return;
    setBuyNowError(null);
    setBuyNowLoading(true);
    try {
      await buyNow({ item: buildCartItem(), quantity, cartItems, addToCart, setIsCartOpen });
    } catch (err) {
      setBuyNowError(err instanceof Error ? err.message : "Ödeme sayfası açılamadı. Lütfen tekrar deneyin.");
      setBuyNowLoading(false);
    }
  };

  const productHasFreeShipping = product ? hasFreeShipping(product) || selectedVariant?.freeShipping === true : false;
  const shipping = getShippingStatus(cartItems);
  const mainImage = selectedVariant?.image ?? product?.image;
  const displayPrice = selectedVariant?.price ?? product?.price;
  const displayOldPrice = selectedVariant ? selectedVariant.oldPrice : product?.oldPrice;
  const discount = discountPercentOf(displayPrice, displayOldPrice);
  const titleSuffix = selectedVariant && selectedVariant.weight !== "Default Title" ? ` ${selectedVariant.weight}` : "";

  return (
    <>
      <div className="fixed inset-0 z-[80] bg-[#1b1b1b]/50 backdrop-blur-sm" onClick={onClose} />

      {/* Pencere — mobilde alttan açılır, masaüstünde ortalanır */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={product ? `${product.name} — hızlı ekle` : "Hızlı ekle"}
        className="fixed inset-x-0 bottom-0 z-[90] md:inset-0 md:flex md:items-center md:justify-center md:p-6 pointer-events-none"
      >
        <div className="pointer-events-auto relative flex w-full max-h-[92vh] flex-col bg-[#fdfaf6] shadow-2xl animate-in slide-in-from-bottom-4 duration-300 md:max-h-[90vh] md:max-w-5xl md:slide-in-from-bottom-0">

          {/* Kapat */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Kapat"
            className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center border border-[#1b1b1b]/15 bg-[#fdfaf6] text-[#1b1b1b] transition-colors hover:bg-[#f0e8dc]"
          >
            <X className="h-4 w-4" />
          </button>

          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <span className="font-mono text-[0.6rem] tracking-[0.2em] text-[#7b6a5c] animate-pulse">YÜKLENİYOR...</span>
            </div>
          ) : product ? (
            <div className="flex flex-1 flex-col md:flex-row">

              {/* GÖRSEL + TADIM NOTALARI (masaüstü) */}
              <div className="hidden shrink-0 flex-col border-r border-[#1b1b1b]/10 bg-[#efe5d8] md:flex md:w-[46%]">
                <div className="relative min-h-[240px] flex-1 overflow-hidden">
                  {mainImage && (
                    <img src={mainImage} alt={product.name} className="absolute inset-0 h-full w-full scale-110 object-contain p-8 mix-blend-multiply" />
                  )}
                  {product.badge && (
                    <span className="absolute left-4 top-4 bg-[#1b1b1b] px-3 py-1 font-mono text-[0.55rem] font-semibold uppercase tracking-[0.15em] text-[#f7f0e7]">
                      {product.badge}
                    </span>
                  )}
                  <span className="absolute bottom-3 right-3 border border-[#1b1b1b]/15 bg-[#fdfaf6] px-3 py-1 font-mono text-[0.55rem] uppercase tracking-[0.2em] text-[#5c4635]">
                    Haftalık Taze Kavrulmuş
                  </span>
                </div>
                {product.notes.length > 0 && (
                  <div className="border-t border-[#1b1b1b]/10 bg-[#fdfaf6] px-6 py-4">
                    <span className="mb-2 block font-mono text-[0.6rem] uppercase tracking-[0.14em] text-[#5c4635]">Tadım Notaları</span>
                    <CoffeeFactsCompact product={product} notesOnly />
                  </div>
                )}
              </div>

              {/* BİLGİ — mobilde kaydırmasız tek ekran */}
              <div className="flex flex-col gap-3 px-4 pt-4 pb-4 md:flex-1 md:justify-center md:gap-0 md:px-8 md:py-6">

                {/* Mobil başlık: küçük görsel + ad + fiyat (ürün sayfasına gider) */}
                <button
                  type="button"
                  onClick={() => { onClose(); navigate(`/urun/${product.handle}`); }}
                  className="flex items-center gap-3 border-b border-[#1b1b1b]/15 pb-3 pr-10 text-left md:hidden"
                >
                  <span className="flex h-[72px] w-[72px] shrink-0 items-center justify-center overflow-hidden bg-[#efe5d8]">
                    {mainImage && <img src={mainImage} alt="" className="h-full w-full scale-125 object-contain mix-blend-multiply" />}
                  </span>
                  <span className="flex min-w-0 flex-col gap-1">
                    <span className="line-clamp-2 font-serif text-[1.05rem] leading-[1.2] text-[#1b1b1b]">
                      {product.name}{titleSuffix}
                    </span>
                    <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="whitespace-nowrap font-mono text-[1.05rem] font-semibold text-[#1b1b1b]">{formatPriceTR(displayPrice)}</span>
                      {displayOldPrice && (
                        <span className="whitespace-nowrap font-mono text-[0.78rem] text-[#7b6a5c] line-through">{formatPriceTR(displayOldPrice)}</span>
                      )}
                      {discount !== null && (
                        <span className="whitespace-nowrap bg-[#8b2f22] px-1.5 py-[3px] font-mono text-[0.6rem] font-bold leading-none text-white">-%{discount}</span>
                      )}
                    </span>
                  </span>
                </button>

                {/* Mobil: yalnızca tadım notaları */}
                <CoffeeFactsCompact product={product} notesOnly className="md:hidden" />

                {/* Masaüstü başlık + fiyat — ürün sayfasındaki gibi */}
                <div className="hidden md:block">
                  <h2 className="mb-3 pr-10 font-serif text-[1.7rem] leading-[1.1] tracking-[-0.02em] text-[#1b1b1b]">
                    {product.name}
                    {titleSuffix && <span>{titleSuffix}</span>}
                  </h2>
                  <PriceRow
                    price={displayPrice}
                    oldPrice={displayOldPrice}
                    freeShipping={productHasFreeShipping}
                    className="mb-5"
                  />
                </div>

                {/* SEÇENEKLER */}
                {hasMultipleVariants && (
                  <div className="md:mb-5">
                    <VariantPicker
                      variants={product.variants}
                      selectedId={selectedVariant?.id}
                      onSelect={setSelectedVariant}
                    />
                  </div>
                )}

                {isFiltre && (
                  <div ref={grindRef} className="md:mb-5">
                    <GrindPicker
                      value={grind}
                      highlight={grindHighlight}
                      dropUp
                      alwaysDropdown
                      onChange={(id) => {
                        setGrind(id);
                        setGrindHighlight(false);
                      }}
                    />
                  </div>
                )}

                {/* SEPET İŞLEMLERİ */}
                <div className="flex flex-col gap-2.5 md:gap-3">
                  <div className="flex flex-row gap-3 md:gap-4">
                    <QuantitySelector quantity={quantity} setQuantity={setQuantity} />
                    <button
                      type="button"
                      onClick={handleAdd}
                      disabled={added}
                      className={`flex flex-1 min-h-12 items-center justify-center gap-2 border px-3 py-2 text-center font-mono text-[0.65rem] font-bold uppercase leading-snug tracking-[0.12em] md:tracking-[0.2em] transition-colors ${
                        added
                          ? "border-[#1b1b1b] bg-[#1b1b1b] text-[#f7f0e7]"
                          : isFiltre && !grind
                            ? "border-[#1b1b1b]/10 bg-[#1b1b1b]/10 text-[#7b6a5c]"
                            : "border-[#1b1b1b] bg-[#1b1b1b] text-[#f7f0e7] hover:bg-[#3a3530] hover:border-[#3a3530]"
                      }`}
                    >
                      {added ? (<><Check className="h-4 w-4" /> Sepete Eklendi</>) : isFiltre && !grind ? "Lütfen Öğütme Türünüzü Seçin" : "Sepete Ekle"}
                    </button>
                  </div>

                  {/* Hızlı Satın Al — doğrudan Shopify ödeme sayfası */}
                  <button
                    type="button"
                    onClick={handleBuyNow}
                    disabled={buyNowLoading}
                    className="flex w-full min-h-12 items-center justify-center gap-2.5 border border-[#a64b2a] bg-[#a64b2a] px-3 py-2 font-mono text-[0.65rem] font-bold uppercase tracking-[0.12em] md:tracking-[0.2em] text-[#FDFAF6] transition-colors hover:bg-[#8a3c21] hover:border-[#8a3c21] disabled:cursor-wait disabled:opacity-70"
                  >
                    {buyNowLoading ? "Ödeme sayfası açılıyor…" : (<>Hızlı Satın Al <ArrowRight className="h-4 w-4" /></>)}
                  </button>
                  {buyNowError && <p className="font-sans text-[0.8rem] text-[#8b2f22]">{buyNowError}</p>}

                  {/* Kargo durumu */}
                  <div className="flex flex-col gap-2 md:mt-1">
                    {productHasFreeShipping ? (
                      <div className="flex items-center gap-2 font-sans text-[0.8rem] font-medium text-[#1b1b1b]">
                        <Truck className="h-4 w-4 text-[#c17a3a]" /> Bu ürün ücretsiz kargo ile gönderilir.
                      </div>
                    ) : (
                      <>
                        <div className="font-sans text-[0.75rem] md:text-[0.8rem] text-[#5c4635]">
                          <ShippingNotice status={shipping} />
                        </div>
                        <div className="h-1 md:h-1.5 w-full overflow-hidden bg-[#1b1b1b]/10">
                          <div className="h-full bg-[#1b1b1b] transition-all duration-700 ease-out" style={{ width: `${shipping.progress}%` }} />
                        </div>
                      </>
                    )}
                  </div>

                  {/* Ürüne git (masaüstü; mobilde başlık bağlantı) */}
                  <button
                    type="button"
                    onClick={() => { onClose(); navigate(`/urun/${product.handle}`); }}
                    className="mt-2 hidden self-center border-b border-[#7b6a5c]/30 pb-0.5 text-center font-mono text-[0.6rem] uppercase tracking-[0.15em] text-[#5c4635] transition-colors hover:text-[#1b1b1b] md:block"
                  >
                    Ürün detayına git →
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
};

export default QuickAddModal;
