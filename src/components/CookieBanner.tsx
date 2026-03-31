import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, X } from 'lucide-react';

const CookieBanner = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie-consent');
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 1500); // Sayfa yüklendikten biraz sonra göster
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAction = (type: 'accepted' | 'declined') => {
    localStorage.setItem('cookie-consent', type);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 left-6 right-6 z-[100] md:left-auto md:right-10 md:max-w-md animate-in slide-in-from-bottom-10 duration-700">
      <div className="bg-white p-6 shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-accent/5 rounded-sm relative">
        <button 
          onClick={() => setIsVisible(false)}
          className="absolute top-4 right-4 text-accent/40 hover:text-accent transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-4 mb-5">
          <div className="bg-accent/5 p-2 rounded-full text-accent shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-[13px] font-bold text-accent mb-1 uppercase tracking-widest">Çerez Politikası</h4>
            <p className="text-xs text-text-secondary leading-relaxed">
              Size daha iyi bir deneyim sunabilmek için zorunlu ve analitik çerezler kullanıyoruz.
              <Link to="/kvkk" className="text-accent underline underline-offset-4 ml-1 hover:text-accent-hover font-medium">Detaylı Bilgi</Link>
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={() => handleAction('accepted')}
            className="flex-1 bg-accent text-white px-4 py-3 text-[10px] font-bold tracking-[0.2em] uppercase hover:bg-accent-hover transition-all rounded-sm"
          >
            KABUL ET
          </button>
          <button 
            onClick={() => handleAction('declined')}
            className="flex-1 bg-transparent border border-accent/20 text-accent px-4 py-3 text-[10px] font-bold tracking-[0.2em] uppercase hover:bg-accent/5 transition-all rounded-sm"
          >
            REDDET
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieBanner;