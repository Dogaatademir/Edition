// src/pages/Giris.tsx
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { customerLogin } from '../lib/shopify';
import { useAuth } from '../context/AuthContext';

export default function Giris() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth(); // isAuthenticated eklendi

  // Eğer kullanıcı zaten giriş yapmışsa direkt hesaba yönlendir
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/hesap');
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await customerLogin(email, password);

      if (response.customerUserErrors && response.customerUserErrors.length > 0) {
        setError("E-posta veya şifre hatalı.");
      } else if (response.customerAccessToken) {
        const { accessToken, expiresAt } = response.customerAccessToken;
        login(accessToken, expiresAt);
        navigate('/hesap');
      }
    } catch (err) {
      setError('Bir bağlantı hatası oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-[#FFFFFF] px-4 py-20">
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-10">
          <div className="font-mono text-[0.55rem] tracking-[0.3em] uppercase text-[#888888] mb-4">
            ECR — Access
          </div>
          <h1 className="font-serif text-[2.5rem] leading-none text-[#000000]">Giriş Yap</h1>
        </div>

        {error && (
          <div className="mb-6 p-4 border border-black bg-[#FAFAFA] font-mono text-[0.7rem] text-black text-center uppercase tracking-wider">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-1">
            <label className="font-mono text-[0.55rem] tracking-[0.2em] uppercase text-[#555555]">E-Posta Adresi</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border-b border-[#E5E5E5] py-3 bg-transparent outline-none focus:border-[#000000] transition-colors font-sans text-sm placeholder:text-[#BBBBBB]"
              placeholder="email@example.com"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-end">
              <label className="font-mono text-[0.55rem] tracking-[0.2em] uppercase text-[#555555]">Şifre</label>
              <Link
                to="/hesap/sifremi-unuttum"
                className="font-mono text-[0.5rem] tracking-[0.1em] uppercase text-[#888888] hover:text-[#000000] transition-colors"
              >
                Şifremi Unuttum
              </Link>
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border-b border-[#E5E5E5] py-3 bg-transparent outline-none focus:border-[#000000] transition-colors font-sans text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#000000] text-[#FFFFFF] font-mono text-[0.65rem] tracking-[0.25em] uppercase py-5 hover:bg-[#333333] transition-all duration-300 disabled:opacity-50"
          >
            {loading ? 'Doğrulanıyor...' : 'Oturum Aç'}
          </button>
        </form>

        <div className="mt-12 pt-8 border-t border-[#F5F5F5] flex flex-col items-center gap-4">
          <p className="font-sans text-[0.85rem] text-[#888888]">Hesabınız yok mu?</p>
          <Link
            to="/hesap/kayit"
            className="font-mono text-[0.6rem] tracking-[0.2em] uppercase text-[#000000] border-b border-black pb-1 hover:text-[#888888] hover:border-[#888888] transition-all"
          >
            Kayıt Olun
          </Link>
        </div>
      </div>
    </div>
  );
}