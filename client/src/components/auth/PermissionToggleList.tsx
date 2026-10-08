import { createSignal, createMemo, createEffect, on, Show, For } from 'solid-js';
import { toast } from '~/components/toast/Toaster';
import type { Permission } from '~/models/auth/Permission';
import { AuthPermissionControllerAll } from '~/controllers/auth/AuthPermissionController';

type PermissionLink = { id: string; permission_id: string };

type PermissionGroup = {
    controller: string;
    permissions: Permission[];
};

type Props = {
    // Id of the role / position type that owns the permission links
    ownerId: string;
    title?: string;
    loadLinks: (ownerId: string) => Promise<PermissionLink[]>;
    assign: (ownerId: string, permissionId: string) => Promise<{ is_error: boolean; message: string; data?: PermissionLink }>;
    revoke: (linkId: string) => Promise<{ is_error: boolean; message: string }>;
};

// Permission names follow the route name convention "<module>.<controller>.<action>"
const splitPermissionName = (name: string) => {
    const idx = name.lastIndexOf('.');
    return idx === -1
        ? { controller: 'other', action: name }
        : { controller: name.slice(0, idx), action: name.slice(idx + 1) };
};

const ToggleSwitch = (props: { checked: boolean; disabled: boolean; label: string; onToggle: () => void }) => (
    <button
        type="button"
        role="switch"
        aria-checked={props.checked}
        aria-label={props.label}
        disabled={props.disabled}
        onClick={() => props.onToggle()}
        class="relative inline-flex h-5 w-9 shrink-0 items-center border transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-wait"
        classList={{
            'bg-blue-600 border-blue-600': props.checked,
            'bg-neutral-200 dark:bg-neutral-700 border-neutral-300 dark:border-neutral-600': !props.checked,
        }}
    >
        <span
            class="inline-block size-3.5 bg-white shadow-sm transition-transform"
            classList={{ 'translate-x-4.5': props.checked, 'translate-x-0.5': !props.checked }}
        />
    </button>
);

