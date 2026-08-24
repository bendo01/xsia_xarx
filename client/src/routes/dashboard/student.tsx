import { onMount, createSignal } from 'solid-js';
import { A } from '@solidjs/router';
import TopBar from '../../components/navigation/TopBar';
import { currentUserSignal, refreshAuthState } from '../../lib/authStore';

export default function StudentDashboard() {
    onMount(() => {
        refreshAuthState();
    });

    const userName = () => currentUserSignal()?.name || "Alexandria Chen";

    return (
        <div class="min-h-screen bg-neutral-50 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 flex flex-col">
            <TopBar />

            <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* Header Banner */}
                <div class="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-blue-500/20">
                    <div class="absolute -right-10 -bottom-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
                    <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold uppercase tracking-wider font-mono mb-3">
                                <span class="size-2 rounded-full bg-blue-400 animate-pulse"></span>
                                Student Academic Portal • Semester 6
                            </div>
                            <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight">
                                {userName()}
                            </h1>
                            <p class="text-white/70 text-sm mt-1">
                                Student ID (NIM): <span class="font-mono text-white font-semibold">2201082049</span> • Computer Science • Academic Year 2026/2027
                            </p>
                        </div>

                        <div class="flex flex-wrap items-center gap-3">
                            <A 
                                href="/academic/survey/reference/bundle-category" 
                                class="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold tracking-wider uppercase transition-all shadow-md hover:shadow-blue-500/25 flex items-center gap-2"
                            >
                                <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/>
                                    <path d="M6 6h10M6 10h10M6 14h6"/>
                                </svg>
                                Study Plan (KRS)
                            </A>
                            <A 
                                href="/academic/student/reference/finance" 
                                class="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/15 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2"
                            >
                                <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <rect width="20" height="14" x="2" y="5" rx="2"/>
                                    <line x1="2" x2="22" y1="10" y2="10"/>
                                </svg>
                                Tuition Invoice
                            </A>
                        </div>
                    </div>
                </div>

                {/* Academic Metrics Grid */}
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    <div class="p-5 bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-2xs">
                        <div class="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs font-medium">
                            <span>Cumulative GPA (IPK)</span>
                            <div class="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                                <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                            </div>
                        </div>
                        <div class="mt-3 flex items-baseline gap-2">
                            <span class="text-3xl font-black tracking-tight text-blue-600 dark:text-blue-400">3.88</span>
                            <span class="text-xs font-semibold text-neutral-500 dark:text-neutral-400">/ 4.00</span>
                        </div>
                        <p class="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">★ Magna Cum Laude Track</p>
                    </div>

                    <div class="p-5 bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-2xs">
                        <div class="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs font-medium">
                            <span>Completed Credits (SKS)</span>
                            <div class="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                                <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/></svg>
                            </div>
                        </div>
                        <div class="mt-3 flex items-baseline gap-2">
                            <span class="text-3xl font-black tracking-tight text-neutral-900 dark:text-white">114</span>
                            <span class="text-xs font-semibold text-neutral-500 dark:text-neutral-400">/ 144 SKS</span>
                        </div>
                        <div class="w-full bg-neutral-100 dark:bg-neutral-700 rounded-full h-1.5 mt-2">
                            <div class="bg-indigo-600 h-1.5 rounded-full" style="width: 79%;"></div>
                        </div>
                    </div>

                    <div class="p-5 bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-2xs">
                        <div class="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs font-medium">
                            <span>Attendance Rate</span>
                            <div class="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                                <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                            </div>
                        </div>
                        <div class="mt-3 flex items-baseline gap-2">
                            <span class="text-3xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">96.8%</span>
                        </div>
                        <p class="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">Qualified for all final exams</p>
                    </div>

                    <div class="p-5 bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-2xs">
                        <div class="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs font-medium">
                            <span>Tuition & Finance</span>
                            <div class="p-2 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
                                <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
                            </div>
                        </div>
                        <div class="mt-3 flex items-baseline gap-2">
                            <span class="text-2xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">Paid in Full</span>
                        </div>
                        <p class="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">No outstanding dues</p>
                    </div>
                </div>

                {/* Enrolled Courses Table & Schedule */}
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Courses */}
                    <div class="lg:col-span-2 bg-white dark:bg-neutral-800 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-700 shadow-sm">
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="text-sm font-bold text-neutral-900 dark:text-white">
                                Current Enrolled Courses (Semester 6)
                            </h3>
                            <span class="text-xs font-mono text-neutral-500 dark:text-neutral-400">20 SKS Total</span>
                        </div>

                        <div class="overflow-x-auto">
                            <table class="w-full text-xs text-left">
                                <thead class="text-[11px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500 bg-neutral-50 dark:bg-neutral-900/50 font-mono">
                                    <tr>
                                        <th class="py-2.5 px-3">Course</th>
                                        <th class="py-2.5 px-3">SKS</th>
                                        <th class="py-2.5 px-3">Lecturer</th>
                                        <th class="py-2.5 px-3">Attendance</th>
                                        <th class="py-2.5 px-3">Grade Est.</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-neutral-200 dark:divide-neutral-700">
                                    <tr>
                                        <td class="py-3 px-3 font-semibold text-neutral-900 dark:text-white">CS301 - Cloud & Distributed Systems</td>
                                        <td class="py-3 px-3 font-mono">3</td>
                                        <td class="py-3 px-3 text-neutral-600 dark:text-neutral-300">Dr. Sarah Connor</td>
                                        <td class="py-3 px-3 text-emerald-600 dark:text-emerald-400 font-semibold font-mono">100% (14/14)</td>
                                        <td class="py-3 px-3"><span class="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">A (92)</span></td>
                                    </tr>
                                    <tr>
                                        <td class="py-3 px-3 font-semibold text-neutral-900 dark:text-white">CS308 - Web & Mobile Security</td>
                                        <td class="py-3 px-3 font-mono">3</td>
                                        <td class="py-3 px-3 text-neutral-600 dark:text-neutral-300">Dr. Bruce Wayne</td>
                                        <td class="py-3 px-3 text-emerald-600 dark:text-emerald-400 font-semibold font-mono">92.8% (13/14)</td>
                                        <td class="py-3 px-3"><span class="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">A- (88)</span></td>
                                    </tr>
                                    <tr>
                                        <td class="py-3 px-3 font-semibold text-neutral-900 dark:text-white">CS401 - Artificial Intelligence & LLMs</td>
                                        <td class="py-3 px-3 font-mono">4</td>
                                        <td class="py-3 px-3 text-neutral-600 dark:text-neutral-300">Prof. John von Neumann</td>
                                        <td class="py-3 px-3 text-emerald-600 dark:text-emerald-400 font-semibold font-mono">100% (14/14)</td>
                                        <td class="py-3 px-3"><span class="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">A (95)</span></td>
                                    </tr>
                                    <tr>
                                        <td class="py-3 px-3 font-semibold text-neutral-900 dark:text-white">CS490 - Thesis Proposal Seminar</td>
                                        <td class="py-3 px-3 font-mono">2</td>
                                        <td class="py-3 px-3 text-neutral-600 dark:text-neutral-300">Dr. Ada Lovelace</td>
                                        <td class="py-3 px-3 text-emerald-600 dark:text-emerald-400 font-semibold font-mono">100% (8/8)</td>
                                        <td class="py-3 px-3"><span class="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold text-[10px]">Passed</span></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Today's Schedule Card */}
                    <div class="bg-white dark:bg-neutral-800 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-700 shadow-sm space-y-4">
                        <div class="flex items-center justify-between">
                            <h3 class="text-sm font-bold text-neutral-900 dark:text-white">
                                Today's Schedule
                            </h3>
                            <span class="text-xs font-mono text-neutral-400">Monday</span>
                        </div>

                        <div class="space-y-3">
                            <div class="p-3 bg-blue-50/50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-800/60">
                                <div class="flex items-center justify-between text-[11px] font-mono text-blue-600 dark:text-blue-400 mb-1">
                                    <span>08:00 - 10:30 AM</span>
                                    <span>Room Lab-302</span>
                                </div>
                                <h4 class="text-xs font-bold text-neutral-900 dark:text-white">Cloud & Distributed Systems</h4>
                                <p class="text-[11px] text-neutral-500 dark:text-neutral-400">Dr. Sarah Connor • Building B3</p>
                            </div>

                            <div class="p-3 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-xl border border-indigo-200 dark:border-indigo-800/60">
                                <div class="flex items-center justify-between text-[11px] font-mono text-indigo-600 dark:text-indigo-400 mb-1">
                                    <span>01:00 - 03:30 PM</span>
                                    <span>Auditorium A</span>
                                </div>
                                <h4 class="text-xs font-bold text-neutral-900 dark:text-white">AI & LLM Architecture</h4>
                                <p class="text-[11px] text-neutral-500 dark:text-neutral-400">Prof. John von Neumann • Main Tower</p>
                            </div>
                        </div>

                        <div class="pt-2 border-t border-neutral-200 dark:border-neutral-700">
                            <A 
                                href="/academic/survey/reference/bundle-category" 
                                class="w-full py-2 px-3 bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 text-xs font-semibold rounded-xl text-center block text-neutral-700 dark:text-neutral-200 transition-colors"
                            >
                                Fill Lecturer Evaluation Survey
                            </A>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
