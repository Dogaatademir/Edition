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
  ChevronDown,
  ShieldCheck,
  Package
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext'; // Auth context eklendi
import { useAnalytics, trackEvent } from '../hooks/useAnalytics';
import { useConsent } from '../hooks/useConsent';
import { getShippingStatus } from '../lib/shipping';
import { gAdsBeginCheckout } from '../lib/Googleads';
import { getSessionId } from '../lib/session';
import { cartItemKey, canonicalGrind } from '../lib/cartKey';
import ShippingNotice from './ShippingNotice';
import QuickAddModal from './QuickAddModal';
import FreeShippingSuggestions from './FreeShippingSuggestions';
import { getConsent, setConsent, openConsentPreferences, OPEN_PREFERENCES_EVENT } from '../lib/consent';

// --- DUYURU ŞERİDİ (ANNOUNCEMENT BAR) BİLEŞENİ ---
const AnnouncementBar = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const messages = [
    "%20'YE VARAN İNDİRİMLİ KAHVE SEÇKİSİNİ KEŞFET",
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
            <span className="whitespace-nowrap font-mono text-[0.62rem] tracking-[0.08em] sm:text-[0.72rem] sm:tracking-[0.12em] md:text-[0.8rem] md:tracking-[0.15em] text-center">
              {msg}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// --- ÇEREZ ONAY BANNER'I (KVKK) ---
// Kabul ve Ret eşit ağırlıkta sunulur. Tercih panelinde analitik ve pazarlama varsayılan olarak açık gelir;
// hiçbir etiket kullanıcı bir seçimi kaydetmeden yüklenmez.
// X ile kapatmak "yalnızca zorunlu çerezler" seçimi olarak kaydedilir.
// Footer'daki "Çerez Tercihleri" bağlantısı paneli tercih görünümünde yeniden açar.
const ConsentToggle = ({
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (value: boolean) => void;
}) => (
  <label className={`flex items-center md:items-start justify-between gap-4 py-2.5 md:py-3 border-b border-[#1A0F08]/10 ${disabled ? 'cursor-default' : 'cursor-pointer'}`}>
    <span>
      <span className="block font-sans text-[0.85rem] font-medium text-[#1A0F08]">{label}</span>
      <span className="hidden md:block font-sans font-light text-[0.78rem] text-[#5C4635] leading-snug mt-0.5">{description}</span>
    </span>
    <span className="relative mt-0.5 shrink-0">
      <input
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange?.(e.target.checked)}
      />
      <span className="block h-5 w-9 rounded-full bg-[#1A0F08]/20 transition-colors peer-checked:bg-[#C17A3A] peer-disabled:opacity-60 peer-focus-visible:ring-2 peer-focus-visible:ring-[#C17A3A] peer-focus-visible:ring-offset-2" />
      <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-[#FDFAF6] shadow transition-transform peer-checked:translate-x-4" />
    </span>
  </label>
);

const CookieBanner = () => {
  const consent = useConsent();
  const [isVisible, setIsVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  // Kullanıcı daha önce seçim yapmadıysa analitik ve pazarlama varsayılan olarak açık gelir
  const [analytics, setAnalytics] = useState(true);
  const [marketing, setMarketing] = useState(true);

  // Seçim yapılmamışsa banner'ı göster
  useEffect(() => {
    if (consent) return;
    const timer = setTimeout(() => setIsVisible(true), 1500);
    return () => clearTimeout(timer);
  }, [consent]);

  // Footer'daki "Çerez Tercihleri" bağlantısı
  useEffect(() => {
    const open = () => {
      const current = getConsent();
      setAnalytics(current?.analytics ?? true);
      setMarketing(current?.marketing ?? true);
      setShowPreferences(true);
      setIsVisible(true);
    };
    window.addEventListener(OPEN_PREFERENCES_EVENT, open);
    return () => window.removeEventListener(OPEN_PREFERENCES_EVENT, open);
  }, []);

  const save = (choice: { analytics: boolean; marketing: boolean }) => {
    setIsVisible(false);
    setShowPreferences(false);
    setConsent(choice);
  };

  if (!isVisible) return null;

  const buttonBase =
    'flex-1 px-3 py-2.5 md:px-4 md:py-3 font-mono text-[0.6rem] tracking-[0.15em] border transition-colors';
  const primary = `${buttonBase} bg-[#1A0F08] text-[#FDFAF6] border-[#1A0F08] hover:bg-[#3A2A1E] hover:border-[#3A2A1E]`;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-banner-title"
      className="fixed bottom-0 left-0 right-0 md:bottom-8 md:left-8 z-[100] md:max-w-md animate-in slide-in-from-bottom-4 duration-700 fade-in"
    >
      <div className="bg-[#FDFAF6] px-5 pt-4 pb-4 md:p-7 border-t md:border border-[#1A0F08] shadow-2xl relative max-h-[60vh] md:max-h-[85vh] overflow-y-auto">
        <button
          onClick={() => save({ analytics: false, marketing: false })}
          aria-label="Kapat (yalnızca zorunlu çerezler)"
          title="Yalnızca zorunlu çerezlerle devam et"
          className="absolute top-4 right-4 md:top-5 md:right-5 text-[#7B6A5C] hover:text-[#1A0F08] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="mb-3 md:mb-5 pr-6">
          <div className="hidden md:flex font-mono text-[0.55rem] tracking-[0.2em] uppercase text-[#7B6A5C] mb-2 items-center gap-2 before:content-[''] before:block before:w-3 before:h-[1px] before:bg-[#7B6A5C]">
            ÇEREZ TERCİHLERİ
          </div>
          <h4 id="cookie-banner-title" className="font-serif text-[1.05rem] md:text-[1.2rem] text-[#1A0F08] mb-1.5 md:mb-2 leading-tight">
            Çerezleri nasıl kullanalım?
          </h4>
          <p className="font-sans font-light text-[0.78rem] md:text-[0.85rem] text-[#5C4635] leading-snug md:leading-relaxed">
            <span className="md:hidden">
              Deneyimi geliştirmek ve size uygun reklamlar göstermek için onayınızla analitik ve pazarlama çerezleri
              kullanırız.{' '}
            </span>
            <span className="hidden md:inline">
              Sitenin çalışması için zorunlu çerezleri kullanıyoruz. Ziyaretinizi analiz etmek ve size uygun reklamlar
              göstermek için ise yalnızca onay verirseniz analitik ve pazarlama çerezleri kullanırız. Seçiminizi
              istediğiniz zaman sayfanın altındaki “Çerez Tercihleri” bağlantısından değiştirebilirsiniz.{' '}
            </span>
            <Link to="/gizlilik-sozlesmesi" className="text-[#1A0F08] border-b border-[#1A0F08] hover:text-[#C17A3A] hover:border-[#C17A3A] transition-colors">
              Gizlilik ve Çerez Politikası
            </Link>
          </p>
        </div>

        {showPreferences && (
          <div className="mb-3 md:mb-5 border-t border-[#1A0F08]/10">
            <ConsentToggle
              label="Zorunlu çerezler"
              description="Sepet, oturum ve güvenlik için gereklidir; kapatılamaz."
              checked
              disabled
            />
            <ConsentToggle
              label="Analitik çerezler"
              description="Microsoft Clarity ve site içi ziyaret istatistikleri. Siteyi geliştirmemize yardımcı olur."
              checked={analytics}
              onChange={setAnalytics}
            />
            <ConsentToggle
              label="Pazarlama çerezleri"
              description="Google Ads ve Meta (Facebook/Instagram) Pixel. Reklam ölçümü ve size uygun reklamlar için."
              checked={marketing}
              onChange={setMarketing}
            />
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={() => save({ analytics: false, marketing: false })} className={primary}>
            REDDET
          </button>
          <button onClick={() => save({ analytics: true, marketing: true })} className={primary}>
            TÜMÜNÜ KABUL ET
          </button>
        </div>

        {showPreferences ? (
          <button
            onClick={() => save({ analytics, marketing })}
            className="mt-2 md:mt-3 w-full px-4 py-2.5 md:py-3 font-mono text-[0.6rem] tracking-[0.15em] border border-[#1A0F08] text-[#1A0F08] hover:bg-[#1A0F08] hover:text-[#FDFAF6] transition-colors"
          >
            SEÇİMLERİMİ KAYDET
          </button>
        ) : (
          <button
            onClick={() => {
              setAnalytics(consent?.analytics ?? true);
              setMarketing(consent?.marketing ?? true);
              setShowPreferences(true);
            }}
            className="mt-3 md:mt-4 w-full font-mono text-[0.6rem] tracking-[0.15em] text-[#5C4635] underline underline-offset-4 hover:text-[#1A0F08] transition-colors"
          >
            TERCİHLERİ YÖNET
          </button>
        )}
      </div>
    </div>
  );
};

// --- ÜYELİK TEŞVİK POPUP'I ---
const MembershipPopup = () => {
  const { isAuthenticated } = useAuth();
  const consent = useConsent();
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(false);
  const [firstPath] = useState(location.pathname);
  // İlk açılan sayfadan farklı bir sayfaya geçildi mi? (ikinci sayfa görüntülemesi)
  const pageViews = location.pathname === firstPath ? 1 : 2;

  // Pencere ne zaman açılır?
  //  - Çerez seçimi yapıldıysa: 1,5 sn sonra (iki pencere aynı anda açılmasın diye).
  //  - Çerez banner'ı yanıtsız bırakıldıysa: ilk kaydırmada, ikinci sayfaya geçildiğinde veya
  //    sitede 20 sn geçirildiğinde (hangisi önce olursa). Pencere banner'ın üzerinde açılır;
  //    kapatılınca banner yerinde kalır.
  useEffect(() => {
    if (isAuthenticated || isVisible) return;
    if (localStorage.getItem('membership-popup-seen')) return;

    if (consent) {
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }

    if (pageViews >= 2) {
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, consent, pageViews, isVisible]);

  // Çerez banner'ı yanıtsızken ziyaretçi sayfayı ilk kez kaydırdığında aç
  useEffect(() => {
    if (isAuthenticated || consent || isVisible) return;
    if (localStorage.getItem('membership-popup-seen')) return;
    const onScroll = () => {
      if (window.scrollY > 10) setIsVisible(true);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [isAuthenticated, consent, isVisible]);

  // Banner yanıtsız kalırsa süre tabanlı yedek tetikleyici (sayfa değişiminde sıfırlanmaz)
  useEffect(() => {
    if (isAuthenticated) return;
    const timer = setTimeout(() => {
      if (!localStorage.getItem('membership-popup-seen')) setIsVisible(true);
    }, 20000);
    return () => clearTimeout(timer);
  }, [isAuthenticated]);

  const handleClose = () => {
    localStorage.setItem('membership-popup-seen', '1');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-6">
      <div
        className="absolute inset-0 bg-[#1A0F08]/70 backdrop-blur-sm animate-in fade-in duration-500"
        onClick={handleClose}
      />
      <div className="relative w-full max-w-4xl overflow-hidden bg-[#1A0F08] shadow-2xl animate-in zoom-in-95 fade-in duration-500 grid grid-cols-1 md:grid-cols-2 max-h-[92vh]">
        <button
          onClick={handleClose}
          className="absolute top-5 right-5 z-10 flex h-9 w-9 items-center justify-center border border-[#FDFAF6]/30 bg-[#1A0F08]/40 text-[#FDFAF6] backdrop-blur-sm hover:bg-[#1A0F08]/70 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Sol: Görsel */}
        <div className="relative hidden h-full min-h-[420px] md:block">
          <img src="/BANNER/W19.jpg" alt="Edition Coffee Roastery" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#1A0F08]/70 via-transparent to-transparent" />
          <div className="absolute bottom-6 left-6 right-6">
            <span className="inline-block bg-[#C17A3A] px-3 py-1.5 font-mono text-[0.62rem] tracking-[0.2em] text-[#FDFAF6]">
              %5 HOŞGELDİN İNDİRİMİ
            </span>
          </div>
        </div>

        {/* Sağ: İçerik */}
        <div className="flex flex-col justify-center p-8 sm:p-10 md:p-12 text-center md:text-left">
          {/* Mobil: üstte küçük görsel şeridi */}
          <div className="relative -mx-8 -mt-8 mb-6 h-36 sm:-mx-10 sm:-mt-10 md:hidden">
            <img src="/BANNER/W19.jpg" alt="Edition Coffee Roastery" className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1A0F08] via-[#1A0F08]/20 to-transparent" />
          </div>

          <div className="font-mono text-[0.6rem] tracking-[0.28em] uppercase text-[#C38152] mb-4">
            ÜYELERE ÖZEL
          </div>
          <h4 className="font-serif text-[clamp(2rem,4.5vw,3rem)] leading-[1.05] tracking-[-0.02em] text-[#F7F0E7] mb-4">
            Aramıza katıl,<br />%5 indirimi kap.
          </h4>
          <p className="font-sans font-light text-[1rem] text-[#F7F0E7]/70 leading-relaxed mb-8 max-w-[380px] mx-auto md:mx-0">
            Üyelere özel indirimler, kampanyalardan ilk sen haberdar ol ve siparişlerini kolayca takip et. Katılmak bir dakikanı bile almaz.
          </p>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => { handleClose(); window.location.href = 'https://account.editioncoffee.com.tr/'; }}
              className="w-full bg-[#C17A3A] text-[#FDFAF6] px-6 py-4 font-mono text-[0.68rem] tracking-[0.2em] border border-[#C17A3A] hover:bg-[#A0612A] hover:border-[#A0612A] transition-all hover:scale-[1.02]"
            >
              HEMEN ÜYE OL →
            </button>
            <button
              onClick={handleClose}
              className="w-full font-mono text-[0.6rem] tracking-[0.15em] text-[#F7F0E7]/50 hover:text-[#F7F0E7] transition-colors py-1"
            >
              BELKİ DAHA SONRA
            </button>
          </div>
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
  const [quickAdd, setQuickAdd] = useState<{ handle: string; variantId: string } | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  
  const subtotal = shopifyCart ? shopifyCart.subtotal : 0;
  const discount = shopifyCart ? shopifyCart.discount : 0;
  const finalPrice = shopifyCart ? shopifyCart.total : 0;

  const shipping = getShippingStatus(cartItems, Math.max(0, subtotal - discount));
  const progressPercentage = shipping.progress;

  const handleCheckout = async () => {
    setCheckoutError(null);
    const hasSubscription = cartItems.some((item: any) => item.isSubscription);
    const hasRegularProduct = cartItems.some((item: any) => !item.isSubscription);

    if (hasSubscription && hasRegularProduct) {
      setCheckoutError("Sepetinizde hem abonelik paketi hem de tekil ürünler bulunuyor. Lütfen ödeme işlemlerini ayrı ayrı tamamlayın.");
      return;
    }

    if (hasSubscription) {
      setIsCartOpen(false);
      navigate('/abonelik-odeme');
      return;
    }

    // Ara sayfa (/odeme) yok: sepetten doğrudan Shopify ödeme sayfasına
    if (!shopifyCart?.checkoutUrl) return;
    setIsRedirecting(true);
    const total = shopifyCart.total;
    const itemCount = cartItems.length;
    try {
      localStorage.setItem('pendingCheckout', JSON.stringify({ ts: Date.now(), sessionId: getSessionId(), total }));
    } catch { /* devam et */ }
    gAdsBeginCheckout({ total, itemCount });
    // Analitik kaydı yönlendirmeyi en fazla 800 ms bekletir
    await Promise.race([
      trackEvent('checkout_start', { total, itemCount, discountCode: null, source: 'cart_drawer' }),
      new Promise((resolve) => setTimeout(resolve, 800)),
    ]).catch(() => undefined);
    window.location.href = shopifyCart.checkoutUrl;
  };

  // Ödeme sayfasından geri tuşuyla dönülürse "yönlendiriliyor" durumunu sıfırla
  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => { if (e.persisted) setIsRedirecting(false); };
    window.addEventListener('pageshow', onPageShow);
    return () => window.removeEventListener('pageshow', onPageShow);
  }, []);

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
              aria-label="Sepeti kapat"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Kargo durumu — kutusuz, çekmecenin en üstünde sabit */}
          {cartItems.length > 0 && (
            <div className="flex flex-col gap-2.5 bg-[#F7F0E7] px-6 pt-5 pb-1">
              <div className="font-sans text-[0.8rem] text-[#C17A3A] text-center">
                <ShippingNotice status={shipping} strongClassName="text-[#1A0F08] font-medium" short />
              </div>
              <div className="h-1.5 w-full bg-[#1A0F08]/10 overflow-hidden">
                <div
                  className="h-full bg-[#C17A3A] transition-all duration-700 ease-out"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-6 bg-[#F7F0E7]">
            {cartItems.length > 0 ? (
              <div className="flex flex-col gap-5">
                


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
                      // Satırı sitedeki kayıtla varyant + öğütmeye göre eşleştir
                      const lineKey = cartItemKey(line.variantId, line.grind);
                      const localItem =
                        cartItems.find((item: any) => cartItemKey(item.variantId, item.grind) === lineKey) ??
                        cartItems.find((item: any) => item.id === line.variantId || (item.variantId === line.variantId && !item.grind && !line.grind));
                      const itemId = localItem?.id ?? line.variantId ?? line.id;
                      const totalCartQty = localItem?.quantity ?? line.quantity;
                      const isSubscription = localItem?.isSubscription || false;
                      const isFree = line.discountedPrice === 0 || line.originalPrice > line.discountedPrice;

                      return (
                        <div key={line.id} className={`flex gap-4 bg-[#FDFAF6] border border-[#1A0F08]/10 p-4 group hover:border-[#1A0F08] transition-colors ${isLoadingCart ? 'opacity-70 pointer-events-none' : 'opacity-100'}`}>
                          <div className="h-24 w-20 bg-[#F7F0E7] border border-[#1A0F08]/10 flex items-center justify-center overflow-hidden shrink-0">
                            {line.image ? (
                               <img src={line.image} alt={line.title} className="h-full w-full scale-150 object-contain mix-blend-multiply" />
                            ) : (
                               <div className="font-mono text-[0.45rem] text-[#7B6A5C] tracking-[0.1em] -rotate-90 whitespace-nowrap">
                                 {localItem?.code || `KOD-${itemId}`}
                               </div>
                            )}
                          </div>
                          
                          <div className="flex flex-1 flex-col justify-between py-1">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-serif text-[0.95rem] text-[#1A0F08] leading-snug">{line.title}</h4>
                                {line.grind && (
                                  <div className="mt-1 font-sans text-[0.7rem] text-[#7B6A5C]">Öğütme: {canonicalGrind(line.grind)}</div>
                                )}
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
                {/* Ücretsiz kargoya kalan tutarı tamamlayan kahve önerileri */}
                {shopifyCart && !shipping.isFree && (
                  <FreeShippingSuggestions
                    cartItems={cartItems}
                    remaining={shipping.remaining}
                    onPick={(s) => setQuickAdd({ handle: s.product.handle, variantId: s.variant.id })}
                  />
                )}

                {/* Alışverişe devam — yalnızca yazı, önerilerin altında */}
                <button
                  type="button"
                  onClick={() => { setIsCartOpen(false); setCheckoutError(null); }}
                  className="mx-auto font-mono text-[0.62rem] uppercase tracking-[0.15em] text-[#5C4635] underline underline-offset-4 decoration-[#5C4635]/40 transition-colors hover:text-[#1A0F08] hover:decoration-[#1A0F08]"
                >
                  Alışverişe devam et
                </button>
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center px-4">
                <div className="w-16 h-16 border border-[#1A0F08]/10 bg-[#FDFAF6] flex items-center justify-center mb-6">
                  <span className="font-serif italic text-2xl text-[#7B6A5C] leading-none">0</span>
                </div>
                <h4 className="font-serif text-[1.5rem] text-[#1A0F08] mb-2">Sepetiniz Boş</h4>
                <p className="font-sans font-light text-[0.85rem] text-[#C17A3A] mb-8 max-w-[200px]">Taze kavrulmuş kahvelerimizi ve avantajlı paketleri keşfetmeye başlayın.</p>
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
            <div className={`border-t border-[#1A0F08]/10 bg-[#FDFAF6] px-6 pt-4 pb-4 mt-auto transition-opacity ${isLoadingCart ? 'opacity-70' : 'opacity-100'}`}>
              
              {checkoutError && (
                <div className="flex items-start gap-3 p-4 bg-[#F7F0E7] border border-[#1A0F08] mb-4">
                  <AlertCircle className="h-4 w-4 text-[#1A0F08] shrink-0 mt-0.5" />
                  <p className="font-sans text-[0.8rem] text-[#1A0F08] leading-relaxed">{checkoutError}</p>
                </div>
              )}
              
              <div className="flex flex-col gap-2 mb-3">
                {discount > 0 && (
                  <div className="flex justify-between items-start gap-3 text-[#C17A3A] pb-2 border-b border-[#1A0F08]/10 border-dashed">
                    <span className="font-mono text-[0.6rem] tracking-[0.2em] text-[#7B6A5C] break-words min-w-0">
                      {shopifyCart?.discountTitles && shopifyCart.discountTitles.length > 0
                        ? shopifyCart.discountTitles.join(' + ').toUpperCase()
                        : 'SEPET İNDİRİMİ'}
                    </span>
                    <span className="font-mono font-medium text-[0.9rem] text-[#1A0F08] shrink-0">
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
                disabled={isRedirecting || isLoadingCart || (!shopifyCart && !isLoadingCart)}
                className={`w-full h-[46px] font-mono text-[0.8rem] leading-none tracking-[0.12em] transition-colors flex items-center justify-center gap-3 ${
                  checkoutError || isLoadingCart || (!shopifyCart && !isLoadingCart)
                    ? 'bg-[#1A0F08]/10 text-[#7B6A5C] cursor-not-allowed border border-[#1A0F08]/10'
                    : 'bg-[#C17A3A] text-[#FDFAF6] border border-[#C17A3A] hover:bg-[#A0612A] hover:border-[#A0612A]'
                }`}
              >
                {checkoutError ? 'SEPETİ DÜZENLE' : isRedirecting ? 'YÖNLENDİRİLİYOR…' : isLoadingCart ? '...' : 'GÜVENLİ ÖDEMEYE GEÇ'}
                {!checkoutError && !isLoadingCart && !isRedirecting && <ArrowRight className="w-4 h-4" />}
              </button>

              {/* Güven rozetleri — buton altında yalın satır */}
              <ul className="mt-2.5 flex items-center justify-center gap-5 font-sans text-[0.78rem] text-[#7B6A5C]">
                <li className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />
                  Güvenli ödeme
                </li>
                <li className="flex items-center gap-1.5">
                  <Package className="h-4 w-4 shrink-0" strokeWidth={1.5} aria-hidden="true" />
                  Özenli paketleme
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Kargo önerisinden hızlı ekleme — öğütme/gramaj seçimi burada yapılır */}
      {quickAdd && (
        <QuickAddModal
          handle={quickAdd.handle}
          initialVariantId={quickAdd.variantId}
          onClose={() => setQuickAdd(null)}
        />
      )}
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
              Siparişinize özel öğütülen, taze kavrulmuş kahveler ve sade bir kahve deneyimi.
            </p>
          </div>

          <div className="col-span-1">
            <h4 className="font-mono text-[0.65rem] tracking-[0.2em] text-[#C17A3A] mb-6">KURUMSAL</h4>
            <ul className="space-y-4">
              <li><Link to="/kahveler" className="font-sans font-light text-[0.95rem] text-[#FDFAF6] hover:text-[#7B6A5C] transition-colors">Tüm Seçki</Link></li>
              <li><Link to="/hakkimizda" className="font-sans font-light text-[0.95rem] text-[#FDFAF6] hover:text-[#7B6A5C] transition-colors">Hakkımızda</Link></li>
              <li><Link to="/toptan" className="font-sans font-light text-[0.95rem] text-[#FDFAF6] hover:text-[#7B6A5C] transition-colors">Toptan Satış</Link></li>
              <li><Link to="/referanslar" className="font-sans font-light text-[0.95rem] text-[#FDFAF6] hover:text-[#7B6A5C] transition-colors">Referanslar</Link></li>
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
              <li><button type="button" onClick={openConsentPreferences} className="font-sans font-light text-[0.95rem] text-[#FDFAF6] hover:text-[#7B6A5C] transition-colors text-left">Çerez Tercihleri</button></li>
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
            <span>EST. 2023 / ANKARA</span>
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
  const navLinkClass = `font-mono text-[0.65rem] lg:text-[0.75rem] tracking-[0.22em] uppercase transition-colors relative after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-[1px] after:bottom-[-6px] after:left-0 after:bg-[#C17A3A] after:origin-bottom-right hover:after:scale-x-100 hover:after:origin-bottom-left after:transition-transform after:duration-300 ${isTransparent ? 'text-[#FDFAF6]/80 hover:text-[#FDFAF6]' : 'text-[#1A0F08]/70 hover:text-[#1A0F08]'}`;
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
              className={`lg:hidden transition-colors ${isTransparent ? 'text-[#FDFAF6]/80 hover:text-[#FDFAF6]' : 'text-[#251d19] md:text-[#C17A3A] hover:text-[#1A0F08]'}`}
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Menüyü Aç"
            >
              <Menu className="h-6 w-6" strokeWidth={1.5} />
            </button>

            <nav className="hidden lg:flex gap-5 items-center h-full lg:-ml-6">
              <Link to="/" className={navLinkClass}>
                Ana Sayfa
              </Link>
              
              <div className="relative group h-full flex items-center">
                <Link to="/kahveler" className={navLinkClass}>
                  Kahveler▼
                </Link>
                <div className="absolute left-0 top-full opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-300">
                  <div className="bg-[#FDFAF6] border border-[#1A0F08]/10 border-t-0 p-5 flex flex-col gap-3 min-w-[200px] shadow-sm">
                    <Link to="/kahveler/turk-kahvesi" className={dropdownLinkClass}>Türk Kahvesi</Link>
                    <Link to="/kahveler/filtre-kahve" className={dropdownLinkClass}>Filtre Kahve</Link>
                    <Link to="/kahveler/espresso" className={dropdownLinkClass}>Espresso</Link>
                    <Link to="/kahveler/avantajli-paketler" className={dropdownLinkClass}>Avantajlı Paketler</Link>
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
                İLETİŞİM
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
              onClick={() => isAuthenticated ? navigate('/hesap') : window.location.href = 'https://account.editioncoffee.com.tr/'}
              className={`transition-colors hidden sm:block ${isTransparent ? 'text-[#FDFAF6]/80 hover:text-[#FDFAF6]' : 'text-[#1A0F08]/70 hover:text-[#1A0F08]'}`}
            >
              <User className="h-5 w-5" />
            </button>

            <button
              className={`relative transition-colors flex items-center gap-2 group ${isTransparent ? 'text-[#FDFAF6]/80 hover:text-[#FDFAF6]' : 'text-[#251d19] md:text-[#1A0F08]/70 hover:text-[#1A0F08]'}`}
              onClick={() => setIsCartOpen(true)}
              aria-label={`Sepet, ${cartCount} ürün`}
            >
              <ShoppingBag className="h-6 w-6 sm:h-5 sm:w-5" />
              {/* Sepet adedi — ikonun sağ üstünde yuvarlak rozet */}
              <span
                aria-hidden="true"
                className={`absolute -top-1.5 -right-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 font-mono text-[0.62rem] font-bold leading-none transition-colors ${
                  isTransparent ? 'bg-[#FDFAF6] text-[#1A0F08]' : 'bg-[#C17A3A] text-[#FDFAF6]'
                }`}
              >
                {cartCount > 99 ? '99+' : cartCount}
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
            <Link to="/" className="font-serif text-[22px] text-[#1A0F08]">Ana Sayfa</Link>
            
            <div className="flex flex-col">
              <button 
                onClick={() => setIsMobileKahvelerOpen(!isMobileKahvelerOpen)} 
                className="flex items-center justify-between w-full font-serif text-[22px] text-[#1A0F08] text-left"
              >
                Kahveler
                <ChevronDown className={`h-5 w-5 text-[#7B6A5C] transition-transform duration-300 ${isMobileKahvelerOpen ? 'rotate-180' : ''}`} />
              </button>
              
              <div className={`flex flex-col gap-4 overflow-hidden transition-all duration-300 ${isMobileKahvelerOpen ? 'max-h-[300px] mt-4 opacity-100' : 'max-h-0 opacity-0'}`}>
                <Link to="/kahveler" className="font-sans font-light text-[16px] text-[#A0612A] pl-4 border-l border-[#1A0F08]/10 hover:text-[#1A0F08]">Tüm Kahveler</Link>
                <Link to="/kahveler/turk-kahvesi" className="font-sans font-light text-[16px] text-[#A0612A] pl-4 border-l border-[#1A0F08]/10 hover:text-[#1A0F08]">Türk Kahvesi</Link>
                <Link to="/kahveler/filtre-kahve" className="font-sans font-light text-[16px] text-[#A0612A] pl-4 border-l border-[#1A0F08]/10 hover:text-[#1A0F08]">Filtre Kahve</Link>
                <Link to="/kahveler/espresso" className="font-sans font-light text-[16px] text-[#A0612A] pl-4 border-l border-[#1A0F08]/10 hover:text-[#1A0F08]">Espresso</Link>
                <Link to="/kahveler/avantajli-paketler" className="font-sans font-light text-[16px] text-[#A0612A] pl-4 border-l border-[#1A0F08]/10 hover:text-[#1A0F08]">Avantajlı Paketler</Link>
              </div>
            </div>

            <Link to="/hakkimizda" className="font-serif text-[22px] text-[#1A0F08]">Hakkımızda</Link>
            <Link to="/toptan" className="font-serif text-[22px] text-[#1A0F08]">Toptan Satış</Link>
            <Link to="/iletisim" className="font-serif text-[22px] text-[#1A0F08]">İletişim</Link>
          </div>
          
          <div className="p-6 border-t border-[#1A0F08]/10 bg-[#F7F0E7] flex flex-col gap-4">
            {/* Mobil Menü: Giriş durumuna göre metin ve yönlendirme değişimi */}
           <button
  onClick={() => isAuthenticated ? navigate('/hesap') : window.location.href = 'https://account.editioncoffee.com.tr/profile'}
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
      <MembershipPopup />
    </div>
  );
};

export default Layout;