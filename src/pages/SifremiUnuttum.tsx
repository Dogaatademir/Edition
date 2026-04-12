// src/pages/SifremiUnuttum.tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { recoverCustomerPassword } from '../lib/shopify';

export default function SifremiUnuttum() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRecover = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await recoverCustomerPassword(email);
      
      if (response?.customerUserErrors && response.customerUserErrors.length > 0) {
        setError(response.customerUserErrors[0].message);
      } else {
        setMessage('Şifre sıfırlama bağlantısı e-posta adresinize gönderildi. Lütfen gelen kutunuzu kontrol edin.');
        setEmail(''); // Formu temizle
      }
    } catch (err) {
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
            ECR — Recovery
          </div>
          <h1 className="font-serif text-[2.5rem] leading-none text-[#000000] mb-4">Şifre Yenileme</h1>
          <p className="font-sans text-[0.85rem] text-[#888888]">
            Hesabınıza kayıtlı e-posta adresini girin. Size şifrenizi sıfırlamanız için bir bağlantı göndereceğiz.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 border border-black bg-[#FAFAFA] font-mono text-[0.7rem] text-black text-center uppercase tracking-wider">
            {error}
          </div>
        )}

        {message ? (
          <div className="mb-6 p-6 border border-black bg-[#FAFAFA] text-center">
            <p className="font-sans text-[0.9rem] text-black mb-6">{message}</p>
            <Link to="/hesap/giris" className="font-mono text-[0.65rem] tracking-[0.2em] uppercase text-[#FFFFFF] bg-[#000000] px-8 py-3 hover:bg-[#333333] transition-colors inline-block">
              Giriş Sayfasına Dön
            </Link>
          </div>
        ) : (
          <form onSubmit={handleRecover} className="space-y-6">
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

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-[#000000] text-[#FFFFFF] font-mono text-[0.65rem] tracking-[0.25em] uppercase py-5 hover:bg-[#333333] transition-all duration-300 disabled:opacity-50"
            >
              {loading ? 'Gönderiliyor...' : 'Bağlantı Gönder'}
            </button>
          </form>
        )}

        <div className="mt-12 pt-8 border-t border-[#F5F5F5] flex flex-col items-center gap-4">
          <Link to="/hesap/giris" className="font-mono text-[0.6rem] tracking-[0.2em] uppercase text-[#000000] border-b border-black pb-1 hover:text-[#888888] hover:border-[#888888] transition-all">
            İptal Et ve Geri Dön
          </Link>
        </div>
      </div>
    </div>
  );
}