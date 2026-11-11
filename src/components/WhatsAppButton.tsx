// src/components/WhatsAppButton.tsx
import { useLocation } from 'react-router-dom';

const WHATSAPP_NUMBER = '903129800088';
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}`;

const WhatsAppButton = () => {
  const { pathname } = useLocation();

  // Ürün ve ödeme sayfalarında alttaki sabit çubukların üstünde kalsın
  const isProduct = pathname.startsWith('/urun/');
  const isCheckout = pathname === '/odeme';
  const position = isProduct
    ? 'bottom-24 md:bottom-28'
    : isCheckout
      ? 'bottom-24 lg:bottom-6'
      : 'bottom-5 md:bottom-6';

  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="WhatsApp ile bize ulaşın"
      title="WhatsApp ile bize ulaşın"
      className={`wa-pulse isolate fixed right-5 md:right-6 ${position} z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_8px_24px_rgba(0,0,0,0.18)] transition-all duration-300 hover:scale-105 hover:bg-[#1ebe5b] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2`}
    >
      <svg viewBox="0 0 32 32" className="h-7 w-7" fill="currentColor" aria-hidden="true">
        <path d="M16.003 3C8.832 3 3 8.83 3 16c0 2.293.6 4.533 1.74 6.507L3 29l6.66-1.707A12.95 12.95 0 0 0 16.003 29C23.172 29 29 23.17 29 16S23.172 3 16.003 3Zm0 23.653c-1.98 0-3.92-.533-5.613-1.54l-.4-.24-3.953 1.013 1.053-3.853-.26-.4A10.6 10.6 0 0 1 5.347 16c0-5.88 4.786-10.653 10.666-10.653 5.867 0 10.654 4.773 10.654 10.653 0 5.88-4.787 10.653-10.664 10.653Zm5.84-7.973c-.32-.16-1.893-.933-2.187-1.04-.293-.107-.506-.16-.72.16-.213.32-.826 1.04-1.013 1.253-.187.214-.373.24-.693.08-.32-.16-1.354-.5-2.574-1.587-.95-.85-1.594-1.9-1.78-2.22-.187-.32-.02-.493.14-.653.143-.143.32-.373.48-.56.16-.187.213-.32.32-.533.107-.214.053-.4-.027-.56-.08-.16-.72-1.734-.986-2.374-.26-.626-.524-.54-.72-.55l-.614-.01c-.213 0-.56.08-.853.4-.293.32-1.12 1.093-1.12 2.667 0 1.573 1.147 3.093 1.307 3.306.16.214 2.253 3.44 5.46 4.827.763.33 1.36.527 1.824.674.766.244 1.464.21 2.016.127.615-.092 1.893-.774 2.16-1.52.267-.747.267-1.387.187-1.52-.08-.134-.293-.214-.613-.374Z" />
      </svg>
    </a>
  );
};

export default WhatsAppButton;
