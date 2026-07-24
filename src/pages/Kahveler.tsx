// src/pages/Kahveler.tsx
import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { SlidersHorizontal, ArrowDownAZ, Check, ChevronDown, X } from 'lucide-react';
import { fetchShopifyProducts, type CoffeeProduct } from '../lib/shopify';
import QuickAddModal from '../components/QuickAddModal';

type SortOption   = 'default' | 'price-asc' | 'price-desc' | 'name-asc' | 'name-desc';
type FilterOption = 'all' | 'turk-kahvesi' | 'filtre' | 'espresso' | 'paket';

const parsePrice = (priceStr: string): number => {
  if (!priceStr) return 999999;
  return parseFloat(priceStr.replace(/[^\d,.-]/g, '').replace(',', '.'));
};

// ─── SKELETON ─────────────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="flex flex-col gap-3 animate-pulse">
    <div className="aspect-[4/5] w-full bg-[#e8e0d6]" />
    <div className="h-4 bg-[#e8e0d6] rounded w-3/4" />
    <div className="h-3 bg-[#e8e0d6] rounded w-1/3" />
  </div>
);

// ─── ÜRÜN KARTI ───────────────────────────────────────────────────────────────
const ProductCard = ({ p, onQuickAdd }: { p: CoffeeProduct; onQuickAdd: (p: CoffeeProduct) => void }) => {
  const navigate = useNavigate();
  const [hovered, setHovered] = useState(false);
  const secondImage = p.images && p.images.length > 1 ? p.images[1] : null;

  const getDiscountPercent = () => {
    if (!p.oldPrice) return null;
    try {
      const clean = (s: string) => parseFloat(s.replace(/\./g, '').replace(/,/g, '.').replace(/[^\d.]/g, ''));
      const oldVal = clean(p.oldPrice);
      const curVal = clean(p.price);
      if (!isNaN(oldVal) && !isNaN(curVal) && oldVal > curVal && curVal > 0)
        return Math.round(((oldVal - curVal) / oldVal) * 100);
    } catch {}
    return null;
  };
  const discount = getDiscountPercent();

  return (
    <article
      onClick={() => navigate(`/urun/${p.handle}`)}
      className="group flex w-full cursor-pointer flex-col gap-3"
    >
      <div
        className="relative flex aspect-[4/5] w-full items-center justify-center overflow-hidden bg-[#f7f0e7]"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onTouchStart={() => setHovered(true)}
        onTouchEnd={() => setHovered(false)}
      >
        {/* badge & indirim */}
        <div className="absolute left-0 top-0 z-10 flex w-full items-start justify-between p-3">
          {p.badge ? (
            <span className="bg-[#1b1b1b] px-2.5 py-1 font-mono text-[0.52rem] uppercase tracking-[0.16em] text-[#f7f0e7]">
              {p.badge}
            </span>
          ) : <span />}
          {discount && (
            <span className="border border-[#8b2f22] bg-[#f7f0e7] px-2 py-1 font-mono text-[0.55rem] font-bold uppercase tracking-[0.14em] text-[#8b2f22]">
              -%{discount}
            </span>
          )}
        </div>

        {/* görseller */}
        {p.image ? (
          <>
            <img
              src={p.image}
              alt={p.name}
              className={`h-full w-full scale-150 object-contain transition-all duration-500 ease-out group-hover:scale-[1.55] ${secondImage ? (hovered ? 'opacity-0' : 'opacity-100') : ''}`}
              loading="lazy"
            />
            {secondImage && (
              <img
                src={secondImage}
                alt={p.name}
                className={`absolute inset-0 h-full w-full scale-150 object-contain transition-all duration-500 ease-out group-hover:scale-[1.55] ${hovered ? 'opacity-100' : 'opacity-0'}`}
                loading="lazy"
              />
            )}
          </>
        ) : (
          <svg width="64" height="64" viewBox="0 0 80 80" fill="none" className="opacity-20">
            <ellipse cx="40" cy="40" rx="28" ry="36" stroke="#1b1b1b" strokeWidth="1.5" />
            <path d="M40 10 Q55 25 55 40 Q55 55 40 70" stroke="#1b1b1b" strokeWidth="1.5" strokeDasharray="3 3" />
          </svg>
        )}

        {/* sepete ekle */}
        <button
          onClick={(e) => { e.stopPropagation(); e.preventDefault(); onQuickAdd(p); }}
          className="absolute inset-x-4 bottom-4 translate-y-3 border border-[#1b1b1b] bg-[#f7f0e7] px-5 py-3 font-mono text-[0.6rem] uppercase tracking-[0.16em] text-[#1b1b1b] opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 hover:bg-[#1b1b1b] hover:text-[#f7f0e7]"
        >
          + Sepete Ekle
        </button>
      </div>

      <div>
        <h3 className="font-sans text-[0.9rem] font-medium leading-snug text-[#1b1b1b] transition-colors group-hover:text-[#C17A3A]">
          {p.name}
        </h3>
        <div className="mt-1 flex items-center gap-2">
          <span className={`font-mono text-[0.82rem] font-semibold ${p.oldPrice ? 'text-[#8b2f22]' : 'text-[#1b1b1b]'}`}>
            {p.price}
          </span>
          {p.oldPrice && (
            <span className="font-mono text-[0.7rem] text-[#9b9288] line-through">{p.oldPrice}</span>
          )}
        </div>
      </div>
    </article>
  );
};


