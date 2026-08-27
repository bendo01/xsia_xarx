import { createSignal, onMount, For, Show } from 'solid-js';
import { A } from '@solidjs/router';
import TopBar from '~/components/navigation/TopBar';
import { toast } from '~/components/toast/Toaster';
import { 
    listStudentActivities, 
    StudentActivityItem, 
    toggleIsLocked 
} from '~/controllers/academic/student/campaign/AcademicStudentCampaignActivityController';

export default function StudentCampaignActivityIndexPage() {
    const [activities, setActivities] = createSignal<StudentActivityItem[]>([]);
    const [isLoading, setIsLoading] = createSignal(true);
    const [searchQuery, setSearchQuery] = createSignal('');
    const [page, setPage] = createSignal(1);
    const [totalPages, setTotalPages] = createSignal(1);

    const fetchActivities = async () => {
        setIsLoading(true);
        try {
            const res = await listStudentActivities({
                page: page(),
                page_size: 10,
                name: searchQuery() || undefined,
            });

            setActivities(res.data || []);
            setTotalPages(res.total_pages || 1);
        } catch (err) {
            console.error('Error fetching student activities:', err);
            toast.danger('Failed to load academic semester activities.');
        } finally {
            setIsLoading(false);
        }
    };

    onMount(() => {
        fetchActivities();
    });

    const handleSearch = (e: Event) => {
        e.preventDefault();
        setPage(1);
        fetchActivities();
    };

    const latestAct = () => activities()[0] || null;
    const currentIPK = () => (latestAct()?.grand_cumulative_index ?? latestAct()?.cumulative_index ?? 0).toFixed(2);
    const totalSKS = () => latestAct()?.grand_total_credit ?? latestAct()?.total_credit ?? 0;

    return (
        <div class="min-h-screen bg-neutral-50 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 flex flex-col">
            <TopBar />

            <main class="flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                {/* Header Card */}
                <div class="bg-white dark:bg-neutral-800 rounded-3xl p-6 sm:p-8 border border-neutral-200 dark:border-neutral-700 shadow-2xs">
                    <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div class="space-y-1">
                            <div class="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-mono font-semibold border border-indigo-200 dark:border-indigo-800/80">
                                <span class="size-1.5 rounded-full bg-indigo-500"></span>
                                <span>Academic Student Campaign Activities</span>
                            </div>
                            <h1 class="text-2xl sm:text-3xl font-black tracking-tight text-neutral-900 dark:text-white">
                                Academic Activities & Semester Records
                            </h1>
                            <p class="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 max-w-2xl">
                                Track semester activity campaigns, Study Plan Cards (KRS), academic evaluations (KHS), and cumulative progression.
                            </p>
                        </div>

                        {/* Top KPI Stats */}
                        <div class="flex items-center gap-3">
                            <div class="p-3 px-5 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/80 text-center">
                                <span class="text-[10px] font-mono uppercase tracking-wider text-blue-600 dark:text-blue-400 block">Cumulative GPA</span>
                                <span class="text-xl font-black text-blue-900 dark:text-blue-200">{currentIPK()}</span>
                            </div>
                            <div class="p-3 px-5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/80 text-center">
                                <span class="text-[10px] font-mono uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">Credits Taken</span>
                                <span class="text-xl font-black text-indigo-900 dark:text-indigo-200">{totalSKS()} <span class="text-xs font-normal">SKS</span></span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Search & Actions Bar */}
                <div class="bg-white dark:bg-neutral-800 rounded-2xl p-4 border border-neutral-200 dark:border-neutral-700 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
                    <form onSubmit={handleSearch} class="relative w-full sm:w-80">
                        <input
                            type="text"
                            placeholder="Search semester or academic year..."
                            value={searchQuery()}
                            onInput={(e) => setSearchQuery(e.currentTarget.value)}
                            class="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-hidden focus:border-indigo-500"
                        />
                        <svg class="size-4 absolute left-3 top-2.5 text-neutral-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                    </form>

                    <div class="flex items-center gap-2 w-full sm:w-auto">
                        <A
                            href="/student/academic/student/campaign/activity/enrollment"
                            class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5"
                        >
                            <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg>
                            <span>Enroll in KRS Classes</span>
                        </A>
                    </div>
                </div>

                {/* Semester Activities Table */}
                <div class="bg-white dark:bg-neutral-800 rounded-3xl border border-neutral-200 dark:border-neutral-700 shadow-2xs overflow-hidden">
                    <Show when={!isLoading()} fallback={
                        <div class="py-16 flex flex-col items-center justify-center gap-3 text-neutral-400">
                            <div class="size-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                            <p class="text-xs font-mono">Loading academic semester activities from server...</p>
                        </div>
                    }>
                        <div class="overflow-x-auto">
                            <table class="w-full text-xs text-start">
                                <thead class="bg-neutral-100 dark:bg-neutral-900/60 text-neutral-500 font-mono uppercase text-[10px] border-b border-neutral-200 dark:border-neutral-700">
                                    <tr>
                                        <th class="py-3.5 px-4 text-start">Academic Semester</th>
                                        <th class="py-3.5 px-4 text-center">Semester SKS</th>
                                        <th class="py-3.5 px-4 text-center">Cumulative SKS</th>
                                        <th class="py-3.5 px-4 text-center">Semester IPS</th>
                                        <th class="py-3.5 px-4 text-center">Cumulative IPK</th>
                                        <th class="py-3.5 px-4 text-center">Study Plan Status</th>
                                        <th class="py-3.5 px-4 text-end">Action Portals</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-neutral-100 dark:divide-neutral-700/50">
                                    <For each={activities()} fallback={
                                        <tr>
                                            <td colspan="7" class="py-12 text-center text-neutral-400">
                                                No academic activities found.
                                            </td>
                                        </tr>
                                    }>
                                        {(act) => (
                                            <tr class="hover:bg-neutral-50 dark:hover:bg-neutral-900/30 transition-colors">
                                                <td class="py-4 px-4 font-bold text-neutral-900 dark:text-white">
                                                    <div class="flex items-center gap-2.5">
                                                        <div class="size-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center">
                                                            <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/></svg>
                                                        </div>
                                                        <div>
                                                            <span class="block">{act.name || 'Academic Semester'}</span>
                                                            <span class="text-[10px] text-neutral-400 font-mono">ID: {act.id ? `${act.id.slice(0, 8)}...` : '-'}</span>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td class="py-4 px-4 text-center font-mono font-bold">
                                                    {act.total_credit ?? 0}
                                                </td>

                                                <td class="py-4 px-4 text-center font-mono font-bold">
                                                    {act.grand_total_credit ?? act.total_credit ?? 0}
                                                </td>

                                                <td class="py-4 px-4 text-center font-mono font-extrabold text-blue-600 dark:text-blue-400">
                                                    {(act.cumulative_index ?? 0).toFixed(2)}
                                                </td>

                                                <td class="py-4 px-4 text-center font-mono font-extrabold text-indigo-600 dark:text-indigo-400">
                                                    {(act.grand_cumulative_index ?? act.cumulative_index ?? 0).toFixed(2)}
                                                </td>

                                                <td class="py-4 px-4 text-center">
                                                    <span class={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold rounded-full border ${
                                                        act.is_lock
                                                            ? 'bg-amber-50 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                                                            : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                                    }`}>
                                                        <span class={`size-1.5 rounded-full ${act.is_lock ? 'bg-amber-500' : 'bg-emerald-500'}`}></span>
                                                        {act.is_lock ? 'Locked / Finalized' : 'Active / KRS Open'}
                                                    </span>
                                                </td>

                                                <td class="py-4 px-4 text-end">
                                                    <div class="flex items-center justify-end gap-2">
                                                        <A
                                                            href={`/student/academic/student/campaign/activity/show?id=${act.id}`}
                                                            class="px-3 py-1.5 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900 rounded-lg text-xs font-bold transition-colors"
                                                        >
                                                            View Details
                                                        </A>
                                                        <Show when={!act.is_lock}>
                                                            <A
                                                                href={`/student/academic/student/campaign/activity/enrollment?activity_id=${act.id}`}
                                                                class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs"
                                                            >
                                                                Enroll (KRS)
                                                            </A>
                                                        </Show>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </For>
                                </tbody>
                            </table>
                        </div>
                    </Show>
                </div>
            </main>
        </div>
    );
}
