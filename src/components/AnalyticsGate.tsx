import { useState, type FormEvent, type ReactNode } from 'react';
import { useSeo } from '../hooks/useSeo';
import { supabase } from '../lib/supabase';
import { ANALIZ_PASSWORD_KEY } from '../hooks/useAnalyticsData';

// Şifre sunucuda (analytics-data fonksiyonu) kontrol edilir; sitenin koduna gömülmez.
// Doğrulanan şifre yalnızca bu sekme için sessionStorage'da tutulur ve veri isteklerinde gönderilir.

export default function AnalyticsGate({ children }: { children: ReactNode }) {
  useSeo('Analiz | Edition Coffee Roastery', 'Yönetim paneli.', undefined, null, true);
  const [authed, setAuthed] = useState(() => !!sessionStorage.getItem(ANALIZ_PASSWORD_KEY));
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!password || busy) return;
    setBusy(true);
    const { error: fnError } = await supabase.functions.invoke('analytics-data', {
      body: { password, mode: 'check' },
    });
    setBusy(false);
    if (fnError) {
      const status = (fnError as { context?: Response }).context?.status;
      setError(status === 401 ? 'şifre yanlış' : 'sunucuya ulaşılamadı');
      return;
    }
    sessionStorage.setItem(ANALIZ_PASSWORD_KEY, password);
    setAuthed(true);
    setError(null);
  };

  if (authed) return <>{children}</>;

  return (
    <div style={{
      fontFamily: 'monospace', minHeight: '60vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex', flexDirection: 'column', gap: 12,
          width: 280, padding: '28px 24px',
          border: '0.5px solid #e5e5e5', borderRadius: 8,
        }}
      >
        <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
          Analiz Girişi
        </div>
        <input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError(null); }}
          placeholder="şifre"
          style={{
            fontFamily: 'monospace', fontSize: 13, padding: '8px 10px',
            border: error ? '0.5px solid #c0392b' : '0.5px solid #e5e5e5',
            borderRadius: 4, outline: 'none',
          }}
        />
        {error && (
          <div style={{ fontSize: 11, color: '#c0392b' }}>{error}</div>
        )}
        <button
          type="submit"
          disabled={busy}
          style={{
            fontFamily: 'monospace', fontSize: 12, cursor: 'pointer',
            padding: '8px 10px', borderRadius: 4,
            border: '0.5px solid #333', background: '#333', color: '#fff',
            textTransform: 'uppercase', letterSpacing: '0.06em',
          }}
        >
          {busy ? 'kontrol ediliyor...' : 'Giriş'}
        </button>
      </form>
    </div>
  );
}
