import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { useRealtimeAnalytics } from '../hooks/useRealtimeAnalytics';
import { useShopifyAnalytics, type DateRange } from '../hooks/useShopifyAnalytics';

const EVENT_LABELS: Record<string, string> = {
  // — React Tarafı —
  cart_add:          '🛒 Sepete eklendi (React)',
  cart_remove:       '✕  Sepetten çıkarıldı',
  search:            '🔍 Arama yapıldı',
  react_odeme_view:  '👁️ React /odeme sayfasına girdi',
  cart_abandoned:    '⚠️ Sepet terk edildi (3dk)',

  // — Shopify Pixel (Otomatik) —
  checkout_start:    '💳 Shopify ödeme ekranı açıldı',
  purchase:          '✅ Sipariş tamamlandı (Shopify)',
  pixel_cart_add:    '🛒 Sepete eklendi (Shopify)',
  pixel_page_view:   '📄 Shopify sayfa görüntülendi',
};

const RANGE_LABELS: Record<DateRange, string> = {
  today: 'bugün',
  week:  'bu hafta',
  month: 'bu ay',
};

// Fix 7: Intl formatters inside a factory to avoid SSR locale divergence
function createFormatters() {
  return {
    fmt:    new Intl.NumberFormat('tr-TR'),
    fmtCur: new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 2 }),
  };
}

// Fix 6: Single EmptyState component instead of repeated inline blocks
function EmptyState({ loading }: { loading: boolean }) {
  return (
    <div style={{ color: '#aaa', fontSize: 13 }}>
      {loading ? 'yükleniyor...' : 'henüz veri yok'}
    </div>
  );
}

