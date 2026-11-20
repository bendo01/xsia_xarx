import { createEffect, onSettled } from 'solid-js';

/** Draws `value` as a QR code on a canvas (browser only; the library is loaded on demand). */
export default function QrDisplay(props: { value: string; size?: number; label: string }) {
  let canvas: HTMLCanvasElement | undefined;

  const draw = async () => {
    const value = props.value;
    const size = props.size ?? 280;
    if (!canvas || !value) return;
    const QRCode = (await import('qrcode')).default;
    await QRCode.toCanvas(canvas, value, { width: size, margin: 2, errorCorrectionLevel: 'M' });
  };

  onSettled(() => {
    void draw();
  });
  createEffect(
    () => [props.value, props.size] as const,
    () => {
      void draw();
    },
  );

  return <canvas ref={canvas} class="max-w-full rounded-xs bg-white" aria-label={props.label} />;
}
