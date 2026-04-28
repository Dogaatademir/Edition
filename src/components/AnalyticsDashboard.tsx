import { useRealtimeAnalytics } from '../hooks/useRealtimeAnalytics';

const EVENT_LABELS: Record<string, string> = {
  cart_add:        '🛒 Sepete eklendi',
  cart_remove:     '✕  Sepetten çıkarıldı',
  search:          '🔍 Arama yapıldı',
  checkout_start:  '💳 Checkout başladı',
  purchase:        '✅ Satın alındı',
  pixel_cart_add:  '🛒 Checkout (sepet)',
  pixel_page_view: '📄 Checkout (sayfa)',
};

export default function AnalyticsDashboard() {
  const { activeVisitors, topPages, liveEvents } = useRealtimeAnalytics();

  return (
    <div style={{ fontFamily: 'monospace', padding: '2rem', maxWidth: 800, margin: '0 auto' }}>
      {/* Başlık */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '2rem' }}>
        <span style={{
          display: 'inline-block', width: 8, height: 8,
          borderRadius: '50%', background: '#639922',
          boxShadow: '0 0 0 3px rgba(99,153,34,0.25)',
        }} />
        <span style={{ fontSize: 13, color: '#888', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          canlı analitik
        </span>
      </div>

      {/* Aktif ziyaretçi */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
          aktif ziyaretçi
        </div>
        <div style={{ fontSize: 56, fontWeight: 500, lineHeight: 1 }}>
          {activeVisitors}
        </div>
      </div>

      {/* En çok görüntülenen sayfalar */}
      <div style={{ marginBottom: '2.5rem' }}>
        <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
          sayfalar
        </div>
        {topPages.length === 0 && (
          <div style={{ color: '#aaa', fontSize: 13 }}>henüz veri yok</div>
        )}
        {topPages.map(({ page, count }) => (
          <div key={page} style={{ display: 'flex', justifyContent: 'space-between',
            padding: '8px 0', borderBottom: '0.5px solid #e5e5e5', fontSize: 13 }}>
            <span>{page}</span>
            <span style={{ color: '#888' }}>{count} kişi</span>
          </div>
        ))}
      </div>

      {/* Canlı olay akışı */}
      <div>
        <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
          canlı olaylar
        </div>
        {liveEvents.length === 0 && (
          <div style={{ color: '#aaa', fontSize: 13 }}>olay bekleniyor...</div>
        )}
        {liveEvents.map(ev => (
          <div key={ev.id} style={{ display: 'flex', gap: 12, padding: '8px 0',
            borderBottom: '0.5px solid #f0f0f0', fontSize: 13, alignItems: 'baseline' }}>
            <span style={{ color: '#aaa', minWidth: 64, fontSize: 11 }}>
              {new Date(ev.ts).toLocaleTimeString('tr-TR')}
            </span>
            
            {/* Hata önleyici 1: ev.type değerini güvenli bir şekilde String'e çevirdik */}
            <span>{EVENT_LABELS[String(ev.type)] ?? String(ev.type)}</span>
            
            {/* Hata önleyici 2: && yerine Ternary operatörü kullandık (? : null) */}
            {ev.payload?.productTitle ? (
              <span style={{ color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                — {String(ev.payload.productTitle)}
              </span>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}