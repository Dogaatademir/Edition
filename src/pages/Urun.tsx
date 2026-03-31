import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Minus, 
  Plus, 
  Truck, 
  ShieldCheck, 
  Coffee,
  ChevronDown,
  ChevronUp,
  ArrowLeft
} from 'lucide-react';
import { products, type CoffeeProduct, type ProductVariant } from '../data/products';
import { useCart } from '../context/CartContext';

// --- ÖZEL İKONLAR (ÖĞÜTME DERECELERİ İÇİN MİNİMAL SVG'LER) ---
const grindOptions = [
  {
    id: 'Çekirdek',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22C6.5 22 2 17.5 2 12S6.5 2 12 2s10 4.5 10 10-4.5 10-10 10z"/>
        <path d="M12 22c-2-4-2-16 0-20"/>
      </svg>
    )
  },
  {
    id: 'French Press',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="7" y="6" width="10" height="16" rx="1" />
        <path d="M17 10h2a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2h-2" />
        <line x1="12" y1="2" x2="12" y2="6" />
        <line x1="9" y1="2" x2="15" y2="2" />
      </svg>
    )
  },
  {
    id: 'V60',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 3h16l-5.5 11h-5L4 3z" />
        <path d="M9.5 14v6a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-6" />
      </svg>
    )
  },
  {
    id: 'Chemex',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 3h8l-2.5 8h-3L8 3z" />
        <path d="M9.5 11C7 11 5 13.5 5 17v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2c0-3.5-2-6-4.5-6" />
        <line x1="8" y1="11" x2="16" y2="11" />
      </svg>
    )
  }
];

// --- YARDIMCI BİLEŞENLER ---

const QuantitySelector = ({ quantity, setQuantity }: { quantity: number, setQuantity: (q: number) => void }) => (
  <div className="flex items-center border border-[#E5E5E5] h-12 w-32 bg-[#FFFFFF]">
    <button 
      onClick={() => setQuantity(Math.max(1, quantity - 1))}
      className="flex-1 flex items-center justify-center text-[#000000] hover:bg-[#FAFAFA] transition-colors h-full border-r border-[#E5E5E5]"
    >
      <Minus className="w-4 h-4" />
    </button>
    <span className="flex-1 text-center font-mono font-bold text-[#000000] text-sm">{quantity}</span>
    <button 
      onClick={() => setQuantity(quantity + 1)}
      className="flex-1 flex items-center justify-center text-[#000000] hover:bg-[#FAFAFA] transition-colors h-full border-l border-[#E5E5E5]"
    >
      <Plus className="w-4 h-4" />
    </button>
  </div>
);

const AccordionItem = ({ title, children, isOpen, onClick }: { title: string, children: React.ReactNode, isOpen: boolean, onClick: () => void }) => (
  <div className="border-b border-[#E5E5E5]">
    <button 
      onClick={onClick}
      className="w-full py-5 flex items-center justify-between text-left group bg-[#FFFFFF] hover:bg-[#FAFAFA] transition-colors px-2"
    >
      <span className="font-mono text-[0.65rem] tracking-[0.15em] uppercase text-[#000000]">
        {title}
      </span>
      {isOpen ? <ChevronUp className="w-4 h-4 text-[#000000]" /> : <ChevronDown className="w-4 h-4 text-[#888888]" />}
    </button>
    <div className={`overflow-hidden transition-all duration-300 ease-in-out px-2 ${isOpen ? 'max-h-96 opacity-100 pb-5' : 'max-h-0 opacity-0'}`}>
      <div className="text-[#555555] font-sans font-light leading-relaxed text-[0.9rem]">
        {children}
      </div>
    </div>
  </div>
);

// --- ANA BİLEŞEN ---

