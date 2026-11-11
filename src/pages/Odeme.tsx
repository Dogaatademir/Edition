// src/pages/Odeme.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Lock, ArrowLeft, ShieldCheck, X, Plus, Minus } from 'lucide-react';
import { createShopifyCart, type ShopifyCartResponse } from '../lib/shopify';
import { trackEvent } from '../hooks/useAnalytics';
import { getSessionId } from '../lib/session';
import { useMetaViewCart } from '../hooks/useMetaAnalytics';
import { gAdsBeginCheckout } from '../lib/Googleads'; // ← YENİ
import { getShippingStatus } from '../lib/shipping';
import { cartItemKey, canonicalGrind } from '../lib/cartKey';
import ShippingNotice from '../components/ShippingNotice';
import FreeShippingSuggestions from '../components/FreeShippingSuggestions';
import QuickAddModal from '../components/QuickAddModal';

interface CartContextType {
  cartItems: any[];
  updateQuantity: (id: string | number, delta: number) => void;
  removeFromCart: (id: string | number) => void;
  replaceCart: (items: any[]) => void;
  [key: string]: any;
}

export default function Odeme() {
  const { cartItems, updateQuantity, removeFromCart, replaceCart } = useCart() as CartContextType;
  const navigate = useNavigate();

  const hasReorderParam = new URLSearchParams(window.location.search).has('reorder');
  const [reorderProcessed, setReorderProcessed] = useState(!hasReorderParam);

  const hasTrackedViewRef = useRef(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingCart, setIsLoadingCart] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [discountInput, setDiscountInput] = useState('');
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [discountError, setDiscountError] = useState<string | null>(null);
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false);

  const [orderNote, setOrderNote] = useState('');
  const [noteOpen, setNoteOpen] = useState(false);
  const [quickAdd, setQuickAdd] = useState<{ handle: string; variantId: string } | null>(null);
  const [codeOpen, setCodeOpen] = useState(false);
  const [shopifyCart, setShopifyCart] = useState<ShopifyCartResponse | null>(null);

  // Sabit alt çubuk yalnızca sayfadaki ödeme düğmesi ekranda değilken görünür
  const mainButtonRef = useRef<HTMLButtonElement>(null);
  const [mainButtonVisible, setMainButtonVisible] = useState(true);
  useEffect(() => {
    const check = () => {
      const el = mainButtonRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      // Düğmenin en az yarısı ekrandaysa "görünür" say
      const mid = r.top + r.height / 2;
      setMainButtonVisible(mid > 0 && mid < window.innerHeight);
    };
    check();
    window.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);
    return () => {
      window.removeEventListener('scroll', check);
      window.removeEventListener('resize', check);
    };
  }, [shopifyCart, isLoadingCart]);

  const cartTotal = cartItems.reduce((total: number, item: any) => {
    const price = parseFloat(
      String(item.price ?? 0).replace(/[^\d.,]/g, '').replace(',', '.')
    ) || 0;
    return total + price * item.quantity;
  }, 0);
  const cartItemCount = cartItems.reduce((s: number, i: any) => s + i.quantity, 0);

  useMetaViewCart(
    cartItems.length > 0
      ? { itemCount: cartItemCount, total: cartTotal }
      : null
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reorderData = params.get('reorder');
    if (reorderData) {
      try {
        const items = JSON.parse(decodeURIComponent(atob(reorderData)));
        replaceCart(items);
        window.history.replaceState({}, '', '/odeme');
      } catch (e) {
        console.error('Reorder parse hatası:', e);
      }
      setReorderProcessed(true);
    }
  }, []);

  useEffect(() => {
    if (hasTrackedViewRef.current) return;
    hasTrackedViewRef.current = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    trackEvent('react_odeme_view');
  }, []);

  const fetchCartFromShopify = async (codeToApply?: string | null) => {
    setIsLoadingCart(true);
    setError(null);
    setDiscountError(null);
    try {
      const result = await createShopifyCart(cartItems, codeToApply);
      setShopifyCart(result);
      if (codeToApply && result.discount === 0) {
        setDiscountError("Girdiğiniz indirim kodu geçersiz veya sepetinize uygun değil.");
        setAppliedCode(null);
      } else if (codeToApply) {
        setAppliedCode(codeToApply);
        setDiscountInput('');
      }
    } catch (err: any) {
      setError(err.message || "Ödeme işlemi başlatılırken bilinmeyen bir hata oluştu.");
      if (codeToApply) setAppliedCode(null);
    } finally {
      setIsLoadingCart(false);
      setIsApplyingDiscount(false);
    }
  };

  useEffect(() => {
    if (!reorderProcessed) return;
    if (cartItems.length === 0) {
      navigate('/kahveler');
      return;
    }
    fetchCartFromShopify(appliedCode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartItems, navigate, reorderProcessed]);

  const handleApplyDiscount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!discountInput.trim()) return;
    setIsApplyingDiscount(true);
    fetchCartFromShopify(discountInput.trim().toUpperCase());
  };

  const handleRemoveDiscount = () => {
    setIsApplyingDiscount(true);
    setAppliedCode(null);
    fetchCartFromShopify(null);
  };

  const handleCheckoutRedirect = async () => {
    if (shopifyCart?.checkoutUrl) {
      setIsProcessing(true);

      await trackEvent('checkout_start', {
        total:        shopifyCart.total,
        itemCount:    cartItems.length,
        discountCode: appliedCode ?? null,
      });

      // Google Ads — env'deki VITE_GADS_* değerlerini googleAds.ts üzerinden kullanır
      gAdsBeginCheckout({
        total:     shopifyCart.total,
        itemCount: cartItems.length,
      });

      try {
        localStorage.setItem('pendingCheckout', JSON.stringify({
          ts:        Date.now(),
          sessionId: getSessionId(),
          total:     shopifyCart.total,
        }));
      } catch { /* devam et */ }

      let finalCheckoutUrl = shopifyCart.checkoutUrl;

      if (orderNote.trim() !== '') {
        try {
          const urlObj = new URL(finalCheckoutUrl);
          urlObj.searchParams.append('note', orderNote.trim());
          urlObj.searchParams.append('attributes[Sipariş Notu]', orderNote.trim());
          finalCheckoutUrl = urlObj.toString();
        } catch (e) {
          const separator = finalCheckoutUrl.includes('?') ? '&' : '?';
          finalCheckoutUrl = `${finalCheckoutUrl}${separator}note=${encodeURIComponent(orderNote.trim())}`;
        }
      }

      window.location.href = finalCheckoutUrl;
    }
  };

  if (cartItems.length === 0 && reorderProcessed) return null;

  const currentCartTotalForShipping = shopifyCart ? (shopifyCart.subtotal - shopifyCart.discount) : 0;
  const shipping = getShippingStatus(cartItems, currentCartTotalForShipping);
  const progressPercentage = shipping.progress;
  const checkoutDisabled = isProcessing || isLoadingCart || !!error;

  return (
    <main className="bg-[#f7f0e7] min-h-screen pt-8 md:pt-10 pb-12 lg:pb-20 font-sans selection:bg-[#1b1b1b] selection:text-[#f7f0e7]">
      <div className="mx-auto max-w-[1200px] px-6 md:px-10">

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-6 mb-5 md:mb-10 pb-4 md:pb-6 border-b border-[#1b1b1b]/10">
          <div>
            <Link to="/kahveler" className="font-mono text-[0.55rem] tracking-[0.2em] uppercase text-[#A5622A] hover:text-[#1b1b1b] transition-colors flex items-center gap-2 mb-3 md:mb-4">
              <ArrowLeft className="w-3 h-3" /> Seçkiye Dön
            </Link>
            <h1 className="font-serif text-[1.65rem] md:text-[clamp(2rem,3vw,2.5rem)] text-[#1b1b1b] leading-tight tracking-[-0.02em]">
              Güvenli <em className="italic text-[#A5622A]">Ödeme</em>
            </h1>
          </div>
          <div className="flex items-center gap-2 text-[#A5622A]">
            <Lock className="w-4 h-4" />
            <span className="font-mono text-[0.6rem] tracking-[0.15em] uppercase">256-BIT SSL GÜVENCESİYLE</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

          {/* SOL PANEL */}
          <div className="lg:col-span-8 flex flex-col gap-8">

            <div className="bg-[#fdfaf6] border border-[#1b1b1b]/10 p-6 md:p-8">
              <h2 className="font-mono text-[0.7rem] tracking-[0.2em] uppercase text-[#1b1b1b] mb-6 pb-4 border-b border-[#1b1b1b]/10">
                Sepetiniz
              </h2>

              <div className="flex flex-col gap-6">
                {isLoadingCart && !shopifyCart ? (
                  <div className="animate-pulse flex flex-col gap-6">
                    {[1, 2].map((i) => (
                      <div key={i} className="flex gap-6 pb-6 border-b border-[#1b1b1b]/10 last:border-0 last:pb-0">
                        <div className="h-24 w-20 bg-[#e7ddd1] shrink-0"></div>
                        <div className="flex flex-col justify-center flex-1 gap-3">
                          <div className="h-5 bg-[#e7ddd1] w-2/4"></div>
                          <div className="h-4 bg-[#e7ddd1] w-1/4"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  shopifyCart?.lines?.map((line: any) => {
                    const isFree = line.discountedPrice === 0 || line.originalPrice > line.discountedPrice;
                    // Satırı sitedeki kayıtla varyant + öğütmeye göre eşleştir
                    const lineKey = cartItemKey(line.variantId, line.grind);
                    const matchedItem =
                      cartItems.find((ci: any) => cartItemKey(ci.variantId, ci.grind) === lineKey) ??
                      cartItems.find((ci: any) => ci.id === line.variantId || (ci.variantId === line.variantId && !ci.grind && !line.grind));
                    const itemId = matchedItem?.id ?? line.variantId ?? line.id;
                    const totalCartQty = matchedItem?.quantity ?? line.quantity;

                    return (
                      <div key={line.id} className={`flex gap-6 pb-6 border-b border-[#1b1b1b]/10 last:border-0 last:pb-0 transition-opacity ${isLoadingCart ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                        <div className="h-24 w-20 bg-[#f0e8dc] border border-[#1b1b1b]/10 flex items-center justify-center overflow-hidden shrink-0">
                          {line.image ? (
                            <img src={line.image} alt={line.title} className="h-full w-full scale-150 object-contain mix-blend-multiply" />
                          ) : (
                            <div className="font-mono text-[0.45rem] text-[#A5622A] tracking-[0.1em] -rotate-90 whitespace-nowrap">
                              KAHVE
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col justify-center flex-1">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1 pr-4">
                              <span className="font-serif text-[1.1rem] text-[#1b1b1b] leading-tight block">{line.title}</span>
                              {line.grind && (
                                <span className="mt-1 block font-sans text-[0.8rem] text-[#5c4635]">Öğütme: {canonicalGrind(line.grind)}</span>
                              )}
                              {line.discountTitles && line.discountTitles.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-1.5">
                                  {line.discountTitles.map((label: string) => (
                                    <span key={label} className="inline-flex items-center gap-1 font-mono text-[0.55rem] tracking-[0.1em] uppercase text-[#A5622A]">
                                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                                      </svg>
                                      {label}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => {
                                if (totalCartQty - line.quantity <= 0) {
                                  removeFromCart(itemId);
                                } else {
                                  updateQuantity(itemId, -line.quantity);
                                }
                              }}
                              className="text-[#1b1b1b]/30 hover:text-[#8b2f22] transition-colors p-1"
                              title="Sepetten Çıkar"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="flex items-end justify-between mt-auto">
                            <div className="flex items-center gap-3 border border-[#1b1b1b]/20 px-2 py-1 bg-[#f0e8dc] w-fit">
                              <button
                                type="button"
                                onClick={() => { if (line.quantity > 1) updateQuantity(itemId, -1); }}
                                disabled={isLoadingCart || line.quantity <= 1}
                                className="text-[#A5622A] hover:text-[#1b1b1b] disabled:opacity-30 w-5 h-5 flex items-center justify-center text-lg leading-none"
                              >
                                -
                              </button>
                              <span className="font-mono text-[0.65rem] text-[#1b1b1b] min-w-[16px] text-center font-medium">
                                {line.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(itemId, 1)}
                                disabled={isLoadingCart}
                                className="text-[#A5622A] hover:text-[#1b1b1b] disabled:opacity-30 w-5 h-5 flex items-center justify-center text-lg leading-none"
                              >
                                +
                              </button>
                            </div>

                            <div className="flex gap-3 items-center">
                              {isFree && (
                                <span className="font-mono text-[0.8rem] text-[#9b9288] line-through">
                                  ₺{(line.originalPrice * line.quantity).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                </span>
                              )}
                              <span className={`font-mono font-semibold text-[0.95rem] ${line.discountedPrice === 0 ? 'text-[#A56A3F] italic' : 'text-[#1b1b1b]'}`}>
                                {line.discountedPrice === 0 ? 'ÜCRETSİZ' : `₺${(line.discountedPrice * line.quantity).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          

            {/* Ücretsiz kargoya kalan tutarı tamamlayan kahve önerileri (sepet çekmecesindekiyle aynı) */}
            {shopifyCart && !shipping.isFree && (
              <FreeShippingSuggestions
                cartItems={cartItems}
                remaining={shipping.remaining}
                layout="page"
                onPick={(s) => setQuickAdd({ handle: s.product.handle, variantId: s.variant.id })}
              />
            )}

            {error && (
              <div className="bg-[#fdfaf6] border border-[#8b2f22]/20 p-5 flex items-start gap-3">
                <span className="text-[#8b2f22] text-lg mt-0.5">!</span>
                <p className="font-sans text-[0.85rem] text-[#1b1b1b] leading-relaxed">{error}</p>
              </div>
            )}
          </div>

          {/* SAĞ PANEL */}
          <div className="lg:col-span-4">
            <div className="bg-[#fdfaf6] border border-[#1b1b1b]/10 p-6 sticky top-[130px]">
              <h3 className="font-mono text-[0.65rem] tracking-[0.2em] uppercase text-[#1b1b1b] pb-4 border-b border-[#1b1b1b]/10">
                Sipariş Özeti
              </h3>

              {/* Kargo durumu */}
              <div className="flex flex-col gap-2.5 py-4">
                <div className="font-sans text-[0.85rem] text-[#5c4635] text-center">
                  <ShippingNotice status={shipping} strongClassName="text-[#1b1b1b] font-medium" short />
                </div>
                <div className="h-1.5 w-full bg-[#1b1b1b]/10 overflow-hidden">
                  <div
                    className="h-full bg-[#A5622A] transition-all duration-700 ease-out"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>

              {/* Sipariş notu — açılır satır */}
              <div className="border-t border-[#1b1b1b]/10">
                <button
                  type="button"
                  onClick={() => setNoteOpen((o) => !o)}
                  aria-expanded={noteOpen}
                  className="flex w-full items-center justify-between py-3 text-left font-sans text-[0.9rem] text-[#1b1b1b]"
                >
                  <span>
                    Sipariş notu ekle
                    {!noteOpen && orderNote.trim() && <span className="ml-2 font-sans text-[0.75rem] text-[#A5622A]">✓ eklendi</span>}
                  </span>
                  {noteOpen ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                </button>
                {noteOpen && (
                  <textarea
                    id="orderNote"
                    aria-label="Sipariş notu"
                    value={orderNote}
                    onChange={(e) => setOrderNote(e.target.value)}
                    className="mb-3 w-full bg-[#f0e8dc] border border-[#1b1b1b]/10 px-3 py-2.5 font-sans text-[16px] md:text-[0.85rem] text-[#1b1b1b] resize-none focus:outline-none focus:border-[#1b1b1b]/40 transition-colors placeholder:text-[#9b9288]"
                    rows={3}
                    placeholder="Siparişinizle ilgili notunuz…"
                    autoFocus
                  />
                )}
              </div>

              {/* İndirim kodu — açılır satır */}
              <div className="border-b border-[#1b1b1b]/10">
                {appliedCode ? (
                  <div className="flex items-center justify-between py-3">
                    <span className="flex items-center gap-2 font-sans text-[0.9rem] text-[#1b1b1b]">
                      <ShieldCheck className="w-4 h-4 text-[#A5622A]" /> İndirim kodu
                      <span className="font-mono font-semibold text-[0.65rem] bg-[#1b1b1b] text-[#f7f0e7] px-2 py-0.5">{appliedCode}</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleRemoveDiscount}
                      disabled={isApplyingDiscount}
                      aria-label="İndirim kodunu kaldır"
                      className="text-[#1b1b1b]/40 hover:text-[#8b2f22] transition-colors disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => setCodeOpen((o) => !o)}
                      aria-expanded={codeOpen}
                      className="flex w-full items-center justify-between py-3 text-left font-sans text-[0.9rem] text-[#1b1b1b]"
                    >
                      İndirim kodum var
                      {codeOpen ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                    </button>
                    {codeOpen && (
                      <form onSubmit={handleApplyDiscount} className="mb-3 flex gap-2">
                        <input
                          type="text"
                          value={discountInput}
                          onChange={(e) => setDiscountInput(e.target.value)}
                          placeholder="İndirim kodu"
                          aria-label="İndirim kodu"
                          autoFocus
                          className="min-w-0 flex-1 bg-[#f0e8dc] border border-[#1b1b1b]/10 px-3 py-2.5 font-mono text-[16px] md:text-[0.8rem] uppercase tracking-[0.06em] focus:outline-none focus:border-[#1b1b1b]/40 transition-colors placeholder:normal-case placeholder:tracking-normal placeholder:font-sans placeholder:text-[#9b9288]"
                          disabled={isApplyingDiscount}
                        />
                        <button
                          type="submit"
                          disabled={!discountInput.trim() || isApplyingDiscount}
                          className="bg-[#1b1b1b] text-[#f7f0e7] px-4 font-mono text-[0.6rem] tracking-[0.15em] uppercase disabled:bg-[#1b1b1b]/20 disabled:text-[#9b9288] transition-colors hover:bg-[#A5622A]"
                        >
                          {isApplyingDiscount ? '...' : 'Uygula'}
                        </button>
                      </form>
                    )}
                  </>
                )}
                {discountError && (
                  <p className="mb-3 text-[#8b2f22] font-sans text-[0.75rem]">{discountError}</p>
                )}
              </div>

              {/* Tutarlar */}
              {shopifyCart && (
                <>
                  <div className={`flex flex-col gap-2.5 py-4 transition-opacity ${isLoadingCart ? 'opacity-50' : ''}`}>
                    <div className="flex justify-between items-center">
                      <span className="font-sans text-[0.9rem] text-[#7b6a5c]">Ara toplam</span>
                      <span className="font-mono text-[0.9rem] font-semibold text-[#1b1b1b]">
                        ₺{shopifyCart.subtotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    {shopifyCart.discount > 0 && (
                      <div className="flex justify-between items-start gap-3">
                        <span className="font-sans text-[0.85rem] text-[#A5622A] min-w-0 break-words">
                          {appliedCode
                            ? 'Kod indirimi'
                            : shopifyCart.discountTitles && shopifyCart.discountTitles.length > 0
                              ? shopifyCart.discountTitles.join(' + ')
                              : 'Sepet indirimi'}
                        </span>
                        <span className="font-mono text-[0.9rem] font-semibold text-[#8b2f22] shrink-0">
                          −₺{shopifyCart.discount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between items-center">
                      <span className="font-sans text-[0.9rem] text-[#7b6a5c]">Kargo</span>
                      {shopifyCart.shippingCost !== null && shopifyCart.shippingCost !== undefined ? (
                        shopifyCart.shippingCost === 0
                          ? <span className="font-sans text-[0.85rem] font-medium text-[#A5622A]">Ücretsiz</span>
                          : <span className="font-mono text-[0.9rem] text-[#1b1b1b]">₺{shopifyCart.shippingCost.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                      ) : shipping.isFree ? (
                        <span className="font-sans text-[0.85rem] font-medium text-[#A5622A]">Ücretsiz</span>
                      ) : (
                        <span className="font-sans text-[0.8rem] text-[#7b6a5c]">Ödeme adımında hesaplanır</span>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-center border-t border-[#1b1b1b]/10 pt-4 mb-6">
                    <span className="font-sans text-[1.05rem] font-semibold text-[#1b1b1b]">Toplam</span>
                    <span className="font-mono font-semibold text-[1.4rem] text-[#1b1b1b] leading-none">
                      ₺{(shopifyCart.total + (shopifyCart.shippingCost ?? 0)).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </>
              )}

              <button
                ref={mainButtonRef}
                onClick={handleCheckoutRedirect}
                disabled={isProcessing || isLoadingCart || !!error}
                className={`w-full py-4 font-mono text-[0.60rem] font-bold tracking-[0.15em] uppercase transition-colors flex items-center justify-center gap-3 ${
                  (isProcessing || isLoadingCart || !!error)
                    ? 'bg-[#1b1b1b]/10 text-[#9b9288] cursor-not-allowed border border-[#1b1b1b]/10'
                    : 'bg-[#1b1b1b] text-[#f7f0e7] border border-[#1b1b1b] hover:bg-[#A5622A] hover:border-[#A5622A]'
                }`}
              >
                {isLoadingCart ? (
                  'Hesaplanıyor...'
                ) : isProcessing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-[#9b9288]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Yönlendiriliyor...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    Güvenli Ödemeye Geç
                  </>
                )}
              </button>
              <p className="font-mono text-[0.5rem] tracking-[0.1em] text-[#9b9288] uppercase text-center mt-4">
                Shopify altyapısına aktarılacaksınız
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* MOBİL: sabit ödeme çubuğu — yalnızca sayfadaki ödeme düğmesi ekranda değilken görünür */}
      <div
        aria-hidden={mainButtonVisible}
        className={`fixed inset-x-0 bottom-0 z-50 border-t border-[#1b1b1b]/15 bg-[#fdfaf6] px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-10px_40px_rgba(0,0,0,0.08)] transition-transform duration-300 lg:hidden ${
          mainButtonVisible ? 'pointer-events-none translate-y-full' : 'translate-y-0'
        }`}
      >
        <div className="mb-2 flex h-6 items-center justify-between gap-3">
          <span className="font-mono text-[0.58rem] uppercase tracking-[0.18em] text-[#5c4635]">
            Toplam{shipping.isFree ? ' · Kargo ücretsiz' : ''}
          </span>
          <span className="font-mono text-[1rem] font-semibold leading-none text-[#1b1b1b]">
            {shopifyCart
              ? `₺${(shopifyCart.total + (shopifyCart.shippingCost ?? 0)).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`
              : '—'}
          </span>
        </div>
        <button
          onClick={handleCheckoutRedirect}
          disabled={checkoutDisabled}
          tabIndex={mainButtonVisible ? -1 : 0}
          className={`flex h-[52px] w-full items-center justify-center gap-3 font-mono text-[0.62rem] font-bold uppercase tracking-[0.15em] transition-colors ${
            checkoutDisabled
              ? 'cursor-not-allowed border border-[#1b1b1b]/10 bg-[#1b1b1b]/10 text-[#9b9288]'
              : 'border border-[#1b1b1b] bg-[#1b1b1b] text-[#f7f0e7]'
          }`}
        >
          {isLoadingCart ? 'Hesaplanıyor...' : isProcessing ? 'Yönlendiriliyor...' : (<><Lock className="h-4 w-4" /> Güvenli Ödemeye Geç</>)}
        </button>
      </div>
      {/* Öneriden hızlı ekleme — öğütme/gramaj seçimi burada yapılır */}
      {quickAdd && (
        <QuickAddModal
          handle={quickAdd.handle}
          initialVariantId={quickAdd.variantId}
          onClose={() => setQuickAdd(null)}
        />
      )}
    </main>
  );
}
