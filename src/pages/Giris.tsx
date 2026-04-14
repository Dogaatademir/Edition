// src/pages/Giris.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Giris() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/hesap');
    }
  }, [isAuthenticated, navigate]);

  const handleLoginRedirect = () => {
    setLoading(true);
    // Shopify Yeni Müşteri Hesapları Login URL'ine yönlendirme
    window.location.href = 'https://account.editioncoffee.com.tr/account'; 
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-[#FFFFFF] px-4 py-20">
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-10">
          <div className="font-mono text-[0.55rem] tracking-[0.3em] uppercase text-[#888888] mb-4">
            ECR — Access
          </div>
          <h1 className="font-serif text-[2.5rem] leading-none text-[#000000] mb-4">Hesabınıza Erişin</h1>
          <p className="font-sans text-[0.85rem] text-[#888888] leading-relaxed">
            Edition Coffee Roastery olarak daha güvenli ve hızlı bir deneyim için şifresiz giriş sistemine geçtik. E-posta adresinize gönderilecek tek kullanımlık kod ile saniyeler içinde giriş yapabilir veya yeni kayıt oluşturabilirsiniz.
          </p>
        </div>

        <button
          onClick={handleLoginRedirect}
          disabled={loading}
          className="w-full bg-[#000000] text-[#FFFFFF] font-mono text-[0.65rem] tracking-[0.25em] uppercase py-5 hover:bg-[#333333] transition-all duration-300 disabled:opacity-50"
        >
          {loading ? 'Yönlendiriliyor...' : 'E-Posta İle Devam Et'}
        </button>

        <div className="mt-10 pt-6 border-t border-[#F5F5F5] flex flex-col items-center gap-2">
          <span className="font-mono text-[0.55rem] tracking-[0.1em] uppercase text-[#888888]">
            Şifre gerektirmez
          </span>
        </div>
      </div>
    </div>
  );
}