const Urun = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  
  const product = products.find(p => p.id === Number(id)) as CoffeeProduct | undefined;

  // Stateler
  const [quantity, setQuantity] = useState(1);
  const [openSection, setOpenSection] = useState<string | null>('desc');
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [grind, setGrind] = useState<string>('Çekirdek');

  // Sayfa Yüklendiğinde
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (product && product.variants.length > 0) {
      setSelectedVariant(product.variants[0]); // Varsayılan olarak ilk gramajı seç
    }
  }, [id, product]);

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FFFFFF] text-[#000000] border-t border-[#E5E5E5]">
        <div className="font-mono text-[0.8rem] tracking-[0.15em] text-[#888888] uppercase mb-4">
          Hata 404
        </div>
        <p className="font-serif text-[2rem] mb-8">Aradığınız seçki bulunamadı.</p>
        <button 
          onClick={() => navigate('/kahveler')} 
          className="font-mono text-[0.65rem] tracking-[0.15em] uppercase text-[#FFFFFF] bg-[#000000] border border-[#000000] px-8 py-3 transition-colors hover:bg-[#555555] hover:border-[#555555]"
        >
          Seçkiye Dön
        </button>
      </div>
    );
  }

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  const handleAddToCart = () => {
    let cartProductName = product.name;
    if (selectedVariant) cartProductName += ` - ${selectedVariant.weight}`;
    if (product.category.includes('filtre')) cartProductName += ` (${grind})`;

    const cartProductObj = {
      ...product,
      id: Date.now(), 
      name: cartProductName,
      price: selectedVariant ? selectedVariant.price : product.price,
    };

    addToCart(cartProductObj, quantity);
  };

  const displayPrice = selectedVariant ? selectedVariant.price : product.price;
  const displayOldPrice = selectedVariant ? selectedVariant.oldPrice : product.oldPrice;
  const isFiltre = product.category.includes('filtre');

  return (
    <main className="bg-[#FFFFFF] min-h-screen pt-28 pb-20 font-sans selection:bg-[#000000] selection:text-[#FFFFFF]">
      <div className="mx-auto max-w-[1440px] px-6 md:px-10">
        
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-3 font-mono text-[0.55rem] tracking-[0.2em] uppercase text-[#888888] mb-8 pb-4 border-b border-[#E5E5E5]">
          <Link to="/kahveler" className="hover:text-[#000000] transition-colors flex items-center gap-1.5">
            <ArrowLeft className="w-3 h-3" /> Tüm Seçki
          </Link>
          <span className="opacity-30">/</span>
          <span className="text-[#000000]">{product.name}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 border border-[#E5E5E5] bg-[#FAFAFA]">
          
          {/* SOL: GÖRSEL ALANI */}
          <div className="relative w-full aspect-square md:aspect-auto md:min-h-[600px] flex items-center justify-center overflow-hidden border-b lg:border-b-0 lg:border-r border-[#E5E5E5] bg-[#FFFFFF] p-12 lg:p-20 group">
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
               <Coffee className="w-96 h-96" />
            </div>

            {product.image ? (
              <img 
                src={product.image} 
                alt={product.name}
                className="h-full w-full object-contain mix-blend-multiply transition-transform duration-1000 group-hover:scale-105 z-10"
              />
            ) : (
              <svg width="120" height="120" viewBox="0 0 80 80" fill="none" className="opacity-20 z-10">
                <ellipse cx="40" cy="40" rx="28" ry="36" stroke="#000000" strokeWidth="1.5" />
                <path d="M40 10 Q55 25 55 40 Q55 55 40 70" stroke="#000000" strokeWidth="1.5" strokeDasharray="3 3" />
                <path d="M40 10 Q25 25 25 40 Q25 55 40 70" stroke="#000000" strokeWidth="1" strokeDasharray="2 4" />
                <ellipse cx="40" cy="40" rx="4" ry="6" stroke="#000000" strokeWidth="1" />
              </svg>
            )}
            
            <div className="absolute top-6 left-6 flex flex-col gap-2 z-20">
               <span className="font-mono text-[0.6rem] tracking-[0.2em] text-[#888888] uppercase">
                 {product.code || 'NO-CODE'}
               </span>
               {product.badge && (
                 <span className="font-mono text-[0.55rem] font-semibold tracking-[0.15em] uppercase text-[#FFFFFF] bg-[#000000] px-3 py-1 self-start">
                   {product.badge}
                 </span>
               )}
            </div>

            <div className="absolute bottom-6 right-6 z-20">
               <span className="font-mono text-[0.55rem] tracking-[0.2em] text-[#555555] uppercase border border-[#E5E5E5] px-3 py-1 bg-[#FFFFFF]">
                 {product.roast || 'Özel Kavrum'}
               </span>
            </div>
          </div>

          {/* SAĞ: BİLGİ ALANI */}
          <div className="flex flex-col p-8 lg:p-14 bg-[#FFFFFF]">
            
            <div className="mb-6">
              <div className="font-mono text-[0.6rem] tracking-[0.2em] uppercase text-[#888888] mb-3 flex items-center gap-2 before:content-[''] before:block before:w-5 before:h-[1px] before:bg-[#888888]">
                {product.origin || 'Bilinmeyen Köken'} · {product.process || 'Bilinmeyen İşlem'}
              </div>

              <h1 className="font-serif text-[clamp(2rem,3.5vw,3.5rem)] text-[#000000] leading-[1.05] tracking-[-0.02em] mb-6">
                {product.name}
              </h1>
              
              <div className="flex items-end gap-4 border-b border-[#E5E5E5] pb-6">
                <span className="font-mono text-[1.5rem] text-[#000000] font-semibold tracking-tight transition-all">
                  {displayPrice}
                </span>
                {displayOldPrice && (
                  <span className="font-mono text-[1rem] text-[#888888] line-through mb-1">
                    {displayOldPrice}
                  </span>
                )}
              </div>
            </div>

            {/* SEÇENEKLER ALANI (GRAMAJ VE ÖĞÜTME) */}
            <div className="mb-8">
              {/* Gramaj Seçici */}
              {product.variants && product.variants.length > 1 && (
                <div className="mb-6">
                  <span className="font-mono text-[0.6rem] tracking-[0.15em] text-[#888888] uppercase block mb-3">Gramaj Seçimi</span>
                  <div className="flex flex-wrap gap-3">
                    {product.variants.map((variant) => (
                      <button
                        key={variant.weight}
                        onClick={() => setSelectedVariant(variant)}
                        className={`px-5 py-2.5 border font-mono text-[0.65rem] tracking-[0.15em] uppercase transition-colors ${
                          selectedVariant?.weight === variant.weight 
                            ? 'border-[#000000] bg-[#000000] text-[#FFFFFF]' 
                            : 'border-[#E5E5E5] bg-[#FFFFFF] text-[#555555] hover:border-[#000000]'
                        }`}
                      >
                        {variant.weight}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Öğütme Seçici (Görsel İkonlu Kartlar) */}
              {isFiltre && (
                <div className="mb-6">
                  <span className="font-mono text-[0.6rem] tracking-[0.15em] text-[#888888] uppercase block mb-3">Öğütme Derecesi</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {grindOptions.map((g) => (
                      <button
                        key={g.id}
                        onClick={() => setGrind(g.id)}
                        className={`flex flex-col items-center justify-center gap-3 p-4 border transition-all duration-300 ${
                          grind === g.id 
                            ? 'border-[#000000] bg-[#000000] text-[#FFFFFF] shadow-sm' 
                            : 'border-[#E5E5E5] bg-[#FFFFFF] text-[#555555] hover:border-[#000000] hover:text-[#000000]'
                        }`}
                      >
                        <div className={`transition-transform duration-300 ${grind === g.id ? 'scale-110' : ''}`}>
                          {g.icon}
                        </div>
                        <span className="font-mono text-[0.55rem] tracking-[0.05em] uppercase text-center">
                          {g.id}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Dinamik Açıklama */}
            <p className="text-[#555555] font-sans font-light text-[0.95rem] leading-[1.85] mb-10">
              {product.description}
            </p>

            {/* Sepet İşlemleri */}
            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <QuantitySelector quantity={quantity} setQuantity={setQuantity} />
              
              <button 
                onClick={handleAddToCart}
                className="flex-1 flex items-center justify-center gap-3 py-4 font-mono text-[0.65rem] font-bold tracking-[0.2em] uppercase transition-colors border border-[#000000] bg-[#000000] text-[#FFFFFF] hover:bg-[#555555] hover:border-[#555555]"
              >
                Sepete Ekle
              </button>
            </div>

            {/* Dinamik Accordion Bölümü */}
            <div className="mb-10 border-t border-[#E5E5E5]">
              <AccordionItem 
                title="Profil Özellikleri" 
                isOpen={openSection === 'desc'} 
                onClick={() => toggleSection('desc')}
              >
                Bu nitelikli harmanımız {product.process} işlem görmüş olup, {product.roast} profilinde kavrulmaktadır.
                {product.notes.length > 0 && ` Fincanınızda ${product.notes.join(', ')} gibi karakteristik notaları ön plana çıkarır.`}
              </AccordionItem>
              
              <AccordionItem 
                title="Demleme Önerisi" 
                isOpen={openSection === 'usage'} 
                onClick={() => toggleSection('usage')}
              >
                {product.brewingGuide}
              </AccordionItem>

              <AccordionItem 
                title="Taze Teslimat" 
                isOpen={openSection === 'delivery'} 
                onClick={() => toggleSection('delivery')}
              >
                Kahvelerimiz siparişiniz üzerine Ankara'daki atölyemizde taze olarak kavrulur ve degassing (gaz salınımı) süreci göz önünde bulundurularak valfli özel ambalajlarında kargoya teslim edilir.
              </AccordionItem>
            </div>

            {/* İkonlu Özellikler */}
            <div className="grid grid-cols-3 gap-6 pt-6 opacity-80">
              <div className="flex flex-col items-start gap-2 border-l-2 border-[#E5E5E5] pl-4">
                <Coffee className="w-5 h-5 text-[#000000]" strokeWidth={1.5} />
                <span className="font-mono text-[0.55rem] uppercase tracking-[0.15em] text-[#555555]">Özel Harman</span>
              </div>
              <div className="flex flex-col items-start gap-2 border-l-2 border-[#E5E5E5] pl-4">
                <Truck className="w-5 h-5 text-[#000000]" strokeWidth={1.5} />
                <span className="font-mono text-[0.55rem] uppercase tracking-[0.15em] text-[#555555]">Taze Teslimat</span>
              </div>
              <div className="flex flex-col items-start gap-2 border-l-2 border-[#E5E5E5] pl-4">
                <ShieldCheck className="w-5 h-5 text-[#000000]" strokeWidth={1.5} />
                <span className="font-mono text-[0.55rem] uppercase tracking-[0.15em] text-[#555555]">Güvenli Ödeme</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
};

export default Urun;