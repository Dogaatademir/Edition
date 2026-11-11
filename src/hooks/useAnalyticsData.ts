// src/hooks/useAnalyticsData.ts
// /analiz panelinin verisi. Ham kayıtlar şifreli `analytics-data` fonksiyonundan gelir,
// metrikler burada seçili dönem ve bir önceki eş dönem için hesaplanır.

import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';

export type DateRange = 'today' | 'week' | 'month' | 'custom';
export interface CustomRange { start: Date; end: Date }

/** analytics-data fonksiyonu en fazla bu kadar gün geriye veri döndürür. */
export const MAX_LOOKBACK_DAYS = 75;

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
  visits: number;              // toplam ziyaret (tüm oturumlar + eski sürümün kimliksiz kayıtları)
  consentedSessions: number;   // analitik onayı veren ziyaret
  anonVisits: number;          // onay vermeyen ziyaret
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

export function getPeriods(range: DateRange, custom?: CustomRange | null, now = new Date()) {
  // Özel aralık: önceki dönem, hemen önceki eş uzunluktaki süre
  if (range === 'custom' && custom) {
    const start = custom.start;
    const end = new Date(Math.min(custom.end.getTime(), now.getTime()));
    const length = Math.max(end.getTime() - start.getTime(), 0);
    return { start, end, prevStart: new Date(start.getTime() - length), prevEnd: start };
  }
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
  return { start, end: now, prevStart, prevEnd };
}

// ─── Yardımcılar ──────────────────────────────────────────────────────────────

const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const pct = (part: number, whole: number) => (whole > 0 ? (part / whole) * 100 : 0);
const round = (n: number, d = 2) => parseFloat(n.toFixed(d));

// Grafik dilimleri: 2 günü aşmayan aralıklarda saatlik, daha uzunlarda günlük
const HOURLY_MAX_MS = 48 * 3_600_000;

