// src/lib/consent.ts
// Çerez / izleme onayı yönetimi (KVKK).
// Zorunlu olmayan hiçbir üçüncü taraf etiketi, kullanıcı ilgili kategoriye onay vermeden yüklenmez.
//
//  - analytics  → Microsoft Clarity, site içi (Supabase) ziyaret analitiği
//  - marketing  → Google Ads (gtag), Meta Pixel

import { initPixel, pageView as metaPageView } from './metaPixel';

export type ConsentCategory = 'analytics' | 'marketing';

export interface ConsentState {
  analytics: boolean;
  marketing: boolean;
  updatedAt: string;
  version: number;
}

const STORAGE_KEY = 'cookie-consent-v2';
const LEGACY_KEY = 'cookie-consent'; // eski "Anladım" banner'ı — geçerli bir seçim değildi
const CONSENT_VERSION = 1;
export const OPEN_PREFERENCES_EVENT = 'open-cookie-preferences';

const CLARITY_ID = 'x2a7jpocu8';
const GOOGLE_ADS_ID = 'AW-18193227939';

// Onay verilmeyen kategoriye ait bilinen çerez önekleri silinir
const COOKIE_PREFIXES: Record<ConsentCategory, string[]> = {
  analytics: ['_clck', '_clsk', 'CLID', '_ga', '_gid'],
  marketing: ['_gcl', '_fbp', '_fbc'],
};

// ─── Durum ──────────────────────────────────────────────────────────────────

function readStoredConsent(): ConsentState | null {
  try {
    localStorage.removeItem(LEGACY_KEY);
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConsentState;
    if (parsed.version !== CONSENT_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

let state: ConsentState | null = readStoredConsent();
const listeners = new Set<() => void>();

export function getConsent(): ConsentState | null {
  return state;
}

export function hasConsent(category: ConsentCategory): boolean {
  return state?.[category] === true;
}

export function subscribeConsent(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function openConsentPreferences() {
  window.dispatchEvent(new Event(OPEN_PREFERENCES_EVENT));
}

export function setConsent(choice: { analytics: boolean; marketing: boolean }) {
  const previous = state;
  state = {
    analytics: choice.analytics,
    marketing: choice.marketing,
    updatedAt: new Date().toISOString(),
    version: CONSENT_VERSION,
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Depolama kapalıysa seçim yalnızca bu oturum için geçerli olur.
  }

  const revoked =
    (previous?.analytics && !state.analytics) || (previous?.marketing && !state.marketing);

  // Onay verilmeyen kategorilerin daha önce bırakılmış çerezlerini temizle
  const deniedPrefixes = (Object.keys(COOKIE_PREFIXES) as ConsentCategory[])
    .filter((category) => !state![category])
    .flatMap((category) => COOKIE_PREFIXES[category]);
  clearCookies(deniedPrefixes);

  if (revoked) {
    // Yüklenmiş üçüncü taraf betikleri sayfadan kaldırılamaz; sayfayı yeniliyoruz.
    window.location.reload();
    return;
  }

  applyConsent();
  // Onay bu sayfadayken verildiyse, mevcut sayfa görüntülemesini Pixel'e bildir.
  if (!previous?.marketing && state.marketing) metaPageView();
  listeners.forEach((l) => l());
}

// ─── Etiket yükleyiciler ────────────────────────────────────────────────────

let clarityLoaded = false;
let googleAdsLoaded = false;
let metaPixelLoaded = false;

function loadClarity() {
  if (clarityLoaded) return;
  clarityLoaded = true;
  const w = window as unknown as { clarity?: { (...args: unknown[]): void; q?: unknown[] } };
  w.clarity =
    w.clarity ||
    function (...args: unknown[]) {
      (w.clarity!.q = w.clarity!.q || []).push(args);
    };
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.clarity.ms/tag/${CLARITY_ID}`;
  document.head.appendChild(script);
}

function loadGoogleAds() {
  if (googleAdsLoaded) return;
  googleAdsLoaded = true;
  window.dataLayer = window.dataLayer || [];
  // gtag.js, dataLayer'a "arguments" nesnesinin itilmesini bekler.
  window.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  };
  window.gtag('consent', 'default', {
    ad_storage: 'granted',
    ad_user_data: 'granted',
    ad_personalization: 'granted',
    analytics_storage: hasConsent('analytics') ? 'granted' : 'denied',
  });
  window.gtag('js', new Date());
  window.gtag('config', GOOGLE_ADS_ID);

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_ID}`;
  document.head.appendChild(script);
}

function loadMetaPixel() {
  if (metaPixelLoaded) return;
  metaPixelLoaded = true;
  initPixel();
}

/** Mevcut onaya göre izinli etiketleri yükler. Birden çok kez çağrılabilir. */
export function applyConsent() {
  if (hasConsent('analytics')) loadClarity();
  if (hasConsent('marketing')) {
    loadGoogleAds();
    loadMetaPixel();
  }
}

// ─── Yardımcılar ────────────────────────────────────────────────────────────

function clearCookies(prefixes: string[]) {
  if (prefixes.length === 0) return;
  const hostParts = window.location.hostname.split('.');
  const domains = [''];
  for (let i = 0; i < hostParts.length - 1; i++) {
    domains.push(`; domain=.${hostParts.slice(i).join('.')}`);
  }

  document.cookie.split(';').forEach((cookie) => {
    const name = cookie.split('=')[0].trim();
    if (!prefixes.some((prefix) => name.startsWith(prefix))) return;
    domains.forEach((domain) => {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${domain}`;
    });
  });
}
