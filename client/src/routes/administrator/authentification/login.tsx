import { createForm } from '@tanstack/solid-form';
import { onMount, onCleanup, createSignal, Show } from 'solid-js';
import { useNavigate, A } from '@solidjs/router';
import { LoginUser, isAuthenticated } from '../../controllers/auth/AuthUser';
import { processLoginSuccess, getDashboardPathForRole, getActiveRole } from '../../lib/authStore';
import { toast } from '../../components/toast/Toaster';

export default function Login() {
    let canvasRef: HTMLCanvasElement | undefined;
    const navigate = useNavigate();

    const [isLoading, setIsLoading] = createSignal(false);
    const [errorMessage, setErrorMessage] = createSignal<string | null>(null);
    const [showPassword, setShowPassword] = createSignal(false);
    const [rememberMe, setRememberMe] = createSignal(true);

    const form = createForm(() => ({
        defaultValues: {
            email: '',
            password: '',
        },
        onSubmit: async ({ value }) => {
            if (!value.email || !value.password) {
                setErrorMessage("Please fill in both email and password.");
                return;
            }

            setIsLoading(true);
            setErrorMessage(null);

            try {
                const response = await LoginUser({
                    email: value.email,
                    password: value.password,
                });

                if (response.code === 200) {
                    const userName = response.user?.name || "User";
                    toast.success(`Welcome back, ${userName}!`);
                    
                    if (typeof window !== 'undefined' && rememberMe()) {
                        localStorage.setItem('remember_email', value.email);
                    } else if (typeof window !== 'undefined') {
                        localStorage.removeItem('remember_email');
                    }

                    // Process roles and determine target dashboard
                    const targetDashboard = await processLoginSuccess(response, false);

                    // Smooth navigation to destination dashboard
                    setTimeout(() => {
                        navigate(targetDashboard, { replace: true });
                    }, 400);
                } else {
                    const msg = response.message || "Invalid email or password";
                    setErrorMessage(msg);
                    toast.danger(msg);
                }
            } catch (err: any) {
                const msg = err?.message || "Failed to connect to the authentication server";
                setErrorMessage(msg);
                toast.danger(msg);
            } finally {
                setIsLoading(false);
            }
        },
    }));

    onMount(() => {
        // If already logged in, redirect to own dashboard
        if (isAuthenticated()) {
            navigate(getDashboardPathForRole(getActiveRole()), { replace: true });
            return;
        }

        // Load remembered email if available
        if (typeof window !== 'undefined') {
            const savedEmail = localStorage.getItem('remember_email');
            if (savedEmail) {
                form.setFieldValue('email', savedEmail);
            }
        }

        // Initialize rain canvas animation
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

        class Drop {
            x: number;
            y: number;
            vy: number;
            l: number;
            splashHeight: number;
            
            constructor() {
                this.x = Math.random() * width;
                this.y = Math.random() * -height;
                this.vy = Math.random() * 8 + 15; // fall speed
                this.l = Math.random() * 20 + 10; // drop length
                this.splashHeight = Math.random() * height; // hit screen at random height
            }

            update() {
                this.y += this.vy;
                if (this.y >= this.splashHeight) {
                    splashes.push(new Splash(this.x, this.y));
                    this.y = Math.random() * -100;
                    this.x = Math.random() * width;
                    this.splashHeight = Math.random() * height;
                }
            }

            draw() {
                if (!ctx) return;
                ctx.beginPath();
                ctx.moveTo(this.x, this.y);
                ctx.lineTo(this.x, this.y + this.l);
                ctx.strokeStyle = 'rgba(150, 200, 255, 0.3)';
                ctx.lineWidth = 1.5;
                ctx.stroke();
            }
        }

        class Splash {
            x: number;
            y: number;
            r: number;
            a: number;
            
            constructor(x: number, y: number) {
                this.x = x;
                this.y = y;
                this.r = 1;
                this.a = 0.6;
            }

            update() {
                this.r += 1.2; // expansion speed
                this.a -= 0.03; // fade speed
            }

            draw() {
                if (!ctx) return;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(150, 200, 255, ${this.a})`;
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        }

        const drops = Array.from({ length: 80 }, () => new Drop());
        let splashes: Splash[] = [];
        let animationId: number;

        const animate = () => {
            if (!ctx) return;
            ctx.clearRect(0, 0, width, height);
            
            drops.forEach(drop => {
                drop.update();
                drop.draw();
            });
            
            splashes = splashes.filter(s => s.a > 0);
            splashes.forEach(splash => {
                splash.update();
                splash.draw();
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
        <div class="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-[#0F2027] px-4 py-8 select-none">
            {/* Background Gradients */}
            <div class="absolute inset-0 w-full h-full pointer-events-none z-0">
                {/* Top Left Deep Blue */}
                <div class="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] bg-[#0f3460] rounded-full mix-blend-screen filter blur-[100px] opacity-80"></div>
                {/* Bottom Left Deep Red */}
                <div class="absolute -bottom-[20%] -left-[10%] w-[60%] h-[60%] bg-[#e94560] rounded-full mix-blend-multiply filter blur-[120px] opacity-90"></div>
                {/* Bottom Right Bright Orange */}
                <div class="absolute -bottom-[20%] -right-[10%] w-[70%] h-[70%] bg-[#f9a826] rounded-full mix-blend-screen filter blur-[120px] opacity-70"></div>

                {/* Custom SVG Wave for deep ambience */}
                <svg class="absolute bottom-0 w-full h-[80%] opacity-40 mix-blend-overlay" preserveAspectRatio="none" viewBox="0 0 1440 320" xmlns="http://www.w3.org/2000/svg">
                    <path fill="#ffffff" fill-opacity="1" d="M0,192L48,202.7C96,213,192,235,288,218.7C384,203,480,149,576,149.3C672,149,768,203,864,229.3C960,256,1056,256,1152,240C1248,224,1344,192,1392,176L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
                </svg>

                {/* Rain Canvas */}
                <canvas ref={canvasRef} class="absolute inset-0 w-full h-full opacity-60 mix-blend-screen"></canvas>

                {/* Small floating glowing stars */}
                <div class="absolute top-[25%] left-[20%] w-1 h-1 bg-white rounded-full opacity-60 shadow-[0_0_10px_rgba(255,255,255,0.8)]"></div>
                <div class="absolute top-[65%] left-[10%] w-1.5 h-1.5 bg-white rounded-full opacity-40 shadow-[0_0_10px_rgba(255,255,255,0.5)]"></div>
                <div class="absolute top-[35%] right-[15%] w-1 h-1 bg-white rounded-full opacity-50 shadow-[0_0_10px_rgba(255,255,255,0.8)]"></div>
                <div class="absolute bottom-[25%] right-[30%] w-2 h-2 bg-white rounded-full opacity-30 shadow-[0_0_10px_rgba(255,255,255,0.5)]"></div>
                <div class="absolute top-[15%] right-[40%] w-1 h-1 bg-white rounded-full opacity-30 shadow-[0_0_10px_rgba(255,255,255,0.5)]"></div>
            </div>

            {/* Glassmorphism Card */}
            <div class="relative z-10 w-full max-w-lg p-8 sm:p-10 bg-white/5 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] rounded-[2rem] flex flex-col items-center">

                {/* Logo */}
                <div class="w-[90px] h-[90px] rounded-full bg-[#1A1A1D]/80 border-[3px] border-[#3A76F0] flex items-center justify-center mb-5 shadow-[0_0_30px_rgba(58,118,240,0.45)] relative overflow-hidden transition-transform duration-300 hover:scale-105">
                    <svg width="42" height="42" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3.5 16.5L3.5 8.5L8.5 13.5L8.5 21.5L3.5 16.5Z" fill="white" />
                        <path d="M9.5 12.5L9.5 4.5L14.5 9.5L14.5 17.5L9.5 12.5Z" fill="white" />
                        <path d="M15.5 8.5L15.5 0.5L20.5 5.5L20.5 13.5L15.5 8.5Z" fill="white" />
                    </svg>
                </div>

                {/* Header Titles */}
                <h1 class="text-[28px] sm:text-[32px] font-bold text-white tracking-wide mb-1 font-sans">
                    Macro Workspace
                </h1>
                <p class="text-white/60 text-xs font-semibold tracking-wider uppercase mb-4 font-mono">
                    Enterprise Portal
                </p>

                <p class="text-center text-white/80 text-sm font-normal leading-relaxed mb-6 px-2 max-w-[380px]">
                    Sign in to access unified academic management, analytics, records, and services.
                </p>

                {/* Error Alert Box */}
                <Show when={errorMessage()}>
                    <div class="w-full mb-5 p-3.5 bg-red-500/15 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-200 text-xs font-medium animate-fadeIn">
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
                            aria-label="Dismiss error"
                        >
                            <svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    </div>
                </Show>

                {/* Login Form */}
                <form 
                    onSubmit={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        form.handleSubmit();
                    }} 
                    class="w-full space-y-4 mb-6"
                >
                    {/* Email Input Field */}
                    <form.Field name="email">
                        {(field) => (
                            <div class="space-y-1">
                                <label class="block text-xs font-medium text-white/80 px-1">
                                    Email Address
                                </label>
                                <div class="relative flex items-center">
                                    <span class="absolute left-4 text-white/40 pointer-events-none">
                                        <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <rect width="20" height="16" x="2" y="4" rx="2" />
                                            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                                        </svg>
                                    </span>
                                    <input
                                        type="email"
                                        placeholder="name@example.com"
                                        required
                                        autocomplete="email"
                                        value={field().state.value}
                                        onBlur={field().handleBlur}
                                        onInput={(e) => {
                                            field().handleChange(e.currentTarget.value);
                                            if (errorMessage()) setErrorMessage(null);
                                        }}
                                        class="w-full bg-[#1c1a1f]/50 border border-white/10 text-white placeholder-white/30 pl-11 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400/50 focus:bg-[#1c1a1f]/75 transition-all text-sm shadow-inner"
                                    />
                                </div>
                            </div>
                        )}
                    </form.Field>

                    {/* Password Input Field */}
                    <form.Field name="password">
                        {(field) => (
                            <div class="space-y-1">
                                <div class="flex items-center justify-between px-1">
                                    <label class="block text-xs font-medium text-white/80">
                                        Password
                                    </label>
                                </div>
                                <div class="relative flex items-center">
                                    <span class="absolute left-4 text-white/40 pointer-events-none">
                                        <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                        </svg>
                                    </span>
                                    <input
                                        type={showPassword() ? "text" : "password"}
                                        placeholder="••••••••••••"
                                        required
                                        autocomplete="current-password"
                                        value={field().state.value}
                                        onBlur={field().handleBlur}
                                        onInput={(e) => {
                                            field().handleChange(e.currentTarget.value);
                                            if (errorMessage()) setErrorMessage(null);
                                        }}
                                        class="w-full bg-[#1c1a1f]/50 border border-white/10 text-white placeholder-white/30 pl-11 pr-11 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400/50 focus:bg-[#1c1a1f]/75 transition-all text-sm shadow-inner"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword())}
                                        class="absolute right-3.5 text-white/40 hover:text-white/90 transition-colors p-1"
                                        aria-label={showPassword() ? "Hide password" : "Show password"}
                                    >
                                        <Show when={showPassword()} fallback={
                                            <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                                                <circle cx="12" cy="12" r="3" />
                                            </svg>
                                        }>
                                            <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                <path d="m9.88 9.88 4.24 4.24" />
                                                <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                                                <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                                                <line x1="2" x2="22" y1="2" y2="22" />
                                            </svg>
                                        </Show>
                                    </button>
                                </div>
                            </div>
                        )}
                    </form.Field>

                    {/* Remember me & Options */}
                    <div class="flex items-center justify-between pt-1 text-xs">
                        <label class="flex items-center gap-2 cursor-pointer text-white/70 hover:text-white transition-colors">
                            <input
                                type="checkbox"
                                checked={rememberMe()}
                                onChange={(e) => setRememberMe(e.currentTarget.checked)}
                                class="rounded border-white/20 bg-white/10 text-blue-500 focus:ring-0 focus:ring-offset-0 cursor-pointer size-3.5"
                            />
                            <span>Remember email</span>
                        </label>
                    </div>

                    {/* Submit Button */}
                    <form.Subscribe selector={(state) => state.canSubmit}>
                        {(canSubmit) => (
                            <button
                                type="submit"
                                disabled={!canSubmit() || isLoading()}
                                class="w-full mt-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3.5 px-4 rounded-xl border border-white/10 transition-all duration-300 shadow-[0_4px_20px_rgba(58,118,240,0.35)] hover:shadow-[0_6px_25px_rgba(58,118,240,0.5)] active:scale-[0.99] text-xs tracking-[0.12em] uppercase disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <Show when={isLoading()} fallback={
                                    <>
                                        <span>SIGN IN</span>
                                        <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                            <path d="M5 12h14" />
                                            <path d="m12 5 7 7-7 7" />
                                        </svg>
                                    </>
                                }>
                                    <svg class="animate-spin size-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span>SIGNING IN...</span>
                                </Show>
                            </button>
                        )}
                    </form.Subscribe>
                </form>

                {/* Card Footer */}
                <div class="w-full pt-4 border-t border-white/10 flex items-center justify-between text-xs text-white/50">
                    <A href="/" class="hover:text-white transition-colors flex items-center gap-1">
                        <svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="m15 18-6-6 6-6" />
                        </svg>
                        Back to portal
                    </A>
                    <A href="/authentification/login_with_session" class="text-blue-400/80 hover:text-blue-300 transition-colors flex items-center gap-1">
                        <svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                        </svg>
                        Session Mode
                    </A>
                </div>
            </div>
        </div>
    );
}
