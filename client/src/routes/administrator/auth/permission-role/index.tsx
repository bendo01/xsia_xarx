import { createSignal, createEffect, onMount, For, Show } from 'solid-js';
import TopBar from '~/components/navigation/TopBar';
import { toast } from '~/components/toast/Toaster';
import type { PermissionRole } from '~/models/auth/PermissionRole';
import type { ModelSelectItem } from '~/models/common/select/ModelSelectItem';
import {
    AuthPermissionRoleControllerIndex,
    AuthPermissionRoleControllerUpsert,
    AuthPermissionRoleControllerDelete,
} from '~/controllers/auth/AuthPermissionRoleController';
import { AuthRoleControllerList } from '~/controllers/auth/AuthRoleController';
import { AuthPermissionControllerList } from '~/controllers/auth/AuthPermissionController';

export default function AuthPermissionRolePage() {
    const [items, setItems] = createSignal<PermissionRole[]>([]);
    const [isLoading, setIsLoading] = createSignal(true);
    const [currentPage, setCurrentPage] = createSignal(1);
    const [itemsPerPage, setItemsPerPage] = createSignal(10);
    const [totalData, setTotalData] = createSignal(0);
    const [totalPages, setTotalPages] = createSignal(1);

    // Options
    const [roleOptions, setRoleOptions] = createSignal<ModelSelectItem[]>([]);
    const [permissionOptions, setPermissionOptions] = createSignal<ModelSelectItem[]>([]);

    // Dialog refs
    let createDialogRef!: HTMLDialogElement;
    let editDialogRef!: HTMLDialogElement;
    let deleteDialogRef!: HTMLDialogElement;

    // Form state for Create & Edit
    const [formData, setFormData] = createSignal<{
        id?: string | null;
        role_id: string;
        permission_id: string;
    }>({
        id: null,
        role_id: '',
        permission_id: '',
    });
    const [formErrors, setFormErrors] = createSignal<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = createSignal(false);

    // Selected item for Delete
    const [selectedItem, setSelectedItem] = createSignal<PermissionRole | null>(null);

    const loadOptions = async () => {
        try {
            const [rolesRes, permRes] = await Promise.all([
                AuthRoleControllerList(),
                AuthPermissionControllerList(),
            ]);
            if (Array.isArray(rolesRes.message)) setRoleOptions(rolesRes.message);
            if (Array.isArray(permRes.message)) setPermissionOptions(permRes.message);
        } catch (e) {
            console.error('Error loading options for permission-role:', e);
        }
    };

    onMount(() => {
        loadOptions();
    });

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const response = await AuthPermissionRoleControllerIndex({
                page: currentPage(),
                per_page: itemsPerPage(),
            });

            if (response && response.data) {
                const data = response.data as unknown as PermissionRole[];
                setItems(data);
                setTotalData(response.pagination?.total_data || data.length);
                setTotalPages(response.pagination?.total_page || 1);
            } else {
                setItems([]);
                setTotalData(0);
                setTotalPages(1);
            }
        } catch (error) {
            console.error('Error loading permission role data:', error);
            toast.danger('Failed to load permission-role assignments from server.');
        } finally {
            setIsLoading(false);
        }
    };

    createEffect(() => {
        currentPage();
        itemsPerPage();
        fetchData();
    });

    const handleItemsPerPageChange = (e: Event) => {
        const value = Number((e.target as HTMLSelectElement).value);
        setItemsPerPage(value);
        setCurrentPage(1);
    };

    const getRoleName = (id?: string | null) => {
        if (!id) return '-';
        const found = roleOptions().find((opt) => opt.id === id || opt.value === id);
        return found ? found.label : id;
    };

    const getPermissionName = (id?: string | null) => {
        if (!id) return '-';
        const found = permissionOptions().find((opt) => opt.id === id || opt.value === id);
        return found ? found.label : id;
    };

    const openCreateModal = () => {
        setFormData({
            id: null,
            role_id: roleOptions()[0]?.id || '',
            permission_id: permissionOptions()[0]?.id || '',
        });
        setFormErrors({});
        createDialogRef.showModal();
    };

    const closeCreateModal = () => {
        createDialogRef.close();
    };

    const openEditModal = (item: PermissionRole) => {
        setFormData({
            id: item.id,
            role_id: item.role_id || '',
            permission_id: item.permission_id || '',
        });
        setFormErrors({});
        editDialogRef.showModal();
    };

    const closeEditModal = () => {
        editDialogRef.close();
    };

    const openDeleteModal = (item: PermissionRole) => {
        setSelectedItem(item);
        deleteDialogRef.showModal();
    };

    const closeDeleteModal = () => {
        deleteDialogRef.close();
        setSelectedItem(null);
    };

    const validateForm = (): boolean => {
        const errors: Record<string, string> = {};
        const currentForm = formData();

        if (!currentForm.role_id || currentForm.role_id.trim() === '') {
            errors.role_id = 'Role selection is required.';
        }

        if (!currentForm.permission_id || currentForm.permission_id.trim() === '') {
            errors.permission_id = 'Permission selection is required.';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleCreateSubmit = async (e: Event) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsSubmitting(true);
        try {
            const res = await AuthPermissionRoleControllerUpsert(formData());
            if (!res.is_error) {
                toast.success(res.message || 'Permission assigned to role successfully!', 5000);
                closeCreateModal();
                fetchData();
            } else {
                toast.danger(res.message || 'Failed to assign permission.', 5000);
            }
        } catch (error: any) {
            toast.danger(error.message || 'Error occurred while assigning.', 5000);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditSubmit = async (e: Event) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsSubmitting(true);
        try {
            const res = await AuthPermissionRoleControllerUpsert(formData());
            if (!res.is_error) {
                toast.success(res.message || 'Assignment updated successfully!', 5000);
                closeEditModal();
                fetchData();
            } else {
                toast.danger(res.message || 'Failed to update assignment.', 5000);
            }
        } catch (error: any) {
            toast.danger(error.message || 'Error occurred while updating.', 5000);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteSubmit = async () => {
        const item = selectedItem();
        if (!item || !item.id) return;

        setIsSubmitting(true);
        try {
            const res = await AuthPermissionRoleControllerDelete({ id: item.id });
            if (!res.is_error) {
                toast.success(res.message || 'Permission removed from role successfully!', 5000);
                closeDeleteModal();
                fetchData();
            } else {
                toast.danger(res.message || 'Failed to remove permission.', 5000);
            }
        } catch (error: any) {
            toast.danger(error.message || 'Error occurred while deleting.', 5000);
        } finally {
            setIsSubmitting(false);
        }
    };

    const startIndex = () => (currentPage() - 1) * itemsPerPage();
    const endIndex = () => Math.min(startIndex() + items().length, totalData());

    return (
        <>
            <TopBar />

            {/* Page Header */}
            <div class="sm:flex sm:items-center sm:justify-between mb-4 px-3 pt-4">
                <div>
                    <h1 class="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white tracking-tight">
                        Permission-Role Assignment / Hak Akses Peran
                    </h1>
                    <p class="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                        Associate and manage access permissions granted to each security role.
                    </p>
                </div>
                <div class="mt-4 sm:mt-0 flex items-center gap-2 justify-end">
                    <button
                        type="button"
                        onClick={openCreateModal}
                        class="inline-flex items-center gap-x-2 px-3.5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 rounded-none shadow-xs transition-colors cursor-pointer"
                        id="btn-add-permission-role"
                    >
                        <svg class="shrink-0 size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M5 12h14" />
                            <path d="M12 5v14" />
                        </svg>
                        <span>Assign Permission to Role</span>
                    </button>
                </div>
            </div>

            {/* Controls */}
            <div class="px-3 mb-4 flex justify-end w-full">
                <div class="w-48">
                    <label class="block text-xs font-semibold uppercase text-neutral-500 dark:text-neutral-400 mb-1">
                        Per Page
                    </label>
                    <select
                        class="block w-full p-2 text-sm text-neutral-900 border border-neutral-300 rounded-none bg-white focus:ring-blue-500 focus:border-blue-500 dark:bg-neutral-800 dark:border-neutral-700 dark:text-white transition-colors"
                        value={itemsPerPage()}
                        onChange={handleItemsPerPageChange}
                        id="select-per-page-permission-role"
                    >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                    </select>
                </div>
            </div>

            {/* Content Table Container */}
            <div class="lg:mx-3 border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-2xs">
                {/* Desktop Table View */}
                <div class="hidden md:flex md:flex-col">
                    <div class="overflow-x-auto">
                        <table class="w-full text-sm text-left whitespace-nowrap">
                            <thead class="text-xs text-neutral-600 uppercase bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-300 border-b border-neutral-200 dark:border-neutral-700">
                                <tr>
                                    <th scope="col" class="px-6 py-3.5 font-semibold tracking-wider">Role</th>
                                    <th scope="col" class="px-6 py-3.5 font-semibold tracking-wider">Granted Permission</th>
                                    <th scope="col" class="px-6 py-3.5 font-semibold tracking-wider">Created At</th>
                                    <th scope="col" class="px-6 py-3.5 font-semibold tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-neutral-200 dark:divide-neutral-700">
                                <Show
                                    when={!isLoading()}
                                    fallback={
                                        <For each={Array.from({ length: 3 })}>
                                            {() => (
                                                <tr class="animate-pulse hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                                                    <td class="px-6 py-4"><div class="h-5 w-32 bg-neutral-200 dark:bg-neutral-700"></div></td>
                                                    <td class="px-6 py-4"><div class="h-5 w-48 bg-neutral-200 dark:bg-neutral-700"></div></td>
                                                    <td class="px-6 py-4"><div class="h-4 w-24 bg-neutral-200 dark:bg-neutral-700"></div></td>
                                                    <td class="px-6 py-4 text-right flex justify-end gap-2">
                                                        <div class="h-8 w-8 bg-neutral-200 dark:bg-neutral-700"></div>
                                                        <div class="h-8 w-8 bg-neutral-200 dark:bg-neutral-700"></div>
                                                    </td>
                                                </tr>
                                            )}
                                        </For>
                                    }
                                >
                                    <Show
                                        when={items().length > 0}
                                        fallback={
                                            <tr>
                                                <td colspan="4" class="px-6 py-12 text-center text-neutral-500 dark:text-neutral-400">
                                                    <div class="flex flex-col items-center justify-center space-y-2">
                                                        <svg class="size-8 text-neutral-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                                        </svg>
                                                        <p class="text-sm font-medium">No permission-role mappings found</p>
                                                        <p class="text-xs">Click "Assign Permission to Role" to add a new assignment.</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        }
                                    >
                                        <For each={items()}>
                                            {(item) => (
                                                <tr class="hover:bg-neutral-50 dark:hover:bg-neutral-800/60 transition-colors">
                                                    <td class="px-6 py-4">
                                                        <span class="inline-flex items-center px-2.5 py-0.5 text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                                            {getRoleName(item.role_id)}
                                                        </span>
                                                    </td>
                                                    <td class="px-6 py-4">
                                                        <span class="inline-flex items-center px-2 py-0.5 text-xs font-mono font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                                            {getPermissionName(item.permission_id)}
                                                        </span>
                                                    </td>
                                                    <td class="px-6 py-4 text-xs text-neutral-500 dark:text-neutral-400">
                                                        {item.created_at ? new Date(item.created_at).toLocaleDateString() : '-'}
                                                    </td>
                                                    <td class="px-6 py-4 text-right">
                                                        <div class="flex justify-end gap-1">
                                                            <button
                                                                type="button"
                                                                onClick={() => openEditModal(item)}
                                                                class="size-8 inline-flex justify-center items-center text-neutral-700 hover:text-yellow-600 hover:border-yellow-500 hover:bg-yellow-50 dark:text-neutral-300 dark:hover:text-yellow-400 dark:hover:border-yellow-500 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 transition-colors cursor-pointer"
                                                                title="Edit Record"
                                                                aria-label={`Edit assignment`}
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                                    <path d="M12 20h9" />
                                                                    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                                                                </svg>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => openDeleteModal(item)}
                                                                class="size-8 inline-flex justify-center items-center text-neutral-700 hover:text-red-600 hover:border-red-500 hover:bg-red-50 dark:text-neutral-300 dark:hover:text-red-400 dark:hover:border-red-500 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 transition-colors cursor-pointer"
                                                                title="Delete Record"
                                                                aria-label={`Delete assignment`}
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                                    <path d="M3 6h18" />
                                                                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                                                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                                                    <line x1="10" y1="11" x2="10" y2="17" />
                                                                    <line x1="14" y1="11" x2="14" y2="17" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </For>
                                    </Show>
                                </Show>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Mobile Card View */}
                <div class="md:hidden divide-y divide-neutral-200 dark:divide-neutral-700">
                    <Show
                        when={!isLoading()}
                        fallback={
                            <For each={Array.from({ length: 2 })}>
                                {() => (
                                    <div class="p-4 space-y-3 animate-pulse">
                                        <div class="h-4 w-1/3 bg-neutral-200 dark:bg-neutral-700"></div>
                                        <div class="h-4 w-2/3 bg-neutral-200 dark:bg-neutral-700"></div>
                                        <div class="flex justify-end gap-2 pt-2">
                                            <div class="h-8 w-16 bg-neutral-200 dark:bg-neutral-700"></div>
                                            <div class="h-8 w-16 bg-neutral-200 dark:bg-neutral-700"></div>
                                        </div>
                                    </div>
                                )}
                            </For>
                        }
                    >
                        <Show
                            when={items().length > 0}
                            fallback={
                                <div class="p-8 text-center text-neutral-500 dark:text-neutral-400">
                                    No permission-role mappings found.
                                </div>
                            }
                        >
                            <For each={items()}>
                                {(item) => (
                                    <div class="p-4 space-y-2">
                                        <div class="flex items-center justify-between">
                                            <span class="inline-flex items-center px-2.5 py-0.5 text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                                {getRoleName(item.role_id)}
                                            </span>
                                            <span class="text-xs text-neutral-500 dark:text-neutral-400 font-mono">
                                                {item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}
                                            </span>
                                        </div>
                                        <div>
                                            <span class="inline-flex items-center px-2 py-0.5 text-xs font-mono font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                                {getPermissionName(item.permission_id)}
                                            </span>
                                        </div>
                                        <div class="flex justify-end gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                                            <button
                                                type="button"
                                                onClick={() => openEditModal(item)}
                                                class="px-3 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-yellow-50 hover:text-yellow-600 hover:border-yellow-500 dark:text-blue-400 dark:bg-blue-950/50 dark:hover:text-yellow-400 dark:hover:border-yellow-500 border border-blue-200 dark:border-blue-800 transition-colors cursor-pointer"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => openDeleteModal(item)}
                                                class="px-3 py-1 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-50 hover:text-red-600 hover:border-red-500 dark:text-red-400 dark:bg-red-950/50 dark:hover:text-red-400 dark:hover:border-red-500 border border-red-200 dark:border-red-800 transition-colors cursor-pointer"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </For>
                        </Show>
                    </Show>
                </div>

                {/* Pagination Footer */}
                <div class="flex flex-col sm:flex-row items-center justify-between border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/80 px-4 py-3 sm:px-6 gap-3 sm:gap-0">
                    <div class="text-sm text-neutral-700 dark:text-neutral-300 text-center sm:text-left">
                        Showing <span class="font-medium">{totalData() > 0 ? startIndex() + 1 : 0}</span> to <span class="font-medium">{endIndex()}</span> of <span class="font-medium">{totalData()}</span> results
                    </div>
                    <div class="flex justify-center">
                        <nav class="inline-flex -space-x-px shadow-2xs" aria-label="Pagination">
                            <button
                                type="button"
                                class="inline-flex items-center px-3 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-200 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                disabled={currentPage() <= 1 || isLoading()}
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            >
                                <span class="sr-only">Previous</span>
                                <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clip-rule="evenodd" />
                                </svg>
                            </button>
                            <span class="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-blue-600 border border-blue-600">
                                {currentPage()} / {totalPages()}
                            </span>
                            <button
                                type="button"
                                class="inline-flex items-center px-3 py-2 text-sm font-medium text-neutral-700 dark:text-neutral-200 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 hover:bg-neutral-100 dark:hover:bg-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                                disabled={currentPage() >= totalPages() || isLoading()}
                                onClick={() => setCurrentPage((p) => Math.min(totalPages(), p + 1))}
                            >
                                <span class="sr-only">Next</span>
                                <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                    <path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clip-rule="evenodd" />
                                </svg>
                            </button>
                        </nav>
                    </div>
                </div>
            </div>

            {/* 1. CREATE MODAL */}
            <dialog
                ref={createDialogRef}
                class="fixed inset-0 m-auto p-0 rounded-none bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 shadow-2xl text-neutral-900 dark:text-neutral-100 max-w-lg w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => {
                    if (e.target === e.currentTarget) closeCreateModal();
                }}
            >
                <div class="p-6 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100">
                    <div class="flex items-center justify-between pb-4 border-b border-neutral-200 dark:border-neutral-700">
                        <div>
                            <h2 class="text-lg font-bold text-neutral-900 dark:text-white">
                                Assign Permission to Role
                            </h2>
                            <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                                Select a role and permission to map.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={closeCreateModal}
                            class="size-8 inline-flex items-center justify-center text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                            aria-label="Close dialog"
                        >
                            <svg class="size-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <form onSubmit={handleCreateSubmit} class="space-y-4 pt-4">
                        <div>
                            <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                Role <span class="text-red-500">*</span>
                            </label>
                            <select
                                class={`block w-full p-2.5 text-sm text-neutral-900 border rounded-none bg-white focus:ring-blue-500 focus:border-blue-500 dark:bg-neutral-800 dark:border-neutral-700 dark:text-white transition-colors ${
                                    formErrors().role_id ? 'border-red-500 dark:border-red-500' : 'border-neutral-300'
                                }`}
                                value={formData().role_id}
                                onChange={(e) => setFormData({ ...formData(), role_id: e.currentTarget.value })}
                            >
                                <option value="">Select Role</option>
                                <For each={roleOptions()}>
                                    {(opt) => <option value={opt.id}>{opt.label}</option>}
                                </For>
                            </select>
                            {formErrors().role_id && (
                                <p class="text-xs text-red-500 mt-1">{formErrors().role_id}</p>
                            )}
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                Permission <span class="text-red-500">*</span>
                            </label>
                            <select
                                class={`block w-full p-2.5 text-sm text-neutral-900 border rounded-none bg-white focus:ring-blue-500 focus:border-blue-500 dark:bg-neutral-800 dark:border-neutral-700 dark:text-white transition-colors ${
                                    formErrors().permission_id ? 'border-red-500 dark:border-red-500' : 'border-neutral-300'
                                }`}
                                value={formData().permission_id}
                                onChange={(e) => setFormData({ ...formData(), permission_id: e.currentTarget.value })}
                            >
                                <option value="">Select Permission</option>
                                <For each={permissionOptions()}>
                                    {(opt) => <option value={opt.id}>{opt.label}</option>}
                                </For>
                            </select>
                            {formErrors().permission_id && (
                                <p class="text-xs text-red-500 mt-1">{formErrors().permission_id}</p>
                            )}
                        </div>

                        <div class="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                            <button
                                type="button"
                                onClick={closeCreateModal}
                                class="px-4 py-2 text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-none transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting()}
                                class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-none transition-colors cursor-pointer"
                            >
                                {isSubmitting() ? 'Assigning...' : 'Save Assignment'}
                            </button>
                        </div>
                    </form>
                </div>
            </dialog>

            {/* 2. EDIT MODAL */}
            <dialog
                ref={editDialogRef}
                class="fixed inset-0 m-auto p-0 rounded-none bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 shadow-2xl text-neutral-900 dark:text-neutral-100 max-w-lg w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => {
                    if (e.target === e.currentTarget) closeEditModal();
                }}
            >
                <div class="p-6 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100">
                    <div class="flex items-center justify-between pb-4 border-b border-neutral-200 dark:border-neutral-700">
                        <div>
                            <h2 class="text-lg font-bold text-neutral-900 dark:text-white">
                                Edit Assignment
                            </h2>
                            <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                                Modify permission role assignment.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={closeEditModal}
                            class="size-8 inline-flex items-center justify-center text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                            aria-label="Close dialog"
                        >
                            <svg class="size-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <form onSubmit={handleEditSubmit} class="space-y-4 pt-4">
                        <div>
                            <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                Role <span class="text-red-500">*</span>
                            </label>
                            <select
                                class={`block w-full p-2.5 text-sm text-neutral-900 border rounded-none bg-white focus:ring-blue-500 focus:border-blue-500 dark:bg-neutral-800 dark:border-neutral-700 dark:text-white transition-colors ${
                                    formErrors().role_id ? 'border-red-500 dark:border-red-500' : 'border-neutral-300'
                                }`}
                                value={formData().role_id}
                                onChange={(e) => setFormData({ ...formData(), role_id: e.currentTarget.value })}
                            >
                                <option value="">Select Role</option>
                                <For each={roleOptions()}>
                                    {(opt) => <option value={opt.id}>{opt.label}</option>}
                                </For>
                            </select>
                            {formErrors().role_id && (
                                <p class="text-xs text-red-500 mt-1">{formErrors().role_id}</p>
                            )}
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                                Permission <span class="text-red-500">*</span>
                            </label>
                            <select
                                class={`block w-full p-2.5 text-sm text-neutral-900 border rounded-none bg-white focus:ring-blue-500 focus:border-blue-500 dark:bg-neutral-800 dark:border-neutral-700 dark:text-white transition-colors ${
                                    formErrors().permission_id ? 'border-red-500 dark:border-red-500' : 'border-neutral-300'
                                }`}
                                value={formData().permission_id}
                                onChange={(e) => setFormData({ ...formData(), permission_id: e.currentTarget.value })}
                            >
                                <option value="">Select Permission</option>
                                <For each={permissionOptions()}>
                                    {(opt) => <option value={opt.id}>{opt.label}</option>}
                                </For>
                            </select>
                            {formErrors().permission_id && (
                                <p class="text-xs text-red-500 mt-1">{formErrors().permission_id}</p>
                            )}
                        </div>

                        <div class="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                            <button
                                type="button"
                                onClick={closeEditModal}
                                class="px-4 py-2 text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-none transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting()}
                                class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-none transition-colors cursor-pointer"
                            >
                                {isSubmitting() ? 'Updating...' : 'Update Assignment'}
                            </button>
                        </div>
                    </form>
                </div>
            </dialog>

            {/* 3. DELETE CONFIRMATION MODAL */}
            <dialog
                ref={deleteDialogRef}
                class="fixed inset-0 m-auto p-0 rounded-none bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 shadow-2xl text-neutral-900 dark:text-neutral-100 max-w-md w-full"
                onClick={(e) => {
                    if (e.target === e.currentTarget) closeDeleteModal();
                }}
            >
                <div class="p-6 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100">
                    <div class="flex items-center gap-3 mb-4">
                        <div class="size-10 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center text-red-600 dark:text-red-400 shrink-0">
                            <svg class="size-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div>
                            <h3 class="text-base font-bold text-neutral-900 dark:text-white">
                                Confirm Remove
                            </h3>
                            <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                                Are you sure you want to remove this permission from the role?
                            </p>
                        </div>
                    </div>

                    <p class="text-sm text-neutral-600 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-800/60 p-3 rounded-none border border-neutral-200 dark:border-neutral-700 mb-4 font-mono text-xs">
                        Role: {getRoleName(selectedItem()?.role_id)} &rarr; Perm: {getPermissionName(selectedItem()?.permission_id)}
                    </p>

                    <div class="flex items-center justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={closeDeleteModal}
                            class="px-4 py-2 text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-none transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleDeleteSubmit}
                            disabled={isSubmitting()}
                            class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-none transition-colors cursor-pointer"
                        >
                            {isSubmitting() ? 'Removing...' : 'Remove'}
                        </button>
                    </div>
                </div>
            </dialog>
        </>
    );
}
