declare module 'react-facebook-pixel' {
  interface Options {
    autoConfig?: boolean;
    debug?: boolean;
  }
  const ReactPixel: {
    init: (pixelId: string, advancedMatching?: undefined, options?: Options) => void;
    pageView: () => void;
    track: (event: string, data?: object) => void;
  };
  export default ReactPixel;
}