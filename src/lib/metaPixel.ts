import ReactPixel from 'react-facebook-pixel';

const PIXEL_ID = '7188769341182127';

// Pixel yalnızca kullanıcı pazarlama çerezlerine onay verdiğinde başlatılır (bkz. lib/consent.ts).
// Başlatılmadan önce yapılan çağrılar sessizce yok sayılır.
let initialized = false;

export const initPixel = (): void => {
  if (initialized) return;
  ReactPixel.init(PIXEL_ID, undefined, {
    autoConfig: true,
    debug: false,
  });
  initialized = true;
};

export const pageView = (): void => {
  if (initialized) ReactPixel.pageView();
};

export const trackEvent = (event: string, data?: object): void => {
  if (initialized) ReactPixel.track(event, data);
};

export function metaViewContent(params: {
  content_ids: string[];
  content_name: string;
  value?: number;
}) {
  if (!initialized) return;
  ReactPixel.track('ViewContent', {
    content_type: 'product',
    currency: 'TRY',
    ...params,
  });
}

export function metaAddToCart(params: {
  content_ids: string[];
  content_name: string;
  value: number;
}) {
  if (!initialized) return;
  ReactPixel.track('AddToCart', {
    content_type: 'product',
    currency: 'TRY',
    ...params,
  });
}

export function metaViewCart(params?: {
  num_items?: number;
  total?: number;
}) {
  if (!initialized) return;
  ReactPixel.track('ViewCart', {
    currency: 'TRY',
    ...params,
  });
}