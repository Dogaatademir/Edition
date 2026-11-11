import { useState, useRef, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  useAnalyticsData, type DateRange, type BreakdownRow, type RankedItem,
} from '../hooks/useAnalyticsData';
import AnalyticsReset from './AnalyticsReset';

const EVENT_LABELS: Record<string, string> = {
  cart_add:       '🛒 Sepete eklendi',
  cart_remove:    '✕  Sepetten çıkarıldı',
  search:         '🔍 Arama yapıldı',
  checkout_start: '💳 Shopify ödemesine geçti',
  purchase:       '✅ Sipariş tamamlandı',
  pixel_cart_add: '🛒 Sepete eklendi (Shopify)',
  pixel_page_view: '📄 Shopify sayfa görüntülendi',
};

const RANGE_LABELS: Record<DateRange, string> = {
  today: 'bugün',
  week:  'son 7 gün',
  month: 'bu ay',
};

const COMPARE_LABELS: Record<DateRange, string> = {
  today: 'düne göre (aynı saate kadar)',
  week:  'önceki 7 güne göre',
  month: 'geçen ayın aynı dönemine göre',
};

const SOURCE_LABELS: Record<string, string> = {
  direkt: 'Direkt / yer imi',
  google: 'Google (organik)',
  google_ads: 'Google Ads',
  meta_ads: 'Meta reklamları',
  instagram: 'Instagram',
  facebook: 'Facebook',
  whatsapp: 'WhatsApp',
  bilinmiyor: 'Bilinmiyor (eski kayıt)',
};

const BLUE = '#2563eb';
const GREEN = '#639922';
const RED = '#c0392b';
const GREY = '#9ca3af';

const fmt = new Intl.NumberFormat('tr-TR');
const fmtCur = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY', minimumFractionDigits: 2 });
const fmtPct = (n: number, d = 1) => `%${n.toFixed(d)}`;

// ─── Küçük bileşenler ─────────────────────────────────────────────────────────

const cardStyle = { border: '0.5px solid #e5e5e5', borderRadius: 8, padding: '18px 20px' } as const;

function EmptyState({ loading, text = 'henüz veri yok' }: { loading: boolean; text?: string }) {
  return <div style={{ color: '#aaa', fontSize: 13 }}>{loading ? 'yükleniyor...' : text}</div>;
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14 }}>
      {children}
    </div>
  );
}

/** Önceki döneme göre değişim. `lowerIsBetter` terk oranları gibi düşmesi iyi olan metrikler için. */
function Delta({ current, previous, lowerIsBetter = false, points = false }: {
  current: number; previous: number; lowerIsBetter?: boolean; points?: boolean;
}) {
  if (previous === 0 && current === 0) return <span style={{ color: '#bbb' }}>değişim yok</span>;
  if (previous === 0) return <span style={{ color: '#bbb' }}>önceki: 0</span>;
  const diff = points ? current - previous : ((current - previous) / previous) * 100;
  if (Math.abs(diff) < 0.05) return <span style={{ color: '#bbb' }}>değişim yok</span>;
  const good = lowerIsBetter ? diff < 0 : diff > 0;
  return (
    <span style={{ color: good ? GREEN : RED }}>
      {diff > 0 ? '▲' : '▼'} {points ? `${Math.abs(diff).toFixed(1)} puan` : `%${Math.abs(diff).toFixed(0)}`}
    </span>
  );
}

function KpiCard({ label, value, sub, tooltip, delta }: {
  label: string; value: string; sub?: ReactNode; tooltip?: string; delta?: ReactNode;
}) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ flex: '1 1 180px', minWidth: 0, padding: '18px 20px', border: '0.5px solid #e5e5e5', borderRadius: 8, position: 'relative' }}>
      <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
        {label}
        {tooltip && (
          <span
            onMouseEnter={() => setShow(true)}
            onMouseLeave={() => setShow(false)}
            onClick={() => setShow((s) => !s)}
            style={{ cursor: 'help', color: '#bbb', fontSize: 10, lineHeight: 1, userSelect: 'none' }}
          >
            ⓘ
          </span>
        )}
      </div>
      <div style={{ fontSize: 28, fontWeight: 500, lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>{sub}</div>}
      {delta && <div style={{ fontSize: 11, marginTop: 4 }}>{delta}</div>}
      {tooltip && show && (
        <span style={{
          position: 'absolute', top: '100%', left: 0, zIndex: 10,
          background: '#1a1a1a', color: '#eee', fontSize: 11, lineHeight: 1.5, padding: '8px 12px',
          borderRadius: 6, width: 280, maxWidth: '80vw', whiteSpace: 'normal',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)', marginTop: 4,
        }}>
          {tooltip}
        </span>
      )}
    </div>
  );
}

