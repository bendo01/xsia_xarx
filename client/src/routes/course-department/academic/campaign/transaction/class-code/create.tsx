import { createSignal, createEffect, For, Show } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { getStorageItem } from '~/lib/storage';
import TopBar from '~/components/navigation/TopBar';
import { toast } from '~/components/toast/Toaster';
import { masterApiCreate } from '~/controllers/master/masterApiController';
import { listActivities, type CampaignActivityItem } from '~/controllers/academic/campaign/transaction/AcademicCampaignTransactionActivityController';

export default function ClassCodeCreatePage() {
    const navigate = useNavigate();
    const apiPath = "academic/campaign/transaction/class-codes";

    const [activities, setActivities] = createSignal<CampaignActivityItem[]>([]);
    const [isSubmitting, setIsSubmitting] = createSignal(false);

    const [formData, setFormData] = createSignal({
        code: 1,
        alphabet_code: '',
        name: '',
        activity_id: '',
        start_effective_date: '',
        end_effective_date: '',
        capacity: 0
    });

    createEffect(() => {
        listActivities({ page_size: 100, unit_id: getStorageItem('unit_id') as string }).then(res => setActivities(res.data || []));
    });

    const handleSubmit = async (e: Event) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const payload = {
                ...formData(),
                unit_id: getStorageItem('unit_id'),
                alphabet_code: formData().alphabet_code || null,
                start_effective_date: formData().start_effective_date || null,
                end_effective_date: formData().end_effective_date || null,
            };

            const res = await masterApiCreate(apiPath, payload);
            if (res.success) {
                toast.success('Class code created successfully!');
                navigate('/course-department/academic/campaign/transaction/class-code');
            } else {
                toast.danger(res.message || 'Failed to create class code.');
            }
        } catch (err: any) {
            toast.danger(err.message || 'Error occurred while saving.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div class="min-h-screen bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100">
            <TopBar />

            <div class="mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
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
                            <span class="font-medium text-neutral-900 dark:text-white">Create</span>
                        </nav>
                        <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white font-mono">
                            Create Class Code
                        </h1>
                    </div>
                </div>

                <div class="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md shadow-sm p-6">
                    <form onSubmit={handleSubmit} class="space-y-6">
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    Code
                                </label>
                                <input
                                    type="number"
                                    required
                                    value={formData().code}
                                    onInput={(e) => setFormData({ ...formData(), code: parseInt(e.currentTarget.value) || 0 })}
                                    class="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                                />
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    Alphabet Code
                                </label>
                                <input
                                    type="text"
                                    maxlength="5"
                                    value={formData().alphabet_code}
                                    onInput={(e) => setFormData({ ...formData(), alphabet_code: e.currentTarget.value })}
                                    placeholder="Enter up to 5 characters..."
                                    class="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white uppercase"
                                />
                                <p class="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                                    Maximum 5 characters allowed.
                                </p>
                            </div>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                Class Code Name
                            </label>
                            <input
                                type="text"
                                required
                                value={formData().name}
                                onInput={(e) => setFormData({ ...formData(), name: e.currentTarget.value })}
                                class="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                            />
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                Activity
                            </label>
                            <select
                                required
                                value={formData().activity_id}
                                onChange={(e) => setFormData({ ...formData(), activity_id: e.currentTarget.value })}
                                class="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                            >
                                <option value="" disabled>Select Activity</option>
                                <For each={activities()}>
                                    {(act) => <option value={act.id}>{act.name}</option>}
                                </For>
                            </select>
                        </div>

                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    Start Effective Date
                                </label>
                                <input
                                    type="date"
                                    value={formData().start_effective_date}
                                    onInput={(e) => setFormData({ ...formData(), start_effective_date: e.currentTarget.value })}
                                    class="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                                />
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                    End Effective Date
                                </label>
                                <input
                                    type="date"
                                    value={formData().end_effective_date}
                                    onInput={(e) => setFormData({ ...formData(), end_effective_date: e.currentTarget.value })}
                                    class="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                                />
                            </div>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                Capacity
                            </label>
                            <input
                                type="number"
                                required
                                min="0"
                                value={formData().capacity}
                                onInput={(e) => setFormData({ ...formData(), capacity: parseInt(e.currentTarget.value) || 0 })}
                                class="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-700 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                            />
                        </div>

                        <div class="flex items-center justify-end gap-3 pt-6 border-t border-neutral-200 dark:border-neutral-700">
                            <button
                                type="button"
                                onClick={() => navigate('/course-department/academic/campaign/transaction/class-code')}
                                class="px-4 py-2 text-sm font-medium text-neutral-700 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-600 rounded-md transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting()}
                                class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-2"
                            >
                                <Show when={isSubmitting()}>
                                    <svg class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                </Show>
                                {isSubmitting() ? 'Saving...' : 'Save Class Code'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
