import { createSignal, createEffect, Show, For, createMemo, lazy, Suspense } from 'solid-js';
import { useParams, useSearchParams, useLocation, A } from '@solidjs/router';
import TopBar from '~/components/navigation/TopBar';
import { toast } from '~/components/toast/Toaster';
import type { PersonMasterIndividualDataObject } from '~/models/person/master/Individual';
import type { AcademicLecturerMasterLecturer } from '~/models/academic/lecturer/master/Lecturer';
import type { AcademicLecturerTransactionHomebase } from '~/models/academic/lecturer/transaction/Homebase';
import type { AcademicLecturerTransactionAcademicRank } from '~/models/academic/lecturer/transaction/AcademicRank';
import type { AcademicLecturerTransactionAcademicGroup } from '~/models/academic/lecturer/transaction/AcademicGroup';
import { getBaseApiUrl, getAuthHeaders } from '~/controllers/master/masterApiController';
import { PersonMasterIndividualControllerShow } from '~/controllers/person/master/PersonMasterIndividualController';
import {
    getLecturerById,
    getLecturerHomebases,
    getLecturerAcademicRanks,
    getLecturerAcademicGroups,
} from '~/controllers/academic/lecturer/AcademicLecturerTransactionController';
import {
    getLecturerAssignedTeaches,
    type LecturerAssignedTeachItem,
} from '~/controllers/academic/campaign/transaction/AcademicCampaignTransactionTeachController';
import type { YearlyCreditTrend } from '~/components/chart/teach_credit_chart';
import { resolveInstitutionFromStaffRole } from '~/lib/rectoratHelper';
import EChart from '~/components/chart/echart_component';
import PopupBlockedAlert from '~/components/alert/PopupBlockedAlert';
import { Loader } from '~/components/loader';

