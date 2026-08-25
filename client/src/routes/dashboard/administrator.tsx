import { onMount, createSignal, Show, For } from 'solid-js';
import { A } from '@solidjs/router';
import TopBar from '../../components/navigation/TopBar';
import { currentUserSignal, refreshAuthState, userRolesSignal } from '../../lib/authStore';

export default function AdministratorDashboard() {
    onMount(() => {
        refreshAuthState();
    });

    const userName = () => currentUserSignal()?.name || "Administrator";

    return (
        <div class="min-h-screen bg-neutral-50 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 flex flex-col">
            <TopBar />

            <main class="flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* Header Banner */}
                <div class="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-blue-500/20">
                    <div class="absolute -right-10 -bottom-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
                    <div class="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold uppercase tracking-wider font-mono mb-3">
                                <span class="size-2 rounded-full bg-blue-400 animate-pulse"></span>
                                Administrator Control Center
                            </div>
                            <h1 class="text-2xl sm:text-3xl font-extrabold tracking-tight">
                                Welcome, {userName()}!
                            </h1>
                            <p class="text-white/70 text-sm mt-1 max-w-2xl">
                                Full system control overview: monitor multi-tenant roles, institutional structures, academic curricula, and security records.
                            </p>
                        </div>

                        <div class="flex flex-wrap items-center gap-3">
                            <A
                                href="/person/master/individual/create"
                                class="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold tracking-wider uppercase transition-all shadow-md hover:shadow-blue-500/25 flex items-center gap-2"
                            >
                                <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                    <circle cx="9" cy="7" r="4" />
                                    <line x1="19" x2="19" y1="8" y2="14" />
                                    <line x1="22" x2="16" y1="11" y2="11" />
                                </svg>
                                Add Individual
                            </A>
                            <A
                                href="/academic/general/reference/academic-year"
                                class="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/15 rounded-xl text-xs font-semibold transition-colors flex items-center gap-2"
                            >
                                <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                                    <line x1="16" x2="16" y1="2" y2="6" />
                                    <line x1="8" x2="8" y1="2" y2="6" />
                                    <line x1="3" x2="21" y1="10" y2="10" />
                                </svg>
                                Academic Calendar
                            </A>
                        </div>
                    </div>
                </div>

                {/* Key Statistics Grid */}
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    <div class="p-5 bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-2xs">
                        <div class="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs font-medium">
                            <span>Total Users & Staff</span>
                            <div class="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                                <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                            </div>
                        </div>
                        <div class="mt-3 flex items-baseline gap-2">
                            <span class="text-2xl font-black tracking-tight text-neutral-900 dark:text-white">1,428</span>
                            <span class="text-xs font-semibold text-emerald-600 dark:text-emerald-400">+12%</span>
                        </div>
                        <p class="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">Across 8 departments</p>
                    </div>

                    <div class="p-5 bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-2xs">
                        <div class="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs font-medium">
                            <span>Active Students</span>
                            <div class="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                                <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg>
                            </div>
                        </div>
                        <div class="mt-3 flex items-baseline gap-2">
                            <span class="text-2xl font-black tracking-tight text-neutral-900 dark:text-white">8,950</span>
                            <span class="text-xs font-semibold text-emerald-600 dark:text-emerald-400">+5.4%</span>
                        </div>
                        <p class="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">Enrolled in 2026/2027</p>
                    </div>

                    <div class="p-5 bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-2xs">
                        <div class="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs font-medium">
                            <span>Curricula & Courses</span>
                            <div class="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                                <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" /><path d="M6 6h10M6 10h10M6 14h6" /></svg>
                            </div>
                        </div>
                        <div class="mt-3 flex items-baseline gap-2">
                            <span class="text-2xl font-black tracking-tight text-neutral-900 dark:text-white">412</span>
                            <span class="text-xs font-semibold text-blue-600 dark:text-blue-400">Active</span>
                        </div>
                        <p class="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">42 Study programs</p>
                    </div>

                    <div class="p-5 bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-2xs">
                        <div class="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-xs font-medium">
                            <span>System Status</span>
                            <div class="p-2 rounded-lg bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
                                <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                            </div>
                        </div>
                        <div class="mt-3 flex items-baseline gap-2">
                            <span class="text-2xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">Optimal</span>
                            <span class="text-xs font-semibold text-emerald-600 dark:text-emerald-400">99.9%</span>
                        </div>
                        <p class="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1">Salvo + Apalis workers OK</p>
                    </div>
                </div>

                {/* Quick Master Data Shortcuts */}
                <div class="bg-white dark:bg-neutral-800 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-700 shadow-sm space-y-4">
                    <div class="flex items-center justify-between">
                        <h2 class="text-base font-bold text-neutral-900 dark:text-white">
                            Quick Master Reference Portals
                        </h2>
                        <span class="text-xs text-neutral-500 dark:text-neutral-400">Direct management shortcuts</span>
                    </div>

                    <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                        <A href="/academic/general/reference/academic-year" class="p-3 bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-700/80 rounded-xl hover:border-blue-500 hover:shadow-xs transition-all text-center flex flex-col items-center gap-2 group">
                            <div class="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                                <svg class="size-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></svg>
                            </div>
                            <span class="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Academic Year</span>
                        </A>

                        <A href="/institution/master/institution" class="p-3 bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-700/80 rounded-xl hover:border-emerald-500 hover:shadow-xs transition-all text-center flex flex-col items-center gap-2 group">
                            <div class="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                                <svg class="size-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="16" height="20" x="4" y="2" rx="2" ry="2" /><path d="M9 22v-4h6v4" /></svg>
                            </div>
                            <span class="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Institutions</span>
                        </A>

                        <A href="/person/master/individual" class="p-3 bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-700/80 rounded-xl hover:border-amber-500 hover:shadow-xs transition-all text-center flex flex-col items-center gap-2 group">
                            <div class="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
                                <svg class="size-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>
                            </div>
                            <span class="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Individuals</span>
                        </A>

                        <A href="/academic/course/reference/curriculum-type" class="p-3 bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-700/80 rounded-xl hover:border-purple-500 hover:shadow-xs transition-all text-center flex flex-col items-center gap-2 group">
                            <div class="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
                                <svg class="size-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" /></svg>
                            </div>
                            <span class="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Curricula</span>
                        </A>

                        <A href="/building/reference/room-type" class="p-3 bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-700/80 rounded-xl hover:border-cyan-500 hover:shadow-xs transition-all text-center flex flex-col items-center gap-2 group">
                            <div class="p-2 rounded-lg bg-cyan-100 dark:bg-cyan-900/40 text-cyan-600 dark:text-cyan-400 group-hover:scale-110 transition-transform">
                                <svg class="size-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18" /><path d="M5 21V7l8-4v18" /></svg>
                            </div>
                            <span class="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Room Types</span>
                        </A>

                        <A href="/academic/candidate/reference/phase" class="p-3 bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-700/80 rounded-xl hover:border-rose-500 hover:shadow-xs transition-all text-center flex flex-col items-center gap-2 group">
                            <div class="p-2 rounded-lg bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform">
                                <svg class="size-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                            </div>
                            <span class="text-xs font-semibold text-neutral-700 dark:text-neutral-300">PMB Phases</span>
                        </A>
                    </div>
                </div>

                {/* System Activity & Active Roles */}
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* User's Available Roles */}
                    <div class="bg-white dark:bg-neutral-800 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-700 shadow-sm">
                        <h3 class="text-sm font-bold text-neutral-900 dark:text-white mb-1">
                            Your Assigned Roles
                        </h3>
                        <p class="text-xs text-neutral-500 dark:text-neutral-400 mb-4">
                            You have permission to access multiple workspaces:
                        </p>

                        <div class="space-y-2">
                            <For each={userRolesSignal()}>
                                {(role) => (
                                    <div class="p-3 bg-neutral-50 dark:bg-neutral-900/60 rounded-xl border border-neutral-200/70 dark:border-neutral-700/70 flex items-center justify-between">
                                        <div class="flex items-center gap-2.5">
                                            <span class="size-2 rounded-full bg-blue-500"></span>
                                            <span class="text-xs font-semibold text-neutral-800 dark:text-neutral-200 capitalize">
                                                {role.name.replace(/_/g, ' ')}
                                            </span>
                                        </div>
                                        <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300">
                                            Active
                                        </span>
                                    </div>
                                )}
                            </For>
                        </div>
                    </div>

                    {/* System Log Feed */}
                    <div class="lg:col-span-2 bg-white dark:bg-neutral-800 rounded-2xl p-6 border border-neutral-200 dark:border-neutral-700 shadow-sm">
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="text-sm font-bold text-neutral-900 dark:text-white">
                                Recent System Transactions
                            </h3>
                            <span class="text-xs text-blue-600 dark:text-blue-400 font-medium">Realtime Feed</span>
                        </div>

                        <div class="overflow-x-auto">
                            <table class="w-full text-xs text-left">
                                <thead class="text-[11px] uppercase tracking-wider text-neutral-400 dark:text-neutral-500 bg-neutral-50 dark:bg-neutral-900/50 font-mono">
                                    <tr>
                                        <th class="py-2.5 px-3">Event</th>
                                        <th class="py-2.5 px-3">Module</th>
                                        <th class="py-2.5 px-3">Status</th>
                                        <th class="py-2.5 px-3">Timestamp</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-neutral-200 dark:divide-neutral-700">
                                    <tr>
                                        <td class="py-3 px-3 font-medium text-neutral-900 dark:text-white">Academic Year 2026/2027 Activated</td>
                                        <td class="py-3 px-3 text-neutral-500">Academic General</td>
                                        <td class="py-3 px-3"><span class="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold text-[10px]">Success</span></td>
                                        <td class="py-3 px-3 text-neutral-400 font-mono text-[11px]">Just now</td>
                                    </tr>
                                    <tr>
                                        <td class="py-3 px-3 font-medium text-neutral-900 dark:text-white">Individual Biodata Sync Completed</td>
                                        <td class="py-3 px-3 text-neutral-500">Person Registry</td>
                                        <td class="py-3 px-3"><span class="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-semibold text-[10px]">Success</span></td>
                                        <td class="py-3 px-3 text-neutral-400 font-mono text-[11px]">10 min ago</td>
                                    </tr>
                                    <tr>
                                        <td class="py-3 px-3 font-medium text-neutral-900 dark:text-white">Feeder PDDikti Sync Routine</td>
                                        <td class="py-3 px-3 text-neutral-500">Feeder Sync</td>
                                        <td class="py-3 px-3"><span class="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-semibold text-[10px]">Synced</span></td>
                                        <td class="py-3 px-3 text-neutral-400 font-mono text-[11px]">1 hour ago</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
