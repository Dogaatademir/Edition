// Bu indirim yalnızca kargoya uygulanır; ürün ve sipariş tutarına dokunmaz.
// Shopify discount function şablonu iki hedefi birlikte beklediği için boş döner.

/**
 * @returns {{operations: any[]}}
 */
export function cartLinesDiscountsGenerateRun() {
  return { operations: [] };
}
