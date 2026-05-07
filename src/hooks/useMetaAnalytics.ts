import { useEffect } from 'react';
import { metaViewContent, metaViewCart } from '../lib/metaPixel';

export function useMetaProductView(product: {
  id: string | number;
  title: string;
  price?: number;
} | null) {
  useEffect(() => {
    if (!product) return;
    metaViewContent({
      content_ids:  [String(product.id)],
      content_name: product.title,
      value:        product.price,
    });
  }, [product?.id]);
}
export function useMetaViewCart(cart: {
  itemCount: number;
  total: number;
} | null) {
  useEffect(() => {
    if (!cart) return;
    metaViewCart({
      num_items: cart.itemCount,
      total:     cart.total,
    });
  }, []);
}