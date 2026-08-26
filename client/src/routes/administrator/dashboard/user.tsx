import { onMount, For, Show } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import TopBar from '../../components/navigation/TopBar';
import { 
    currentUserSignal, 
    userRolesSignal, 
    activeRoleSignal, 
    setActiveRole, 
    getRoleDisplayName, 
    getDashboardPathForRole, 
    refreshAuthState,
    normalizeRoleName
} from '../../lib/authStore';
import { toast } from '../../components/toast/Toaster';

export default function UserDashboard() {
    const navigate = useNavigate();

    onMount(() => {
        refreshAuthState();
    });

    const user = () => currentUserSignal();
    const activeRole = () => activeRoleSignal();
    const roles = () => userRolesSignal();

    const handleSwitchRole = (roleName: string) => {
        setActiveRole(roleName);
        toast.success(`Active workspace role set to: ${getRoleDisplayName(roleName)}`);
        navigate(getDashboardPathForRole(roleName));
    };

    return (
        <div class="min-h-screen bg-neutral-50 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 flex flex-col">
            <TopBar />

            <main class="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 space-y-8">
                {/* Profile Header */}
                <div class="bg-white dark:bg-neutral-800 rounded-3xl p-6 sm:p-8 border border-neutral-200 dark:border-neutral-700 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-6">
                    <div class="size-24 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white flex items-center justify-center text-3xl font-black shadow-lg">
                        {user()?.name?.charAt(0) || 'U'}
                    </div>

                    <div class="flex-1 text-center sm:text-left space-y-1">
                        <div class="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                            <h1 class="text-2xl font-black text-neutral-900 dark:text-white">
                                {user()?.name || "User Profile"}
                            </h1>
                            <span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                                Verified Account
                            </span>
                        </div>
                        <p class="text-sm text-neutral-500 dark:text-neutral-400 font-mono">
                            {user()?.email || "user@example.com"}
                        </p>
                        <div class="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                            <span class="text-xs font-semibold px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                Current Role: {getRoleDisplayName(activeRole())}
                            </span>
                            <span class="text-xs font-mono text-neutral-400">
                                {roles().length} Total Roles Assigned
                            </span>
                        </div>
                    </div>
                </div>

                {/* Multi-Role Workspace Management */}
                <div class="bg-white dark:bg-neutral-800 rounded-3xl p-6 sm:p-8 border border-neutral-200 dark:border-neutral-700 shadow-sm space-y-4">
                    <div>
                        <h2 class="text-lg font-bold text-neutral-900 dark:text-white">
                            Your Assigned Roles & Workspaces
                        </h2>
                        <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                            Because you hold multiple roles in the institution, you can toggle between workspace profiles instantly:
                        </p>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        <For each={roles()}>
                            {(roleItem) => {
                                const isCurrent = () => normalizeRoleName(roleItem.name) === activeRole();
                                const dashboardPath = () => getDashboardPathForRole(roleItem.name);
                                return (
                                    <div class={`p-5 rounded-2xl border transition-all flex flex-col justify-between gap-4 ${
                                        isCurrent() 
                                            ? 'bg-blue-50/50 dark:bg-blue-950/30 border-blue-500 shadow-sm ring-2 ring-blue-500/20' 
                                            : 'bg-neutral-50 dark:bg-neutral-900/60 border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'
                                    }`}>
                                        <div class="flex items-start justify-between">
                                            <div>
                                                <h3 class="text-sm font-bold text-neutral-900 dark:text-white">
                                                    {getRoleDisplayName(roleItem.name)}
                                                </h3>
                                                <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-1 font-mono">
                                                    Destination: {dashboardPath()}
                                                </p>
                                            </div>
                                            <Show when={isCurrent()}>
                                                <span class="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-600 text-white font-mono uppercase tracking-wide">
                                                    Active
                                                </span>
                                            </Show>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => handleSwitchRole(roleItem.name)}
                                            class={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-colors ${
                                                isCurrent()
                                                    ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-xs'
                                                    : 'bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700'
                                            }`}
                                        >
                                            {isCurrent() ? 'Open Active Dashboard →' : 'Switch to this Workspace'}
                                        </button>
                                    </div>
                                );
                            }}
                        </For>
                    </div>
                </div>

                {/* Account Security Info */}
                <div class="bg-white dark:bg-neutral-800 rounded-3xl p-6 sm:p-8 border border-neutral-200 dark:border-neutral-700 shadow-sm space-y-4">
                    <h2 class="text-lg font-bold text-neutral-900 dark:text-white">
                        Session & Security Details
                    </h2>
                    
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                        <div class="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-700/80">
                            <span class="text-neutral-400 block mb-1">Authentication Mode</span>
                            <span class="font-bold text-neutral-800 dark:text-neutral-200">JWT Token / Session</span>
                        </div>
                        <div class="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-700/80">
                            <span class="text-neutral-400 block mb-1">Token Status</span>
                            <span class="font-bold text-emerald-600 dark:text-emerald-400">Authenticated (Valid)</span>
                        </div>
                        <div class="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-700/80">
                            <span class="text-neutral-400 block mb-1">Password Protection</span>
                            <span class="font-bold text-neutral-800 dark:text-neutral-200">Argon2id Hashed</span>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
