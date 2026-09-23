import { createForm } from '@tanstack/solid-form';
import { createSignal, onMount, onCleanup, Show } from 'solid-js';
import { toast } from '~/components/toast/Toaster';
import { A, useNavigate } from '@solidjs/router';

const getBaseUrl = () => (import.meta.env.VITE_API_SERVER_URL ?? "http://127.0.0.1:5800/api/v1").replace(/\/+$/, "");

export default function ForgotPasswordRequest() {
    let canvasRef: HTMLCanvasElement | undefined;
    const [isLoading, setIsLoading] = createSignal(false);
    const [errorMessage, setErrorMessage] = createSignal<string | null>(null);
    const [successWaLink, setSuccessWaLink] = createSignal<string | null>(null);
    const [successMessage, setSuccessMessage] = createSignal<string | null>(null);
    const navigate = useNavigate();

    const form = createForm(() => ({
        defaultValues: {
            email: '',
            phone_number: '',
        },
        onSubmit: async ({ value }) => {
            if (!value.email || !value.phone_number) {
                setErrorMessage("Semua kolom harus diisi");
                return;
            }

            setIsLoading(true);
            setErrorMessage(null);
            setSuccessWaLink(null);

            try {
                const response = await fetch(`${getBaseUrl()}/forgot-password`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Accept: "application/json",
                    },
                    body: JSON.stringify({
                        email: value.email,
                        phone_number: value.phone_number,
                    }),
                });

                let data: any = {};
                try {
                    data = await response.json();
                } catch {
                    const text = await response.text();
                    data = { message: text };
                }

                if (!response.ok) {
                    const errorMsg = data?.brief || data?.message || data?.error?.message || "Gagal memproses permintaan";
                    setErrorMessage(errorMsg);
                    toast.danger(errorMsg);
                } else {
                    toast.success(data?.message || "Tautan reset kata sandi telah dikirim");
                    setSuccessMessage(data?.message || "Tautan reset kata sandi telah dikirim ke email Anda.");
                    setSuccessWaLink(data?.wa_link || null);
                    if (data?.wa_link) {
                        window.open(data.wa_link, "_blank");
                    }
                    setTimeout(() => {
                        navigate('/authentification/password-reset');
                    }, 1500);
                }
            } catch (err: any) {
                const msg = err?.message || "Network Error";
                setErrorMessage(msg);
                toast.danger(msg);
            } finally {
                setIsLoading(false);
            }
        },
    }));

    onMount(() => {
        if (!canvasRef) return;
        const canvas = canvasRef;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = canvas.width = window.innerWidth;
        let height = canvas.height = window.innerHeight;

        const handleResize = () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        };
        window.addEventListener('resize', handleResize);

        class Particle {
            x: number;
            y: number;
            vx: number;
            vy: number;
            radius: number;
            alpha: number;

            constructor() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.vx = (Math.random() - 0.5) * 0.8;
                this.vy = (Math.random() - 0.5) * 0.8;
                this.radius = Math.random() * 2 + 1;
                this.alpha = Math.random() * 0.5 + 0.2;
            }

            update() {
                this.x += this.vx;
                this.y += this.vy;

                if (this.x < 0) this.x = width;
                if (this.x > width) this.x = 0;
                if (this.y < 0) this.y = height;
                if (this.y > height) this.y = 0;
            }

            draw() {
                if (!ctx) return;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(56, 189, 248, ${this.alpha})`;
                ctx.fill();
            }
        }

        const particles = Array.from({ length: 60 }, () => new Particle());
        let animationId: number;

        const animate = () => {
            if (!ctx) return;
            ctx.clearRect(0, 0, width, height);

            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < 100) {
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.strokeStyle = `rgba(56, 189, 248, ${0.15 * (1 - dist / 100)})`;
                        ctx.lineWidth = 0.8;
                        ctx.stroke();
                    }
                }
            }

            particles.forEach((p) => {
                p.update();
                p.draw();
            });

            animationId = requestAnimationFrame(animate);
        };

        animate();

        onCleanup(() => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationId);
        });
    });

    return (
        <div class="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-[#0A0F1D] px-4 py-8 select-none">
            {/* Ambient Background Gradient Spheres */}
            <div class="absolute inset-0 w-full h-full pointer-events-none z-0">
                <div class="absolute -top-[15%] -left-[10%] w-[65%] h-[65%] bg-[#0d9488]/30 rounded-xs mix-blend-screen filter blur-[120px] opacity-70"></div>
                <div class="absolute -bottom-[20%] -left-[10%] w-[60%] h-[60%] bg-[#3b82f6]/25 rounded-xs mix-blend-screen filter blur-[120px] opacity-60"></div>
                <div class="absolute -bottom-[15%] -right-[10%] w-[65%] h-[65%] bg-[#10b981]/25 rounded-xs mix-blend-screen filter blur-[120px] opacity-60"></div>
                <canvas ref={canvasRef} class="absolute inset-0 w-full h-full opacity-70"></canvas>
            </div>

            {/* Glassmorphic Card */}
            <div class="relative z-10 w-full max-w-lg p-8 sm:p-10 bg-slate-900/60 backdrop-blur-2xl border border-emerald-500/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] rounded-xs flex flex-col items-center">

                <h1 class="text-[26px] sm:text-[30px] font-bold text-white tracking-wide mb-1 font-sans">
                    Lupa Kata Sandi
                </h1>
                <p class="text-white/60 text-xs font-semibold tracking-wider uppercase mb-6 font-mono text-center">
                    Isi detail Anda untuk memulihkan akun
                </p>

                <Show when={errorMessage()}>
                    <div class="w-full mb-5 p-3.5 bg-red-500/15 border border-red-500/30 rounded-xs flex items-center gap-3 text-red-200 text-xs font-medium animate-fadeIn">
                        <svg class="shrink-0 size-4 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <line x1="12" y1="8" x2="12" y2="12" />
                            <line x1="12" y1="16" x2="12.01" y2="16" />
                        </svg>
                        <span class="flex-1 leading-snug">{errorMessage()}</span>
                        <button
                            type="button"
                            onClick={() => setErrorMessage(null)}
                            class="text-red-400 hover:text-white transition-colors"
                        >
                            <svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>
                </Show>

                <Show when={successWaLink()}>
                    <div class="w-full mb-5 p-3.5 bg-emerald-500/15 border border-emerald-500/30 rounded-xs flex items-start gap-3 text-emerald-200 text-xs font-medium animate-fadeIn">
                        <svg class="shrink-0 size-4 text-emerald-400 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <path d="M22 4L12 14.01l-3-3" />
                        </svg>
                        <div class="flex-1 leading-snug">
                            <p>{successMessage()}</p>
                            <a href={successWaLink()!} target="_blank" class="mt-2 text-emerald-400 hover:text-emerald-300 underline font-semibold block">Buka Tautan WhatsApp</a>
                        </div>
                    </div>
                </Show>

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        form.handleSubmit();
                    }}
                    class="w-full space-y-4 mb-6"
                >

                    <form.Field name="email">
                        {(field) => (
                            <div class="space-y-1">
                                <label class="block text-xs font-medium text-white/80 px-1">Email</label>
                                <input
                                    type="email"
                                    placeholder="Alamat Email Aktif"
                                    required
                                    value={field().state.value}
                                    onBlur={field().handleBlur}
                                    onInput={(e) => {
                                        field().handleChange(e.currentTarget.value);
                                        if (errorMessage()) setErrorMessage(null);
                                    }}
                                    class="w-full bg-[#111827]/70 border border-emerald-500/20 text-white placeholder-white/30 px-4 py-3 rounded-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-400/50 transition-all text-sm shadow-inner"
                                />
                            </div>
                        )}
                    </form.Field>

                    <form.Field name="phone_number">
                        {(field) => (
                            <div class="space-y-1">
                                <label class="block text-xs font-medium text-white/80 px-1">Nomor WhatsApp</label>
                                <input
                                    type="tel"
                                    placeholder="Contoh: 62812..."
                                    required
                                    value={field().state.value}
                                    onBlur={field().handleBlur}
                                    onInput={(e) => {
                                        field().handleChange(e.currentTarget.value);
                                        if (errorMessage()) setErrorMessage(null);
                                    }}
                                    class="w-full bg-[#111827]/70 border border-emerald-500/20 text-white placeholder-white/30 px-4 py-3 rounded-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-400/50 transition-all text-sm shadow-inner"
                                />
                            </div>
                        )}
                    </form.Field>

                    <form.Subscribe selector={(state) => state.canSubmit}>
                        {(canSubmit) => (
                            <button
                                type="submit"
                                disabled={!canSubmit() || isLoading()}
                                class="w-full mt-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-3.5 px-4 rounded-xs border border-emerald-400/20 transition-all duration-300 shadow-[0_4px_20px_rgba(16,185,129,0.3)] hover:shadow-[0_6px_25px_rgba(16,185,129,0.45)] active:scale-[0.99] text-xs tracking-[0.12em] uppercase disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <Show when={isLoading()} fallback={
                                    <>
                                        <span>Kirim Permintaan Reset</span>
                                        <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                            <path d="M5 12h14" />
                                            <path d="m12 5 7 7-7 7" />
                                        </svg>
                                    </>
                                }>{(
                                    <>
                                        <svg class="animate-spin size-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        <span>Memproses...</span>
                                    </>
                                )}</Show>
                            </button>
                        )}
                    </form.Subscribe>
                </form>

                <div class="w-full pt-4 border-t border-white/10 flex items-center justify-between text-xs text-white/50">
                    <A href="/authentification/login" class="hover:text-emerald-300 transition-colors flex items-center gap-1">
                        <svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="m15 18-6-6 6-6" />
                        </svg>
                        Kembali ke Login
                    </A>
                </div>
            </div>
        </div>
    );
}
