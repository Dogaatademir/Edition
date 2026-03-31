import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { SlidersHorizontal, ArrowDownAZ, Check, ChevronDown, X } from 'lucide-react';
import { products, type CoffeeProduct } from '../data/products';
import { useCart } from '../context/CartContext';

// ─── HOOK ─────────────────────────────────────────────────────────────────────
function useReveal(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { 
      if (e.isIntersecting) { setVisible(true); obs.disconnect(); } 
    }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

// --- YARDIMCI TİPLER VE FONKSİYONLAR ---

type SortOption = 'default' | 'price-asc' | 'price-desc' | 'name-asc' | 'name-desc';
type FilterOption = 'all' | 'turk-kahvesi' | 'filtre' | 'espresso' | 'paket';

const parsePrice = (priceStr: string): number => {
  if (!priceStr) return 999999;
  return parseFloat(priceStr.replace(/[^\d,.-]/g, '').replace(',', '.'));
};

// --- ÜRÜN KARTI ---

const ProductCard = ({ p, onAdd }: { p: CoffeeProduct, onAdd: (p: CoffeeProduct) => void }) => {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/urun/${p.id}`)}
      className="group relative border-r border-b border-[#E5E5E5] p-7 cursor-pointer bg-[#FAFAFA] transition-colors hover:bg-[#F0F0F0] flex flex-col h-full"
    >
      <div className="flex justify-between items-start mb-6">
        <span className="font-mono text-[0.55rem] tracking-[0.12em] text-[#888888]">{p.code || 'NO-CODE'}</span>
        {p.badge && (
          <span className="font-mono text-[0.5rem] font-semibold tracking-[0.15em] uppercase text-[#FFFFFF] bg-[#000000] px-2 py-0.5">
            {p.badge}
          </span>
        )}
      </div>

      <div className="w-full aspect-square bg-[#FFFFFF] border border-[#E5E5E5] flex items-center justify-center mb-5 relative overflow-hidden group-hover:border-[#888888] transition-colors">
        {p.image ? (
          <img src={p.image} alt={p.name} className="h-full w-full object-contain mix-blend-multiply p-4 transition-transform duration-700 group-hover:scale-105" />
        ) : (
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none" className="opacity-20">
            <ellipse cx="40" cy="40" rx="28" ry="36" stroke="#000000" strokeWidth="1.5" />
            <path d="M40 10 Q55 25 55 40 Q55 55 40 70" stroke="#000000" strokeWidth="1.5" strokeDasharray="3 3" />
            <path d="M40 10 Q25 25 25 40 Q25 55 40 70" stroke="#000000" strokeWidth="1" strokeDasharray="2 4" />
            <ellipse cx="40" cy="40" rx="4" ry="6" stroke="#000000" strokeWidth="1" />
          </svg>
        )}
        <span className="absolute bottom-2 right-2 font-mono text-[0.5rem] tracking-[0.12em] text-[#888888]">
          {p.roast || 'KAVRUM'}
        </span>
      </div>

      <div className="flex-grow">
        <div className="font-mono text-[0.55rem] tracking-[0.2em] uppercase text-[#888888] mb-1">
          {p.origin || 'KÖKEN GİRİLMEDİ'} · {p.process || 'İŞLEM GİRİLMEDİ'}
        </div>
        <div className="font-serif text-[1.15rem] text-[#000000] leading-[1.15] mb-1.5">{p.name}</div>
        <div className="font-mono text-[0.58rem] tracking-[0.08em] text-[#888888] mb-4">{p.process} işlem</div>
        
        <div className="flex flex-wrap gap-1.5 mb-5">
          {p.notes?.map((n) => (
            <span key={n} className="font-mono text-[0.56rem] tracking-[0.05em] text-[#555555] border border-[#E5E5E5] px-2 py-0.5 transition-colors group-hover:border-[#888888]">
              {n}
            </span>
          ))}
        </div>
      </div>
      
      <div className="flex items-center justify-between pt-4 border-t border-[#E5E5E5] mt-auto">
        <div className="flex flex-col">
          {p.oldPrice && (
            <span className="font-mono text-[0.7rem] text-[#888888] line-through mb-0.5">
              {p.oldPrice}
            </span>
          )}
          <span className="font-mono font-semibold text-[1.1rem] text-[#000000]">
            {p.price}
          </span>
        </div>

        <button 
          onClick={(e) => {
            e.stopPropagation();
            onAdd(p);
          }}
          className="w-8 h-8 border border-[#000000] bg-[#000000] text-[#FFFFFF] flex items-center justify-center font-mono opacity-0 translate-y-1 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 hover:bg-[#555555] hover:border-[#555555]"
          title="Sepete Ekle"
        >
          +
        </button>
      </div>
    </div>
  );
};

// --- HERO BÖLÜMÜ ---

const ShopHero = () => {
  const heroReveal = useReveal();

  return (
    <section className="relative flex flex-col pt-32 pb-16 px-10 bg-[#FFFFFF] overflow-hidden border-b border-[#E5E5E5]">
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 opacity-40">
        <svg className="w-full h-full" viewBox="0 0 1440 300" fill="none" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
          {[120, 360, 720, 1080, 1320].map((x) => (
            <line key={x} x1={x} y1="0" x2={x} y2="300" stroke="#000000" strokeWidth="0.4" strokeOpacity="0.08" />
          ))}
          <line x1="0" y1="150" x2="1440" y2="150" stroke="#000000" strokeWidth="0.4" strokeOpacity="0.08" />
        </svg>
      </div>

      <div 
        ref={heroReveal.ref}
        className={`relative z-10 max-w-[1440px] mx-auto w-full transition-all duration-[1000ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${heroReveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}`}
      >
        <div className="font-mono text-[0.58rem] tracking-[0.35em] uppercase text-[#888888] mb-4 flex items-center gap-2 before:content-[''] before:block before:w-5 before:h-[1px] before:bg-[#888888]">
          Tüm Koleksiyon
        </div>
        <h1 className="font-serif text-[clamp(2.5rem,5vw,5rem)] text-[#000000] leading-[1.05] tracking-[-0.02em] max-w-2xl">
          Nitelikli Kahve <em className="italic text-[#555555]">Seçkisi</em>
        </h1>
        <p className={`font-sans font-light text-[0.95rem] leading-[1.85] text-[#555555] max-w-lg mt-6 transition-all duration-[1000ms] delay-200 ease-[cubic-bezier(0.16,1,0.3,1)] ${heroReveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}>
          Ankara'daki atölyemizde özenle profillendirilmiş, dünyanın seçkin bölgelerinden gelen taze kavrulmuş çekirdekler.
        </p>
      </div>
    </section>
  );
};

// --- DÜKKAN ANA BİLEŞENİ ---

const Kahveler = () => {
  const [displayedProducts, setDisplayedProducts] = useState<CoffeeProduct[]>(products as CoffeeProduct[]);
  const [sortOption, setSortOption] = useState<SortOption>('default');
  const [filterOption, setFilterOption] = useState<FilterOption>('all');
  
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const sortRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const gridReveal = useReveal(0.05); // Grid animasyonu için Hook

  const { addToCart } = useCart();
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const category = params.get('kategori');
    if (category && ['turk-kahvesi', 'filtre', 'espresso', 'paket'].includes(category)) {
      setFilterOption(category as FilterOption);
    }
  }, [location]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // FİLTRELEME VE SIRALAMA MANTIĞI
  useEffect(() => {
    let result = [...(products as CoffeeProduct[])];

    if (filterOption !== 'all') {
      result = result.filter(p => p.category && p.category.includes(filterOption));
    }

    switch (sortOption) {
      case 'price-asc':
        result.sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
        break;
      case 'price-desc':
        result.sort((a, b) => parsePrice(b.price) - parsePrice(a.price));
        break;
      case 'name-asc':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'name-desc':
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
      default:
        result.sort((a, b) => a.id - b.id); 
        break;
    }

    setDisplayedProducts(result);
  }, [sortOption, filterOption]);

  const SortItem = ({ label, value }: { label: string, value: SortOption }) => (
    <button 
      onClick={() => { setSortOption(value); setIsSortOpen(false); }}
      className={`flex w-full items-center justify-between px-5 py-3 text-left font-mono text-[0.65rem] tracking-[0.1em] uppercase transition-colors hover:bg-[#FAFAFA] ${sortOption === value ? 'text-[#000000] font-bold' : 'text-[#888888]'}`}
    >
      {label}
      {sortOption === value && <Check className="h-3 w-3" strokeWidth={2} />}
    </button>
  );

  const FilterItem = ({ label, value }: { label: string, value: FilterOption }) => (
    <button 
      onClick={() => { setFilterOption(value); setIsFilterOpen(false); }}
      className={`flex w-full items-center justify-between px-5 py-3 text-left font-mono text-[0.65rem] tracking-[0.1em] uppercase transition-colors hover:bg-[#FAFAFA] ${filterOption === value ? 'text-[#000000] font-bold' : 'text-[#888888]'}`}
    >
      {label}
      {filterOption === value && <Check className="h-3 w-3" strokeWidth={2} />}
    </button>
  );

  return (
    <main className="bg-[#FFFFFF] text-[#000000] min-h-screen font-sans selection:bg-[#000000] selection:text-[#FFFFFF]">
      <ShopHero />
      
      <div className="border-b border-[#E5E5E5] bg-[#FAFAFA] sticky top-[90px] z-40">
        <div className="max-w-[1440px] mx-auto px-10 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          
          <div className="font-mono text-[0.65rem] tracking-[0.15em] text-[#555555] uppercase">
            Gösterilen: <span className="text-[#000000] font-bold">{displayedProducts.length}</span> Ürün
          </div>
          
          <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
            
            <div className="relative" ref={sortRef}>
              <button 
                onClick={() => { setIsSortOpen(!isSortOpen); setIsFilterOpen(false); }}
                className={`flex items-center gap-2 px-4 py-2 font-mono text-[0.65rem] tracking-[0.15em] uppercase transition-all border
                  ${isSortOpen ? 'border-[#000000] bg-[#000000] text-[#FFFFFF]' : 'border-[#E5E5E5] bg-[#FFFFFF] text-[#000000] hover:border-[#888888]'}
                `}
              >
                <ArrowDownAZ className="h-3 w-3" />
                Sırala
                <ChevronDown className={`h-3 w-3 transition-transform ${isSortOpen ? 'rotate-180' : ''}`} />
              </button>

              {isSortOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 border border-[#E5E5E5] bg-[#FFFFFF] shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <SortItem label="Varsayılan" value="default" />
                  <SortItem label="Fiyat (Artan)" value="price-asc" />
                  <SortItem label="Fiyat (Azalan)" value="price-desc" />
                  <SortItem label="İsim (A-Z)" value="name-asc" />
                  <SortItem label="İsim (Z-A)" value="name-desc" />
                </div>
              )}
            </div>

            <div className="relative" ref={filterRef}>
              <button 
                onClick={() => { setIsFilterOpen(!isFilterOpen); setIsSortOpen(false); }}
                className={`flex items-center gap-2 px-4 py-2 font-mono text-[0.65rem] tracking-[0.15em] uppercase transition-all border
                  ${isFilterOpen || filterOption !== 'all' ? 'border-[#000000] bg-[#000000] text-[#FFFFFF]' : 'border-[#E5E5E5] bg-[#FFFFFF] text-[#000000] hover:border-[#888888]'}
                `}
              >
                <SlidersHorizontal className="h-3 w-3" />
                {filterOption !== 'all' ? 'Filtreler Aktif' : 'Filtrele'}
                {filterOption !== 'all' && (
                   <X 
                     className="ml-1 h-3 w-3 opacity-70 hover:opacity-100 cursor-pointer" 
                     onClick={(e) => { e.stopPropagation(); setFilterOption('all'); }} 
                   />
                )}
              </button>

              {isFilterOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 border border-[#E5E5E5] bg-[#FFFFFF] shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="px-5 py-3 border-b border-[#E5E5E5] font-mono text-[0.55rem] tracking-[0.2em] text-[#888888] uppercase bg-[#FAFAFA]">
                    Kategoriler
                  </div>
                  <FilterItem label="Tüm Kahveler" value="all" />
                  <FilterItem label="Filtre Kahve" value="filtre" />
                  <FilterItem label="Espresso" value="espresso" />
                  <FilterItem label="Türk Kahvesi" value="turk-kahvesi" />
                  <FilterItem label="Avantajlı Paketler" value="paket" />
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* ÜRÜN GRIDI (Staggered Animasyon) */}
      <div className="max-w-[1440px] mx-auto px-10 pb-32 overflow-hidden" ref={gridReveal.ref}>
        {displayedProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-l border-t border-[#E5E5E5] mt-10">
            {displayedProducts.map((product, idx) => (
              <div 
                key={product.id}
                className={`h-full transition-all duration-[1000ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${gridReveal.visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-16"}`}
                style={{ transitionDelay: `${(idx % 12) * 75}ms` }} // Dalgavari (staggered) yüklenme efekti
              >
                <ProductCard 
                  p={product}
                  onAdd={addToCart}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="py-32 flex flex-col items-center justify-center border border-[#E5E5E5] bg-[#FAFAFA] mt-10">
             <div className="font-mono text-[0.8rem] tracking-[0.15em] text-[#888888] uppercase mb-4">
               Sonuç Bulunamadı
             </div>
             <p className="font-serif text-[1.5rem] text-[#000000] mb-8">Bu kriterlere uygun kahve çekirdeği yok.</p>
             <button 
               onClick={() => { setFilterOption('all'); setSortOption('default'); }}
               className="font-mono text-[0.65rem] tracking-[0.15em] uppercase text-[#FFFFFF] bg-[#000000] border border-[#000000] px-8 py-3 transition-colors hover:bg-[#555555] hover:border-[#555555]"
             >
               Tüm Seçkiyi Göster
             </button>
          </div>
        )}
      </div>
    </main>
  );
};

export default Kahveler;