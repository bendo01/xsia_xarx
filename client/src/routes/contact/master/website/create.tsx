import { createSignal } from 'solid-js';
import TopBar from '~/components/navigation/TopBar';
import { toast } from '~/components/toast/Toaster';
import { masterApiCreate } from '~/controllers/master/masterApiController';

export default function MasterCreatePage() {
    const apiPath = "contact/master/websites";
    const basePath = "/contact/master/website";
    const [code, setCode] = createSignal('');
    const [name, setName] = createSignal('');
    const [description, setDescription] = createSignal('');
    const [isSubmitting, setIsSubmitting] = createSignal(false);

    const handleSubmit = async (e: Event) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await masterApiCreate(apiPath, {
                code: code(),
                name: name(),
                description: description(),
            });

            if (res.success) {
                toast.success(res.message || 'Record created successfully!');
                setTimeout(() => {
                    window.location.href = basePath;
                }, 500);
            } else {
                toast.danger(res.message || 'Failed to create record.');
            }
        } catch (err: any) {
            toast.danger(err.message || 'Network error occurred.');
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
                            <span>Contact</span>
                            <span>/</span>
                            <span>Master</span>
                            <span>/</span>
                            <a href={basePath} class="hover:text-blue-600 transition-colors">Website</a>
                            <span>/</span>
                            <span class="font-medium text-neutral-900 dark:text-white">Create</span>
                        </nav>
                        <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white font-mono">
                            Add New Website
                        </h1>
                    </div>

                    <div class="mt-4 sm:mt-0">
                        <a
                            href={basePath}
                            class="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium text-neutral-700 bg-white dark:bg-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700/60 rounded-none shadow-2xs transition-colors"
                        >
                            <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="m15 18-6-6 6-6"/>
                            </svg>
                            <span>Cancel</span>
                        </a>
                    </div>
                </div>

                <div class="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-2xs p-6 max-w-3xl">
                    <form onSubmit={handleSubmit} class="space-y-6">
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <label class="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 font-mono mb-2">
                                    Code <span class="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={code()}
                                    onInput={(e) => setCode(e.currentTarget.value)}
                                    placeholder="e.g. CODE-001"
                                    class="w-full p-2.5 text-xs sm:text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 outline-hidden transition-colors"
                                />
                            </div>

                            <div>
                                <label class="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 font-mono mb-2">
                                    Name / Title <span class="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={name()}
                                    onInput={(e) => setName(e.currentTarget.value)}
                                    placeholder="Enter name"
                                    class="w-full p-2.5 text-xs sm:text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 outline-hidden transition-colors"
                                />
                            </div>
                        </div>

                        <div>
                            <label class="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 font-mono mb-2">
                                Description / Notes
                            </label>
                            <textarea
                                rows={4}
                                value={description()}
                                onInput={(e) => setDescription(e.currentTarget.value)}
                                placeholder="Additional details or remarks..."
                                class="w-full p-2.5 text-xs sm:text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 outline-hidden transition-colors"
                            ></textarea>
                        </div>

                        <div class="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100 dark:border-neutral-700">
                            <a
                                href={basePath}
                                class="px-4 py-2 text-xs font-mono font-medium border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                            >
                                Cancel
                            </a>
                            <button
                                type="submit"
                                disabled={isSubmitting()}
                                class="inline-flex items-center gap-2 px-5 py-2 text-xs font-mono font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs disabled:opacity-50 transition-colors cursor-pointer"
                            >
                                <span>{isSubmitting() ? 'Saving...' : 'Save Website'}</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
