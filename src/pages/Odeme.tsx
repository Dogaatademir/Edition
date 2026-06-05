// src/pages/Odeme.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Lock, ArrowLeft, ShieldCheck, X } from 'lucide-react';
import { createShopifyCart, type ShopifyCartResponse } from '../lib/shopify';
import { trackEvent } from '../hooks/useAnalytics';
import { getSessionId } from '../lib/session';
import { useMetaViewCart } from '../hooks/useMetaAnalytics';
import { gAdsBeginCheckout } from '../lib/Googleads'; // ← YENİ

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
  const [shopifyCart, setShopifyCart] = useState<ShopifyCartResponse | null>(null);

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
  const freeShippingThreshold = 850;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - currentCartTotalForShipping);
  const progressPercentage = Math.min(100, (currentCartTotalForShipping / freeShippingThreshold) * 100);

  return (
    <main className="bg-[#f7f0e7] min-h-screen pt-32 pb-20 font-sans selection:bg-[#1b1b1b] selection:text-[#f7f0e7]">
      <div className="mx-auto max-w-[1200px] px-6 md:px-10">

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pb-6 border-b border-[#1b1b1b]/10">
          <div>
            <Link to="/kahveler" className="font-mono text-[0.55rem] tracking-[0.2em] uppercase text-[#C17A3A] hover:text-[#1b1b1b] transition-colors flex items-center gap-2 mb-4">
              <ArrowLeft className="w-3 h-3" /> Seçkiye Dön
            </Link>
            <h1 className="font-serif text-[clamp(2rem,3vw,2.5rem)] text-[#1b1b1b] leading-tight tracking-[-0.02em]">
              Güvenli <em className="italic text-[#C17A3A]">Ödeme</em>
            </h1>
          </div>
          <div className="flex items-center gap-2 text-[#C17A3A]">
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
                    const matchedItem = cartItems.find(
                      (ci: any) => ci.id === line.variantId || ci.variantId === line.variantId
                    );
                    const itemId = matchedItem?.id ?? line.variantId ?? line.id;
                    const totalCartQty = matchedItem?.quantity ?? line.quantity;

                    return (
                      <div key={line.id} className={`flex gap-6 pb-6 border-b border-[#1b1b1b]/10 last:border-0 last:pb-0 transition-opacity ${isLoadingCart ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                        <div className="h-24 w-20 bg-[#f0e8dc] border border-[#1b1b1b]/10 flex items-center justify-center p-2 shrink-0">
                          {line.image ? (
                            <img src={line.image} alt={line.title} className="h-full w-full object-contain mix-blend-multiply" />
                          ) : (
                            <div className="font-mono text-[0.45rem] text-[#C17A3A] tracking-[0.1em] -rotate-90 whitespace-nowrap">
                              KAHVE
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col justify-center flex-1">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1 pr-4">
                              <span className="font-serif text-[1.1rem] text-[#1b1b1b] leading-tight block">{line.title}</span>
                              {line.discountTitles && line.discountTitles.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-1.5">
                                  {line.discountTitles.map((label: string) => (
                                    <span key={label} className="inline-flex items-center gap-1 font-mono text-[0.55rem] tracking-[0.1em] uppercase text-[#C17A3A]">
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
                                className="text-[#C17A3A] hover:text-[#1b1b1b] disabled:opacity-30 w-5 h-5 flex items-center justify-center text-lg leading-none"
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
                                className="text-[#C17A3A] hover:text-[#1b1b1b] disabled:opacity-30 w-5 h-5 flex items-center justify-center text-lg leading-none"
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
                              <span className={`font-mono font-semibold text-[0.95rem] ${line.discountedPrice === 0 ? 'text-[#c38152] italic' : 'text-[#1b1b1b]'}`}>
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
              <h3 className="font-mono text-[0.65rem] tracking-[0.2em] uppercase text-[#1b1b1b] mb-6 pb-4 border-b border-[#1b1b1b]/10">
                Sipariş Özeti
              </h3>

              <div className="px-4 py-4 flex flex-col gap-3 mb-6">
                <div className="font-sans text-[0.8rem] text-[#5c4635] text-center">
                  {remainingForFreeShipping > 0 ? (
                    <>Ücretsiz Kargo için <strong className="text-[#1b1b1b] font-medium">{remainingForFreeShipping.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</strong> değerinde ürün ekleyin.</>
                  ) : (
                    <span className="text-[#1b1b1b] font-medium bg-transparent">Sepetiniz ücretsiz kargo hakkı kazandı!</span>
                  )}
                </div>
                <div className="h-1.5 w-full bg-[#fdfaf6] border border-[#1b1b1b]/10 overflow-hidden">
                  <div
                    className="h-full bg-[#c38152] transition-all duration-700 ease-out"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>

              <div className="mb-6">
                <label htmlFor="orderNote" className="block font-mono text-[0.6rem] tracking-[0.1em] text-[#C17A3A] uppercase mb-2">
                  Satıcı İçin Özel Talimatlar
                </label>
                <textarea
                  id="orderNote"
                  value={orderNote}
                  onChange={(e) => setOrderNote(e.target.value)}
                  className="w-full bg-[#f0e8dc] border border-[#1b1b1b]/10 px-4 py-3 font-sans text-[0.85rem] text-[#1b1b1b] resize-none focus:outline-none focus:border-[#1b1b1b]/40 transition-colors placeholder:text-[#9b9288]"
                  rows={3}
                  placeholder="Siparişinizle ilgili notlarınızı buraya ekleyebilirsiniz..."
                />
              </div>

              {!isLoadingCart && shopifyCart && (
                <>
                  <div className="flex flex-col gap-3 border-t border-[#1b1b1b]/10 pt-6 mb-6">
                    <div className="mb-4">
                      {appliedCode ? (
                        <div className="flex items-center justify-between bg-[#f0e8dc] border border-[#1b1b1b]/10 p-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[0.6rem] tracking-[0.15em] uppercase text-[#1b1b1b] flex items-center gap-2">
                              <ShieldCheck className="w-3.5 h-3.5 text-[#c38152]" /> İndirim:
                            </span>
                            <span className="font-mono font-semibold text-[0.65rem] bg-[#1b1b1b] text-[#f7f0e7] px-2 py-0.5">
                              {appliedCode}
                            </span>
                          </div>
                          <button
                            onClick={handleRemoveDiscount}
                            disabled={isApplyingDiscount}
                            className="text-[#1b1b1b]/40 hover:text-[#8b2f22] transition-colors disabled:opacity-50"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <form onSubmit={handleApplyDiscount} className="flex gap-2">
                          <input
                            type="text"
                            value={discountInput}
                            onChange={(e) => setDiscountInput(e.target.value)}
                            placeholder="İNDİRİM KODU"
                            className="flex-1 bg-[#f0e8dc] border border-[#1b1b1b]/10 px-3 py-3 font-mono text-[0.60rem] tracking-[0.1em] uppercase focus:outline-none focus:border-[#1b1b1b]/40 transition-colors placeholder:text-[#9b9288]"
                            disabled={isApplyingDiscount}
                          />
                          <button
                            type="submit"
                            disabled={!discountInput.trim() || isApplyingDiscount}
                            className="bg-[#1b1b1b] text-[#f7f0e7] px-4 font-mono text-[0.6rem] tracking-[0.15em] uppercase disabled:bg-[#1b1b1b]/20 disabled:text-[#9b9288] transition-colors hover:bg-[#C17A3A]"
                          >
                            {isApplyingDiscount ? '...' : 'UYGULA'}
                          </button>
                        </form>
                      )}
                      {discountError && (
                        <p className="mt-2 text-[#8b2f22] font-sans text-[0.75rem]">{discountError}</p>
                      )}
                    </div>

                    <div className="flex justify-between items-center text-[#5c4635]">
                      <span className="font-sans text-[0.9rem]">Ara Toplam</span>
                      <span className="font-mono text-[0.85rem] text-[#1b1b1b]">
                        ₺{shopifyCart.subtotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    {shopifyCart.discount > 0 && (
                      <div className="flex justify-between items-center py-2.5 px-3 bg-[#f0e8dc] border-l-2 border-[#c38152]">
                        <div className="flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 text-[#c38152] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                          <span className="font-mono text-[0.58rem] tracking-[0.14em] uppercase text-[#C17A3A]">
                            {appliedCode ? 'Kod İndirimi' : 'Sepet İndirimi'}
                          </span>
                        </div>
                        <span className="font-mono text-[0.9rem] font-semibold text-[#8b2f22]">
                          −₺{shopifyCart.discount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between items-center text-[#5c4635]">
                      <span className="font-sans text-[0.9rem]">Kargo</span>
                      {shopifyCart.shippingCost !== null && shopifyCart.shippingCost !== undefined ? (
                        <span className="font-mono text-[0.85rem] text-[#1b1b1b]">
                          {shopifyCart.shippingCost === 0
                            ? <span className="tracking-wide text-[#C17A3A]">ÜCRETSİZ</span>
                            : `₺${shopifyCart.shippingCost.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`}
                        </span>
                      ) : (
                        <span className="font-mono text-[0.70rem] text-[#9b9288] tracking-wide">
                          ÖDEME ADIMINDA HESAPLANACAK
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-end border-t border-[#1b1b1b] pt-6 mb-8">
                    <span className="font-mono text-[0.65rem] tracking-[0.2em] uppercase text-[#1b1b1b]">Toplam Fiyat</span>
                    <span className="font-mono font-semibold text-[1.4rem] text-[#1b1b1b] leading-none">
                      ₺{(shopifyCart.total + (shopifyCart.shippingCost ?? 0)).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </>
              )}

              <button
                onClick={handleCheckoutRedirect}
                disabled={isProcessing || isLoadingCart || !!error}
                className={`w-full py-4 font-mono text-[0.60rem] font-bold tracking-[0.15em] uppercase transition-colors flex items-center justify-center gap-3 ${
                  (isProcessing || isLoadingCart || !!error)
                    ? 'bg-[#1b1b1b]/10 text-[#9b9288] cursor-not-allowed border border-[#1b1b1b]/10'
                    : 'bg-[#1b1b1b] text-[#f7f0e7] border border-[#1b1b1b] hover:bg-[#C17A3A] hover:border-[#C17A3A]'
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
    </main>
  );
}