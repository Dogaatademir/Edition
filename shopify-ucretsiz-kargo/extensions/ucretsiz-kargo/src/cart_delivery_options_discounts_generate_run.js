// Sepette "ucretsiz-kargo" etiketli bir ürün ya da custom.ucretsiz_kargo meta alanı
// açık bir varyant varsa, kargo ile gönderilen tüm
// teslimat gruplarına %100 kargo indirimi uygular. Böylece sepete başka ürünler eklense
// (ve sipariş birden fazla pakete bölünse) bile müşteri kargo ücreti ödemez.
//
// Değerler, Shopify'ın ürettiği ../generated/api enum'larının karşılığı olan düz
// metinlerdir; bu sayede dosya kod üretimi olmadan da test edilebilir.

const SHIPPING_CLASS = 'SHIPPING'; // DiscountClass.Shipping
const SHIPPING_METHOD = 'SHIPPING'; // DeliveryMethod.Shipping
const SELECT_ALL = 'ALL'; // DeliveryDiscountSelectionStrategy.All

export const FREE_SHIPPING_MESSAGE = 'Ücretsiz kargo';

/**
 * Satır ücretsiz kargolu mu?
 *  - Ürün "ucretsiz-kargo" etiketli (tüm varyantlar), ya da
 *  - Varyantın custom.ucretsiz_kargo meta alanı "true" (yalnızca o varyant)
 */
export function isFreeShippingLine(line) {
  const merchandise = line?.merchandise;
  if (merchandise?.product?.hasAnyTag === true) return true;
  return merchandise?.metafield?.value === 'true';
}

/**
 * @param {any} input  cart_delivery_options_discounts_generate_run.graphql sorgusunun sonucu
 * @returns {{operations: any[]}}
 */
export function cartDeliveryOptionsDiscountsGenerateRun(input) {
  const classes = input?.discount?.discountClasses ?? [];
  if (!classes.includes(SHIPPING_CLASS)) {
    return { operations: [] };
  }

  const lines = input?.cart?.lines ?? [];
  const hasFreeShippingProduct = lines.some(isFreeShippingLine);
  if (!hasFreeShippingProduct) {
    return { operations: [] };
  }

  // Yalnızca kargo ile gönderilen grupları hedefle (mağazadan teslim vb. hariç)
  const targets = (input?.cart?.deliveryGroups ?? [])
    .filter(({ deliveryOptions }) =>
      (deliveryOptions ?? []).some(
        ({ deliveryMethodType }) => deliveryMethodType === SHIPPING_METHOD,
      ),
    )
    .map(({ id }) => ({ deliveryGroup: { id } }));

  if (targets.length === 0) {
    return { operations: [] };
  }

  return {
    operations: [
      {
        deliveryDiscountsAdd: {
          candidates: [
            {
              message: FREE_SHIPPING_MESSAGE,
              targets,
              value: { percentage: { value: 100 } },
            },
          ],
          selectionStrategy: SELECT_ALL,
        },
      },
    ],
  };
}
