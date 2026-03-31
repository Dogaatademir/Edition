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
  Facebook,
  AlertCircle,
  ArrowRight,
  Menu,
  ChevronDown
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

// --- DUYURU ŞERİDİ (ANNOUNCEMENT BAR) BİLEŞENİ ---
const AnnouncementBar = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const messages = [
    "Çok al az öde. Sepette 2. ürüne %15, 3. üründe %20 indirim",
    "Tüm siparişlerde 750 TL ve üzeri ücretsiz kargo"
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % messages.length);
    }, 4000); // 4 saniyede bir kayar
    return () => clearInterval(timer);
  }, [messages.length]);

  return (
    // Yükseklik h-8'den h-10'a çıkarıldı
    <div className="bg-[#000000] text-[#FFFFFF] h-10 overflow-hidden px-4">
      <div 
        className="transition-transform duration-700 ease-in-out flex flex-col w-full h-full"
        style={{ transform: `translateY(-${currentIndex * 100}%)` }}
      >
        {messages.map((msg, i) => (
          <div key={i} className="h-full w-full flex items-center justify-center shrink-0">
            {/* Punto text-[0.55rem]'den text-[0.65rem]'e çıkarıldı */}
            <span className="font-mono text-[0.65rem] tracking-[0.15em] uppercase text-center">
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
      <div className="bg-[#FFFFFF] p-7 border border-[#000000] shadow-2xl relative">
        <button 
          onClick={() => setIsVisible(false)}
          className="absolute top-5 right-5 text-[#888888] hover:text-[#000000] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="mb-6">
          <div className="font-mono text-[0.55rem] tracking-[0.2em] uppercase text-[#888888] mb-2 flex items-center gap-2 before:content-[''] before:block before:w-3 before:h-[1px] before:bg-[#888888]">
            ECR-POLICY
          </div>
          <h4 className="font-serif text-[1.2rem] text-[#000000] mb-2 leading-tight">Deneyim Onayı</h4>
          <p className="font-sans font-light text-[0.85rem] text-[#555555] leading-relaxed">
            Size daha iyi bir kavurma atölyesi deneyimi sunmak için çerezleri kullanıyoruz.
            <Link to="/kvkk" className="text-[#000000] border-b border-[#000000] ml-2 hover:text-[#555555] hover:border-[#555555] transition-colors">Detaylar</Link>
          </p>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={() => handleAction('accepted')}
            className="flex-1 bg-[#000000] text-[#FFFFFF] px-4 py-3 font-mono text-[0.6rem] uppercase tracking-[0.15em] border border-[#000000] hover:bg-[#555555] hover:border-[#555555] transition-colors"
          >
            Kabul Et
          </button>
          <button 
            onClick={() => handleAction('declined')}
            className="flex-1 bg-transparent text-[#555555] px-4 py-3 font-mono text-[0.6rem] uppercase tracking-[0.15em] border border-[#E5E5E5] hover:border-[#000000] hover:text-[#000000] transition-colors"
          >
            Reddet
          </button>
        </div>
      </div>
    </div>
  );
};

// --- SEPET ÇEKMECESİ (CART DRAWER) ---
const CartDrawer = () => {
  const { cartItems, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, totalPrice } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

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

    if (isAuthenticated) {
      navigate(targetPath);
    } else {
      navigate('/hesap/giris', { state: { from: { pathname: targetPath } } });
    }
  };

  return (
    <>
      <div 
        className={`fixed inset-0 z-[60] bg-[#000000]/40 backdrop-blur-sm transition-opacity duration-500 ${isCartOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={() => { setIsCartOpen(false); setCheckoutError(null); }}
      />
      
      <div className={`fixed right-0 top-0 z-[70] h-full w-full max-w-[440px] bg-[#FFFFFF] border-l border-[#E5E5E5] transition-transform duration-700 ease-out ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="flex h-full flex-col">
          
          <div className="flex items-center justify-between border-b border-[#E5E5E5] p-6 bg-[#FFFFFF]">
            <h3 className="font-mono text-[0.65rem] tracking-[0.2em] uppercase text-[#000000] flex items-center gap-3">
              <span className="w-4 h-[1px] bg-[#000000]"></span> Seçkiniz
            </h3>
            <button 
              onClick={() => { setIsCartOpen(false); setCheckoutError(null); }} 
              className="text-[#888888] hover:text-[#000000] transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 bg-[#FAFAFA]">
            {cartItems.length > 0 ? (
              <div className="space-y-4">
                {cartItems.map((item: any) => (
                  <div key={item.id} className="flex gap-4 bg-[#FFFFFF] border border-[#E5E5E5] p-4 group hover:border-[#000000] transition-colors">
                    <div className="h-24 w-20 bg-[#FAFAFA] border border-[#E5E5E5] flex items-center justify-center p-2 shrink-0">
                      {item.image ? (
                         <img src={item.image} alt={item.name} className="h-full w-full object-contain mix-blend-multiply" />
                      ) : (
                         <div className="font-mono text-[0.45rem] text-[#888888] tracking-[0.1em] -rotate-90 whitespace-nowrap">
                           {item.code || `KOD-${item.id}`}
                         </div>
                      )}
                    </div>
                    
                    <div className="flex flex-1 flex-col justify-between py-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-mono text-[0.5rem] tracking-[0.15em] uppercase text-[#888888] mb-1">
                             {item.roast || "Taze Kavrum"}
                          </div>
                          <h4 className="font-serif text-[1rem] text-[#000000] leading-snug">{item.name}</h4>
                        </div>
                        <button 
                          onClick={() => { removeFromCart(item.id); setCheckoutError(null); }} 
                          className="text-[#888888] hover:text-[#000000] transition-colors ml-2"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-between mt-4">
                        {!item.isSubscription ? (
                          <div className="flex items-center border border-[#E5E5E5] bg-[#FFFFFF]">
                            <button onClick={() => updateQuantity(item.id, -1)} className="px-2 py-1.5 text-[#555555] hover:bg-[#FAFAFA] hover:text-[#000000] transition-colors"><Minus className="h-3 w-3" /></button>
                            <span className="font-mono text-[0.65rem] px-3 text-[#000000]">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, 1)} className="px-2 py-1.5 text-[#555555] hover:bg-[#FAFAFA] hover:text-[#000000] transition-colors"><Plus className="h-3 w-3" /></button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 border border-[#000000] px-2 py-1">
                            <Info className="h-3 w-3 text-[#000000]" />
                            <span className="font-mono text-[0.5rem] tracking-[0.15em] uppercase text-[#000000]">Abonelik</span>
                          </div>
                        )}
                        <span className="font-mono font-semibold text-[0.95rem] text-[#000000]">{item.price}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-center px-4">
                <div className="w-16 h-16 border border-[#E5E5E5] bg-[#FFFFFF] flex items-center justify-center mb-6">
                  <span className="font-serif italic text-2xl text-[#888888] leading-none">0</span>
                </div>
                <h4 className="font-serif text-[1.5rem] text-[#000000] mb-2">Seçkiniz Boş</h4>
                <p className="font-sans font-light text-[0.85rem] text-[#555555] mb-8 max-w-[200px]">Dünyanın seçkin bölgelerinden gelen taze kavrulmuş kahvelerimizi keşfetmeye başlayın.</p>
                <button 
                  onClick={() => { setIsCartOpen(false); navigate('/kahveler'); }}
                  className="font-mono text-[0.65rem] tracking-[0.15em] uppercase text-[#FFFFFF] bg-[#000000] border border-[#000000] px-8 py-3 transition-colors hover:bg-[#555555] hover:border-[#555555]"
                >
                  Seçkiyi Keşfet
                </button>
              </div>
            )}
          </div>

          {cartItems.length > 0 && (
            <div className="border-t border-[#E5E5E5] bg-[#FFFFFF] p-6 mt-auto">
              {checkoutError && (
                <div className="flex items-start gap-3 p-4 bg-[#FAFAFA] border border-[#000000] mb-4">
                  <AlertCircle className="h-4 w-4 text-[#000000] shrink-0 mt-0.5" />
                  <p className="font-sans text-[0.8rem] text-[#000000] leading-relaxed">{checkoutError}</p>
                </div>
              )}
              
              <div className="flex justify-between items-center mb-6">
                <span className="font-mono text-[0.6rem] tracking-[0.2em] uppercase text-[#888888]">Ara Toplam</span>
                <span className="font-mono font-semibold text-[1.2rem] text-[#000000]">
                  ₺{totalPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              
              <button 
                onClick={handleCheckout} 
                className={`w-full py-4 font-mono text-[0.65rem] tracking-[0.15em] uppercase transition-colors flex items-center justify-center gap-3 ${
                  checkoutError 
                    ? 'bg-[#E5E5E5] text-[#888888] cursor-not-allowed border border-[#E5E5E5]' 
                    : 'bg-[#000000] text-[#FFFFFF] border border-[#000000] hover:bg-[#555555] hover:border-[#555555]'
                }`}
              >
                {checkoutError ? 'Sepeti Düzenle' : 'Ödemeye Geç'}
                {!checkoutError && <ArrowRight className="w-4 h-4" />}
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
    <footer className="bg-[#000000] text-[#FFFFFF] border-t border-[#000000] pt-24 pb-12 mt-auto">
      <div className="max-w-[1440px] mx-auto px-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-12 md:gap-20 mb-20">
          
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="block mb-2 h-20">
              <img src="/editionbeyaz.png" alt="edi-TION" className="h-full w-auto object-contain object-left md:object-center" />
            </Link>
            <p className="font-sans font-light text-[0.85rem] text-[#888888] leading-[1.8] max-w-[240px]">
              Dünyanın seçkin kahve çiftliklerinden özenle seçilen, Ankara'daki atölyemizde siparişinize özel kavrulan benzersiz bir kahve deneyimi.
            </p>
          </div>

          <div className="col-span-1">
            <h4 className="font-mono text-[0.55rem] tracking-[0.2em] uppercase text-[#555555] mb-6">Atölye</h4>
            <ul className="space-y-4">
              <li><Link to="/kahveler" className="font-sans font-light text-[0.85rem] text-[#FFFFFF] hover:text-[#888888] transition-colors">Tüm Seçki</Link></li>
              <li><Link to="/abonelik" className="font-sans font-light text-[0.85rem] text-[#FFFFFF] hover:text-[#888888] transition-colors">Abonelik Programı</Link></li>
              <li><Link to="/hakkimizda" className="font-sans font-light text-[0.85rem] text-[#FFFFFF] hover:text-[#888888] transition-colors">Hakkımızda</Link></li>
              <li><Link to="/toptan" className="font-sans font-light text-[0.85rem] text-[#FFFFFF] hover:text-[#888888] transition-colors">Toptan Satış</Link></li>
            </ul>
          </div>

          <div className="col-span-1">
            <h4 className="font-mono text-[0.55rem] tracking-[0.2em] uppercase text-[#555555] mb-6">Destek</h4>
            <ul className="space-y-4">
              <li><Link to="/sss" className="font-sans font-light text-[0.85rem] text-[#FFFFFF] hover:text-[#888888] transition-colors">Sıkça Sorulanlar</Link></li>
              <li><Link to="/kargo" className="font-sans font-light text-[0.85rem] text-[#FFFFFF] hover:text-[#888888] transition-colors">Kargo & Teslimat</Link></li>
              <li><Link to="/kvkk" className="font-sans font-light text-[0.85rem] text-[#FFFFFF] hover:text-[#888888] transition-colors">Aydınlatma Metni</Link></li>
            </ul>
          </div>

          <div className="col-span-2 md:col-span-1">
            <h4 className="font-mono text-[0.55rem] tracking-[0.2em] uppercase text-[#555555] mb-6">İletişim</h4>
            <ul className="space-y-4 mb-8">
              <li className="font-sans font-light text-[0.85rem] text-[#FFFFFF]">
                info@editioncoffee.co
              </li>
              <li className="font-sans font-light text-[0.85rem] text-[#FFFFFF]">
                Özel Kavurma Atölyesi — Ankara
              </li>
            </ul>
            <div className="flex gap-4">
              <a href="#" className="text-[#555555] hover:text-[#FFFFFF] transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-[#555555] hover:text-[#FFFFFF] transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-[#FFFFFF]/10 pt-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <p className="font-mono text-[0.55rem] tracking-[0.2em] uppercase text-[#555555]">
            © {new Date().getFullYear()} EDITION COFFEE ROASTERY. TÜM HAKLARI SAKLIDIR.
          </p>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-6 font-mono text-[0.55rem] tracking-[0.2em] uppercase text-[#555555]">
            <span>EST. 2019 / ANK</span>
            <span className="hidden sm:inline">|</span>
            <span className="hover:text-[#FFFFFF] transition-colors cursor-pointer">
              Developed by Doğa Ata Demir
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

// --- ANA LAYOUT BİLEŞENİ ---
const Layout = ({ children }: { children: ReactNode }) => {
  const { cartCount, setIsCartOpen } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Mobil Menü Stateleri
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileKahvelerOpen, setIsMobileKahvelerOpen] = useState(false);

  // Sayfa değiştiğinde mobil menüyü kapat
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname, location.search]);

  // Genel Link Class'ı
  const navLinkClass = "font-mono text-[0.6rem] tracking-[0.15em] uppercase text-[#555555] hover:text-[#000000] transition-colors relative after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-[1px] after:bottom-[-4px] after:left-0 after:bg-[#000000] after:origin-bottom-right hover:after:scale-x-100 hover:after:origin-bottom-left after:transition-transform after:duration-300";
  
  // Dropdown İçi Link Class'ı
  const dropdownLinkClass = "font-mono text-[0.6rem] tracking-[0.15em] uppercase text-[#555555] hover:text-[#000000] transition-colors block py-1.5";

  return (
    <div className="min-h-screen w-full bg-[#FFFFFF] font-sans text-[#000000] flex flex-col selection:bg-[#000000] selection:text-[#FFFFFF]">
      
      {/* HEADER GÜNCELLEMESİ:
        Duyuru şeridinin yüksekliği h-10 (40px) olduğu için 
        genel header yüksekliği h-[130px]'e çıktı. 
      */}
      <header className="fixed top-0 left-0 right-0 z-50 flex flex-col bg-[#FFFFFF]/90 backdrop-blur-md border-b border-[#E5E5E5] transition-all">
        
        <AnnouncementBar />

        <div className="relative mx-auto flex w-full max-w-[1440px] items-center justify-between px-6 lg:px-10 h-[90px]">
          
          {/* SOL: HAMBURGER (Mobil/Tablet) & NAVİGASYON (Masaüstü) */}
          <div className="flex items-center h-full">
            {/* Hamburger İkonu (1024px altında görünür) */}
            <button 
              className="lg:hidden text-[#555555] hover:text-[#000000] transition-colors"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Menüyü Aç"
            >
              <Menu className="h-6 w-6" strokeWidth={1.5} />
            </button>

            {/* Masaüstü Navigasyon (1024px ve üzerinde görünür) */}
            <nav className="hidden lg:flex gap-8 items-center h-full">
              <Link to="/" className={navLinkClass}>
                Ana Sayfa
              </Link>
              
              <div className="relative group h-full flex items-center">
                <Link to="/kahveler" className={navLinkClass}>
                  Kahveler▼
                </Link>
                <div className="absolute left-0 top-full opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-300">
                  <div className="bg-[#FFFFFF] border border-[#E5E5E5] border-t-0 p-5 flex flex-col gap-3 min-w-[200px] shadow-sm">
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

          {/* ORTA: SİYAH LOGO (Tüm ekranlarda mutlak ortalanmış) */}
          <Link to="/" className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 block h-16 md:h-20">
            <img src="/editionsiyah.png" alt="edi-TION" className="h-full w-auto object-contain" />
          </Link>

          {/* SAĞ: İKONLAR */}
          <div className="flex items-center gap-4 lg:gap-6">
            <button className="text-[#555555] hover:text-[#000000] transition-colors hidden sm:block">
               <Search className="h-4 w-4" />
            </button>
            
            <button 
              onClick={() => navigate(isAuthenticated ? '/hesap/profil' : '/hesap/giris')} 
              className={`transition-colors hidden sm:block ${isAuthenticated ? 'text-[#000000]' : 'text-[#555555] hover:text-[#000000]'}`}
            >
              <User className="h-4 w-4" />
            </button>

            <button 
              className="relative text-[#555555] hover:text-[#000000] transition-colors flex items-center gap-2 group" 
              onClick={() => setIsCartOpen(true)}
            >
              <ShoppingBag className="h-5 w-5 sm:h-4 sm:w-4" />
              <span className="font-mono text-[0.6rem] sm:text-[0.6rem] mt-[1px]">
                [ {cartCount} ]
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* --- MOBİL MENÜ ÇEKMECESİ --- */}
      <>
        <div 
          className={`fixed inset-0 z-[60] bg-[#000000]/40 backdrop-blur-sm transition-opacity lg:hidden duration-500 ${isMobileMenuOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
          onClick={() => setIsMobileMenuOpen(false)}
        />
        <div className={`fixed left-0 top-0 z-[70] h-full w-[85%] max-w-[360px] bg-[#FFFFFF] border-r border-[#E5E5E5] transition-transform duration-700 ease-out lg:hidden flex flex-col ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex items-center justify-between border-b border-[#E5E5E5] p-6">
            <span className="font-mono text-[0.65rem] tracking-[0.2em] uppercase text-[#000000]">Menü</span>
            <button onClick={() => setIsMobileMenuOpen(false)} className="text-[#888888] hover:text-[#000000]">
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 mt-4">
            <Link to="/" className="font-serif text-[1.4rem] text-[#000000]">Ana Sayfa</Link>
            
            <div className="flex flex-col">
              <button 
                onClick={() => setIsMobileKahvelerOpen(!isMobileKahvelerOpen)} 
                className="flex items-center justify-between w-full font-serif text-[1.4rem] text-[#000000] text-left"
              >
                Kahveler
                <ChevronDown className={`h-5 w-5 text-[#888888] transition-transform duration-300 ${isMobileKahvelerOpen ? 'rotate-180' : ''}`} />
              </button>
              
              <div className={`flex flex-col gap-4 overflow-hidden transition-all duration-300 ${isMobileKahvelerOpen ? 'max-h-[250px] mt-4 opacity-100' : 'max-h-0 opacity-0'}`}>
                <Link to="/kahveler" className="font-sans font-light text-[0.95rem] text-[#555555] pl-4 border-l border-[#E5E5E5] hover:text-[#000000]">Tümünü Gör</Link>
                <Link to="/kahveler?kategori=turk-kahvesi" className="font-sans font-light text-[0.95rem] text-[#555555] pl-4 border-l border-[#E5E5E5] hover:text-[#000000]">Türk Kahvesi</Link>
                <Link to="/kahveler?kategori=filtre" className="font-sans font-light text-[0.95rem] text-[#555555] pl-4 border-l border-[#E5E5E5] hover:text-[#000000]">Filtre Kahve</Link>
                <Link to="/kahveler?kategori=espresso" className="font-sans font-light text-[0.95rem] text-[#555555] pl-4 border-l border-[#E5E5E5] hover:text-[#000000]">Espresso</Link>
                <Link to="/kahveler?kategori=paket" className="font-sans font-light text-[0.95rem] text-[#555555] pl-4 border-l border-[#E5E5E5] hover:text-[#000000]">Avantajlı Paketler</Link>
              </div>
            </div>

            <Link to="/hakkimizda" className="font-serif text-[1.4rem] text-[#000000]">Hakkımızda</Link>
            <Link to="/toptan" className="font-serif text-[1.4rem] text-[#000000]">Toptan Satış</Link>
            <Link to="/iletisim" className="font-serif text-[1.4rem] text-[#000000]">İletişim</Link>
          </div>
          
          <div className="p-6 border-t border-[#E5E5E5] bg-[#FAFAFA] flex flex-col gap-4">
             <Link to={isAuthenticated ? '/hesap/profil' : '/hesap/giris'} className="flex items-center gap-3 font-mono text-[0.65rem] tracking-[0.15em] uppercase text-[#555555] hover:text-[#000000]">
              <User className="h-4 w-4" /> {isAuthenticated ? 'Hesabım' : 'Giriş Yap / Üye Ol'}
            </Link>
            <button className="flex items-center gap-3 font-mono text-[0.65rem] tracking-[0.15em] uppercase text-[#555555] hover:text-[#000000] text-left">
               <Search className="h-4 w-4" /> Arama Yap
            </button>
          </div>
        </div>
      </>
      
      <CartDrawer />
      
      {/* MAIN GÜNCELLEMESİ: 
        Header yüksekliği 130px olduğu için içeriğin menü altında kalmaması adına pt-[130px] yapıldı
      */}
      <main className="pt-[130px] flex-grow flex flex-col">
        {children}
      </main>

      <Footer />
      
      <CookieBanner />
    </div>
  );
};

export default Layout;