declare module "qrcode" {
  interface QRCodeToDataURLOptions {
    errorCorrectionLevel?: "L" | "M" | "Q" | "H";
    margin?: number;
    width?: number;
    scale?: number;
    color?: {
      dark?: string;
      light?: string;
    };
  }

  function toDataURL(
    text: string,
    options?: QRCodeToDataURLOptions
  ): Promise<string>;

  function toCanvas(
    canvasElement: HTMLCanvasElement,
    text: string,
    options?: QRCodeToDataURLOptions
  ): Promise<HTMLCanvasElement>;

  function toString(
    text: string,
    options?: QRCodeToDataURLOptions
  ): Promise<string>;

  export { toDataURL, toCanvas, toString };
  export default { toDataURL, toCanvas, toString };
}
