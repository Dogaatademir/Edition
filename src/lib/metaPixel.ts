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