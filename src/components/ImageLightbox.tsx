// src/components/ImageLightbox.tsx
// Ürün görselini tam ekran açar; birden fazla görsel varsa oklarla geçilir.
// Mobilde iki parmakla / çift dokunarak yakınlaştırma yalnızca görsele uygulanır;
// tarayıcının sayfa zoom'u engellenir (yoksa kapatınca arkadaki sayfa büyümüş kalıyor).
import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

// Ürün görselleri yatay (3:2) ve boşluk yanlarda. Dikey mobil ekranda görsel genişliğe sığınca
// küçük kalıyor; bu yüzden yalnızca mobilde büyütülüp yan kenarlar kırpılır. Masaüstünde ekrana sığar.
const MOBILE_BASE_SCALE = 2.2;
const DESKTOP_BASE_SCALE = 1;
const getBaseScale = () =>
  typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches
    ? MOBILE_BASE_SCALE
    : DESKTOP_BASE_SCALE;

interface ImageLightboxProps {
  images: string[];
  startIndex?: number;
  alt: string;
  onClose: () => void;
}

const ImageLightbox: React.FC<ImageLightboxProps> = ({ images, startIndex = 0, alt, onClose }) => {
  const [index, setIndex] = useState(startIndex);
  const [zoom, setZoom] = useState({ s: 1, x: 0, y: 0 });
  const [baseScale, setBaseScale] = useState(getBaseScale);
  const [gesturing, setGesturing] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const zoomRef = useRef(zoom);
  // Ref'i state ile aynı anda güncelle: touchend, render beklemeden güncel değeri okusun
  const applyZoom = (z: { s: number; x: number; y: number }) => { zoomRef.current = z; setZoom(z); };
  const hasMany = images.length > 1;


  // Ekran döndürülür / boyutlanırsa taban ölçeği güncelle
  useEffect(() => {
    const onResize = () => setBaseScale(getBaseScale());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Dokunmatik yakınlaştırma / sürükleme / çift dokunma
  useEffect(() => {
    const el = overlayRef.current;
    if (!el) return;
    const MAX = 4;
    const dist = (t: TouchList) => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);
    // Görsel kutusunun dışına taşmayacak şekilde kaydırmayı sınırla
    const clamp = (s: number, x: number, y: number) => {
      const img = imgRef.current;
      if (!img || s <= 1) return { s: Math.max(1, s), x: 0, y: 0 };
      const b = getBaseScale();
      const mx = Math.max(0, (img.offsetWidth * (b * s - 1)) / 2);
      const my = Math.max(0, (img.offsetHeight * (b * s - 1)) / 2);
      return { s, x: Math.min(mx, Math.max(-mx, x)), y: Math.min(my, Math.max(-my, y)) };
    };

    let pinch: { d: number; s: number; x: number; y: number; cx: number; cy: number } | null = null;
    let pan: { px: number; py: number; x: number; y: number } | null = null;
    let lastTap = { t: 0, x: 0, y: 0 };

    const onStart = (e: TouchEvent) => {
      const z = zoomRef.current;
      if (e.touches.length === 2) {
        const r = imgRef.current?.getBoundingClientRect();
        const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        // Parmakların ortası, görselin merkezine göre
        const cx = r ? midX - (r.left + r.width / 2) : 0;
        const cy = r ? midY - (r.top + r.height / 2) : 0;
        pinch = { d: dist(e.touches), s: z.s, x: z.x, y: z.y, cx, cy };
        pan = null;
        setGesturing(true);
      } else if (e.touches.length === 1 && z.s > 1) {
        pan = { px: e.touches[0].clientX, py: e.touches[0].clientY, x: z.x, y: z.y };
        setGesturing(true);
      }
    };

    const onMove = (e: TouchEvent) => {
      // Tarayıcının kendi pinch-zoom'unu ve kaydırmasını engelle
      e.preventDefault();
      if (pinch && e.touches.length === 2) {
        const s = Math.min(MAX, Math.max(0.8, (pinch.s * dist(e.touches)) / pinch.d));
        const k = s / pinch.s;
        // Parmakların altındaki nokta yerinde kalsın
        const x = pinch.cx - (pinch.cx - pinch.x) * k;
        const y = pinch.cy - (pinch.cy - pinch.y) * k;
        applyZoom(s < 1 ? { s, x: 0, y: 0 } : clamp(s, x, y));
      } else if (pan && e.touches.length === 1) {
        const z = zoomRef.current;
        applyZoom(clamp(z.s, pan.x + e.touches[0].clientX - pan.px, pan.y + e.touches[0].clientY - pan.py));
      }
    };

    const onEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) pinch = null;
      if (e.touches.length === 0) {
        pan = null;
        setGesturing(false);
        const z = zoomRef.current;
        if (z.s < 1.05) applyZoom({ s: 1, x: 0, y: 0 });

        // Görsele çift dokunma: 1x <-> 2.5x
        const t = e.changedTouches[0];
        if (e.changedTouches.length === 1 && e.target === imgRef.current) {
          const now = Date.now();
          if (now - lastTap.t < 300 && Math.hypot(t.clientX - lastTap.x, t.clientY - lastTap.y) < 30) {
            e.preventDefault();
            if (z.s > 1) applyZoom({ s: 1, x: 0, y: 0 });
            else {
              const r = imgRef.current!.getBoundingClientRect();
              const cx = t.clientX - (r.left + r.width / 2);
              const cy = t.clientY - (r.top + r.height / 2);
              applyZoom(clamp(2.5, -cx * 1.5, -cy * 1.5));
            }
            lastTap = { t: 0, x: 0, y: 0 };
          } else {
            lastTap = { t: now, x: t.clientX, y: t.clientY };
          }
        }
      }
    };

    // iOS Safari'nin kendi gesture olayları (sayfa zoom'u)
    const block = (e: Event) => e.preventDefault();

    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchmove', onMove, { passive: false });
    el.addEventListener('touchend', onEnd, { passive: false });
    el.addEventListener('touchcancel', onEnd, { passive: false });
    document.addEventListener('gesturestart', block, { passive: false } as AddEventListenerOptions);
    document.addEventListener('gesturechange', block, { passive: false } as AddEventListenerOptions);
    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchmove', onMove);
      el.removeEventListener('touchend', onEnd);
      el.removeEventListener('touchcancel', onEnd);
      document.removeEventListener('gesturestart', block);
      document.removeEventListener('gesturechange', block);
    };
  }, []);

  // Görsel değişince yakınlaştırma sıfırlanır
  const show = (next: (i: number) => number) => {
    zoomRef.current = { s: 1, x: 0, y: 0 };
    setZoom(zoomRef.current);
    setIndex(next);
  };
  const go = (dir: 1 | -1) => show(i => (i + dir + images.length) % images.length);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (hasMany && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
        const dir = e.key === 'ArrowRight' ? 1 : -1;
        zoomRef.current = { s: 1, x: 0, y: 0 };
        setZoom(zoomRef.current);
        setIndex(i => (i + dir + images.length) % images.length);
      }
    };
    window.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose, hasMany, images.length]);

  const btn = 'absolute z-10 flex items-center justify-center w-11 h-11 border border-[#1b1b1b]/15 bg-[#fdfaf6] text-[#1b1b1b] hover:bg-[#1b1b1b] hover:text-[#f7f0e7] transition-colors';

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      ref={overlayRef}
      className="fixed inset-0 z-[200] bg-[#efe5d8] flex items-center justify-center overflow-hidden animate-in fade-in duration-200"
      style={{ touchAction: 'none' }}
      onClick={onClose}
    >
      <button type="button" aria-label="Kapat" className={`${btn} top-4 right-4 md:top-6 md:right-6`} onClick={onClose}>
        <X className="w-5 h-5" />
      </button>

      {hasMany && (
        <>
          <button type="button" aria-label="Önceki görsel" className={`${btn} left-3 md:left-6 top-1/2 -translate-y-1/2`} onClick={e => { e.stopPropagation(); go(-1); }}>
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button type="button" aria-label="Sonraki görsel" className={`${btn} right-3 md:right-6 top-1/2 -translate-y-1/2`} onClick={e => { e.stopPropagation(); go(1); }}>
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      <img
        ref={imgRef}
        src={images[index]}
        alt={alt}
        className="w-full h-full md:w-auto md:h-auto md:max-h-[88vh] md:max-w-[92vw] object-contain mix-blend-multiply select-none"
        style={{
          transform: `translate(${zoom.x}px, ${zoom.y}px) scale(${baseScale * zoom.s})`,
          transition: gesturing ? 'none' : 'transform 0.25s ease-out',
        }}
        onClick={e => e.stopPropagation()}
        draggable={false}
      />

      {hasMany && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2" onClick={e => e.stopPropagation()}>
          {images.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`${i + 1}. görsel`}
              onClick={() => show(() => i)}
              className={`h-1.5 transition-all ${i === index ? 'w-8 bg-[#1b1b1b]' : 'w-4 bg-[#1b1b1b]/25 hover:bg-[#1b1b1b]/50'}`}
            />
          ))}
        </div>
      )}
    </div>,
    document.body
  );
};

export default ImageLightbox;
