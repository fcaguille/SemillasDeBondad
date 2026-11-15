/**
 * QR scanner adapter. The viewfinder UI (src/views/EscanearView.tsx) only
 * depends on this interface. Default implementation uses the native
 * BarcodeDetector (Chrome/Edge Android, Safari 17+ behind flag). For full
 * iOS coverage, implement `createQrScanner` with `qr-scanner` or
 * `@zxing/browser` — see FRONTEND_HANDOFF.md §C.1.
 */
export interface QrScanner {
  start(video: HTMLVideoElement, onResult: (text: string) => void): Promise<void>;
  stop(): void;
}

type Detector = { detect(src: CanvasImageSource): Promise<Array<{ rawValue: string }>> };
declare global {
  interface Window {
    BarcodeDetector?: new (opts: { formats: string[] }) => Detector;
  }
}

export const isNativeQrSupported = () =>
  typeof window !== "undefined" && "BarcodeDetector" in window;

export function createQrScanner(): QrScanner | null {
  if (!isNativeQrSupported()) return null;
  const detector = new window.BarcodeDetector!({ formats: ["qr_code"] });
  let raf = 0;
  let stopped = false;
  return {
    async start(video, onResult) {
      stopped = false;
      const tick = async () => {
        if (stopped) return;
        if (video.readyState >= 2) {
          try {
            const codes = await detector.detect(video);
            if (codes[0]?.rawValue) return onResult(codes[0].rawValue);
          } catch {
            /* frame not ready */
          }
        }
        raf = window.setTimeout(tick, 250);
      };
      tick();
    },
    stop() {
      stopped = true;
      clearTimeout(raf);
    },
  };
}