// Fix 2: Tooltip opens from the KpiCard div (position:relative), not from the ⓘ span
function KpiCard({ label, value, sub, tooltip }: { label: string; value: string; sub?: string; tooltip?: string }) {
  const [show, setShow] = useState(false);
  return (
    <div
      style={{
        flex: 1, minWidth: 0, padding: '18px 20px',
        border: '0.5px solid #e5e5e5', borderRadius: 8,
        position: 'relative',
      }}
    >
      <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
        {label}
        {tooltip && (
          <span
            onMouseEnter={() => setShow(true)}
            onMouseLeave={() => setShow(false)}
            style={{ cursor: 'default', color: '#ccc', fontSize: 10, lineHeight: 1, userSelect: 'none' }}
          >
            ⓘ
          </span>
        )}
      </div>
      <div style={{ fontSize: 28, fontWeight: 500, lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>{sub}</div>}
      {tooltip && show && (
        <span style={{
          position: 'absolute', top: '100%', left: 0, zIndex: 10,
          background: '#1a1a1a', color: '#eee',
          fontSize: 11, lineHeight: 1.5, padding: '8px 12px',
          borderRadius: 6, width: 280, whiteSpace: 'normal',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          marginTop: 4, fontWeight: 400, letterSpacing: 0,
          textTransform: 'none',
        }}>
          {tooltip}
        </span>
      )}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
      {children}
    </div>
  );
}

export default function AnalyticsDashboard() {
  const [dateRange, setDateRange] = useState<DateRange>('month');
  const { activeVisitors, liveEvents, isConnected, isReconnecting } = useRealtimeAnalytics();
  const agg = useShopifyAnalytics(dateRange);

  // Fix 7: formatters created once per component instance (safe for SSR)
  const { fmt, fmtCur } = useMemo(() => createFormatters(), []);

  // Fix 4: track seen event ids in a Set state so new arrivals are reliably detected
  const [seenEventIds, setSeenEventIds] = useState<Set<number> | null>(null);
  useEffect(() => {
    if (seenEventIds === null && liveEvents.length > 0) {
      setSeenEventIds(new Set(liveEvents.map(e => e.id)));
    }
  }, [liveEvents, seenEventIds]);

  // When new events arrive, add them to the seen set after the flash animation (1.8s)
  const pendingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (seenEventIds === null) return;
    const newIds = liveEvents.map(e => e.id).filter(id => !seenEventIds.has(id));
    if (newIds.length === 0) return;
    if (pendingRef.current) clearTimeout(pendingRef.current);
    pendingRef.current = setTimeout(() => {
      setSeenEventIds(prev => {
        if (!prev) return prev;
        const next = new Set(prev);
        newIds.forEach(id => next.add(id));
        return next;
      });
    }, 1800);
    return () => {
      if (pendingRef.current) clearTimeout(pendingRef.current);
    };
  }, [liveEvents, seenEventIds]);

  const isNewEvent = useCallback(
    (id: number) => seenEventIds !== null && !seenEventIds.has(id),
    [seenEventIds],
  );

  const rangeLabel = RANGE_LABELS[dateRange];
  const timeLabel  = agg.lastUpdated
    ? agg.lastUpdated.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    : '—';

  // Fix 3: memoize tick skip values so they don't re-create on every render
  const tickSkip = useMemo(
    () => agg.dailyStats.length <= 7 ? 1 : 5,
    [agg.dailyStats.length],
  );
  const tickFormatter = useCallback(
    (val: string, idx: number) => idx % tickSkip === 0 ? val : '',
    [tickSkip],
  );

  // Fix 5: safe display values that never show NaN while loading
  const safeAbandonmentRate  = agg.loading ? '—' : `%${agg.abandonmentRate.toFixed(1)}`;
  const safeConversionRate   = agg.loading ? '—' : `%${agg.conversionRate.toFixed(2)}`;
  const safeTotalRevenue     = agg.loading ? '—' : fmtCur.format(agg.totalRevenue);
  const safeAov              = agg.loading ? '—' : fmtCur.format(agg.aov);
  const safeTotalOrders      = agg.loading ? '—' : fmt.format(agg.totalOrders);
  const safeTotalSessions    = agg.loading ? '—' : fmt.format(agg.totalSessions);
  const safeCartAddSessions  = agg.loading ? '—' : fmt.format(agg.cartAddSessions);
  const safeOdemeView        = agg.loading ? '—' : fmt.format(agg.odemeViewSessions);
  const safeCheckout         = agg.loading ? '—' : fmt.format(agg.checkoutSessions);
  const safeAbandonedCarts   = agg.loading ? '—' : fmt.format(agg.abandonedCarts);

  return (
    <>
      <style>{`
        @keyframes flashGreen {
          0%   { background: rgba(99,153,34,0.18); }
          100% { background: transparent; }
        }
        .live-event-new { animation: flashGreen 1.8s ease forwards; }
      `}</style>

      <div style={{ fontFamily: 'monospace', padding: '2rem', maxWidth: 960, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
              background: isConnected ? '#639922' : '#ccc',
              boxShadow: isConnected ? '0 0 0 3px rgba(99,153,34,0.25)' : 'none',
            }} />
            <span style={{ fontSize: 13, color: '#888', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              {isReconnecting ? 'yeniden bağlanıyor...' : 'canlı analitik'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* Date range selector */}
            <div style={{ display: 'flex', gap: 4 }}>
              {(['today', 'week', 'month'] as DateRange[]).map(r => (
                <button
                  key={r}
                  onClick={() => setDateRange(r)}
                  style={{
                    fontFamily: 'monospace', fontSize: 11, cursor: 'pointer',
                    padding: '4px 10px', borderRadius: 4,
                    border: dateRange === r ? '0.5px solid #333' : '0.5px solid #e5e5e5',
                    background: dateRange === r ? '#333' : 'transparent',
                    color: dateRange === r ? '#fff' : '#888',
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                  }}
                >
                  {RANGE_LABELS[r]}
                </button>
              ))}
            </div>
            <div style={{ fontSize: 11, color: '#aaa' }}>son yenileme {timeLabel}</div>
          </div>
        </div>

        {/* KPI Cards — row 1 */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
          <KpiCard label="aktif ziyaretçi"  value={String(activeVisitors)}   sub="şu an" />
          <KpiCard label="oturumlar"        value={safeTotalSessions}         sub={rangeLabel} />
          <KpiCard label="siparişler"       value={safeTotalOrders}           sub={rangeLabel} />
          <KpiCard label="brüt satışlar"    value={safeTotalRevenue}          sub={rangeLabel} />
        </div>

        {/* KPI Cards — row 2 */}
        <div style={{ display: 'flex', gap: 12, marginBottom: '2.5rem', flexWrap: 'wrap' }}>
          <KpiCard
            label="dönüşüm oranı"
            value={safeConversionRate}
            sub={rangeLabel}
          />
          <KpiCard
            label="ort. sipariş değeri"
            value={safeAov}
            sub={rangeLabel}
          />
          <KpiCard
            label="sepet terk oranı"
            value={safeAbandonmentRate}
            sub={rangeLabel}
            tooltip="Sepete ürün ekleyip ödeme adımına geçmeyen oturumların oranı. Formül: (sepete ekleyen - checkout başlatan) / sepete ekleyen × 100"
          />
          <KpiCard
            label="terk edilen sepet"
            value={safeAbandonedCarts}
            sub={`${rangeLabel} · sepete ekleyip checkout'a geçmeyen oturum`}
            tooltip="Sepete en az bir ürün ekleyip ödeme adımına hiç geçmeden ayrılan unique oturum sayısı. Formül: sepete ekleyen oturum − checkout başlatan oturum"
          />
        </div>

        {/* Sessions over time */}
        <div style={{ marginBottom: '2.5rem', border: '0.5px solid #e5e5e5', borderRadius: 8, padding: '18px 20px' }}>
          <SectionTitle>zamana göre oturumlar</SectionTitle>
          {agg.dailyStats.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={agg.dailyStats} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradSessions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#2563eb" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#aaa' }} tickFormatter={tickFormatter} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#aaa' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ fontFamily: 'monospace', fontSize: 12, border: '0.5px solid #e5e5e5', borderRadius: 6 }}
                  formatter={(v: number | undefined) => [fmt.format(v ?? 0), 'Oturum']}
                />
                <Area type="monotone" dataKey="sessions" stroke="#2563eb" strokeWidth={1.5} fill="url(#gradSessions)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 200, display: 'flex', alignItems: 'center' }}>
              <EmptyState loading={agg.loading} />
            </div>
          )}
        </div>

        {/* Two columns: conversion rate chart + funnel */}
        <div style={{ display: 'flex', gap: 12, marginBottom: '2.5rem', flexWrap: 'wrap' }}>

          <div style={{ flex: 2, minWidth: 280, border: '0.5px solid #e5e5e5', borderRadius: 8, padding: '18px 20px' }}>
            <SectionTitle>zamana göre dönüşüm oranı</SectionTitle>
            {agg.dailyStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={agg.dailyStats} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#aaa' }} tickFormatter={tickFormatter} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#aaa' }} axisLine={false} tickLine={false} unit="%" />
                  <Tooltip
                    contentStyle={{ fontFamily: 'monospace', fontSize: 12, border: '0.5px solid #e5e5e5', borderRadius: 6 }}
                    formatter={(v: number | undefined) => [`%${v ?? 0}`, 'Dönüşüm']}
                  />
                  <Line type="monotone" dataKey="convRate" stroke="#2563eb" strokeWidth={1.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 180, display: 'flex', alignItems: 'center' }}>
                <EmptyState loading={agg.loading} />
              </div>
            )}
          </div>

          <div style={{ flex: 1, minWidth: 220, border: '0.5px solid #e5e5e5', borderRadius: 8, padding: '18px 20px' }}>
            <SectionTitle>dönüşüm oranı dökümü</SectionTitle>
            {agg.funnel.map(step => (
              <div key={step.key} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: '#555' }}>{step.label}</span>
                  <span style={{ color: '#888' }}>{fmt.format(step.count)}</span>
                </div>
                <div style={{ height: 6, background: '#f0f0f0', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 3,
                    width: `${Math.min(step.pct, 100)}%`,
                    background: step.key === 'purchase' ? '#639922' : '#2563eb',
                    transition: 'width 0.4s ease',
                  }} />
                </div>
                <div style={{ fontSize: 10, color: '#aaa', marginTop: 2 }}>%{step.pct}</div>
              </div>
            ))}
            {agg.funnel.length === 0 && <EmptyState loading={agg.loading} />}
          </div>
        </div>

        {/* Orders bar + revenue breakdown */}
        <div style={{ display: 'flex', gap: 12, marginBottom: '2.5rem', flexWrap: 'wrap' }}>

          <div style={{ flex: 2, minWidth: 280, border: '0.5px solid #e5e5e5', borderRadius: 8, padding: '18px 20px' }}>
            <SectionTitle>zamana göre siparişler</SectionTitle>
            {agg.dailyStats.length > 0 ? (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={agg.dailyStats} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#aaa' }} tickFormatter={tickFormatter} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#aaa' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ fontFamily: 'monospace', fontSize: 12, border: '0.5px solid #e5e5e5', borderRadius: 6 }}
                    formatter={(v: number | undefined) => [fmt.format(v ?? 0), 'Sipariş']}
                  />
                  <Bar dataKey="purchases" fill="#2563eb" radius={[3, 3, 0, 0]} maxBarSize={20} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 160, display: 'flex', alignItems: 'center' }}>
                <EmptyState loading={agg.loading} />
              </div>
            )}
          </div>

          <div style={{ flex: 1, minWidth: 200, border: '0.5px solid #e5e5e5', borderRadius: 8, padding: '18px 20px' }}>
            <SectionTitle>toplam satış dökümü</SectionTitle>
            {[
              { label: 'Brüt satışlar',          value: safeTotalRevenue },
              { label: 'Ort. sipariş değ.',       value: safeAov },
              { label: 'Siparişler',              value: safeTotalOrders },
              { label: 'Sepete eklendi',          value: safeCartAddSessions },
              { label: 'Checkout başladı',        value: safeOdemeView },
              { label: 'Shopify ödeme sayfası',   value: safeCheckout },
              { label: 'Terk edilen sepet',       value: safeAbandonedCarts },
              { label: 'Sepet terk oranı',        value: safeAbandonmentRate },
              { label: 'Dönüşüm',                 value: safeConversionRate },
            ].map(row => (
              <div key={row.label} style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '7px 0', borderBottom: '0.5px solid #f0f0f0', fontSize: 12,
              }}>
                <span style={{ color: '#555' }}>{row.label}</span>
                <span style={{ color: '#333' }}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top products */}
        <div style={{ marginBottom: '2.5rem', border: '0.5px solid #e5e5e5', borderRadius: 8, padding: '18px 20px' }}>
          <SectionTitle>en çok satan ürünler ({rangeLabel})</SectionTitle>
          {agg.topProducts.length === 0 ? (
            <EmptyState loading={agg.loading} />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {agg.topProducts.map(({ name, revenue, orders }) => {
                const maxRev = agg.topProducts[0]?.revenue ?? 1;
                return (
                  <div key={name}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%', color: '#333' }}>
                        {name}
                      </span>
                      <span style={{ color: '#888', flexShrink: 0 }}>
                        {fmtCur.format(revenue)} · {fmt.format(orders)} sipariş
                      </span>
                    </div>
                    <div style={{ height: 4, background: '#f0f0f0', borderRadius: 2 }}>
                      <div style={{
                        height: '100%', borderRadius: 2,
                        width: `${(revenue / maxRev) * 100}%`,
                        background: '#639922',
                        transition: 'width 0.4s ease',
                      }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pages + Live events */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>

          <div style={{ flex: 1, minWidth: 240, border: '0.5px solid #e5e5e5', borderRadius: 8, padding: '18px 20px' }}>
            <SectionTitle>sayfalar (tüm zamanlar)</SectionTitle>
            {agg.topPages.length === 0 ? (
              <EmptyState loading={agg.loading} />
            ) : (
              agg.topPages.map(({ page, count }) => {
                const max = agg.topPages[0]?.count ?? 1;
                return (
                  <div key={page} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '75%' }}>
                        {page}
                      </span>
                      <span style={{ color: '#888', flexShrink: 0 }}>{fmt.format(count)}</span>
                    </div>
                    <div style={{ height: 4, background: '#f0f0f0', borderRadius: 2 }}>
                      <div style={{
                        height: '100%', borderRadius: 2,
                        width: `${(count / max) * 100}%`,
                        background: '#2563eb',
                      }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div style={{ flex: 1, minWidth: 240, border: '0.5px solid #e5e5e5', borderRadius: 8, padding: '18px 20px' }}>
            <SectionTitle>canlı olaylar</SectionTitle>
            {liveEvents.length === 0 ? (
              <div style={{ color: '#aaa', fontSize: 13 }}>olay bekleniyor...</div>
            ) : (
              liveEvents.map(ev => (
                <div
                  key={ev.id}
                  className={isNewEvent(ev.id) ? 'live-event-new' : undefined}
                  style={{
                    display: 'flex', gap: 10, padding: '7px 0',
                    borderBottom: '0.5px solid #f0f0f0', fontSize: 12, alignItems: 'baseline',
                  }}
                >
                  <span style={{ color: '#aaa', minWidth: 60, fontSize: 10, flexShrink: 0 }}>
                    {new Date(ev.ts).toLocaleTimeString('tr-TR')}
                  </span>
                  <span style={{ flexShrink: 0 }}>{EVENT_LABELS[String(ev.type)] ?? String(ev.type)}</span>
                  {ev.payload?.productTitle ? (
                    <span style={{ color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      — {String(ev.payload.productTitle)}
                    </span>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