export default function RectoratLecturerDetail() {
    const params = useParams();
    const [searchParams] = useSearchParams();
    const location = useLocation();

    const [resolvedInstitutionId, setResolvedInstitutionId] = createSignal<string>('');
    const [isLoading, setIsLoading] = createSignal(true);
    const [error, setError] = createSignal<string | null>(null);
    const [individualData, setIndividualData] = createSignal<PersonMasterIndividualDataObject | null>(null);
    const [lecturerMaster, setLecturerMaster] = createSignal<AcademicLecturerMasterLecturer | null>(null);
    const [assignedTeaches, setAssignedTeaches] = createSignal<LecturerAssignedTeachItem[]>([]);
    const [latestHomebase, setLatestHomebase] = createSignal<AcademicLecturerTransactionHomebase | null>(null);
    const [allHomebases, setAllHomebases] = createSignal<AcademicLecturerTransactionHomebase[]>([]);
    const [latestAcademicRank, setLatestAcademicRank] = createSignal<AcademicLecturerTransactionAcademicRank | null>(null);
    const [allAcademicRanks, setAllAcademicRanks] = createSignal<AcademicLecturerTransactionAcademicRank[]>([]);
    const [latestAcademicGroup, setLatestAcademicGroup] = createSignal<AcademicLecturerTransactionAcademicGroup | null>(null);
    const [allAcademicGroups, setAllAcademicGroups] = createSignal<AcademicLecturerTransactionAcademicGroup[]>([]);
    const [activeTab, setActiveTab] = createSignal<'overview' | 'biodata' | 'academic'>('overview');
    const [teachLectureChart, setTeachLectureChart] = createSignal<any>(null);

    const isValidId = (id?: string | null): id is string => {
        if (!id) return false;
        const trimmed = id.trim();
        return (
            trimmed !== '' &&
            trimmed !== '[id]' &&
            trimmed !== ':id' &&
            trimmed !== 'lecturer' &&
            trimmed !== '00000000-0000-0000-0000-000000000000'
        );
    };

    /**
     * Resolves lecturer ID by checking:
     * 1. Query parameter `lecturer_id` (explicitly supported)
     * 2. Query parameter `id`
     * 3. Route parameter `params.id`
     * 4. Last segment of pathname
     */
    const resolveLecturerId = () => {
        const qLecturerId = searchParams.lecturer_id as string;
        if (isValidId(qLecturerId)) {
            return qLecturerId.trim();
        }

        const qId = searchParams.id as string;
        if (isValidId(qId)) {
            return qId.trim();
        }

        if (isValidId(params.id)) {
            return params.id.trim();
        }

        const pathname = location.pathname || (typeof window !== 'undefined' ? window.location.pathname : '');
        const parts = pathname.split('/').filter(Boolean);
        const last = parts[parts.length - 1];
        if (isValidId(last) && last !== 'lecturer') {
            return last.trim();
        }

        return '';
    };

    /**
     * Resolves institution ID from URL path segment (e.g. /rectorat/institution/[id]/...)
     */
    const resolveInstIdFromPath = () => {
        const pathname = location.pathname || (typeof window !== 'undefined' ? window.location.pathname : '');
        const parts = pathname.split('/').filter(Boolean);
        const instIdx = parts.indexOf('institution');
        if (instIdx !== -1 && parts[instIdx + 1] && isValidId(parts[instIdx + 1])) {
            return parts[instIdx + 1].trim();
        }
        return '';
    };

    const institutionId = () => resolvedInstitutionId() || resolveInstIdFromPath();

    // Resolve institution ID fallback
    createEffect(async () => {
        let instId = resolvedInstitutionId();
        if (!instId || instId === '[id]' || instId === '00000000-0000-0000-0000-000000000000') {
            const preferred = resolveInstIdFromPath();
            instId = await resolveInstitutionFromStaffRole(preferred);
            if (instId) {
                setResolvedInstitutionId(instId);
            }
        }
    });

    const fetchLecturerProfile = async () => {
        const lid = resolveLecturerId();
        if (!lid) {
            setIsLoading(false);
            setError('Parameter lecturer_id tidak ditemukan.');
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            // 1. Fetch lecturer master record
            const resolvedLecturer = await getLecturerById(lid);
            if (!resolvedLecturer) {
                setError('Data dosen tidak ditemukan.');
                toast.danger('Gagal memuat data dosen.');
                return;
            }
            setLecturerMaster(resolvedLecturer);

            // 2. Fetch associated individual profile
            const indId = resolvedLecturer.individual_id;
            if (indId && isValidId(indId)) {
                const profileRes = await PersonMasterIndividualControllerShow(indId);
                if (profileRes && !profileRes.is_error && profileRes.data) {
                    setIndividualData(profileRes.data);
                } else if (resolvedLecturer.individual) {
                    setIndividualData({ individual: resolvedLecturer.individual } as PersonMasterIndividualDataObject);
                }
            } else if (resolvedLecturer.individual) {
                setIndividualData({ individual: resolvedLecturer.individual } as PersonMasterIndividualDataObject);
            }

            // 3. Populate relations (Homebases, Academic Ranks, Groups, Teaches)
            if (resolvedLecturer.homebases || resolvedLecturer.academic_ranks || resolvedLecturer.assigned_teaches) {
                const hbs = (resolvedLecturer.homebases || []).slice().sort((a, b) => {
                    const timeA = new Date(a.updated_at || a.created_at || 0).getTime();
                    const timeB = new Date(b.updated_at || b.created_at || 0).getTime();
                    return timeB - timeA;
                });
                setAllHomebases(hbs);
                setLatestHomebase(hbs[0] || null);

                const ranks = (resolvedLecturer.academic_ranks || []).slice().sort((a, b) => {
                    const timeA = new Date(a.start_date || a.decree_date || a.created_at || 0).getTime();
                    const timeB = new Date(b.start_date || b.decree_date || b.created_at || 0).getTime();
                    return timeB - timeA;
                });
                setAllAcademicRanks(ranks);
                setLatestAcademicRank(ranks[0] || null);

                const groups = (resolvedLecturer.academic_groups || []).slice().sort((a, b) => {
                    const timeA = new Date(a.start_date || a.decree_date || a.created_at || 0).getTime();
                    const timeB = new Date(b.start_date || b.decree_date || b.created_at || 0).getTime();
                    return timeB - timeA;
                });
                setAllAcademicGroups(groups);
                setLatestAcademicGroup(groups[0] || null);

                const lecturerTeaches = (resolvedLecturer.assigned_teaches || []) as unknown as LecturerAssignedTeachItem[];
                setAssignedTeaches(lecturerTeaches);
            } else {
                const [hbRes, rankRes, groupRes, teachesRes] = await Promise.all([
                    getLecturerHomebases(lid),
                    getLecturerAcademicRanks(lid),
                    getLecturerAcademicGroups(lid),
                    getLecturerAssignedTeaches(lid).catch(() => []),
                ]);

                setLatestHomebase(hbRes.latestHomebase);
                setAllHomebases(hbRes.homebases);

                setLatestAcademicRank(rankRes.latestAcademicRank);
                setAllAcademicRanks(rankRes.academicRanks);

                setLatestAcademicGroup(groupRes.latestAcademicGroup);
                setAllAcademicGroups(groupRes.academicGroups);

                const lecturerTeaches = (teachesRes || []).filter((item) => item.lecturer_id === lid);
                setAssignedTeaches(lecturerTeaches);
            }

            // 4. Fetch teach-lecture-chart
            try {
                const url = `${getBaseApiUrl()}/academic/lecturer/master/lecturers/${encodeURIComponent(lid)}/teach-lecture-chart`;
                const response = await fetch(url, { headers: getAuthHeaders() });
                if (response.ok) {
                    const resJson = await response.json();
                    setTeachLectureChart(resJson.data ?? resJson);
                }
            } catch (e) {
                console.error('Error fetching teach-lecture-chart:', e);
            }
        } catch (err) {
            console.error('Error fetching lecturer profile:', err);
            setError('Terjadi kesalahan saat memuat data dosen.');
        } finally {
            setIsLoading(false);
        }
    };

    let lastLoadedId: string | null = null;
    createEffect(() => {
        const lid = resolveLecturerId();
        if (lid && lid !== lastLoadedId) {
            lastLoadedId = lid;
            fetchLecturerProfile();
        }
    });

    const yearlyCreditTrends = createMemo<YearlyCreditTrend[]>(() => {
        const precomputed = lecturerMaster()?.yearly_credit_trends;
        if (Array.isArray(precomputed) && precomputed.length > 0) {
            return precomputed;
        }

        const map = new Map<string, YearlyCreditTrend>();
        for (const item of assignedTeaches()) {
            const yId = item.academic_year_id || 'unknown';
            const yName = item.academic_year_name || (item.academic_year_code ? `Tahun ${item.academic_year_code}` : 'Tahun Akademik');
            const yCode = item.academic_year_code;
            const cr = Number(item.credit || item.course_total_credit) || 0;

            if (!map.has(yId)) {
                map.set(yId, {
                    yearId: yId,
                    yearName: yName,
                    yearCode: yCode ?? null,
                    totalCredit: 0,
                    classCount: 0,
                    totalPlannedSessions: 0,
                    totalRealizedSessions: 0,
                    courses: [],
                });
            }

            const entry = map.get(yId)!;
            entry.totalCredit += cr;
            entry.classCount += 1;
            entry.totalPlannedSessions += Number(item.planning) || 0;
            entry.totalRealizedSessions += Number(item.realization) || 0;
            entry.courses.push({
                name: item.course_name || item.teach_name || 'Mata Kuliah',
                code: item.course_code || undefined,
                credit: cr,
                className: item.class_name || (item.class_alphabet_code ? `Kelas ${item.class_alphabet_code}` : undefined),
            });
        }

        const list = Array.from(map.values()).filter((entry) => entry.yearId !== 'unknown' || entry.totalCredit > 0);
        list.sort((a, b) => {
            const codeA = Number(a.yearCode) || 0;
            const codeB = Number(b.yearCode) || 0;
            if (codeA !== 0 && codeB !== 0 && codeA !== codeB) {
                return codeA - codeB;
            }
            return (a.yearName || '').localeCompare(b.yearName || '');
        });

        return list;
    });

    const ind = () => individualData()?.individual;
    const lecturer = () => lecturerMaster() || individualData()?.lecturer;

    const formattedFullName = () => {
        const item = ind();
        if (!item) {
            const l = lecturerMaster();
            if (l) {
                const parts = [l.front_title, l.name, l.last_title].filter(Boolean);
                return parts.join(' ') || 'Dosen';
            }
            return 'Dosen';
        }
        const front = item.front_title ? item.front_title.trim() : '';
        const last = item.last_title ? item.last_title.trim() : '';
        const baseName = item.name ? item.name.trim() : '';

        if (front && last) return `${front} ${baseName}, ${last}`;
        if (front) return `${front} ${baseName}`;
        if (last) return `${baseName}, ${last}`;
        return baseName || 'Dosen';
    };

    const lecturerNidn = () => lecturer()?.code || lecturer()?.nidn || '';
    const lecturerNuptk = () => lecturer()?.nuptk || '';
    const nidnOrNuptkBadge = () => {
        const nidn = lecturerNidn();
        const nuptk = lecturerNuptk();
        if (nidn && nuptk) return `NIDN: ${nidn} • NUPTK: ${nuptk}`;
        if (nidn) return `NIDN: ${nidn}`;
        if (nuptk) return `NUPTK: ${nuptk}`;
        return ind()?.code ? `NIDN / NIK: ${ind()?.code}` : 'NIDN / NUPTK: -';
    };

    const currentUnitName = () =>
        latestHomebase()?.unit_name || lecturer()?.unit_name || allHomebases().find((h) => h.unit_name)?.unit_name || '-';

    const currentRankName = () => latestAcademicRank()?.rank_name || lecturer()?.rank_name || 'Tenaga Pengajar';
    const currentGroupName = () => latestAcademicGroup()?.group_name || lecturer()?.group_name || '';
    const currentStatusName = () => latestHomebase()?.status_name || lecturer()?.status_name || 'Dosen Tetap';
    const currentContractName = () => latestHomebase()?.contract_name || '';

    return (
        <div class="min-h-screen bg-neutral-50 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 flex flex-col">
            <TopBar />

            <main class="flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                <PopupBlockedAlert />

                {/* Breadcrumb Navigation */}
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-4">
                    <nav class="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                        <A href="/rectorat" class="hover:text-violet-600 transition-colors">Rektorat</A>
                        <span>/</span>
                        <A href={`/rectorat/institution/${institutionId()}`} class="hover:text-violet-600 transition-colors">Institusi</A>
                        <span>/</span>
                        <A href={`/rectorat/institution/${institutionId()}/academic`} class="hover:text-violet-600 transition-colors">Akademik</A>
                        <span>/</span>
                        <A href={`/rectorat/institution/${institutionId()}/academic/lecturer/master/lecturer`} class="hover:text-violet-600 transition-colors">Dosen</A>
                        <span>/</span>
                        <span class="text-neutral-700 dark:text-neutral-300 font-semibold">Detail Dosen</span>
                    </nav>

                    <A
                        href={`/rectorat/institution/${institutionId()}/academic/lecturer/master/lecturer`}
                        class="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-200 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-md hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors shadow-2xs self-start sm:self-auto"
                    >
                        <svg class="size-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                        </svg>
                        <span>Kembali ke Daftar Dosen</span>
                    </A>
                </div>

                <Show when={error()}>
                    <div class="p-4 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
                        {error()}
                    </div>
                </Show>

                {/* Profile Header Hero Card */}
                <div class="bg-linier-to-r from-violet-900 via-indigo-900 to-slate-900 rounded-xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-violet-500/20">
                    <div class="absolute -right-16 -top-16 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl pointer-events-none"></div>

                    <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        {/* Avatar & Main Info */}
                        <div class="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                            <div class="relative">
                                <Show
                                    when={individualData()?.picture?.location}
                                    fallback={
                                        <div class="size-20 sm:size-24 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-white font-black text-3xl flex items-center justify-center shadow-lg border-2 border-violet-400/30">
                                            {(ind()?.name || lecturerMaster()?.name || 'D').charAt(0).toUpperCase()}
                                        </div>
                                    }
                                >
                                    <img
                                        src={individualData()!.picture!.location}
                                        alt={formattedFullName()}
                                        class="size-20 sm:size-24 rounded-full object-cover shadow-lg border-2 border-violet-400/30"
                                    />
                                </Show>
                                <span class="absolute -bottom-1 -right-1 size-5 bg-emerald-500 border-2 border-violet-900 rounded-full" title="Active Lecturer"></span>
                            </div>

                            <div class="text-center sm:text-start space-y-1">
                                <div class="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-violet-500/20 text-violet-200 text-xs font-mono font-semibold border border-violet-400/30">
                                    <span>{nidnOrNuptkBadge()}</span>
                                </div>
                                <h1 class="text-2xl sm:text-3xl font-black text-white tracking-tight">
                                    {formattedFullName()}
                                </h1>
                                <p class="text-xs sm:text-sm text-violet-200/80 font-medium">
                                    {currentUnitName()} • {currentRankName()}{currentGroupName() ? ` (${currentGroupName()})` : ''}
                                </p>
                                <p class="text-xs text-violet-300/60 font-mono">
                                    {individualData()?.user?.email || lecturerMaster()?.code || '-'}
                                </p>
                            </div>
                        </div>

                        {/* Status Badge */}
                        <div class="flex items-center justify-center gap-3">
                            <div class="px-4 py-2 rounded-lg bg-white/10 backdrop-blur-xs border border-white/15 text-center">
                                <p class="text-[10px] font-semibold uppercase tracking-wider text-violet-200">Status Kepegawaian</p>
                                <p class="text-sm font-bold text-white">{currentStatusName()}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div class="flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-700/80 pb-px">
                    <button
                        type="button"
                        id="tab-btn-overview"
                        onClick={() => setActiveTab('overview')}
                        class={`px-4 py-2.5 text-xs font-bold rounded-t-lg transition-all border-b-2 -mb-px flex items-center gap-2 ${
                            activeTab() === 'overview'
                                ? 'border-violet-600 text-violet-600 dark:text-violet-400 bg-white dark:bg-neutral-800'
                                : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                        }`}
                    >
                        <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" />
                        </svg>
                        <span>Ringkasan Profil</span>
                    </button>
                    <button
                        type="button"
                        id="tab-btn-biodata"
                        onClick={() => setActiveTab('biodata')}
                        class={`px-4 py-2.5 text-xs font-bold rounded-t-lg transition-all border-b-2 -mb-px flex items-center gap-2 ${
                            activeTab() === 'biodata'
                                ? 'border-violet-600 text-violet-600 dark:text-violet-400 bg-white dark:bg-neutral-800'
                                : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                        }`}
                    >
                        <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="8" r="5" />
                            <path d="M20 21a8 8 0 0 0-16 0" />
                        </svg>
                        <span>Biodata Pribadi</span>
                    </button>
                    <button
                        type="button"
                        id="tab-btn-academic"
                        onClick={() => setActiveTab('academic')}
                        class={`px-4 py-2.5 text-xs font-bold rounded-t-lg transition-all border-b-2 -mb-px flex items-center gap-2 ${
                            activeTab() === 'academic'
                                ? 'border-violet-600 text-violet-600 dark:text-violet-400 bg-white dark:bg-neutral-800'
                                : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                        }`}
                    >
                        <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                            <path d="M6 12v5c3 3 9 3 12 0v-5" />
                        </svg>
                        <span>Detail Akademik & Riwayat</span>
                    </button>
                </div>

                {/* Tab Content */}
                <Show
                    when={!isLoading()}
                    fallback={
                        <Loader
                            message="Memuat profil dosen..."
                            color="purple"
                            size="lg"
                            class="py-20"
                        />
                    }
                >
                    {/* Tab 1: Overview */}
                    <Show when={activeTab() === 'overview'}>
                        <div class="space-y-6">
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Faculty Assignment Card */}
                                <div class="p-5 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80 space-y-3 shadow-sm">
                                    <div class="flex items-center justify-between">
                                        <h3 class="text-xs font-bold font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                                            Penugasan & Status Dosen
                                        </h3>
                                        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300 font-mono">
                                            {currentStatusName()}
                                        </span>
                                    </div>
                                    <div class="grid grid-cols-2 gap-3 text-xs">
                                        <div>
                                            <span class="text-neutral-400 block">NIDN</span>
                                            <span class="font-bold text-neutral-800 dark:text-neutral-100 font-mono">{lecturerNidn() || '-'}</span>
                                        </div>
                                        <div>
                                            <span class="text-neutral-400 block">NUPTK</span>
                                            <span class="font-bold text-neutral-800 dark:text-neutral-100 font-mono">{lecturerNuptk() || '-'}</span>
                                        </div>
                                        <div>
                                            <span class="text-neutral-400 block">Program Studi (Homebase)</span>
                                            <span class="font-bold text-neutral-800 dark:text-neutral-100">{currentUnitName()}</span>
                                        </div>
                                        <div>
                                            <span class="text-neutral-400 block">Jabatan Fungsional</span>
                                            <span class="font-bold text-neutral-800 dark:text-neutral-100">{currentRankName()}</span>
                                        </div>
                                        <div>
                                            <span class="text-neutral-400 block">Golongan / Pangkat</span>
                                            <span class="font-bold text-neutral-800 dark:text-neutral-100">{currentGroupName() || '-'}</span>
                                        </div>
                                        <div>
                                            <span class="text-neutral-400 block">Status Dosen</span>
                                            <span class="font-bold text-emerald-600 dark:text-emerald-400">{currentStatusName()}</span>
                                        </div>
                                        <Show when={currentContractName()}>
                                            <div class="col-span-2">
                                                <span class="text-neutral-400 block">Perjanjian Kontrak</span>
                                                <span class="font-bold text-neutral-800 dark:text-neutral-100">{currentContractName()}</span>
                                            </div>
                                        </Show>
                                    </div>
                                </div>

                                {/* Identity Summary Card */}
                                <div class="p-5 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80 space-y-3 shadow-sm">
                                    <h3 class="text-xs font-bold font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                                        Identitas & Kontak
                                    </h3>
                                    <div class="grid grid-cols-2 gap-3 text-xs">
                                        <div>
                                            <span class="text-neutral-400 block">NIK (Nomor Induk Kependudukan)</span>
                                            <span class="font-bold text-neutral-800 dark:text-neutral-100 font-mono">{ind()?.code || lecturerMaster()?.identification_number || '-'}</span>
                                        </div>
                                        <div>
                                            <span class="text-neutral-400 block">Jenis Kelamin</span>
                                            <span class="font-bold text-neutral-800 dark:text-neutral-100">
                                                {individualData()?.gender?.name || '-'}
                                            </span>
                                        </div>
                                        <div>
                                            <span class="text-neutral-400 block">Tempat & Tanggal Lahir</span>
                                            <span class="font-bold text-neutral-800 dark:text-neutral-100">
                                                {ind()?.birth_place ? `${ind()?.birth_place}, ${ind()?.birth_date || '-'}` : ind()?.birth_date || '-'}
                                            </span>
                                        </div>
                                        <div>
                                            <span class="text-neutral-400 block">Email Terdaftar</span>
                                            <span class="font-bold text-neutral-800 dark:text-neutral-100 truncate block">
                                                {individualData()?.user?.email || '-'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Teaching Credit Progression Visualization with Apache ECharts */}
                            <div class="min-w-0 p-6 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80 shadow-sm space-y-4">
                                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div class="space-y-1">
                                        <div class="flex items-center gap-2">
                                            <div class="size-7 rounded-lg bg-violet-100 dark:bg-violet-950/80 text-violet-600 dark:text-violet-400 flex items-center justify-center font-bold">
                                                <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                    <path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" />
                                                </svg>
                                            </div>
                                            <h3 class="text-sm font-bold text-neutral-900 dark:text-white">
                                                Tren Beban SKS Mengajar Perkuliahan
                                            </h3>
                                        </div>
                                        <p class="text-xs text-neutral-500 dark:text-neutral-400">
                                            Tren akumulasi beban SKS perkuliahan yang diampu di setiap Tahun Akademik berbasis Apache ECharts.
                                        </p>
                                    </div>
                                    <Show when={yearlyCreditTrends().length > 0}>
                                        <div class="flex items-center gap-2">
                                            <span class="px-2.5 py-1 rounded-full bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 font-mono text-[11px] font-semibold border border-violet-200/80 dark:border-violet-800/60">
                                                {yearlyCreditTrends().length} Periode Akademik
                                            </span>
                                        </div>
                                    </Show>
                                </div>

                                <Show
                                    when={teachLectureChart()}
                                    fallback={
                                        <div class="py-12 text-center text-neutral-400 font-mono text-xs flex flex-col items-center justify-center gap-2">
                                            <svg class="size-8 text-neutral-300 dark:text-neutral-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                                <path d="M3 3v18h18" /><path d="m19 9-5 5-4-4-3 3" />
                                            </svg>
                                            <span>Belum ada data penugasan perkuliahan dengan Tahun Akademik untuk ditampilkan di grafik.</span>
                                        </div>
                                    }
                                >
                                    <Suspense
                                        fallback={
                                            <Loader
                                                message="Memuat grafik..."
                                                color="purple"
                                                size="md"
                                                class="py-12"
                                            />
                                        }
                                    >
                                        <div class="w-full min-w-0">
                                            <EChart
                                                option={teachLectureChart()}
                                                ariaLabel="Grafik Total Beban Mengajar per Tahun Akademik"
                                                height={360}
                                                class="w-full"
                                            />
                                        </div>
                                    </Suspense>
                                </Show>
                            </div>
                        </div>
                    </Show>

                    {/* Tab 2: Biodata */}
                    <Show when={activeTab() === 'biodata'}>
                        <div class="p-6 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80 space-y-6 shadow-sm">
                            <div class="border-b border-neutral-200/80 dark:border-neutral-700/80 pb-4">
                                <h3 class="text-sm font-bold text-neutral-900 dark:text-white">
                                    Biodata Pribadi & Kependudukan
                                </h3>
                                <p class="text-xs text-neutral-500 dark:text-neutral-400">
                                    Data identitas kependudukan resmi yang tercatat di pangkalan data kampus.
                                </p>
                            </div>

                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 text-xs">
                                <div>
                                    <span class="text-neutral-400 block mb-0.5">Nama Lengkap</span>
                                    <span class="font-bold text-neutral-900 dark:text-white">{formattedFullName()}</span>
                                </div>
                                <div>
                                    <span class="text-neutral-400 block mb-0.5">Gelar Depan</span>
                                    <span class="font-bold text-neutral-800 dark:text-neutral-200">{ind()?.front_title || lecturerMaster()?.front_title || '-'}</span>
                                </div>
                                <div>
                                    <span class="text-neutral-400 block mb-0.5">Gelar Belakang</span>
                                    <span class="font-bold text-neutral-800 dark:text-neutral-200">{ind()?.last_title || lecturerMaster()?.last_title || '-'}</span>
                                </div>
                                <div>
                                    <span class="text-neutral-400 block mb-0.5">NIK (Nomor Induk Kependudukan)</span>
                                    <span class="font-bold text-neutral-800 dark:text-neutral-200 font-mono">{ind()?.code || lecturerMaster()?.identification_number || '-'}</span>
                                </div>
                                <div>
                                    <span class="text-neutral-400 block mb-0.5">Jenis Kelamin</span>
                                    <span class="font-bold text-neutral-800 dark:text-neutral-200">{individualData()?.gender?.name || '-'}</span>
                                </div>
                                <div>
                                    <span class="text-neutral-400 block mb-0.5">Agama</span>
                                    <span class="font-bold text-neutral-800 dark:text-neutral-200">{individualData()?.religion?.name || '-'}</span>
                                </div>
                                <div>
                                    <span class="text-neutral-400 block mb-0.5">Tempat Lahir</span>
                                    <span class="font-bold text-neutral-800 dark:text-neutral-200">{ind()?.birth_place || '-'}</span>
                                </div>
                                <div>
                                    <span class="text-neutral-400 block mb-0.5">Tanggal Lahir</span>
                                    <span class="font-bold text-neutral-800 dark:text-neutral-200 font-mono">{ind()?.birth_date || '-'}</span>
                                </div>
                                <div>
                                    <span class="text-neutral-400 block mb-0.5">Status Pernikahan</span>
                                    <span class="font-bold text-neutral-800 dark:text-neutral-200">{individualData()?.marital_status?.name || '-'}</span>
                                </div>
                            </div>
                        </div>
                    </Show>

                    {/* Tab 3: Academic Details */}
                    <Show when={activeTab() === 'academic'}>
                        <div class="space-y-6">
                            {/* Primary Faculty Credentials Card */}
                            <div class="p-6 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80 space-y-6 shadow-sm">
                                <div class="border-b border-neutral-200/80 dark:border-neutral-700/80 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <div>
                                        <h3 class="text-sm font-bold text-neutral-900 dark:text-white">
                                            Status Kepegawaian Akademik & Registrasi Dosen
                                        </h3>
                                        <p class="text-xs text-neutral-500 dark:text-neutral-400">
                                            Kredensial mengajar di pendidikan tinggi, penugasan homebase, dan jabatan fungsional.
                                        </p>
                                    </div>
                                    <span class="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800 self-start sm:self-auto">
                                        {currentStatusName()}
                                    </span>
                                </div>

                                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 text-xs">
                                    <div>
                                        <span class="text-neutral-400 block mb-0.5">NIDN (Nomor Induk Dosen Nasional)</span>
                                        <span class="font-bold text-neutral-900 dark:text-white font-mono">{lecturerNidn() || '-'}</span>
                                    </div>
                                    <div>
                                        <span class="text-neutral-400 block mb-0.5">NUPTK / NUPN</span>
                                        <span class="font-bold text-neutral-900 dark:text-white font-mono">{lecturerNuptk() || '-'}</span>
                                    </div>
                                    <div>
                                        <span class="text-neutral-400 block mb-0.5">Jabatan Fungsional</span>
                                        <span class="font-bold text-neutral-800 dark:text-neutral-200">{currentRankName()}</span>
                                    </div>
                                    <div>
                                        <span class="text-neutral-400 block mb-0.5">Golongan / Pangkat</span>
                                        <span class="font-bold text-neutral-800 dark:text-neutral-200">{currentGroupName() || '-'}</span>
                                    </div>
                                    <div>
                                        <span class="text-neutral-400 block mb-0.5">Program Studi Homebase</span>
                                        <span class="font-bold text-neutral-800 dark:text-neutral-200">{currentUnitName()}</span>
                                    </div>
                                    <div>
                                        <span class="text-neutral-400 block mb-0.5">Status Kepegawaian</span>
                                        <span class="font-bold text-emerald-600 dark:text-emerald-400">{currentStatusName()}</span>
                                    </div>
                                    <div>
                                        <span class="text-neutral-400 block mb-0.5">Perjanjian Kontrak</span>
                                        <span class="font-bold text-neutral-800 dark:text-neutral-200">{currentContractName() || '-'}</span>
                                    </div>
                                    <div>
                                        <span class="text-neutral-400 block mb-0.5">Jenjang Pendidikan Tertinggi</span>
                                        <span class="font-bold text-neutral-800 dark:text-neutral-200">{individualData()?.education?.name || 'Magister (S2)'}</span>
                                    </div>
                                    <div>
                                        <span class="text-neutral-400 block mb-0.5">Email Terdaftar</span>
                                        <span class="font-bold text-neutral-800 dark:text-neutral-200 font-mono">{individualData()?.user?.email || '-'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Homebases & Rank History Records */}
                            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Homebase Assignment History */}
                                <div class="p-6 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80 space-y-4 shadow-sm">
                                    <div class="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-700">
                                        <div class="flex items-center gap-2">
                                            <div class="size-8 rounded-lg bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center font-bold text-xs">
                                                HB
                                            </div>
                                            <div>
                                                <h4 class="text-xs font-bold text-neutral-900 dark:text-white">Riwayat Homebase Dosen</h4>
                                                <p class="text-[10px] text-neutral-500 font-mono">academic_lecturer_transaction.homebases</p>
                                            </div>
                                        </div>
                                        <span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300">
                                            {allHomebases().length} Data
                                        </span>
                                    </div>

                                    <Show
                                        when={allHomebases().length > 0}
                                        fallback={
                                            <div class="py-6 text-center text-xs text-neutral-400 font-mono">
                                                Homebase aktif: <span class="font-bold text-neutral-700 dark:text-neutral-300">{currentUnitName()}</span>
                                            </div>
                                        }
                                    >
                                        <div class="space-y-3">
                                            <For each={allHomebases()}>
                                                {(hb, idx) => (
                                                    <div class="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/60 dark:border-neutral-700/60 flex items-center justify-between text-xs">
                                                        <div class="space-y-0.5">
                                                            <div class="flex items-center gap-2">
                                                                <span class="font-bold text-neutral-900 dark:text-white">{hb.unit_name || 'Program Studi'}</span>
                                                                <Show when={idx() === 0}>
                                                                    <span class="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">Aktif</span>
                                                                </Show>
                                                            </div>
                                                            <div class="flex items-center gap-2 text-[11px] text-neutral-500">
                                                                <span>{hb.status_name || 'Dosen Tetap'}</span>
                                                                <Show when={hb.contract_name}>
                                                                    <span>•</span>
                                                                    <span class="font-medium text-neutral-600 dark:text-neutral-400">{hb.contract_name}</span>
                                                                </Show>
                                                            </div>
                                                        </div>
                                                        <div class="text-[10px] font-mono text-neutral-400">
                                                            {hb.created_at ? new Date(hb.created_at).toLocaleDateString('id-ID') : '-'}
                                                        </div>
                                                    </div>
                                                )}
                                            </For>
                                        </div>
                                    </Show>
                                </div>

                                {/* Academic Rank Progression */}
                                <div class="p-6 rounded-xl bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80 space-y-4 shadow-sm">
                                    <div class="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-700">
                                        <div class="flex items-center gap-2">
                                            <div class="size-8 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-xs">
                                                JF
                                            </div>
                                            <div>
                                                <h4 class="text-xs font-bold text-neutral-900 dark:text-white">Riwayat Jabatan Fungsional & Golongan</h4>
                                                <p class="text-[10px] text-neutral-500 font-mono">academic_ranks & academic_groups</p>
                                            </div>
                                        </div>
                                        <span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300">
                                            {allAcademicRanks().length + allAcademicGroups().length} Data
                                        </span>
                                    </div>

                                    <Show
                                        when={allAcademicRanks().length > 0 || allAcademicGroups().length > 0}
                                        fallback={
                                            <div class="py-6 text-center text-xs text-neutral-400 font-mono">
                                                Jabatan fungsional: <span class="font-bold text-neutral-700 dark:text-neutral-300">{currentRankName()}</span> {currentGroupName() ? `• ${currentGroupName()}` : ''}
                                            </div>
                                        }
                                    >
                                        <div class="space-y-3">
                                            <For each={allAcademicRanks()}>
                                                {(rk, idx) => (
                                                    <div class="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/60 dark:border-neutral-700/60 flex items-center justify-between text-xs">
                                                        <div class="space-y-0.5">
                                                            <div class="flex items-center gap-2">
                                                                <span class="font-bold text-neutral-900 dark:text-white">{rk.rank_name || 'Jabatan Fungsional'}</span>
                                                                <Show when={idx() === 0}>
                                                                    <span class="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300">Terbaru</span>
                                                                </Show>
                                                            </div>
                                                            <span class="text-[10px] text-neutral-500 font-mono">SK: {rk.decree_number || '-'} {rk.decree_date ? `(${rk.decree_date})` : ''}</span>
                                                        </div>
                                                        <div class="text-[10px] font-mono text-neutral-400">
                                                            TMT: {rk.start_date || '-'}
                                                        </div>
                                                    </div>
                                                )}
                                            </For>
                                            <For each={allAcademicGroups()}>
                                                {(gp, idx) => (
                                                    <div class="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/60 dark:border-neutral-700/60 flex items-center justify-between text-xs">
                                                        <div class="space-y-0.5">
                                                            <div class="flex items-center gap-2">
                                                                <span class="font-bold text-neutral-900 dark:text-white">Golongan: {gp.group_name || 'Golongan'}</span>
                                                                <Show when={idx() === 0}>
                                                                    <span class="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">Terbaru</span>
                                                                </Show>
                                                            </div>
                                                            <span class="text-[10px] text-neutral-500 font-mono">SK: {gp.decree_number || '-'} {gp.decree_date ? `(${gp.decree_date})` : ''}</span>
                                                        </div>
                                                        <div class="text-[10px] font-mono text-neutral-400">
                                                            TMT: {gp.start_date || '-'}
                                                        </div>
                                                    </div>
                                                )}
                                            </For>
                                        </div>
                                    </Show>
                                </div>
                            </div>
                        </div>
                    </Show>
                </Show>
            </main>
        </div>
    );
}
