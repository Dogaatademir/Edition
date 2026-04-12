// src/pages/Kayit.tsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { customerCreate } from '../lib/shopify';

export default function Kayit() {
  const [formData, setFormData] = useState({ firstName: '', lastName: '', email: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await customerCreate(
        formData.email, 
        formData.password, 
        formData.firstName, 
        formData.lastName,
        formData.phone
      );
      
      if (response.customerUserErrors && response.customerUserErrors.length > 0) {
        setError(response.customerUserErrors[0].message);
      } else {
        navigate('/hesap/giris', { state: { message: 'Hesabınız oluşturuldu. Lütfen giriş yapın.' } });
      }
    } catch (err) {
      setError('Kayıt işlemi sırasında bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-[#FFFFFF] px-4 py-20">
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-10">
          <div className="font-mono text-[0.55rem] tracking-[0.3em] uppercase text-[#888888] mb-4">
            ECR — Join
          </div>
          <h1 className="font-serif text-[2.5rem] leading-none text-[#000000]">Hesap Oluştur</h1>
        </div>

        {error && (
          <div className="mb-6 p-4 border border-black bg-[#FAFAFA] font-mono text-[0.7rem] text-black text-center uppercase tracking-wider">
            {error}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="font-mono text-[0.55rem] tracking-[0.2em] uppercase text-[#555555]">Ad</label>
              <input 
                type="text" 
                required
                value={formData.firstName}
                onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                className="w-full border-b border-[#E5E5E5] py-3 bg-transparent outline-none focus:border-[#000000] transition-colors font-sans text-sm placeholder:text-[#BBBBBB]"
              />
            </div>
            <div className="space-y-1">
              <label className="font-mono text-[0.55rem] tracking-[0.2em] uppercase text-[#555555]">Soyad</label>
              <input 
                type="text" 
                required
                value={formData.lastName}
                onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                className="w-full border-b border-[#E5E5E5] py-3 bg-transparent outline-none focus:border-[#000000] transition-colors font-sans text-sm placeholder:text-[#BBBBBB]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-mono text-[0.55rem] tracking-[0.2em] uppercase text-[#555555]">E-Posta Adresi</label>
            <input 
              type="email" 
              required
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full border-b border-[#E5E5E5] py-3 bg-transparent outline-none focus:border-[#000000] transition-colors font-sans text-sm placeholder:text-[#BBBBBB]"
              placeholder="email@example.com"
            />
          </div>

          <div className="space-y-1">
            <label className="font-mono text-[0.55rem] tracking-[0.2em] uppercase text-[#555555]">Telefon</label>
            <input 
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              placeholder="+905XXXXXXXXX"
              className="w-full border-b border-[#E5E5E5] py-3 bg-transparent outline-none focus:border-[#000000] transition-colors font-sans text-sm placeholder:text-[#BBBBBB]"
            />
          </div>

          <div className="space-y-1">
            <label className="font-mono text-[0.55rem] tracking-[0.2em] uppercase text-[#555555]">Şifre</label>
            <input 
              type="password" 
              required
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full border-b border-[#E5E5E5] py-3 bg-transparent outline-none focus:border-[#000000] transition-colors font-sans text-sm"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#000000] text-[#FFFFFF] font-mono text-[0.65rem] tracking-[0.25em] uppercase py-5 hover:bg-[#333333] transition-all duration-300 disabled:opacity-50"
          >
            {loading ? 'Oluşturuluyor...' : 'Hesabı Başlat'}
          </button>
        </form>

        <div className="mt-12 pt-8 border-t border-[#F5F5F5] flex flex-col items-center gap-4">
          <p className="font-sans text-[0.85rem] text-[#888888]">Zaten hesabınız var mı?</p>
          <Link to="/hesap/giris" className="font-mono text-[0.6rem] tracking-[0.2em] uppercase text-[#000000] border-b border-black pb-1 hover:text-[#888888] hover:border-[#888888] transition-all">
            Giriş Yapın
          </Link>
        </div>
      </div>
    </div>
  );
}