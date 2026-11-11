// Çalıştırma: npm test   (Node'un yerleşik test aracı, ek paket gerekmez)
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  cartDeliveryOptionsDiscountsGenerateRun,
  FREE_SHIPPING_MESSAGE,
} from './cart_delivery_options_discounts_generate_run.js';
import { cartLinesDiscountsGenerateRun } from './cart_lines_discounts_generate_run.js';

const line = (tagged, variantFlag = null) => ({
  merchandise: {
    metafield: variantFlag === null ? null : { value: variantFlag },
    product: { hasAnyTag: tagged },
  },
});
const group = (id, method = 'SHIPPING') => ({
  id: `gid://shopify/CartDeliveryGroup/${id}`,
  deliveryOptions: [{ deliveryMethodType: method }],
});
const input = ({ lines, groups, classes = ['SHIPPING'] }) => ({
  cart: { lines, deliveryGroups: groups },
  discount: { discountClasses: classes },
});
const freeShippingFor = (...ids) => [
  {
    deliveryDiscountsAdd: {
      candidates: [
        {
          message: FREE_SHIPPING_MESSAGE,
          targets: ids.map((id) => ({ deliveryGroup: { id: `gid://shopify/CartDeliveryGroup/${id}` } })),
          value: { percentage: { value: 100 } },
        },
      ],
      selectionStrategy: 'ALL',
    },
  },
];

test('yalnızca etiketli ürün: kargo ücretsiz', () => {
  const r = cartDeliveryOptionsDiscountsGenerateRun(input({ lines: [line(true)], groups: [group(1)] }));
  assert.deepEqual(r.operations, freeShippingFor(1));
});

test('etiketli + etiketsiz ürün, iki pakete bölünmüş: iki paketin kargosu da ücretsiz', () => {
  const r = cartDeliveryOptionsDiscountsGenerateRun(
    input({ lines: [line(true), line(false)], groups: [group(1), group(2)] }),
  );
  assert.deepEqual(r.operations, freeShippingFor(1, 2));
});

test('etiketli ürün yok: indirim yok', () => {
  const r = cartDeliveryOptionsDiscountsGenerateRun(
    input({ lines: [line(false), line(false)], groups: [group(1)] }),
  );
  assert.deepEqual(r.operations, []);
});

test('indirim SHIPPING sınıfında değilse: indirim yok', () => {
  const r = cartDeliveryOptionsDiscountsGenerateRun(
    input({ lines: [line(true)], groups: [group(1)], classes: ['ORDER'] }),
  );
  assert.deepEqual(r.operations, []);
});

test('mağazadan teslim grubu hedeflenmez', () => {
  const r = cartDeliveryOptionsDiscountsGenerateRun(
    input({ lines: [line(true)], groups: [group(1, 'PICK_UP'), group(2)] }),
  );
  assert.deepEqual(r.operations, freeShippingFor(2));
});

test('teslimat grubu yoksa: indirim yok', () => {
  const r = cartDeliveryOptionsDiscountsGenerateRun(input({ lines: [line(true)], groups: [] }));
  assert.deepEqual(r.operations, []);
});

test('hediye kartı gibi ürün olmayan satırlar hata vermez', () => {
  const r = cartDeliveryOptionsDiscountsGenerateRun(
    input({ lines: [{ merchandise: {} }, line(true)], groups: [group(1)] }),
  );
  assert.deepEqual(r.operations, freeShippingFor(1));
});

test('yalnızca varyant meta alanı açık (1000 gr): kargo ücretsiz', () => {
  const r = cartDeliveryOptionsDiscountsGenerateRun(
    input({ lines: [line(false, 'true'), line(false)], groups: [group(1)] }),
  );
  assert.deepEqual(r.operations, freeShippingFor(1));
});

test('aynı ürünün meta alanı kapalı varyantı (250 gr): indirim yok', () => {
  const r = cartDeliveryOptionsDiscountsGenerateRun(
    input({ lines: [line(false, 'false'), line(false, null)], groups: [group(1)] }),
  );
  assert.deepEqual(r.operations, []);
});

test('ürün/sipariş indirimi üretmez', () => {
  assert.deepEqual(cartLinesDiscountsGenerateRun().operations, []);
});
