import { createSignal, onCleanup, onMount, Show } from 'solid-js';

/**
 * Scans QR codes from the device camera with jsQR. Calls `onDetect` with the decoded text,
 * at most once per `cooldownMs` for the same value.
 */
export default function QrScanner(props: {
    onDetect: (text: string) => void;
    cooldownMs?: number;
}) {
    let video: HTMLVideoElement | undefined;
    let canvas: HTMLCanvasElement | undefined;
    let stream: MediaStream | undefined;
    let raf = 0;
    let stopped = false;
    let lastText = '';
    let lastAt = 0;
    const [error, setError] = createSignal('');

    const tick = async (jsQR: typeof import('jsqr').default) => {
        if (stopped || !video || !canvas) return;
        if (video.readyState === video.HAVE_ENOUGH_DATA && video.videoWidth > 0) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (ctx) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const code = jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' });
                const now = Date.now();
                if (code?.data && (code.data !== lastText || now - lastAt > (props.cooldownMs ?? 4000))) {
                    lastText = code.data;
                    lastAt = now;
                    props.onDetect(code.data);
                }
            }
        }
        raf = requestAnimationFrame(() => tick(jsQR));
    };

    onMount(async () => {
        if (!navigator.mediaDevices?.getUserMedia) {
            setError('Kamera tidak tersedia. Buka halaman ini lewat HTTPS dan izinkan akses kamera.');
            return;
        }
        try {
            const jsQR = (await import('jsqr')).default;
            stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: { ideal: 'environment' } },
                audio: false
            });
            if (stopped || !video) {
                stream.getTracks().forEach((t) => t.stop());
                return;
            }
            video.srcObject = stream;
            await video.play();
            raf = requestAnimationFrame(() => tick(jsQR));
        } catch (e: any) {
            setError(
                e?.name === 'NotAllowedError'
                    ? 'Izin kamera ditolak. Aktifkan izin kamera pada browser Anda.'
                    : e?.message || 'Tidak dapat membuka kamera.'
            );
        }
    });

    onCleanup(() => {
        stopped = true;
        cancelAnimationFrame(raf);
        stream?.getTracks().forEach((t) => t.stop());
    });

    return (
        <div class="relative overflow-hidden rounded-xs bg-black aspect-square w-full max-w-sm mx-auto">
            <video ref={video} class="size-full object-cover" playsinline muted />
            <canvas ref={canvas} class="hidden" />
            <Show when={error()}>
                <div class="absolute inset-0 flex items-center justify-center p-4 text-center text-sm text-white bg-black/80">
                    {error()}
                </div>
            </Show>
        </div>
    );
}
