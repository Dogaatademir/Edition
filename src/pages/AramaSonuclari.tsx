// src/pages/AramaSonuclari.tsx
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { fetchShopifyProducts, type CoffeeProduct } from '../lib/shopify';
import { useCart } from '../context/CartContext';

export default function AramaSonuclari() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  
  const [products, setProducts] = useState<CoffeeProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<CoffeeProduct[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState(query);

  useEffect(() => {
    fetchShopifyProducts()
      .then(setProducts)
      .catch((err) => console.error("Ürünler yüklenemedi:", err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!query) {
      setFilteredProducts([]);
      return;
    }

    const lowerQuery = query.toLowerCase();
    const results = products.filter(p => 
      p.name.toLowerCase().includes(lowerQuery) || 
      p.description.toLowerCase().includes(lowerQuery) ||
      p.category.some(c => c.toLowerCase().includes(lowerQuery)) ||
      (p.notes && p.notes.some(n => n.toLowerCase().includes(lowerQuery)))
    );
    
    setFilteredProducts(results);
  }, [query, products]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setSearchParams({ q: searchInput.trim() });
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 md:px-10 py-12 md:py-20 min-h-screen">
      
      {/* Arama Başlığı ve Formu */}
      <div className="flex flex-col items-center mb-16 border-b border-[#E5E5E5] pb-12">
        <div className="font-mono text-[0.55rem] tracking-[0.3em] uppercase text-[#888888] mb-6">
          Arama Sonuçları
        </div>
        
        <form onSubmit={handleSearchSubmit} className="w-full max-w-[500px] relative">
          <input 
            type="text" 
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Kahve adı, nota veya kategori arayın..."
            className="w-full border-b-2 border-black bg-transparent py-4 pr-12 font-serif text-[1.5rem] md:text-[2rem] outline-none placeholder:text-[#CCCCCC]"
          />
          <button type="submit" className="absolute right-0 top-1/2 -translate-y-1/2 text-black hover:text-[#888888] transition-colors">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </button>
        </form>

        {query && !loading && (
          <div className="mt-8 font-mono text-[0.65rem] tracking-[0.1em] text-[#555555] uppercase">
             "{query}" için <span className="text-black font-semibold">{filteredProducts.length}</span> sonuç bulundu
          </div>
        )}
      </div>

      {/* Sonuçlar Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse flex flex-col gap-4">
              <div className="w-full aspect-square bg-[#FAFAFA]"></div>
              <div className="h-4 bg-[#FAFAFA] w-2/3"></div>
              <div className="h-6 bg-[#FAFAFA] w-full"></div>
            </div>
          ))}
        </div>
      ) : query && filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 border-t border-l border-[#E5E5E5]">
          {filteredProducts.map((p) => (
            <div
              key={p.id}
              onClick={() => navigate(`/urun/${p.handle}`)}
              className="group relative border-r border-b border-[#E5E5E5] p-6 cursor-pointer bg-[#FFFFFF] transition-colors hover:bg-[#FAFAFA] flex flex-col h-full"
            >
              <div className="flex justify-between items-start mb-6">
                <span className="font-mono text-[0.55rem] tracking-[0.12em] text-[#888888]">{p.code}</span>
              </div>

              <div className="w-full aspect-square bg-[#FFFFFF] border border-[#E5E5E5] flex items-center justify-center mb-6 p-4">
                {p.image ? (
                  <img src={p.image} alt={p.name} className="h-full w-full object-contain mix-blend-multiply transition-transform duration-700 group-hover:scale-105" />
                ) : (
                   <span className="font-mono text-xs text-[#888888]">Görsel Yok</span>
                )}
              </div>

              <div className="flex-grow">
                <div className="font-mono text-[0.55rem] tracking-[0.2em] uppercase text-[#888888] mb-2">
                  {p.origin || "Seçki"} {p.process ? `· ${p.process}` : ""}
                </div>
                <div className="font-serif text-[1.15rem] text-[#000000] leading-[1.15] mb-2">{p.name}</div>
              </div>

              <div className="flex items-center justify-between pt-4 mt-6 border-t border-[#E5E5E5]">
                <span className="font-mono font-semibold text-[1.1rem] text-[#000000]">
                  {p.price}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); addToCart(p); }}
                  className="font-mono text-[0.6rem] tracking-[0.1em] uppercase border border-black bg-white px-3 py-1.5 hover:bg-black hover:text-white transition-colors"
                >
                  Ekle
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : query && filteredProducts.length === 0 ? (
        <div className="text-center py-20">
          <p className="font-serif italic text-[#888888] text-[1.2rem] mb-6">Aramanızla eşleşen bir ürün bulamadık.</p>
          <button 
            onClick={() => navigate('/kahveler')}
            className="font-mono text-[0.6rem] tracking-[0.2em] uppercase bg-black text-white px-8 py-4 hover:bg-[#333333] transition-colors"
          >
            Tüm Seçkiyi İncele
          </button>
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="font-serif italic text-[#888888] text-[1.2rem]">Keşfetmek istediğiniz kahveyi yukarıdan arayın.</p>
        </div>
      )}

    </div>
  );
}