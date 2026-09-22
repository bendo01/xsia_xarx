import { createSignal, createEffect, Show } from 'solid-js';
import { useNavigate, useParams } from '@solidjs/router';
import TopBar from '~/components/navigation/TopBar';
import { toast } from '~/components/toast/Toaster';
import { masterApiShow } from '~/controllers/master/masterApiController';
import { listActivities, type CampaignActivityItem } from '~/controllers/academic/campaign/transaction/AcademicCampaignTransactionActivityController';

export default function ClassCodeDetailPage() {
    const params = useParams();
    const navigate = useNavigate();
    const apiPath = "academic/campaign/transaction/class-codes";

    const [activities, setActivities] = createSignal<CampaignActivityItem[]>([]);
    const [isLoading, setIsLoading] = createSignal(true);
    const [itemData, setItemData] = createSignal<any | null>(null);

    createEffect(() => {
        listActivities({ page_size: 100 }).then(res => setActivities(res.data || []));
    });

    createEffect(async () => {
        if (!params.id) return;
        setIsLoading(true);
        try {
            const res = await masterApiShow(apiPath, params.id);
            if (res.data) {
                setItemData(res.data);
            } else {
                toast.danger('Failed to load class code data');
                navigate('/course-department/academic/campaign/transaction/class-code');
            }
        } catch (err: any) {
            toast.danger('Failed to load class code data');
            navigate('/course-department/academic/campaign/transaction/class-code');
        } finally {
            setIsLoading(false);
        }
    });

    const getActivityName = (id: string) => {
        return activities().find(a => a.id === id)?.name || id || '-';
    };

    return (
        <div class="min-h-screen bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100">
            <TopBar />
            
            <div class="mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 max-w-4xl">
                <div class="sm:flex sm:items-center sm:justify-between border-b border-neutral-200 dark:border-neutral-800 pb-4">
                    <div>
                        <nav class="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                            <a href="/" class="hover:text-blue-600 transition-colors">Home</a>
                            <span>/</span>
                            <span>Course Department</span>
                            <span>/</span>
                            <span>Academic</span>
                            <span>/</span>
                            <span>Campaign</span>
                            <span>/</span>
                            <span>Transaction</span>
                            <span>/</span>
                            <a href="/course-department/academic/campaign/transaction/class-code" class="hover:text-blue-600 transition-colors">Class Code</a>
                            <span>/</span>
                            <span class="font-medium text-neutral-900 dark:text-white">Detail</span>
                        </nav>
                        <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white font-mono">
                            Class Code Detail
                        </h1>
                    </div>
                    <div class="mt-4 sm:mt-0 flex gap-2">
                        <button
                            type="button"
                            onClick={() => navigate('/course-department/academic/campaign/transaction/class-code')}
                            class="px-4 py-2 text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-50 dark:bg-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-600 rounded-md shadow-sm transition-colors cursor-pointer"
                        >
                            Back to List
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate(`/course-department/academic/campaign/transaction/class-code/${params.id}/edit`)}
                            class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition-colors cursor-pointer"
                        >
                            Edit
                        </button>
                    </div>
                </div>

                <div class="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md shadow-sm p-6">
                    <Show when={isLoading()}>
                        <div class="flex items-center justify-center p-12">
                            <svg class="animate-spin size-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        </div>
                    </Show>
                    
                    <Show when={!isLoading() && itemData()}>
                        <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
                            <div class="sm:col-span-1">
                                <dt class="text-sm font-medium text-neutral-500 dark:text-neutral-400">Class Code Name</dt>
                                <dd class="mt-1 text-base text-neutral-900 dark:text-white font-semibold uppercase">{itemData().name}</dd>
                            </div>
                            
                            <div class="sm:col-span-1">
                                <dt class="text-sm font-medium text-neutral-500 dark:text-neutral-400">Code</dt>
                                <dd class="mt-1 text-base text-neutral-900 dark:text-white">{itemData().code}</dd>
                            </div>
                            
                            <div class="sm:col-span-1">
                                <dt class="text-sm font-medium text-neutral-500 dark:text-neutral-400">Alphabet Code</dt>
                                <dd class="mt-1 text-base text-neutral-900 dark:text-white">{itemData().alphabet_code || '-'}</dd>
                            </div>
                            
                            <div class="sm:col-span-1">
                                <dt class="text-sm font-medium text-neutral-500 dark:text-neutral-400">Activity</dt>
                                <dd class="mt-1 text-base text-neutral-900 dark:text-white">{getActivityName(itemData().activity_id)}</dd>
                            </div>
                            
                            <div class="sm:col-span-1">
                                <dt class="text-sm font-medium text-neutral-500 dark:text-neutral-400">Start Effective Date</dt>
                                <dd class="mt-1 text-base text-neutral-900 dark:text-white">
                                    {itemData().start_effective_date ? new Date(itemData().start_effective_date).toLocaleDateString() : '-'}
                                </dd>
                            </div>
                            
                            <div class="sm:col-span-1">
                                <dt class="text-sm font-medium text-neutral-500 dark:text-neutral-400">End Effective Date</dt>
                                <dd class="mt-1 text-base text-neutral-900 dark:text-white">
                                    {itemData().end_effective_date ? new Date(itemData().end_effective_date).toLocaleDateString() : '-'}
                                </dd>
                            </div>
                            
                            <div class="sm:col-span-1">
                                <dt class="text-sm font-medium text-neutral-500 dark:text-neutral-400">Capacity</dt>
                                <dd class="mt-1 text-base text-neutral-900 dark:text-white">{itemData().capacity}</dd>
                            </div>
                        </dl>
                    </Show>
                </div>
            </div>
        </div>
    );
}
