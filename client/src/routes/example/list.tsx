import { createSignal } from 'solid-js';
import TopBar from '~/components/navigation/TopBar';
import { toast } from "~/components/toast/Toaster";

export default function ExampleList() {
    const [users] = createSignal([
        { id: 1, name: 'Neil Sims', email: 'neil.sims@flowbite.com', role: 'React Developer', status: 'Active', statusColor: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
        { id: 2, name: 'Roberta Casas', email: 'roberta.casas@flowbite.com', role: 'Designer', status: 'Offline', statusColor: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' },
        { id: 3, name: 'Michael Gough', email: 'michael@flowbite.com', role: 'Vue Developer', status: 'Active', statusColor: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
        { id: 4, name: 'Jese Leos', email: 'jese@flowbite.com', role: 'UI/UX Engineer', status: 'Away', statusColor: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' },
        { id: 5, name: 'Bonnie Green', email: 'bonnie@flowbite.com', role: 'Scrum Master', status: 'Active', statusColor: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' },
    ]);

    // Show a success toast
    toast.success("Item moved successfully.");
    // Show a warning toast
    toast.warning("Improve password difficulty.");
    // Show a danger toast
    toast.danger("Item has been deleted.");
    // Show a default toast (with the initial 3 seconds duration, which is default)
    toast.default("Set yourself free.");
    // You can optionally pass a custom duration in milliseconds
    toast.success("Custom time!", 5000);

    return (
        <>
            <TopBar />
            <div class="sm:flex sm:items-center sm:justify-between mb-8 px-3 pt-3">
                <div>
                    <h1 class="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white tracking-tight">Team Members</h1>
                    <p class="mt-2 text-sm text-neutral-600 dark:text-neutral-400">A list of all the users in your account including their name, title, email and role.</p>
                </div>
                <div class="mt-4 sm:mt-0">
                    <button type="button" class="relative size-9 flex justify-center items-center rounded-none bg-layer border border-gray-200 dark:border-gray-700 text-layer-foreground shadow-2xs hover:bg-green-500 hover:border-green-500 hover:text-white focus:outline-hidden focus:bg-layer-focus disabled:opacity-50 disabled:pointer-events-none transition-colors duration-200" aria-label="Show events">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-plus-icon lucide-plus"><path d="M5 12h14" /><path d="M12 5v14" /></svg>
                    </button>
                </div>
            </div>



            <div class="bg-white dark:bg-neutral-800 rounded-none shadow-sm border border-neutral-200 dark:border-neutral-700 overflow-hidden transition-colors duration-200 mx-3">
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
                            {users().map((user) => (
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
                                    <td class="px-6 py-4 text-right">
                                        <button class="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 font-medium transition-colors p-2 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg">
                                            Edit
                                        </button>
                                        <button class="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 font-medium transition-colors p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg ml-2">
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer */}
                <div class="flex items-center justify-between border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 px-4 py-3 sm:px-6">
                    <div class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                        <div>
                            <p class="text-sm text-neutral-700 dark:text-neutral-300">
                                Showing <span class="font-medium">1</span> to <span class="font-medium">5</span> of <span class="font-medium">5</span> results
                            </p>
                        </div>
                        <div>
                            <nav class="isolate inline-flex -space-x-px rounded-none shadow-sm" aria-label="Pagination">
                                <button class="relative inline-flex items-center rounded-none px-2 py-2 text-neutral-400 ring-1 ring-inset ring-neutral-300 dark:ring-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-700 focus:z-20 focus:outline-offset-0 disabled:opacity-50">
                                    <span class="sr-only">Previous</span>
                                    <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                        <path fill-rule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clip-rule="evenodd" />
                                    </svg>
                                </button>
                                <button aria-current="page" class="relative z-10 inline-flex items-center bg-blue-600 px-4 py-2 text-sm font-semibold text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">1</button>
                                <button class="relative inline-flex items-center rounded-none px-2 py-2 text-neutral-400 ring-1 ring-inset ring-neutral-300 dark:ring-neutral-600 hover:bg-neutral-50 dark:hover:bg-neutral-700 focus:z-20 focus:outline-offset-0 disabled:opacity-50">
                                    <span class="sr-only">Next</span>
                                    <svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                        <path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clip-rule="evenodd" />
                                    </svg>
                                </button>
                            </nav>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}