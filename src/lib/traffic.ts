// src/lib/traffic.ts
// Ziyaretin nereden geldiğini ve hangi cihazdan yapıldığını kişisel veri tutmadan sınıflandırır.
// Tam referrer URL'si saklanmaz; yalnızca kaynak adı (ör. "instagram") kaydedilir.

export type Device = 'mobil' | 'tablet' | 'masaüstü';

export interface TrafficInfo {
  source: string;          // google, google_ads, instagram, facebook, meta_ads, direkt, ...
  medium: string | null;   // utm_medium varsa
  campaign: string | null; // utm_campaign varsa
  device: Device;
  landing: string;         // ilk açılan sayfanın yolu
}

const BOT_RE = /bot|crawl|spider|slurp|bingpreview|lighthouse|headless|prerender|facebookexternalhit/i;

export function isLikelyBot(): boolean {
  return navigator.webdriver === true || BOT_RE.test(navigator.userAgent);
}

export function getDevice(): Device {
  const ua = navigator.userAgent;
  if (/iPad|Tablet/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'tablet';
  if (/Mobi|Android|iPhone/i.test(ua)) return 'mobil';
  return 'masaüstü';
}

function sourceFromReferrer(referrer: string): string {
  if (!referrer) return 'direkt';
  let host: string;
  try {
    host = new URL(referrer).hostname.replace(/^www\./, '');
  } catch {
    return 'direkt';
  }
  if (host === window.location.hostname.replace(/^www\./, '') || host.endsWith('editioncoffee.com.tr')) return 'direkt';
  if (/(^|\.)google\./.test(host)) return 'google';
  if (/instagram\.com$/.test(host)) return 'instagram';
  if (/(facebook\.com|fb\.com|fb\.me)$/.test(host)) return 'facebook';
  if (/(t\.co|twitter\.com|x\.com)$/.test(host)) return 'x';
  if (/tiktok\.com$/.test(host)) return 'tiktok';
  if (/youtube\.com$|youtu\.be$/.test(host)) return 'youtube';
  if (/whatsapp\.com$|wa\.me$/.test(host)) return 'whatsapp';
  if (/bing\.com$/.test(host)) return 'bing';
  if (/yandex\./.test(host)) return 'yandex';
  if (/shopify|myshopify/.test(host)) return 'direkt'; // Shopify ödemesinden geri dönüş
  return host;
}

/** Sayfanın ilk yüklendiği andaki kaynak bilgisini döndürür. */
export function getTrafficInfo(): TrafficInfo {
  const params = new URLSearchParams(window.location.search);
  const utmSource = params.get('utm_source');
  let source: string;
  if (params.has('gclid') || params.has('gbraid') || params.has('wbraid')) source = 'google_ads';
  else if (utmSource) source = utmSource.toLowerCase();
  else if (params.has('fbclid')) source = 'meta_ads';
  else source = sourceFromReferrer(document.referrer);

  return {
    source,
    medium: params.get('utm_medium'),
    campaign: params.get('utm_campaign'),
    device: getDevice(),
    landing: window.location.pathname,
  };
}

// Sayfa ilk yüklendiğinde yakalanır (SPA içi gezinmede URL parametreleri kaybolabilir).
export const initialTraffic: TrafficInfo | null =
  typeof window !== 'undefined' ? getTrafficInfo() : null;
