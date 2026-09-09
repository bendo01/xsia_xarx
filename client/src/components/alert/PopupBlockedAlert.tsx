import { createSignal, onMount, onCleanup, Show } from 'solid-js';
import { toast } from '~/components/toast/Toaster';

export default function PopupBlockedAlert() {
    const [isBlocked, setIsBlocked] = createSignal(false);
    const [showGuide, setShowGuide] = createSignal(false);
    const [isTesting, setIsTesting] = createSignal(false);
    const [dismissed, setDismissed] = createSignal(false);

    const testPopupPermission = (isUserInitiated = false): boolean => {
        if (typeof window === 'undefined') return false;

        try {
            // If user-initiated, we use normal dimensions; otherwise off-screen 1x1
            const features = isUserInitiated
                ? 'width=450,height=350,left=200,top=200'
                : 'width=1,height=1,left=-10000,top=-10000';
            const testWin = window.open('about:blank', '_blank', features);

            if (!testWin || testWin.closed || typeof testWin.closed === 'undefined') {
                return false; // Blocked
            }

            testWin.close();
            return true; // Allowed
        } catch (_) {
            return false; // Blocked
        }
    };

    const handleTestClick = () => {
        setIsTesting(true);
        const allowed = testPopupPermission(true);
        setIsTesting(false);

        if (allowed) {
            setIsBlocked(false);
            try {
                sessionStorage.setItem('popup_alert_dismissed', 'true');
            } catch (_) {}
            toast.success('Izin pop-up aktif! Sekarang dokumen PDF dari server dapat dibuka dan diunduh dengan lancar.');
        } else {
            setIsBlocked(true);
            toast.warning('Pop-up masih diblokir oleh browser. Silakan klik ikon pop-up di bilah alamat URL untuk mengizinkannya.');
        }
    };

    const handleDismiss = () => {
        setDismissed(true);
        try {
            sessionStorage.setItem('popup_alert_dismissed', 'true');
        } catch (_) {}
    };

    onMount(() => {
        if (typeof window === 'undefined') return;

        // Check if previously dismissed in this browser session
        try {
            if (sessionStorage.getItem('popup_alert_dismissed') === 'true') {
                setDismissed(true);
            }
        } catch (_) {}

        // Initial check on mount
        const allowed = testPopupPermission(false);
        if (!allowed) {
            setIsBlocked(true);
        }

        // Listen for popup-blocked events from pdfHelper or other controllers
        const handleBlockedEvent = (e: Event) => {
            setIsBlocked(true);
            setDismissed(false); // Force show if a real download was just blocked
            try {
                sessionStorage.removeItem('popup_alert_dismissed');
            } catch (_) {}
        };

        window.addEventListener('popup-blocked', handleBlockedEvent);
        onCleanup(() => {
            window.removeEventListener('popup-blocked', handleBlockedEvent);
        });
    });

    return (
        <Show when={isBlocked() && !dismissed()}>
            <div class="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 dark:from-amber-950/40 dark:via-orange-950/30 dark:to-neutral-900 p-4 sm:p-5 shadow-sm backdrop-blur-xs transition-all animate-fadeIn">
                <div class="flex flex-col sm:flex-row items-start justify-between gap-4">
                    {/* Left: Icon & Text Info */}
                    <div class="flex items-start gap-3.5">
                        <div class="size-10 sm:size-11 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30 shadow-xs">
                            <svg class="size-5 sm:size-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M15 3h6v6" />
                                <path d="M10 14 21 3" />
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                <circle cx="19" cy="6" r="3" class="stroke-red-500 fill-red-500" />
                                <path d="m17.5 4.5 3 3" class="stroke-white" />
                                <path d="m20.5 4.5-3 3" class="stroke-white" />
                            </svg>
                        </div>

                        <div class="space-y-1">
                            <div class="flex flex-wrap items-center gap-2">
                                <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 text-[11px] font-mono font-bold border border-amber-300 dark:border-amber-800/80">
                                    <span class="size-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                    Izin Pop-up Diperlukan
                                </span>
                                <span class="text-xs text-amber-700/80 dark:text-amber-400/80 font-medium">
                                    Unduh Dokumen PDF
                                </span>
                            </div>
                            <h4 class="text-sm sm:text-base font-bold text-neutral-900 dark:text-white">
                                Browser Memblokir Jendela Pop-up
                            </h4>
                            <p class="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed max-w-2xl">
                                Fitur cetak dan unduh berkas PDF dari server (seperti KRS, KHS, Transkrip, dan Laporan Akademik) membutuhkan izin pop-up browser agar dokumen dapat dibuka langsung di tab baru atau diunduh dengan lancar.
                            </p>
                        </div>
                    </div>

                    {/* Right: Action Buttons */}
                    <div class="flex items-center gap-2 self-end sm:self-center shrink-0">
                        <button
                            type="button"
                            onClick={handleTestClick}
                            disabled={isTesting()}
                            class="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                        >
                            <Show when={isTesting()} fallback={
                                <svg class="size-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M21.801 10A10 10 0 1 1 17 3.335" />
                                    <path d="m9 11 3 3L22 4" />
                                </svg>
                            }>
                                <div class="size-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            </Show>
                            <span>Uji & Izinkan Pop-up</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setShowGuide(!showGuide())}
                            class="px-3 py-1.5 bg-neutral-200/80 hover:bg-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 rounded-xl text-xs font-semibold transition-colors"
                        >
                            {showGuide() ? 'Tutup Panduan' : 'Petunjuk'}
                        </button>

                        <button
                            type="button"
                            onClick={handleDismiss}
                            title="Tutup pemberitahuan ini"
                            class="p-1.5 rounded-xl hover:bg-neutral-200/60 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition-colors"
                        >
                            <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M18 6 6 18" />
                                <path d="m6 6 12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Collapsible Step-by-Step Guide */}
                <Show when={showGuide()}>
                    <div class="mt-4 pt-4 border-t border-amber-500/20 dark:border-amber-500/20 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                        {/* Chrome / Edge Guide */}
                        <div class="bg-white/80 dark:bg-neutral-800/80 rounded-xl p-3 border border-amber-200/60 dark:border-neutral-700/60 space-y-1.5">
                            <div class="flex items-center gap-1.5 font-bold text-neutral-800 dark:text-neutral-100">
                                <span class="size-2 rounded-full bg-blue-500"></span>
                                Google Chrome / Edge
                            </div>
                            <ol class="list-decimal list-inside space-y-1 text-[11px] text-neutral-600 dark:text-neutral-300 leading-snug">
                                <li>Klik ikon <strong>Gembok 🔒</strong> atau <strong>Pop-up diblokir 🚫</strong> di sebelah kiri/kanan bilah URL.</li>
                                <li>Ubah opsi <strong>Pop-up dan pengalihan</strong> menjadi <strong>Izinkan (Allow)</strong>.</li>
                                <li>Muat ulang (refresh) halaman.</li>
                            </ol>
                        </div>

                        {/* Firefox Guide */}
                        <div class="bg-white/80 dark:bg-neutral-800/80 rounded-xl p-3 border border-amber-200/60 dark:border-neutral-700/60 space-y-1.5">
                            <div class="flex items-center gap-1.5 font-bold text-neutral-800 dark:text-neutral-100">
                                <span class="size-2 rounded-full bg-orange-500"></span>
                                Mozilla Firefox
                            </div>
                            <ol class="list-decimal list-inside space-y-1 text-[11px] text-neutral-600 dark:text-neutral-300 leading-snug">
                                <li>Perhatikan bilah kuning atau ikon peringatan pop-up di bawah kolom alamat URL.</li>
                                <li>Klik tombol <strong>Opsi (Options)</strong>.</li>
                                <li>Pilih <strong>Izinkan pop-up untuk situs ini</strong>.</li>
                            </ol>
                        </div>

                        {/* Safari Guide */}
                        <div class="bg-white/80 dark:bg-neutral-800/80 rounded-xl p-3 border border-amber-200/60 dark:border-neutral-700/60 space-y-1.5">
                            <div class="flex items-center gap-1.5 font-bold text-neutral-800 dark:text-neutral-100">
                                <span class="size-2 rounded-full bg-teal-500"></span>
                                Apple Safari (Mac / iPad)
                            </div>
                            <ol class="list-decimal list-inside space-y-1 text-[11px] text-neutral-600 dark:text-neutral-300 leading-snug">
                                <li>Buka menu <strong>Safari</strong> &rarr; <strong>Pengaturan (Settings)</strong>.</li>
                                <li>Pilih tab <strong>Situs Web</strong> &rarr; menu <strong>Jendela Pop-up</strong> di sebelah kiri.</li>
                                <li>Ubah status situs SIAKA ini menjadi <strong>Izinkan (Allow)</strong>.</li>
                            </ol>
                        </div>
                    </div>
                </Show>
            </div>
        </Show>
    );
}
