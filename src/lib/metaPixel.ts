import ReactPixel from 'react-facebook-pixel';

const PIXEL_ID = '7188769341182127';

export const initPixel = (): void => {
  ReactPixel.init(PIXEL_ID, undefined, {
    autoConfig: true,
    debug: false,
  });
};

export const pageView = (): void => ReactPixel.pageView();

export const trackEvent = (event: string, data?: object): void => {
  ReactPixel.track(event, data);
};

export function metaViewContent(params: {
  content_ids: string[];
  content_name: string;
  value?: number;
}) {
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
  ReactPixel.track('AddToCart', {
    content_type: 'product',
    currency: 'TRY',
    ...params,
  });
}

export function metaViewCart(params?: {
  num_items?: number;
  value?: number;
}) {
  ReactPixel.track('InitiateCheckout', {
    currency: 'TRY',
    ...params,
  });
}