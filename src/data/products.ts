// src/data/products.ts

export interface ProductVariant {
  weight: string;
  price: string;
  oldPrice?: string;
}

export interface CoffeeProduct {
  id: number;
  code: string;
  name: string;
  category: ('turk-kahvesi' | 'filtre' | 'espresso' | 'paket')[];
  origin: string;
  process: string;
  roast: string;
  notes: string[];
  price: string; // Gösterim için varsayılan (en düşük gramajlı) fiyat
  oldPrice?: string;
  badge: string | null;
  showOnHome: boolean;
  image?: string;
  description: string;
  brewingGuide: string;
  variants: ProductVariant[]; // Gramaj seçenekleri
}

export const products: CoffeeProduct[] = [
  // ─── TÜRK KAHVESİ ─────────────────────────────────────────────────────────────
  { 
    id: 1, 
    code: "TRK-HSR", 
    name: "Hisaraltı® Türk Kahvesi", 
    category: ["turk-kahvesi"],
    origin: "BREZİLYA RIO MINAS", 
    process: "Doğal", 
    roast: "Orta", 
    notes: ["Kavrulmuş Fındık", "Kakao", "Karamel"], 
    price: "₺180", 
    oldPrice: "₺220",
    badge: "ÇOK SATAN",
    showOnHome: true,
    description: "Geleneksel Türk kahvesi ritüelini en nitelikli haliyle sunmak için geliştirdiğimiz Hisaraltı® harmanımız, Brezilya'nın seçkin Rio Minas bölgelerinden elde edilen çekirdeklerle hazırlanır. Fincanda yoğun köpük, damakta ise kalıcı bir fındık ve kakao aroması bırakır.",
    brewingGuide: "Her fincan (yaklaşık 70ml su) için 7-8 gram ince çekilmiş Hisaraltı kahvesi kullanın. Soğuk içme suyu ile cezvede yavaş yavaş, kahveyi yakmadan demleyerek bol köpüklü bir sonuç elde edebilirsiniz.",
    variants: [
      { weight: "250 gr", price: "₺180", oldPrice: "₺220" },
      { weight: "1000 gr", price: "₺650", oldPrice: "₺780" }
    ]
  },

  // ─── FİLTRE KAHVE ─────────────────────────────────────────────────────────────
  { 
    id: 2, 
    code: "FLT-EDT", 
    name: "Edition - Özel Filtre Harman", 
    category: ["filtre"],
    origin: "ÖZEL HARMAN", 
    process: "Yıkamalı", 
    roast: "Açık-Orta", 
    notes: ["Çikolata", "Karamel", "Narenciye"], 
    price: "₺320", 
    oldPrice: "₺390",
    badge: null,
    showOnHome: true,
    description: "Ankara'daki atölyemizde özenle profillendirilen bu imza filtre harmanımız, Güney Amerika ve Afrika çekirdeklerinin mükemmel dengesinden doğar. Güne başlarken canlı bir asidite ve tatlı, çikolatamsı bir bitiş arayanlar için idealdir.",
    brewingGuide: "V60 ve Chemex gibi pour-over yöntemlerinde 1:15 (1 gram kahveye 15 ml su) oranını kullanmanızı, su sıcaklığının 93°C civarında olmasına dikkat etmenizi öneririz. French Press için daha kalın öğütüm tercih ediniz.",
    variants: [
      { weight: "250 gr", price: "₺320", oldPrice: "₺390" },
      { weight: "1000 gr", price: "₺1100", oldPrice: "₺1350" }
    ]
  },

  // ─── ESPRESSO HARMANLARI ──────────────────────────────────────────────────────
  { 
    id: 3, 
    code: "ESP-PRS", 
    name: "Prestige Espresso - Özel Harman", 
    category: ["espresso"],
    origin: "ÖZEL HARMAN", 
    process: "Yıkamalı & Doğal", 
    roast: "Orta", 
    notes: ["Karamel", "Sütlü Çikolata", "Tatlı Baharat"], 
    price: "₺350", 
    oldPrice: "₺420",
    badge: "PREMIUM",
    showOnHome: true,
    description: "Prestige Espresso, sütlü içeceklerle (Latte, Cappuccino) olağanüstü bir uyum yakalamak üzere özel olarak geliştirilmiştir. Damakta yumuşak, karamelize tatlar ve sütlü çikolata notaları bırakan gövdeli bir harmandır.",
    brewingGuide: "18 gram kahve ile 36-40 ml çıktı (1:2 oran) hedefleyerek 25-28 saniye aralığında bir ekstraksiyon ile espresso'nun en tatlı notalarını yakalayabilirsiniz.",
    variants: [
      { weight: "250 gr", price: "₺350", oldPrice: "₺420" },
      { weight: "1000 gr", price: "₺1200", oldPrice: "₺1450" }
    ]
  },
  { 
    id: 4, 
    code: "ESP-PLT", 
    name: "Platinum Espresso - Özel Harman", 
    category: ["espresso"],
    origin: "ÖZEL HARMAN", 
    process: "Yıkamalı", 
    roast: "Açık-Orta", 
    notes: ["Meyvemsi", "Çiçeksi", "Parlak Asidite"], 
    price: "₺380", 
    oldPrice: "₺460",
    badge: "ÖZEL",
    showOnHome: true,
    description: "Yeni nesil espresso deneyimini arayanlar için oluşturduğumuz Platinum harman, parlak asiditesi, çiçeksi kokuları ve meyvemsi tat profiliyle öne çıkar. Single malt viski kalitesinde, kompleks bir espresso sunar.",
    brewingGuide: "Parlak asiditeyi dengelemek adına 94°C su sıcaklığı ve 1:2.2 ile 1:2.5 arası bir demleme oranı (18g kahve - 40/45g çıktı) tavsiye ederiz.",
    variants: [
      { weight: "250 gr", price: "₺380", oldPrice: "₺460" },
      { weight: "1000 gr", price: "₺1300", oldPrice: "₺1550" }
    ]
  },
  { 
    id: 5, 
    code: "ESP-ULT", 
    name: "Ultragold Espresso - Özel Harman", 
    category: ["espresso"],
    origin: "ÖZEL HARMAN", 
    process: "Karışık", 
    roast: "Orta-Koyu", 
    notes: ["Yoğun Çikolata", "Kavrulmuş Fındık", "Krema"], 
    price: "₺300", 
    oldPrice: "₺360",
    badge: null,
    showOnHome: false,
    description: "Klasik İtalyan espresso kültüründen ilham alan Ultragold, düşük asiditesi, yüksek gövdesi ve fincanda yarattığı kaplan desenli kremasıyla güne güçlü bir başlangıç yapmak isteyenler içindir.",
    brewingGuide: "Klasik 1:2 oranı ile 92°C sıcaklıkta demlenmesi, harmanın doğal acılığını engelleyip çikolata notalarını ön plana çıkaracaktır.",
    variants: [
      { weight: "250 gr", price: "₺300", oldPrice: "₺360" },
      { weight: "1000 gr", price: "₺1000", oldPrice: "₺1200" }
    ]
  },

  // ─── AVANTAJLI PAKETLER ───────────────────────────────────────────────────────
  { 
    id: 6, 
    code: "FLT-PKT-3X250", 
    name: "Edition - Özel Filtre Harman Paketi", 
    category: ["filtre", "paket"],
    origin: "ÖZEL HARMAN", 
    process: "Yıkamalı & Doğal", 
    roast: "Açık-Orta", 
    notes: ["Çikolata", "Karamel", "Hafif Meyve"], 
    price: "₺850",
    oldPrice: "₺1050", 
    badge: "AVANTAJLI",
    showOnHome: true,
    description: "En sevilen filtre kahve harmanımızı stoklamak veya sevdikleriyle paylaşmak isteyenler için hazırladığımız 3 adet 250 gramlık paket. Taze kavrulmuş çekirdekler valfli ambalajlarıyla uzun süre tazeliğini korur.",
    brewingGuide: "Filtre kahve makineleri ve manuel demleme ekipmanlarına (V60, Chemex) tam uyumludur. Dilediğiniz öğütme derecesini seçerek sipariş verebilirsiniz.",
    variants: [
      { weight: "3x250 gr Paket", price: "₺850", oldPrice: "₺1050" }
    ]
  },
  { 
    id: 7, 
    code: "ESP-PKT-8KG", 
    name: "Ultragold Espresso - Kurumsal Paket", 
    category: ["espresso", "paket"],
    origin: "ÖZEL HARMAN", 
    process: "Karışık", 
    roast: "Orta-Koyu", 
    notes: ["Yoğun Çikolata", "Kavrulmuş Fındık", "Krema"], 
    price: "₺7500", 
    oldPrice: "₺9000",
    badge: "TOPTAN",
    showOnHome: true,
    description: "İşletmeler ve yüksek kahve tüketimi olan ofisler için ideal toptan alım paketi. Ultragold espresso harmanımız 8 kg'lık taze teslimat avantajıyla sunulmaktadır.",
    brewingGuide: "Endüstriyel espresso makineleriyle tam uyumludur. Yüksek sirkülasyonlu bar operasyonlarında tutarlı ve güçlü bir lezzet verir.",
    variants: [
      { weight: "1x8 KG Kutu", price: "₺7500", oldPrice: "₺9000" }
    ]
  },
  { 
    id: 8, 
    code: "PKT-ULT-FLT", 
    name: "Ultragold - 250gr Filtre Hediyeli Paket", 
    category: ["paket"],
    origin: "KARMA", 
    process: "Karışık", 
    roast: "Orta & Orta-Koyu", 
    notes: ["Espresso & Filtre", "Özel Seçki", "Hediye"], 
    price: "₺1200", 
    oldPrice: "₺1500",
    badge: "HEDİYELİK",
    showOnHome: true,
    description: "Hem sert gövdeli bir espresso arayanlar hem de yanında yumuşak içimli bir filtre kahve deneyimlemek isteyenler için tasarlanmış özel kampanya paketimiz.",
    brewingGuide: "Paket içerisindeki ürünler kendi kategorilerine ait demleme profilleriyle (Espresso makinesi ve Filtre ekipmanları) demlenmelidir.",
    variants: [
      { weight: "Özel Set", price: "₺1200", oldPrice: "₺1500" }
    ]
  }
];