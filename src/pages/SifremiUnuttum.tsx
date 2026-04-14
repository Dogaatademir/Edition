// src/pages/SifremiUnuttum.tsx
import { Link } from 'react-router-dom';

export default function SifremiUnuttum() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-[#FFFFFF] px-4 py-20">
      <div className="w-full max-w-[400px] text-center">
        <div className="font-mono text-[0.55rem] tracking-[0.3em] uppercase text-[#888888] mb-4">
          ECR — Security
        </div>
        <h1 className="font-serif text-[2.5rem] leading-none text-[#000000] mb-6">Şifreye Son</h1>
        
        <div className="bg-[#FAFAFA] border border-[#E5E5E5] p-8 mb-8">
          <p className="font-sans text-[0.9rem] text-[#555555] leading-relaxed">
            Güvenliğinizi artırmak adına şifreli giriş sistemini tamamen kaldırdık. Artık şifre unutma derdi yok. Hesabınıza e-posta adresinize gelecek tek kullanımlık güvenlik kodu ile her zaman erişebilirsiniz.
          </p>
        </div>

        <Link 
          to="/hesap/giris"
          className="w-full block bg-[#000000] text-[#FFFFFF] font-mono text-[0.65rem] tracking-[0.25em] uppercase py-5 hover:bg-[#333333] transition-all duration-300"
        >
          Yeni Sistemle Giriş Yap
        </Link>
      </div>
    </div>
  );
}