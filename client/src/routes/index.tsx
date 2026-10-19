import { createSignal, onMount, Show, For } from 'solid-js';
import { useNavigate, A } from '@solidjs/router';
import { isAuthenticated, getDashboardPathForRole, getActiveRole, refreshAuthState } from '~/lib/authStore';
import { getInstitutionLogo } from '~/lib/institutionLogo';
import TopBar from '~/components/navigation/TopBar';
import { t } from '~/i18n';

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
            document.title = t('au.homeDocTitle');
        }
        refreshAuthState();
        if (isAuthenticated()) {
            navigate(getDashboardPathForRole(getActiveRole()), { replace: true });
        }
    });

    const guideFlows = (): GuideFlow[] => [
        {
            id: 'login',
            title: t('au.homeLoginTitle'),
            subtitle: t('au.homeLoginSubtitle'),
            badge: t('au.homeLoginBadge'),
            badgeColor: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
            accentColor: 'emerald',
            route: '/authentification/login_with_session',
            buttonLabel: t('au.homeLoginButton'),
            recommended: true,
            requirements: [t('au.homeLoginReq1'), t('au.homeLoginReq2'), t('au.homeLoginReq3')],
            steps: [
                {
                    step: 1,
                    title: t('au.homeLoginStep1Title'),
                    description: t('au.homeLoginStep1Desc'),
                },
                {
                    step: 2,
                    title: t('au.homeLoginStep2Title'),
                    description: t('au.homeLoginStep2Desc'),
                },
                {
                    step: 3,
                    title: t('au.homeLoginStep3Title'),
                    description: t('au.homeLoginStep3Desc'),
                },
                {
                    step: 4,
                    title: t('au.homeLoginStep4Title'),
                    description: t('au.homeLoginStep4Desc'),
                },
            ],
            tip: t('au.homeLoginTip'),
        },
        {
            id: 'acquisition',
            title: t('au.homeAcqTitle'),
            subtitle: t('au.homeAcqSubtitle'),
            badge: t('au.homeAcqBadge'),
            badgeColor: 'bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-500/30',
            accentColor: 'teal',
            route: '/authentification/account-acquisition-request',
            buttonLabel: t('au.homeAcqButton'),
            requirements: [t('au.homeAcqReq1'), t('au.homeAcqReq2'), t('au.homeAcqReq3'), t('au.homeAcqReq4')],
            steps: [
                {
                    step: 1,
                    title: t('au.homeAcqStep1Title'),
                    description: t('au.homeAcqStep1Desc'),
                },
                {
                    step: 2,
                    title: t('au.homeAcqStep2Title'),
                    description: t('au.homeAcqStep2Desc'),
                },
                {
                    step: 3,
                    title: t('au.homeAcqStep3Title'),
                    description: t('au.homeAcqStep3Desc'),
                },
                {
                    step: 4,
                    title: t('au.homeAcqStep4Title'),
                    description: t('au.homeAcqStep4Desc'),
                },
            ],
            tip: t('au.homeAcqTip'),
        },
        {
            id: 'forgot',
            title: t('au.homeForgotTitle'),
            subtitle: t('au.homeForgotSubtitle'),
            badge: t('au.homeForgotBadge'),
            badgeColor: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30',
            accentColor: 'amber',
            route: '/authentification/forgot-password',
            buttonLabel: t('au.homeForgotButton'),
            requirements: [t('au.homeForgotReq1'), t('au.homeForgotReq2')],
            steps: [
                {
                    step: 1,
                    title: t('au.homeForgotStep1Title'),
                    description: t('au.homeForgotStep1Desc'),
                },
                {
                    step: 2,
                    title: t('au.homeForgotStep2Title'),
                    description: t('au.homeForgotStep2Desc'),
                },
                {
                    step: 3,
                    title: t('au.homeForgotStep3Title'),
                    description: t('au.homeForgotStep3Desc'),
                },
                {
                    step: 4,
                    title: t('au.homeForgotStep4Title'),
                    description: t('au.homeForgotStep4Desc'),
                },
            ],
            tip: t('au.homeForgotTip'),
        },
        {
            id: 'reset',
            title: t('au.homeResetTitle'),
            subtitle: t('au.homeResetSubtitle'),
            badge: t('au.homeResetBadge'),
            badgeColor: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30',
            accentColor: 'purple',
            route: '/authentification/password-reset',
            buttonLabel: t('au.homeResetButton'),
            requirements: [t('au.homeResetReq1'), t('au.homeResetReq2'), t('au.homeResetReq3')],
            steps: [
                {
                    step: 1,
                    title: t('au.homeResetStep1Title'),
                    description: t('au.homeResetStep1Desc'),
                },
                {
                    step: 2,
                    title: t('au.homeResetStep2Title'),
                    description: t('au.homeResetStep2Desc'),
                },
                {
                    step: 3,
                    title: t('au.homeResetStep3Title'),
                    description: t('au.homeResetStep3Desc'),
                },
                {
                    step: 4,
                    title: t('au.homeResetStep4Title'),
                    description: t('au.homeResetStep4Desc'),
                },
            ],
            tip: t('au.homeResetTip'),
        },
    ];

    const filteredFlows = () => {
        const cat = selectedCategory();
        if (cat === 'all') return guideFlows();
        return guideFlows().filter((f) => f.id === cat);
    };

    return (
        <div class="min-h-screen flex flex-col bg-neutral-50 dark:bg-[#0A0F1D] text-neutral-800 dark:text-neutral-100 selection:bg-emerald-500/30 selection:text-emerald-200">
            <TopBar />

            <main class="flex-1 relative overflow-hidden">
                {/* Ambient glowing background shapes */}
                <div class="absolute inset-0 pointer-events-none z-0 overflow-hidden opacity-50 dark:opacity-100" aria-hidden="true">
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
                                    alt={t('au.logo')}
                                    class="h-20 sm:h-24 w-auto object-contain drop-shadow-[0_0_25px_rgba(16,185,129,0.35)] transition-transform duration-300 hover:scale-105"
                                />
                            </div>
                        </Show>

                        {/* Top System Badge */}
                        <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold tracking-wide uppercase shadow-sm mb-5">
                            <span class="size-2 rounded-full bg-emerald-400 animate-pulse"></span>
                            <span>{t('au.homeHeroBadge')}</span>
                        </div>

                        {/* Main Headline */}
                        <h1 class="text-3xl sm:text-5xl font-extrabold tracking-tight text-neutral-900 dark:text-white max-w-3xl leading-tight sm:leading-tight mb-4">
                            {t('au.homeHeroTitle')}
                        </h1>

                        {/* Subtitle */}
                        <p class="text-base sm:text-lg text-neutral-600 dark:text-neutral-300 max-w-2xl font-normal leading-relaxed mb-8">
                            {t('au.homeHeroSubtitle')}
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
                                <span>{t('au.homeCtaLogin')}</span>
                            </A>

                            <A
                                href="/authentification/account-acquisition-request"
                                class="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xs bg-neutral-100 dark:bg-slate-800/80 hover:bg-neutral-200 dark:hover:bg-slate-700/80 border border-neutral-300 dark:border-slate-700 hover:border-neutral-400 dark:hover:border-slate-500 text-neutral-700 dark:text-neutral-200 text-sm font-semibold transition-all hover:-translate-y-0.5"
                            >
                                <svg class="size-4 shrink-0 text-teal-700 dark:text-teal-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                    <circle cx="9" cy="7" r="4" />
                                    <line x1="19" y1="8" x2="19" y2="14" />
                                    <line x1="22" y1="11" x2="16" y2="11" />
                                </svg>
                                <span>{t('au.homeCtaAccount')}</span>
                            </A>

                            <A
                                href="/authentification/candidate-addmission-procedure"
                                class="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xs bg-neutral-100 dark:bg-slate-800/80 hover:bg-neutral-200 dark:hover:bg-slate-700/80 border border-amber-500/40 hover:border-amber-400/70 text-neutral-700 dark:text-neutral-200 text-sm font-semibold transition-all hover:-translate-y-0.5"
                            >
                                <svg class="size-4 shrink-0 text-amber-700 dark:text-amber-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                                    <path d="M6 12v5c3 3 9 3 12 0v-5" />
                                </svg>
                                <span>{t('au.homeCtaAdmission')}</span>
                            </A>
                            {/*
                            <A
                                href="/authentification/login"
                                class="inline-flex items-center justify-center gap-2 px-4 py-3.5 rounded-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-900/5 dark:hover:bg-white/5 text-xs font-medium transition-colors"
                                title="Login alternatif berbasis JWT Bearer Token"
                            >
                                <svg class="size-3.5 shrink-0 text-blue-700 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
                    <section class="mb-12 bg-linear-to-r from-amber-50 dark:from-amber-950/40 via-white/60 dark:via-slate-900/60 to-emerald-50 dark:to-emerald-950/40 border border-amber-500/25 rounded-xs p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div class="space-y-2 max-w-2xl">
                            <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xs bg-amber-500/10 text-amber-700 dark:text-amber-300 text-xs font-mono font-bold uppercase border border-amber-500/30">
                                {t('au.homeBannerBadge')}
                            </div>
                            <h2 class="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white">{t('au.homeBannerTitle')}</h2>
                            <p class="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">
                                {t('au.homeBannerDesc')}
                            </p>
                        </div>
                        <div class="flex flex-wrap gap-3 shrink-0">
                            <A
                                href="/authentification/candidate-addmission-procedure"
                                class="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xs bg-neutral-100 dark:bg-slate-800 hover:bg-neutral-200 dark:hover:bg-slate-700 text-neutral-700 dark:text-neutral-200 border border-neutral-300 dark:border-slate-700 hover:border-neutral-400 dark:hover:border-slate-600 text-xs font-semibold transition-all"
                            >
                                {t('au.homeBannerRead')}
                            </A>
                            <A
                                href="/authentification/candidate-addmission-form"
                                class="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xs bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-900/40 transition-all"
                            >
                                {t('au.homeBannerForm')}
                            </A>
                        </div>
                    </section>

                    {/* Interactive Filter Pills */}
                    <div class="flex items-center justify-center mb-10 overflow-x-auto pb-2">
                        <div class="inline-flex items-center gap-1.5 p-1.5 bg-white/80 dark:bg-slate-900/80 border border-neutral-200 dark:border-slate-800 rounded-xs backdrop-blur-md">
                            <button
                                type="button"
                                onClick={() => setSelectedCategory('all')}
                                class={`px-3 py-1.5 text-xs font-semibold rounded-xs transition-colors ${selectedCategory() === 'all'
                                    ? 'bg-blue-600 text-white shadow-xs'
                                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
                                    }`}
                            >
                                {t('au.homeFilterAll')}
                            </button>
                            <button
                                type="button"
                                onClick={() => setSelectedCategory('login')}
                                class={`px-3 py-1.5 text-xs font-semibold rounded-xs transition-colors ${selectedCategory() === 'login'
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
                                    }`}
                            >
                                1. {t('au.homeCtaLogin')}
                            </button>
                            <button
                                type="button"
                                onClick={() => setSelectedCategory('acquisition')}
                                class={`px-3 py-1.5 text-xs font-semibold rounded-xs transition-colors ${selectedCategory() === 'acquisition'
                                    ? 'bg-teal-600 text-white shadow-xs'
                                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
                                    }`}
                            >
                                2. {t('au.homeCtaAccount')}
                            </button>
                            <button
                                type="button"
                                onClick={() => setSelectedCategory('forgot')}
                                class={`px-3 py-1.5 text-xs font-semibold rounded-xs transition-colors ${selectedCategory() === 'forgot'
                                    ? 'bg-amber-600 text-white shadow-xs'
                                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
                                    }`}
                            >
                                {t('au.homeFilterForgot')}
                            </button>
                            <button
                                type="button"
                                onClick={() => setSelectedCategory('reset')}
                                class={`px-3 py-1.5 text-xs font-semibold rounded-xs transition-colors ${selectedCategory() === 'reset'
                                    ? 'bg-purple-600 text-white shadow-xs'
                                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
                                    }`}
                            >
                                {t('au.homeFilterReset')}
                            </button>
                        </div>
                    </div>

                    {/* Step-by-Step Instruction Cards */}
                    <div class="space-y-8 mb-16">
                        <For each={filteredFlows()}>
                            {(flow) => (
                                <article class="relative bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-neutral-200 dark:border-slate-800 hover:border-neutral-400 dark:hover:border-slate-700/80 rounded-xs p-6 sm:p-8 shadow-xl transition-all">
                                    {/* Card Header */}
                                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-200 dark:border-slate-800/80">
                                        <div class="space-y-1.5">
                                            <div class="flex flex-wrap items-center gap-2">
                                                <h2 class="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white tracking-wide">
                                                    {flow.title}
                                                </h2>
                                                <span class={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-xs border ${flow.badgeColor}`}>
                                                    {flow.badge}
                                                </span>
                                            </div>
                                            <p class="text-sm text-neutral-500 dark:text-neutral-400 max-w-2xl leading-relaxed">
                                                {flow.subtitle}
                                            </p>
                                        </div>

                                        <A
                                            href={flow.route}
                                            class={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xs text-xs font-semibold shrink-0 transition-all ${flow.recommended
                                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-900/40 hover:-translate-y-0.5'
                                                : 'bg-neutral-100 dark:bg-slate-800 hover:bg-neutral-200 dark:hover:bg-slate-700 text-neutral-700 dark:text-neutral-200 border border-neutral-300 dark:border-slate-700 hover:border-neutral-400 dark:hover:border-slate-600 hover:-translate-y-0.5'
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
                                        <span class="font-mono text-neutral-500 dark:text-neutral-400 uppercase tracking-wider font-semibold">
                                            {t('au.homeRequirements')}
                                        </span>
                                        <For each={flow.requirements}>
                                            {(req) => (
                                                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xs bg-neutral-100 dark:bg-slate-800/60 border border-neutral-300 dark:border-slate-700/60 text-neutral-600 dark:text-neutral-300 font-medium">
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
                                                <div class="p-4 rounded-xs bg-neutral-100/80 dark:bg-slate-950/40 border border-neutral-200 dark:border-slate-800/60 flex flex-col justify-between space-y-3">
                                                    <div class="space-y-2">
                                                        <div class="flex items-center gap-2">
                                                            <span class="size-6 rounded-xs bg-neutral-100 dark:bg-slate-800 border border-neutral-300 dark:border-slate-700 text-neutral-900 dark:text-white text-xs font-bold font-mono flex items-center justify-center">
                                                                {step.step}
                                                            </span>
                                                            <h3 class="text-xs font-bold text-neutral-700 dark:text-neutral-200 leading-snug">
                                                                {step.title}
                                                            </h3>
                                                        </div>
                                                        <p class="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                                                            {step.description}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </For>
                                    </div>

                                    {/* Pro Tip Box */}
                                    <div class="mt-4 p-3 bg-neutral-100/80 dark:bg-slate-950/60 border border-neutral-200 dark:border-slate-800/80 rounded-xs flex items-start gap-2.5 text-xs text-neutral-600 dark:text-neutral-300">
                                        <svg class="size-4 shrink-0 text-amber-700 dark:text-amber-400 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
                    <section class="bg-linear-to-r from-emerald-50 dark:from-emerald-950/30 via-white/60 dark:via-slate-900/60 to-blue-50 dark:to-blue-950/30 border border-emerald-500/20 rounded-xs p-6 sm:p-8 mb-16">
                        <div class="max-w-3xl">
                            <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-xs bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-mono font-bold uppercase mb-2 border border-emerald-500/20">
                                Rekomendasi Keamanan
                            </div>
                            <h2 class="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white mb-2">
                                Mengapa Masuk Sesi (Session Login) Dijadikan Pilihan Standar?
                            </h2>
                            <p class="text-xs sm:text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed mb-5">
                                Mode Masuk Sesi (<code class="text-emerald-700 dark:text-emerald-400 font-mono">/authentification/login_with_session</code>) menggunakan pengikatan sesi server dengan proteksi cookie <span class="font-mono text-emerald-700 dark:text-emerald-300">HttpOnly</span>, perlindungan CSRF terintegrasi, dan sinkronisasi otomatis status multi-peran (Dosen, Mahasiswa, Rektorat). Ini memberikan keamanan tertinggi saat mengakses sistem dari peramban web publik atau komputer bersama.
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
                                    class="text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white underline transition-colors"
                                >
                                    Beralih ke Masuk Standar (JWT)
                                </A>
                            </div>
                        </div>
                    </section>
                    */}

                    {/* Support & Helpdesk Footer */}
                    <footer class="text-center pt-8 border-t border-neutral-200 dark:border-slate-800/80 text-xs text-neutral-500">
                        <p class="mb-2">
                            {t('au.homeFooterHelp')}
                        </p>
                        <p class="font-mono text-[11px] text-neutral-600">
                            {t('au.homeFooterSystem')}
                        </p>
                    </footer>
                </div>
            </main>
        </div>
    );
}
