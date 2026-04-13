// src/pages/SifreYenile.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { resetCustomerPassword } from '../lib/shopify';
import { useAuth } from '../context/AuthContext';

export default function SifreYenile() {
  const { id, token } = useParams<{ id: string; token: string }>();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Shopify reset URL'i şu formattadır:
  // /account/reset/CUSTOMER_ID/TOKEN
  // id parametresi sayısal bir ID'dir, Shopify bunu GID formatına çevirmemizi bekler.
  const customerId = id ? `gid://shopify/Customer/${id}` : null;

  useEffect(() => {
    if (!id || !token) {
      navigate('/hesap/sifremi-unuttum');
    }
  }, [id, token, navigate]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 5) {
      setError('Şifre en az 5 karakter olmalıdır.');
      return;
    }

    if (password !== passwordConfirm) {
      setError('Şifreler eşleşmiyor.');
      return;
    }

    if (!customerId || !token) {
      setError('Geçersiz sıfırlama bağlantısı.');
      return;
    }

    setLoading(true);

    try {
      const response = await resetCustomerPassword(customerId, {
        password,
        resetToken: token,
      });

      if (response?.customerUserErrors && response.customerUserErrors.length > 0) {
        setError(response.customerUserErrors[0].message);
      } else if (response?.customerAccessToken) {
        // Şifre sıfırlama başarılı, otomatik giriş yap
        const { accessToken, expiresAt } = response.customerAccessToken;
        login(accessToken, expiresAt);
        setSuccess(true);
        setTimeout(() => navigate('/hesap'), 2000);
      } else {
        setError('Beklenmeyen bir hata oluştu. Bağlantınız geçersiz veya süresi dolmuş olabilir.');
      }
    } catch {
      setError('İşlem sırasında bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-[#FFFFFF] px-4 py-20">
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-10">
          <div className="font-mono text-[0.55rem] tracking-[0.3em] uppercase text-[#888888] mb-4">
            ECR — Reset
          </div>
          <h1 className="font-serif text-[2.5rem] leading-none text-[#000000] mb-4">Yeni Şifre</h1>
          <p className="font-sans text-[0.85rem] text-[#888888]">
            Hesabınız için yeni bir şifre belirleyin.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 border border-black bg-[#FAFAFA] font-mono text-[0.7rem] text-black text-center uppercase tracking-wider">
            {error}
          </div>
        )}

        {success ? (
          <div className="mb-6 p-6 border border-black bg-[#FAFAFA] text-center">
            <p className="font-sans text-[0.9rem] text-black mb-2">Şifreniz başarıyla güncellendi.</p>
            <p className="font-mono text-[0.65rem] tracking-[0.1em] uppercase text-[#888888]">
              Hesabınıza yönlendiriliyorsunuz...
            </p>
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-6">
            <div className="space-y-1">
              <label className="font-mono text-[0.55rem] tracking-[0.2em] uppercase text-[#555555]">
                Yeni Şifre
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border-b border-[#E5E5E5] py-3 bg-transparent outline-none focus:border-[#000000] transition-colors font-sans text-sm"
                placeholder="En az 5 karakter"
              />
            </div>

            <div className="space-y-1">
              <label className="font-mono text-[0.55rem] tracking-[0.2em] uppercase text-[#555555]">
                Şifre Tekrar
              </label>
              <input
                type="password"
                required
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                className="w-full border-b border-[#E5E5E5] py-3 bg-transparent outline-none focus:border-[#000000] transition-colors font-sans text-sm"
                placeholder="Şifrenizi tekrar girin"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#000000] text-[#FFFFFF] font-mono text-[0.65rem] tracking-[0.25em] uppercase py-5 hover:bg-[#333333] transition-all duration-300 disabled:opacity-50"
            >
              {loading ? 'Güncelleniyor...' : 'Şifremi Güncelle'}
            </button>
          </form>
        )}

        <div className="mt-12 pt-8 border-t border-[#F5F5F5] flex flex-col items-center gap-4">
          <Link
            to="/hesap/giris"
            className="font-mono text-[0.6rem] tracking-[0.2em] uppercase text-[#000000] border-b border-black pb-1 hover:text-[#888888] hover:border-[#888888] transition-all"
          >
            Giriş Sayfasına Dön
          </Link>
        </div>
      </div>
    </div>
  );
}