export default function PermissionToggleList(props: Props) {
    const [isLoading, setIsLoading] = createSignal(true);
    const [permissions, setPermissions] = createSignal<Permission[]>([]);
    // permission_id -> link id
    const [assigned, setAssigned] = createSignal<Record<string, string>>({});
    const [pending, setPending] = createSignal<Record<string, boolean>>({});
    const [searchQuery, setSearchQuery] = createSignal('');
    const [showAssignedOnly, setShowAssignedOnly] = createSignal(false);

    const fetchData = async (ownerId: string) => {
        if (!ownerId) return;
        setIsLoading(true);
        try {
            const [allPermissions, links] = await Promise.all([AuthPermissionControllerAll(), props.loadLinks(ownerId)]);
            setPermissions(allPermissions);
            setAssigned(Object.fromEntries(links.map((link) => [link.permission_id, link.id])));
        } catch (error) {
            console.error('Error fetching permissions:', error);
            toast.danger('Failed to load permissions from server.');
        } finally {
            setIsLoading(false);
        }
    };

    createEffect(on(() => props.ownerId, (ownerId) => fetchData(ownerId)));

    const isAssigned = (permissionId: string) => Boolean(assigned()[permissionId]);
    const isPending = (permissionId: string) => Boolean(pending()[permissionId]);

    const groups = createMemo<PermissionGroup[]>(() => {
        const query = searchQuery().trim().toLowerCase();
        const assignedOnly = showAssignedOnly();
        const map = new Map<string, Permission[]>();
        for (const permission of permissions()) {
            if (query && !permission.name.toLowerCase().includes(query) && !(permission.uri || '').toLowerCase().includes(query)) continue;
            if (assignedOnly && !isAssigned(permission.id)) continue;
            const { controller } = splitPermissionName(permission.name);
            if (!map.has(controller)) map.set(controller, []);
            map.get(controller)!.push(permission);
        }
        return Array.from(map.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([controller, items]) => ({ controller, permissions: items }));
    });

    const assignedCount = createMemo(() => Object.keys(assigned()).length);

    const setPermissionPending = (permissionId: string, value: boolean) => {
        setPending((prev) => {
            const next = { ...prev };
            if (value) next[permissionId] = true;
            else delete next[permissionId];
            return next;
        });
    };

    // Returns an error message on failure, null on success
    const applyPermission = async (permission: Permission, allow: boolean): Promise<string | null> => {
        if (!props.ownerId || isPending(permission.id) || isAssigned(permission.id) === allow) return null;
        setPermissionPending(permission.id, true);
        try {
            if (allow) {
                const res = await props.assign(props.ownerId, permission.id);
                if (res.is_error || !res.data) return res.message;
                const linkId = res.data.id;
                setAssigned((prev) => ({ ...prev, [permission.id]: linkId }));
            } else {
                const res = await props.revoke(assigned()[permission.id]);
                if (res.is_error) return res.message;
                setAssigned((prev) => {
                    const next = { ...prev };
                    delete next[permission.id];
                    return next;
                });
            }
            return null;
        } finally {
            setPermissionPending(permission.id, false);
        }
    };

    const togglePermission = async (permission: Permission) => {
        const allow = !isAssigned(permission.id);
        const error = await applyPermission(permission, allow);
        if (error) {
            toast.danger(error);
        } else {
            toast.success(`${allow ? 'Allowed' : 'Revoked'} ${permission.name}`, 2000);
        }
    };

    const setGroup = async (group: PermissionGroup, allow: boolean) => {
        const targets = group.permissions.filter((p) => isAssigned(p.id) !== allow);
        if (targets.length === 0) return;
        const errors = (await Promise.all(targets.map((p) => applyPermission(p, allow)))).filter(Boolean);
        if (errors.length > 0) {
            toast.danger(`${errors.length} of ${targets.length} permission(s) failed to update.`);
        } else {
            toast.success(`${allow ? 'Allowed' : 'Revoked'} ${targets.length} permission(s) on ${group.controller}`, 2000);
        }
    };

    const groupAssignedCount = (group: PermissionGroup) => group.permissions.filter((p) => isAssigned(p.id)).length;
    const groupIsPending = (group: PermissionGroup) => group.permissions.some((p) => isPending(p.id));

    return (
        <div class="space-y-3">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div class="flex items-center gap-2">
                    <h3 class="text-sm font-bold font-mono text-neutral-900 dark:text-white">{props.title ?? 'Controller Permissions'}</h3>
                    <Show when={!isLoading()}>
                        <span class="px-2 py-0.5 text-[11px] font-mono font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/80">
                            {assignedCount()} / {permissions().length} allowed
                        </span>
                    </Show>
                </div>
                <div class="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
                    <label class="inline-flex items-center gap-2 text-xs font-mono text-neutral-600 dark:text-neutral-400 cursor-pointer select-none">
                        <input
                            type="checkbox"
                            checked={showAssignedOnly()}
                            onChange={(e) => setShowAssignedOnly(e.currentTarget.checked)}
                            class="size-3.5 cursor-pointer"
                        />
                        Allowed only
                    </label>
                    <input
                        type="search"
                        value={searchQuery()}
                        onInput={(e) => setSearchQuery(e.currentTarget.value)}
                        placeholder="Search permission or URI..."
                        class="w-full sm:w-72 px-3 py-1.5 text-xs font-mono bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 focus:outline-none focus:border-blue-500"
                    />
                </div>
            </div>

            <Show
                when={!isLoading()}
                fallback={
                    <div class="animate-pulse space-y-2">
                        <div class="h-10 bg-neutral-200 dark:bg-neutral-700"></div>
                        <div class="h-10 bg-neutral-200 dark:bg-neutral-700"></div>
                        <div class="h-10 bg-neutral-200 dark:bg-neutral-700"></div>
                    </div>
                }
            >
                <Show
                    when={groups().length > 0}
                    fallback={
                        <div class="py-8 text-center text-xs text-neutral-500 border border-neutral-200 dark:border-neutral-700">
                            No permissions match the current filter.
                        </div>
                    }
                >
                    <For each={groups()}>
                        {(group) => (
                            <div class="border border-neutral-200 dark:border-neutral-700">
                                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-2.5 bg-neutral-50 dark:bg-neutral-900/40 border-b border-neutral-200 dark:border-neutral-700">
                                    <div class="flex items-center gap-2 min-w-0">
                                        <span class="text-xs font-mono font-semibold text-neutral-900 dark:text-white truncate">{group.controller}</span>
                                        <span class="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 shrink-0">
                                            {groupAssignedCount(group)} / {group.permissions.length}
                                        </span>
                                    </div>
                                    <div class="flex gap-2 shrink-0">
                                        <button
                                            type="button"
                                            disabled={groupIsPending(group) || groupAssignedCount(group) === group.permissions.length}
                                            onClick={() => setGroup(group, true)}
                                            class="px-2.5 py-1 text-[11px] font-medium text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 hover:border-blue-500 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                        >
                                            Allow all
                                        </button>
                                        <button
                                            type="button"
                                            disabled={groupIsPending(group) || groupAssignedCount(group) === 0}
                                            onClick={() => setGroup(group, false)}
                                            class="px-2.5 py-1 text-[11px] font-medium text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950/50 border border-red-200 dark:border-red-800 hover:border-red-500 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                                        >
                                            Revoke all
                                        </button>
                                    </div>
                                </div>
                                <div class="divide-y divide-neutral-100 dark:divide-neutral-700/60">
                                    <For each={group.permissions}>
                                        {(permission) => (
                                            <div class="flex items-center justify-between gap-3 px-4 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-700/30">
                                                <div class="min-w-0">
                                                    <div class="flex items-center gap-2">
                                                        <span class="text-xs font-mono font-medium text-neutral-900 dark:text-white">
                                                            {splitPermissionName(permission.name).action}
                                                        </span>
                                                        <Show when={permission.is_open}>
                                                            <span class="px-1.5 py-0.5 text-[10px] font-mono font-semibold bg-green-50 text-green-700 dark:bg-green-950/60 dark:text-green-300 border border-green-200 dark:border-green-800">
                                                                open
                                                            </span>
                                                        </Show>
                                                    </div>
                                                    <div class="text-[11px] font-mono text-neutral-500 dark:text-neutral-400 truncate">
                                                        {permission.uri || permission.name}
                                                    </div>
                                                </div>
                                                <ToggleSwitch
                                                    checked={isAssigned(permission.id)}
                                                    disabled={isPending(permission.id)}
                                                    label={`Allow ${permission.name}`}
                                                    onToggle={() => togglePermission(permission)}
                                                />
                                            </div>
                                        )}
                                    </For>
                                </div>
                            </div>
                        )}
                    </For>
                </Show>
            </Show>
        </div>
    );
}
