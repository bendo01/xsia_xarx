import { createSignal, For, Show, onCleanup } from 'solid-js';
import { masterApiIndex } from '~/controllers/master/masterApiController';

interface RemoteSearchSelectProps<T> {
    /** API path passed to masterApiIndex, e.g. 'academic/lecturer/master/lecturers' */
    apiPath: string;
    /** Currently selected record id ('' when nothing is selected) */
    value: string;
    /** Text shown for the selected record */
    selectedLabel?: string;
    placeholder?: string;
    /** Query parameter the search text is sent as (default: 'name') */
    searchParam?: string;
    /** Additional fixed query parameters, e.g. { unit_id } */
    extraParams?: Record<string, string | undefined>;
    getLabel: (item: T) => string;
    getSublabel?: (item: T) => string;
    onSelect: (item: T | null) => void;
    disabled?: boolean;
    required?: boolean;
    class?: string;
}

/**
 * Debounced search-as-you-type picker for large tables (lecturers, staff, activities)
 * where loading every record into a plain <select> is not practical.
 */
export default function RemoteSearchSelect<T extends { id: string }>(props: RemoteSearchSelectProps<T>) {
    const [query, setQuery] = createSignal('');
    const [results, setResults] = createSignal<T[]>([]);
    const [isOpen, setIsOpen] = createSignal(false);
    const [isSearching, setIsSearching] = createSignal(false);
    let searchTimeout: ReturnType<typeof setTimeout> | undefined;
    let requestSeq = 0;

    onCleanup(() => clearTimeout(searchTimeout));

    const runSearch = async (text: string) => {
        const seq = ++requestSeq;
        setIsSearching(true);
        try {
            const res = await masterApiIndex<T>(props.apiPath, {
                page: 1,
                per_page: 20,
                ...(text ? { [props.searchParam || 'name']: text } : {}),
                ...(props.extraParams || {}),
            });
            // Ignore responses that arrive after a newer search was started
            if (seq === requestSeq) setResults(res.data || []);
        } catch {
            if (seq === requestSeq) setResults([]);
        } finally {
            if (seq === requestSeq) setIsSearching(false);
        }
    };

    const handleInput = (e: Event) => {
        const text = (e.target as HTMLInputElement).value;
        setQuery(text);
        setIsOpen(true);
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => runSearch(text.trim()), 300);
    };

    const handleFocus = () => {
        setIsOpen(true);
        if (results().length === 0) runSearch(query().trim());
    };

    const choose = (item: T | null) => {
        props.onSelect(item);
        setQuery('');
        setIsOpen(false);
    };

    const inputClass = () =>
        props.class ||
        'w-full p-2 pr-8 text-xs sm:text-sm border border-neutral-300 dark:border-neutral-700 rounded-xs bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:ring-1 focus:ring-blue-500 disabled:opacity-60';

    return (
        <div class="relative">
            <input
                type="text"
                class={inputClass()}
                disabled={props.disabled}
                placeholder={props.value ? props.selectedLabel || 'Selected' : props.placeholder || 'Type to search...'}
                value={isOpen() ? query() : props.value ? props.selectedLabel || '' : ''}
                onInput={handleInput}
                onFocus={handleFocus}
                onBlur={() => setIsOpen(false)}
            />
            {/* Keeps native "required" validation working while the visible input holds search text */}
            <input type="text" class="sr-only" tabIndex={-1} aria-hidden="true" required={props.required} value={props.value} />

            <Show when={props.value && !props.disabled}>
                <button
                    type="button"
                    title="Clear selection"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => choose(null)}
                    class="absolute inset-y-0 right-0 flex items-center pr-2.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                >
                    <svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>
            </Show>

            <Show when={isOpen()}>
                <ul class="absolute z-50 mt-1 w-full max-h-64 overflow-y-auto bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xs shadow-lg text-xs">
                    <Show
                        when={!isSearching()}
                        fallback={<li class="px-3 py-2 font-mono text-neutral-500">Searching...</li>}
                    >
                        <Show
                            when={results().length > 0}
                            fallback={<li class="px-3 py-2 font-mono text-neutral-500">No matches found</li>}
                        >
                            <For each={results()}>
                                {(item) => (
                                    <li
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => choose(item)}
                                        class={`px-3 py-2 cursor-pointer hover:bg-blue-50 dark:hover:bg-neutral-700 ${item.id === props.value ? 'bg-blue-50 dark:bg-neutral-700/60' : ''}`}
                                    >
                                        <div class="font-medium text-neutral-900 dark:text-white">{props.getLabel(item)}</div>
                                        <Show when={props.getSublabel?.(item)}>
                                            <div class="text-[10px] font-mono text-neutral-500">{props.getSublabel!(item)}</div>
                                        </Show>
                                    </li>
                                )}
                            </For>
                        </Show>
                    </Show>
                </ul>
            </Show>
        </div>
    );
}
