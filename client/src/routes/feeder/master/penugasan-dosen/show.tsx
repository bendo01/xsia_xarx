import { A } from '@solidjs/router';
import TopBar from '~/components/navigation/TopBar';

export default function FeederMasterPenugasandosenShowPage() {
    return (
        <div class="min-h-screen bg-neutral-50 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 flex flex-col">
            <TopBar />

            <main class="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div class="flex items-center gap-2 text-xs font-mono text-neutral-500 dark:text-neutral-400 mb-1">
                            <A href="/feeder/master/penugasan-dosen" class="hover:text-blue-600 dark:hover:text-blue-400">
                                Penugasan Dosen
                            </A>
                            <span>/</span>
                            <span class="text-neutral-900 dark:text-white font-semibold">Detail</span>
                        </div>
                        <h1 class="text-2xl font-bold tracking-tight text-neutral-900 dark:text-white font-mono">
                            Penugasan Dosen Details
                        </h1>
                    </div>
                    <div class="flex items-center gap-2">
                        <A
                            href="/feeder/master/penugasan-dosen"
                            class="inline-flex items-center gap-2 px-3 py-2 text-xs font-mono font-medium rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700/60 transition-colors"
                        >
                            <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="m15 18-6-6 6-6"/>
                            </svg>
                            <span>Back to List</span>
                        </A>
                    </div>
                </div>

                <div class="bg-white dark:bg-neutral-800 rounded-2xl p-6 sm:p-8 border border-neutral-200 dark:border-neutral-700 shadow-2xs space-y-6">
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-6 border-b border-neutral-100 dark:border-neutral-700">
                        <div>
                            <span class="block text-xs font-mono text-neutral-400 uppercase tracking-wider mb-1">
                                Entity Name
                            </span>
                            <span class="text-sm font-semibold font-mono text-neutral-900 dark:text-white">
                                Penugasan Dosen
                            </span>
                        </div>
                        <div>
                            <span class="block text-xs font-mono text-neutral-400 uppercase tracking-wider mb-1">
                                Category Path
                            </span>
                            <span class="text-sm font-mono text-neutral-700 dark:text-neutral-300">
                                Feeder / Master
                            </span>
                        </div>
                    </div>

                    <div class="rounded-xl bg-neutral-50 dark:bg-neutral-900/60 p-6 border border-neutral-200 dark:border-neutral-700 text-center">
                        <p class="text-xs font-mono text-neutral-500 dark:text-neutral-400">
                            Select an item from the <A href="/feeder/master/penugasan-dosen" class="text-blue-600 dark:text-blue-400 underline">Penugasan Dosen Registry</A> to inspect real-time attributes and relational mappings.
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
}
