// src/hooks/useAnalytics.ts
// Site içi (Supabase) ziyaret analitiği. Tüm ziyaretçiler için aynı olaylar kaydedilir;
// fark yalnızca oturum kimliğinin nerede tutulduğundadır (bkz. lib/session.ts):
// onay verenlerde sessionStorage, vermeyenlerde yalnızca bellek. Onay vermeyenlerin tam referrer
// adresi saklanmaz, yalnızca kaynak adı (ör. "instagram") kaydedilir.
import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { getSessionId } from '../lib/session';
import { hasConsent } from '../lib/consent';
import { useConsent } from './useConsent';
import { initialTraffic, isLikelyBot } from '../lib/traffic';

// Yönetim sayfaları ziyaret olarak sayılmaz.
const EXCLUDED_PATHS = ['/analiz'];
const isExcluded = (path: string) => EXCLUDED_PATHS.some((p) => path.startsWith(p));
const trackingDisabled = () => typeof window === 'undefined' || isLikelyBot();

// Bu sayfa yüklemesinde session_start gönderilen kimlikler ve onaysız başlayanlar (bellekte)
const startedSessions = new Set<string>();
const startedWithoutConsent = new Set<string>();

export type TrackedEvent = 'cart_add' | 'cart_remove' | 'search' | 'checkout_start' | 'session_start' | 'consent_granted';

export async function trackEvent(type: TrackedEvent, payload?: Record<string, unknown>) {
  if (trackingDisabled()) return;
  const session_id = getSessionId();
  console.debug('[Analytics] trackEvent →', type, { session_id, payload });

  const { error } = await supabase.from('analytics_events').insert({
    session_id,
    type,
    payload: payload ?? null,
  });

  if (error) console.error('[Analytics] trackEvent error:', error.message, { type, payload });
}

export async function trackPageView(page: string) {
  if (trackingDisabled()) return;
  const session_id = getSessionId();

  const { error: upsertError } = await supabase.from('active_sessions').upsert({
    session_id,
    page,
    referrer: hasConsent('analytics') ? document.referrer || null : null,
    last_seen: new Date().toISOString(),
  });
  if (upsertError) console.error('[Analytics] trackPageView upsert error:', upsertError.message);

  const { error: insertError } = await supabase.from('page_views').insert({ session_id, page });
  if (insertError) console.error('[Analytics] trackPageView insert error:', insertError.message);
}

/** Oturumun kaynağını, cihazını ve onay durumunu oturum başına bir kez kaydeder. */
function trackSessionStart(consented: boolean) {
  const id = getSessionId();
  const storageKey = `sfa_session_started_${id}`;
  if (startedSessions.has(id)) return;
  startedSessions.add(id);
  if (!consented) startedWithoutConsent.add(id);
  if (consented) {
    try {
      // Onaylı oturum sekmede yeniden yüklenirse tekrar gönderilmesin
      if (sessionStorage.getItem(storageKey)) return;
      sessionStorage.setItem(storageKey, '1');
    } catch { /* depolama kapalı */ }
  }
  // Ziyaret yönetim sayfasında başladıysa giriş sayfası olarak ilk izlenen sayfayı kullan
  const landing = initialTraffic && !isExcluded(initialTraffic.landing) ? initialTraffic.landing : window.location.pathname;
  trackEvent('session_start', { ...initialTraffic, landing, consented });
}

export function useAnalytics(pathname: string) {
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const consented = useConsent()?.analytics === true;
  const excluded = isExcluded(pathname);

  useEffect(() => {
    if (excluded || trackingDisabled()) return;
    trackSessionStart(consented);
    // Onaysız başlayan ziyaret sırasında onay verildiyse işaretle (aynı oturum kimliği devam eder)
    const id = getSessionId();
    if (consented && startedWithoutConsent.has(id)) {
      startedWithoutConsent.delete(id);
      trackEvent('consent_granted');
    }
  }, [consented, excluded]);

  useEffect(() => {
    if (excluded || trackingDisabled()) return;
    trackPageView(pathname);

    heartbeatRef.current = setInterval(async () => {
      await supabase
        .from('active_sessions')
        .update({ last_seen: new Date().toISOString() })
        .eq('session_id', getSessionId());
    }, 15_000);

    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    };
  }, [pathname, excluded]);
}
