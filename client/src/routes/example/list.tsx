import { createSignal, onMount } from 'solid-js';
import SlimSelect from 'slim-select';
import TopBar from '~/components/navigation/TopBar';
import { toast } from "~/components/toast/Toaster";

export default function ExampleList() {
    const [users, setUsers] = createSignal<any[]>([]);
    const [isLoading, setIsLoading] = createSignal(true);
    const [currentPage, setCurrentPage] = createSignal(1);
    const [itemsPerPage, setItemsPerPage] = createSignal(10);
    const [searchQuery, setSearchQuery] = createSignal("");
    const [sortParam, setSortParam] = createSignal("name-asc");

    const filteredUsers = () => {
        const q = searchQuery().toLowerCase();
        let result = users();
        if (q) {
            result = result.filter(user =>
                user.name.toLowerCase().includes(q) ||
                user.email.toLowerCase().includes(q) ||
                user.role.toLowerCase().includes(q)
            );
        }

        const [field, orderStr] = sortParam().split('-');
        const order = orderStr === 'asc' ? 1 : -1;

        return [...result].sort((a, b) => {
            const aVal = String(a[field] || '').toLowerCase();
            const bVal = String(b[field] || '').toLowerCase();
            if (aVal < bVal) return -1 * order;
            if (aVal > bVal) return 1 * order;
            return 0;
        });
    };

    const totalItems = () => filteredUsers().length;
    const totalPages = () => Math.ceil(totalItems() / itemsPerPage()) || 1;
    const startIndex = () => (currentPage() - 1) * itemsPerPage();
    const endIndex = () => Math.min(startIndex() + itemsPerPage(), totalItems());
    const paginatedUsers = () => filteredUsers().slice(startIndex(), endIndex());

    const handleItemsPerPageChange = (e: Event) => {
        const value = Number((e.target as HTMLSelectElement).value);
        setItemsPerPage(value);
        setCurrentPage(1);
    };

    const handleSearch = (e: Event) => {
        setSearchQuery((e.target as HTMLInputElement).value);
        setCurrentPage(1);
    };
    let customSelectRef: HTMLSelectElement | undefined;

    onMount(() => {
        if (customSelectRef) {
            new SlimSelect({
                select: customSelectRef
            });
        }
        setTimeout(() => {
            const dummyData = Array.from({ length: 500 }, (_, i) => {
                const roles = ['React Developer', 'Designer', 'Vue Developer', 'UI/UX Engineer', 'Scrum Master', 'Backend Developer', 'Product Manager'];
                const statuses = ['Active', 'Offline', 'Away'];
                const statusColors: Record<string, string> = {
                    'Active': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
                    'Offline': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
                    'Away': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
                };
                const status = statuses[Math.floor(Math.random() * statuses.length)];
                return {
                    id: i + 1,
                    name: `User ${i + 1}`,
                    email: `user${i + 1}@flowbite.com`,
                    role: roles[Math.floor(Math.random() * roles.length)],
                    status: status,
                    statusColor: statusColors[status]
                };
            });
            setUsers(dummyData);
            setIsLoading(false);
        }, 1500); // Simulate 1.5 seconds loading
    });



    return (
        <>
            <TopBar />
            <div class="sm:flex sm:items-center sm:justify-between mb-4 px-3 pt-3">
                <div>
                    <h1 class="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white tracking-tight">Team Members</h1>
                    <p class="mt-2 text-sm text-neutral-600 dark:text-neutral-400">A list of all the users in your account including their name, title, email and role.</p>
                </div>
                <div class="mt-4 sm:mt-0 flex justify-end">
                    <button type="button" class="relative size-9 flex justify-center items-center rounded-none bg-layer border border-neutral-200 dark:border-neutral-700 text-layer-foreground shadow-2xs hover:bg-green-500 hover:border-green-500 hover:text-white focus:outline-hidden focus:bg-layer-focus disabled:opacity-50 disabled:pointer-events-none transition-colors duration-200" aria-label="Show events">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="shrink-0 size-4"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
                    </button>
                </div>
            </div>

            <div class="px-3 mb-4 flex flex-col sm:flex-row items-center gap-4">
                <div class="relative w-full">
                    <div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <svg class="w-4 h-4 text-neutral-500 dark:text-neutral-400" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z" />
                        </svg>
                    </div>
                    <input type="text"
                        class="block w-full p-2 pl-10 text-sm text-neutral-900 border border-neutral-300 rounded-none bg-neutral-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-neutral-800 dark:border-neutral-700 dark:placeholder-neutral-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 transition-colors"
                        placeholder="Search by name, email, or role..."
                        value={searchQuery()}
                        onInput={handleSearch}
                    />
                </div>
            </div>
            <div class="px-3 mb-4 flex flex-col sm:flex-row items-center gap-4 w-full">
                <div class="flex items-center gap-2 w-full sm:w-1/2">
                    <select
                        class="block w-full p-2 text-sm text-neutral-900 border border-neutral-300 rounded-none bg-neutral-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-neutral-800 dark:border-neutral-700 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 transition-colors"
                        value={sortParam()}
                        onChange={(e) => setSortParam((e.target as HTMLSelectElement).value)}
                    >
                        <option value="name-asc">Name (A-Z)</option>
                        <option value="name-desc">Name (Z-A)</option>
                        <option value="role-asc">Role (A-Z)</option>
                        <option value="role-desc">Role (Z-A)</option>
                        <option value="status-asc">Status (A-Z)</option>
                        <option value="status-desc">Status (Z-A)</option>
                    </select>
                </div>
                <div class="flex items-center gap-2 w-full sm:w-1/2">
                    <select
                        class="block w-full p-2 text-sm text-neutral-900 border border-neutral-300 rounded-none bg-neutral-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-neutral-800 dark:border-neutral-700 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 transition-colors"
                        value={itemsPerPage()}
                        onChange={handleItemsPerPageChange}
                    >
                        <option value={10}>10</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                    </select>
                </div>
            </div>
            <div class="px-3 mb-4 flex flex-col sm:flex-row items-center gap-4 w-full">
                <select ref={customSelectRef} multiple class="block w-full p-3 text-sm text-neutral-900 border border-neutral-300 rounded-none bg-neutral-50 focus:ring-blue-500 focus:border-blue-500 dark:bg-neutral-800 dark:border-neutral-700 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500 transition-colors">
                    <option data-placeholder="true">Select option</option>
                    <option>Name</option>
                    <option>Email address</option>
                    <option>Description</option>
                    <option>User ID</option>
                </select>
            </div>

            <div class="lg:mx-3">
                {/* Desktop Table View */}
                <div class="hidden md:flex md:flex-col">
                    <div class="overflow-x-auto">
                        <table class="w-full text-sm text-left whitespace-nowrap">
                            <thead class="text-xs text-neutral-500 uppercase bg-neutral-50 dark:bg-neutral-900/50 dark:text-neutral-400 border-b border-neutral-200 dark:border-neutral-700">
                                <tr>
                                    <th scope="col" class="px-6 py-4 font-semibold tracking-wider">Name</th>
                                    <th scope="col" class="px-6 py-4 font-semibold tracking-wider">Title / Role</th>
                                    <th scope="col" class="px-6 py-4 font-semibold tracking-wider">Status</th>
                                    <th scope="col" class="px-6 py-4 font-semibold tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-neutral-200 dark:divide-neutral-700">
                                {isLoading() ? (
                                    Array.from({ length: itemsPerPage() }).map(() => (
                                        <tr class="animate-pulse hover:bg-neutral-50/50 dark:hover:bg-neutral-700/50 transition-colors duration-150">
                                            <td class="px-6 py-4">
                                                <div class="flex items-center gap-4">
                                                    <div class="h-10 w-10 shrink-0 bg-neutral-200 dark:bg-neutral-700 rounded-full"></div>
                                                    <div class="space-y-2">
                                                        <div class="h-4 w-24 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
                                                        <div class="h-3 w-32 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td class="px-6 py-4">
                                                <div class="h-4 w-20 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
                                            </td>
                                            <td class="px-6 py-4">
                                                <div class="h-6 w-16 bg-neutral-200 dark:bg-neutral-700 rounded-full"></div>
                                            </td>
                                            <td class="px-6 py-4 text-right flex justify-end gap-2">
                                                <div class="h-8 w-16 bg-neutral-200 dark:bg-neutral-700 rounded-none"></div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    paginatedUsers().map((user) => (
                                        <tr class="hover:bg-neutral-50/50 dark:hover:bg-neutral-700/50 transition-colors duration-150 group">
                                            <td class="px-6 py-4">
                                                <div class="flex items-center gap-4">
                                                    <div class="h-10 w-10 shrink-0">
                                                        <img class="h-10 w-10 rounded-full object-cover border-2 border-transparent group-hover:border-blue-500 transition-colors" src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`} alt={user.name} />
                                                    </div>
                                                    <div>
                                                        <div class="font-medium text-neutral-900 dark:text-white">{user.name}</div>
                                                        <div class="text-neutral-500 dark:text-neutral-400">{user.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td class="px-6 py-4 text-neutral-600 dark:text-neutral-300">
                                                {user.role}
                                            </td>
                                            <td class="px-6 py-4">
                                                <span class={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border border-transparent ${user.statusColor}`}>
                                                    {user.status === 'Active' && <span class="w-1.5 h-1.5 mr-1.5 bg-green-500 rounded-full"></span>}
                                                    {user.status === 'Offline' && <span class="w-1.5 h-1.5 mr-1.5 bg-red-500 rounded-full"></span>}
                                                    {user.status === 'Away' && <span class="w-1.5 h-1.5 mr-1.5 bg-yellow-500 rounded-full"></span>}
                                                    {user.status}
                                                </span>
                                            </td>
                                            <td class="px-6 py-4 text-right flex justify-end gap-2">
                                                <button type="button" class="relative size-9 flex justify-center items-center rounded-none bg-layer border border-neutral-200 dark:border-neutral-700 text-layer-foreground shadow-2xs hover:bg-blue-500 hover:border-blue-500 hover:text-white focus:outline-hidden focus:bg-layer-focus disabled:opacity-50 disabled:pointer-events-none transition-colors duration-200" aria-label="Show events">
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="shrink-0 size-4"><circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" /></svg>
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Mobile Card View */}
                <div class="md:hidden space-y-6 p-4 bg-neutral-50/50 dark:bg-neutral-900/20">
                    {isLoading() ? (
                        Array.from({ length: itemsPerPage() }).map(() => (
                            <div class="bg-white dark:bg-neutral-800 p-4 rounded-none shadow-sm border border-neutral-200 dark:border-neutral-700 space-y-4 animate-pulse">
                                <div class="flex items-center gap-4">
                                    <div class="h-12 w-12 bg-neutral-200 dark:bg-neutral-700 rounded-full shrink-0"></div>
                                    <div class="space-y-2 flex-1">
                                        <div class="h-4 w-1/2 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
                                        <div class="h-3 w-3/4 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
                                    </div>
                                </div>
                                <div class="h-4 w-1/3 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
                                <div class="flex justify-between items-center pt-2">
                                    <div class="h-6 w-16 bg-neutral-200 dark:bg-neutral-700 rounded-full"></div>
                                    <div class="flex gap-2">
                                        <div class="h-8 w-12 bg-neutral-200 dark:bg-neutral-700 rounded-none"></div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        paginatedUsers().map((user) => (
                            <div class="bg-white dark:bg-neutral-800 p-4 rounded-none shadow-sm border border-neutral-200 dark:border-neutral-700 space-y-3 transition-colors hover:border-blue-300 dark:hover:border-blue-700">
                                <div class="flex items-center gap-4">
                                    <div class="h-12 w-12 shrink-0">
                                        <img class="h-12 w-12 rounded-full object-cover border-2 border-transparent" src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`} alt={user.name} />
                                    </div>
                                    <div>
                                        <div class="font-medium text-neutral-900 dark:text-white text-base">{user.name}</div>
                                        <div class="text-neutral-500 dark:text-neutral-400 text-sm">{user.email}</div>
                                    </div>
                                </div>
                                <div class="text-neutral-600 dark:text-neutral-300 text-sm font-medium">
                                    {user.role}
                                </div>
                                <div class="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-neutral-700/50 mt-3">
                                    <span class={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border border-transparent ${user.statusColor}`}>
                                        {user.status === 'Active' && <span class="w-1.5 h-1.5 mr-1.5 bg-green-500 rounded-full"></span>}
                                        {user.status === 'Offline' && <span class="w-1.5 h-1.5 mr-1.5 bg-red-500 rounded-full"></span>}
                                        {user.status === 'Away' && <span class="w-1.5 h-1.5 mr-1.5 bg-yellow-500 rounded-full"></span>}
                                        {user.status}
                                    </span>
                                    <div class="flex gap-2">
                                        <button type="button" class="relative size-9 flex justify-center items-center rounded-none bg-layer border border-neutral-200 dark:border-neutral-700 text-layer-foreground shadow-2xs hover:bg-blue-500 hover:border-blue-500 hover:text-white focus:outline-hidden focus:bg-layer-focus disabled:opacity-50 disabled:pointer-events-none transition-colors duration-200" aria-label="Show events">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="shrink-0 size-4"><circle cx="12" cy="12" r="1" /><circle cx="12" cy="5" r="1" /><circle cx="12" cy="19" r="1" /></svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Pagination Footer */}
                <div class="flex flex-col sm:flex-row items-center justify-between border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-4 py-4 sm:px-6 gap-4 sm:gap-0">
                    <div class="flex flex-col sm:flex-row items-center gap-3 sm:gap-6 w-full sm:w-auto justify-center sm:justify-start">
                        <p class="text-sm text-neutral-700 dark:text-neutral-300 text-center">
                            Showing <span class="font-medium">{totalItems() > 0 ? startIndex() + 1 : 0}</span> to <span class="font-medium">{endIndex()}</span> of <span class="font-medium">{totalItems()}</span> results
                        </p>
                    </div>
                    <div class="flex justify-center w-full sm:w-auto">
                        <nav class="isolate inline-flex -space-x-px rounded-none shadow-sm" aria-label="Pagination">
                            <button
                                class="relative inline-flex items-center rounded-none px-2 py-2 text-neutral-400 ring-1 ring-inset ring-neutral-300 dark:ring-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-700 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                                disabled={currentPage() === 1 || isLoading()}
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            >
                                <span class="sr-only">Previous</span>
                                <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                    <path fill-rule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clip-rule="evenodd" />
                                </svg>
                            </button>
                            <button aria-current="page" class="relative z-10 inline-flex items-center bg-blue-600 px-4 py-2 text-sm font-semibold text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">
                                {currentPage()} / {totalPages()}
                            </button>
                            <button
                                class="relative inline-flex items-center rounded-none px-2 py-2 text-neutral-400 ring-1 ring-inset ring-neutral-300 dark:ring-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-700 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                                disabled={currentPage() === totalPages() || isLoading()}
                                onClick={() => setCurrentPage(p => Math.min(totalPages(), p + 1))}
                            >
                                <span class="sr-only">Next</span>
                                <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                    <path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clip-rule="evenodd" />
                                </svg>
                            </button>
                        </nav>
                    </div>
                </div>
            </div>
        </>
    );
}