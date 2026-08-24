import { onMount } from 'solid-js';
import { A } from '@solidjs/router';
import TopBar from '../../components/navigation/TopBar';
import { currentUserSignal, refreshAuthState } from '../../lib/authStore';

export default function RectoratDashboard() {
    onMount(() => {
        refreshAuthState();
    });

    const userName = () => currentUserSignal()?.name || "Prof. Dr. Elizabeth Blackwell";

    return (
        <div class="min-h-screen bg-neutral-50 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 flex flex-col">
            <TopBar />

            <main class="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* Header Banner */}
                <div class="bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-purple-500/20">
                    <div class="absolute -right-10 -bottom-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>
                    <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-300 text-xs font-semibold uppercase tracking-wider font-mono mb-3">
                                <span class="size-2 rounded-full bg-purple-400 animate-pulse"></span>
                                Rectorat & Executive Governance
                            </div>
                            <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight">
                                University Executive Dashboard
                            </h1>
                            <p class="text-white/70 text-sm mt-1 max-w-2xl">
                                Welcome, {userName()}. High-level institutional metrics, accreditation health, university-wide admissions, and strategic academic quality indicators.
                            </p>
                        </div>

                        <div class="flex flex-wrap items-center gap-3">
                            <A 
                                href="/institution/master/institution" 
                                class="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold tracking-wider uppercase transition-all shadow-md hover:shadow-purple-500/25 flex items-center gap-2"
                            >
                                <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <rect width="16" height="20" x="4" y="2" rx="2" ry="2"/>
                                    <path d="M9 22v-4h6v4"/>
                                </svg>
                                Institution Governance
                            </A>
                        </div>
                    </div>
                </div>

                {/* Strategic KPIs Grid */}
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    <div class="p-5 bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-2xs">
                        <div class="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs font-medium">
                            <span>Total University Students</span>
                            <div class="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                                <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/></svg>
                            </div>
                        </div>
                        <div class="mt-3 flex items-baseline gap-2">
                            <span class="text-3xl font-black tracking-tight text-neutral-900 dark:text-white">18,450</span>
                            <span class="text-xs font-semibold text-emerald-600 dark:text-emerald-400">+8.2%</span>
                        </div>
                        <p class="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">Across 6 Faculties</p>
                    </div>

                    <div class="p-5 bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-2xs">
                        <div class="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs font-medium">
                            <span>Accreditation Rate (Unggul/A)</span>
                            <div class="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                                <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
                            </div>
                        </div>
                        <div class="mt-3 flex items-baseline gap-2">
                            <span class="text-3xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">89.4%</span>
                        </div>
                        <p class="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">38 of 42 study programs</p>
                    </div>

                    <div class="p-5 bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-2xs">
                        <div class="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs font-medium">
                            <span>Faculty Doctoral Ratio</span>
                            <div class="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                                <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                            </div>
                        </div>
                        <div class="mt-3 flex items-baseline gap-2">
                            <span class="text-3xl font-black tracking-tight text-neutral-900 dark:text-white">67.8%</span>
                        </div>
                        <p class="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">542 PhD & Professor degrees</p>
                    </div>

                    <div class="p-5 bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-2xs">
                        <div class="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs font-medium">
                            <span>Research Citations</span>
                            <div class="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
                                <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
                            </div>
                        </div>
                        <div class="mt-3 flex items-baseline gap-2">
                            <span class="text-3xl font-black tracking-tight text-neutral-900 dark:text-white">4,210</span>
                            <span class="text-xs font-semibold text-emerald-600 dark:text-emerald-400">+19%</span>
                        </div>
                        <p class="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">Scopus & Sinta publications</p>
                    </div>
                </div>

                {/* Faculty Breakdown Table */}
                <div class="bg-white dark:bg-neutral-800 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-700 shadow-sm space-y-4">
                    <div class="flex items-center justify-between">
                        <h3 class="text-sm font-bold text-neutral-900 dark:text-white">
                            Faculty Performance & Enrollment Breakdown
                        </h3>
                        <span class="text-xs text-purple-600 dark:text-purple-400 font-semibold font-mono">
                            Academic Year 2026/2027
                        </span>
                    </div>

                    <div class="overflow-x-auto">
                        <table class="w-full text-xs text-left">
                            <thead class="text-[11px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500 bg-neutral-50 dark:bg-neutral-900/50 font-mono">
                                <tr>
                                    <th class="py-2.5 px-3">Faculty</th>
                                    <th class="py-2.5 px-3">Dean</th>
                                    <th class="py-2.5 px-3">Departments</th>
                                    <th class="py-2.5 px-3">Students</th>
                                    <th class="py-2.5 px-3">Accreditation</th>
                                    <th class="py-2.5 px-3">Budget Execution</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-neutral-200 dark:divide-neutral-700">
                                <tr>
                                    <td class="py-3 px-3 font-semibold text-neutral-900 dark:text-white">Faculty of Computer Science & Engineering</td>
                                    <td class="py-3 px-3 text-neutral-600 dark:text-neutral-300">Prof. Grace Hopper</td>
                                    <td class="py-3 px-3 font-mono">8 Programs</td>
                                    <td class="py-3 px-3 font-mono font-bold">4,820</td>
                                    <td class="py-3 px-3"><span class="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">Unggul</span></td>
                                    <td class="py-3 px-3 font-mono text-emerald-600 dark:text-emerald-400 font-semibold">94.2%</td>
                                </tr>
                                <tr>
                                    <td class="py-3 px-3 font-semibold text-neutral-900 dark:text-white">Faculty of Economics & Business</td>
                                    <td class="py-3 px-3 text-neutral-600 dark:text-neutral-300">Prof. Milton Friedman</td>
                                    <td class="py-3 px-3 font-mono">7 Programs</td>
                                    <td class="py-3 px-3 font-mono font-bold">3,950</td>
                                    <td class="py-3 px-3"><span class="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">Unggul</span></td>
                                    <td class="py-3 px-3 font-mono text-emerald-600 dark:text-emerald-400 font-semibold">91.8%</td>
                                </tr>
                                <tr>
                                    <td class="py-3 px-3 font-semibold text-neutral-900 dark:text-white">Faculty of Medicine & Health Sciences</td>
                                    <td class="py-3 px-3 text-neutral-600 dark:text-neutral-300">Prof. Jonas Salk</td>
                                    <td class="py-3 px-3 font-mono">6 Programs</td>
                                    <td class="py-3 px-3 font-mono font-bold">2,410</td>
                                    <td class="py-3 px-3"><span class="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">Unggul</span></td>
                                    <td class="py-3 px-3 font-mono text-emerald-600 dark:text-emerald-400 font-semibold">97.0%</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </div>
    );
}
