import { onMount } from 'solid-js';
import { A } from '@solidjs/router';
import TopBar from '../../components/navigation/TopBar';
import { currentUserSignal, refreshAuthState } from '../../lib/authStore';

export default function CandidateDashboard() {
    onMount(() => {
        refreshAuthState();
    });

    const userName = () => currentUserSignal()?.name || "Maya Angelou";

    return (
        <div class="min-h-screen bg-neutral-50 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 flex flex-col">
            <TopBar />

            <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* Header Banner */}
                <div class="bg-gradient-to-r from-amber-900 via-orange-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-amber-500/20">
                    <div class="absolute -right-10 -bottom-10 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
                    <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-semibold uppercase tracking-wider font-mono mb-3">
                                <span class="size-2 rounded-full bg-amber-400 animate-pulse"></span>
                                New Student Admission (PMB 2026/2027) • Wave 1
                            </div>
                            <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight">
                                Candidate Portal: {userName()}
                            </h1>
                            <p class="text-white/70 text-sm mt-1">
                                Application Reg. No: <span class="font-mono text-white font-semibold">PMB-2026-0814</span> • 1st Choice: <span class="text-amber-200 font-semibold">Software Engineering (S1)</span>
                            </p>
                        </div>

                        <div class="flex flex-wrap items-center gap-3">
                            <A 
                                href="/academic/candidate/reference/document-type" 
                                class="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold tracking-wider uppercase transition-all shadow-md hover:shadow-amber-500/25 flex items-center gap-2"
                            >
                                <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                                    <polyline points="14 2 14 8 20 8"/>
                                </svg>
                                Upload Documents
                            </A>
                            <A 
                                href="/academic/candidate/reference/phase" 
                                class="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/15 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2"
                            >
                                <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <circle cx="12" cy="12" r="10"/>
                                    <polyline points="12 6 12 12 16 14"/>
                                </svg>
                                Timeline & Phases
                            </A>
                        </div>
                    </div>
                </div>

                {/* Admission Journey Stepper */}
                <div class="bg-white dark:bg-neutral-800 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-700 shadow-sm space-y-4">
                    <h2 class="text-sm font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-mono">
                        Admission Progress Roadmap
                    </h2>

                    <div class="grid grid-cols-1 sm:grid-cols-5 gap-4 relative">
                        {/* Step 1 */}
                        <div class="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 flex flex-col items-center text-center">
                            <div class="size-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs mb-2">
                                ✓
                            </div>
                            <span class="text-xs font-bold text-emerald-900 dark:text-emerald-200">1. Registration</span>
                            <span class="text-[10px] text-emerald-700 dark:text-emerald-400 mt-1">Completed</span>
                        </div>

                        {/* Step 2 */}
                        <div class="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-300 dark:border-blue-800 flex flex-col items-center text-center">
                            <div class="size-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs mb-2 animate-pulse">
                                2
                            </div>
                            <span class="text-xs font-bold text-blue-900 dark:text-blue-200">2. Documents</span>
                            <span class="text-[10px] text-blue-700 dark:text-blue-400 mt-1">3/4 Verified</span>
                        </div>

                        {/* Step 3 */}
                        <div class="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-700 flex flex-col items-center text-center">
                            <div class="size-8 rounded-full bg-neutral-300 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 flex items-center justify-center font-bold text-xs mb-2">
                                3
                            </div>
                            <span class="text-xs font-bold text-neutral-800 dark:text-neutral-200">3. Selection CBT</span>
                            <span class="text-[10px] text-neutral-500 mt-1">Saturday, 10:00 AM</span>
                        </div>

                        {/* Step 4 */}
                        <div class="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-700 flex flex-col items-center text-center">
                            <div class="size-8 rounded-full bg-neutral-300 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 flex items-center justify-center font-bold text-xs mb-2">
                                4
                            </div>
                            <span class="text-xs font-bold text-neutral-800 dark:text-neutral-200">4. Final Results</span>
                            <span class="text-[10px] text-neutral-500 mt-1">Pending Exam</span>
                        </div>

                        {/* Step 5 */}
                        <div class="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200 dark:border-neutral-700 flex flex-col items-center text-center">
                            <div class="size-8 rounded-full bg-neutral-300 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 flex items-center justify-center font-bold text-xs mb-2">
                                5
                            </div>
                            <span class="text-xs font-bold text-neutral-800 dark:text-neutral-200">5. Re-registration</span>
                            <span class="text-[10px] text-neutral-500 mt-1">Final Enrollment</span>
                        </div>
                    </div>
                </div>

                {/* Document Verification & Exam Card */}
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Document Checklist */}
                    <div class="lg:col-span-2 bg-white dark:bg-neutral-800 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-700 shadow-sm">
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="text-sm font-bold text-neutral-900 dark:text-white">
                                Required Document Verification
                            </h3>
                            <A href="/academic/candidate/reference/document-type" class="text-xs text-amber-600 dark:text-amber-400 font-semibold hover:underline">
                                Manage Files →
                            </A>
                        </div>

                        <div class="overflow-x-auto">
                            <table class="w-full text-xs text-left">
                                <thead class="text-[11px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500 bg-neutral-50 dark:bg-neutral-900/50 font-mono">
                                    <tr>
                                        <th class="py-2.5 px-3">Document Title</th>
                                        <th class="py-2.5 px-3">Type</th>
                                        <th class="py-2.5 px-3">Status</th>
                                        <th class="py-2.5 px-3">Action</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-neutral-200 dark:divide-neutral-700">
                                    <tr>
                                        <td class="py-3 px-3 font-semibold text-neutral-900 dark:text-white">High School Diploma / Surat Keterangan Lulus</td>
                                        <td class="py-3 px-3 text-neutral-500">PDF, 1.2 MB</td>
                                        <td class="py-3 px-3"><span class="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">Verified</span></td>
                                        <td class="py-3 px-3 text-blue-600 dark:text-blue-400 font-semibold cursor-pointer">View</td>
                                    </tr>
                                    <tr>
                                        <td class="py-3 px-3 font-semibold text-neutral-900 dark:text-white">Academic Transcript (Semester 1 - 5)</td>
                                        <td class="py-3 px-3 text-neutral-500">PDF, 2.4 MB</td>
                                        <td class="py-3 px-3"><span class="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">Verified</span></td>
                                        <td class="py-3 px-3 text-blue-600 dark:text-blue-400 font-semibold cursor-pointer">View</td>
                                    </tr>
                                    <tr>
                                        <td class="py-3 px-3 font-semibold text-neutral-900 dark:text-white">National ID Card (KTP / KK)</td>
                                        <td class="py-3 px-3 text-neutral-500">JPG, 800 KB</td>
                                        <td class="py-3 px-3"><span class="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">Verified</span></td>
                                        <td class="py-3 px-3 text-blue-600 dark:text-blue-400 font-semibold cursor-pointer">View</td>
                                    </tr>
                                    <tr>
                                        <td class="py-3 px-3 font-semibold text-neutral-900 dark:text-white">Health & Color Blindness Certificate</td>
                                        <td class="py-3 px-3 text-neutral-500">Not uploaded</td>
                                        <td class="py-3 px-3"><span class="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 font-bold text-[10px]">Pending Upload</span></td>
                                        <td class="py-3 px-3"><A href="/academic/candidate/reference/document-type" class="text-amber-600 dark:text-amber-400 font-bold">Upload</A></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Entrance Exam Card & Fees */}
                    <div class="bg-white dark:bg-neutral-800 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-700 shadow-sm space-y-4">
                        <h3 class="text-sm font-bold text-neutral-900 dark:text-white">
                            CBT Examination Card
                        </h3>

                        <div class="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800/60 space-y-2">
                            <div class="flex items-center justify-between text-[11px] font-mono text-amber-800 dark:text-amber-300">
                                <span>Exam Type</span>
                                <span class="font-bold">Online CBT Test</span>
                            </div>
                            <div class="flex items-center justify-between text-[11px] font-mono text-amber-800 dark:text-amber-300">
                                <span>Date & Time</span>
                                <span class="font-bold">Saturday, 10:00 AM</span>
                            </div>
                            <div class="flex items-center justify-between text-[11px] font-mono text-amber-800 dark:text-amber-300">
                                <span>Session Room</span>
                                <span class="font-bold">Virtual Lab 04</span>
                            </div>

                            <button class="w-full mt-3 py-2 px-3 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition-colors">
                                Download Examination Card (PDF)
                            </button>
                        </div>

                        {/* Registration Fee Status */}
                        <div class="p-3 bg-neutral-50 dark:bg-neutral-900/60 rounded-xl border border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
                            <div>
                                <span class="text-xs font-semibold block text-neutral-800 dark:text-neutral-200">Registration Fee</span>
                                <span class="text-[11px] text-neutral-500 font-mono">Rp 350.000 (Inv #8912)</span>
                            </div>
                            <span class="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">
                                PAID
                            </span>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
