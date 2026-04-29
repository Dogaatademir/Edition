import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { getSessionId } from '../lib/session';

export async function trackPageView(page: string) {
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
  type: 'cart_add' | 'cart_remove' | 'search' | 'checkout_start' | 'react_odeme_view',
  payload?: Record<string, unknown>
) {
  const session_id = getSessionId();
  console.debug('[Analytics] trackEvent →', type, { session_id, payload });

  const { error } = await supabase.from('analytics_events').insert({
    session_id,
    type,
    payload: payload ?? null,
  });

  if (error) console.error('[Analytics] trackEvent error:', error.message, { type, payload });
}

export function useAnalytics(pathname: string) {
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
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
  }, [pathname]);
}