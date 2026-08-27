import { onMount, Show, For } from 'solid-js';
import { useNavigate, A } from '@solidjs/router';
import DynamicMenu from '../menu/index';
import { 
    currentUserSignal, 
    activeRoleSignal, 
    userRolesSignal, 
    isAuthenticatedSignal, 
    activeStudentCodeSignal,
    logout, 
    setActiveRole, 
    getRoleDisplayName, 
    getDashboardPathForRole, 
    refreshAuthState,
    normalizeRoleName
} from '../../lib/authStore';
import { toast } from '../toast/Toaster';

export default function TopBar() {
    const navigate = useNavigate();

    onMount(() => {
        refreshAuthState();
    });

    const toggleDarkMode = () => {
        if (typeof document === 'undefined') return;
        if (document.documentElement.classList.contains('dark')) {
            document.documentElement.classList.remove('dark');
            localStorage.theme = 'light';
        } else {
            document.documentElement.classList.add('dark');
            localStorage.theme = 'dark';
        }
    };

    const handleSignOut = () => {
        logout();
        toast.info("You have been signed out.");
        navigate('/authentification/login', { replace: true });
    };

    const handleRoleSwitch = (roleName: string) => {
        if (normalizeRoleName(roleName) === activeRoleSignal()) return;
        setActiveRole(roleName);
        toast.success(`Role switched to ${getRoleDisplayName(roleName)}`);
        navigate(getDashboardPathForRole(roleName));
    };

    const userName = () => currentUserSignal()?.name || "User Account";
    const userEmail = () => currentUserSignal()?.email || "user@example.com";
    const activeRoleDisplay = () => getRoleDisplayName(activeRoleSignal());

    return (
        <header class="sticky top-0 z-10 flex flex-wrap sm:justify-start sm:flex-nowrap w-full py-2.5 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-md border-b border-neutral-200 dark:border-neutral-700 shadow-2xs">
            <nav class="w-full mx-auto px-4 flex items-center justify-between">
                <div class="flex w-full items-center justify-between">
                    {/* Brand / Logo */}
                    <div class="flex items-center gap-3">
                        <A class="flex items-center gap-2 text-lg font-bold tracking-tight text-neutral-900 dark:text-white focus:outline-hidden" href={isAuthenticatedSignal() ? getDashboardPathForRole(activeRoleSignal()) : "/"} aria-label="Brand">
                            <div class="size-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm font-black text-sm">
                                X
                            </div>
                            <div class="flex flex-col">
                                <span class="leading-none text-sm font-extrabold tracking-wide">XSIA XARX</span>
                                <span class="leading-none text-[10px] text-neutral-500 dark:text-neutral-400 font-mono">Enterprise Portal</span>
                            </div>
                        </A>

                        {/* Active Role Tag (if authenticated) */}
                        <Show when={isAuthenticatedSignal()}>
                            <div class="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800/80">
                                <span class="size-1.5 rounded-full bg-blue-500"></span>
                                <span>{activeRoleDisplay()}</span>
                                <Show when={activeRoleSignal() === 'student' && activeStudentCodeSignal()}>
                                    <span class="text-blue-500 dark:text-blue-400 font-mono">({activeStudentCodeSignal()})</span>
                                </Show>
                            </div>
                        </Show>
                    </div>

                    {/* Action Tools & Menu Button */}
                    <div class="flex items-center gap-2">
                        {/* Theme Toggle */}
                        <button 
                            onClick={toggleDarkMode} 
                            type="button" 
                            class="relative size-9 flex justify-center items-center rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 focus:outline-hidden transition-colors" 
                            aria-label="Toggle dark mode"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0 size-4 hidden dark:block"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0 size-4 block dark:hidden"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
                        </button>

                        {/* Events Popover */}
                        <button 
                            popovertarget="events-popover" 
                            type="button" 
                            class="relative size-9 flex justify-center items-center rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 focus:outline-hidden transition-colors" 
                            aria-label="Show events"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="shrink-0 size-4">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                            </svg>
                        </button>
                        <div id="events-popover" popover="auto" class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 shadow-xl rounded-xl p-4 w-72 m-0 text-neutral-800 dark:text-neutral-100 top-[3.5rem] right-4 inset-auto">
                            <h3 class="font-semibold text-xs uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-mono mb-2">System Activity</h3>
                            <ul class="text-xs text-neutral-600 dark:text-neutral-300 space-y-2">
                                <li class="p-2 bg-neutral-50 dark:bg-neutral-800 rounded-lg flex items-center gap-2">
                                    <span class="size-2 rounded-full bg-emerald-500"></span>
                                    <span>Realtime gateway active</span>
                                </li>
                                <li class="p-2 bg-neutral-50 dark:bg-neutral-800 rounded-lg flex items-center gap-2">
                                    <span class="size-2 rounded-full bg-blue-500"></span>
                                    <span>Academic session synced</span>
                                </li>
                            </ul>
                        </div>

                        {/* Sidebar Menu Button */}
                        <button 
                            popovertarget="sidebar-popover" 
                            popovertargetaction="toggle" 
                            type="button" 
                            class="relative size-9 flex justify-center items-center rounded-lg bg-blue-600 text-white hover:bg-blue-700 focus:outline-hidden transition-colors shadow-xs"
                            aria-label="Toggle navigation menu"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" class="shrink-0 size-4">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                            </svg>
                        </button>
                    </div>
                </div>
            </nav>

            {/* Sidebar Popover Drawer */}
            <aside 
                id="sidebar-popover" 
                popover="auto" 
                class="fixed top-0 right-0 left-auto h-full w-96 max-w-[90vw] m-0 z-20 bg-white dark:bg-neutral-900 border-l border-neutral-200 dark:border-neutral-700 shadow-2xl p-5 text-neutral-800 dark:text-neutral-100 backdrop:bg-black/50 backdrop:backdrop-blur-sm"
            >
                <div class="flex flex-col h-full">
                    {/* Header */}
                    <div class="flex justify-between items-center pb-4 mb-4 border-b border-neutral-200 dark:border-neutral-800 shrink-0">
                        <div class="flex items-center gap-2.5">
                            <div class="size-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                                X
                            </div>
                            <div>
                                <h2 class="text-sm font-bold text-neutral-900 dark:text-white leading-tight">Workspace Menu</h2>
                                <p class="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono">
                                    {isAuthenticatedSignal() ? `${activeRoleDisplay()} Mode` : 'Guest Mode'}
                                </p>
                            </div>
                        </div>
                        <button 
                            popovertarget="sidebar-popover" 
                            popovertargetaction="hide" 
                            class="p-1.5 text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors" 
                            aria-label="Close sidebar"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                        </button>
                    </div>

                    {/* Navigation Body */}
                    <nav class="flex-1 overflow-y-auto pr-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-neutral-300 dark:[&::-webkit-scrollbar-thumb]:bg-neutral-700">
                        <DynamicMenu />
                    </nav>

                    {/* Footer / Account Dropdown */}
                    <footer class="mt-auto shrink-0 pt-4 border-t border-neutral-200 dark:border-neutral-800">
                        <Show when={isAuthenticatedSignal()} fallback={
                            <div class="flex flex-col gap-2">
                                <A 
                                    href="/authentification/login" 
                                    class="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg text-center transition-colors shadow-xs"
                                >
                                    Sign In (JWT)
                                </A>
                                <A 
                                    href="/authentification/login_with_session" 
                                    class="w-full py-2 px-3 bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 text-xs font-medium rounded-lg text-center transition-colors"
                                >
                                    Session Login
                                </A>
                            </div>
                        }>
                            <div class="relative w-full inline-flex">
                                <button 
                                    command="toggle-popover" 
                                    commandfor="account-dropdown" 
                                    type="button" 
                                    class="w-full inline-flex shrink-0 items-center gap-x-3 p-2 text-start text-xs font-medium text-neutral-800 dark:text-neutral-200 rounded-xl bg-neutral-50 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 focus:outline-hidden transition-colors" 
                                    aria-haspopup="menu" 
                                    aria-expanded="false" 
                                    aria-label="Account details"
                                >
                                    <div class="size-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                                        {userName().charAt(0) || 'U'}
                                    </div>
                                    <div class="flex flex-col flex-1 min-w-0">
                                        <span class="truncate font-semibold text-neutral-900 dark:text-white">{userName()}</span>
                                        <span class="truncate text-[11px] text-neutral-500 dark:text-neutral-400">{activeRoleDisplay()}</span>
                                    </div>
                                    <svg class="shrink-0 size-4 text-neutral-400 ms-auto" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7 15 5 5 5-5"/><path d="m7 9 5-5 5 5"/></svg>
                                </button>

                                {/* Account Dropdown Popover */}
                                <div 
                                    id="account-dropdown" 
                                    popover="auto" 
                                    class="fixed top-auto left-auto bottom-20 right-7 m-0 w-[22rem] z-30 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-2xl shadow-2xl p-3" 
                                    role="menu"
                                >
                                    {/* User Info Header */}
                                    <div class="p-2 mb-2 bg-neutral-50 dark:bg-neutral-900/60 rounded-xl border border-neutral-200/60 dark:border-neutral-700/60">
                                        <p class="font-bold text-sm text-neutral-900 dark:text-white truncate">{userName()}</p>
                                        <p class="text-xs text-neutral-500 dark:text-neutral-400 truncate mb-1">{userEmail()}</p>
                                        <div class="flex items-center gap-1.5 flex-wrap">
                                            <span class="inline-block text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                                                Current: {activeRoleDisplay()}
                                            </span>
                                            <Show when={activeRoleSignal() === 'student' && activeStudentCodeSignal()}>
                                                <span class="inline-block text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                                    NIM: {activeStudentCodeSignal()}
                                                </span>
                                            </Show>
                                        </div>
                                    </div>

                                    {/* Multi-role Switcher List */}
                                    <Show when={userRolesSignal().length > 1}>
                                        <div class="mb-2 pb-2 border-b border-neutral-200 dark:border-neutral-700">
                                            <p class="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 font-mono">
                                                Switch Available Roles
                                            </p>
                                            <div class="space-y-1">
                                                <For each={userRolesSignal()}>
                                                    {(r) => {
                                                        const isSelected = () => normalizeRoleName(r.name) === activeRoleSignal();
                                                        return (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRoleSwitch(r.name)}
                                                                class={`w-full flex items-center justify-between py-1.5 px-2.5 rounded-lg text-xs font-medium transition-colors ${
                                                                    isSelected() 
                                                                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 font-semibold' 
                                                                        : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                                                                }`}
                                                            >
                                                                <span>{getRoleDisplayName(r.name)}</span>
                                                                <Show when={isSelected()}>
                                                                    <svg class="size-3.5 text-blue-600 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                                                        <polyline points="20 6 9 17 4 12"/>
                                                                    </svg>
                                                                </Show>
                                                            </button>
                                                        );
                                                    }}
                                                </For>
                                            </div>
                                        </div>
                                    </Show>

                                    {/* Links */}
                                    <div class="space-y-1">
                                        <A 
                                            href={getDashboardPathForRole(activeRoleSignal())}
                                            class="flex items-center gap-x-2.5 py-2 px-2.5 rounded-lg text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                                        >
                                            <svg class="size-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                <rect width="7" height="9" x="3" y="3" rx="1"/>
                                                <rect width="7" height="5" x="14" y="3" rx="1"/>
                                                <rect width="7" height="9" x="14" y="12" rx="1"/>
                                                <rect width="7" height="5" x="3" y="16" rx="1"/>
                                            </svg>
                                            <span>My Active Dashboard</span>
                                        </A>

                                        <A 
                                            href="/dashboard/user" 
                                            class="flex items-center gap-x-2.5 py-2 px-2.5 rounded-lg text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                                        >
                                            <svg class="size-4 text-indigo-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                <circle cx="12" cy="7" r="4"/>
                                                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                            </svg>
                                            <span>Profile & Settings</span>
                                        </A>

                                        <button 
                                            type="button" 
                                            onClick={handleSignOut}
                                            class="w-full flex items-center gap-x-2.5 py-2 px-2.5 rounded-lg text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors text-start"
                                        >
                                            <svg class="size-4 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                                                <polyline points="16 17 21 12 16 7"/>
                                                <line x1="21" x2="9" y1="12" y2="12"/>
                                            </svg>
                                            <span>Sign Out</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </Show>
                    </footer>
                </div>
            </aside>
        </header>
    );
}