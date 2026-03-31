// src/app/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from '../components/Layout';
import ScrollToTop from '../components/ScrollToTop';
import Anasayfa from '../pages/Anasayfa';
import Hakkimizda from '../pages/Hakkimizda';
import Abonelik from '../pages/Abonelik';
import Urun from '../pages/Urun';
import { CartProvider } from '../context/CartContext';

import Sss from '../pages/Sss';
import Kargo from '../pages/Kargo';
import Kvkk from '../pages/Kvkk';
import NotFound from '../pages/NotFound';
import Kahveler from '../pages/Kahveler';
import Toptan from '../pages/Toptan';
import Iletisim from '../pages/Iletisim';

function App() {
  return (
 
      <CartProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Layout>
            <Routes>
              {/* ANA SAYFALAR */}
              <Route path="/" element={<Anasayfa />} />
              <Route path="/kahveler" element={<Kahveler />} />
              <Route path="/hakkimizda" element={<Hakkimizda />} /> 
              <Route path="/abonelik" element={<Abonelik />} /> 

              {/* ÜRÜN DETAY */}
              <Route path="/urun/:id" element={<Urun />} />


<Route path="/sss" element={<Sss />} />
<Route path="/kargo" element={<Kargo />} />
<Route path="/kvkk" element={<Kvkk />} />
<Route path="/toptan" element={<Toptan />} />
<Route path="/iletisim" element={<Iletisim />} />
<Route path="*" element={<NotFound />} />

            </Routes>
          </Layout>
        </BrowserRouter>
      </CartProvider>

  );
}

export default App;