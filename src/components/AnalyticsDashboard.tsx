import { useState, useRef, useEffect } from 'react';
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

const fmt    = new Intl.NumberFormat('tr-TR');
const fmtCur = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 2 });

function KpiCard({ label, value, sub, tooltip }: { label: string; value: string; sub?: string; tooltip?: string }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{
      flex: 1, minWidth: 0, padding: '18px 20px',
      border: '0.5px solid #e5e5e5', borderRadius: 8,
      position: 'relative',
    }}>
      <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
        {label}
        {tooltip && (
          <span
            onMouseEnter={() => setShow(true)}
            onMouseLeave={() => setShow(false)}
            style={{ cursor: 'default', color: '#ccc', fontSize: 10, lineHeight: 1, userSelect: 'none' }}
          >
            ⓘ
            {show && (
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
          </span>
        )}
      </div>
      <div style={{ fontSize: 28, fontWeight: 500, lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>{sub}</div>}
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

  // Track which event ids were present on initial load so new ones can be animated
  const initialEventIds = useRef<Set<number> | null>(null);
  useEffect(() => {
    if (initialEventIds.current === null && liveEvents.length > 0) {
      initialEventIds.current = new Set(liveEvents.map(e => e.id));
    }
  }, [liveEvents]);
  const isNewEvent = (id: number) =>
    initialEventIds.current !== null && !initialEventIds.current.has(id);

  const rangeLabel = RANGE_LABELS[dateRange];
  const timeLabel  = agg.lastUpdated
    ? agg.lastUpdated.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    : '—';

  const tickSkip      = agg.dailyStats.length <= 7 ? 1 : 5;
  const tickFormatter = (val: string, idx: number) => idx % tickSkip === 0 ? val : '';

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
          <KpiCard label="aktif ziyaretçi"  value={String(activeVisitors)}                                       sub="şu an" />
          <KpiCard label="oturumlar"        value={agg.loading ? '—' : fmt.format(agg.totalSessions)}            sub={rangeLabel} />
          <KpiCard label="siparişler"       value={agg.loading ? '—' : fmt.format(agg.totalOrders)}              sub={rangeLabel} />
          <KpiCard label="brüt satışlar"    value={agg.loading ? '—' : fmtCur.format(agg.totalRevenue)}          sub={rangeLabel} />
        </div>

        {/* KPI Cards — row 2 */}
        <div style={{ display: 'flex', gap: 12, marginBottom: '2.5rem', flexWrap: 'wrap' }}>
          <KpiCard
            label="dönüşüm oranı"
            value={agg.loading ? '—' : `%${agg.conversionRate.toFixed(2)}`}
            sub={rangeLabel}
          />
          <KpiCard
            label="ort. sipariş değeri"
            value={agg.loading ? '—' : fmtCur.format(agg.aov)}
            sub={rangeLabel}
          />
          <KpiCard
            label="sepet terk oranı"
            value={agg.loading ? '—' : `%${agg.abandonmentRate.toFixed(1)}`}
            sub={rangeLabel}
            tooltip="Sepete ürün ekleyip ödeme adımına geçmeyen oturumların oranı. Formül: (sepete ekleyen - checkout başlatan) / sepete ekleyen × 100"
          />
          <KpiCard
            label="terk edilen sepet"
            value={agg.loading ? '—' : fmt.format(agg.abandonedCarts)}
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
            <div style={{ color: '#aaa', fontSize: 13, height: 200, display: 'flex', alignItems: 'center' }}>
              {agg.loading ? 'yükleniyor...' : 'henüz veri yok'}
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
              <div style={{ color: '#aaa', fontSize: 13, height: 180, display: 'flex', alignItems: 'center' }}>
                {agg.loading ? 'yükleniyor...' : 'henüz veri yok'}
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
            {agg.funnel.length === 0 && (
              <div style={{ color: '#aaa', fontSize: 13 }}>{agg.loading ? 'yükleniyor...' : 'henüz veri yok'}</div>
            )}
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
              <div style={{ color: '#aaa', fontSize: 13, height: 160, display: 'flex', alignItems: 'center' }}>
                {agg.loading ? 'yükleniyor...' : 'henüz veri yok'}
              </div>
            )}
          </div>

          <div style={{ flex: 1, minWidth: 200, border: '0.5px solid #e5e5e5', borderRadius: 8, padding: '18px 20px' }}>
            <SectionTitle>toplam satış dökümü</SectionTitle>
            {[
              { label: 'Brüt satışlar',          value: fmtCur.format(agg.totalRevenue) },
              { label: 'Ort. sipariş değ.',       value: fmtCur.format(agg.aov) },
              { label: 'Siparişler',              value: fmt.format(agg.totalOrders) },
              { label: 'Sepete eklendi',          value: fmt.format(agg.cartAddSessions) },
              { label: 'Checkout başladı',        value: fmt.format(agg.odemeViewSessions) },
              { label: 'Shopify ödeme sayfası',   value: fmt.format(agg.checkoutSessions) },
              { label: 'Terk edilen sepet',       value: fmt.format(agg.abandonedCarts) },
              { label: 'Sepet terk oranı',        value: `%${agg.abandonmentRate.toFixed(1)}` },
              { label: 'Dönüşüm',                 value: `%${agg.conversionRate.toFixed(2)}` },
            ].map(row => (
              <div key={row.label} style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '7px 0', borderBottom: '0.5px solid #f0f0f0', fontSize: 12,
              }}>
                <span style={{ color: '#555' }}>{row.label}</span>
                <span style={{ color: '#333' }}>{agg.loading ? '—' : row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top products */}
        <div style={{ marginBottom: '2.5rem', border: '0.5px solid #e5e5e5', borderRadius: 8, padding: '18px 20px' }}>
          <SectionTitle>en çok satan ürünler ({rangeLabel})</SectionTitle>
          {agg.topProducts.length === 0 ? (
            <div style={{ color: '#aaa', fontSize: 13 }}>{agg.loading ? 'yükleniyor...' : 'henüz veri yok'}</div>
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
              <div style={{ color: '#aaa', fontSize: 13 }}>{agg.loading ? 'yükleniyor...' : 'henüz veri yok'}</div>
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