import { onMount, Show } from 'solid-js';
import { A } from '@solidjs/router';
import TopBar from '../components/navigation/TopBar';
import {
    isAuthenticatedSignal,
    activeRoleSignal,
    getRoleDisplayName,
    getDashboardPathForRole,
    currentUserSignal,
    refreshAuthState
} from '../lib/authStore';

export default function Home() {
    onMount(() => {
        refreshAuthState();
    });

    const activeRole = () => activeRoleSignal();
    const dashboardPath = () => getDashboardPathForRole(activeRole());
    const roleDisplayName = () => getRoleDisplayName(activeRole());
    const userName = () => currentUserSignal()?.name || "User";

    return (
        <div class="min-h-screen bg-neutral-50 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 flex flex-col">
            <TopBar />

            <main class="flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
                {/* Hero Section */}
                <div class="bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-8 sm:p-12 text-white shadow-2xl relative overflow-hidden border border-blue-500/20">
                    <div class="absolute -right-20 -bottom-20 w-96 h-96 bg-blue-500/15 rounded-full blur-3xl pointer-events-none"></div>
                    <div class="relative z-10 max-w-3xl space-y-4">
                        <div class="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold uppercase tracking-wider font-mono">
                            <span class="size-2 rounded-full bg-blue-400 animate-pulse"></span>
                            XSIA XARX Unified Academic & Institutional Platform
                        </div>

                        <h1 class="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
                            High-Performance Academic Enterprise Management
                        </h1>

                        <p class="text-white/80 text-sm sm:text-base leading-relaxed">
                            Built with Rust (Salvo + SeaORM) engine and reactive SolidJS. Unified management for administrators, departments, lecturers, students, and admission candidates.
                        </p>

                        <div class="pt-4 flex flex-wrap items-center gap-4">
                            <Show when={isAuthenticatedSignal()} fallback={
                                <>
                                    <A
                                        href="/administrator/authentification/login"
                                        class="px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold tracking-wider uppercase transition-all shadow-lg hover:shadow-blue-500/30 flex items-center gap-2"
                                    >
                                        Standard Sign In (JWT)
                                        <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                                    </A>
                                    <A
                                        href="/administrator/authentification/login_with_session"
                                        class="px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold tracking-wider uppercase transition-all shadow-lg hover:shadow-emerald-500/30 flex items-center gap-2"
                                    >
                                        Session Sign In
                                        <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                                    </A>
                                </>
                            }>
                                <A
                                    href={dashboardPath()}
                                    class="px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold tracking-wider uppercase transition-all shadow-lg hover:shadow-blue-500/30 flex items-center gap-2"
                                >
                                    Open {roleDisplayName()} Dashboard ({userName()})
                                    <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                                </A>
                                <A
                                    href="/dashboard/user"
                                    class="px-5 py-3.5 bg-white/10 hover:bg-white/20 text-white border border-white/15 rounded-xl text-xs font-semibold transition-colors"
                                >
                                    Manage User Roles
                                </A>
                            </Show>
                        </div>
                    </div>
                </div>

                {/* Role Workspace Portals Grid */}
                <div class="space-y-4">
                    <div class="flex items-center justify-between">
                        <h2 class="text-lg font-bold text-neutral-900 dark:text-white">
                            Role-Tailored Workspaces
                        </h2>
                        <span class="text-xs text-neutral-500 dark:text-neutral-400 font-mono">
                            Multi-Role RBAC
                        </span>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        {/* Admin */}
                        <div class="p-6 bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-2xs flex flex-col justify-between gap-4">
                            <div class="space-y-2">
                                <div class="size-10 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                                    <svg class="size-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="9" x="3" y="3" rx="1" /><rect width="7" height="5" x="14" y="3" rx="1" /><rect width="7" height="9" x="14" y="12" rx="1" /><rect width="7" height="5" x="3" y="16" rx="1" /></svg>
                                </div>
                                <h3 class="text-base font-bold text-neutral-900 dark:text-white">Administrator</h3>
                                <p class="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                                    Master institutional records, person registries, campus infrastructure, and security permissions.
                                </p>
                            </div>
                            <A href="/dashboard/administrator" class="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                                Launch Dashboard →
                            </A>
                        </div>

                        {/* Course Dept */}
                        <div class="p-6 bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-2xs flex flex-col justify-between gap-4">
                            <div class="space-y-2">
                                <div class="size-10 rounded-xl bg-teal-100 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
                                    <svg class="size-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" /><path d="M6 6h10M6 10h10M6 14h6" /></svg>
                                </div>
                                <h3 class="text-base font-bold text-neutral-900 dark:text-white">Course & Department</h3>
                                <p class="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                                    Curriculum planning, course offerings, class encounters, lecturer workloads, and thesis reviews.
                                </p>
                            </div>
                            <A href="/dashboard/course_department" class="text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1">
                                Launch Dashboard →
                            </A>
                        </div>

                        {/* Student */}
                        <div class="p-6 bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-2xs flex flex-col justify-between gap-4">
                            <div class="space-y-2">
                                <div class="size-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                                    <svg class="size-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z" /><path d="M6 12v5c3 3 9 3 12 0v-5" /></svg>
                                </div>
                                <h3 class="text-base font-bold text-neutral-900 dark:text-white">Student Portal</h3>
                                <p class="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                                    Study plan cards (KRS), grades & transcripts (KHS), timetable, attendance, and thesis stages.
                                </p>
                            </div>
                            <A href="/dashboard/student" class="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
                                Launch Dashboard →
                            </A>
                        </div>

                        {/* Candidate */}
                        <div class="p-6 bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 shadow-2xs flex flex-col justify-between gap-4">
                            <div class="space-y-2">
                                <div class="size-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                                    <svg class="size-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M19 8v6M22 11h-6" /></svg>
                                </div>
                                <h3 class="text-base font-bold text-neutral-900 dark:text-white">Candidate / PMB</h3>
                                <p class="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                                    Admission timeline, document verification, CBT selection test card, and fee invoices.
                                </p>
                            </div>
                            <A href="/dashboard/candidate" class="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1">
                                Launch Dashboard →
                            </A>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
