import { createSignal, onMount, createEffect, Show, For } from 'solid-js';
import { useSearchParams } from '@solidjs/router';
import TopBar from '~/components/navigation/TopBar';
import { toast } from '~/components/toast/Toaster';
import { masterApiShow, masterApiUpdate } from '~/controllers/master/masterApiController';

type FieldValue = string | number | boolean | null;

// Columns managed by the server; never sent back in the update payload
const READONLY_FIELDS = new Set(['id', 'created_at', 'updated_at', 'deleted_at', 'sync_at', 'created_by', 'updated_by']);

export default function RoomEditPage() {
    const apiPath = 'building/master/rooms';
    const basePath = '/administrator/building/master/room';
    const [searchParams] = useSearchParams();
    const [selectedId, setSelectedId] = createSignal<string>((searchParams.id as string) || '');
    const [fields, setFields] = createSignal<Record<string, FieldValue>>({});
    const [isLoading, setIsLoading] = createSignal(true);
    const [isSubmitting, setIsSubmitting] = createSignal(false);
    const [errors, setErrors] = createSignal<Record<string, string>>({});

    const fetchExisting = async (id: string) => {
        if (!id) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const res = await masterApiShow(apiPath, id);
            if (res.data) {
                // Only scalar columns are editable; nested relations are skipped
                const editable: Record<string, FieldValue> = {};
                Object.entries(res.data).forEach(([key, val]) => {
                    if (READONLY_FIELDS.has(key)) return;
                    if (val === null || ['string', 'number', 'boolean'].includes(typeof val)) {
                        editable[key] = val as FieldValue;
                    }
                });
                setFields(editable);
            } else {
                toast.danger(res.error || 'Record not found.');
            }
        } catch (err: any) {
            toast.danger('Failed to load record details.');
        } finally {
            setIsLoading(false);
        }
    };

    onMount(() => {
        fetchExisting((searchParams.id as string) || '');
    });

    createEffect(() => {
        const id = searchParams.id as string;
        if (id && id !== selectedId()) {
            setSelectedId(id);
            fetchExisting(id);
        }
    });

    const updateField = (key: string, value: FieldValue) => {
        setFields((prev) => ({ ...prev, [key]: value }));
        if (errors()[key]) {
            setErrors((prev) => {
                const next = { ...prev };
                delete next[key];
                return next;
            });
        }
    };

    const handleSubmit = async (e: Event) => {
        e.preventDefault();
        const id = selectedId();
        if (!id) return;

        setIsSubmitting(true);
        try {
            const res = await masterApiUpdate(apiPath, id, fields());
            if (res.success) {
                toast.success(res.message || 'Record updated successfully!');
                setTimeout(() => {
                    window.location.href = `${basePath}/${encodeURIComponent(id)}`;
                }, 500);
            } else {
                toast.danger(res.message || 'Failed to update record.');
                if (res.errors && typeof res.errors === 'object') {
                    const serverErrors: Record<string, string> = {};
                    Object.entries(res.errors).forEach(([k, v]) => {
                        serverErrors[k] = Array.isArray(v) ? v.join(', ') : String(v);
                    });
                    setErrors(serverErrors);
                }
            }
        } catch (err: any) {
            toast.danger(err.message || 'Network error occurred.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputClass =
        'w-full p-2.5 text-xs sm:text-sm border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white font-mono focus:ring-2 focus:ring-blue-500 outline-hidden transition-colors';

    return (
        <div class="min-h-screen bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100">
            <TopBar />

            <div class="mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 pb-4">
                    <div class="min-w-0">
                        <nav class="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 mb-1 overflow-x-auto whitespace-nowrap scrollbar-none py-0.5">
                            <a href="/" class="hover:text-blue-600 transition-colors shrink-0">Home</a>
                            <span class="shrink-0">/</span>
                            <span class="shrink-0">Building</span>
                            <span class="shrink-0">/</span>
                            <span class="shrink-0">Master</span>
                            <span class="shrink-0">/</span>
                            <a href={basePath} class="hover:text-blue-600 transition-colors shrink-0">Room</a>
                            <span class="shrink-0">/</span>
                            <span class="font-medium text-neutral-900 dark:text-white shrink-0">Edit</span>
                        </nav>
                        <h1 class="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white font-mono truncate">
                            Edit Room
                        </h1>
                    </div>

                    <div class="w-full sm:w-auto flex items-center gap-2 shrink-0">
                        <a
                            href={selectedId() ? `${basePath}/${encodeURIComponent(selectedId())}` : basePath}
                            class="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium text-neutral-700 bg-white dark:bg-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
                        >
                            <svg class="size-4 shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="m15 18-6-6 6-6" />
                            </svg>
                            <span>Cancel</span>
                        </a>
                    </div>
                </div>

                <div class="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-2xs p-4 sm:p-6 max-w-4xl">
                    <Show
                        when={!isLoading()}
                        fallback={
                            <div class="animate-pulse space-y-4 py-8">
                                <div class="h-6 w-48 bg-neutral-200 dark:bg-neutral-700"></div>
                                <div class="h-10 bg-neutral-200 dark:bg-neutral-700"></div>
                                <div class="h-20 bg-neutral-200 dark:bg-neutral-700"></div>
                            </div>
                        }
                    >
                        <Show
                            when={Object.keys(fields()).length > 0}
                            fallback={
                                <div class="py-12 text-center text-neutral-500">
                                    <p class="text-base font-semibold">No editable fields found.</p>
                                    <p class="text-xs mt-1">Check if the ID parameter in the URL is valid.</p>
                                </div>
                            }
                        >
                            <form onSubmit={handleSubmit} class="space-y-6">
                                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                                    <For each={Object.keys(fields())}>
                                        {(key) => (
                                            <div class="min-w-0">
                                                <label class="block text-xs font-semibold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 font-mono mb-2">
                                                    {key}
                                                </label>
                                                <Show
                                                    when={typeof fields()[key] === 'boolean'}
                                                    fallback={
                                                        <input
                                                            type={typeof fields()[key] === 'number' ? 'number' : 'text'}
                                                            value={fields()[key] == null ? '' : String(fields()[key])}
                                                            onInput={(e) => {
                                                                const raw = e.currentTarget.value;
                                                                if (typeof fields()[key] === 'number') {
                                                                    updateField(key, raw === '' ? null : Number(raw));
                                                                } else {
                                                                    updateField(key, raw === '' ? null : raw);
                                                                }
                                                            }}
                                                            class={inputClass}
                                                        />
                                                    }
                                                >
                                                    <label class="inline-flex items-center gap-2 text-xs font-mono text-neutral-800 dark:text-neutral-200 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={fields()[key] === true}
                                                            onChange={(e) => updateField(key, e.currentTarget.checked)}
                                                            class="size-4"
                                                        />
                                                        <span>{fields()[key] ? 'true' : 'false'}</span>
                                                    </label>
                                                </Show>
                                                <Show when={errors()[key]}>
                                                    <p class="text-xs text-red-500 mt-1 font-mono">{errors()[key]}</p>
                                                </Show>
                                            </div>
                                        )}
                                    </For>
                                </div>

                                <div class="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100 dark:border-neutral-700">
                                    <a
                                        href={`${basePath}/${encodeURIComponent(selectedId())}`}
                                        class="px-4 py-2 text-xs font-mono font-medium border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                                    >
                                        Cancel
                                    </a>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting()}
                                        class="inline-flex items-center gap-2 px-5 py-2 text-xs font-mono font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs disabled:opacity-50 transition-colors cursor-pointer"
                                    >
                                        <span>{isSubmitting() ? 'Updating...' : 'Update Room'}</span>
                                    </button>
                                </div>
                            </form>
                        </Show>
                    </Show>
                </div>
            </div>
        </div>
    );
}
