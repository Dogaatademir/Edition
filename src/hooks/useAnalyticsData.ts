// src/hooks/useAnalyticsData.ts
// /analiz panelinin verisi. Ham kayıtlar şifreli `analytics-data` fonksiyonundan gelir,
// metrikler burada seçili dönem ve bir önceki eş dönem için hesaplanır.

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export type DateRange = 'today' | 'week' | 'month';

export const ANALIZ_PASSWORD_KEY = 'analiz_pw';
const REFRESH_MS = 30_000;
const ANON = 'anonymous';

// ─── Ham veri ────────────────────────────────────────────────────────────────

interface PageViewRow { session_id: string; page: string; ts: string }
interface EventRow { session_id: string; type: string; payload: Record<string, unknown> | null; ts: string }
export interface LiveEvent { id: number; type: string; payload: Record<string, unknown> | null; ts: string }

interface RawData {
  pageViews: PageViewRow[];
  events: EventRow[];
  liveEvents: LiveEvent[];
  activeVisitors: number;
}

// ─── Hesaplanan metrikler ─────────────────────────────────────────────────────

export interface PeriodMetrics {
  visits: number;              // tahmini toplam ziyaret (onaylı oturum + anonim ziyaret)
  consentedSessions: number;   // analitik onayı veren oturum
  anonVisits: number;          // onay vermeyen (kimliksiz sayılan) ziyaret
  consentRate: number;         // %
  cartSessions: number;
  checkoutSessions: number;
  orders: number;
  revenue: number;
  aov: number;
  conversionRate: number;      // sipariş / toplam ziyaret, %
  cartAbandoned: number;
  cartAbandonRate: number;
  checkoutAbandoned: number;
  checkoutAbandonRate: number;
}

export interface DailyStat { date: string; consented: number; anonymous: number; orders: number; convRate: number }
export interface FunnelStep { key: string; label: string; count: number; pct: number }
export interface BreakdownRow { key: string; visits: number; carts: number; orders: number; revenue: number; convRate: number }
export interface RankedItem { name: string; count: number; revenue?: number }

export interface AnalyticsData {
  current: PeriodMetrics;
  previous: PeriodMetrics;
  daily: DailyStat[];
  funnel: FunnelStep[];
  sources: BreakdownRow[];
  devices: BreakdownRow[];
  topProducts: RankedItem[];
  topCartProducts: RankedItem[];
  topPages: RankedItem[];
  trackingSince: string | null; // kaynak/cihaz verisinin başladığı ilk kayıt
  liveEvents: LiveEvent[];
  activeVisitors: number;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

// ─── Tarih aralıkları ─────────────────────────────────────────────────────────

export function getPeriods(range: DateRange, now = new Date()) {
  let start: Date;
  let prevStart: Date;
  if (range === 'today') {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    prevStart = new Date(start);
    prevStart.setDate(prevStart.getDate() - 1);
  } else if (range === 'week') {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
    prevStart = new Date(start);
    prevStart.setDate(prevStart.getDate() - 7);
  } else {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
    prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  }
  // Önceki dönem, geçerli dönemle aynı uzunlukta (ör. bugün 17:50'ye kadar ↔ dün 17:50'ye kadar)
  const elapsed = now.getTime() - start.getTime();
  const prevEnd = new Date(Math.min(prevStart.getTime() + elapsed, start.getTime()));
  return { start, now, prevStart, prevEnd };
}

// ─── Yardımcılar ──────────────────────────────────────────────────────────────

const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const pct = (part: number, whole: number) => (whole > 0 ? (part / whole) * 100 : 0);
const round = (n: number, d = 2) => parseFloat(n.toFixed(d));

function dayKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}
function dayLabel(d: Date) {
  return `${d.getDate()} ${d.toLocaleString('tr-TR', { month: 'short' })}`;
}

interface Order { sessionId: string; total: number; ts: Date; items: { title: string; quantity: number; total: number | null }[] }

