import { createSignal, onMount, Show, For } from 'solid-js';
import { A } from '@solidjs/router';
import TopBar from '~/components/navigation/TopBar';
import { currentUserSignal, refreshAuthState } from '~/lib/authStore';
import { getStorageItem } from '~/lib/storage';
import { GetCurrentUser } from '~/controllers/auth/AuthUser';
import type { PersonMasterIndividualDataObject } from '~/models/person/master/Individual';
import { PersonMasterIndividualControllerShow } from '~/controllers/person/master/PersonMasterIndividualController';

export default function LecturerIndividualShowPage() {
    const user = () => currentUserSignal();
    const [isLoading, setIsLoading] = createSignal(true);
    const [individualData, setIndividualData] = createSignal<PersonMasterIndividualDataObject | null>(null);
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
                const profileRes = await PersonMasterIndividualControllerShow(indId);
                if (profileRes && !profileRes.is_error && profileRes.data) {
                    setIndividualData(profileRes.data);
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
    const lecturer = () => individualData()?.lecturer;

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
                                    <span>NIDN / NUPN: {lecturer()?.nidn || ind()?.code || '-'}</span>
                                </div>
                                <h1 class="text-2xl sm:text-3xl font-black text-white tracking-tight">
                                    {formattedFullName()}
                                </h1>
                                <p class="text-xs sm:text-sm text-indigo-200/80 font-medium">
                                    {lecturer()?.unit_name || 'Dosen Tetap Program Studi'} • {lecturer()?.rank_name || 'Tenaga Pengajar'}
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
                                            Dosen Aktif
                                        </span>
                                    </div>
                                    <div class="grid grid-cols-2 gap-3 text-xs">
                                        <div>
                                            <span class="text-neutral-400 block">NIDN / NUPN</span>
                                            <span class="font-bold text-neutral-800 dark:text-neutral-100 font-mono">{lecturer()?.nidn || ind()?.code || '-'}</span>
                                        </div>
                                        <div>
                                            <span class="text-neutral-400 block">Academic Status</span>
                                            <span class="font-bold text-emerald-600 dark:text-emerald-400">Aktif Mengajar</span>
                                        </div>
                                        <div>
                                            <span class="text-neutral-400 block">Study Program (Homebase)</span>
                                            <span class="font-bold text-neutral-800 dark:text-neutral-100">{lecturer()?.unit_name || 'Kebidanan / Farmasi'}</span>
                                        </div>
                                        <div>
                                            <span class="text-neutral-400 block">Academic Rank</span>
                                            <span class="font-bold text-neutral-800 dark:text-neutral-100">{lecturer()?.rank_name || 'Tenaga Pengajar / Asisten Ahli'}</span>
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
                        <div class="p-6 rounded-3xl bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80 space-y-6 shadow-2xs">
                            <div class="border-b border-neutral-200/80 dark:border-neutral-700/80 pb-4">
                                <h3 class="text-sm font-bold text-neutral-900 dark:text-white">
                                    Academic Employment & Faculty Registration
                                </h3>
                                <p class="text-xs text-neutral-500 dark:text-neutral-400">
                                    Higher education teaching credentials and accreditation records.
                                </p>
                            </div>

                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 text-xs">
                                <div>
                                    <span class="text-neutral-400 block mb-0.5">NIDN / NUPN</span>
                                    <span class="font-bold text-neutral-900 dark:text-white font-mono">{lecturer()?.nidn || ind()?.code || '-'}</span>
                                </div>
                                <div>
                                    <span class="text-neutral-400 block mb-0.5">Academic Rank (Jabatan Fungsional)</span>
                                    <span class="font-bold text-neutral-800 dark:text-neutral-200">{lecturer()?.rank_name || 'Tenaga Pengajar'}</span>
                                </div>
                                <div>
                                    <span class="text-neutral-400 block mb-0.5">Employment Status</span>
                                    <span class="font-bold text-emerald-600 dark:text-emerald-400">{lecturer()?.status_name || 'Dosen Tetap'}</span>
                                </div>
                                <div>
                                    <span class="text-neutral-400 block mb-0.5">Homebase Study Program</span>
                                    <span class="font-bold text-neutral-800 dark:text-neutral-200">{lecturer()?.unit_name || 'Program Studi Kebidanan / Farmasi'}</span>
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
                    </Show>
                </Show>
            </main>
        </div>
    );
}
