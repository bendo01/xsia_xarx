import { createForm } from '@tanstack/solid-form';
import { onMount, onCleanup } from 'solid-js';

export default function Login() {
    let canvasRef: HTMLCanvasElement | undefined;

    const form = createForm(() => ({
        defaultValues: {
            email: '',
            password: '',
        },
        onSubmit: async ({ value }) => {
            console.log('Login attempt:', value);
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
                // Subtle blueish white for rain
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
            // Slightly clear the canvas to leave a trail effect for drops
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
        <div class="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-[#0F2027]">
            {/* Background Gradients to match the image */}
            <div class="absolute inset-0 w-full h-full pointer-events-none z-0">
                {/* Top Left Deep Blue */}
                <div class="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] bg-[#0f3460] rounded-full mix-blend-screen filter blur-[100px] opacity-80"></div>
                {/* Bottom Left Deep Red */}
                <div class="absolute -bottom-[20%] -left-[10%] w-[60%] h-[60%] bg-[#e94560] rounded-full mix-blend-multiply filter blur-[120px] opacity-90"></div>
                {/* Bottom Right Bright Orange */}
                <div class="absolute -bottom-[20%] -right-[10%] w-[70%] h-[70%] bg-[#f9a826] rounded-full mix-blend-screen filter blur-[120px] opacity-70"></div>

                {/* Custom SVG Wave to give that sharp transition shown in the image */}
                <svg class="absolute bottom-0 w-full h-[80%] opacity-40 mix-blend-overlay" preserveAspectRatio="none" viewBox="0 0 1440 320" xmlns="http://www.w3.org/2000/svg">
                    <path fill="#ffffff" fill-opacity="1" d="M0,192L48,202.7C96,213,192,235,288,218.7C384,203,480,149,576,149.3C672,149,768,203,864,229.3C960,256,1056,256,1152,240C1248,224,1344,192,1392,176L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
                </svg>

                {/* Rain Canvas */}
                <canvas ref={canvasRef} class="absolute inset-0 w-full h-full opacity-60 mix-blend-screen"></canvas>


                {/* Small floating stars/particles */}
                <div class="absolute top-[25%] left-[20%] w-1 h-1 bg-white rounded-full opacity-60 shadow-[0_0_10px_rgba(255,255,255,0.8)]"></div>
                <div class="absolute top-[65%] left-[10%] w-1.5 h-1.5 bg-white rounded-full opacity-40 shadow-[0_0_10px_rgba(255,255,255,0.5)]"></div>
                <div class="absolute top-[35%] right-[15%] w-1 h-1 bg-white rounded-full opacity-50 shadow-[0_0_10px_rgba(255,255,255,0.8)]"></div>
                <div class="absolute bottom-[25%] right-[30%] w-2 h-2 bg-white rounded-full opacity-30 shadow-[0_0_10px_rgba(255,255,255,0.5)]"></div>
                <div class="absolute top-[15%] right-[40%] w-1 h-1 bg-white rounded-full opacity-30 shadow-[0_0_10px_rgba(255,255,255,0.5)]"></div>
            </div>

            {/* Glassmorphism Card */}
            <div class="relative z-10 w-full max-w-lg p-10 bg-white/5 backdrop-blur-2xl border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.3)] rounded-[2rem] flex flex-col items-center">

                {/* Logo */}
                <div class="w-[100px] h-[100px] rounded-full bg-[#1A1A1D] border-[3px] border-[#3A76F0] flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(58,118,240,0.4)] relative overflow-hidden transition-transform duration-300 hover:scale-105 cursor-pointer">
                    <svg width="45" height="45" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3.5 16.5L3.5 8.5L8.5 13.5L8.5 21.5L3.5 16.5Z" fill="white" />
                        <path d="M9.5 12.5L9.5 4.5L14.5 9.5L14.5 17.5L9.5 12.5Z" fill="white" />
                        <path d="M15.5 8.5L15.5 0.5L20.5 5.5L20.5 13.5L15.5 8.5Z" fill="white" />
                    </svg>
                </div>

                {/* Text */}
                <h1 class="text-[32px] font-bold text-white tracking-wide mb-1">Macro</h1>
                <p class="text-white/70 text-sm font-medium tracking-wide mb-5 font-mono">@macro-inc</p>

                <p class="text-center text-white/90 text-[15px] font-medium leading-relaxed mb-8 px-4 max-w-[360px]">
                    A unified, AI-native workspace: email, messaging, docs, tasks, files and CRM, with team-level memory.
                </p>

                {/* Login Form */}
                <form 
                    onSubmit={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        form.handleSubmit();
                    }} 
                    class="w-full space-y-4 mb-8"
                >
                    <form.Field name="email">
                        {(field) => (
                            <div>
                                <input
                                    type="email"
                                    placeholder="Email Address"
                                    required
                                    value={field().state.value}
                                    onBlur={field().handleBlur}
                                    onInput={(e) => field().handleChange(e.currentTarget.value)}
                                    class="w-full bg-[#1c1a1f]/40 border border-white/10 text-white placeholder-white/40 px-5 py-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/20 focus:bg-[#1c1a1f]/60 transition-all text-sm shadow-inner"
                                />
                            </div>
                        )}
                    </form.Field>
                    <form.Field name="password">
                        {(field) => (
                            <div>
                                <input
                                    type="password"
                                    placeholder="Password"
                                    required
                                    value={field().state.value}
                                    onBlur={field().handleBlur}
                                    onInput={(e) => field().handleChange(e.currentTarget.value)}
                                    class="w-full bg-[#1c1a1f]/40 border border-white/10 text-white placeholder-white/40 px-5 py-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-white/20 focus:bg-[#1c1a1f]/60 transition-all text-sm shadow-inner"
                                />
                            </div>
                        )}
                    </form.Field>
                    <form.Subscribe selector={(state) => state.canSubmit}>
                        {(canSubmit) => (
                            <button
                                type="submit"
                                disabled={!canSubmit()}
                                class="w-full mt-4 bg-white/10 hover:bg-white/20 text-white font-bold py-3.5 px-4 rounded-xl border border-white/10 transition-all duration-300 shadow-lg text-[13px] tracking-[0.1em] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                SIGN IN
                            </button>
                        )}
                    </form.Subscribe>
                </form>
            </div>
        </div>
    );
}
