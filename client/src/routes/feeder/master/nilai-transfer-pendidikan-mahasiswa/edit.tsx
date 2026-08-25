import { A } from '@solidjs/router';
import { createSignal } from 'solid-js';
import TopBar from '~/components/navigation/TopBar';

export default function FeederMasterNilaitransferpendidikanmahasiswaEditPage() {
    const [name, setName] = createSignal('');
    const [code, setCode] = createSignal('');
    const [description, setDescription] = createSignal('');
    const [isSubmitting, setIsSubmitting] = createSignal(false);

    const handleSubmit = (e: Event) => {
        e.preventDefault();
        setIsSubmitting(true);
        setTimeout(() => {
            setIsSubmitting(false);
        }, 500);
    };

    return (
        <div class="min-h-screen bg-neutral-50 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 flex flex-col">
            <TopBar />

            <main class="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div class="flex items-center gap-2 text-xs font-mono text-neutral-500 dark:text-neutral-400 mb-1">
                            <A href="/feeder/master/nilai-transfer-pendidikan-mahasiswa" class="hover:text-blue-600 dark:hover:text-blue-400">
                                Nilai Transfer Pendidikan Mahasiswa
                            </A>
                            <span>/</span>
                            <span class="text-neutral-900 dark:text-white font-semibold">Edit</span>
                        </div>
                        <h1 class="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white font-mono">
                            Edit Nilai Transfer Pendidikan Mahasiswa
                        </h1>
                    </div>
                    <A
                        href="/feeder/master/nilai-transfer-pendidikan-mahasiswa"
                        class="inline-flex items-center gap-2 px-3 py-2 text-xs font-mono font-medium rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700/60 transition-colors self-start sm:self-auto"
                    >
                        <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="m15 18-6-6 6-6"/>
                        </svg>
                        <span>Back to List</span>
                    </A>
                </div>

                <div class="bg-white dark:bg-neutral-800 rounded-2xl p-6 sm:p-8 border border-neutral-200 dark:border-neutral-700 shadow-2xs">
                    <form onSubmit={handleSubmit} class="space-y-6">
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <label class="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-300 font-mono mb-2">
                                    Code <span class="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={code()}
                                    onInput={(e) => setCode(e.currentTarget.value)}
                                    placeholder="Enter code"
                                    class="w-full px-3.5 py-2.5 text-sm rounded-xl border border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-hidden transition-colors font-mono"
                                />
                            </div>

                            <div>
                                <label class="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-300 font-mono mb-2">
                                    Name <span class="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={name()}
                                    onInput={(e) => setName(e.currentTarget.value)}
                                    placeholder="Enter name"
                                    class="w-full px-3.5 py-2.5 text-sm rounded-xl border border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-hidden transition-colors font-mono"
                                />
                            </div>
                        </div>

                        <div>
                            <label class="block text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-300 font-mono mb-2">
                                Description
                            </label>
                            <textarea
                                rows={4}
                                value={description()}
                                onInput={(e) => setDescription(e.currentTarget.value)}
                                placeholder="Additional details or remarks..."
                                class="w-full px-3.5 py-2.5 text-sm rounded-xl border border-neutral-300 dark:border-neutral-600 bg-neutral-50 dark:bg-neutral-900 text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-hidden transition-colors font-mono"
                            ></textarea>
                        </div>

                        <div class="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100 dark:border-neutral-700">
                            <A
                                href="/feeder/master/nilai-transfer-pendidikan-mahasiswa"
                                class="px-4 py-2 text-xs font-mono font-medium rounded-xl border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                            >
                                Cancel
                            </A>
                            <button
                                type="submit"
                                disabled={isSubmitting()}
                                class="inline-flex items-center gap-2 px-5 py-2 text-xs font-mono font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs disabled:opacity-50 transition-colors cursor-pointer"
                            >
                                <span>Save Changes</span>
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}
