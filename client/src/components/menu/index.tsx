import { createSignal, onMount, Show, For, Switch, Match } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { 
    isAuthenticatedSignal, 
    userRolesSignal, 
    activeRoleSignal, 
    currentUserSignal, 
    setActiveRole, 
    getRoleDisplayName, 
    getDashboardPathForRole, 
    refreshAuthState,
    normalizeRoleName
} from '../../lib/authStore';
import { toast } from '../toast/Toaster';
import MenuAdministrator from './administrator';
import MenuCourseDepartment from './course_department';
import MenuStudent from './student';
import MenuLecturer from './lecturer';
import MenuCandidate from './candidate';
import MenuRectorat from './rectorat';
import MenuGuest from './guest';

export default function DynamicMenu() {
    const navigate = useNavigate();
    const [isSwitchingRole, setIsSwitchingRole] = createSignal(false);

    onMount(() => {
        refreshAuthState();
    });

    const handleRoleChange = (roleName: string) => {
        if (normalizeRoleName(roleName) === activeRoleSignal()) return;
        
        setIsSwitchingRole(true);
        setActiveRole(roleName);
        const displayName = getRoleDisplayName(roleName);
        toast.info(`Switched active role to ${displayName}`);
        
        const targetDashboard = getDashboardPathForRole(roleName);
        navigate(targetDashboard);

        setTimeout(() => {
            setIsSwitchingRole(false);
        }, 150);
    };

    return (
        <div class="w-full flex flex-col gap-3">
            {/* Authenticated User Role Badge & Multi-Role Switcher */}
            <Show when={isAuthenticatedSignal()}>
                <div class="p-3 bg-neutral-100 dark:bg-neutral-800/80 rounded-xl border border-neutral-200/80 dark:border-neutral-700/80 mb-2">
                    <div class="flex items-center justify-between gap-2 mb-2">
                        <div class="flex items-center gap-2">
                            <span class="relative flex h-2.5 w-2.5">
                                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                            </span>
                            <span class="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 font-mono">
                                Active Role
                            </span>
                        </div>
                        <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-200 border border-blue-200 dark:border-blue-700">
                            {getRoleDisplayName(activeRoleSignal())}
                        </span>
                    </div>

                    {/* Multi-role Switcher (shown when user has more than 1 role) */}
                    <Show when={userRolesSignal().length > 1}>
                        <div class="mt-2 pt-2 border-t border-neutral-200 dark:border-neutral-700/60">
                            <label class="block text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-1.5 font-mono">
                                Switch Workspace Role ({userRolesSignal().length} Available)
                            </label>
                            <div class="grid grid-cols-2 gap-1.5">
                                <For each={userRolesSignal()}>
                                    {(roleItem) => {
                                        const isCurrent = () => normalizeRoleName(roleItem.name) === activeRoleSignal();
                                        return (
                                            <button
                                                type="button"
                                                onClick={() => handleRoleChange(roleItem.name)}
                                                class={`px-2 py-1.5 text-xs font-medium rounded-lg text-start transition-all flex items-center justify-between border ${
                                                    isCurrent() 
                                                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs font-semibold' 
                                                        : 'bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-neutral-800'
                                                }`}
                                            >
                                                <span class="truncate">{getRoleDisplayName(roleItem.name)}</span>
                                                <Show when={isCurrent()}>
                                                    <svg class="size-3 shrink-0 ml-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
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
                </div>
            </Show>

            {/* Role Menu Render */}
            <div class="w-full">
                <Switch fallback={<MenuAdministrator />}>
                    <Match when={!isAuthenticatedSignal()}>
                        <MenuGuest />
                    </Match>
                    <Match when={activeRoleSignal() === 'administrator'}>
                        <MenuAdministrator />
                    </Match>
                    <Match when={activeRoleSignal() === 'course_department'}>
                        <MenuCourseDepartment />
                    </Match>
                    <Match when={activeRoleSignal() === 'student'}>
                        <MenuStudent />
                    </Match>
                    <Match when={activeRoleSignal() === 'lecturer'}>
                        <MenuLecturer />
                    </Match>
                    <Match when={activeRoleSignal() === 'candidate'}>
                        <MenuCandidate />
                    </Match>
                    <Match when={activeRoleSignal() === 'rectorat'}>
                        <MenuRectorat />
                    </Match>
                </Switch>
            </div>
        </div>
    );
}
