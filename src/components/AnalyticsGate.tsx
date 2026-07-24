import { useState, type FormEvent, type ReactNode } from 'react';

const SESSION_KEY = 'analiz_authed';
const ADMIN_PASSWORD = import.meta.env.VITE_ANALYTICS_PASSWORD;

export default function AnalyticsGate({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(SESSION_KEY) === '1');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (ADMIN_PASSWORD && password === ADMIN_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, '1');
      setAuthed(true);
      setError(false);
    } else {
      setError(true);
    }
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
          onChange={(e) => { setPassword(e.target.value); setError(false); }}
          placeholder="şifre"
          style={{
            fontFamily: 'monospace', fontSize: 13, padding: '8px 10px',
            border: error ? '0.5px solid #c0392b' : '0.5px solid #e5e5e5',
            borderRadius: 4, outline: 'none',
          }}
        />
        {error && (
          <div style={{ fontSize: 11, color: '#c0392b' }}>şifre yanlış</div>
        )}
        <button
          type="submit"
          style={{
            fontFamily: 'monospace', fontSize: 12, cursor: 'pointer',
            padding: '8px 10px', borderRadius: 4,
            border: '0.5px solid #333', background: '#333', color: '#fff',
            textTransform: 'uppercase', letterSpacing: '0.06em',
          }}
        >
          Giriş
        </button>
      </form>
    </div>
  );
}