function makeBuckets(start: Date, end: Date) {
  const hourly = end.getTime() - start.getTime() <= HOURLY_MAX_MS;
  const multiDay = start.toDateString() !== end.toDateString();
  const key = (d: Date) =>
    `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}${hourly ? `-${d.getHours()}` : ''}`;
  const dayLabel = (d: Date) => `${d.getDate()} ${d.toLocaleString('tr-TR', { month: 'short' })}`;
  const label = (d: Date) => {
    if (!hourly) return dayLabel(d);
    const hour = `${String(d.getHours()).padStart(2, '0')}:00`;
    return multiDay ? `${dayLabel(d)} ${hour}` : hour;
  };
  const first = new Date(start);
  if (hourly) first.setMinutes(0, 0, 0);
  else first.setHours(0, 0, 0, 0);
  const next = (d: Date) => (hourly ? d.setHours(d.getHours() + 1) : d.setDate(d.getDate() + 1));
  return { key, label, first, next, hourly };
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

/**
 * Onay vermeyen oturumlar: session_start'ta consented=false olup sonradan consent_granted gelmeyenler.
 * session_start kaydı olmayan eski oturumlar yalnızca onaylı ziyaretçilerden toplandığı için onaylı sayılır.
 */
function unconsentedSessionIds(events: EventRow[]): Set<string> {
  const granted = new Set(events.filter((e) => e.type === 'consent_granted').map((e) => e.session_id));
  return new Set(
    events
      .filter((e) => e.type === 'session_start' && e.payload?.consented === false && !granted.has(e.session_id))
      .map((e) => e.session_id),
  );
}

/** Eski sürümün (oturumsuz) kimliksiz ziyaret kayıtları; onaydan sonra oturum olarak da sayılanlar düşülür. */
function legacyAnonVisits(events: EventRow[]): number {
  const anon = events.filter((e) => e.type === 'anon_visit').length;
  const doubleCounted = events.filter((e) => e.type === 'session_start' && e.payload?.anonCounted === true).length;
  return Math.max(anon - doubleCounted, 0);
}

function computeMetrics(pageViews: PageViewRow[], events: EventRow[], orders: Order[]): PeriodMetrics {
  const sessions = new Set(pageViews.map((pv) => pv.session_id));
  const unconsented = unconsentedSessionIds(events);
  let unconsentedInRange = 0;
  sessions.forEach((id) => { if (unconsented.has(id)) unconsentedInRange++; });
  const legacyAnon = legacyAnonVisits(events);
  const visits = sessions.size + legacyAnon;
  const consentedCount = sessions.size - unconsentedInRange;

  const sessionsOf = (...types: string[]) =>
    new Set(events.filter((e) => types.includes(e.type) && e.session_id !== ANON).map((e) => e.session_id));
  const cart = sessionsOf('cart_add', 'pixel_cart_add');
  const purchased = new Set(orders.map((o) => o.sessionId));
  // Sipariş veren her oturum Shopify ödemesinden geçmiştir. checkout_start kaydı eksik olsa bile
  // (ör. eski sürümde onaysız ziyaretçi, silinmiş eski kayıt, terk edilen ödeme e-postasından dönüş)
  // ödemeye geçenler arasında sayılır; böylece "ödemeye geçen − sipariş = vazgeçen" her zaman tutar.
  const checkout = sessionsOf('checkout_start');
  purchased.forEach((id) => { if (id !== ANON) checkout.add(id); });

  let cartAbandoned = 0;
  cart.forEach((id) => { if (!checkout.has(id) && !purchased.has(id)) cartAbandoned++; });
  let checkoutAbandoned = 0;
  checkout.forEach((id) => { if (!purchased.has(id)) checkoutAbandoned++; });

  const revenue = orders.reduce((s, o) => s + o.total, 0);
  return {
    visits,
    consentedSessions: consentedCount,
    anonVisits: unconsentedInRange + legacyAnon,
    consentRate: round(pct(consentedCount, visits), 1),
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
  sessions: Set<string>,
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

  // Oturumlar (kaynak bilgisi olmayan eski oturumlar "bilinmiyor")
  sessions.forEach((id) => { row(sessionKey.get(id) ?? UNKNOWN).visits++; });
  // Eski sürümün kimliksiz kayıtları; onaydan önce sayılıp sonra onay verenler zaten oturum olarak sayıldı
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

export function computeAnalytics(
  raw: RawData,
  range: DateRange,
  custom?: CustomRange | null,
): Omit<AnalyticsData, 'loading' | 'error' | 'lastUpdated'> {
  const { start, end, prevStart, prevEnd } = getPeriods(range, custom);

  const pvCur = raw.pageViews.filter((r) => inRange(r.ts, start, end));
  const pvPrev = raw.pageViews.filter((r) => inRange(r.ts, prevStart, prevEnd));
  const evCur = raw.events.filter((r) => inRange(r.ts, start, end));
  const evPrev = raw.events.filter((r) => inRange(r.ts, prevStart, prevEnd));
  const ordersCur = dedupeOrders(evCur);
  const ordersPrev = dedupeOrders(evPrev);

  const current = computeMetrics(pvCur, evCur, ordersCur);
  const previous = computeMetrics(pvPrev, evPrev, ordersPrev);
  const sessions = new Set(pvCur.map((pv) => pv.session_id));
  const unconsented = unconsentedSessionIds(evCur);

  // Zaman dilimleri (saatlik / günlük): onaylı ziyaret + onaysız ziyaret + sipariş
  const buckets = makeBuckets(start, end);
  const dayKey = buckets.key;
  const days = new Map<string, DailyStat>();
  for (const d = new Date(buckets.first); d <= end; buckets.next(d)) {
    days.set(dayKey(d), { date: buckets.label(d), consented: 0, anonymous: 0, orders: 0, convRate: 0 });
  }
  const daySessions = new Map<string, Set<string>>();
  pvCur.forEach((pv) => {
    const k = dayKey(new Date(pv.ts));
    if (!daySessions.has(k)) daySessions.set(k, new Set());
    daySessions.get(k)!.add(pv.session_id);
  });
  daySessions.forEach((set, k) => {
    const d = days.get(k);
    if (!d) return;
    set.forEach((id) => { if (unconsented.has(id)) d.anonymous++; else d.consented++; });
  });
  evCur.forEach((e) => {
    const d = days.get(dayKey(new Date(e.ts)));
    if (!d) return;
    if (e.type === 'anon_visit') d.anonymous++;
    if (e.type === 'session_start' && e.payload?.anonCounted === true) d.anonymous = Math.max(d.anonymous - 1, 0);
  });
  ordersCur.forEach((o) => { const d = days.get(dayKey(o.ts)); if (d) d.orders++; });
  const daily = [...days.values()].map((d) => ({ ...d, convRate: round(pct(d.orders, d.consented + d.anonymous)) }));

  // Huni oturumlar üzerinden (eski sürümün oturumsuz kayıtlarında sepet bilgisi yok)
  const sessionOrders = ordersCur.filter((o) => sessions.has(o.sessionId)).length;
  const base = sessions.size;
  const funnel: FunnelStep[] = [
    { key: 'sessions', label: 'Oturumlar',               count: base,                     pct: 100 },
    { key: 'cart',     label: 'Sepete eklendi',          count: current.cartSessions,     pct: round(pct(current.cartSessions, base)) },
    { key: 'checkout', label: 'Shopify ödemesine geçti', count: current.checkoutSessions, pct: round(pct(current.checkoutSessions, base)) },
    { key: 'purchase', label: 'Sipariş tamamlandı',      count: sessionOrders,            pct: round(pct(sessionOrders, base)) },
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
    sources: breakdown('source', evCur, ordersCur, sessions),
    devices: breakdown('device', evCur, ordersCur, sessions),
    topProducts: rank(productCounts),
    topCartProducts: rank(cartCounts),
    topPages: rank(pageCounts),
    trackingSince: firstTracked?.ts ?? null,
    liveEvents: raw.liveEvents,
    activeVisitors: raw.activeVisitors,
  };
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAnalyticsData(range: DateRange, custom?: CustomRange | null): AnalyticsData {
  const [state, setState] = useState<AnalyticsData>(EMPTY);
  const requestRef = useRef(0);
  // Tarihleri sayı olarak izle: aynı aralık için her çizimde yeni Date nesnesi gelse de yeniden çekme
  const customStart = custom?.start.getTime() ?? null;
  const customEnd = custom?.end.getTime() ?? null;

  const fetchData = useCallback(async () => {
    const password = sessionStorage.getItem(ANALIZ_PASSWORD_KEY);
    if (!password) return;
    const customRange = customStart !== null && customEnd !== null
      ? { start: new Date(customStart), end: new Date(customEnd) }
      : null;
    if (range === 'custom' && !customRange) return;
    const { prevStart } = getPeriods(range, customRange);
    const requestId = ++requestRef.current;

    const { data, error } = await supabase.functions.invoke<RawData>('analytics-data', {
      body: { password, mode: 'data', since: prevStart.toISOString() },
    });

    // Bu arada aralık değiştiyse eski cevabı yok say
    if (requestId !== requestRef.current) return;

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

    setState({ ...computeAnalytics(data, range, customRange), loading: false, error: null, lastUpdated: new Date() });
  }, [range, customStart, customEnd]);

  useEffect(() => {
    // Aralık değişince eski dönemin rakamları yeni etiketle görünmesin
    setState((s) => ({ ...s, loading: true })); // eslint-disable-line react-hooks/set-state-in-effect
    fetchData();
    const interval = setInterval(fetchData, REFRESH_MS);
    return () => clearInterval(interval);
  }, [fetchData]);

  return state;
}