/** Aynı sipariş birden fazla kez gelmişse (ör. teşekkür sayfası yenilendi) bir kez say. */
function dedupeOrders(events: EventRow[]): Order[] {
  const seen = new Set<string>();
  const orders: Order[] = [];
  events.forEach((e) => {
    if (e.type !== 'purchase') return;
    const p = e.payload ?? {};
    const id = p.orderId ? String(p.orderId) : `${e.session_id}|${e.ts}`;
    if (seen.has(id)) return;
    seen.add(id);
    const rawItems = Array.isArray(p.items) ? (p.items as Record<string, unknown>[]) : [];
    orders.push({
      sessionId: e.session_id,
      total: num(p.total ?? p.total_price ?? p.price ?? p.amount),
      ts: new Date(e.ts),
      items: rawItems.map((it) => ({
        title: String(it.title ?? 'Bilinmeyen ürün'),
        quantity: num(it.quantity) || 1,
        total: it.total == null ? null : num(it.total),
      })),
    });
  });
  return orders;
}

function inRange(ts: string | Date, from: Date, to: Date) {
  const t = (ts instanceof Date ? ts : new Date(ts)).getTime();
  return t >= from.getTime() && t <= to.getTime();
}

function computeMetrics(pageViews: PageViewRow[], events: EventRow[], orders: Order[]): PeriodMetrics {
  const consented = new Set(pageViews.map((pv) => pv.session_id));
  const anonVisits = events.filter((e) => e.type === 'anon_visit').length;
  // Onaydan önce anonim sayılıp aynı yüklemede onay veren ziyaretler iki kez sayılmasın
  const doubleCounted = events.filter((e) => e.type === 'session_start' && e.payload?.anonCounted === true).length;
  const visits = Math.max(consented.size + anonVisits - doubleCounted, consented.size);

  const sessionsOf = (...types: string[]) =>
    new Set(events.filter((e) => types.includes(e.type) && e.session_id !== ANON).map((e) => e.session_id));
  const cart = sessionsOf('cart_add', 'pixel_cart_add');
  const checkout = sessionsOf('checkout_start');
  const purchased = new Set(orders.map((o) => o.sessionId));

  let cartAbandoned = 0;
  cart.forEach((id) => { if (!checkout.has(id) && !purchased.has(id)) cartAbandoned++; });
  let checkoutAbandoned = 0;
  checkout.forEach((id) => { if (!purchased.has(id)) checkoutAbandoned++; });

  const revenue = orders.reduce((s, o) => s + o.total, 0);
  return {
    visits,
    consentedSessions: consented.size,
    anonVisits: Math.max(anonVisits - doubleCounted, 0),
    consentRate: round(pct(consented.size, visits), 1),
    cartSessions: cart.size,
    checkoutSessions: checkout.size,
    orders: orders.length,
    revenue,
    aov: orders.length > 0 ? revenue / orders.length : 0,
    conversionRate: round(pct(orders.length, visits)),
    cartAbandoned,
    cartAbandonRate: round(pct(cartAbandoned, cart.size), 1),
    checkoutAbandoned,
    checkoutAbandonRate: round(pct(checkoutAbandoned, checkout.size), 1),
  };
}

/** Kaynak veya cihaz bazında ziyaret, sepet, sipariş dökümü. */
function breakdown(
  field: 'source' | 'device',
  events: EventRow[],
  orders: Order[],
  consentedSessions: Set<string>,
): BreakdownRow[] {
  const UNKNOWN = 'bilinmiyor';
  const sessionKey = new Map<string, string>();
  events.forEach((e) => {
    if (e.type === 'session_start') sessionKey.set(e.session_id, String(e.payload?.[field] ?? UNKNOWN));
  });

  const rows = new Map<string, BreakdownRow>();
  const row = (key: string) => {
    if (!rows.has(key)) rows.set(key, { key, visits: 0, carts: 0, orders: 0, revenue: 0, convRate: 0 });
    return rows.get(key)!;
  };

  // Onaylı oturumlar (kaynak bilgisi olmayan eski oturumlar "bilinmiyor")
  consentedSessions.forEach((id) => { row(sessionKey.get(id) ?? UNKNOWN).visits++; });
  // Onay vermeyen ziyaretler; onaydan önce sayılıp sonra onay verenler zaten oturum olarak sayıldı
  events.forEach((e) => { if (e.type === 'anon_visit') row(String(e.payload?.[field] ?? UNKNOWN)).visits++; });
  events.forEach((e) => {
    if (e.type === 'session_start' && e.payload?.anonCounted === true) {
      const r = row(String(e.payload?.[field] ?? UNKNOWN));
      r.visits = Math.max(r.visits - 1, 0);
    }
  });

  const cartSessions = new Set(
    events.filter((e) => (e.type === 'cart_add' || e.type === 'pixel_cart_add') && e.session_id !== ANON).map((e) => e.session_id),
  );
  cartSessions.forEach((id) => { row(sessionKey.get(id) ?? UNKNOWN).carts++; });
  orders.forEach((o) => {
    const r = row(sessionKey.get(o.sessionId) ?? UNKNOWN);
    r.orders++;
    r.revenue += o.total;
  });

  return [...rows.values()]
    .map((r) => ({ ...r, convRate: round(pct(r.orders, r.visits)) }))
    .filter((r) => r.visits > 0 || r.orders > 0)
    .sort((a, b) => b.visits - a.visits || b.orders - a.orders);
}

