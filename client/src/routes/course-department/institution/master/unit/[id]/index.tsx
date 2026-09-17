import { createSignal, onMount, Show } from 'solid-js';
import { useParams, useSearchParams } from '@solidjs/router';
import TopBar from '~/components/navigation/TopBar';
import { toast } from '~/components/toast/Toaster';
import { getBaseApiUrl, getAuthHeaders } from '~/controllers/master/masterApiController';
import { getStorageItem } from '~/lib/storage';
import EChart from '~/components/chart/echart_component';

export default function UnitDashboardPage() {
    const apiPath = "institution/master/units";
    const params = useParams();
    const [searchParams] = useSearchParams();

    const resolveId = () => {
        const pId = params.id;
        if (pId && pId !== '[id]' && pId !== ':id') {
            return pId.trim();
        }
        return ((searchParams.id as string) || getStorageItem('unit_id') || '').trim();
    };

    const [selectedId, setSelectedId] = createSignal<string>(resolveId());
    const [unit, setUnit] = createSignal<any | null>(null);
    const [isLoading, setIsLoading] = createSignal(true);

    const fetchDetail = async (id: string) => {
        if (!id || id === '00000000-0000-0000-0000-000000000000') {
            setUnit(null);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        try {
            const url = `${getBaseApiUrl()}/${apiPath}/${encodeURIComponent(id)}/dashboard`;
            const response = await fetch(url, {
                method: "GET",
                headers: getAuthHeaders(),
            });

            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}`);
            }

            const resJson = await response.json();
            const data = resJson.data ?? resJson;

            if (data) {
                setUnit(data);
            } else {
                setUnit(null);
                toast.danger('Unit record not found.');
            }
        } catch (error: any) {
            console.error('Error fetching unit detail:', error);
            setUnit(null);
            toast.danger('Failed to load unit details from server.');
        } finally {
            setIsLoading(false);
        }
    };

    onMount(() => {
        const id = selectedId();
        if (id) {
            fetchDetail(id);
        } else {
            setIsLoading(false);
        }
    });

    return (
        <div class="min-h-screen bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 font-sans">
            <TopBar />

            <div class="mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                <div class="flex flex-col md:flex-row md:items-center md:justify-between border-b border-neutral-200 dark:border-neutral-800 pb-5">
                    <div>
                        <nav class="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 mb-2 font-medium">
                            <span class="hover:text-blue-600 cursor-pointer transition-colors">Course Department</span>
                            <span>/</span>
                            <span>Institution</span>
                            <span>/</span>
                            <span>Unit Dashboard</span>
                        </nav>
                        <h1 class="text-3xl font-bold tracking-tight text-neutral-900 dark:text-white flex items-center gap-3">
                            <span class="text-blue-600 dark:text-blue-400">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="w-8 h-8">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
                                </svg>
                            </span>
                            Unit Dashboard
                        </h1>
                        <p class="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                            Overview and details of the selected organizational unit.
                        </p>
                    </div>

                    <div class="mt-4 md:mt-0">
                        <a href={`/course-department/academic/course/master/course?unit_id=${selectedId()}`} class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-neutral-900">
                            View Courses
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
                                <path fill-rule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clip-rule="evenodd" />
                            </svg>
                        </a>
                    </div>
                </div>

                <Show
                    when={!isLoading()}
                    fallback={
                        <div class="animate-pulse space-y-6">
                            <div class="h-32 bg-neutral-200 dark:bg-neutral-800 rounded-xl"></div>
                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                <div class="h-40 bg-neutral-200 dark:bg-neutral-800 rounded-xl"></div>
                                <div class="h-40 bg-neutral-200 dark:bg-neutral-800 rounded-xl"></div>
                                <div class="h-40 bg-neutral-200 dark:bg-neutral-800 rounded-xl"></div>
                            </div>
                        </div>
                    }
                >
                    <Show
                        when={unit()}
                        fallback={
                            <div class="flex flex-col items-center justify-center p-12 bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm text-center">
                                <div class="bg-neutral-100 dark:bg-neutral-900 p-4 rounded-full mb-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h3 class="text-lg font-semibold text-neutral-900 dark:text-white">Unit not found</h3>
                                <p class="text-sm text-neutral-500 dark:text-neutral-400 mt-1 max-w-md">
                                    We couldn't find the unit data you're looking for. It might have been removed or the ID is incorrect.
                                </p>
                            </div>
                        }
                    >
                        {(item) => (
                            <div class="space-y-6">
                                {/* Hero Card */}
                                <div class="bg-gradient-to-br from-blue-600 to-blue-800 dark:from-blue-900 dark:to-blue-950 rounded-2xl p-8 shadow-lg text-white relative overflow-hidden">
                                    <div class="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
                                    <div class="absolute bottom-0 left-10 mb-4 w-24 h-24 bg-blue-400 opacity-20 rounded-full blur-xl"></div>

                                    <div class="relative z-10">
                                        <div class="flex items-center gap-3 mb-2">
                                            <span class="px-2.5 py-1 text-xs font-bold uppercase tracking-wide bg-blue-500/30 border border-blue-400/30 rounded-full backdrop-blur-sm">
                                                Code: {item().code || '-'}
                                            </span>
                                            <Show when={item().is_active}>
                                                <span class="px-2.5 py-1 text-xs font-bold uppercase tracking-wide bg-emerald-500/30 border border-emerald-400/30 text-emerald-100 rounded-full backdrop-blur-sm flex items-center gap-1">
                                                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                                    Active
                                                </span>
                                            </Show>
                                        </div>
                                        <h2 class="text-3xl md:text-4xl font-extrabold mb-1 drop-shadow-sm">{item().name || item().nama || 'Unknown Unit'}</h2>
                                    </div>
                                </div>

                                {/* Details Grid */}
                                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div class="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm p-6 hover:shadow-md transition-shadow">
                                        <h3 class="text-lg font-bold text-neutral-900 dark:text-white mb-4 flex items-center gap-2 border-b border-neutral-100 dark:border-neutral-700 pb-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 text-blue-500">
                                                <path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                                            </svg>
                                            Basic Information
                                        </h3>
                                        <dl class="space-y-4">
                                            <div>
                                                <dt class="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">Unit ID</dt>
                                                <dd class="text-sm font-mono text-neutral-900 dark:text-neutral-200 bg-neutral-50 dark:bg-neutral-900 p-2 rounded border border-neutral-100 dark:border-neutral-700 break-all">{item().id}</dd>
                                            </div>
                                            <div class="grid grid-cols-2 gap-4">
                                                <div>
                                                    <dt class="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">Created At</dt>
                                                    <dd class="text-sm font-medium text-neutral-900 dark:text-neutral-200">{item().created_at ? new Date(item().created_at).toLocaleDateString() : '-'}</dd>
                                                </div>
                                                <div>
                                                    <dt class="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider mb-1">Updated At</dt>
                                                    <dd class="text-sm font-medium text-neutral-900 dark:text-neutral-200">{item().updated_at ? new Date(item().updated_at).toLocaleDateString() : '-'}</dd>
                                                </div>
                                            </div>
                                        </dl>
                                    </div>

                                    <div class="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm p-6 hover:shadow-md transition-shadow">
                                        <h3 class="text-lg font-bold text-neutral-900 dark:text-white mb-4 flex items-center gap-2 border-b border-neutral-100 dark:border-neutral-700 pb-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 text-indigo-500">
                                                <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
                                            </svg>
                                            Academic Statistics
                                        </h3>
                                        <div class="grid grid-cols-1 gap-4">
                                            <div class="flex items-center justify-between p-3 rounded-lg border border-neutral-100 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50">
                                                <div class="text-sm font-medium text-neutral-600 dark:text-neutral-400">Total Curriculum</div>
                                                <div class="text-xl font-bold text-neutral-900 dark:text-white font-mono">{item().total_curriculum || 0}</div>
                                            </div>
                                            <div class="flex items-center justify-between p-3 rounded-lg border border-neutral-100 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50">
                                                <div class="text-sm font-medium text-neutral-600 dark:text-neutral-400">Total Courses</div>
                                                <div class="text-xl font-bold text-neutral-900 dark:text-white font-mono">{item().matakuliah?.total_matakuliah || 0}</div>
                                            </div>
                                            <div class="flex items-center justify-between p-3 rounded-lg border border-neutral-100 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50">
                                                <div class="text-sm font-medium text-neutral-600 dark:text-neutral-400">Total Credits (SKS)</div>
                                                <div class="text-xl font-bold text-neutral-900 dark:text-white font-mono">{item().matakuliah?.total_credit || 0}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm p-6 hover:shadow-md transition-shadow">
                                        <h3 class="text-lg font-bold text-neutral-900 dark:text-white mb-4 flex items-center gap-2 border-b border-neutral-100 dark:border-neutral-700 pb-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5 text-emerald-500">
                                                <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
                                            </svg>
                                            Quick Actions
                                        </h3>
                                        <div class="flex flex-col gap-3 mt-4">
                                            <a href={`/course-department/academic/course/master/course?unit_id=${item().id}`} class="group flex items-center justify-between p-3 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors">
                                                <div class="flex items-center gap-3">
                                                    <div class="bg-blue-100 dark:bg-blue-900/40 p-2 rounded-md text-blue-600 dark:text-blue-400">
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                                                            <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                                                        </svg>
                                                    </div>
                                                    <div>
                                                        <div class="text-sm font-semibold text-neutral-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Manage Courses</div>
                                                        <div class="text-xs text-neutral-500 dark:text-neutral-400">View and manage syllabus</div>
                                                    </div>
                                                </div>
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5 text-neutral-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                    <path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clip-rule="evenodd" />
                                                </svg>
                                            </a>

                                            {/* Could add other actions here related to unit */}
                                        </div>
                                    </div>
                                </div>

                                {/* Charts Grid */}
                                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <Show when={item().student_academic_year_chart}>
                                        <div class="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm p-6 hover:shadow-md transition-shadow">
                                            <h3 class="text-lg font-bold text-neutral-900 dark:text-white mb-4 border-b border-neutral-100 dark:border-neutral-700 pb-2">
                                                Student Trend by Academic Year
                                            </h3>
                                            <div class="h-80 w-full relative">
                                                <EChart 
                                                    option={item().student_academic_year_chart as any} 
                                                    height="100%" 
                                                    width="100%" 
                                                />
                                            </div>
                                        </div>
                                    </Show>

                                    <Show when={item().course_category_distribution}>
                                        <div class="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 shadow-sm p-6 hover:shadow-md transition-shadow">
                                            <h3 class="text-lg font-bold text-neutral-900 dark:text-white mb-4 border-b border-neutral-100 dark:border-neutral-700 pb-2">
                                                Course Category Distribution
                                            </h3>
                                            <div class="h-80 w-full relative">
                                                <EChart 
                                                    option={item().course_category_distribution as any} 
                                                    height="100%" 
                                                    width="100%" 
                                                />
                                            </div>
                                        </div>
                                    </Show>
                                </div>
                            </div>
                        )}
                    </Show>
                </Show>
            </div>
        </div>
    );
}
