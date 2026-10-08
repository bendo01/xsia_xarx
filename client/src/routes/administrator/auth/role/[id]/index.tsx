import { createSignal, onMount, createEffect, Show } from 'solid-js';
import { useParams } from '@solidjs/router';
import TopBar from '~/components/navigation/TopBar';
import PermissionToggleList from '~/components/auth/PermissionToggleList';
import { toast } from '~/components/toast/Toaster';
import type { Role } from '~/models/auth/Role';
import { AuthRoleControllerShow } from '~/controllers/auth/AuthRoleController';
import {
    AuthPermissionRoleControllerByRole,
    AuthPermissionRoleControllerUpsert,
    AuthPermissionRoleControllerDelete,
} from '~/controllers/auth/AuthPermissionRoleController';

export default function AuthRoleDetailPage() {
    const basePath = '/administrator/auth/role';
    const params = useParams();
    const [isLoading, setIsLoading] = createSignal(true);
    const [record, setRecord] = createSignal<Role | null>(null);
    const [selectedId, setSelectedId] = createSignal<string>((params.id as string) || '');

    const fetchDetail = async (id: string) => {
        if (!id || id === '[id]' || id === ':id') {
            setRecord(null);
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const role = await AuthRoleControllerShow(id);
            if (role && role.id) {
                setRecord(role);
            } else {
                setRecord(null);
                toast.danger('Role record not found.');
            }
        } catch (error) {
            console.error('Error fetching role detail:', error);
            setRecord(null);
            toast.danger('Failed to load role record from server.');
        } finally {
            setIsLoading(false);
        }
    };

    onMount(() => {
        fetchDetail((params.id as string) || '');
    });

    createEffect(() => {
        const id = params.id as string;
        if (id && id !== selectedId()) {
            setSelectedId(id);
            fetchDetail(id);
        }
    });

    const copyToClipboard = (text: string, label: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        toast.success(`Copied ${label} to clipboard`, 3000);
    };

    const formatDate = (value: string | null | undefined) => (value ? new Date(value).toLocaleString() : '-');

    return (
        <div class="min-h-screen bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100">
            <TopBar />

            <div class="mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
                {/* Header Section */}
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 pb-4">
                    <div class="min-w-0">
                        <nav class="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 mb-1 overflow-x-auto whitespace-nowrap scrollbar-none py-0.5">
                            <a href="/" class="hover:text-blue-600 transition-colors shrink-0">Home</a>
                            <span class="shrink-0">/</span>
                            <span class="shrink-0">Auth</span>
                            <span class="shrink-0">/</span>
                            <a href={basePath} class="hover:text-blue-600 transition-colors shrink-0">Role</a>
                            <span class="shrink-0">/</span>
                            <span class="font-medium text-neutral-900 dark:text-white shrink-0">Detail</span>
                        </nav>
                        <h1 class="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white font-mono truncate">
                            Role Permissions
                        </h1>
                    </div>

                    <div class="w-full sm:w-auto flex items-center gap-2 shrink-0">
                        <a
                            href={basePath}
                            class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium text-neutral-700 bg-white dark:bg-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
                        >
                            <svg class="size-4 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="m15 18-6-6 6-6" />
                            </svg>
                            <span>Back to List</span>
                        </a>
                    </div>
                </div>

                {/* Content Box */}
                <div class="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-2xs p-4 sm:p-6">
                    <Show
                        when={!isLoading()}
                        fallback={
                            <div class="animate-pulse space-y-4 py-8">
                                <div class="h-6 w-48 bg-neutral-200 dark:bg-neutral-700"></div>
                                <div class="h-4 w-96 max-w-full bg-neutral-200 dark:bg-neutral-700"></div>
                                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                                    <div class="h-16 bg-neutral-200 dark:bg-neutral-700"></div>
                                    <div class="h-16 bg-neutral-200 dark:bg-neutral-700"></div>
                                    <div class="h-16 bg-neutral-200 dark:bg-neutral-700"></div>
                                </div>
                            </div>
                        }
                    >
                        <Show
                            when={record()}
                            fallback={
                                <div class="py-12 text-center text-neutral-500">
                                    <p class="text-base font-semibold">No role details found.</p>
                                    <p class="text-xs mt-1">Check if the ID parameter in the URL is valid.</p>
                                </div>
                            }
                        >
                            <div class="space-y-6">
                                {/* Title and Badge Banner */}
                                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 dark:border-neutral-700 pb-4">
                                    <div class="min-w-0">
                                        <span class="text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400 block mb-0.5">Role Name</span>
                                        <h2 class="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white font-mono break-all sm:break-normal">
                                            {record()?.name || '-'}
                                        </h2>
                                    </div>
                                    <div class="flex flex-wrap items-center gap-2 shrink-0">
                                        <span class="px-2.5 py-1 text-xs font-mono font-semibold bg-neutral-100 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700">
                                            {record()?.roleable_type || '-'}
                                        </span>
                                    </div>
                                </div>

                                {/* Key Highlights Grid */}
                                <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 text-xs">
                                    <div class="p-3.5 sm:p-4 bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-700/60 min-w-0">
                                        <span class="text-neutral-500 uppercase tracking-wider block font-semibold mb-1 text-[11px]">UUID</span>
                                        <div class="flex items-center justify-between gap-2 min-w-0">
                                            <span class="font-mono text-neutral-800 dark:text-neutral-200 truncate">{record()?.id || '-'}</span>
                                            <button
                                                type="button"
                                                onClick={() => copyToClipboard(record()?.id || '', 'ID')}
                                                class="text-blue-600 hover:text-blue-700 cursor-pointer font-mono shrink-0 text-xs font-medium"
                                            >
                                                Copy
                                            </button>
                                        </div>
                                    </div>
                                    <div class="p-3.5 sm:p-4 bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-700/60 min-w-0">
                                        <span class="text-neutral-500 uppercase tracking-wider block font-semibold mb-1 text-[11px]">Created At</span>
                                        <span class="font-mono text-neutral-800 dark:text-neutral-200">{formatDate(record()?.created_at)}</span>
                                    </div>
                                    <div class="p-3.5 sm:p-4 bg-neutral-50 dark:bg-neutral-900/50 border border-neutral-200 dark:border-neutral-700/60 min-w-0">
                                        <span class="text-neutral-500 uppercase tracking-wider block font-semibold mb-1 text-[11px]">Updated At</span>
                                        <span class="font-mono text-neutral-800 dark:text-neutral-200">{formatDate(record()?.updated_at)}</span>
                                    </div>
                                </div>

                                {/* Role-specific permissions; position type permissions are managed on the position type page */}
                                <div class="mt-6 space-y-2">
                                    <p class="text-[11px] font-mono text-neutral-500 dark:text-neutral-400">
                                        Permissions below apply to this role only. Permissions granted to the role's position type also apply.
                                    </p>
                                    <PermissionToggleList
                                        ownerId={record()!.id}
                                        title="Role Permissions"
                                        loadLinks={AuthPermissionRoleControllerByRole}
                                        assign={(roleId, permissionId) => AuthPermissionRoleControllerUpsert({ role_id: roleId, permission_id: permissionId })}
                                        revoke={(id) => AuthPermissionRoleControllerDelete({ id })}
                                    />
                                </div>
                            </div>
                        </Show>
                    </Show>
                </div>
            </div>
        </div>
    );
}
