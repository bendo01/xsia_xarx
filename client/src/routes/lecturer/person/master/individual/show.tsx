import TopBar from '~/components/navigation/TopBar';
import { currentUserSignal } from '~/lib/authStore';

export default function LecturerIndividualShowPage() {
    const user = () => currentUserSignal();

    return (
        <div class="min-h-screen bg-neutral-50 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 flex flex-col">
            <TopBar />

            <main class="flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                <div class="bg-white dark:bg-neutral-800 rounded-3xl p-6 sm:p-8 border border-neutral-200 dark:border-neutral-700 shadow-2xs">
                    <div class="flex items-center gap-4">
                        <div class="size-16 rounded-2xl bg-indigo-600 text-white font-black text-2xl flex items-center justify-center shadow-md">
                            {(user()?.name || 'L').charAt(0)}
                        </div>
                        <div>
                            <div class="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-xs font-mono font-semibold mb-1">
                                <span>Lecturer Profile Portal</span>
                            </div>
                            <h1 class="text-2xl font-black text-neutral-900 dark:text-white">
                                {user()?.name || 'Faculty Lecturer'}
                            </h1>
                            <p class="text-xs text-neutral-500 dark:text-neutral-400">
                                {user()?.email || 'lecturer@campus.ac.id'}
                            </p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