// ─── ANA BİLEŞEN ──────────────────────────────────────────────────────────────
const Kahveler = () => {
  const [allProducts, setAllProducts]           = useState<CoffeeProduct[]>([]);
  const [displayedProducts, setDisplayedProducts] = useState<CoffeeProduct[]>([]);
  const [loading, setLoading]                   = useState(true);
  const [sortOption, setSortOption]             = useState<SortOption>('default');
  const [filterOption, setFilterOption]         = useState<FilterOption>('all');
  const [isSortOpen, setIsSortOpen]             = useState(false);
  const [isFilterOpen, setIsFilterOpen]         = useState(false);
  const [currentPage, setCurrentPage]           = useState(1);
  const [isMobile, setIsMobile]                 = useState(false);
  const [quickAddHandle, setQuickAddHandle]     = useState<string | null>(null);

  const sortRef   = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const gridRef   = useRef<HTMLDivElement>(null);
  const [gridVisible, setGridVisible] = useState(false);

  const PAGE_SIZE = isMobile ? 6 : 8;
  const location = useLocation();

  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setGridVisible(true); }, { threshold: 0.03 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [loading]);

  useEffect(() => {
    setLoading(true);
    fetchShopifyProducts()
      .then(data => { setAllProducts(data); setDisplayedProducts(data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const cat = params.get('kategori');
    if (cat && ['turk-kahvesi', 'filtre', 'espresso', 'paket'].includes(cat))
      setFilterOption(cat as FilterOption);
  }, [location]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setIsSortOpen(false);
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setIsFilterOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    let result = [...allProducts];
    if (filterOption !== 'all') result = result.filter(p => p.category?.includes(filterOption));
    switch (sortOption) {
      case 'price-asc':  result.sort((a, b) => parsePrice(a.price) - parsePrice(b.price)); break;
      case 'price-desc': result.sort((a, b) => parsePrice(b.price) - parsePrice(a.price)); break;
      case 'name-asc':   result.sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'name-desc':  result.sort((a, b) => b.name.localeCompare(a.name)); break;
    }
    setDisplayedProducts(result);
    setCurrentPage(1);
  }, [sortOption, filterOption, allProducts]);

  const dropdownBase = "absolute right-0 top-full mt-2 w-52 bg-[#fdfaf6] border border-[#1b1b1b]/10 shadow-xl z-50 animate-in fade-in slide-in-from-top-2 duration-200";
  const btnBase = "flex items-center gap-2 px-4 py-2.5 font-mono text-[0.6rem] tracking-[0.15em] uppercase transition-all border";

  const SortItem  = ({ label, value }: { label: string; value: SortOption }) => (
    <button onClick={() => { setSortOption(value); setIsSortOpen(false); }}
      className={`flex w-full items-center justify-between px-5 py-3 font-mono text-[0.6rem] tracking-[0.1em] uppercase transition-colors hover:bg-[#f0e8dc] ${sortOption === value ? 'text-[#1b1b1b] font-bold' : 'text-[#7b6a5c]'}`}>
      {label} {sortOption === value && <Check className="h-3 w-3" strokeWidth={2} />}
    </button>
  );
  const FilterItem = ({ label, value }: { label: string; value: FilterOption }) => (
    <button onClick={() => { setFilterOption(value); setIsFilterOpen(false); }}
      className={`flex w-full items-center justify-between px-5 py-3 font-mono text-[0.6rem] tracking-[0.1em] uppercase transition-colors hover:bg-[#f0e8dc] ${filterOption === value ? 'text-[#1b1b1b] font-bold' : 'text-[#7b6a5c]'}`}>
      {label} {filterOption === value && <Check className="h-3 w-3" strokeWidth={2} />}
    </button>
  );

  return (
    <main className="bg-[#f7f0e7] text-[#1b1b1b] min-h-screen font-sans selection:bg-[#1b1b1b] selection:text-[#f7f0e7]">
      <div className="border-b border-[#1b1b1b]/10 px-5 md:px-10 py-8 md:py-10">
        <div className="mx-auto max-w-[1440px]">
          <h1 className="font-serif text-[clamp(1.8rem,3vw,3rem)] leading-[1.1] tracking-[-0.02em] text-[#1b1b1b]">
            Kahvelerimiz
          </h1>
        </div>
      </div>

      {/* ── TOOLBAR ── */}
      <div className="sticky top-[90px] z-40 border-b border-[#1b1b1b]/10 bg-[#f7f0e7]/95 backdrop-blur-sm">
        <div className="mx-auto max-w-[1440px] px-5 md:px-10 py-3 flex items-center justify-between gap-4">

          <span className="font-mono text-[0.58rem] tracking-[0.15em] uppercase text-[#1b1b1b]/50">
            <span className="text-[#1b1b1b] font-semibold">{loading ? '—' : displayedProducts.length}</span> ürün
          </span>

          <div className="flex items-center gap-3">
            {/* Sırala */}
            <div className="relative" ref={sortRef}>
              <button
                onClick={() => { setIsSortOpen(!isSortOpen); setIsFilterOpen(false); }}
                className={`${btnBase} ${isSortOpen ? 'border-[#1b1b1b] bg-[#1b1b1b] text-[#f7f0e7]' : 'border-[#1b1b1b]/20 bg-transparent text-[#1b1b1b] hover:border-[#1b1b1b]'}`}
              >
                <ArrowDownAZ className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sırala</span>
                <ChevronDown className={`h-3 w-3 transition-transform ${isSortOpen ? 'rotate-180' : ''}`} />
              </button>
              {isSortOpen && (
                <div className={dropdownBase}>
                  <SortItem label="Varsayılan"     value="default"    />
                  <SortItem label="Fiyat (Artan)"  value="price-asc"  />
                  <SortItem label="Fiyat (Azalan)" value="price-desc" />
                  <SortItem label="İsim (A-Z)"     value="name-asc"   />
                  <SortItem label="İsim (Z-A)"     value="name-desc"  />
                </div>
              )}
            </div>

            {/* Filtrele */}
            <div className="relative" ref={filterRef}>
              <button
                onClick={() => { setIsFilterOpen(!isFilterOpen); setIsSortOpen(false); }}
                className={`${btnBase} ${isFilterOpen || filterOption !== 'all' ? 'border-[#1b1b1b] bg-[#1b1b1b] text-[#f7f0e7]' : 'border-[#1b1b1b]/20 bg-transparent text-[#1b1b1b] hover:border-[#1b1b1b]'}`}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{filterOption !== 'all' ? 'Filtre Aktif' : 'Filtrele'}</span>
                {filterOption !== 'all' && (
                  <X className="h-3 w-3 opacity-70 hover:opacity-100"
                    onClick={(e) => { e.stopPropagation(); setFilterOption('all'); }} />
                )}
              </button>
              {isFilterOpen && (
                <div className={dropdownBase}>
                  <div className="border-b border-[#1b1b1b]/10 px-5 py-2.5 font-mono text-[0.52rem] tracking-[0.2em] uppercase text-[#7b6a5c] bg-[#f0e8dc]">
                    Kategoriler
                  </div>
                  <FilterItem label="Tüm Kahveler"       value="all"          />
                  <FilterItem label="Türk Kahvesi"        value="turk-kahvesi" />
                  <FilterItem label="Filtre Kahve"        value="filtre"       />
                  <FilterItem label="Espresso"            value="espresso"     />
                  <FilterItem label="Avantajlı Paketler"  value="paket"        />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── ÜRÜN GRİDİ ── */}
      <div className="mx-auto max-w-[1440px] px-5 md:px-10 py-10 md:py-16" ref={gridRef}>
        {loading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6 xl:gap-8">
            {Array.from({ length: PAGE_SIZE }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : displayedProducts.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6 xl:gap-8">
              {displayedProducts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE).map((product, idx) => (
                <div
                  key={product.id}
                  className={`transition-all duration-700 ease-out ${gridVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                  style={{ transitionDelay: `${(idx % PAGE_SIZE) * 60}ms` }}
                >
                  <ProductCard p={product} onQuickAdd={(prod) => setQuickAddHandle(prod.handle)} />
                </div>
              ))}
            </div>

            {/* Sayfalama */}
            {Math.ceil(displayedProducts.length / PAGE_SIZE) > 1 && (
              <div className="mt-16 flex items-center justify-center gap-2">
                <button
                  onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  disabled={currentPage === 1}
                  className="flex h-10 w-10 items-center justify-center border border-[#1b1b1b]/20 font-mono text-[0.7rem] text-[#1b1b1b] transition-colors hover:border-[#1b1b1b] disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  ‹
                </button>

                {Array.from({ length: Math.ceil(displayedProducts.length / PAGE_SIZE) }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => { setCurrentPage(page); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                    className={`flex h-10 w-10 items-center justify-center border font-mono text-[0.65rem] transition-colors ${currentPage === page ? 'border-[#1b1b1b] bg-[#1b1b1b] text-[#f7f0e7]' : 'border-[#1b1b1b]/20 text-[#1b1b1b] hover:border-[#1b1b1b]'}`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={() => { setCurrentPage(p => Math.min(Math.ceil(displayedProducts.length / PAGE_SIZE), p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  disabled={currentPage === Math.ceil(displayedProducts.length / PAGE_SIZE)}
                  className="flex h-10 w-10 items-center justify-center border border-[#1b1b1b]/20 font-mono text-[0.7rem] text-[#1b1b1b] transition-colors hover:border-[#1b1b1b] disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  ›
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center border border-dashed border-[#1b1b1b]/20 py-24 text-center">
            <div className="mb-4 font-mono text-[0.7rem] tracking-[0.15em] uppercase text-[#7b6a5c]">Sonuç Bulunamadı</div>
            <p className="mb-8 font-serif text-[1.5rem] text-[#1b1b1b]">Bu kritere uygun kahve yok.</p>
            <button
              onClick={() => { setFilterOption('all'); setSortOption('default'); }}
              className="border border-[#1b1b1b] bg-[#1b1b1b] px-8 py-3 font-mono text-[0.62rem] uppercase tracking-[0.15em] text-[#f7f0e7] transition-colors hover:bg-transparent hover:text-[#1b1b1b]"
            >
              Tüm Seçkiyi Göster
            </button>
          </div>
        )}
      </div>

      {quickAddHandle && (
        <QuickAddModal
          handle={quickAddHandle}
          onClose={() => setQuickAddHandle(null)}
        />
      )}
    </main>
  );
};

export default Kahveler;
