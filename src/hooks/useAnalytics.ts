import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { getSessionId } from '../lib/session';
import { hasConsent } from '../lib/consent';
import { useConsent } from './useConsent';
import { initialTraffic, isLikelyBot } from '../lib/traffic';

// Yönetim sayfaları ziyaret olarak sayılmaz.
const EXCLUDED_PATHS = ['/analiz'];
const isExcluded = (path: string) => EXCLUDED_PATHS.some((p) => path.startsWith(p));

const SESSION_START_KEY = 'sfa_session_started';
export const ANONYMOUS_SESSION_ID = 'anonymous';

// Bu sayfa yüklemesinde anonim ziyaret gönderildi mi? (bellekte tutulur, hiçbir yere yazılmaz)
let anonymousVisitSent = false;

export async function trackPageView(page: string) {
  if (!hasConsent('analytics')) return;
  const session_id = getSessionId();

  const { error: upsertError } = await supabase.from('active_sessions').upsert({
    session_id,
    page,
    referrer: document.referrer || null,
    last_seen: new Date().toISOString(),
  });
  if (upsertError) console.error('[Analytics] trackPageView upsert error:', upsertError.message);

  const { error: insertError } = await supabase.from('page_views').insert({ session_id, page });
  if (insertError) console.error('[Analytics] trackPageView insert error:', insertError.message);
}

export async function trackEvent(
  type: 'cart_add' | 'cart_remove' | 'search' | 'checkout_start' | 'session_start',
  payload?: Record<string, unknown>
) {
  if (!hasConsent('analytics')) return;
  const session_id = getSessionId();
  console.debug('[Analytics] trackEvent →', type, { session_id, payload });

  const { error } = await supabase.from('analytics_events').insert({
    session_id,
    type,
    payload: payload ?? null,
  });

  if (error) console.error('[Analytics] trackEvent error:', error.message, { type, payload });
}

/** Onaylı oturumun kaynağını ve cihazını oturum başına bir kez kaydeder. */
function trackSessionStart() {
  try {
    if (sessionStorage.getItem(SESSION_START_KEY)) return;
    sessionStorage.setItem(SESSION_START_KEY, '1');
  } catch {
    return;
  }
  // anonCounted: bu ziyaret onaydan önce anonim olarak zaten sayıldıysa toplamda iki kez sayılmasın
  trackEvent('session_start', { ...initialTraffic, anonCounted: anonymousVisitSent });
}

/**
 * Analitik onayı OLMAYAN ziyaretleri kimliksiz olarak sayar.
 * Çerez/depolama kullanılmaz, oturum kimliği yoktur; yalnızca kaynak, cihaz ve giriş sayfası gönderilir.
 * Sayfa yüklemesi başına en fazla bir kez gönderilir.
 */
async function trackAnonymousVisit() {
  if (anonymousVisitSent || hasConsent('analytics') || isLikelyBot() || !initialTraffic) return;
  if (isExcluded(initialTraffic.landing)) return;
  anonymousVisitSent = true;
  const { error } = await supabase.from('analytics_events').insert({
    session_id: ANONYMOUS_SESSION_ID,
    type: 'anon_visit',
    payload: {
      source: initialTraffic.source,
      medium: initialTraffic.medium,
      campaign: initialTraffic.campaign,
      device: initialTraffic.device,
      landing: initialTraffic.landing,
    },
  });
  if (error) console.error('[Analytics] anon_visit error:', error.message);
}

export function useAnalytics(pathname: string) {
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const analyticsAllowed = useConsent()?.analytics === true;
  const excluded = isExcluded(pathname);

  // Onay verilmemişse (henüz karar verilmemiş veya reddedilmiş) ziyareti anonim say.
  useEffect(() => {
    if (!analyticsAllowed && !excluded) trackAnonymousVisit();
  }, [analyticsAllowed, excluded]);

  useEffect(() => {
    if (!analyticsAllowed || excluded) return;
    trackSessionStart();
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
  }, [pathname, analyticsAllowed, excluded]);
}
