import { createEffect, onMount } from 'solid-js';

/** Draws `value` as a QR code on a canvas (client only). */
export default function QrDisplay(props: { value: string; size?: number }) {
    let canvas: HTMLCanvasElement | undefined;

    const draw = async () => {
        if (!canvas || !props.value) return;
        const QRCode = (await import('qrcode')).default;
        await QRCode.toCanvas(canvas, props.value, {
            width: props.size ?? 280,
            margin: 2,
            errorCorrectionLevel: 'M'
        });
    };

    onMount(draw);
    createEffect(() => {
        void props.value;
        void draw();
    });

    return <canvas ref={canvas} class="rounded-md bg-white" aria-label="QR Code presensi" />;
}