function rank(counts: Map<string, { count: number; revenue?: number }>, limit = 8): RankedItem[] {
  return [...counts.entries()]
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => (b.revenue ?? b.count) - (a.revenue ?? a.count) || b.count - a.count)
    .slice(0, limit);
}

const EMPTY_METRICS: PeriodMetrics = {
  visits: 0, consentedSessions: 0, anonVisits: 0, consentRate: 0,
  cartSessions: 0, checkoutSessions: 0, orders: 0, revenue: 0, aov: 0, conversionRate: 0,
  cartAbandoned: 0, cartAbandonRate: 0, checkoutAbandoned: 0, checkoutAbandonRate: 0,
};

const EMPTY: AnalyticsData = {
  current: EMPTY_METRICS, previous: EMPTY_METRICS,
  daily: [], funnel: [], sources: [], devices: [],
  topProducts: [], topCartProducts: [], topPages: [],
  trackingSince: null, liveEvents: [], activeVisitors: 0,
  loading: true, error: null, lastUpdated: null,
};

export function computeAnalytics(raw: RawData, range: DateRange): Omit<AnalyticsData, 'loading' | 'error' | 'lastUpdated'> {
  const { start, now, prevStart, prevEnd } = getPeriods(range);

  const pvCur = raw.pageViews.filter((r) => inRange(r.ts, start, now));
  const pvPrev = raw.pageViews.filter((r) => inRange(r.ts, prevStart, prevEnd));
  const evCur = raw.events.filter((r) => inRange(r.ts, start, now));
  const evPrev = raw.events.filter((r) => inRange(r.ts, prevStart, prevEnd));
  const ordersCur = dedupeOrders(evCur);
  const ordersPrev = dedupeOrders(evPrev);

  const current = computeMetrics(pvCur, evCur, ordersCur);
  const previous = computeMetrics(pvPrev, evPrev, ordersPrev);
  const consented = new Set(pvCur.map((pv) => pv.session_id));

  // Günlük: onaylı oturum + anonim ziyaret + sipariş
  const days = new Map<string, DailyStat>();
  for (const d = new Date(start); d <= now; d.setDate(d.getDate() + 1)) {
    days.set(dayKey(d), { date: dayLabel(d), consented: 0, anonymous: 0, orders: 0, convRate: 0 });
  }
  const daySessions = new Map<string, Set<string>>();
  pvCur.forEach((pv) => {
    const k = dayKey(new Date(pv.ts));
    if (!daySessions.has(k)) daySessions.set(k, new Set());
    daySessions.get(k)!.add(pv.session_id);
  });
  daySessions.forEach((set, k) => { const d = days.get(k); if (d) d.consented = set.size; });
  evCur.forEach((e) => {
    const d = days.get(dayKey(new Date(e.ts)));
    if (!d) return;
    if (e.type === 'anon_visit') d.anonymous++;
    if (e.type === 'session_start' && e.payload?.anonCounted === true) d.anonymous = Math.max(d.anonymous - 1, 0);
  });
  ordersCur.forEach((o) => { const d = days.get(dayKey(o.ts)); if (d) d.orders++; });
  const daily = [...days.values()].map((d) => ({ ...d, convRate: round(pct(d.orders, d.consented + d.anonymous)) }));

  // Huni yalnızca onaylı oturumlar üzerinden (onaysız ziyaretçinin sepet hareketi izlenmez)
  const consentedOrders = ordersCur.filter((o) => consented.has(o.sessionId)).length;
  const base = current.consentedSessions;
  const funnel: FunnelStep[] = [
    { key: 'sessions', label: 'Onaylı oturumlar',        count: base,                     pct: 100 },
    { key: 'cart',     label: 'Sepete eklendi',          count: current.cartSessions,     pct: round(pct(current.cartSessions, base)) },
    { key: 'checkout', label: 'Shopify ödemesine geçti', count: current.checkoutSessions, pct: round(pct(current.checkoutSessions, base)) },
    { key: 'purchase', label: 'Sipariş tamamlandı',      count: consentedOrders,          pct: round(pct(consentedOrders, base)) },
  ];

  const productCounts = new Map<string, { count: number; revenue: number }>();
  ordersCur.forEach((o) => {
    if (o.items.length === 0) {
      const r = productCounts.get('Ürün bilgisi yok') ?? { count: 0, revenue: 0 };
      productCounts.set('Ürün bilgisi yok', { count: r.count + 1, revenue: r.revenue + o.total });
      return;
    }
    o.items.forEach((it) => {
      const r = productCounts.get(it.title) ?? { count: 0, revenue: 0 };
      productCounts.set(it.title, { count: r.count + it.quantity, revenue: r.revenue + (it.total ?? 0) });
    });
  });

  const cartCounts = new Map<string, { count: number }>();
  evCur.forEach((e) => {
    if (e.type !== 'cart_add') return;
    const title = String(e.payload?.productTitle ?? 'Bilinmeyen ürün');
    cartCounts.set(title, { count: (cartCounts.get(title)?.count ?? 0) + num(e.payload?.quantity || 1) });
  });

  const pageCounts = new Map<string, { count: number }>();
  pvCur.forEach((pv) => {
    if (pv.page) pageCounts.set(pv.page, { count: (pageCounts.get(pv.page)?.count ?? 0) + 1 });
  });

  const firstTracked = raw.events.find((e) => e.type === 'session_start' || e.type === 'anon_visit');

  return {
    current,
    previous,
    daily,
    funnel,
    sources: breakdown('source', evCur, ordersCur, consented),
    devices: breakdown('device', evCur, ordersCur, consented),
    topProducts: rank(productCounts),
    topCartProducts: rank(cartCounts),
    topPages: rank(pageCounts),
    trackingSince: firstTracked?.ts ?? null,
    liveEvents: raw.liveEvents,
    activeVisitors: raw.activeVisitors,
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAnalyticsData(range: DateRange): AnalyticsData {
  const [state, setState] = useState<AnalyticsData>(EMPTY);

  const fetchData = useCallback(async () => {
    const password = sessionStorage.getItem(ANALIZ_PASSWORD_KEY);
    if (!password) return;
    const { prevStart } = getPeriods(range);

    const { data, error } = await supabase.functions.invoke<RawData>('analytics-data', {
      body: { password, mode: 'data', since: prevStart.toISOString() },
    });

    if (error || !data) {
      let message = error?.message ?? 'veri alınamadı';
      const context = (error as { context?: Response } | null)?.context;
      if (context?.status === 401) {
        // Şifre değişmiş: girişe geri dön
        sessionStorage.removeItem(ANALIZ_PASSWORD_KEY);
        window.location.reload();
        return;
      }
      try {
        const body = await context?.json();
        if (body?.error) message = body.error;
      } catch { /* gövde okunamadı */ }
      setState((s) => ({ ...s, loading: false, error: message }));
      return;
    }

    setState({ ...computeAnalytics(data, range), loading: false, error: null, lastUpdated: new Date() });
  }, [range]);

  useEffect(() => {
    // Aralık değişince eski dönemin rakamları yeni etiketle görünmesin
    setState((s) => ({ ...s, loading: true })); // eslint-disable-line react-hooks/set-state-in-effect
    fetchData();
    const interval = setInterval(fetchData, REFRESH_MS);
    return () => clearInterval(interval);
  }, [fetchData]);

  return state;
}
