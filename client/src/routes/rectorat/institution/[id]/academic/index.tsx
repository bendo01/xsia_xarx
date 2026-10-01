import { createSignal, onMount, Show, For, createMemo } from 'solid-js';
import { useParams, A } from '@solidjs/router';
import TopBar from '~/components/navigation/TopBar';
import { masterApiIndex } from '~/controllers/master/masterApiController';
import { toast } from '~/components/toast/Toaster';
import { resolveInstitutionFromStaffRole } from '~/lib/rectoratHelper';

interface SectionStats {
    students: number;
    lecturers: number;
    teaches: number;
    units: number;
}

export default function RectoratAcademicHub() {
    const params = useParams();
    const [resolvedInstitutionId, setResolvedInstitutionId] = createSignal<string>('');

    const institutionId = () => resolvedInstitutionId() || params.id;

    const [stats, setStats] = createSignal<SectionStats>({ students: 0, lecturers: 0, teaches: 0, units: 0 });
    const [isLoading, setIsLoading] = createSignal(true);
    const [recentStudents, setRecentStudents] = createSignal<any[]>([]);
    const [recentLecturers, setRecentLecturers] = createSignal<any[]>([]);

    const fetchStats = async () => {
        setIsLoading(true);
        try {
            let instId = resolvedInstitutionId();
            if (!instId || instId === '[id]' || instId === '00000000-0000-0000-0000-000000000000') {
                instId = await resolveInstitutionFromStaffRole(params.id);
                if (instId) {
                    setResolvedInstitutionId(instId);
                }
            }
            if (!instId || instId === '[id]') return;
            const [studRes, lecRes, unitRes] = await Promise.allSettled([
                masterApiIndex<any>('academic/student/master/students', {
                    page: 1, per_page: 5, institution_id: instId,
                }),
                masterApiIndex<any>('academic/lecturer/master/lecturers', {
                    page: 1, per_page: 5, institution_id: instId,
                }),
                masterApiIndex<any>('institution/master/units', {
                    page: 1, per_page: 1, institution_id: instId,
                }),
            ]);

            const studData = studRes.status === 'fulfilled' ? studRes.value : { data: [], total: 0 };
            const lecData = lecRes.status === 'fulfilled' ? lecRes.value : { data: [], total: 0 };
            const unitData = unitRes.status === 'fulfilled' ? unitRes.value : { data: [], total: 0 };

            setStats({
                students: studData.total ?? 0,
                lecturers: lecData.total ?? 0,
                teaches: 0,
                units: unitData.total ?? 0,
            });
            setRecentStudents((studData.data ?? []).slice(0, 5));
            setRecentLecturers((lecData.data ?? []).slice(0, 5));
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    onMount(() => fetchStats());

    const sections = createMemo(() => [
        {
            id: 'student',
            title: 'Mahasiswa',
            description: 'Kelola data mahasiswa yang terdaftar pada institusi ini.',
            count: stats().students,
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="size-6">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 3.741-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
                </svg>
            ),
            href: `/rectorat/institution/${institutionId()}/academic/student/master/student`,
            color: 'blue',
            gradient: 'from-blue-500 to-indigo-600',
            bg: 'bg-blue-50 dark:bg-blue-950/20',
            border: 'border-blue-200 dark:border-blue-800/50',
            text: 'text-blue-700 dark:text-blue-400',
            badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300',
        },
        {
            id: 'lecturer',
            title: 'Dosen',
            description: 'Kelola data dosen yang bertugas pada institusi ini.',
            count: stats().lecturers,
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="size-6">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
                </svg>
            ),
            href: `/rectorat/institution/${institutionId()}/academic/lecturer/master/lecturer`,
            color: 'violet',
            gradient: 'from-violet-500 to-purple-600',
            bg: 'bg-violet-50 dark:bg-violet-950/20',
            border: 'border-violet-200 dark:border-violet-800/50',
            text: 'text-violet-700 dark:text-violet-400',
            badge: 'bg-violet-100 text-violet-800 dark:bg-violet-900/50 dark:text-violet-300',
        },
        {
            id: 'teach',
            title: 'Pengajaran',
            description: 'Jadwal dan data pengajaran per semester.',
            count: stats().teaches,
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="size-6">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5m.75-9 3-3 2.148 2.148A12.061 12.061 0 0 1 16.5 7.605" />
                </svg>
            ),
            href: `/rectorat/institution/${institutionId()}/academic/campaign/transaction/teach`,
            color: 'orange',
            gradient: 'from-orange-500 to-amber-600',
            bg: 'bg-orange-50 dark:bg-orange-950/20',
            border: 'border-orange-200 dark:border-orange-800/50',
            text: 'text-orange-700 dark:text-orange-400',
            badge: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300',
        },
        {
            id: 'unit',
            title: 'Unit / Prodi',
            description: 'Program studi dan unit akademik dalam institusi.',
            count: stats().units,
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="size-6">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" />
                </svg>
            ),
            href: `/rectorat/institution/${institutionId()}/unit`,
            color: 'teal',
            gradient: 'from-teal-500 to-cyan-600',
            bg: 'bg-teal-50 dark:bg-teal-950/20',
            border: 'border-teal-200 dark:border-teal-800/50',
            text: 'text-teal-700 dark:text-teal-400',
            badge: 'bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300',
        },
    ]);

    return (
        <div class="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
            <TopBar />

            <div class="mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">

                {/* Page Header */}
                <div class="border-b border-neutral-200 dark:border-neutral-800 pb-6">
                    <nav class="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 mb-2 font-medium">
                        <A href="/rectorat" class="hover:text-blue-600 transition-colors">Rektorat</A>
                        <span>/</span>
                        <A href={`/rectorat/institution/${institutionId()}`} class="hover:text-blue-600 transition-colors">Institusi</A>
                        <span>/</span>
                        <span class="text-neutral-700 dark:text-neutral-300 font-semibold">Akademik</span>
                    </nav>

                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <div class="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-semibold uppercase tracking-wider mb-3 border border-blue-200 dark:border-blue-800/50">
                                <span class="relative flex size-2">
                                    <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                    <span class="relative inline-flex rounded-full size-2 bg-blue-500"></span>
                                </span>
                                Hub Akademik
                            </div>
                            <h1 class="text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
                                Manajemen Akademik
                            </h1>
                            <p class="text-sm text-neutral-500 dark:text-neutral-400 mt-1.5 max-w-xl">
                                Pusat pengelolaan seluruh data akademik — mahasiswa, dosen, pengajaran, dan program studi dalam lingkup institusi ini.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Section Cards Grid */}
                <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
                    <For each={sections()}>
                        {(section) => (
                            <A
                                href={section.href}
                                id={`academic-card-${section.id}`}
                                class={`group relative flex flex-col p-6 rounded-2xl border ${section.border} ${section.bg} hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer overflow-hidden`}
                            >
                                {/* Gradient orb decoration */}
                                <div class={`absolute -top-6 -right-6 size-24 rounded-full bg-gradient-to-br ${section.gradient} opacity-10 group-hover:opacity-20 transition-opacity blur-xl`}></div>

                                <div class={`size-12 rounded-xl bg-gradient-to-br ${section.gradient} flex items-center justify-center text-white shadow-sm mb-4`}>
                                    {section.icon}
                                </div>

                                <div class="flex-1">
                                    <h3 class={`text-base font-bold ${section.text} mb-1`}>{section.title}</h3>
                                    <p class="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">{section.description}</p>
                                </div>

                                <div class="mt-4 flex items-center justify-between">
                                    <Show
                                        when={!isLoading()}
                                        fallback={<div class="h-7 w-16 bg-neutral-200 dark:bg-neutral-800 rounded-md animate-pulse"></div>}
                                    >
                                        <span class={`text-2xl font-black ${section.text}`}>{section.count.toLocaleString()}</span>
                                    </Show>
                                    <span class={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-lg ${section.badge}`}>
                                        Lihat Semua
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="size-3 group-hover:translate-x-0.5 transition-transform">
                                            <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                                        </svg>
                                    </span>
                                </div>
                            </A>
                        )}
                    </For>
                </div>

                {/* Quick Access Panels */}
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Recent Students */}
                    <div class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm overflow-hidden">
                        <div class="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <div class="flex items-center gap-3">
                                <div class="size-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="size-4">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 3.741-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
                                    </svg>
                                </div>
                                <h3 class="font-bold text-sm text-neutral-900 dark:text-white">Mahasiswa</h3>
                                <span class="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/40">
                                    {stats().students.toLocaleString()} total
                                </span>
                            </div>
                            <A
                                href={`/rectorat/institution/${institutionId()}/academic/student/master/student`}
                                class="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                            >
                                Lihat Semua →
                            </A>
                        </div>

                        <Show
                            when={!isLoading()}
                            fallback={
                                <div class="divide-y divide-neutral-100 dark:divide-neutral-800">
                                    <For each={Array.from({ length: 4 })}>
                                        {() => (
                                            <div class="flex items-center gap-3 px-6 py-3.5 animate-pulse">
                                                <div class="size-8 rounded-full bg-neutral-200 dark:bg-neutral-800 shrink-0"></div>
                                                <div class="flex-1 space-y-1.5">
                                                    <div class="h-3.5 bg-neutral-200 dark:bg-neutral-800 rounded w-36"></div>
                                                    <div class="h-3 bg-neutral-200 dark:bg-neutral-800 rounded w-24"></div>
                                                </div>
                                            </div>
                                        )}
                                    </For>
                                </div>
                            }
                        >
                            <Show
                                when={recentStudents().length > 0}
                                fallback={
                                    <div class="py-10 flex flex-col items-center justify-center gap-2 text-neutral-400 dark:text-neutral-600">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="size-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489" /></svg>
                                        <p class="text-xs font-medium">Belum ada data mahasiswa</p>
                                    </div>
                                }
                            >
                                <ul class="divide-y divide-neutral-100 dark:divide-neutral-800">
                                    <For each={recentStudents()}>
                                        {(s) => {
                                            const ini = () => (s.name ?? s.code ?? '?').split(' ').slice(0, 2).map((w: string) => w[0] ?? '').join('').toUpperCase();
                                            return (
                                                <li class="flex items-center gap-3 px-6 py-3.5 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors">
                                                    <div class="size-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">{ini()}</div>
                                                    <div class="flex-1 min-w-0">
                                                        <p class="text-sm font-semibold text-neutral-900 dark:text-white truncate">{s.name || '-'}</p>
                                                        <p class="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono">{s.code || '-'} {s.unit_name ? `· ${s.unit_name}` : ''}</p>
                                                    </div>
                                                    <Show when={s.status_name}>
                                                        <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 shrink-0">{s.status_name}</span>
                                                    </Show>
                                                </li>
                                            );
                                        }}
                                    </For>
                                </ul>
                            </Show>
                        </Show>
                    </div>

                    {/* Recent Lecturers */}
                    <div class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm overflow-hidden">
                        <div class="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
                            <div class="flex items-center gap-3">
                                <div class="size-8 rounded-lg bg-violet-50 dark:bg-violet-900/30 flex items-center justify-center text-violet-600 dark:text-violet-400">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="size-4">
                                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" />
                                    </svg>
                                </div>
                                <h3 class="font-bold text-sm text-neutral-900 dark:text-white">Dosen</h3>
                                <span class="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-800/40">
                                    {stats().lecturers.toLocaleString()} total
                                </span>
                            </div>
                            <A
                                href={`/rectorat/institution/${institutionId()}/academic/lecturer/master/lecturer`}
                                class="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline"
                            >
                                Lihat Semua →
                            </A>
                        </div>

                        <Show
                            when={!isLoading()}
                            fallback={
                                <div class="divide-y divide-neutral-100 dark:divide-neutral-800">
                                    <For each={Array.from({ length: 4 })}>
                                        {() => (
                                            <div class="flex items-center gap-3 px-6 py-3.5 animate-pulse">
                                                <div class="size-8 rounded-full bg-neutral-200 dark:bg-neutral-800 shrink-0"></div>
                                                <div class="flex-1 space-y-1.5">
                                                    <div class="h-3.5 bg-neutral-200 dark:bg-neutral-800 rounded w-40"></div>
                                                    <div class="h-3 bg-neutral-200 dark:bg-neutral-800 rounded w-20"></div>
                                                </div>
                                            </div>
                                        )}
                                    </For>
                                </div>
                            }
                        >
                            <Show
                                when={recentLecturers().length > 0}
                                fallback={
                                    <div class="py-10 flex flex-col items-center justify-center gap-2 text-neutral-400 dark:text-neutral-600">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="size-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z" /></svg>
                                        <p class="text-xs font-medium">Belum ada data dosen</p>
                                    </div>
                                }
                            >
                                <ul class="divide-y divide-neutral-100 dark:divide-neutral-800">
                                    <For each={recentLecturers()}>
                                        {(lec) => {
                                            const fullName = () => {
                                                const parts = [lec.front_title, lec.name, lec.last_title].filter(Boolean);
                                                return parts.join(' ') || '-';
                                            };
                                            const ini = () => fullName().split(' ').slice(0, 2).map((w: string) => w[0] ?? '').join('').toUpperCase();
                                            return (
                                                <li class="flex items-center gap-3 px-6 py-3.5 hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors">
                                                    <div class="size-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">{ini()}</div>
                                                    <div class="flex-1 min-w-0">
                                                        <p class="text-sm font-semibold text-neutral-900 dark:text-white truncate">{fullName()}</p>
                                                        <p class="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono">{lec.code || lec.nuptk || '-'}</p>
                                                    </div>
                                                    <Show when={lec.end_date == null}>
                                                        <span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 shrink-0">Aktif</span>
                                                    </Show>
                                                </li>
                                            );
                                        }}
                                    </For>
                                </ul>
                            </Show>
                        </Show>
                    </div>
                </div>

                {/* Quick Links Grid */}
                <div>
                    <h2 class="text-sm font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-4">Akses Cepat</h2>
                    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                        {[
                            { label: 'Jadwal Kuliah', icon: '📅', href: `/rectorat/institution/${institutionId()}/academic/campaign/transaction/schedule` },
                            { label: 'Nilai / Grade', icon: '📊', href: `/rectorat/institution/${institutionId()}/academic/campaign/transaction/grade` },
                            { label: 'Kelas', icon: '🏫', href: `/rectorat/institution/${institutionId()}/academic/campaign/transaction/class-code` },
                            { label: 'SK Mengajar', icon: '📋', href: `/rectorat/institution/${institutionId()}/academic/campaign/transaction/teach-decree` },
                            { label: 'Aktivitas', icon: '⚡', href: `/rectorat/institution/${institutionId()}/academic/campaign/transaction/activity` },
                            { label: 'Evaluasi', icon: '🔍', href: `/rectorat/institution/${institutionId()}/academic/campaign/transaction/teach-evaluation` },
                        ].map((link) => (
                            <A
                                href={link.href}
                                class="flex flex-col items-center gap-2 p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-sm hover:-translate-y-0.5 transition-all text-center group"
                            >
                                <span class="text-2xl">{link.icon}</span>
                                <span class="text-xs font-semibold text-neutral-700 dark:text-neutral-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight">{link.label}</span>
                            </A>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
