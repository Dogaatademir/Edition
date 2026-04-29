import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

export interface LiveEvent {
  id: number;
  type: string;
  payload: Record<string, unknown> | null;
  ts: string;
}

export interface RealtimeAnalytics {
  activeVisitors: number;
  topPages: { page: string; count: number }[];
  liveEvents: LiveEvent[];
  isConnected: boolean;
  isReconnecting: boolean;
}

export function useRealtimeAnalytics(): RealtimeAnalytics {
  const [activeVisitors, setActiveVisitors] = useState(0);
  const [topPages, setTopPages] = useState<{ page: string; count: number }[]>([]);
  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const hasConnectedRef = useRef(false);

  const fetchActive = useCallback(async () => {
    // cleanup_stale_sessions RPC — hata verse bile devam et
    try {
      await supabase.rpc('cleanup_stale_sessions');
    } catch {
      // RPC bulunamadıysa manuel sil
      const { error: deleteError } = await supabase
        .from('active_sessions')
        .delete()
        .lt('last_seen', new Date(Date.now() - 45_000).toISOString());
      if (deleteError) {
        console.warn('[Analytics] cleanup fallback error:', deleteError.message);
      }
    }

    const { data, error } = await supabase
      .from('active_sessions')
      .select('page');

    if (error) {
      console.warn('[Analytics] fetchActive error:', error.message);
      return;
    }

    setActiveVisitors(data.length);

    const counts: Record<string, number> = {};
    data.forEach(row => {
      counts[row.page] = (counts[row.page] ?? 0) + 1;
    });
    setTopPages(
      Object.entries(counts)
        .map(([page, count]) => ({ page, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8)
    );
  }, []);

  // Son 20 eventi başlangıçta getir (realtime gelmeden önce boş kalmasın)
  const fetchRecentEvents = useCallback(async () => {
    const { data, error } = await supabase
      .from('analytics_events')
      .select('*')
      .order('ts', { ascending: false })
      .limit(20);

    if (error) {
      console.warn('[Analytics] fetchRecentEvents error:', error.message);
      return;
    }
    if (data) setLiveEvents(data as LiveEvent[]);
  }, []);

  useEffect(() => {
    fetchActive();
    fetchRecentEvents();

    // ── active_sessions realtime ──────────────────────────────────────────
    const sessionChannel = supabase
      .channel('rt_active_sessions')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'active_sessions' },
        () => {
          // Değişiklik geldiğinde tabloyu yeniden çek
          fetchActive();
        }
      )
      .subscribe((status) => {
        console.log('[Analytics] session channel:', status);
        const connected = status === 'SUBSCRIBED';
        if (connected) hasConnectedRef.current = true;
        setIsConnected(connected);
        setIsReconnecting(!connected && hasConnectedRef.current);
      });

    // ── analytics_events realtime ─────────────────────────────────────────
    const eventChannel = supabase
      .channel('rt_analytics_events')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'analytics_events' },
        (payload) => {
          setLiveEvents(prev =>
            [payload.new as LiveEvent, ...prev].slice(0, 20)
          );
        }
      )
      .subscribe((status) => {
        console.log('[Analytics] event channel:', status);
      });

    // Polling fallback — realtime kesilirse veri güncel kalır
    const poller = setInterval(fetchActive, 20_000);

    return () => {
      supabase.removeChannel(sessionChannel);
      supabase.removeChannel(eventChannel);
      clearInterval(poller);
    };
  }, [fetchActive, fetchRecentEvents]);

  return { activeVisitors, topPages, liveEvents, isConnected, isReconnecting };
}