import { useState, type FormEvent } from 'react';
import { supabase } from '../lib/supabase';

interface ResetResult {
  success: boolean;
  before: string;
  deleted: Record<string, number>;
  errors: Record<string, string>;
}

const TABLE_LABELS: Record<string, string> = {
  analytics_events: 'olaylar',
  page_views: 'sayfa görüntülemeleri',
  active_sessions: 'aktif oturumlar',
};

// datetime-local girişi için yerel saatte "YYYY-MM-DDTHH:mm"
function toLocalInput(d: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const inputStyle = {
  fontFamily: 'monospace', fontSize: 12, padding: '6px 8px',
  border: '0.5px solid #e5e5e5', borderRadius: 4, outline: 'none',
} as const;

export default function AnalyticsReset() {
  const [before, setBefore] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ResetResult | null>(null);

  const maxValue = toLocalInput(new Date());

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    const beforeDate = new Date(before); // yerel saat olarak yorumlanır
    if (!before || Number.isNaN(beforeDate.getTime())) {
      setError('tarih ve saat seç');
      return;
    }
    if (beforeDate.getTime() > Date.now()) {
      setError('gelecekteki bir tarih seçilemez');
      return;
    }
    if (!password) {
      setError('şifre gerekli');
      return;
    }

    const label = beforeDate.toLocaleString('tr-TR', { dateStyle: 'long', timeStyle: 'short' });
    if (!window.confirm(`${label} öncesindeki TÜM analitik kayıtları kalıcı olarak silinecek. Bu işlem geri alınamaz. Devam edilsin mi?`)) {
      return;
    }

    setBusy(true);
    const { data, error: fnError } = await supabase.functions.invoke<ResetResult>('reset-analytics', {
      body: { password, before: beforeDate.toISOString() },
    });
    setBusy(false);

    if (fnError) {
      let message = fnError.message;
      try {
        const body = await (fnError as { context?: Response }).context?.json();
        if (body?.error) message = body.error;
      } catch { /* yanıt gövdesi okunamadı */ }
      setError(message);
      return;
    }

    setPassword('');
    setResult(data);
  };

  return (
    <div className="ad-card" style={{ marginTop: '2.5rem', border: '0.5px solid #f2c4bf', borderRadius: 8, padding: '18px 20px' }}>
      <div style={{ fontSize: 11, color: '#c0392b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
        veritabanı sıfırlama
      </div>
      <div style={{ fontSize: 12, color: '#888', marginBottom: 14 }}>
        Seçilen tarih ve saatten önceki olaylar, sayfa görüntülemeleri ve oturumlar kalıcı olarak silinir.
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="datetime-local"
          value={before}
          max={maxValue}
          onChange={(e) => { setBefore(e.target.value); setError(null); }}
          style={{ ...inputStyle, flex: '1 1 180px', minWidth: 0 }}
          aria-label="Bu tarih ve saatten öncesini sil"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError(null); }}
          placeholder="şifre"
          autoComplete="current-password"
          style={{ ...inputStyle, flex: '1 1 120px', minWidth: 0 }}
          aria-label="Analiz şifresi"
        />
        <button
          type="submit"
          disabled={busy}
          style={{
            fontFamily: 'monospace', fontSize: 11, cursor: busy ? 'wait' : 'pointer',
            padding: '7px 12px', borderRadius: 4,
            border: '0.5px solid #c0392b', background: busy ? '#e9a59d' : '#c0392b', color: '#fff',
            textTransform: 'uppercase', letterSpacing: '0.06em',
          }}
        >
          {busy ? 'siliniyor...' : 'öncesini sil'}
        </button>
      </form>

      {error && <div style={{ fontSize: 11, color: '#c0392b', marginTop: 10 }}>{error}</div>}

      {result && (
        <div style={{ fontSize: 12, color: '#555', marginTop: 12 }}>
          <div style={{ marginBottom: 4 }}>
            {new Date(result.before).toLocaleString('tr-TR')} öncesi silindi:
          </div>
          {Object.entries(result.deleted).map(([table, count]) => (
            <div key={table}>· {TABLE_LABELS[table] ?? table}: {count}</div>
          ))}
          {Object.entries(result.errors).map(([table, msg]) => (
            <div key={table} style={{ color: '#c0392b' }}>· {TABLE_LABELS[table] ?? table}: hata — {msg}</div>
          ))}
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              fontFamily: 'monospace', fontSize: 11, cursor: 'pointer', marginTop: 10,
              padding: '5px 10px', borderRadius: 4, border: '0.5px solid #e5e5e5',
              background: 'transparent', color: '#555',
            }}
          >
            grafikleri yenile
          </button>
        </div>
      )}
    </div>
  );
}
