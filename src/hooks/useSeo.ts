import { useEffect } from 'react';

const SITE_URL = 'https://editioncoffee.com.tr';
const DEFAULT_TITLE = 'Edition Coffee Roastery';
const DEFAULT_DESCRIPTION =
  'Edition Coffee Roastery — taze kavrulmuş Türk kahvesi, filtre kahve ve espresso. Yüzyıllık geleneği modern kavurmayla buluşturuyoruz. 850 TL üzeri kargo ücretsiz.';
const JSON_LD_ID = 'seo-json-ld';

function setRobots(noindex: boolean) {
  let meta = document.querySelector('meta[name="robots"]');
  if (!noindex) {
    meta?.remove();
    return;
  }
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'robots');
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', 'noindex, follow');
}

function setMetaDescription(content: string) {
  let meta = document.querySelector('meta[name="description"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'description');
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', content);
}

/**
 * Sayfa başlığını, açıklamasını, canonical adresini ve (varsa) JSON-LD yapısal verisini yönetir.
 * noindex=true verilirse <meta name="robots" content="noindex, follow"> eklenir (404, ödeme vb.).
 * Bileşen kaldırıldığında (sayfa değişiminde) değerleri varsayılana döndürür; böylece
 * önceki sayfanın başlığı veya canonical adresi bir sonraki sayfada kalmaz.
 */
export function useSeo(
  title: string,
  description: string,
  canonicalPath?: string,
  jsonLd?: Record<string, unknown> | null,
  noindex = false,
) {
  const jsonLdString = jsonLd ? JSON.stringify(jsonLd) : null;

  useEffect(() => {
    document.title = title;
    setMetaDescription(description);
    setRobots(noindex);

    if (canonicalPath) {
      let link = document.querySelector('link[rel="canonical"]');
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'canonical');
        document.head.appendChild(link);
      }
      link.setAttribute('href', `${SITE_URL}${canonicalPath}`);
    }

    if (jsonLdString) {
      let script = document.getElementById(JSON_LD_ID);
      if (!script) {
        script = document.createElement('script');
        script.id = JSON_LD_ID;
        script.setAttribute('type', 'application/ld+json');
        document.head.appendChild(script);
      }
      script.textContent = jsonLdString;
    }

    return () => {
      document.title = DEFAULT_TITLE;
      setMetaDescription(DEFAULT_DESCRIPTION);
      setRobots(false);
      document.querySelector('link[rel="canonical"]')?.remove();
      document.getElementById(JSON_LD_ID)?.remove();
    };
  }, [title, description, canonicalPath, jsonLdString, noindex]);
}
