// Shopify paneli → İndirimler → İndirim oluştur ekranında görünen ayar alanı.
// Kuralın ayarı yok: yalnızca açıklama gösterir ve indirim türünü "kargo" olarak sabitler.
import "@shopify/ui-extensions/preact";
import {render} from "preact";
import {useEffect, useState} from "preact/hooks";

export default async () => {
  render(<App />, document.body);
};

function App() {
  const {discounts, i18n} = shopify;
  const discountClasses = discounts?.discountClasses?.value ?? [];
  const [error, setError] = useState();

  // İndirim yalnızca kargo sınıfında olmalı (fonksiyon başka sınıfta hiçbir şey yapmaz)
  const isShippingOnly =
    discountClasses.length === 1 && discountClasses[0] === "shipping";

  useEffect(() => {
    if (isShippingOnly || !discounts?.updateDiscountClasses) return;
    discounts.updateDiscountClasses(["shipping"]).then((result) => {
      setError(result && !result.success ? i18n.translate("error") : undefined);
    });
  }, [isShippingOnly]);

  return (
    <s-function-settings
      onSubmit={(event) => {
        event.waitUntil?.(Promise.resolve());
      }}
    >
      <s-heading>{i18n.translate("title")}</s-heading>
      <s-section>
        <s-stack gap="base">
          {error ? <s-banner tone="critical">{error}</s-banner> : null}
          <s-text>{i18n.translate("body")}</s-text>
          <s-text color="subdued">{i18n.translate("howTo")}</s-text>
        </s-stack>
      </s-section>
    </s-function-settings>
  );
}
