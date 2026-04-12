// src/pages/Odeme.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Lock, ArrowLeft, ShieldCheck, CreditCard, Truck, X } from 'lucide-react';
import { createShopifyCart, type ShopifyCartResponse } from '../lib/shopify';

// Context için genişletilmiş tip — CartContext.tsx ile birebir uyumlu
interface CartContextType {
  cartItems: any[];
  updateQuantity: (id: string | number, delta: number) => void;
  removeFromCart: (id: string | number) => void;
  [key: string]: any;
}

export default function Odeme() {
  const { cartItems, updateQuantity, removeFromCart } = useCart() as CartContextType;
  const navigate = useNavigate();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoadingCart, setIsLoadingCart] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // İndirim Kodu State'leri
  const [discountInput, setDiscountInput] = useState('');
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [discountError, setDiscountError] = useState<string | null>(null);
  const [isApplyingDiscount, setIsApplyingDiscount] = useState(false);
  
  // Sipariş Notu State'i
  const [orderNote, setOrderNote] = useState('');
  
  const [shopifyCart, setShopifyCart] = useState<ShopifyCartResponse | null>(null);

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

  // Sayfa yüklendiğinde bir kez tepeye kaydır (Miktar güncellendiğinde sıçramayı önlemek için ayrıldı)
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Sepet değiştiğinde Shopify'dan güncel sepeti çek
  useEffect(() => {
    if (cartItems.length === 0) {
      navigate('/kahveler');
      return;
    }
    fetchCartFromShopify(appliedCode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartItems, navigate]);

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

const handleCheckoutRedirect = () => {
    if (shopifyCart?.checkoutUrl) {
      setIsProcessing(true);
      
      let finalCheckoutUrl = shopifyCart.checkoutUrl;
      
      // Eğer kullanıcı sipariş notu girdiyse, bunu Shopify checkout URL'sine ekleyelim
      if (orderNote.trim() !== '') {
        try {
          const urlObj = new URL(finalCheckoutUrl);
          // Shopify URL yapısına notu query parameter olarak ekliyoruz
          urlObj.searchParams.append('note', orderNote.trim());
          
          // Bazı Shopify temaları custom attributes okumayı tercih eder, 
          // garantilemek için attribute olarak da ekleyebiliriz:
          urlObj.searchParams.append('attributes[Sipariş Notu]', orderNote.trim());
          
          finalCheckoutUrl = urlObj.toString();
        } catch (e) {
          // Beklenmeyen bir URL formatıysa fallback olarak düz string birleştirme yapalım
          const separator = finalCheckoutUrl.includes('?') ? '&' : '?';
          finalCheckoutUrl = `${finalCheckoutUrl}${separator}note=${encodeURIComponent(orderNote.trim())}`;
        }
      }
      
      window.location.href = finalCheckoutUrl;
    }
  };

  if (cartItems.length === 0) return null;

  // --- KARGO BAREMİ HESAPLAMALARI ---
  const currentCartTotalForShipping = shopifyCart ? (shopifyCart.subtotal - shopifyCart.discount) : 0;
  const freeShippingThreshold = 850;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - currentCartTotalForShipping);
  const progressPercentage = Math.min(100, (currentCartTotalForShipping / freeShippingThreshold) * 100);

  return (
    <main className="bg-[#FFFFFF] min-h-screen pt-32 pb-20 font-sans selection:bg-[#000000] selection:text-[#FFFFFF]">
      <div className="mx-auto max-w-[1200px] px-6 md:px-10">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pb-6 border-b border-[#E5E5E5]">
          <div>
            <Link to="/kahveler" className="font-mono text-[0.55rem] tracking-[0.2em] uppercase text-[#888888] hover:text-[#000000] transition-colors flex items-center gap-2 mb-4">
              <ArrowLeft className="w-3 h-3" /> Seçkiye Dön
            </Link>
            <h1 className="font-serif text-[clamp(2rem,3vw,2.5rem)] text-[#000000] leading-tight">
              Güvenli <em className="italic text-[#555555]">Ödeme</em>
            </h1>
          </div>
          <div className="flex items-center gap-2 text-[#555555]">
            <Lock className="w-4 h-4" />
            <span className="font-mono text-[0.6rem] tracking-[0.15em] uppercase">256-BIT SSL GÜVENCESİYLE</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          
          {/* SOL PANEL - Sepet İçeriği ve Bilgilendirme */}
          <div className="lg:col-span-8 flex flex-col gap-8">
            
            {/* ÜRÜNLER LİSTESİ */}
            <div className="bg-[#FFFFFF] border border-[#E5E5E5] p-6 md:p-8">
              <h2 className="font-mono text-[0.7rem] tracking-[0.2em] uppercase text-[#000000] mb-6 pb-4 border-b border-[#E5E5E5]">
                Sepetiniz
              </h2>
              
              <div className="flex flex-col gap-6">
                {isLoadingCart && !shopifyCart ? (
                  <div className="animate-pulse flex flex-col gap-6">
                    {[1, 2].map((i) => (
                      <div key={i} className="flex gap-6 pb-6 border-b border-[#E5E5E5] last:border-0 last:pb-0">
                        <div className="h-24 w-20 bg-[#E5E5E5] shrink-0"></div>
                        <div className="flex flex-col justify-center flex-1 gap-3">
                          <div className="h-5 bg-[#E5E5E5] w-2/4"></div>
                          <div className="h-4 bg-[#E5E5E5] w-1/4"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  shopifyCart?.lines?.map((line: any) => {
                    const isFree = line.discountedPrice === 0 || line.originalPrice > line.discountedPrice;
                    // cartItems içinde variantId veya id'si Shopify line.variantId ile eşleşen ürünü bul
                    const matchedItem = cartItems.find(
                      (ci: any) => ci.id === line.variantId || ci.variantId === line.variantId
                    );
                    const itemId = matchedItem?.id ?? line.variantId ?? line.id;
                    const totalCartQty = matchedItem?.quantity ?? line.quantity;

                    return (
                      <div key={line.id} className={`flex gap-6 pb-6 border-b border-[#E5E5E5] last:border-0 last:pb-0 transition-opacity ${isLoadingCart ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                        <div className="h-24 w-20 bg-[#FAFAFA] border border-[#E5E5E5] flex items-center justify-center p-2 shrink-0">
                          {line.image ? (
                            <img src={line.image} alt={line.title} className="h-full w-full object-contain mix-blend-multiply" />
                          ) : (
                            <div className="font-mono text-[0.45rem] text-[#888888] tracking-[0.1em] -rotate-90 whitespace-nowrap">
                              KAHVE
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col justify-center flex-1">
                          
                          {/* Başlık ve Silme Butonu */}
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1 pr-4">
                              <span className="font-serif text-[1.1rem] text-[#000000] leading-tight block">{line.title}</span>
                              {/* 🌟 EKLENDİ: Ürün bazlı indirim etiketleri */}
                              {line.discountTitles && line.discountTitles.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-1.5">
                                  {line.discountTitles.map((label: string) => (
                                    <span
                                      key={label}
                                      className="inline-flex items-center gap-1 font-mono text-[0.55rem] tracking-[0.1em] uppercase text-[#888888]"
                                    >
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
                                // Bu Shopify satırının miktarını cartItems toplamından düş.
                                // Eğer kalan miktar 0 veya altına inecekse ürünü tamamen kaldır.
                                if (totalCartQty - line.quantity <= 0) {
                                  removeFromCart(itemId);
                                } else {
                                  // line.quantity kadar azalt (delta negatif)
                                  updateQuantity(itemId, -line.quantity);
                                }
                              }}
                              className="text-[#AAAAAA] hover:text-[#FF0000] transition-colors p-1"
                              title="Sepetten Çıkar"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="flex items-end justify-between mt-auto">
                            
                            {/* MİKTAR ARTIRMA/AZALTMA BUTONLARI */}
                            <div className="flex items-center gap-3 border border-[#E5E5E5] px-2 py-1 bg-[#FAFAFA] w-fit">
                              <button 
                                type="button"
                                onClick={() => {
                                  if (line.quantity > 1) updateQuantity(itemId, -1);
                                }}
                                disabled={isLoadingCart || line.quantity <= 1}
                                className="text-[#888888] hover:text-[#000000] disabled:opacity-30 w-5 h-5 flex items-center justify-center text-lg leading-none"
                              >
                                -
                              </button>
                              <span className="font-mono text-[0.65rem] text-[#000000] min-w-[16px] text-center font-medium">
                                {line.quantity}
                              </span>
                              <button 
                                type="button"
                                onClick={() => updateQuantity(itemId, 1)}
                                disabled={isLoadingCart}
                                className="text-[#888888] hover:text-[#000000] disabled:opacity-30 w-5 h-5 flex items-center justify-center text-lg leading-none"
                              >
                                +
                              </button>
                            </div>
                            
                            <div className="flex gap-3 items-center">
                              {isFree && (
                                <span className="font-mono text-[0.8rem] text-[#AAAAAA] line-through">
                                  ₺{(line.originalPrice * line.quantity).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                </span>
                              )}
                              <span className={`font-mono font-semibold text-[0.95rem] ${line.discountedPrice === 0 ? 'text-[#000000] italic' : 'text-[#000000]'}`}>
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

            {/* GÜVENLİK VE BİLGİLENDİRME ALANI */}
            <div className="bg-[#FAFAFA] border border-[#E5E5E5] p-8 md:p-10">
              <h2 className="font-mono text-[0.7rem] tracking-[0.15em] uppercase text-[#000000] mb-6 flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-[#000000]" />
                Shopify Güvencesiyle Tamamlayın
              </h2>
              <p className="font-sans text-[0.95rem] font-light text-[#555555] leading-relaxed mb-6">
                Ödeme ve teslimat bilgilerinizi yüksek güvenlikli Shopify altyapısı üzerinden tamamlayacaksınız. Adres bilgileri ve kart güvenliğiniz doğrudan global ödeme sağlayıcıları tarafından uçtan uca şifrelenir.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-8 border-t border-[#E5E5E5] pt-8">
                <div className="flex flex-col gap-2">
                  <CreditCard className="w-5 h-5 text-[#888888]" />
                  <span className="font-mono text-[0.6rem] tracking-[0.1em] uppercase text-[#000000]">Tüm Kartlara Taksit</span>
                  <span className="font-sans text-[0.8rem] text-[#555555]">Kredi kartı veya banka kartınızla 3D Secure güvencesinde ödeyin.</span>
                </div>
                <div className="flex flex-col gap-2">
                  <Truck className="w-5 h-5 text-[#888888]" />
                  <span className="font-mono text-[0.6rem] tracking-[0.1em] uppercase text-[#000000]">Hızlı Gönderim</span>
                  <span className="font-sans text-[0.8rem] text-[#555555]">Siparişiniz atölyemizde taze kavrularak kargoya teslim edilir.</span>
                </div>
              </div>
            </div>

            {error && (
              <div className="bg-[#FFF5F5] border border-[#FF0000]/20 p-5 flex items-start gap-3">
                <span className="text-[#FF0000] text-lg mt-0.5">!</span>
                <p className="font-sans text-[0.85rem] text-[#000000] leading-relaxed">{error}</p>
              </div>
            )}
          </div>

          {/* SAĞ PANEL - Sipariş Özeti */}
          <div className="lg:col-span-4">
            <div className="bg-[#FFFFFF] border border-[#E5E5E5] p-6 sticky top-[130px]">
              <h3 className="font-mono text-[0.65rem] tracking-[0.2em] uppercase text-[#000000] mb-6 pb-4 border-b border-[#E5E5E5]">
                Sipariş Özeti
              </h3>

              {/* KARGO BAREMİ PROGRESS BAR */}
              <div className="bg-[#FAFAFA] border border-[#E5E5E5] px-4 py-4 flex flex-col gap-3 shadow-sm mb-6">
                <div className="font-sans text-[0.8rem] text-[#555555] text-center">
                  {remainingForFreeShipping > 0 ? (
                    <>Ücretsiz Kargo için <strong className="text-[#000000] font-medium">{remainingForFreeShipping.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</strong> değerinde ürün ekleyin.</>
                  ) : (
                    <span className="text-[#000000] font-medium">🎉 Sepetiniz ücretsiz kargo hakkı kazandı!</span>
                  )}
                </div>
                <div className="h-1.5 w-full bg-[#FFFFFF] border border-[#E5E5E5] overflow-hidden">
                  <div 
                    className="h-full bg-[#000000] transition-all duration-700 ease-out"
                    style={{ width: `${progressPercentage}%` }}
                  />
                </div>
              </div>

              {/* SATICI İÇİN ÖZEL TALİMATLAR */}
              <div className="mb-6">
                <label htmlFor="orderNote" className="block font-mono text-[0.6rem] tracking-[0.1em] text-[#555555] uppercase mb-2">
                  Satıcı İçin Özel Talimatlar
                </label>
                <textarea 
                  id="orderNote"
                  value={orderNote}
                  onChange={(e) => setOrderNote(e.target.value)}
                  className="w-full bg-[#FAFAFA] border border-[#E5E5E5] px-4 py-3 font-sans text-[0.85rem] text-[#000000] resize-none focus:outline-none focus:border-[#000000] transition-colors placeholder:text-[#AAAAAA]"
                  rows={3} 
                  placeholder="Siparişinizle ilgili notlarınızı buraya ekleyebilirsiniz..."
                />
              </div>

              {/* TOPLAMLAR & İNDİRİM UYGULAMA */}
              {!isLoadingCart && shopifyCart && (
                <>
                  <div className="flex flex-col gap-3 border-t border-[#E5E5E5] pt-6 mb-6">
                    
                    <div className="mb-4">
                      {appliedCode ? (
                        <div className="flex items-center justify-between bg-[#FAFAFA] border border-[#E5E5E5] p-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[0.6rem] tracking-[0.15em] uppercase text-[#000000] flex items-center gap-2">
                              <ShieldCheck className="w-3.5 h-3.5" /> İndirim:
                            </span>
                            <span className="font-mono font-semibold text-[0.65rem] bg-[#000000] text-[#FFFFFF] px-2 py-0.5">
                              {appliedCode}
                            </span>
                          </div>
                          <button 
                            onClick={handleRemoveDiscount}
                            disabled={isApplyingDiscount}
                            className="text-[#888888] hover:text-[#FF0000] transition-colors disabled:opacity-50"
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
                            className="flex-1 bg-[#FAFAFA] border border-[#E5E5E5] px-3 py-3 font-mono text-[0.60rem] tracking-[0.1em] uppercase focus:outline-none focus:border-[#000000] transition-colors placeholder:text-[#AAAAAA]"
                            disabled={isApplyingDiscount}
                          />
                          <button 
                            type="submit"
                            disabled={!discountInput.trim() || isApplyingDiscount}
                            className="bg-[#000000] text-[#FFFFFF] px-4 font-mono text-[0.6rem] tracking-[0.15em] uppercase disabled:bg-[#E5E5E5] disabled:text-[#888888] transition-colors"
                          >
                            {isApplyingDiscount ? '...' : 'UYGULA'}
                          </button>
                        </form>
                      )}
                      
                      {discountError && (
                        <p className="mt-2 text-[#FF0000] font-sans text-[0.75rem]">{discountError}</p>
                      )}
                    </div>

                    <div className="flex justify-between items-center text-[#555555]">
                      <span className="font-sans text-[0.9rem]">Ara Toplam</span>
                      <span className="font-mono text-[0.85rem] text-[#000000]">
                        ₺{shopifyCart.subtotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    {shopifyCart.discount > 0 && (
                      <div className="flex flex-col gap-2 py-2">
                        <div className="flex items-center gap-2 bg-[#000000] px-3 py-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-[#FFFFFF] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                          <span className="font-mono text-[0.55rem] tracking-[0.15em] uppercase text-[#FFFFFF] leading-tight">
                            {appliedCode ? 'Kod İndirimi' : 'Sepet İndirimi'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center px-1 mt-1">
                          <span className="font-sans text-[0.85rem] text-[#555555]">
                            İndirim Tutarı
                          </span>
                          <span className="font-mono text-[0.9rem] font-semibold text-[#000000]">
                            −₺{shopifyCart.discount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-between items-center text-[#555555]">
                      <span className="font-sans text-[0.9rem]">Kargo</span>
                      {shopifyCart.shippingCost !== null && shopifyCart.shippingCost !== undefined ? (
                        <span className="font-mono text-[0.85rem] text-[#000000]">
                          {shopifyCart.shippingCost === 0
                            ? <span className="tracking-wide text-[#555555]">ÜCRETSİZ</span>
                            : `₺${shopifyCart.shippingCost.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`
                          }
                        </span>
                      ) : (
                        <span className="font-mono text-[0.70rem] text-[#888888] tracking-wide">
                          ADIMINDA HESAPLANACAK
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between items-end border-t border-[#000000] pt-6 mb-8">
                    <span className="font-mono text-[0.65rem] tracking-[0.2em] uppercase text-[#000000]">Toplam Fiyat</span>
                    <span className="font-mono font-semibold text-[1.4rem] text-[#000000] leading-none">
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
                    ? 'bg-[#E5E5E5] text-[#888888] cursor-not-allowed border border-[#E5E5E5]' 
                    : 'bg-[#000000] text-[#FFFFFF] border border-[#000000] hover:bg-[#555555] hover:border-[#555555]'
                }`}
              >
                {isLoadingCart ? (
                  'Hesaplanıyor...'
                ) : isProcessing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-[#888888]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
              <p className="font-mono text-[0.5rem] tracking-[0.1em] text-[#888888] uppercase text-center mt-4">
                Shopify altyapısına aktarılacaksınız
              </p>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}