import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { getSessionId } from '../lib/session';

export async function trackPageView(page: string) {
  const session_id = getSessionId();

  await supabase.from('active_sessions').upsert({
    session_id,
    page,
    referrer: document.referrer || null,
    last_seen: new Date().toISOString(),
  });

  await supabase.from('page_views').insert({ session_id, page });
}

export async function trackEvent(
  type: 'cart_add' | 'cart_remove' | 'search' | 'checkout_start',
  payload?: Record<string, unknown>
) {
  await supabase.from('analytics_events').insert({
    session_id: getSessionId(),
    type,
    payload: payload ?? null,
  });
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
