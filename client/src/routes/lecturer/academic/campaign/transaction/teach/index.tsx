import TopBar from '~/components/navigation/TopBar';

export default function LecturerTeachIndexPage() {
    return (
        <div class="min-h-screen bg-neutral-50 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 flex flex-col">
            <TopBar />

            <main class="flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                <div class="bg-white dark:bg-neutral-800 rounded-3xl p-6 sm:p-8 border border-neutral-200 dark:border-neutral-700 shadow-2xs">
                    <h1 class="text-2xl font-black text-neutral-900 dark:text-white">
                        Lecturer Assigned Teaching Classes
                    </h1>
                    <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                        Manage semester course classes, student attendance, and assignments.
                    </p>
                </div>
            </main>
        </div>
    );
}
