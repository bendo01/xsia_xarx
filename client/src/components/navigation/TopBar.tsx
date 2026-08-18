import MenuTemplate from '../menu/template';

export default function TopBar() {
    const toggleDarkMode = () => {
        if (document.documentElement.classList.contains('dark')) {
            document.documentElement.classList.remove('dark');
            localStorage.theme = 'light';
        } else {
            document.documentElement.classList.add('dark');
            localStorage.theme = 'dark';
        }
    };

    return (
        <header class="sticky top-0 z-10 flex flex-wrap sm:justify-start sm:flex-nowrap w-full py-3 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-700">
            <nav class="w-full mx-auto px-4 flex items-center justify-between">
                <div class="flex w-full items-center justify-between">
                    <a class="flex-none text-xl font-semibold text-foreground focus:outline-hidden focus:opacity-80" href="#" aria-label="Brand">
                        Brand
                    </a>
                    <div class="flex items-center gap-2">
                        <button onClick={toggleDarkMode} type="button" class="relative size-9 flex justify-center items-center rounded-none bg-layer border border-neutral-200 dark:border-neutral-700 text-layer-foreground shadow-2xs hover:bg-layer-hover focus:outline-hidden focus:bg-layer-focus disabled:opacity-50 disabled:pointer-events-none" aria-label="Toggle dark mode">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0 size-4 hidden dark:block"><circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" /></svg>
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0 size-4 block dark:hidden"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" /></svg>
                        </button>
                        <button popovertarget="events-popover" type="button" class="relative size-9 flex justify-center items-center rounded-none bg-layer border border-neutral-200 dark:border-neutral-700 text-layer-foreground shadow-2xs hover:bg-layer-hover focus:outline-hidden focus:bg-layer-focus disabled:opacity-50 disabled:pointer-events-none" aria-label="Show events">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="shrink-0 size-4">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                            </svg>

                        </button>
                        <div id="events-popover" popover="auto" class="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 shadow-xl rounded-none p-4 w-64 m-0 text-neutral-800 dark:text-neutral-100 top-[3.5rem] right-4 inset-auto">
                            <h3 class="font-semibold text-sm mb-3">Recent Events</h3>
                            <ul class="text-xs text-gray-500 space-y-2">
                                <li class="p-2 bg-gray-50 dark:bg-neutral-800 rounded">No new events.</li>
                            </ul>
                        </div>
                        <button popovertarget="sidebar-popover" popovertargetaction="toggle" type="button" class="relative size-9 flex justify-center items-center gap-x-2 rounded-none bg-layer border border-neutral-200 dark:border-neutral-700 text-layer-foreground shadow-2xs hover:bg-layer-hover focus:outline-hidden focus:bg-layer-focus disabled:opacity-50 disabled:pointer-events-none">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="shrink-0 size-4">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                            </svg>

                        </button>
                    </div>
                </div>
            </nav>
            <aside id="sidebar-popover" popover="auto" class="fixed top-0 right-0 left-auto h-full w-96 m-0 z-20 bg-white dark:bg-neutral-900 border-l border-neutral-200 dark:border-neutral-700 shadow-xl p-5 text-neutral-800 dark:text-neutral-100 backdrop:bg-black/50 backdrop:backdrop-blur-sm">
                <div class="flex flex-col h-full">
                    {/* Start Header */}
                    <div class="flex justify-between items-center mb-6 shrink-0">
                        <h2 class="text-lg font-semibold">Sidebar Menu</h2>
                        <button popovertarget="sidebar-popover" popovertargetaction="hide" class="p-1 hover:bg-gray-100 dark:hover:bg-neutral-800 rounded-md transition-colors" aria-label="Close sidebar">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                        </button>
                    </div>
                    {/* End Header */}

                    {/* Start Body */}
                    <nav class="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:rounded-none [&::-webkit-scrollbar-track]:bg-scrollbar-track [&::-webkit-scrollbar-thumb]:bg-scrollbar-thumb">
                        <div class="pb-0 px-2 pt-2 w-full flex flex-col flex-wrap">
                            <MenuTemplate />
                        </div>
                    </nav>
                    {/* End Body */}
                    {/* Footer */}
                    <footer class="mt-auto shrink-0 p-2 border-t border-sidebar-divider">
                        {/* Account Dropdown */}
                        <div class="relative w-full inline-flex">
                            <button command="toggle-popover" commandfor="account-dropdown" type="button" class="w-full inline-flex shrink-0 items-center gap-x-2 p-2 text-start text-sm text-foreground rounded-md hover:bg-muted-hover focus:outline-hidden focus:bg-muted-focus" aria-haspopup="menu" aria-expanded="false" aria-label="Dropdown">
                                <img class="shrink-0 size-5 rounded-full" src="https://images.unsplash.com/photo-1734122415415-88cb1d7d5dc0?q=80&w=320&h=320&auto=format&fit=facearea&facepad=3&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" alt="Avatar" />
                                Mia Hudson
                                <svg class="shrink-0 size-3.5 ms-auto" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m7 15 5 5 5-5" /><path d="m7 9 5-5 5 5" /></svg>
                            </button>
                            <div id="account-dropdown" popover="auto" class="fixed top-auto left-auto bottom-20 right-7 m-0 w-[20.5rem] z-30 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg shadow-lg" role="menu" aria-orientation="vertical" aria-labelledby="hs-sidebar-footer-example-with-dropdown">
                                <div class="p-1">
                                    <a class="flex items-center gap-x-3 py-2 px-3 rounded-lg text-sm text-gray-800 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-700 focus:outline-hidden focus:bg-gray-100 dark:focus:bg-neutral-700" href="#">
                                        <svg class="shrink-0 size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                                        My account
                                    </a>
                                    <a class="flex items-center gap-x-3 py-2 px-3 rounded-lg text-sm text-gray-800 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-700 focus:outline-hidden focus:bg-gray-100 dark:focus:bg-neutral-700" href="#">
                                        <svg class="shrink-0 size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></svg>
                                        Settings
                                    </a>
                                    <a class="flex items-center gap-x-3 py-2 px-3 rounded-lg text-sm text-gray-800 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-700 focus:outline-hidden focus:bg-gray-100 dark:focus:bg-neutral-700" href="#">
                                        <svg class="shrink-0 size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="5" rx="2" /><line x1="2" x2="22" y1="10" y2="10" /></svg>
                                        Billing
                                    </a>
                                    <a class="flex items-center gap-x-3 py-2 px-3 rounded-lg text-sm text-gray-800 dark:text-neutral-300 hover:bg-gray-100 dark:hover:bg-neutral-700 focus:outline-hidden focus:bg-gray-100 dark:focus:bg-neutral-700" href="#">
                                        <svg class="shrink-0 size-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" /></svg>
                                        Sign out
                                    </a>
                                </div>
                            </div>
                        </div>
                        {/* End Account Dropdown */}
                    </footer>
                    {/* End Footer */}
                </div>
            </aside>
        </header>
    );
}