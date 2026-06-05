// src/app/App.tsx
import { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { ShopifyProvider } from '@shopify/hydrogen-react';
import { CartProvider } from '../context/CartContext';
import { AuthProvider } from '../context/AuthContext';

import Layout from '../components/Layout';
import ScrollToTop from '../components/ScrollToTop';
import { initPixel, pageView } from '../lib/metaPixel';

// Mevcut Sayfalar
const Anasayfa = lazy(() => import('../pages/Anasayfa'));
const Hakkimizda = lazy(() => import('../pages/Hakkimizda'));
const Urun = lazy(() => import('../pages/Urun'));
const Sss = lazy(() => import('../pages/Sss'));
const NotFound = lazy(() => import('../pages/NotFound'));
const Kahveler = lazy(() => import('../pages/Kahveler'));
const Toptan = lazy(() => import('../pages/Toptan'));
const Iletisim = lazy(() => import('../pages/Iletisim'));
const Odeme = lazy(() => import('../pages/Odeme'));
const Analitik = lazy(() => import('../components/AnalyticsDashboard'));
const UyelikSozlesmesi = lazy(() => import('../pages/UyelikSozlesmesi'));
const GizlilikSozlesmesi = lazy(() => import('../pages/GizlilikSozlesmesi'));
const IadeSartlari = lazy(() => import('../pages/IadeSartlari'));
const MesafeliSatisSozlesmesi = lazy(() => import('../pages/MesafeliSatisSozlesmesi'));

const storeDomain = import.meta.env.VITE_SHOPIFY_STORE_DOMAIN;
const storefrontToken = import.meta.env.VITE_SHOPIFY_STOREFRONT_TOKEN;

// ─── META PIXEL ──────────────────────────────────────────────────────────────

function MetaPixel() {
  const location = useLocation();

  useEffect(() => {
    initPixel();
  }, []);

  useEffect(() => {
    pageView();
  }, [location]);

  return null;
}

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
            <MetaPixel />

            <Suspense fallback={<PageLoader />}>
              <Layout>
                <Routes>
                  {/* ANA SAYFALAR */}
                  <Route path="/" element={<Anasayfa />} />
                  <Route path="/kahveler" element={<Kahveler />} />
                  <Route path="/hakkimizda" element={<Hakkimizda />} />
                  <Route path="/odeme" element={<Odeme />} />

                  {/* ÜRÜN DETAY */}
                  <Route path="/urun/:id" element={<Urun />} />

                  {/* DİĞER SAYFALAR */}
                  <Route path="/sss" element={<Sss />} />
                  <Route path="/toptan" element={<Toptan />} />
                  <Route path="/iletisim" element={<Iletisim />} />
                  <Route path="/analiz" element={<Analitik />} />
                  <Route path="/uyelik-sozlesmesi" element={<UyelikSozlesmesi />} />
                  <Route path="/gizlilik-sozlesmesi" element={<GizlilikSozlesmesi />} />
                  <Route path="/iade-sartlari" element={<IadeSartlari />} />
                  <Route path="/mesafeli-satis-sozlesmesi" element={<MesafeliSatisSozlesmesi />} />

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