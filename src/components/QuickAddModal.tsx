// src/components/QuickAddModal.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Minus, Plus } from "lucide-react";
import { useCart } from "../context/CartContext";
import { fetchShopifyProductByHandle, type CoffeeProduct, type ProductVariant } from "../lib/shopify";

const grindOptions = ["ÇEKİRDEK", "ESPRESSO", "FRENCH PRESS", "V60", "CHEMEX", "KAĞIT FİLTRE"];

const QuickAddModal = ({
  handle,
  onClose,
}: {
  handle: string;
  onClose: () => void;
}) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState<CoffeeProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [grind, setGrind] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    fetchShopifyProductByHandle(handle)
      .then((data) => {
        setProduct(data);
        if (data?.variants?.length) setSelectedVariant(data.variants[0]);
      })
      .finally(() => setLoading(false));
  }, [handle]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const handleAdd = () => {
    if (!product) return;
    const isFiltre = product.category.includes("filtre") || product.category.includes("espresso");
    if (isFiltre && !grind) return;
    let name = product.name;
    if (selectedVariant && selectedVariant.weight !== "Default Title") name += ` - ${selectedVariant.weight}`;
    if (isFiltre) name += ` (${grind})`;
    addToCart({
      ...product,
      id: Date.now().toString(),
      variantId: selectedVariant?.id ?? product.variants?.[0]?.id,
      name,
      price: selectedVariant?.price ?? product.price,
      grind: isFiltre ? grind : undefined,
    } as any, quantity);
    setAdded(true);
    setTimeout(() => { setAdded(false); onClose(); }, 1200);
  };

  const isFiltre = product?.category.includes("filtre") || product?.category.includes("espresso");
  const hasVariants = product?.variants?.length && product.variants[0].weight !== "Default Title";
  const displayPrice = selectedVariant?.price ?? product?.price ?? "";
  const displayOldPrice = selectedVariant?.oldPrice ?? product?.oldPrice;

  return (
    <>
      <div className="fixed inset-0 z-[80] bg-[#1b1b1b]/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal — mobilde alttan slide, masaüstünde ortalanmış */}
      <div className="fixed inset-x-0 bottom-0 z-[90] md:inset-0 md:flex md:items-center md:justify-center md:p-2">
        <div className="w-full md:max-w-5xl bg-[#fdfaf6] shadow-2xl animate-in slide-in-from-bottom-4 md:slide-in-from-bottom-0 duration-300 max-h-[95vh] md:h-[96vh] flex flex-col">

          {/* Kapat butonu */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 z-10 text-[#7b6a5c] hover:text-[#1b1b1b] transition-colors bg-[#fdfaf6]/80 p-1"
          >
            <X className="h-5 w-5" />
          </button>

          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <span className="font-mono text-[0.6rem] tracking-[0.2em] text-[#7b6a5c] animate-pulse">YÜKLENİYOR...</span>
            </div>
          ) : product ? (
            <div className="flex flex-col md:flex-row flex-1 overflow-hidden">

              {/* Sol: Görsel */}
              <div className="hidden md:flex w-[48%] shrink-0 bg-[#f0e8dc] items-center justify-center p-12">
                {product.image && (
                  <img src={product.image} alt={product.name} className="h-full w-full object-contain max-h-[680px]" />
                )}
              </div>

              {/* Mobil: küçük görsel + başlık yan yana */}
              <div className="flex md:hidden items-center gap-4 px-5 pt-6 pb-4 border-b border-[#1b1b1b]/10">
                {product.image && (
                  <div className="h-20 w-16 shrink-0 bg-[#f0e8dc] flex items-center justify-center overflow-hidden">
                    <img src={product.image} alt={product.name} className="h-full w-full object-contain" />
                  </div>
                )}
                <div>
                  <p className="font-mono text-[0.52rem] tracking-[0.15em] text-[#7b6a5c] mb-0.5">{product.origin}</p>
                  <h3 className="font-serif text-[1.1rem] leading-tight text-[#1b1b1b]">{product.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-mono text-[0.9rem] font-semibold text-[#1b1b1b]">{displayPrice}</span>
                    {displayOldPrice && <span className="font-mono text-[0.72rem] text-[#9b9288] line-through">{displayOldPrice}</span>}
                  </div>
                </div>
              </div>

              {/* Sağ: İçerik */}
              <div className="flex flex-col flex-1 overflow-y-auto p-6 md:p-10 gap-6">

                {/* Masaüstü başlık */}
                <div className="hidden md:block">
                  <p className="font-mono text-[0.55rem] tracking-[0.15em] text-[#7b6a5c] mb-1">{product.origin}</p>
                  <h3 className="font-serif text-[1.6rem] leading-tight text-[#1b1b1b] mb-3">{product.name}</h3>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[1.2rem] font-semibold text-[#1b1b1b]">{displayPrice}</span>
                    {displayOldPrice && <span className="font-mono text-[0.9rem] text-[#9b9288] line-through">{displayOldPrice}</span>}
                  </div>
                </div>

                {/* Kısa açıklama */}
                {product.description && (
                  <p className="font-sans font-light text-[0.85rem] text-[#5c4635] leading-relaxed">{product.description}</p>
                )}

            {/* Varyant seçimi */}
            {hasVariants && (
              <div>
                <span className="font-mono text-[0.58rem] tracking-[0.15em] text-[#7b6a5c] block mb-2">GRAMAJ</span>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariant(v)}
                      className={`px-4 py-2 border font-mono text-[0.6rem] tracking-[0.12em] uppercase transition-colors ${
                        selectedVariant?.id === v.id
                          ? "border-[#1b1b1b] bg-[#1b1b1b] text-[#fdfaf6]"
                          : "border-[#1b1b1b]/20 text-[#5c4635] hover:border-[#1b1b1b]"
                      }`}
                    >
                      {v.weight}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Öğütme seçimi */}
            {isFiltre && (
              <div>
                <span className="font-mono text-[0.58rem] tracking-[0.15em] text-[#7b6a5c] block mb-2">ÖĞÜTME *</span>
                <div className="flex flex-wrap gap-2">
                  {grindOptions.map((g) => (
                    <button
                      key={g}
                      onClick={() => setGrind(g)}
                      className={`px-4 py-2 border font-mono text-[0.6rem] tracking-[0.12em] uppercase transition-colors ${
                        grind === g
                          ? "border-[#1b1b1b] bg-[#1b1b1b] text-[#fdfaf6]"
                          : "border-[#1b1b1b]/20 text-[#5c4635] hover:border-[#1b1b1b]"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Adet + Sepete Ekle */}
            <div className="flex gap-3 mt-1">
              <div className="flex items-center border border-[#1b1b1b]/20 h-12">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="px-3 h-full text-[#5c4635] hover:bg-[#f0e8dc] transition-colors border-r border-[#1b1b1b]/20">
                  <Minus className="h-3 w-3" />
                </button>
                <span className="px-4 font-mono text-[0.75rem] text-[#1b1b1b]">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="px-3 h-full text-[#5c4635] hover:bg-[#f0e8dc] transition-colors border-l border-[#1b1b1b]/20">
                  <Plus className="h-3 w-3" />
                </button>
              </div>
              <button
                onClick={handleAdd}
                disabled={isFiltre && !grind}
                className={`flex-1 h-12 font-mono text-[0.62rem] tracking-[0.15em] transition-colors border ${
                  added
                    ? "border-[#1b1b1b] bg-[#1b1b1b] text-[#fdfaf6]"
                    : isFiltre && !grind
                    ? "border-[#1b1b1b]/10 bg-[#1b1b1b]/10 text-[#7b6a5c] cursor-not-allowed"
                    : "border-[#c17a3a] bg-[#c17a3a] text-[#fdfaf6] hover:bg-[#a0612a] hover:border-[#a0612a]"
                }`}
              >
                {added ? "✓ EKLENDİ" : isFiltre && !grind ? "LÜTFEN ÖĞÜTME TÜRÜNÜZÜ SEÇİN" : "SEPETE EKLE"}
              </button>
            </div>

                {/* Ürüne git */}
                <button
                  onClick={() => { onClose(); navigate(`/urun/${product.handle}`); }}
                  className="text-center font-mono text-[0.58rem] tracking-[0.15em] text-[#7b6a5c] hover:text-[#1b1b1b] transition-colors border-b border-[#7b6a5c]/30 pb-0.5 self-center"
                >
                  ÜRÜN DETAYINA GİT →
                </button>

              </div>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
};

export default QuickAddModal;
