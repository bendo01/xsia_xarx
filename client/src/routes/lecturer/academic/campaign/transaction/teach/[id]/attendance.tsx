import { useParams, A } from '@solidjs/router';
import TopBar from '~/components/navigation/TopBar';

export default function LecturerTeachAttendancePage() {
    const params = useParams();
    const teachId = () => params.id || '';

    return (
        <div class="min-h-screen bg-neutral-50 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 flex flex-col">
            <TopBar />

            <main class="flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                <div class="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-neutral-200 dark:border-neutral-800">
                    <div class="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400">
                        <A href="/lecturer/dashboard" class="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                            Dashboard
                        </A>
                        <span>/</span>
                        <A href="/lecturer/academic/campaign/transaction/teach" class="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                            Pengajaran
                        </A>
                        <span>/</span>
                        <span class="font-bold text-neutral-900 dark:text-white">
                            Presensi & Roster
                        </span>
                    </div>

                    <div class="flex items-center gap-2">
                        <A
                            href="/lecturer/academic/campaign/transaction/teach"
                            class="px-3 py-1.5 rounded-xs border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors inline-flex items-center gap-1.5"
                        >
                            <svg class="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Kembali ke Daftar Kelas
                        </A>
                        <A
                            href={`/lecturer/academic/campaign/transaction/teach/${teachId()}/grade`}
                            class="px-3 py-1.5 rounded-xs bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-xs font-semibold transition-colors inline-flex items-center gap-1.5"
                        >
                            Nilai Mahasiswa →
                        </A>
                    </div>
                </div>

                <div class="bg-white dark:bg-neutral-800 rounded-xs p-6 sm:p-8 border border-neutral-200 dark:border-neutral-700 shadow-2xs">
                    <h1 class="text-2xl font-black text-neutral-900 dark:text-white">
                        Class Detail & Attendance Roster
                    </h1>
                </div>
            </main>
        </div>
    );
}
