// src/app/App.tsx
import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ShopifyProvider } from '@shopify/hydrogen-react';
import { CartProvider } from '../context/CartContext';
import { AuthProvider } from '../context/AuthContext';

import Layout from '../components/Layout';
import ScrollToTop from '../components/ScrollToTop';

// Mevcut Sayfalar
const Anasayfa = lazy(() => import('../pages/Anasayfa'));
const Hakkimizda = lazy(() => import('../pages/Hakkimizda'));
const Urun = lazy(() => import('../pages/Urun'));
const Sss = lazy(() => import('../pages/Sss'));
const Kargo = lazy(() => import('../pages/Kargo'));
const Kvkk = lazy(() => import('../pages/Kvkk'));
const NotFound = lazy(() => import('../pages/NotFound'));
const Kahveler = lazy(() => import('../pages/Kahveler'));
const Toptan = lazy(() => import('../pages/Toptan'));
const Iletisim = lazy(() => import('../pages/Iletisim'));
const Odeme = lazy(() => import('../pages/Odeme'));
const SifreYenile = lazy(() => import('../pages/SifreYenile'));


// Yeni Eklenen Müşteri / Hesap Sayfaları
const Giris = lazy(() => import('../pages/Giris'));
const Kayit = lazy(() => import('../pages/Kayit'));
const Hesap = lazy(() => import('../pages/Hesap'));
const SifremiUnuttum = lazy(() => import('../pages/SifremiUnuttum'));
const AramaSonuclari = lazy(() => import('../pages/AramaSonuclari'));

const storeDomain = import.meta.env.VITE_SHOPIFY_STORE_DOMAIN;
const storefrontToken = import.meta.env.VITE_SHOPIFY_STOREFRONT_TOKEN;

// ─── TEMAYA UYGUN YATAY KAYAN ÇİZGİLİ YÜKLEME EKRANI ───────────────────────

const loaderStyles = `
  @keyframes loadingLineScroll {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
  .animate-loading-line {
    animation: loadingLineScroll 1.5s cubic-bezier(0.65, 0, 0.35, 1) infinite;
  }
`;

const PageLoader = () => (
  <div className="fixed inset-0 z-[9999] flex h-screen w-screen flex-col items-center justify-center bg-white selection:bg-black selection:text-white">
    <style>{loaderStyles}</style>

    <div className="flex flex-col items-center gap-12">
      <img
        src="/editionsiyah.png"
        alt="Edition Coffee"
        className="h-12 w-auto object-contain opacity-80"
      />

      <div className="flex flex-col items-center gap-4">
        <span className="font-mono text-[0.6rem] tracking-[0.4em] uppercase text-[#777777]">
          Seçki Hazırlanıyor
        </span>

        <div className="h-[1px] w-64 bg-neutral-100 overflow-hidden relative">
          <div className="absolute top-0 h-full w-3/4 bg-black animate-loading-line"></div>
        </div>
      </div>
    </div>
  </div>
);

function App() {
  return (
    <ShopifyProvider
      storeDomain={storeDomain}
      storefrontToken={storefrontToken}
      storefrontApiVersion="2026-04"
      countryIsoCode="TR"
      languageIsoCode="TR"
    >
      <CartProvider>
        <BrowserRouter>
          <AuthProvider>
          <ScrollToTop />
          
          <Suspense fallback={<PageLoader />}>
            <Layout>
              <Routes>
                {/* ANA SAYFALAR */}
                <Route path="/" element={<Anasayfa />} />
                <Route path="/shop" element={<Kahveler />} />
                <Route path="/hakkimizda" element={<Hakkimizda />} />
                <Route path="/cart" element={<Odeme />} />

                {/* ÜRÜN DETAY */}
                <Route path="/urun/:id" element={<Urun />} />

                {/* MÜŞTERİ HESABI SAYFALARI */}
                <Route path="/hesap/giris" element={<Giris />} />
                <Route path="/hesap/kayit" element={<Kayit />} />
                <Route path="/hesap" element={<Hesap />} />
                <Route path="/hesap/sifremi-unuttum" element={<SifremiUnuttum />} />
                <Route path="/account/reset/:id/:token" element={<SifreYenile />} />
                {/* DİĞER SAYFALAR */}
                <Route path="/sss" element={<Sss />} />
                <Route path="/kargo" element={<Kargo />} />
                <Route path="/kvkk" element={<Kvkk />} />
                <Route path="/toptan" element={<Toptan />} />
                <Route path="/iletisim" element={<Iletisim />} />
                <Route path="/arama" element={<AramaSonuclari />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Layout>
          </Suspense>
          
        </AuthProvider>
        </BrowserRouter>
      </CartProvider>
    </ShopifyProvider>
  );
}

export default App;