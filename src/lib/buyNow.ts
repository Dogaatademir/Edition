// src/lib/buyNow.ts
// "Hızlı Satın Al": ürünü sitedeki sepete ekler ve sepetin tamamıyla (önceki ürünler + bu ürün)
// doğrudan Shopify ödeme sayfasını açar. Ürün sayfası ve hızlı ekleme penceresi aynı akışı kullanır.
import { createShopifyCart } from './shopify';
import { trackEvent } from '../hooks/useAnalytics';
import { gAdsBeginCheckout } from './Googleads';
import { getSessionId } from './session';

interface BuyNowOptions<T extends { name: string }> {
  item: T;
  quantity: number;
  cartItems: unknown[];
  addToCart: (item: T, quantity: number) => void;
  setIsCartOpen: (open: boolean) => void;
}

/**
 * Başarılı olursa sayfa Shopify ödeme sayfasına geçer (geri dönmez).
 * Hata olursa eklenen geçmiş kaydını geri alır ve hatayı fırlatır.
 *
 * Geri tuşu bu sayfaya dönsün diye geçmiş kaydı tıklama anında eklenir ve ödeme sayfası
 * yeni kayıt açmadan bu kaydın yerine yazılır (location.replace). Safari gibi tarayıcılar,
 * kullanıcı etkileşiminden geç yapılan yönlendirmede bu sayfayı geri geçmişinde atlayabiliyor.
 */
export async function buyNow<T extends { name: string }>({
  item,
  quantity,
  cartItems,
  addToCart,
  setIsCartOpen,
}: BuyNowOptions<T>) {
  window.history.pushState(window.history.state, '', window.location.href);

  try {
    // Sitedeki sepete ekle (çekmece açılmasın; doğrudan ödemeye gidiyoruz)
    addToCart(item, quantity);
    setIsCartOpen(false);

    // Sepetteki mevcut ürünler + bu ürün birlikte ödemeye gider
    const checkoutItems = [...cartItems, { ...item, quantity }];
    const cart = await createShopifyCart(checkoutItems);

    await trackEvent('checkout_start', {
      total: cart.total,
      itemCount: checkoutItems.length,
      discountCode: null,
      source: 'buy_now',
      productTitle: item.name,
    });
    gAdsBeginCheckout({ total: cart.total, itemCount: checkoutItems.length });
    try {
      localStorage.setItem('pendingCheckout', JSON.stringify({
        ts: Date.now(),
        sessionId: getSessionId(),
        total: cart.total,
      }));
    } catch { /* devam et */ }

    window.location.replace(cart.checkoutUrl);
  } catch (err) {
    window.history.back();
    throw err instanceof Error && err.message ? err : new Error('Ödeme sayfası açılamadı. Lütfen tekrar deneyin.');
  }
}
