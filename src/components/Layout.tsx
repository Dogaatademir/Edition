// src/components/Layout.tsx
import { type ReactNode, useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  ShoppingBag, 
  User, 
  Search, 
  X,
  Trash2,
  Plus,
  Minus,
  Info,
  Instagram,
  AlertCircle,
  ArrowRight,
  Menu,
  ChevronDown
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext'; // Auth context eklendi
import { useAnalytics } from '../hooks/useAnalytics';

// --- DUYURU ŞERİDİ (ANNOUNCEMENT BAR) BİLEŞENİ ---
const AnnouncementBar = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const messages = [
    "%25'E VARAN İNDİRİMLİ KAHVE SEÇKİSİNİ KEŞFET",
    "850 TL VE ÜZERİ SİPARİŞLERDE ÜCRETSİZ KARGO"
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % messages.length);
    }, 4000); 
    return () => clearInterval(timer);
  }, [messages.length]);

  return (
    <div className="bg-[#1A0F08] text-[#FDFAF6] h-10 overflow-hidden px-4">
      <div 
        className="transition-transform duration-700 ease-in-out flex flex-col w-full h-full"
        style={{ transform: `translateY(-${currentIndex * 100}%)` }}
      >
        {messages.map((msg, i) => (
          <div key={i} className="h-full w-full flex items-center justify-center shrink-0">
            <span className="font-mono text-[0.65rem] tracking-[0.15em] text-center">
              {msg}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- ÇEREZ BANNER BİLEŞENİ ---
const CookieBanner = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAction = (type: 'accepted' | 'declined') => {
    localStorage.setItem('cookie-consent', type);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 md:bottom-8 md:left-8 z-[100] md:max-w-md animate-in slide-in-from-bottom-4 duration-700 fade-in">
      <div className="bg-[#FDFAF6] p-7 border border-[#1A0F08] shadow-2xl relative">
        <button 
          onClick={() => setIsVisible(false)}
          className="absolute top-5 right-5 text-[#7B6A5C] hover:text-[#1A0F08] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="mb-6">
          <div className="font-mono text-[0.55rem] tracking-[0.2em] uppercase text-[#7B6A5C] mb-2 flex items-center gap-2 before:content-[''] before:block before:w-3 before:h-[1px] before:bg-[#7B6A5C]">
            ÇEREZ POLİTİKASI
          </div>
          <h4 className="font-serif text-[1.2rem] text-[#1A0F08] mb-2 leading-tight">Deneyim tercihiniz</h4>
          <p className="font-sans font-light text-[0.85rem] text-[#C17A3A] leading-relaxed">
            Alışveriş deneyiminizi iyileştirmek için yasal düzenlemelere uygun çerezler kullanıyoruz. Detaylı bilgiye Gizlilik ve Çerez Politikası sayfamızdan erişebilirsiniz. <Link to="/kvkk" className="text-[#1A0F08] border-b border-[#1A0F08] ml-2 hover:text-[#C17A3A] hover:border-[#5C4635] transition-colors">Detaylar</Link>
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => handleAction('accepted')}
            className="flex-1 bg-[#C17A3A] text-[#FDFAF6] px-4 py-3 font-mono text-[0.6rem] tracking-[0.15em] border border-[#C17A3A] hover:bg-[#A0612A] hover:border-[#A0612A] transition-colors"
          >
            ANLADIM
          </button>
         
        </div>
      </div>
    </div>
  );
};

// --- SEPET ÇEKMECESİ (CART DRAWER) ---
const CartDrawer = () => {
  const { cartItems, shopifyCart, isLoadingCart, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity } = useCart();
  const navigate = useNavigate();
  
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  
  const subtotal = shopifyCart ? shopifyCart.subtotal : 0;
  const discount = shopifyCart ? shopifyCart.discount : 0;
  const finalPrice = shopifyCart ? shopifyCart.total : 0;

  const freeShippingThreshold = 850;
  const currentTotalForShipping = Math.max(0, subtotal - discount);
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - currentTotalForShipping);
  const progressPercentage = Math.min(100, (currentTotalForShipping / freeShippingThreshold) * 100);

  const handleCheckout = () => {
    setCheckoutError(null);
    const hasSubscription = cartItems.some((item: any) => item.isSubscription);
    const hasRegularProduct = cartItems.some((item: any) => !item.isSubscription);

    if (hasSubscription && hasRegularProduct) {
      setCheckoutError("Sepetinizde hem abonelik paketi hem de tekil ürünler bulunuyor. Lütfen ödeme işlemlerini ayrı ayrı tamamlayın.");
      return;
    }

    setIsCartOpen(false);
    const targetPath = hasSubscription ? '/abonelik-odeme' : '/odeme';
    navigate(targetPath);
  };

  return (
    <>
      <div 
        className={`fixed inset-0 z-[60] bg-[#1A0F08]/40 backdrop-blur-sm transition-opacity duration-500 ${isCartOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={() => { setIsCartOpen(false); setCheckoutError(null); }}
      />
      
      <div className={`fixed right-0 top-0 z-[70] h-full w-full max-w-[440px] bg-[#FDFAF6] border-l border-[#1A0F08]/10 transition-transform duration-700 ease-out ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex h-full flex-col">
          
          <div className="flex items-center justify-between border-b border-[#1A0F08]/10 p-6 bg-[#FDFAF6]">
            <h3 className="font-mono text-[0.65rem] tracking-[0.2em] text-[#1A0F08] flex items-center gap-3">
              <span className="w-4 h-[1px] bg-[#1A0F08]"></span> SEPETİNİZ
            </h3>
            <button 
              onClick={() => { setIsCartOpen(false); setCheckoutError(null); }} 
              className="text-[#7B6A5C] hover:text-[#1A0F08] transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 bg-[#F7F0E7]">
            {cartItems.length > 0 ? (
              <div className="flex flex-col gap-5">
                
                <div className="bg-[#FDFAF6] border border-[#1A0F08]/10 px-4 py-4 flex flex-col gap-3 shadow-sm">
                  <div className="font-sans text-[0.8rem] text-[#C17A3A] text-center">
                    {remainingForFreeShipping > 0 ? (
                      <>Ücretsiz Kargo için <strong className="text-[#1A0F08] font-medium">{remainingForFreeShipping.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</strong> değerinde ürün ekleyin.</>
                    ) : (
                      <span className="text-[#1A0F08] font-medium">🎉 Sepetiniz ücretsiz kargo hakkı kazandı!</span>
                    )}
                  </div>
                  <div className="h-1.5 w-full bg-[#F7F0E7] border border-[#1A0F08]/10 overflow-hidden">
                    <div 
                      className="h-full bg-[#C17A3A] transition-all duration-700 ease-out"
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  {isLoadingCart && !shopifyCart ? (
                    <div className="animate-pulse flex flex-col gap-4">
                      {[1, 2].map((i) => (
                        <div key={i} className="flex gap-4 bg-[#FDFAF6] border border-[#1A0F08]/10 p-4">
                          <div className="h-24 w-20 bg-[#1A0F08]/10 shrink-0"></div>
                          <div className="flex flex-1 flex-col justify-between py-1">
                            <div className="h-4 bg-[#1A0F08]/10 w-2/3 mb-2"></div>
                            <div className="h-3 bg-[#1A0F08]/10 w-1/3"></div>
                            <div className="flex justify-between items-end mt-4">
                              <div className="h-8 bg-[#1A0F08]/10 w-20"></div>
                              <div className="h-5 bg-[#1A0F08]/10 w-16"></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    shopifyCart?.lines?.map((line: any) => {
                      const localItem = cartItems.find(
                        (item: any) => item.id === line.variantId || item.variantId === line.variantId
                      );
                      const itemId = localItem?.id ?? line.variantId ?? line.id;
                      const totalCartQty = localItem?.quantity ?? line.quantity;
                      const isSubscription = localItem?.isSubscription || false;
                      const isFree = line.discountedPrice === 0 || line.originalPrice > line.discountedPrice;

                      return (
                        <div key={line.id} className={`flex gap-4 bg-[#FDFAF6] border border-[#1A0F08]/10 p-4 group hover:border-[#1A0F08] transition-colors ${isLoadingCart ? 'opacity-70 pointer-events-none' : 'opacity-100'}`}>
                          <div className="h-24 w-20 bg-[#F7F0E7] border border-[#1A0F08]/10 flex items-center justify-center p-2 shrink-0">
                            {line.image ? (
                               <img src={line.image} alt={line.title} className="h-full w-full object-contain mix-blend-multiply" />
                            ) : (
                               <div className="font-mono text-[0.45rem] text-[#7B6A5C] tracking-[0.1em] -rotate-90 whitespace-nowrap">
                                 {localItem?.code || `KOD-${itemId}`}
                               </div>
                            )}
                          </div>
                          
                          <div className="flex flex-1 flex-col justify-between py-1">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="font-mono text-[0.5rem] tracking-[0.15em] uppercase text-[#7B6A5C] mb-1">
                                   {localItem?.roast || "Taze Kavrum"}
                                </div>
                                <h4 className="font-serif text-[1rem] text-[#1A0F08] leading-snug">{line.title}</h4>
                                {line.discountTitles && line.discountTitles.length > 0 && (
                                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                                    {line.discountTitles.map((label: string) => (
                                      <span
                                        key={label}
                                        className="inline-flex items-center gap-1 font-mono text-[0.5rem] tracking-[0.1em] uppercase text-[#7B6A5C]"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-2.5 h-2.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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
                                  setCheckoutError(null);
                                  if (totalCartQty - line.quantity <= 0) {
                                    removeFromCart(itemId);
                                  } else {
                                    updateQuantity(itemId, -line.quantity);
                                  }
                                }} 
                                className="text-[#7B6A5C] hover:text-[#1A0F08] transition-colors ml-2"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                            
                            <div className="flex items-center justify-between mt-4">
                              {!isSubscription ? (
                                <div className="flex items-center border border-[#1A0F08]/10 bg-[#FDFAF6]">
                                  <button onClick={() => updateQuantity(itemId, -1)} disabled={line.quantity <= 1} className="px-2 py-1.5 text-[#C17A3A] hover:bg-[#F7F0E7] hover:text-[#1A0F08] disabled:opacity-30 transition-colors"><Minus className="h-3 w-3" /></button>
                                  <span className="font-mono text-[0.65rem] px-3 text-[#1A0F08]">{line.quantity}</span>
                                  <button onClick={() => updateQuantity(itemId, 1)} className="px-2 py-1.5 text-[#C17A3A] hover:bg-[#F7F0E7] hover:text-[#1A0F08] transition-colors"><Plus className="h-3 w-3" /></button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1.5 border border-[#1A0F08] px-2 py-1">
                                  <Info className="h-3 w-3 text-[#1A0F08]" />
                                  <span className="font-mono text-[0.5rem] tracking-[0.15em] text-[#1A0F08]">ABONELİK</span>
                                </div>
                              )}
                              <div className="flex flex-col items-end">
                                {isFree && (
                                  <span className="font-mono text-[0.65rem] text-[#AA9988] line-through">
                                    ₺{(line.originalPrice * line.quantity).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                  </span>
                                )}
                                <span className={`font-mono font-semibold text-[0.95rem] ${line.discountedPrice === 0 ? 'text-[#1A0F08] italic' : 'text-[#1A0F08]'}`}>
                                  {line.discountedPrice === 0 ? 'HEDİYE' : `₺${(line.discountedPrice * line.quantity).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`}
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
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center px-4">
                <div className="w-16 h-16 border border-[#1A0F08]/10 bg-[#FDFAF6] flex items-center justify-center mb-6">
                  <span className="font-serif italic text-2xl text-[#7B6A5C] leading-none">0</span>
                </div>
                <h4 className="font-serif text-[1.5rem] text-[#1A0F08] mb-2">Sepetiniz Boş</h4>
                <p className="font-sans font-light text-[0.85rem] text-[#C17A3A] mb-8 max-w-[200px]">Taze kavrum kahvelerimizi ve avantajlı paketleri keşfetmeye başlayın.</p>
                <button 
                  onClick={() => { setIsCartOpen(false); navigate('/kahveler'); }}
                  className="font-mono text-[0.65rem] tracking-[0.15em] text-[#FDFAF6] bg-[#C17A3A] border border-[#C17A3A] px-8 py-3 transition-colors hover:bg-[#A0612A] hover:border-[#A0612A]"
                >
                  KAHVELERİ KEŞFET
                </button>
              </div>
            )}
          </div>

          {cartItems.length > 0 && (
            <div className={`border-t border-[#1A0F08]/10 bg-[#FDFAF6] p-6 mt-auto transition-opacity ${isLoadingCart ? 'opacity-70' : 'opacity-100'}`}>
              
              {checkoutError && (
                <div className="flex items-start gap-3 p-4 bg-[#F7F0E7] border border-[#1A0F08] mb-4">
                  <AlertCircle className="h-4 w-4 text-[#1A0F08] shrink-0 mt-0.5" />
                  <p className="font-sans text-[0.8rem] text-[#1A0F08] leading-relaxed">{checkoutError}</p>
                </div>
              )}
              
              <div className="flex flex-col gap-2 mb-6">
                {discount > 0 && (
                  <div className="flex justify-between items-center text-[#C17A3A] pb-2 border-b border-[#1A0F08]/10 border-dashed">
                    <span className="font-mono text-[0.6rem] tracking-[0.2em] text-[#7B6A5C]">SEPET İNDİRİMİ</span>
                    <span className="font-mono font-medium text-[0.9rem] text-[#1A0F08]">
                      - ₺{discount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                
                <div className="flex justify-between items-center pt-1">
                  <span className="font-mono text-[0.65rem] tracking-[0.2em] text-[#1A0F08]">
                    {isLoadingCart ? 'HESAPLANIYOR...' : 'ARA TOPLAM'}
                  </span>
                  <div className="flex items-center gap-2">
                    {discount > 0 && (
                      <span className="font-mono text-[0.9rem] text-[#AA9988] line-through">
                        ₺{subtotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                      </span>
                    )}
                    <span className="font-mono font-semibold text-[1.3rem] text-[#1A0F08]">
                      ₺{finalPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={handleCheckout} 
                disabled={isLoadingCart || (!shopifyCart && !isLoadingCart)}
                className={`w-full py-4 font-mono text-[0.65rem] tracking-[0.15em] transition-colors flex items-center justify-center gap-3 ${
                  checkoutError || isLoadingCart || (!shopifyCart && !isLoadingCart)
                    ? 'bg-[#1A0F08]/10 text-[#7B6A5C] cursor-not-allowed border border-[#1A0F08]/10'
                    : 'bg-[#C17A3A] text-[#FDFAF6] border border-[#C17A3A] hover:bg-[#A0612A] hover:border-[#A0612A]'
                }`}
              >
                {checkoutError ? 'SEPETİ DÜZENLE' : isLoadingCart ? '...' : 'ÖDEMEYE GEÇ'}
                {!checkoutError && !isLoadingCart && <ArrowRight className="w-4 h-4" />}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

// --- FOOTER BİLEŞENİ ---
const Footer = () => {
  return (
    <footer className="bg-[#1A0F08] text-[#FDFAF6] border-t border-[#1A0F08] pt-24 pb-12 mt-auto">
      <div className="max-w-[1440px] mx-auto px-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-12 md:gap-20 mb-20">
          
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="block mb-2 h-20">
              <img src="/editionbeyaz.png" alt="edi-TION" className="h-full w-auto object-contain object-left md:object-center" />
            </Link>
            <p className="font-sans font-light text-[0.95rem] leading-[1.8] max-w-[240px]">
              Siparişinize özel öğütülen, taze kavrum kahveler ve sade bir kahve deneyimi.
            </p>
          </div>

          <div className="col-span-1">
            <h4 className="font-mono text-[0.65rem] tracking-[0.2em] text-[#C17A3A] mb-6">KURUMSAL</h4>
            <ul className="space-y-4">
              <li><Link to="/kahveler" className="font-sans font-light text-[0.95rem] text-[#FDFAF6] hover:text-[#7B6A5C] transition-colors">Tüm Seçki</Link></li>
              <li><Link to="/hakkimizda" className="font-sans font-light text-[0.95rem] text-[#FDFAF6] hover:text-[#7B6A5C] transition-colors">Hakkımızda</Link></li>
              <li><Link to="/toptan" className="font-sans font-light text-[0.95rem] text-[#FDFAF6] hover:text-[#7B6A5C] transition-colors">Toptan Satış</Link></li>
              <li><Link to="/sss" className="font-sans font-light text-[0.95rem] text-[#FDFAF6] hover:text-[#7B6A5C] transition-colors">S.S.S.</Link></li>
            </ul>
          </div>

          <div className="col-span-1">
            <h4 className="font-mono text-[0.65rem] tracking-[0.2em] text-[#C17A3A] mb-6">SÖZLEŞMELER</h4>
            <ul className="space-y-4">
              <li><Link to="/uyelik-sozlesmesi" className="font-sans font-light text-[0.95rem] text-[#FDFAF6] hover:text-[#7B6A5C] transition-colors">Üyelik Sözleşmesi</Link></li>
              <li><Link to="/gizlilik-sozlesmesi" className="font-sans font-light text-[0.95rem] text-[#FDFAF6] hover:text-[#7B6A5C] transition-colors">Gizlilik Sözleşmesi</Link></li>
              <li><Link to="/iade-sartlari" className="font-sans font-light text-[0.95rem] text-[#FDFAF6] hover:text-[#7B6A5C] transition-colors">Ürün İade Şartları</Link></li>
              <li><Link to="/mesafeli-satis-sozlesmesi" className="font-sans font-light text-[0.95rem] text-[#FDFAF6] hover:text-[#7B6A5C] transition-colors">Mesafeli Satış Sözleşmesi</Link></li>
            </ul>
          </div>

          <div className="col-span-2 md:col-span-1">
            <h4 className="font-mono text-[0.65rem] tracking-[0.2em] text-[#C17A3A] mb-6">İLETİŞİM</h4>
            <ul className="space-y-4 mb-8">
              <li className="font-sans font-light text-[0.95rem] text-[#FDFAF6]">
                info@editioncoffee.com.tr
              </li>
              <li>
                
                <span className="font-sans font-light text-[0.95rem] text-[#FDFAF6]">
                  Yeni Bağlıca Mah. Etimesgut Blv. No:2B-E Etimesgut/Ankara
                </span>
              </li>
              <li>
                <span className="font-mono text-[0.6rem] tracking-[0.15em] text-[#C17A3A] block mb-1">ÇAĞRI MERKEZİ</span>
                <a href="tel:+903129800088" className="font-sans font-light text-[0.95rem] text-[#FDFAF6] hover:text-[#7B6A5C] transition-colors">
                  +90 (312) 980 00 88
                </a>
              </li>
            </ul>
            <div className="flex gap-4">
              <a href="https://www.instagram.com/editioncoffeeroastery" target="_blank" rel="noopener noreferrer" className="text-[#C17A3A] hover:text-[#FDFAF6] transition-colors">
                <Instagram className="h-6 w-6" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-[#FDFAF6]/10 pt-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <p className="font-mono text-[0.65rem] tracking-[0.2em] uppercase text-[#C17A3A]">
            © {new Date().getFullYear()} EDITION COFFEE. TÜM HAKLARI SAKLIDIR.
          </p>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-6 font-mono text-[0.65rem] tracking-[0.2em] uppercase text-[#C17A3A]">
            <span>EST. 2022 / ANKARA</span>
            <span className="hidden sm:inline">|</span>
            <a 
              href="https://www.opsiron.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:text-[#FDFAF6] transition-colors cursor-pointer"
            >
              Designed by Opsiron
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

// --- ANA LAYOUT BİLEŞENİ ---
const Layout = ({ children }: { children: ReactNode }) => {
  const { cartCount, setIsCartOpen } = useCart();
  const { isAuthenticated } = useAuth(); // Auth durumu çekildi
  const navigate = useNavigate();
  const location = useLocation();
  useAnalytics(location.pathname); // ← gerçek zamanlı analitik takibi

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileKahvelerOpen, setIsMobileKahvelerOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const isHomePage = location.pathname === '/';

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);



  const isTransparent = isHomePage && !isScrolled;
  const navLinkClass = `font-mono text-[0.65rem] tracking-[0.22em] uppercase transition-colors relative after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-[1px] after:bottom-[-6px] after:left-0 after:bg-[#C17A3A] after:origin-bottom-right hover:after:scale-x-100 hover:after:origin-bottom-left after:transition-transform after:duration-300 ${isTransparent ? 'text-[#FDFAF6]/80 hover:text-[#FDFAF6]' : 'text-[#1A0F08]/70 hover:text-[#1A0F08]'}`;
  const dropdownLinkClass = "font-mono text-[0.65rem] tracking-[0.2em] uppercase text-[#1A0F08]/70 hover:text-[#C17A3A] transition-colors block py-2";

  return (
    <div className="min-h-screen w-full bg-[#FDFAF6] font-sans text-[#1A0F08] flex flex-col selection:bg-[#1A0F08] selection:text-[#FDFAF6]">
      
      <header className={`fixed top-0 left-0 right-0 z-50 flex flex-col transition-all duration-300 ${isTransparent ? 'bg-transparent border-b border-transparent' : 'bg-[#FDFAF6]/95 backdrop-blur-xl border-b border-[#1A0F08]/10'}`}>

        <div className={`transition-all duration-300 overflow-hidden ${isTransparent ? 'max-h-0 opacity-0' : 'max-h-10 opacity-100'}`}>
          <AnnouncementBar />
        </div>

        <div className="relative mx-auto flex w-full max-w-[1440px] items-center justify-between px-6 lg:px-10 h-[90px]">
          
          <div className="flex items-center h-full">
            <button
              className={`lg:hidden transition-colors ${isTransparent ? 'text-[#FDFAF6]/80 hover:text-[#FDFAF6]' : 'text-[#C17A3A] hover:text-[#1A0F08]'}`}
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Menüyü Aç"
            >
              <Menu className="h-6 w-6" strokeWidth={1.5} />
            </button>

            <nav className="hidden lg:flex gap-8 items-center h-full">
              <Link to="/" className={navLinkClass}>
                Ana Sayfa
              </Link>
              
              <div className="relative group h-full flex items-center">
                <Link to="/kahveler" className={navLinkClass}>
                  Kahveler▼
                </Link>
                <div className="absolute left-0 top-full opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-300">
                  <div className="bg-[#FDFAF6] border border-[#1A0F08]/10 border-t-0 p-5 flex flex-col gap-3 min-w-[200px] shadow-sm">
                    <Link to="/kahveler?kategori=turk-kahvesi" className={dropdownLinkClass}>Türk Kahvesi</Link>
                    <Link to="/kahveler?kategori=filtre" className={dropdownLinkClass}>Filtre Kahve</Link>
                    <Link to="/kahveler?kategori=espresso" className={dropdownLinkClass}>Espresso</Link>
                    <Link to="/kahveler?kategori=paket" className={dropdownLinkClass}>Avantajlı Paketler</Link>
                  </div>
                </div>
              </div>

              <Link to="/hakkimizda" className={navLinkClass}>
                Hakkımızda
              </Link>
              <Link to="/toptan" className={navLinkClass}>
                Toptan Satış
              </Link>
              <Link to="/iletisim" className={navLinkClass}>
                İletişim
              </Link>
            </nav>
          </div>

          <Link to="/" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 block h-16 md:h-20">
            <img src={isTransparent ? '/editionbeyaz.png' : '/editionsiyah.png'} alt="edi-TION" className="h-full w-auto object-contain transition-all duration-300" />
          </Link>

          <div className="flex items-center gap-4 lg:gap-6">
            <button className={`transition-colors hidden sm:block ${isTransparent ? 'text-[#FDFAF6]/80 hover:text-[#FDFAF6]' : 'text-[#1A0F08]/70 hover:text-[#1A0F08]'}`}>
               <Search className="h-5 w-5" />
            </button>

            <button
              onClick={() => isAuthenticated ? navigate('/hesap') : window.location.href = 'https://account.editioncoffee.com.trm.tr/'}
              className={`transition-colors hidden sm:block ${isTransparent ? 'text-[#FDFAF6]/80 hover:text-[#FDFAF6]' : 'text-[#1A0F08]/70 hover:text-[#1A0F08]'}`}
            >
              <User className="h-5 w-5" />
            </button>

            <button
              className={`relative transition-colors flex items-center gap-2 group ${isTransparent ? 'text-[#FDFAF6]/80 hover:text-[#FDFAF6]' : 'text-[#1A0F08]/70 hover:text-[#1A0F08]'}`}
              onClick={() => setIsCartOpen(true)}
            >
              <ShoppingBag className="h-6 w-6 sm:h-5 sm:w-5" />
              <span className="font-mono text-[0.85rem] mt-[1px]">
                [<span className={isTransparent ? '' : 'text-[#C17A3A]'}>{cartCount}</span>]
              </span>
            </button>
          </div>
        </div>
      </header>

      <>
        <div 
          className={`fixed inset-0 z-[60] bg-[#1A0F08]/40 backdrop-blur-sm transition-opacity lg:hidden duration-500 ${isMobileMenuOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
          onClick={() => setIsMobileMenuOpen(false)}
        />
        <div className={`fixed left-0 top-0 z-[70] h-full w-[85%] max-w-[360px] bg-[#FDFAF6] border-r border-[#1A0F08]/10 transition-transform duration-700 ease-out lg:hidden flex flex-col ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex items-center justify-between border-b border-[#1A0F08]/10 p-6">
            <span className="font-mono text-[0.65rem] tracking-[0.2em] uppercase text-[#1A0F08]">Menü</span>
            <button onClick={() => setIsMobileMenuOpen(false)} className="text-[#7B6A5C] hover:text-[#1A0F08]">
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 mt-4">
            <Link to="/" className="font-serif text-[1.4rem] text-[#1A0F08]">Ana Sayfa</Link>
            
            <div className="flex flex-col">
              <button 
                onClick={() => setIsMobileKahvelerOpen(!isMobileKahvelerOpen)} 
                className="flex items-center justify-between w-full font-serif text-[1.4rem] text-[#1A0F08] text-left"
              >
                Kahveler
                <ChevronDown className={`h-5 w-5 text-[#7B6A5C] transition-transform duration-300 ${isMobileKahvelerOpen ? 'rotate-180' : ''}`} />
              </button>
              
              <div className={`flex flex-col gap-4 overflow-hidden transition-all duration-300 ${isMobileKahvelerOpen ? 'max-h-[250px] mt-4 opacity-100' : 'max-h-0 opacity-0'}`}>
                <Link to="/kahveler" className="font-sans font-light text-[0.95rem] text-[#C17A3A] pl-4 border-l border-[#1A0F08]/10 hover:text-[#1A0F08]">Tümünü Gör</Link>
                <Link to="/kahveler?kategori=turk-kahvesi" className="font-sans font-light text-[0.95rem] text-[#C17A3A] pl-4 border-l border-[#1A0F08]/10 hover:text-[#1A0F08]">Türk Kahvesi</Link>
                <Link to="/kahveler?kategori=filtre" className="font-sans font-light text-[0.95rem] text-[#C17A3A] pl-4 border-l border-[#1A0F08]/10 hover:text-[#1A0F08]">Filtre Kahve</Link>
                <Link to="/kahveler?kategori=espresso" className="font-sans font-light text-[0.95rem] text-[#C17A3A] pl-4 border-l border-[#1A0F08]/10 hover:text-[#1A0F08]">Espresso</Link>
                <Link to="/kahveler?kategori=paket" className="font-sans font-light text-[0.95rem] text-[#C17A3A] pl-4 border-l border-[#1A0F08]/10 hover:text-[#1A0F08]">Avantajlı Paketler</Link>
              </div>
            </div>

            <Link to="/hakkimizda" className="font-serif text-[1.4rem] text-[#1A0F08]">Hakkımızda</Link>
            <Link to="/toptan" className="font-serif text-[1.4rem] text-[#1A0F08]">Toptan Satış</Link>
            <Link to="/iletisim" className="font-serif text-[1.4rem] text-[#1A0F08]">İletişim</Link>
          </div>
          
          <div className="p-6 border-t border-[#1A0F08]/10 bg-[#F7F0E7] flex flex-col gap-4">
            {/* Mobil Menü: Giriş durumuna göre metin ve yönlendirme değişimi */}
           <button
  onClick={() => isAuthenticated ? navigate('/hesap') : window.location.href = 'https://account.editioncoffee.com.tr/account'}
  className="flex items-center gap-3 font-mono text-[0.65rem] tracking-[0.15em] uppercase text-[#C17A3A] hover:text-[#1A0F08] text-left"
>
  <User className="h-4 w-4" /> {isAuthenticated ? 'Hesabım' : 'Giriş Yap / Üye Ol'}
</button>
            <button className="flex items-center gap-3 font-mono text-[0.65rem] tracking-[0.15em] uppercase text-[#C17A3A] hover:text-[#1A0F08] text-left">
               <Search className="h-4 w-4" /> Arama Yap
            </button>
          </div>
        </div>
      </>
      
      <CartDrawer />
      
      <main className="pt-[130px] flex-grow flex flex-col">
        {children}
      </main>

      <Footer />
      
      <CookieBanner />
    </div>
  );
};

export default Layout;