function BreakdownTable({ rows, labelFor, loading }: {
  rows: BreakdownRow[]; labelFor: (key: string) => string; loading: boolean;
}) {
  if (rows.length === 0) return <EmptyState loading={loading} />;
  const th = { textAlign: 'right' as const, fontWeight: 400, color: '#aaa', padding: '0 0 8px 8px', fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: '0.06em' };
  const td = { textAlign: 'right' as const, padding: '7px 0 7px 8px', borderTop: '0.5px solid #f0f0f0', color: '#333', whiteSpace: 'nowrap' as const };
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr>
            <th style={{ ...th, textAlign: 'left', paddingLeft: 0 }}></th>
            <th style={th}>ziyaret</th>
            <th style={th} title="Yalnızca çerez onayı veren ziyaretçiler">sepet*</th>
            <th style={th}>sipariş</th>
            <th style={th}>dönüşüm</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key}>
              <td style={{ ...td, textAlign: 'left', paddingLeft: 0, color: '#555', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {labelFor(r.key)}
              </td>
              <td style={td}>{fmt.format(r.visits)}</td>
              <td style={td}>{fmt.format(r.carts)}</td>
              <td style={td}>{fmt.format(r.orders)}</td>
              <td style={td}>{fmtPct(r.convRate, 1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RankedBars({ items, loading, color = BLUE, valueFor, empty }: {
  items: RankedItem[]; loading: boolean; color?: string; valueFor: (i: RankedItem) => string; empty?: string;
}) {
  if (items.length === 0) return <EmptyState loading={loading} text={empty} />;
  const max = Math.max(...items.map((i) => i.revenue ?? i.count), 1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {items.map((i) => (
        <div key={i.name}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 12, marginBottom: 3 }}>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#333' }}>{i.name}</span>
            <span style={{ color: '#888', flexShrink: 0 }}>{valueFor(i)}</span>
          </div>
          <div style={{ height: 4, background: '#f0f0f0', borderRadius: 2 }}>
            <div style={{ height: '100%', borderRadius: 2, width: `${((i.revenue ?? i.count) / max) * 100}%`, background: color, transition: 'width 0.4s ease' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

const tooltipStyle = { fontFamily: 'monospace', fontSize: 12, border: '0.5px solid #e5e5e5', borderRadius: 6 };

// ─── Panel ────────────────────────────────────────────────────────────────────

export default function AnalyticsDashboard() {
  const [dateRange, setDateRange] = useState<DateRange>('month');
  const data = useAnalyticsData(dateRange);
  const { current: cur, previous: prev, loading } = data;

  // Canlı olaylarda yeni gelenleri kısa süre vurgula
  const [seenEventIds, setSeenEventIds] = useState<Set<number> | null>(null);
  const pendingRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (data.liveEvents.length === 0) return;
    pendingRef.current = setTimeout(() => {
      setSeenEventIds((prevSeen) => {
        const next = new Set(prevSeen ?? []);
        data.liveEvents.forEach((e) => next.add(e.id));
        return next;
      });
    }, prevSeenDelay(seenEventIds));
    return () => { if (pendingRef.current) clearTimeout(pendingRef.current); };
  }, [data.liveEvents]); // eslint-disable-line react-hooks/exhaustive-deps
  const isNewEvent = useCallback(
    (id: number) => seenEventIds !== null && !seenEventIds.has(id),
    [seenEventIds],
  );

  const rangeLabel = RANGE_LABELS[dateRange];
  const compareLabel = COMPARE_LABELS[dateRange];
  const timeLabel = data.lastUpdated
    ? data.lastUpdated.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    : '—';
  const show = (value: string) => (loading && !data.lastUpdated ? '—' : value);

  const tickSkip = useMemo(() => (data.daily.length <= 7 ? 1 : 5), [data.daily.length]);
  const tickFormatter = useCallback((val: string, idx: number) => (idx % tickSkip === 0 ? val : ''), [tickSkip]);

  const trackingSinceLabel = data.trackingSince
    ? new Date(data.trackingSince).toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' })
    : null;

  return (
    <>
      <style>{`
        @keyframes flashGreen { 0% { background: rgba(99,153,34,0.18); } 100% { background: transparent; } }
        .live-event-new { animation: flashGreen 1.8s ease forwards; }
      `}</style>

      <div style={{ fontFamily: 'monospace', padding: '2rem 16px', maxWidth: 960, margin: '0 auto' }}>

        {/* Başlık */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              display: 'inline-block', width: 8, height: 8, borderRadius: '50%',
              background: data.error ? RED : data.lastUpdated ? GREEN : '#ccc',
              boxShadow: data.lastUpdated && !data.error ? '0 0 0 3px rgba(99,153,34,0.25)' : 'none',
            }} />
            <span style={{ fontSize: 13, color: '#888', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              {data.error ? 'bağlantı hatası' : 'canlı analitik'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 4 }}>
              {(['today', 'week', 'month'] as DateRange[]).map((r) => (
                <button
                  key={r}
                  onClick={() => setDateRange(r)}
                  style={{
                    fontFamily: 'monospace', fontSize: 11, cursor: 'pointer', padding: '4px 10px', borderRadius: 4,
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

        {data.error && (
          <div style={{ fontSize: 12, color: RED, border: `0.5px solid ${RED}`, borderRadius: 6, padding: '8px 12px', marginBottom: '1rem' }}>
            Veriler alınamadı: {data.error}
          </div>
        )}

        <div style={{ fontSize: 11, color: '#aaa', marginBottom: '1.5rem', lineHeight: 1.6 }}>
          Değişimler {compareLabel}. Çerez onayı vermeyen ziyaretçiler kimliksiz sayılır; sepet ve ödeme adımları yalnızca onay verenlerde izlenir.
        </div>

        {/* KPI — satır 1 */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
          <KpiCard label="aktif ziyaretçi" value={String(data.activeVisitors)} sub="şu an · yalnızca onaylı" />
          <KpiCard
            label="ziyaretler"
            value={show(fmt.format(cur.visits))}
            sub={show(`${fmt.format(cur.consentedSessions)} onaylı · ${fmt.format(cur.anonVisits)} onaysız`)}
            tooltip="Onay veren ziyaretçilerin oturumları + onay vermeyenlerin kimliksiz sayılan ziyaretleri. Onaysız ziyaretler sayfa yüklemesi başına sayıldığından (yenileme dahil) tahminidir."
            delta={<Delta current={cur.visits} previous={prev.visits} />}
          />
          <KpiCard label="siparişler" value={show(fmt.format(cur.orders))} sub={rangeLabel} delta={<Delta current={cur.orders} previous={prev.orders} />} />
          <KpiCard label="brüt satışlar" value={show(fmtCur.format(cur.revenue))} sub={rangeLabel} delta={<Delta current={cur.revenue} previous={prev.revenue} />} />
        </div>

        {/* KPI — satır 2 */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
          <KpiCard
            label="dönüşüm oranı"
            value={show(fmtPct(cur.conversionRate, 2))}
            sub="sipariş / toplam ziyaret"
            tooltip="Tüm siparişlerin, onaylı ve onaysız tüm ziyaretlere oranı."
            delta={<Delta current={cur.conversionRate} previous={prev.conversionRate} points />}
          />
          <KpiCard label="ort. sipariş değeri" value={show(fmtCur.format(cur.aov))} sub={rangeLabel} delta={<Delta current={cur.aov} previous={prev.aov} />} />
          <KpiCard
            label="sepette kalan"
            value={show(fmt.format(cur.cartAbandoned))}
            sub={show(`${fmtPct(cur.cartAbandonRate)} sepete ekleyenlerin`)}
            tooltip="Sepete en az bir ürün ekleyip Shopify ödemesine hiç geçmeyen oturum sayısı (yalnızca onaylı ziyaretçiler). Oran: sepette kalan / sepete ekleyen oturum."
            delta={<Delta current={cur.cartAbandonRate} previous={prev.cartAbandonRate} lowerIsBetter points />}
          />
          <KpiCard
            label="ödemede vazgeçen"
            value={show(fmt.format(cur.checkoutAbandoned))}
            sub={show(`${fmtPct(cur.checkoutAbandonRate)} ödemeye geçenlerin`)}
            tooltip="Shopify ödemesine geçip sipariş vermeyen oturum sayısı (yalnızca onaylı ziyaretçiler). Oran: ödemede vazgeçen / Shopify ödemesine geçen oturum."
            delta={<Delta current={cur.checkoutAbandonRate} previous={prev.checkoutAbandonRate} lowerIsBetter points />}
          />
        </div>

        {/* KPI — satır 3: onay */}
        <div style={{ display: 'flex', gap: 12, marginBottom: '2.5rem', flexWrap: 'wrap' }}>
          <KpiCard
            label="çerez onay oranı"
            value={show(fmtPct(cur.consentRate))}
            sub="analitik çerezlerine onay veren ziyaret"
            tooltip="Onaylı oturum / toplam ziyaret. Düşükse sepet, ödeme ve kaynak dökümleri ziyaretçilerin küçük bir kısmını temsil eder."
            delta={<Delta current={cur.consentRate} previous={prev.consentRate} points />}
          />
        </div>

        {/* Ziyaretler */}
        <div style={{ ...cardStyle, marginBottom: '2.5rem' }}>
          <SectionTitle>zamana göre ziyaretler</SectionTitle>
          {data.daily.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={data.daily} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#aaa' }} tickFormatter={tickFormatter} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#aaa' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} formatter={(v: number | undefined, name) => [fmt.format(v ?? 0), name]} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Area type="monotone" dataKey="consented" name="Onaylı" stackId="v" stroke={BLUE} fill={BLUE} fillOpacity={0.25} strokeWidth={1.5} />
                <Area type="monotone" dataKey="anonymous" name="Onaysız" stackId="v" stroke={GREY} fill={GREY} fillOpacity={0.2} strokeWidth={1.5} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 220, display: 'flex', alignItems: 'center' }}><EmptyState loading={loading} /></div>
          )}
        </div>

        {/* Dönüşüm + huni */}
        <div style={{ display: 'flex', gap: 12, marginBottom: '2.5rem', flexWrap: 'wrap' }}>
          <div style={{ ...cardStyle, flex: '2 1 280px', minWidth: 0 }}>
            <SectionTitle>zamana göre dönüşüm oranı</SectionTitle>
            {data.daily.length > 0 ? (
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={data.daily} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#aaa' }} tickFormatter={tickFormatter} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#aaa' }} axisLine={false} tickLine={false} unit="%" />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number | undefined) => [`%${v ?? 0}`, 'Dönüşüm']} />
                  <Line type="monotone" dataKey="convRate" stroke={BLUE} strokeWidth={1.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 180, display: 'flex', alignItems: 'center' }}><EmptyState loading={loading} /></div>
            )}
          </div>

          <div style={{ ...cardStyle, flex: '1 1 220px', minWidth: 0 }}>
            <SectionTitle>satın alma hunisi (onaylı)</SectionTitle>
            {data.funnel.map((step) => (
              <div key={step.key} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: '#555' }}>{step.label}</span>
                  <span style={{ color: '#888' }}>{fmt.format(step.count)}</span>
                </div>
                <div style={{ height: 6, background: '#f0f0f0', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 3, width: `${Math.min(step.pct, 100)}%`, background: step.key === 'purchase' ? GREEN : BLUE, transition: 'width 0.4s ease' }} />
                </div>
                <div style={{ fontSize: 10, color: '#aaa', marginTop: 2 }}>%{step.pct}</div>
              </div>
            ))}
            {data.funnel.length === 0 && <EmptyState loading={loading} />}
          </div>
        </div>

        {/* Siparişler + özet */}
        <div style={{ display: 'flex', gap: 12, marginBottom: '2.5rem', flexWrap: 'wrap' }}>
          <div style={{ ...cardStyle, flex: '2 1 280px', minWidth: 0 }}>
            <SectionTitle>zamana göre siparişler</SectionTitle>
            {data.daily.length > 0 ? (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={data.daily} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#aaa' }} tickFormatter={tickFormatter} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#aaa' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number | undefined) => [fmt.format(v ?? 0), 'Sipariş']} />
                  <Bar dataKey="orders" fill={BLUE} radius={[3, 3, 0, 0]} maxBarSize={20} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 160, display: 'flex', alignItems: 'center' }}><EmptyState loading={loading} /></div>
            )}
          </div>

          <div style={{ ...cardStyle, flex: '1 1 220px', minWidth: 0 }}>
            <SectionTitle>özet ({rangeLabel})</SectionTitle>
            {[
              { label: 'Ziyaretler',              value: fmt.format(cur.visits) },
              { label: '· onaylı oturum',          value: fmt.format(cur.consentedSessions) },
              { label: '· onaysız ziyaret',        value: fmt.format(cur.anonVisits) },
              { label: 'Sepete ekleyen oturum',   value: fmt.format(cur.cartSessions) },
              { label: 'Shopify ödemesine geçti', value: fmt.format(cur.checkoutSessions) },
              { label: 'Siparişler',              value: fmt.format(cur.orders) },
              { label: 'Brüt satışlar',           value: fmtCur.format(cur.revenue) },
              { label: 'Sepette kalma oranı',     value: fmtPct(cur.cartAbandonRate) },
              { label: 'Ödemede vazgeçme oranı',  value: fmtPct(cur.checkoutAbandonRate) },
              { label: 'Dönüşüm',                 value: fmtPct(cur.conversionRate, 2) },
            ].map((row) => (
              <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '7px 0', borderBottom: '0.5px solid #f0f0f0', fontSize: 12 }}>
                <span style={{ color: '#555' }}>{row.label}</span>
                <span style={{ color: '#333' }}>{show(row.value)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Kaynaklar + cihazlar */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
          <div style={{ ...cardStyle, flex: '3 1 320px', minWidth: 0 }}>
            <SectionTitle>trafik kaynakları</SectionTitle>
            <BreakdownTable rows={data.sources} loading={loading} labelFor={(k) => SOURCE_LABELS[k] ?? k} />
          </div>
          <div style={{ ...cardStyle, flex: '2 1 260px', minWidth: 0 }}>
            <SectionTitle>cihazlar</SectionTitle>
            <BreakdownTable rows={data.devices} loading={loading} labelFor={(k) => SOURCE_LABELS[k] ?? k} />
          </div>
        </div>
        <div style={{ fontSize: 10, color: '#aaa', marginBottom: '2.5rem', lineHeight: 1.6 }}>
          * Sepet yalnızca onaylı ziyaretçilerde izlenir.
          {trackingSinceLabel
            ? ` Kaynak ve cihaz bilgisi ${trackingSinceLabel} itibarıyla toplanıyor; daha eski oturumlar "bilinmiyor" görünür.`
            : ' Kaynak ve cihaz bilgisi yeni sürüm yayınlandıktan sonra toplanmaya başlar.'}
        </div>

        {/* Ürünler */}
        <div style={{ display: 'flex', gap: 12, marginBottom: '2.5rem', flexWrap: 'wrap' }}>
          <div style={{ ...cardStyle, flex: '1 1 280px', minWidth: 0 }}>
            <SectionTitle>en çok satan ürünler ({rangeLabel})</SectionTitle>
            <RankedBars
              items={data.topProducts}
              loading={loading}
              color={GREEN}
              valueFor={(i) => `${i.revenue ? fmtCur.format(i.revenue) + ' · ' : ''}${fmt.format(i.count)} adet`}
            />
            {data.topProducts.some((p) => p.name === 'Ürün bilgisi yok') && (
              <div style={{ fontSize: 10, color: '#aaa', marginTop: 10 }}>
                &quot;Ürün bilgisi yok&quot;: Shopify pixel&apos;i güncellenmeden önceki siparişler.
              </div>
            )}
          </div>
          <div style={{ ...cardStyle, flex: '1 1 280px', minWidth: 0 }}>
            <SectionTitle>en çok sepete eklenen ({rangeLabel})</SectionTitle>
            <RankedBars items={data.topCartProducts} loading={loading} valueFor={(i) => `${fmt.format(i.count)} adet`} />
          </div>
        </div>

        {/* Sayfalar + canlı olaylar */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ ...cardStyle, flex: '1 1 260px', minWidth: 0 }}>
            <SectionTitle>sayfa görüntülemeleri ({rangeLabel}, onaylı)</SectionTitle>
            <RankedBars items={data.topPages} loading={loading} valueFor={(i) => fmt.format(i.count)} />
          </div>

          <div style={{ ...cardStyle, flex: '1 1 260px', minWidth: 0 }}>
            <SectionTitle>son olaylar</SectionTitle>
            {data.liveEvents.length === 0 ? (
              <EmptyState loading={loading} text="olay bekleniyor..." />
            ) : (
              data.liveEvents.map((ev) => (
                <div
                  key={ev.id}
                  className={isNewEvent(ev.id) ? 'live-event-new' : undefined}
                  style={{ display: 'flex', gap: 10, padding: '7px 0', borderBottom: '0.5px solid #f0f0f0', fontSize: 12, alignItems: 'baseline' }}
                >
                  <span style={{ color: '#aaa', minWidth: 60, fontSize: 10, flexShrink: 0 }}>
                    {new Date(ev.ts).toLocaleTimeString('tr-TR')}
                  </span>
                  <span style={{ flexShrink: 0 }}>{EVENT_LABELS[ev.type] ?? ev.type}</span>
                  {ev.payload?.productTitle ? (
                    <span style={{ color: '#888', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      — {String(ev.payload.productTitle)}
                    </span>
                  ) : ev.type === 'purchase' && ev.payload?.total ? (
                    <span style={{ color: '#888' }}>— {fmtCur.format(Number(ev.payload.total))}</span>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </div>

        <AnalyticsReset />
      </div>
    </>
  );
}

// İlk yüklemede olayları hemen "görüldü" say (vurgulama yok), sonrakilerde animasyon bitince
function prevSeenDelay(seen: Set<number> | null) {
  return seen === null ? 0 : 1800;
}
