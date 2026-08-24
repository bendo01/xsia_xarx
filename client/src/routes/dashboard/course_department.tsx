import { onMount, For } from 'solid-js';
import { A } from '@solidjs/router';
import TopBar from '../../components/navigation/TopBar';
import { currentUserSignal, refreshAuthState } from '../../lib/authStore';

export default function CourseDepartmentDashboard() {
    onMount(() => {
        refreshAuthState();
    });

    const userName = () => currentUserSignal()?.name || "Department Chair";

    return (
        <div class="min-h-screen bg-neutral-50 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 flex flex-col">
            <TopBar />

            <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* Header Banner */}
                <div class="bg-gradient-to-r from-teal-900 via-emerald-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-teal-500/20">
                    <div class="absolute -right-10 -bottom-10 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
                    <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/30 text-teal-300 text-xs font-semibold uppercase tracking-wider font-mono mb-3">
                                <span class="size-2 rounded-full bg-teal-400 animate-pulse"></span>
                                Course & Department Administration
                            </div>
                            <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight">
                                Department Portal: {userName()}
                            </h1>
                            <p class="text-white/70 text-sm mt-1 max-w-2xl">
                                Manage departmental curricula, course groups, teaching encounter schedules, faculty assignments, and thesis evaluations.
                            </p>
                        </div>

                        <div class="flex flex-wrap items-center gap-3">
                            <A 
                                href="/academic/course/reference/curriculum-type" 
                                class="px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold tracking-wider uppercase transition-all shadow-md hover:shadow-teal-500/25 flex items-center gap-2"
                            >
                                <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                                </svg>
                                Manage Curricula
                            </A>
                            <A 
                                href="/academic/campaign/reference/encounter-category" 
                                class="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/15 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2"
                            >
                                <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
                                    <line x1="16" x2="16" y1="2" y2="6"/>
                                    <line x1="8" x2="8" y1="2" y2="6"/>
                                    <line x1="3" x2="21" y1="10" y2="10"/>
                                </svg>
                                Class Schedule
                            </A>
                        </div>
                    </div>
                </div>

                {/* Department KPI Stats */}
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    <div class="p-5 bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-2xs">
                        <div class="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs font-medium">
                            <span>Active Courses Offered</span>
                            <div class="p-2 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
                                <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/></svg>
                            </div>
                        </div>
                        <div class="mt-3 flex items-baseline gap-2">
                            <span class="text-2xl font-black tracking-tight text-neutral-900 dark:text-white">64</span>
                            <span class="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Semester 1 & 2</span>
                        </div>
                        <p class="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">182 Credit Units (SKS)</p>
                    </div>

                    <div class="p-5 bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-2xs">
                        <div class="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs font-medium">
                            <span>Department Lecturers</span>
                            <div class="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                                <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                            </div>
                        </div>
                        <div class="mt-3 flex items-baseline gap-2">
                            <span class="text-2xl font-black tracking-tight text-neutral-900 dark:text-white">28</span>
                            <span class="text-xs font-semibold text-blue-600 dark:text-blue-400">100% Assigned</span>
                        </div>
                        <p class="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">Average 12 SKS / lecturer</p>
                    </div>

                    <div class="p-5 bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-2xs">
                        <div class="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs font-medium">
                            <span>Department Students</span>
                            <div class="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                                <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/></svg>
                            </div>
                        </div>
                        <div class="mt-3 flex items-baseline gap-2">
                            <span class="text-2xl font-black tracking-tight text-neutral-900 dark:text-white">1,120</span>
                            <span class="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Active</span>
                        </div>
                        <p class="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">Cohort 2023 - 2026</p>
                    </div>

                    <div class="p-5 bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-2xs">
                        <div class="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs font-medium">
                            <span>Pending Thesis Reviews</span>
                            <div class="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                                <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/></svg>
                            </div>
                        </div>
                        <div class="mt-3 flex items-baseline gap-2">
                            <span class="text-2xl font-black tracking-tight text-purple-600 dark:text-purple-400">14</span>
                            <span class="text-xs font-semibold text-amber-600 dark:text-amber-400">Needs Action</span>
                        </div>
                        <p class="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">Proposal & Final Defense</p>
                    </div>
                </div>

                {/* Course Offering Schedule & Final Assignment Table */}
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div class="lg:col-span-2 bg-white dark:bg-neutral-800 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-700 shadow-sm">
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="text-sm font-bold text-neutral-900 dark:text-white">
                                Course Class Encounters (Current Term)
                            </h3>
                            <A href="/academic/course/reference/group" class="text-xs text-teal-600 dark:text-teal-400 font-semibold hover:underline">
                                View all courses →
                            </A>
                        </div>

                        <div class="overflow-x-auto">
                            <table class="w-full text-xs text-left">
                                <thead class="text-[11px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500 bg-neutral-50 dark:bg-neutral-900/50 font-mono">
                                    <tr>
                                        <th class="py-2.5 px-3">Code & Course</th>
                                        <th class="py-2.5 px-3">SKS</th>
                                        <th class="py-2.5 px-3">Lecturer</th>
                                        <th class="py-2.5 px-3">Enrolled</th>
                                        <th class="py-2.5 px-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-neutral-200 dark:divide-neutral-700">
                                    <tr>
                                        <td class="py-3 px-3 font-semibold text-neutral-900 dark:text-white">CS301 - Distributed Systems</td>
                                        <td class="py-3 px-3 font-mono">3</td>
                                        <td class="py-3 px-3 text-neutral-600 dark:text-neutral-300">Dr. Sarah Connor</td>
                                        <td class="py-3 px-3 font-mono">38 / 40</td>
                                        <td class="py-3 px-3"><span class="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold text-[10px]">Open</span></td>
                                    </tr>
                                    <tr>
                                        <td class="py-3 px-3 font-semibold text-neutral-900 dark:text-white">CS204 - Database Architecture</td>
                                        <td class="py-3 px-3 font-mono">4</td>
                                        <td class="py-3 px-3 text-neutral-600 dark:text-neutral-300">Prof. Alan Turing</td>
                                        <td class="py-3 px-3 font-mono">40 / 40</td>
                                        <td class="py-3 px-3"><span class="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-semibold text-[10px]">Full</span></td>
                                    </tr>
                                    <tr>
                                        <td class="py-3 px-3 font-semibold text-neutral-900 dark:text-white">CS402 - Machine Learning Systems</td>
                                        <td class="py-3 px-3 font-mono">3</td>
                                        <td class="py-3 px-3 text-neutral-600 dark:text-neutral-300">Dr. Ada Lovelace</td>
                                        <td class="py-3 px-3 font-mono">34 / 35</td>
                                        <td class="py-3 px-3"><span class="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold text-[10px]">Open</span></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Quick Management Links */}
                    <div class="bg-white dark:bg-neutral-800 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-700 shadow-sm space-y-4">
                        <h3 class="text-sm font-bold text-neutral-900 dark:text-white">
                            Department Quick Actions
                        </h3>

                        <div class="space-y-2">
                            <A href="/academic/student/final_assignment/reference/category" class="p-3 bg-neutral-50 dark:bg-neutral-900/60 rounded-xl border border-neutral-200/80 dark:border-neutral-700/80 hover:border-teal-500 transition-all flex items-center justify-between group">
                                <div class="flex items-center gap-2.5">
                                    <div class="p-2 rounded-lg bg-teal-100 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400 group-hover:scale-105 transition-transform">
                                        <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/></svg>
                                    </div>
                                    <span class="text-xs font-semibold text-neutral-800 dark:text-neutral-200">Thesis Approvals</span>
                                </div>
                                <span class="text-xs text-neutral-400">→</span>
                            </A>

                            <A href="/academic/course/reference/evaluation-type" class="p-3 bg-neutral-50 dark:bg-neutral-900/60 rounded-xl border border-neutral-200/80 dark:border-neutral-700/80 hover:border-emerald-500 transition-all flex items-center justify-between group">
                                <div class="flex items-center gap-2.5">
                                    <div class="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
                                        <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 12 2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>
                                    </div>
                                    <span class="text-xs font-semibold text-neutral-800 dark:text-neutral-200">Grading Scheme</span>
                                </div>
                                <span class="text-xs text-neutral-400">→</span>
                            </A>

                            <A href="/academic/lecturer/reference/rank" class="p-3 bg-neutral-50 dark:bg-neutral-900/60 rounded-xl border border-neutral-200/80 dark:border-neutral-700/80 hover:border-blue-500 transition-all flex items-center justify-between group">
                                <div class="flex items-center gap-2.5">
                                    <div class="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform">
                                        <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                                    </div>
                                    <span class="text-xs font-semibold text-neutral-800 dark:text-neutral-200">Faculty Ranks</span>
                                </div>
                                <span class="text-xs text-neutral-400">→</span>
                            </A>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
