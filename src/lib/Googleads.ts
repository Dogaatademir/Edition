// src/lib/googleAds.ts

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

const ADS_ID               = import.meta.env.VITE_GADS_ID               as string;
const PURCHASE_LABEL       = import.meta.env.VITE_GADS_PURCHASE_LABEL   as string;
const BEGIN_CHECKOUT_LABEL = import.meta.env.VITE_GADS_BEGIN_CHECKOUT_LABEL as string | undefined;
const ADD_TO_CART_LABEL    = import.meta.env.VITE_GADS_ADD_TO_CART_LABEL    as string | undefined;

function gtag(...args: unknown[]) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag(...args);
  }
}

// 1. Satın Alma — Shopify custom pixel'dan değil, buradan da çağrılabilir (fallback)
export function gAdsPurchase(params: {
  orderId: string;
  total: number;
  currency?: string;
}) {
  gtag('event', 'conversion', {
    send_to:        `${ADS_ID}/${PURCHASE_LABEL}`,
    value:          params.total,
    currency:       params.currency ?? 'TRY',
    transaction_id: params.orderId,
  });
}

// 2. Ödemeye Geç — Odeme.tsx → handleCheckoutRedirect
export function gAdsBeginCheckout(params: {
  total: number;
  itemCount: number;
  currency?: string;
}) {
  gtag('event', 'begin_checkout', {
    currency: params.currency ?? 'TRY',
    value:    params.total,
    items: [{ quantity: params.itemCount }],
  });

  if (BEGIN_CHECKOUT_LABEL) {
    gtag('event', 'conversion', {
      send_to:  `${ADS_ID}/${BEGIN_CHECKOUT_LABEL}`,
      value:    params.total,
      currency: params.currency ?? 'TRY',
    });
  }
}

// 3. Sepete Ekle — CartContext → addToCart
export function gAdsAddToCart(params: {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  currency?: string;
}) {
  gtag('event', 'add_to_cart', {
    currency: params.currency ?? 'TRY',
    value:    params.price * params.quantity,
    items: [{
      item_id:   params.productId,
      item_name: params.productName,
      price:     params.price,
      quantity:  params.quantity,
    }],
  });

  if (ADD_TO_CART_LABEL) {
    gtag('event', 'conversion', {
      send_to:  `${ADS_ID}/${ADD_TO_CART_LABEL}`,
      value:    params.price * params.quantity,
      currency: params.currency ?? 'TRY',
    });
  }
}

// 4. Ürün Görüntüleme — Remarketing
export function gAdsViewItem(params: {
  productId: string;
  productName: string;
  price: number;
  currency?: string;
}) {
  gtag('event', 'view_item', {
    currency: params.currency ?? 'TRY',
    value:    params.price,
    items: [{
      item_id:   params.productId,
      item_name: params.productName,
      price:     params.price,
      quantity:  1,
    }],
  });
}

// 5. SPA route değişimlerinde sayfa görüntüleme
export function gAdsPageView(pathname: string) {
  gtag('event', 'page_view', { page_path: pathname });
}