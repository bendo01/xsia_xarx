import { createSignal, onMount, createEffect, Show, For, createMemo, ErrorBoundary } from 'solid-js';
import { useSearchParams, A } from '@solidjs/router';
import TopBar from '~/components/navigation/TopBar';
import { toast } from '~/components/toast/Toaster';
import {
    getStudentById,
    StudentMasterItem
} from '~/controllers/academic/student/master/AcademicStudentMasterStudentController';
import {
    PersonMasterIndividualControllerShow
} from '~/controllers/person/master/PersonMasterIndividualController';
import {
    listStudentActivities,
    StudentActivityItem
} from '~/controllers/academic/student/campaign/AcademicStudentCampaignActivityController';
import type { PersonMasterIndividualDataObject } from '~/models/person/master/Individual';
import AcademicPerformanceChart, { AcademicTrendPoint } from '~/components/chart/academic_performance_chart';
import StudentCreditChart from '~/components/chart/student_credit_chart';

export default function CourseDepartmentStudentMasterShowPage() {
    const [searchParams] = useSearchParams();
    const [student, setStudent] = createSignal<StudentMasterItem | null>(null);
    const [individual, setIndividual] = createSignal<PersonMasterIndividualDataObject | null>(null);
    const [activities, setActivities] = createSignal<StudentActivityItem[]>([]);
    const [isLoading, setIsLoading] = createSignal(true);

    const fetchStudentDetail = async () => {
        setIsLoading(true);
        try {
            const studentId = ((searchParams.id as string) || (searchParams.student_id as string) || '').trim();
            let stdRecord: StudentMasterItem | null = null;

            if (studentId) {
                stdRecord = await getStudentById(studentId);
            }

            setStudent(stdRecord);

            if (studentId) {
                // Fetch student academic activities (IPS, IPK, SKS per semester)
                const actRes = await listStudentActivities({ student_id: studentId, page: 1, page_size: 50 }).catch(() => null);
                setActivities(actRes?.data || []);
            } else {
                setActivities([]);
            }

            // Fetch linked individual details
            if (stdRecord?.individual_id && stdRecord.individual_id !== '00000000-0000-0000-0000-000000000000') {
                const indRes = await PersonMasterIndividualControllerShow(stdRecord.individual_id);
                if (!indRes.is_error && indRes.data) {
                    setIndividual(indRes.data);
                }
            }
        } catch (err) {
            console.error('Error fetching student master details:', err);
            toast.danger('Failed to load student details from server.');
        } finally {
            setIsLoading(false);
        }
    };

    onMount(() => {
        fetchStudentDetail();
    });

    createEffect(() => {
        const idFromQuery = (searchParams.id as string) || (searchParams.student_id as string);
        if (idFromQuery) {
            fetchStudentDetail();
        }
    });

    const ind = () => individual()?.individual;

    // Computed Academic Trend Data for ECharts
    const academicTrendData = createMemo<AcademicTrendPoint[]>(() => {
        const list = activities();
        if (list.length === 0) return [];

        return list.map((act, idx) => {
            const semName = act.academic_year?.name || act.academic_year_name || act.name || act.semester_name || `Sem ${idx + 1}`;
            const ips = Number(act.cumulative_index || 0);
            const ipk = Number(act.grand_cumulative_index || act.cumulative_index || 0);
            const sks = Number(act.total_credit || 0);
            const totalSks = Number(act.grand_total_credit || act.total_credit || 0);
            return {
                semName,
                ips: Number(ips.toFixed(2)),
                ipk: Number(ipk.toFixed(2)),
                sks,
                totalSks,
            };
        });
    });

    // Academic summary helpers
    const latestActivity = createMemo(() => {
        const list = activities();
        return list.length > 0 ? list[list.length - 1] : null;
    });

    const currentIpk = () => {
        const act = latestActivity();
        if (!act) return '0.00';
        return Number(act.grand_cumulative_index || act.cumulative_index || 0).toFixed(2);
    };

    const currentIps = () => {
        const act = latestActivity();
        if (!act) return '0.00';
        return Number(act.cumulative_index || 0).toFixed(2);
    };

    const currentTotalSks = () => {
        const act = latestActivity();
        if (!act) return 0;
        return act.grand_total_credit || act.total_credit || 0;
    };

    return (
        <div class="min-h-screen bg-neutral-50 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 flex flex-col font-sans transition-colors duration-200">
            <TopBar />

            <main class="flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                <ErrorBoundary
                    fallback={(err, reset) => (
                        <div class="p-8 max-w-xl mx-auto my-12 bg-white dark:bg-neutral-800 rounded-3xl border border-red-200 dark:border-red-900/50 shadow-xl text-center space-y-4">
                            <div class="size-12 mx-auto rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 flex items-center justify-center font-bold">
                                <svg class="size-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            </div>
                            <h3 class="text-lg font-bold text-neutral-900 dark:text-white">Terjadi Kendala Memuat Detail Mahasiswa</h3>
                            <p class="text-xs text-neutral-500 dark:text-neutral-400 font-mono bg-neutral-100 dark:bg-neutral-900 p-3 rounded-xl break-all">
                                {err?.message || String(err)}
                            </p>
                            <button
                                onClick={() => reset()}
                                class="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold shadow-md transition-colors"
                            >
                                Coba Muat Ulang
                            </button>
                        </div>
                    )}
                >
                    {/* Header Banner */}
                    <div class="bg-white dark:bg-neutral-800 rounded-3xl p-6 sm:p-8 border border-neutral-200 dark:border-neutral-700 shadow-2xs">
                        <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div class="flex items-center gap-5">
                                <div class="size-16 sm:size-20 rounded-2xl bg-gradient-to-tr from-teal-500 to-cyan-600 text-white font-black text-2xl flex items-center justify-center shadow-md">
                                    {(student()?.name || 'S').charAt(0).toUpperCase()}
                                </div>
                                <div class="space-y-1">
                                    <div class="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 text-xs font-mono font-semibold border border-teal-200 dark:border-teal-800/80">
                                        <span class="size-1.5 rounded-full bg-teal-500"></span>
                                        <span>NIM: {student()?.code || '-'}</span>
                                    </div>
                                    <h1 class="text-2xl sm:text-3xl font-black tracking-tight text-neutral-900 dark:text-white">
                                        {student()?.name || 'Student Details'}
                                    </h1>
                                    <p class="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
                                        {student()?.unit_name || 'Program Studi'} • Academic Year {student()?.academic_year_name || '-'}
                                    </p>
                                </div>
                            </div>

                            <div class="flex items-center gap-3">
                                <A
                                    href={student()?.unit_id ? `/course-department/academic/student/master?unit_id=${student()!.unit_id}` : '/course-department/academic/student/master'}
                                    class="px-4 py-2.5 bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1.5"
                                >
                                    <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                                    <span>← Back to Student List</span>
                                </A>
                            </div>
                        </div>
                    </div>

                    {/* Details Section */}
                    <Show when={!isLoading()} fallback={
                        <div class="py-20 flex flex-col items-center justify-center gap-3 text-neutral-400">
                            <div class="size-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                            <p class="text-xs font-mono">Loading student detail from server...</p>
                        </div>
                    }>
                        {/* 4 Academic Summary Stat Cards */}
                        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <div class="p-5 rounded-3xl bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80 shadow-2xs space-y-2">
                                <div class="flex items-center justify-between text-neutral-500 dark:text-neutral-400">
                                    <span class="text-xs font-mono font-semibold uppercase tracking-wider">IPK Kumulatif</span>
                                    <div class="size-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                                        <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                                    </div>
                                </div>
                                <div class="flex items-baseline gap-2">
                                    <span class="text-2xl sm:text-3xl font-black text-indigo-600 dark:text-indigo-400 font-mono">
                                        {currentIpk()}
                                    </span>
                                    <span class="text-xs text-neutral-400 font-mono">/ 4.00</span>
                                </div>
                                <div class="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono">
                                    Indeks Prestasi Kumulatif
                                </div>
                            </div>

                            <div class="p-5 rounded-3xl bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80 shadow-2xs space-y-2">
                                <div class="flex items-center justify-between text-neutral-500 dark:text-neutral-400">
                                    <span class="text-xs font-mono font-semibold uppercase tracking-wider">IPS Terakhir</span>
                                    <div class="size-8 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
                                        <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m19 9-5 5-4-4-3 3" /><path d="M3 3v18h18" /></svg>
                                    </div>
                                </div>
                                <div class="flex items-baseline gap-2">
                                    <span class="text-2xl sm:text-3xl font-black text-sky-600 dark:text-sky-400 font-mono">
                                        {currentIps()}
                                    </span>
                                    <span class="text-xs text-neutral-400 font-mono">/ 4.00</span>
                                </div>
                                <div class="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono">
                                    Indeks Prestasi Semester
                                </div>
                            </div>

                            <div class="p-5 rounded-3xl bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80 shadow-2xs space-y-2">
                                <div class="flex items-center justify-between text-neutral-500 dark:text-neutral-400">
                                    <span class="text-xs font-mono font-semibold uppercase tracking-wider">Total SKS Lulus</span>
                                    <div class="size-8 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
                                        <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" /></svg>
                                    </div>
                                </div>
                                <div class="flex items-baseline gap-2">
                                    <span class="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white font-mono">
                                        {currentTotalSks()}
                                    </span>
                                    <span class="text-xs text-neutral-400 font-medium">SKS</span>
                                </div>
                                <div class="text-[11px] text-teal-600 dark:text-teal-400 font-mono">
                                    Kredit Kumulatif Selesai
                                </div>
                            </div>

                            <div class="p-5 rounded-3xl bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80 shadow-2xs space-y-2">
                                <div class="flex items-center justify-between text-neutral-500 dark:text-neutral-400">
                                    <span class="text-xs font-mono font-semibold uppercase tracking-wider">Status & Semester</span>
                                    <div class="size-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                                        <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="m9 11 3 3L22 4" /></svg>
                                    </div>
                                </div>
                                <div class="flex items-baseline gap-2">
                                    <span class="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 truncate">
                                        {student()?.status_name || 'Aktif'}
                                    </span>
                                </div>
                                <div class="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono">
                                    {activities().length} Semester Tercatat
                                </div>
                            </div>
                        </div>

                        {/* Visualizations Section Powered by Apache ECharts */}
                        <div class="space-y-4">
                            <div class="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-700 pb-3">
                                <div>
                                    <h2 class="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                                        <span class="size-2.5 rounded-full bg-teal-500"></span>
                                        Visualisasi Akademik Mahasiswa
                                    </h2>
                                    <p class="text-xs text-neutral-500 dark:text-neutral-400">
                                        Grafik perkembangan indeks prestasi (IPS & IPK) dan beban kredit SKS mahasiswa berbasis Apache ECharts.
                                    </p>
                                </div>
                                <div class="flex items-center gap-2">
                                    <span class="px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-mono text-[11px] font-semibold border border-teal-200 dark:border-teal-800">
                                        Apache ECharts v6
                                    </span>
                                </div>
                            </div>

                            <Show when={academicTrendData().length > 0} fallback={
                                <div class="p-8 rounded-3xl bg-white dark:bg-neutral-800 border border-dashed border-neutral-300 dark:border-neutral-700 text-center space-y-3">
                                    <div class="size-12 mx-auto rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                                        <svg class="size-6" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m19 9-5 5-4-4-3 3" /><path d="M3 3v18h18" /></svg>
                                    </div>
                                    <h3 class="text-sm font-bold text-neutral-900 dark:text-white">Belum Ada Riwayat Nilai & Semester</h3>
                                    <p class="text-xs text-neutral-500 dark:text-neutral-400 max-w-md mx-auto">
                                        Data aktivitas perkuliahan (KHS) mahasiswa dengan NIM <span class="font-mono font-bold text-teal-600 dark:text-teal-400">{student()?.code || '-'}</span> belum tercatat di sistem akademik. Grafik ECharts akan muncul otomatis setelah nilai semester diinput.
                                    </p>
                                </div>
                            }>
                                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Chart 1: Academic Performance (IPS & IPK Trend) with Apache ECharts */}
                                    <div class="p-6 rounded-3xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-2xs space-y-4">
                                        <div class="flex items-center justify-between">
                                            <div>
                                                <h3 class="text-sm font-bold text-neutral-900 dark:text-white">
                                                    Tren Indeks Prestasi (IPS & IPK)
                                                </h3>
                                                <p class="text-xs text-neutral-500 dark:text-neutral-400">
                                                    Grafik fluktuasi IP Semester dan IP Kumulatif per semester.
                                                </p>
                                            </div>
                                            <div class="flex items-center gap-3 text-xs font-mono">
                                                <div class="flex items-center gap-1.5">
                                                    <span class="size-2.5 rounded-full bg-indigo-500"></span>
                                                    <span class="text-neutral-600 dark:text-neutral-300">IPK</span>
                                                </div>
                                                <div class="flex items-center gap-1.5">
                                                    <span class="size-2.5 rounded-full bg-sky-500"></span>
                                                    <span class="text-neutral-600 dark:text-neutral-300">IPS</span>
                                                </div>
                                            </div>
                                        </div>

                                        <AcademicPerformanceChart data={academicTrendData()} />
                                    </div>

                                    {/* Chart 2: Credit SKS Load Progression with Apache ECharts */}
                                    <div class="p-6 rounded-3xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-2xs space-y-4">
                                        <div class="flex items-center justify-between">
                                            <div>
                                                <h3 class="text-sm font-bold text-neutral-900 dark:text-white">
                                                    Progres Beban Kredit SKS
                                                </h3>
                                                <p class="text-xs text-neutral-500 dark:text-neutral-400">
                                                    Akumulasi SKS lulus kumulatif dan SKS diambil per semester.
                                                </p>
                                            </div>
                                            <div class="flex items-center gap-3 text-xs font-mono">
                                                <div class="flex items-center gap-1.5">
                                                    <span class="size-2.5 rounded-full bg-teal-600"></span>
                                                    <span class="text-neutral-600 dark:text-neutral-300">SKS Kumulatif</span>
                                                </div>
                                                <div class="flex items-center gap-1.5">
                                                    <span class="size-2.5 rounded-full bg-amber-500"></span>
                                                    <span class="text-neutral-600 dark:text-neutral-300">SKS Semester</span>
                                                </div>
                                            </div>
                                        </div>

                                        <StudentCreditChart data={academicTrendData()} />
                                    </div>
                                </div>
                            </Show>
                        </div>

                        {/* Semester Breakdown Table (KHS) */}
                        <Show when={activities().length > 0}>
                            <div class="bg-white dark:bg-neutral-800 rounded-3xl border border-neutral-200 dark:border-neutral-700 shadow-2xs overflow-hidden">
                                <div class="p-5 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
                                    <div>
                                        <h3 class="text-sm font-bold text-neutral-900 dark:text-white">
                                            Riwayat Aktivitas Semester & Nilai (KHS)
                                        </h3>
                                        <p class="text-xs text-neutral-500 dark:text-neutral-400">
                                            Rincian capaian akademik per semester mahasiswa.
                                        </p>
                                    </div>
                                    <span class="text-xs font-mono text-neutral-400">
                                        {activities().length} Semester
                                    </span>
                                </div>

                                <div class="overflow-x-auto">
                                    <table class="w-full text-xs text-left border-collapse">
                                        <thead class="bg-neutral-50 dark:bg-neutral-900/60 text-neutral-500 dark:text-neutral-400 uppercase font-mono text-[10px] tracking-wider border-b border-neutral-200 dark:border-neutral-700">
                                            <tr>
                                                <th class="px-5 py-3">No</th>
                                                <th class="px-5 py-3">Semester / Tahun Ajaran</th>
                                                <th class="px-5 py-3 text-center">SKS Semester</th>
                                                <th class="px-5 py-3 text-center">SKS Kumulatif</th>
                                                <th class="px-5 py-3 text-center">IPS</th>
                                                <th class="px-5 py-3 text-center">IPK</th>
                                                <th class="px-5 py-3 text-center">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody class="divide-y divide-neutral-100 dark:divide-neutral-700/60">
                                            <For each={activities()}>
                                                {(act, idx) => (
                                                    <tr class="hover:bg-neutral-50/80 dark:hover:bg-neutral-700/30 transition-colors">
                                                        <td class="px-5 py-3 font-mono text-neutral-400">{idx() + 1}</td>
                                                        <td class="px-5 py-3 font-medium text-neutral-900 dark:text-white">
                                                            {act.academic_year?.name || act.academic_year_name || act.name || act.semester_name || `Semester ${idx() + 1}`}
                                                        </td>
                                                        <td class="px-5 py-3 text-center font-mono font-bold text-neutral-700 dark:text-neutral-300">
                                                            {act.total_credit || 0}
                                                        </td>
                                                        <td class="px-5 py-3 text-center font-mono font-bold text-teal-600 dark:text-teal-400">
                                                            {act.grand_total_credit || act.total_credit || 0}
                                                        </td>
                                                        <td class="px-5 py-3 text-center font-mono font-bold text-sky-600 dark:text-sky-400">
                                                            {Number(act.cumulative_index || 0).toFixed(2)}
                                                        </td>
                                                        <td class="px-5 py-3 text-center font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                                            {Number(act.grand_cumulative_index || act.cumulative_index || 0).toFixed(2)}
                                                        </td>
                                                        <td class="px-5 py-3 text-center">
                                                            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                                                {act.status_name || 'Selesai'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                )}
                                            </For>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </Show>

                        {/* Existing Cards: Academic Information & Biodata */}
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                            {/* Admission Card */}
                            <div class="bg-white dark:bg-neutral-800 rounded-3xl p-6 border border-neutral-200 dark:border-neutral-700 shadow-2xs space-y-4">
                                <div class="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-700">
                                    <h3 class="text-sm font-bold text-neutral-900 dark:text-white">Academic & Enrolment Information</h3>
                                    <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                        {student()?.status_name || 'Active'}
                                    </span>
                                </div>

                                <div class="space-y-3">
                                    <div class="flex justify-between py-1.5 border-b border-neutral-100 dark:border-neutral-700/50">
                                        <span class="text-neutral-400 font-mono">Student NIM:</span>
                                        <span class="font-bold text-teal-600 dark:text-teal-400 font-mono">{student()?.code || '-'}</span>
                                    </div>
                                    <div class="flex justify-between py-1.5 border-b border-neutral-100 dark:border-neutral-700/50">
                                        <span class="text-neutral-400 font-mono">Registration Number:</span>
                                        <span class="font-bold text-neutral-800 dark:text-neutral-100 font-mono">{student()?.registration_id || '-'}</span>
                                    </div>
                                    <div class="flex justify-between py-1.5 border-b border-neutral-100 dark:border-neutral-700/50">
                                        <span class="text-neutral-400 font-mono">Admission Path:</span>
                                        <span class="font-bold text-neutral-800 dark:text-neutral-100">{student()?.selection_type_name || '-'}</span>
                                    </div>
                                    <div class="flex justify-between py-1.5 border-b border-neutral-100 dark:border-neutral-700/50">
                                        <span class="text-neutral-400 font-mono">Enrolment Date:</span>
                                        <span class="font-bold text-neutral-800 dark:text-neutral-100">{student()?.registered || '-'}</span>
                                    </div>
                                    <div class="flex justify-between py-1.5 border-b border-neutral-100 dark:border-neutral-700/50">
                                        <span class="text-neutral-400 font-mono">Study Program (Unit):</span>
                                        <span class="font-bold text-neutral-800 dark:text-neutral-100">{student()?.unit_name || '-'}</span>
                                    </div>
                                    <div class="flex justify-between py-1.5 border-b border-neutral-100 dark:border-neutral-700/50">
                                        <span class="text-neutral-400 font-mono">Academic Year / Cohort:</span>
                                        <span class="font-bold text-neutral-800 dark:text-neutral-100">{student()?.academic_year_name || '-'}</span>
                                    </div>
                                    <div class="flex justify-between py-1.5 border-b border-neutral-100 dark:border-neutral-700/50">
                                        <span class="text-neutral-400 font-mono">Curriculum:</span>
                                        <span class="font-bold text-neutral-800 dark:text-neutral-100">{student()?.curriculum_name || student()?.curriculum_id || '-'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Personal & Demographics Card */}
                            <div class="bg-white dark:bg-neutral-800 rounded-3xl p-6 border border-neutral-200 dark:border-neutral-700 shadow-2xs space-y-4">
                                <div class="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-700">
                                    <h3 class="text-sm font-bold text-neutral-900 dark:text-white">Individual Biodata & Identity</h3>
                                    <span class="text-xs text-neutral-400 font-mono">Student Registry</span>
                                </div>

                                <div class="space-y-3">
                                    <div class="flex justify-between py-1.5 border-b border-neutral-100 dark:border-neutral-700/50">
                                        <span class="text-neutral-400 font-mono">Full Legal Name:</span>
                                        <span class="font-bold text-neutral-800 dark:text-neutral-100">{student()?.name || '-'}</span>
                                    </div>
                                    <div class="flex justify-between py-1.5 border-b border-neutral-100 dark:border-neutral-700/50">
                                        <span class="text-neutral-400 font-mono">National ID (NIK):</span>
                                        <span class="font-bold text-neutral-800 dark:text-neutral-100 font-mono">{ind()?.code || '-'}</span>
                                    </div>
                                    <div class="flex justify-between py-1.5 border-b border-neutral-100 dark:border-neutral-700/50">
                                        <span class="text-neutral-400 font-mono">NISN:</span>
                                        <span class="font-bold text-neutral-800 dark:text-neutral-100 font-mono">{student()?.nisn || '-'}</span>
                                    </div>
                                    <div class="flex justify-between py-1.5 border-b border-neutral-100 dark:border-neutral-700/50">
                                        <span class="text-neutral-400 font-mono">Birth Place & Date:</span>
                                        <span class="font-bold text-neutral-800 dark:text-neutral-100">
                                            {ind()?.birth_place ? `${ind()?.birth_place}, ${ind()?.birth_date || '-'}` : (ind()?.birth_date || '-')}
                                        </span>
                                    </div>
                                    <div class="flex justify-between py-1.5 border-b border-neutral-100 dark:border-neutral-700/50">
                                        <span class="text-neutral-400 font-mono">Tuition & Financial Fee:</span>
                                        <span class="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                                            {student()?.finance_fee != null ? `Rp ${(student()!.finance_fee!).toLocaleString('id-ID')}` : '-'}
                                        </span>
                                    </div>
                                    <div class="flex justify-between py-1.5 border-b border-neutral-100 dark:border-neutral-700/50">
                                        <span class="text-neutral-400 font-mono">Permanent Address:</span>
                                        <span class="font-bold text-neutral-800 dark:text-neutral-100">{individual()?.biodata?.address || '-'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Show>
                </ErrorBoundary>
            </main>
        </div>
    );
}
