import TopBar from '~/components/navigation/TopBar';

export default function AcademicStudentFinalassignmentTransactionEvaluationsummaryPage() {
    return (
        <div class="min-h-screen bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 flex flex-col">
            <TopBar />

            <main class="flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
                <div class="sm:flex sm:items-center sm:justify-between border-b border-neutral-200 dark:border-neutral-800 pb-4">
                    <div>
                        <nav class="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                            <a href="/administrator/dashboard" class="hover:text-blue-600 transition-colors">Administrator</a>
                            <span>/</span>
                            <span>Academic</span>
                            <span>/</span>
                            <span>Student</span>
                            <span>/</span>
                            <span>Final Assignment</span>
                            <span>/</span>
                            <span>Transaction</span>
                            <span>/</span>
                            <span class="font-medium text-neutral-900 dark:text-white">Evaluation Summary</span>
                        </nav>
                        <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white font-mono">
                            Evaluation Summary
                        </h1>
                        <p class="text-sm text-neutral-600 dark:text-neutral-400 mt-0.5">
                            Data management, registry entities, and operational records for Evaluation Summary.
                        </p>
                    </div>
                </div>

                <div class="bg-white dark:bg-neutral-800 rounded-xs p-10 border border-neutral-200 dark:border-neutral-700 shadow-2xs flex flex-col items-center justify-center text-center min-h-[320px]">
                    <div class="size-14 rounded-xs bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/80 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4 shadow-xs">
                        <svg class="size-7" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect width="18" height="18" x="3" y="3" rx="2" />
                            <path d="M3 9h18" />
                            <path d="M9 21V9" />
                        </svg>
                    </div>
                    <h3 class="text-base font-bold text-neutral-900 dark:text-white mb-1.5 font-mono">
                        Evaluation Summary Workspace
                    </h3>
                    <p class="text-xs text-neutral-500 dark:text-neutral-400 max-w-md font-mono leading-relaxed">
                        Data management, registry entities, and operational records for Evaluation Summary.
                    </p>
                </div>
            </main>
        </div>
    );
}
