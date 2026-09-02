import { createSignal, onMount, Show, For } from 'solid-js';
import { A } from '@solidjs/router';
import TopBar from '~/components/navigation/TopBar';
import { currentUserSignal, refreshAuthState } from '~/lib/authStore';
import { getStorageItem } from '~/lib/storage';
import { GetCurrentUser } from '~/controllers/auth/AuthUser';
import type { PersonMasterIndividualDataObject } from '~/models/person/master/Individual';
import type { AcademicLecturerMasterLecturer } from '~/models/academic/lecturer/master/Lecturer';
import type { AcademicLecturerTransactionHomebase } from '~/models/academic/lecturer/transaction/Homebase';
import type { AcademicLecturerTransactionAcademicRank } from '~/models/academic/lecturer/transaction/AcademicRank';
import type { AcademicLecturerTransactionAcademicGroup } from '~/models/academic/lecturer/transaction/AcademicGroup';
import { PersonMasterIndividualControllerShow } from '~/controllers/person/master/PersonMasterIndividualController';
import {
    getLecturerMasterByIndividual,
    getLecturerHomebases,
    getLecturerAcademicRanks,
    getLecturerAcademicGroups
} from '~/controllers/academic/lecturer/AcademicLecturerTransactionController';

export default function LecturerIndividualShowPage() {
    const user = () => currentUserSignal();
    const [isLoading, setIsLoading] = createSignal(true);
    const [individualData, setIndividualData] = createSignal<PersonMasterIndividualDataObject | null>(null);
    const [lecturerMaster, setLecturerMaster] = createSignal<AcademicLecturerMasterLecturer | null>(null);
    const [latestHomebase, setLatestHomebase] = createSignal<AcademicLecturerTransactionHomebase | null>(null);
    const [allHomebases, setAllHomebases] = createSignal<AcademicLecturerTransactionHomebase[]>([]);
    const [latestAcademicRank, setLatestAcademicRank] = createSignal<AcademicLecturerTransactionAcademicRank | null>(null);
    const [allAcademicRanks, setAllAcademicRanks] = createSignal<AcademicLecturerTransactionAcademicRank[]>([]);
    const [latestAcademicGroup, setLatestAcademicGroup] = createSignal<AcademicLecturerTransactionAcademicGroup | null>(null);
    const [allAcademicGroups, setAllAcademicGroups] = createSignal<AcademicLecturerTransactionAcademicGroup[]>([]);
    const [activeTab, setActiveTab] = createSignal<'overview' | 'biodata' | 'academic'>('overview');

    const fetchLecturerProfile = async () => {
        setIsLoading(true);
        try {
            await refreshAuthState();
            let indId = user()?.individual_id || getStorageItem('individual_id');
            if (!indId || indId === '00000000-0000-0000-0000-000000000000') {
                const userRes = await GetCurrentUser();
                if (userRes && userRes.code === 200 && userRes.data?.individual_id) {
                    indId = userRes.data.individual_id;
                }
            }

            if (indId && indId !== '00000000-0000-0000-0000-000000000000') {
                const [profileRes, masterLecturerRes] = await Promise.all([
                    PersonMasterIndividualControllerShow(indId),
                    getLecturerMasterByIndividual(indId),
                ]);

                if (profileRes && !profileRes.is_error && profileRes.data) {
                    setIndividualData(profileRes.data);
                }

                const resolvedLecturer = masterLecturerRes || profileRes.data?.lecturer || null;
                setLecturerMaster(resolvedLecturer);

                if (resolvedLecturer?.id) {
                    const lecturerId = resolvedLecturer.id;
                    const [hbRes, rankRes, groupRes] = await Promise.all([
                        getLecturerHomebases(lecturerId),
                        getLecturerAcademicRanks(lecturerId),
                        getLecturerAcademicGroups(lecturerId),
                    ]);

                    setLatestHomebase(hbRes.latestHomebase);
                    setAllHomebases(hbRes.homebases);

                    setLatestAcademicRank(rankRes.latestAcademicRank);
                    setAllAcademicRanks(rankRes.academicRanks);

                    setLatestAcademicGroup(groupRes.latestAcademicGroup);
                    setAllAcademicGroups(groupRes.academicGroups);
                }
            }
        } catch (err) {
            console.error('Error fetching lecturer profile:', err);
        } finally {
            setIsLoading(false);
        }
    };

    onMount(() => {
        fetchLecturerProfile();
    });

    const ind = () => individualData()?.individual;
    const lecturer = () => lecturerMaster() || individualData()?.lecturer;

    const formattedFullName = () => {
        const item = ind();
        if (!item) return user()?.name || 'Faculty Lecturer';
        const front = item.front_title ? item.front_title.trim() : '';
        const last = item.last_title ? item.last_title.trim() : '';
        const baseName = item.name.trim();

        if (front && last) return `${front} ${baseName}, ${last}`;
        if (front) return `${front} ${baseName}`;
        if (last) return `${baseName}, ${last}`;
        return baseName;
    };

    // NIDN or NUPTK from academic_lecturer_master.lecturers
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

    // Unit name from latest academic_lecturer_transaction.homebases
    const currentUnitName = () => latestHomebase()?.unit_name || lecturer()?.unit_name || 'Program Studi Homebase';

    // Academic rank from latest academic_lecturer_transaction.academic_ranks
    const currentRankName = () => latestAcademicRank()?.rank_name || lecturer()?.rank_name || 'Tenaga Pengajar';

    // Lecturer group from latest academic_lecturer_transaction.academic_groups
    const currentGroupName = () => latestAcademicGroup()?.group_name || lecturer()?.group_name || '';

    // Employment status from latest homebase or lecturer master
    const currentStatusName = () => latestHomebase()?.status_name || lecturer()?.status_name || 'Dosen Tetap';

    return (
        <div class="min-h-screen bg-neutral-50 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 flex flex-col">
            <TopBar />

            <main class="flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* Profile Header Hero Card */}
                <div class="bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-indigo-500/20">
                    <div class="absolute -right-16 -top-16 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

                    <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        {/* Avatar & Main Info */}
                        <div class="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                            <div class="relative">
                                <Show
                                    when={individualData()?.picture?.location}
                                    fallback={
                                        <div class="size-20 sm:size-24 rounded-2xl bg-indigo-600 text-white font-black text-3xl flex items-center justify-center shadow-lg border-2 border-indigo-400/30">
                                            {(ind()?.name || user()?.name || 'L').charAt(0).toUpperCase()}
                                        </div>
                                    }
                                >
                                    <img
                                        src={individualData()!.picture!.location}
                                        alt={formattedFullName()}
                                        class="size-20 sm:size-24 rounded-2xl object-cover shadow-lg border-2 border-indigo-400/30"
                                    />
                                </Show>
                                <span class="absolute -bottom-1 -right-1 size-5 bg-emerald-500 border-2 border-indigo-900 rounded-full" title="Active Lecturer"></span>
                            </div>

                            <div class="text-center sm:text-start space-y-1">
                                <div class="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-200 text-xs font-mono font-semibold border border-indigo-400/30">
                                    <span>{nidnOrNuptkBadge()}</span>
                                </div>
                                <h1 class="text-2xl sm:text-3xl font-black text-white tracking-tight">
                                    {formattedFullName()}
                                </h1>
                                <p class="text-xs sm:text-sm text-indigo-200/80 font-medium">
                                    {currentUnitName()} • {currentRankName()}{currentGroupName() ? ` (${currentGroupName()})` : ''}
                                </p>
                                <p class="text-xs text-indigo-300/60 font-mono">
                                    {user()?.email || individualData()?.user?.email || 'lecturer@tritunas.ac.id'}
                                </p>
                            </div>
                        </div>

                        {/* Quick Action Badges */}
                        <div class="flex items-center justify-center gap-3">
                            <A
                                href="/lecturer/academic/campaign/activity"
                                class="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-xs flex items-center gap-2 shadow-md transition-colors"
                            >
                                <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/>
                                    <path d="M6 6h10M6 10h10M6 14h6"/>
                                </svg>
                                <span>Teaching Classes</span>
                            </A>
                        </div>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div class="flex items-center gap-2 border-b border-neutral-200 dark:border-neutral-700/80 pb-px">
                    <button
                        type="button"
                        onClick={() => setActiveTab('overview')}
                        class={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 -mb-px flex items-center gap-2 ${
                            activeTab() === 'overview'
                                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-neutral-800'
                                : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                        }`}
                    >
                        <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z"/></svg>
                        <span>Profile Overview</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('biodata')}
                        class={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 -mb-px flex items-center gap-2 ${
                            activeTab() === 'biodata'
                                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-neutral-800'
                                : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                        }`}
                    >
                        <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/></svg>
                        <span>Personal Biodata</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('academic')}
                        class={`px-4 py-2.5 text-xs font-bold rounded-t-xl transition-all border-b-2 -mb-px flex items-center gap-2 ${
                            activeTab() === 'academic'
                                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-neutral-800'
                                : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                        }`}
                    >
                        <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
                        <span>Academic & Faculty Details</span>
                    </button>
                </div>

                {/* Tab Content */}
                <Show when={!isLoading()} fallback={
                    <div class="py-20 text-center flex flex-col items-center justify-center gap-3">
                        <div class="size-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                        <span class="text-xs font-mono text-neutral-400">Loading lecturer profile...</span>
                    </div>
                }>
                    {/* Tab 1: Overview */}
                    <Show when={activeTab() === 'overview'}>
                        <div class="space-y-6">
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Faculty Assignment Card */}
                                <div class="p-5 rounded-2xl bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80 space-y-3 shadow-2xs">
                                    <div class="flex items-center justify-between">
                                        <h3 class="text-xs font-bold font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                                            Faculty Appointment
                                        </h3>
                                        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-mono">
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
                                            <span class="text-neutral-400 block">Study Program (Homebase)</span>
                                            <span class="font-bold text-neutral-800 dark:text-neutral-100">{currentUnitName()}</span>
                                        </div>
                                        <div>
                                            <span class="text-neutral-400 block">Academic Rank</span>
                                            <span class="font-bold text-neutral-800 dark:text-neutral-100">{currentRankName()}</span>
                                        </div>
                                        <div>
                                            <span class="text-neutral-400 block">Golongan / Pangkat</span>
                                            <span class="font-bold text-neutral-800 dark:text-neutral-100">{currentGroupName() || '-'}</span>
                                        </div>
                                        <div>
                                            <span class="text-neutral-400 block">Academic Status</span>
                                            <span class="font-bold text-emerald-600 dark:text-emerald-400">{currentStatusName()}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Identity Summary Card */}
                                <div class="p-5 rounded-2xl bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80 space-y-3 shadow-2xs">
                                    <h3 class="text-xs font-bold font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                                        Identity & Contact
                                    </h3>
                                    <div class="grid grid-cols-2 gap-3 text-xs">
                                        <div>
                                            <span class="text-neutral-400 block">National ID (NIK)</span>
                                            <span class="font-bold text-neutral-800 dark:text-neutral-100 font-mono">{ind()?.code || '-'}</span>
                                        </div>
                                        <div>
                                            <span class="text-neutral-400 block">Gender</span>
                                            <span class="font-bold text-neutral-800 dark:text-neutral-100">
                                                {individualData()?.gender?.name || '-'}
                                            </span>
                                        </div>
                                        <div>
                                            <span class="text-neutral-400 block">Birth Place & Date</span>
                                            <span class="font-bold text-neutral-800 dark:text-neutral-100">
                                                {ind()?.birth_place ? `${ind()?.birth_place}, ${ind()?.birth_date || '-'}` : (ind()?.birth_date || '-')}
                                            </span>
                                        </div>
                                        <div>
                                            <span class="text-neutral-400 block">Email Address</span>
                                            <span class="font-bold text-neutral-800 dark:text-neutral-100 truncate block">
                                                {user()?.email || individualData()?.user?.email || 'mim@tritunas.ac.id'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Teaching Quick Link */}
                            <div class="p-6 rounded-3xl bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/40 dark:to-blue-950/40 border border-indigo-200/80 dark:border-indigo-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div class="space-y-1">
                                    <h3 class="text-sm font-bold text-neutral-900 dark:text-white">
                                        Teaching & Class Management
                                    </h3>
                                    <p class="text-xs text-neutral-600 dark:text-neutral-400">
                                        Input semester student scores, download attendee journals, and manage teaching schedules.
                                    </p>
                                </div>
                                <A
                                    href="/lecturer/academic/campaign/activity"
                                    class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs inline-flex items-center gap-2 transition-colors shrink-0"
                                >
                                    <span>Go to Teaching Portal →</span>
                                </A>
                            </div>
                        </div>
                    </Show>

                    {/* Tab 2: Biodata */}
                    <Show when={activeTab() === 'biodata'}>
                        <div class="p-6 rounded-3xl bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80 space-y-6 shadow-2xs">
                            <div class="border-b border-neutral-200/80 dark:border-neutral-700/80 pb-4">
                                <h3 class="text-sm font-bold text-neutral-900 dark:text-white">
                                    Personal Biodata & Civil Records
                                </h3>
                                <p class="text-xs text-neutral-500 dark:text-neutral-400">
                                    Official individual identity stored in the campus registry.
                                </p>
                            </div>

                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 text-xs">
                                <div>
                                    <span class="text-neutral-400 block mb-0.5">Full Name</span>
                                    <span class="font-bold text-neutral-900 dark:text-white">{formattedFullName()}</span>
                                </div>
                                <div>
                                    <span class="text-neutral-400 block mb-0.5">Front Title</span>
                                    <span class="font-bold text-neutral-800 dark:text-neutral-200">{ind()?.front_title || '-'}</span>
                                </div>
                                <div>
                                    <span class="text-neutral-400 block mb-0.5">Last Title</span>
                                    <span class="font-bold text-neutral-800 dark:text-neutral-200">{ind()?.last_title || '-'}</span>
                                </div>
                                <div>
                                    <span class="text-neutral-400 block mb-0.5">National ID (NIK)</span>
                                    <span class="font-bold text-neutral-800 dark:text-neutral-200 font-mono">{ind()?.code || '-'}</span>
                                </div>
                                <div>
                                    <span class="text-neutral-400 block mb-0.5">Gender</span>
                                    <span class="font-bold text-neutral-800 dark:text-neutral-200">{individualData()?.gender?.name || '-'}</span>
                                </div>
                                <div>
                                    <span class="text-neutral-400 block mb-0.5">Religion</span>
                                    <span class="font-bold text-neutral-800 dark:text-neutral-200">{individualData()?.religion?.name || '-'}</span>
                                </div>
                                <div>
                                    <span class="text-neutral-400 block mb-0.5">Birth Place</span>
                                    <span class="font-bold text-neutral-800 dark:text-neutral-200">{ind()?.birth_place || '-'}</span>
                                </div>
                                <div>
                                    <span class="text-neutral-400 block mb-0.5">Birth Date</span>
                                    <span class="font-bold text-neutral-800 dark:text-neutral-200 font-mono">{ind()?.birth_date || '-'}</span>
                                </div>
                                <div>
                                    <span class="text-neutral-400 block mb-0.5">Marital Status</span>
                                    <span class="font-bold text-neutral-800 dark:text-neutral-200">{individualData()?.marital_status?.name || '-'}</span>
                                </div>
                            </div>
                        </div>
                    </Show>

                    {/* Tab 3: Academic Details */}
                    <Show when={activeTab() === 'academic'}>
                        <div class="space-y-6">
                            {/* Primary Faculty Credentials Card */}
                            <div class="p-6 rounded-3xl bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80 space-y-6 shadow-2xs">
                                <div class="border-b border-neutral-200/80 dark:border-neutral-700/80 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <div>
                                        <h3 class="text-sm font-bold text-neutral-900 dark:text-white">
                                            Academic Employment & Faculty Registration
                                        </h3>
                                        <p class="text-xs text-neutral-500 dark:text-neutral-400">
                                            Higher education teaching credentials, homebase assignment, and functional ranks.
                                        </p>
                                    </div>
                                    <span class="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 self-start sm:self-auto">
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
                                        <span class="text-neutral-400 block mb-0.5">Academic Rank (Jabatan Fungsional)</span>
                                        <span class="font-bold text-neutral-800 dark:text-neutral-200">{currentRankName()}</span>
                                    </div>
                                    <div>
                                        <span class="text-neutral-400 block mb-0.5">Academic Group (Golongan / Pangkat)</span>
                                        <span class="font-bold text-neutral-800 dark:text-neutral-200">{currentGroupName() || '-'}</span>
                                    </div>
                                    <div>
                                        <span class="text-neutral-400 block mb-0.5">Homebase Study Program</span>
                                        <span class="font-bold text-neutral-800 dark:text-neutral-200">{currentUnitName()}</span>
                                    </div>
                                    <div>
                                        <span class="text-neutral-400 block mb-0.5">Employment Status</span>
                                        <span class="font-bold text-emerald-600 dark:text-emerald-400">{currentStatusName()}</span>
                                    </div>
                                    <div>
                                        <span class="text-neutral-400 block mb-0.5">Highest Education Degree</span>
                                        <span class="font-bold text-neutral-800 dark:text-neutral-200">{individualData()?.education?.name || 'Magister (S2)'}</span>
                                    </div>
                                    <div>
                                        <span class="text-neutral-400 block mb-0.5">Registered Email</span>
                                        <span class="font-bold text-neutral-800 dark:text-neutral-200 font-mono">{user()?.email || individualData()?.user?.email || '-'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Homebases & Rank History Records */}
                            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Homebase Assignment History */}
                                <div class="p-6 rounded-3xl bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80 space-y-4 shadow-2xs">
                                    <div class="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-700">
                                        <div class="flex items-center gap-2">
                                            <div class="size-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
                                                HB
                                            </div>
                                            <div>
                                                <h4 class="text-xs font-bold text-neutral-900 dark:text-white">Homebase Assignment History</h4>
                                                <p class="text-[10px] text-neutral-500 font-mono">academic_lecturer_transaction.homebases</p>
                                            </div>
                                        </div>
                                        <span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300">
                                            {allHomebases().length} Records
                                        </span>
                                    </div>

                                    <Show when={allHomebases().length > 0} fallback={
                                        <div class="py-6 text-center text-xs text-neutral-400 font-mono">
                                            Current active homebase: <span class="font-bold text-neutral-700 dark:text-neutral-300">{currentUnitName()}</span>
                                        </div>
                                    }>
                                        <div class="space-y-3">
                                            <For each={allHomebases()}>
                                                {(hb, idx) => (
                                                    <div class="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/60 dark:border-neutral-700/60 flex items-center justify-between text-xs">
                                                        <div class="space-y-0.5">
                                                            <div class="flex items-center gap-2">
                                                                <span class="font-bold text-neutral-900 dark:text-white">{hb.unit_name || 'Program Studi'}</span>
                                                                <Show when={idx() === 0}>
                                                                    <span class="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">Active</span>
                                                                </Show>
                                                            </div>
                                                            <span class="text-[11px] text-neutral-500">{hb.status_name || 'Dosen Tetap'}</span>
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
                                <div class="p-6 rounded-3xl bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80 space-y-4 shadow-2xs">
                                    <div class="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-700">
                                        <div class="flex items-center gap-2">
                                            <div class="size-8 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold text-xs">
                                                RK
                                            </div>
                                            <div>
                                                <h4 class="text-xs font-bold text-neutral-900 dark:text-white">Academic Rank & Group History</h4>
                                                <p class="text-[10px] text-neutral-500 font-mono">academic_ranks & academic_groups</p>
                                            </div>
                                        </div>
                                        <span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300">
                                            {allAcademicRanks().length + allAcademicGroups().length} Records
                                        </span>
                                    </div>

                                    <Show when={allAcademicRanks().length > 0 || allAcademicGroups().length > 0} fallback={
                                        <div class="py-6 text-center text-xs text-neutral-400 font-mono">
                                            Current rank: <span class="font-bold text-neutral-700 dark:text-neutral-300">{currentRankName()}</span> {currentGroupName() ? `• ${currentGroupName()}` : ''}
                                        </div>
                                    }>
                                        <div class="space-y-3">
                                            <For each={allAcademicRanks()}>
                                                {(rk, idx) => (
                                                    <div class="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/60 dark:border-neutral-700/60 flex items-center justify-between text-xs">
                                                        <div class="space-y-0.5">
                                                            <div class="flex items-center gap-2">
                                                                <span class="font-bold text-neutral-900 dark:text-white">{rk.rank_name || 'Jabatan Fungsional'}</span>
                                                                <Show when={idx() === 0}>
                                                                    <span class="px-1.5 py-0.2 rounded text-[9px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">Latest</span>
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
                                                    <div class="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/60 dark:border-neutral-700/60 flex items-center justify-between text-xs">
                                                        <div class="space-y-0.5">
                                                            <div class="flex items-center gap-2">
                                                                <span class="font-bold text-neutral-900 dark:text-white">Golongan: {gp.group_name || 'Golongan'}</span>
                                                                <Show when={idx() === 0}>
                                                                    <span class="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">Latest</span>
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
