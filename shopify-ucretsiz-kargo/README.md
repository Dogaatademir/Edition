# Ücretsiz Kargo — Shopify İndirim Fonksiyonu

**Kural:** Sepette `ucretsiz-kargo` etiketli **en az bir ürün** varsa, sepete başka ürünler eklense bile siparişin **tüm kargosu ücretsiz** olur.

Sitedeki gösterim ([src/lib/shipping.ts](../src/lib/shipping.ts)) aynı kuralı ve aynı etiketi kullanır. Bu fonksiyon, kuralın Shopify ödeme sayfasında da gerçekten uygulanmasını sağlar.

Aylık ücreti yoktur. Mağazanıza özel, küçük bir Shopify uygulaması olarak kurulur.

> ⚠️ **Plan şartı:** Shopify, Function içeren **özel (custom) uygulamaları yalnızca Shopify Plus** planındaki mağazalarda çalıştırıyor. Mağaza Basic / Shopify / Advanced planındaysa bu fonksiyon canlı mağazada etkinleştirilemez; o durumda App Store'daki bir ücretsiz kargo uygulaması kullanılmalıdır (App Store uygulamaları her planda Function kullanabilir). Planınızı **Ayarlar → Plan** sayfasından kontrol edin.
> Kaynak: https://shopify.dev/docs/apps/build/functions

---

## Bu klasörde ne var

```
shopify-ucretsiz-kargo/
└── extensions/ucretsiz-kargo/          ← Shopify uygulamasına kopyalanacak uzantı
    ├── shopify.extension.toml          Fonksiyon ayarları (handle: ucretsiz-kargo)
    ├── package.json
    └── src/
        ├── index.js
        ├── cart_delivery_options_discounts_generate_run.graphql   Shopify'dan istenen veri
        ├── cart_delivery_options_discounts_generate_run.js        Asıl kural
        ├── cart_lines_discounts_generate_run.graphql
        ├── cart_lines_discounts_generate_run.js                   Boş (ürün indirimi yapmaz)
        └── ucretsiz-kargo.test.js                                 Testler (npm test)
```

---

## Kurulum (bir kerelik, ~20–30 dk)

### Ön koşullar

- Bilgisayarda **Node.js 20+** kurulu olmalı.
- Bir **Shopify Partner** hesabı (ücretsiz): https://partners.shopify.com
- Mağazanın sahibi veya uygulama kurma yetkisi olan bir personel hesabı.

### 1. Boş bir Shopify uygulaması oluşturun

Terminalde, bu proje klasörünün **dışında** bir yerde:

```bash
npm init @shopify/app@latest
```

Sorulara şu cevapları verin:

- Uygulama adı: `edition-ucretsiz-kargo`
- Şablon: **"Build an extension-only app"** (yalnızca uzantı içeren uygulama; sunucu gerekmez)
- Partner hesabınıza giriş yapın ve yeni uygulama oluşturmayı onaylayın

### 2. Bu uzantıyı uygulamaya kopyalayın

```bash
cp -R /Users/dogaatademir/Downloads/Edition-main/shopify-ucretsiz-kargo/extensions/ucretsiz-kargo edition-ucretsiz-kargo/extensions/
```

```bash
cd edition-ucretsiz-kargo && npm install
```

### 3. Shopify şemasını indirip derleyin

```bash
cd extensions/ucretsiz-kargo && npx shopify app function schema && npx shopify app function build
```

Derleme, `.graphql` sorgularını Shopify'ın şemasına göre doğrular. Hata çıkarsa mesajı bana iletin.

İsterseniz testleri de çalıştırın:

```bash
npm test
```

### 4. (Önerilir) Geliştirme mağazasında deneyin

Partner panelinden ücretsiz bir **geliştirme mağazası** oluşturup orada deneyebilirsiniz:

```bash
cd ../.. && npx shopify app dev
```

Uygulamayı geliştirme mağazasına kurun, bir ürüne `ucretsiz-kargo` etiketi verin ve 5. adımdaki gibi indirimi oluşturup ödeme sayfasında kargonun 0 TL olduğunu kontrol edin.

### 5. Yayınlayın ve mağazanıza kurun

```bash
npx shopify app deploy
```

Ardından:

1. **Partner panelinde** → Apps → `edition-ucretsiz-kargo` → **Distribution** → **Custom distribution** seçin.
2. Mağaza adresinizi girin (`xxxx.myshopify.com`). Size bir **kurulum bağlantısı** verilir.
3. Bu bağlantıyı mağaza yöneticisi olarak açıp uygulamayı **kurun**.

### 6. İndirimi oluşturun (Shopify panelinde)

1. **İndirimler → İndirim oluştur**
2. Açılan listede uygulamanın indirimini seçin: **"Ücretsiz kargo (etiketli ürün)"**
3. Yöntem: **Otomatik indirim** (kod gerekmesin)
4. Başlık: örn. `Ücretsiz kargo – kampanya ürünleri`
5. **Birleştirme (Combinations):** Ürün indirimleri ve sipariş indirimleri ile birleşebilsin ✅, diğer kargo indirimleri ile ❌.
6. Başlangıç tarihi: bugün. **Kaydet.**

### 7. Shopify kargo ayarını sadeleştirin

Setin şu an ayrı bir kargo profili var ve bu yüzden sipariş **2 pakete** bölünüyor. Fonksiyon her iki paketin kargosunu da ücretsiz yapar, ama tek paket hem size hem müşteriye daha iyi:

1. **Ayarlar → Kargo ve teslimat** → setin bulunduğu özel profil
2. Seti **genel profile** taşıyın, özel profili silin.

> 6. adımı tamamlamadan 7. adımı yapmayın; yoksa set geçici olarak ücretli kargoya düşer.

### 8. Kontrol edin

Sitede **set + başka bir ürün** (ör. espresso) ile sepete ekleyip Shopify ödeme sayfasına geçin. Beklenen:

- Kargo: **Ücretsiz**
- "2 kargo" yazmıyor (7. adım yapıldıysa)
- Toplam = ürünlerin toplamı

---

## Etiket yönetimi

- Ücretsiz kargo kampanyasına bir ürün eklemek için: ürüne `ucretsiz-kargo` etiketi verin.
- Kampanyadan çıkarmak için: etiketi silin.
- Kod değişikliği veya yeniden yayın gerekmez; site ve Shopify etiketi anında okur.

Etiketin adını değiştirmek isterseniz iki yerde aynı yapılmalı:

1. `extensions/ucretsiz-kargo/src/cart_delivery_options_discounts_generate_run.graphql` → `hasAnyTag(tags: [...])`, ardından `npx shopify app deploy`
2. Sitede `src/lib/shipping.ts` → `FREE_SHIPPING_TAG`

## Bilinmesi gerekenler

- Fonksiyon yalnızca **kargo ile gönderilen** paketlere uygulanır; "mağazadan teslim al" gibi yöntemleri etkilemez.
- Shopify, etkin olan birden fazla kargo indirimi varsa birleştirme ayarlarına göre seçim yapar. Başka bir otomatik ücretsiz kargo indirimi (ör. 850 TL üzeri) **kargo kuralı olarak** tanımlıysa sorun yoktur; **indirim olarak** tanımlıysa birleştirme ayarlarını kontrol edin.
- Sitedeki 850 TL eşiği Shopify'daki kargo ücreti kuralıyla eşleşmelidir.
