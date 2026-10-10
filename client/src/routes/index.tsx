import { createSignal, onMount, Show, For } from 'solid-js';
import { useNavigate, A } from '@solidjs/router';
import { isAuthenticated, getDashboardPathForRole, getActiveRole, refreshAuthState } from '~/lib/authStore';
import { getInstitutionLogo } from '~/lib/institutionLogo';
import TopBar from '~/components/navigation/TopBar';

type GuideFlowId = 'all' | 'login' | 'acquisition' | 'forgot' | 'reset';

interface GuideStep {
    step: number;
    title: string;
    description: string;
}

interface GuideFlow {
    id: GuideFlowId;
    title: string;
    subtitle: string;
    badge: string;
    badgeColor: string;
    accentColor: string;
    route: string;
    buttonLabel: string;
    recommended?: boolean;
    requirements: string[];
    steps: GuideStep[];
    tip: string;
}

export default function Home() {
    const navigate = useNavigate();
    const [selectedCategory, setSelectedCategory] = createSignal<GuideFlowId>('all');

    onMount(() => {
        if (typeof document !== 'undefined') {
            document.title = 'Panduan Autentikasi & Portal Akademik - XSIA XARX';
        }
        refreshAuthState();
        if (isAuthenticated()) {
            navigate(getDashboardPathForRole(getActiveRole()), { replace: true });
        }
    });

    const guideFlows: GuideFlow[] = [
        {
            id: 'login',
            title: '1. Masuk Sistem (Login Portal)',
            subtitle: 'Metode utama untuk mengakses dasbor akademik dengan keamanan sesi terenkripsi.',
            badge: 'Default / Direkomendasikan',
            badgeColor: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
            accentColor: 'emerald',
            route: '/authentification/login_with_session',
            buttonLabel: 'Buka Halaman Masuk Sesi',
            recommended: true,
            requirements: ['Username / Email / NIM terdaftar', 'Kata Sandi akun', 'Peran aktif (jika memiliki multi-peran)'],
            steps: [
                {
                    step: 1,
                    title: 'Buka Halaman Masuk Sesi (Default)',
                    description: 'Klik tombol Masuk Sesi pada navigasi atau tombol utama di halaman ini.',
                },
                {
                    step: 2,
                    title: 'Masukkan Kredensial Pengguna',
                    description: 'Ketik Username, Email terdaftar, atau Nomor Induk Mahasiswa/Pegawai beserta kata sandi Anda.',
                },
                {
                    step: 3,
                    title: 'Verifikasi Keamanan Sesi',
                    description: 'Sistem mengesahkan session token aman yang otomatis tersinkronisasi dengan peran otoritas Anda.',
                },
                {
                    step: 4,
                    title: 'Akses Dasbor Kerja',
                    description: 'Anda langsung dialihkan ke ruang kerja Anda (Mahasiswa, Dosen, Rektorat, atau Departemen).',
                },
            ],
            tip: 'Catatan: Opsi Masuk Standar (JWT) tetap tersedia di menu untuk pengembang atau integrasi API pihak ketiga.',
        },
        {
            id: 'acquisition',
            title: '2. Permohonan Akun (Account Acquisition)',
            subtitle: 'Prosedur mandiri pembuatan akun bagi mahasiswa atau sivitas akademika baru yang belum memiliki akses login.',
            badge: 'Pendaftaran Akses',
            badgeColor: 'bg-teal-500/10 text-teal-400 border-teal-500/30',
            accentColor: 'teal',
            route: '/authentification/account-acquisition-request',
            buttonLabel: 'Ajukan Permohonan Akun',
            requirements: ['NIK 16 digit sesuai KTP/KK', 'NIM / Kode Mahasiswa valid', 'Email aktif', 'Nomor WhatsApp aktif'],
            steps: [
                {
                    step: 1,
                    title: 'Akses Formulir Permohonan Akun',
                    description: 'Navigasikan ke menu Permohonan Akun (/authentification/account-acquisition-request).',
                },
                {
                    step: 2,
                    title: 'Lengkapi Data Identitas',
                    description: 'Isi NIK (16 digit), NIM/Kode Mahasiswa, Email aktif, dan Nomor WhatsApp yang dapat dihubungi.',
                },
                {
                    step: 3,
                    title: 'Tentukan Kata Sandi Baru',
                    description: 'Buat kata sandi yang kuat dan aman untuk akun portal akademik Anda.',
                },
                {
                    step: 4,
                    title: 'Verifikasi Data Otomatis',
                    description: 'Sistem mencocokkan data Anda dengan arsip induk kampus dan mengirimkan konfirmasi WhatsApp/Email.',
                },
            ],
            tip: 'Pastikan NIK dan NIM sama persis dengan data saat Anda dinyatakan lulus registrasi PMB.',
        },
        {
            id: 'forgot',
            title: '3. Lupa Kata Sandi (Forgot Password)',
            subtitle: 'Solusi pemulihan akun jika Anda lupa atau kehilangan kredensial kata sandi portal Anda.',
            badge: 'Pemulihan Akun',
            badgeColor: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
            accentColor: 'amber',
            route: '/authentification/forgot-password',
            buttonLabel: 'Mulai Pemulihan Sandi',
            requirements: ['Email akun yang telah terdaftar', 'Nomor WhatsApp aktif yang terhubung'],
            steps: [
                {
                    step: 1,
                    title: 'Buka Halaman Lupa Kata Sandi',
                    description: 'Klik menu Lupa Kata Sandi pada menu navigasi atau tautan di bawah form login.',
                },
                {
                    step: 2,
                    title: 'Masukkan Email & Nomor Telepon',
                    description: 'Ketikkan alamat email dan nomor WhatsApp yang telah terdaftar pada sistem akademik.',
                },
                {
                    step: 3,
                    title: 'Kirim Permintaan Pemulihan',
                    description: 'Klik tombol Kirim. Sistem akan menghasilkan tautan dan token reset UUID unik.',
                },
                {
                    step: 4,
                    title: 'Buka Tautan WhatsApp / Email',
                    description: 'Periksa pesan masuk untuk mengklik tautan langsung atau menyalin token reset yang dikirimkan.',
                },
            ],
            tip: 'Tautan pemulihan memiliki masa berlaku terbatas demi keamanan akun Anda. Segera lakukan reset setelah menerima pesan.',
        },
        {
            id: 'reset',
            title: '4. Reset Kata Sandi (Password Reset)',
            subtitle: 'Tahap akhir pemulihan untuk menetapkan kata sandi baru menggunakan token reset yang telah diterima.',
            badge: 'Pembaruan Sandi',
            badgeColor: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
            accentColor: 'purple',
            route: '/authentification/password-reset',
            buttonLabel: 'Buka Halaman Reset Sandi',
            requirements: ['Token reset dari email/WhatsApp', 'Kata sandi baru (minimal 8 karakter)', 'Konfirmasi kata sandi cocok'],
            steps: [
                {
                    step: 1,
                    title: 'Buka Halaman Reset Kata Sandi',
                    description: 'Akses halaman /authentification/password-reset melalui tautan di pesan WhatsApp/Email.',
                },
                {
                    step: 2,
                    title: 'Masukkan Token Reset',
                    description: 'Ketik atau tempelkan token reset yang diberikan oleh sistem.',
                },
                {
                    step: 3,
                    title: 'Ketik Kata Sandi Baru & Konfirmasi',
                    description: 'Buat kata sandi baru dan pastikan kedua kolom kata sandi cocok dan memenuhi standar keamanan.',
                },
                {
                    step: 4,
                    title: 'Selesai & Masuk Sesi',
                    description: 'Klik Reset Kata Sandi. Sistem akan menyimpan sandi baru dan mengarahkan Anda ke Masuk Sesi.',
                },
            ],
            tip: 'Gunakan kombinasi huruf besar, huruf kecil, angka, dan simbol untuk perlindungan kata sandi yang optimal.',
        },
    ];

    const filteredFlows = () => {
        const cat = selectedCategory();
        if (cat === 'all') return guideFlows;
        return guideFlows.filter((f) => f.id === cat);
    };

    return (
        <div class="min-h-screen flex flex-col bg-[#0A0F1D] text-neutral-100 selection:bg-emerald-500/30 selection:text-emerald-200">
            <TopBar />

            <main class="flex-1 relative overflow-hidden">
                {/* Ambient glowing background shapes */}
                <div class="absolute inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
                    <div class="absolute top-[-20%] left-[-10%] w-[65%] h-[65%] bg-[#0f3460]/40 rounded-full blur-[140px] opacity-70"></div>
                    <div class="absolute top-[40%] right-[-15%] w-[60%] h-[60%] bg-[#0d9488]/20 rounded-full blur-[150px] opacity-60"></div>
                    <div class="absolute bottom-[-20%] left-[20%] w-[55%] h-[55%] bg-[#3b82f6]/20 rounded-full blur-[140px] opacity-50"></div>
                    <div class="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [bg-size:24px_24px] opacity-40"></div>
                </div>

                <div class="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
                    {/* Hero Section */}
                    <header class="flex flex-col items-center text-center mb-12 sm:mb-16">
                        {/* Institution Logo */}
                        <Show when={getInstitutionLogo()}>
                            <div class="mb-6 flex items-center justify-center">
                                <img
                                    src={getInstitutionLogo()!}
                                    alt="Institution Logo"
                                    class="h-20 sm:h-24 w-auto object-contain drop-shadow-[0_0_25px_rgba(16,185,129,0.35)] transition-transform duration-300 hover:scale-105"
                                />
                            </div>
                        </Show>

                        {/* Top System Badge */}
                        <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold tracking-wide uppercase shadow-sm mb-5">
                            <span class="size-2 rounded-full bg-emerald-400 animate-pulse"></span>
                            <span>Sistem Informasi Akademik • Panduan Autentikasi Pengguna</span>
                        </div>

                        {/* Main Headline */}
                        <h1 class="text-3xl sm:text-5xl font-extrabold tracking-tight text-white max-w-3xl leading-tight sm:leading-tight mb-4">
                            Panduan Lengkap Masuk dan Pengelolaan Akun Portal
                        </h1>

                        {/* Subtitle */}
                        <p class="text-base sm:text-lg text-neutral-300 max-w-2xl font-normal leading-relaxed mb-8">
                            Selamat datang di portal akademik terpadu.
                            Ikuti petunjuk langkah demi langkah di bawah ini untuk mengakses ruang kerja Anda, mendaftarkan akun baru, atau memulihkan kata sandi.
                        </p>

                        {/* Quick Hero Action CTAs */}
                        <div class="flex flex-wrap items-center justify-center gap-3 sm:gap-4 w-full max-w-xl">
                            <A
                                href="/authentification/login_with_session"
                                class="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xs bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-all shadow-[0_0_25px_rgba(16,185,129,0.4)] hover:shadow-[0_0_30px_rgba(16,185,129,0.6)] hover:-translate-y-0.5"
                            >
                                <svg class="size-4 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                    <path d="m9 12 2 2 4-4" />
                                </svg>
                                <span>Masuk Sesi (Default)</span>
                            </A>

                            <A
                                href="/authentification/account-acquisition-request"
                                class="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xs bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 hover:border-slate-500 text-neutral-200 text-sm font-semibold transition-all hover:-translate-y-0.5"
                            >
                                <svg class="size-4 shrink-0 text-teal-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                    <circle cx="9" cy="7" r="4" />
                                    <line x1="19" y1="8" x2="19" y2="14" />
                                    <line x1="22" y1="11" x2="16" y2="11" />
                                </svg>
                                <span>Permohonan Akun</span>
                            </A>

                            <A
                                href="/authentification/candidate-addmission-procedure"
                                class="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xs bg-slate-800/80 hover:bg-slate-700/80 border border-amber-500/40 hover:border-amber-400/70 text-neutral-200 text-sm font-semibold transition-all hover:-translate-y-0.5"
                            >
                                <svg class="size-4 shrink-0 text-amber-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                                    <path d="M6 12v5c3 3 9 3 12 0v-5" />
                                </svg>
                                <span>Pendaftaran Mahasiswa Baru</span>
                            </A>
                            {/*
                            <A
                                href="/authentification/login"
                                class="inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-xs text-neutral-400 hover:text-white hover:bg-white/5 text-xs font-medium transition-colors"
                                title="Login alternatif berbasis JWT Bearer Token"
                            >
                                <svg class="size-3.5 shrink-0 text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                                    <polyline points="10 17 15 12 10 7" />
                                    <line x1="15" x2="3" y1="12" y2="12" />
                                </svg>
                                <span>Masuk Standar (JWT)</span>
                            </A>
                            */}
                        </div>
                    </header>

                    {/* Candidate Admission Banner */}
                    <section class="mb-12 bg-linear-to-r from-amber-950/40 via-slate-900/60 to-emerald-950/40 border border-amber-500/25 rounded-xs p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div class="space-y-2 max-w-2xl">
                            <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xs bg-amber-500/10 text-amber-300 text-xs font-mono font-bold uppercase border border-amber-500/30">
                                Penerimaan Mahasiswa Baru
                            </div>
                            <h2 class="text-xl sm:text-2xl font-bold text-white">Ingin mendaftar sebagai calon mahasiswa baru?</h2>
                            <p class="text-sm text-neutral-300 leading-relaxed">
                                Pelajari dokumen yang perlu disiapkan dan cara mengisi formulir pendaftaran, lalu buat akun pendaftaran Anda secara daring.
                            </p>
                        </div>
                        <div class="flex flex-wrap gap-3 shrink-0">
                            <A
                                href="/authentification/candidate-addmission-procedure"
                                class="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xs bg-slate-800 hover:bg-slate-700 text-neutral-200 border border-slate-700 hover:border-slate-600 text-xs font-semibold transition-all"
                            >
                                Baca Prosedur Pendaftaran
                            </A>
                            <A
                                href="/authentification/candidate-addmission-form"
                                class="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xs bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-900/40 transition-all"
                            >
                                Isi Formulir Pendaftaran
                            </A>
                        </div>
                    </section>

                    {/* Interactive Filter Pills */}
                    <div class="flex items-center justify-center mb-10 overflow-x-auto pb-2">
                        <div class="inline-flex items-center gap-1.5 p-1.5 bg-slate-900/80 border border-slate-800 rounded-xs backdrop-blur-md">
                            <button
                                type="button"
                                onClick={() => setSelectedCategory('all')}
                                class={`px-3 py-1.5 text-xs font-semibold rounded-xs transition-colors ${selectedCategory() === 'all'
                                    ? 'bg-blue-600 text-white shadow-xs'
                                    : 'text-neutral-400 hover:text-neutral-200'
                                    }`}
                            >
                                Semua Panduan (4)
                            </button>
                            <button
                                type="button"
                                onClick={() => setSelectedCategory('login')}
                                class={`px-3 py-1.5 text-xs font-semibold rounded-xs transition-colors ${selectedCategory() === 'login'
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'text-neutral-400 hover:text-neutral-200'
                                    }`}
                            >
                                1. Masuk Sesi (Default)
                            </button>
                            <button
                                type="button"
                                onClick={() => setSelectedCategory('acquisition')}
                                class={`px-3 py-1.5 text-xs font-semibold rounded-xs transition-colors ${selectedCategory() === 'acquisition'
                                    ? 'bg-teal-600 text-white shadow-xs'
                                    : 'text-neutral-400 hover:text-neutral-200'
                                    }`}
                            >
                                2. Permohonan Akun
                            </button>
                            <button
                                type="button"
                                onClick={() => setSelectedCategory('forgot')}
                                class={`px-3 py-1.5 text-xs font-semibold rounded-xs transition-colors ${selectedCategory() === 'forgot'
                                    ? 'bg-amber-600 text-white shadow-xs'
                                    : 'text-neutral-400 hover:text-neutral-200'
                                    }`}
                            >
                                3. Lupa Sandi
                            </button>
                            <button
                                type="button"
                                onClick={() => setSelectedCategory('reset')}
                                class={`px-3 py-1.5 text-xs font-semibold rounded-xs transition-colors ${selectedCategory() === 'reset'
                                    ? 'bg-purple-600 text-white shadow-xs'
                                    : 'text-neutral-400 hover:text-neutral-200'
                                    }`}
                            >
                                4. Reset Sandi
                            </button>
                        </div>
                    </div>

                    {/* Step-by-Step Instruction Cards */}
                    <div class="space-y-8 mb-16">
                        <For each={filteredFlows()}>
                            {(flow) => (
                                <article class="relative bg-slate-900/60 backdrop-blur-xl border border-slate-800 hover:border-slate-700/80 rounded-xs p-6 sm:p-8 shadow-xl transition-all">
                                    {/* Card Header */}
                                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800/80">
                                        <div class="space-y-1.5">
                                            <div class="flex flex-wrap items-center gap-2">
                                                <h2 class="text-xl sm:text-2xl font-bold text-white tracking-wide">
                                                    {flow.title}
                                                </h2>
                                                <span class={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-xs border ${flow.badgeColor}`}>
                                                    {flow.badge}
                                                </span>
                                            </div>
                                            <p class="text-sm text-neutral-400 max-w-2xl leading-relaxed">
                                                {flow.subtitle}
                                            </p>
                                        </div>

                                        <A
                                            href={flow.route}
                                            class={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xs text-xs font-semibold shrink-0 transition-all ${flow.recommended
                                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-900/40 hover:-translate-y-0.5'
                                                : 'bg-slate-800 hover:bg-slate-700 text-neutral-200 border border-slate-700 hover:border-slate-600 hover:-translate-y-0.5'
                                                }`}
                                        >
                                            <span>{flow.buttonLabel}</span>
                                            <svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                <line x1="5" y1="12" x2="19" y2="12" />
                                                <polyline points="12 5 19 12 12 19" />
                                            </svg>
                                        </A>
                                    </div>

                                    {/* Requirements Bar */}
                                    <div class="py-4 flex flex-wrap items-center gap-2 text-xs">
                                        <span class="font-mono text-neutral-400 uppercase tracking-wider font-semibold">
                                            Persyaratan:
                                        </span>
                                        <For each={flow.requirements}>
                                            {(req) => (
                                                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xs bg-slate-800/60 border border-slate-700/60 text-neutral-300 font-medium">
                                                    <span class="size-1.5 rounded-full bg-slate-400"></span>
                                                    <span>{req}</span>
                                                </span>
                                            )}
                                        </For>
                                    </div>

                                    {/* Steps Grid */}
                                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 my-4">
                                        <For each={flow.steps}>
                                            {(step) => (
                                                <div class="p-4 rounded-xs bg-slate-950/40 border border-slate-800/60 flex flex-col justify-between space-y-3">
                                                    <div class="space-y-2">
                                                        <div class="flex items-center gap-2">
                                                            <span class="size-6 rounded-xs bg-slate-800 border border-slate-700 text-white text-xs font-bold font-mono flex items-center justify-center">
                                                                {step.step}
                                                            </span>
                                                            <h3 class="text-xs font-bold text-neutral-200 leading-snug">
                                                                {step.title}
                                                            </h3>
                                                        </div>
                                                        <p class="text-xs text-neutral-400 leading-relaxed">
                                                            {step.description}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </For>
                                    </div>

                                    {/* Pro Tip Box */}
                                    <div class="mt-4 p-3 bg-slate-950/60 border border-slate-800/80 rounded-xs flex items-start gap-2.5 text-xs text-neutral-300">
                                        <svg class="size-4 shrink-0 text-amber-400 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <circle cx="12" cy="12" r="10" />
                                            <line x1="12" y1="16" x2="12" y2="12" />
                                            <line x1="12" y1="8" x2="12.01" y2="8" />
                                        </svg>
                                        <span class="leading-relaxed">
                                            {flow.tip}
                                        </span>
                                    </div>
                                </article>
                            )}
                        </For>
                    </div>

                    {/* Comparison Box: Session vs JWT
                    <section class="bg-linear-to-r from-emerald-950/30 via-slate-900/60 to-blue-950/30 border border-emerald-500/20 rounded-xs p-6 sm:p-8 mb-16">
                        <div class="max-w-3xl">
                            <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xs bg-emerald-500/10 text-emerald-400 text-xs font-mono font-bold uppercase mb-2 border border-emerald-500/20">
                                Rekomendasi Keamanan
                            </div>
                            <h2 class="text-xl sm:text-2xl font-bold text-white mb-2">
                                Mengapa Masuk Sesi (Session Login) Dijadikan Pilihan Standar?
                            </h2>
                            <p class="text-xs sm:text-sm text-neutral-300 leading-relaxed mb-5">
                                Mode Masuk Sesi (<code class="text-emerald-400 font-mono">/authentification/login_with_session</code>) menggunakan pengikatan sesi server dengan proteksi cookie <span class="font-mono text-emerald-300">HttpOnly</span>, perlindungan CSRF terintegrasi, dan sinkronisasi otomatis status multi-peran (Dosen, Mahasiswa, Rektorat). Ini memberikan keamanan tertinggi saat mengakses sistem dari peramban web publik atau komputer bersama.
                            </p>
                            <div class="flex flex-wrap items-center gap-3">
                                <A
                                    href="/authentification/login_with_session"
                                    class="inline-flex items-center gap-2 px-4 py-2 rounded-xs bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors"
                                >
                                    <span>Gunakan Masuk Sesi Sekarang</span>
                                    <svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <polyline points="9 18 15 12 9 6" />
                                    </svg>
                                </A>
                                <A
                                    href="/authentification/login"
                                    class="text-xs text-neutral-400 hover:text-white underline transition-colors"
                                >
                                    Beralih ke Masuk Standar (JWT)
                                </A>
                            </div>
                        </div>
                    </section>
                    */}

                    {/* Support & Helpdesk Footer */}
                    <footer class="text-center pt-8 border-t border-slate-800/80 text-xs text-neutral-500">
                        <p class="mb-2">
                            Butuh bantuan lebih lanjut terkait akun Anda? Hubungi Layanan Administrasi Akademik atau Pusat Data dan Sistem Informasi Institusi.
                        </p>
                        <p class="font-mono text-[11px] text-neutral-600">
                            Sistem Informasi Akademik
                        </p>
                    </footer>
                </div>
            </main>
        </div>
    );
}
