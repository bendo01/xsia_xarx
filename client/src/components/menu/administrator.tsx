import { A } from '@solidjs/router';

export default function MenuAdministrator() {
    return (
        <ul class="space-y-1">
            {/* Dashboard */}
            <li>
                <A 
                    href="/dashboard/administrator" 
                    activeClass="bg-blue-600/15 text-blue-600 dark:text-blue-400 font-semibold"
                    class="flex items-center gap-x-3 py-2 px-2.5 text-sm rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                    <svg class="size-4 shrink-0 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect width="7" height="9" x="3" y="3" rx="1"/>
                        <rect width="7" height="5" x="14" y="3" rx="1"/>
                        <rect width="7" height="9" x="14" y="12" rx="1"/>
                        <rect width="7" height="5" x="3" y="16" rx="1"/>
                    </svg>
                    <span>Administrator Dashboard</span>
                </A>
            </li>

            {/* Academic Section */}
            <li>
                <details class="group/academic animated-details" open>
                    <summary class="list-none [&::-webkit-details-marker]:hidden cursor-pointer w-full text-start flex items-center gap-x-3 py-2 px-2.5 text-sm font-medium text-neutral-800 dark:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                        <svg class="size-4 shrink-0 text-indigo-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                            <path d="M6 12v5c3 3 9 3 12 0v-5"/>
                        </svg>
                        <span>Academic Master Data</span>
                        <svg class="group-open/academic:block ms-auto hidden size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>
                        <svg class="group-open/academic:hidden ms-auto block size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                    </summary>
                    <div class="w-full details-anim-content">
                        <ul class="pt-1 ps-6 space-y-1 overflow-hidden border-s-2 border-neutral-200 dark:border-neutral-700 ms-3 mt-1">
                            <li>
                                <A href="/academic/general/reference/academic-year" class="flex items-center gap-2 py-1.5 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 rounded">
                                    <span class="size-1.5 rounded-full bg-indigo-400"></span> Academic Year
                                </A>
                            </li>
                            <li>
                                <A href="/academic/general/reference/academic-year-category" class="flex items-center gap-2 py-1.5 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 rounded">
                                    <span class="size-1.5 rounded-full bg-indigo-400"></span> Year Categories
                                </A>
                            </li>
                            <li>
                                <A href="/academic/course/reference/curriculum-type" class="flex items-center gap-2 py-1.5 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 rounded">
                                    <span class="size-1.5 rounded-full bg-indigo-400"></span> Curriculum Types
                                </A>
                            </li>
                            <li>
                                <A href="/academic/course/reference/group" class="flex items-center gap-2 py-1.5 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 rounded">
                                    <span class="size-1.5 rounded-full bg-indigo-400"></span> Course Groups
                                </A>
                            </li>
                            <li>
                                <A href="/academic/course/reference/competence" class="flex items-center gap-2 py-1.5 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 rounded">
                                    <span class="size-1.5 rounded-full bg-indigo-400"></span> Competences
                                </A>
                            </li>
                            <li>
                                <A href="/academic/course/reference/semester" class="flex items-center gap-2 py-1.5 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 rounded">
                                    <span class="size-1.5 rounded-full bg-indigo-400"></span> Semesters
                                </A>
                            </li>
                            <li>
                                <A href="/academic/campaign/reference/calendar-category" class="flex items-center gap-2 py-1.5 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 rounded">
                                    <span class="size-1.5 rounded-full bg-indigo-400"></span> Academic Calendar
                                </A>
                            </li>
                            <li>
                                <A href="/academic/candidate/reference/phase" class="flex items-center gap-2 py-1.5 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 rounded">
                                    <span class="size-1.5 rounded-full bg-indigo-400"></span> Candidate Phases
                                </A>
                            </li>
                            <li>
                                <A href="/academic/student/reference/status" class="flex items-center gap-2 py-1.5 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 rounded">
                                    <span class="size-1.5 rounded-full bg-indigo-400"></span> Student Statuses
                                </A>
                            </li>
                        </ul>
                    </div>
                </details>
            </li>

            {/* Institution Section */}
            <li>
                <details class="group/institution animated-details">
                    <summary class="list-none [&::-webkit-details-marker]:hidden cursor-pointer w-full text-start flex items-center gap-x-3 py-2 px-2.5 text-sm font-medium text-neutral-800 dark:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                        <svg class="size-4 shrink-0 text-emerald-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect width="16" height="20" x="4" y="2" rx="2" ry="2"/>
                            <path d="M9 22v-4h6v4"/>
                            <path d="M8 6h.01M16 6h.01M8 10h.01M16 10h.01M8 14h.01M16 14h.01"/>
                        </svg>
                        <span>Institution Structure</span>
                        <svg class="group-open/institution:block ms-auto hidden size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>
                        <svg class="group-open/institution:hidden ms-auto block size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                    </summary>
                    <div class="w-full details-anim-content">
                        <ul class="pt-1 ps-6 space-y-1 overflow-hidden border-s-2 border-neutral-200 dark:border-neutral-700 ms-3 mt-1">
                            <li>
                                <A href="/institution/master/institution" class="flex items-center gap-2 py-1.5 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 rounded">
                                    <span class="size-1.5 rounded-full bg-emerald-400"></span> Institution Profile
                                </A>
                            </li>
                            <li>
                                <A href="/institution/master/unit" class="flex items-center gap-2 py-1.5 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 rounded">
                                    <span class="size-1.5 rounded-full bg-emerald-400"></span> Organizational Units
                                </A>
                            </li>
                            <li>
                                <A href="/institution/reference/position-type" class="flex items-center gap-2 py-1.5 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 rounded">
                                    <span class="size-1.5 rounded-full bg-emerald-400"></span> Position Types
                                </A>
                            </li>
                            <li>
                                <A href="/institution/reference/unit-type" class="flex items-center gap-2 py-1.5 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 rounded">
                                    <span class="size-1.5 rounded-full bg-emerald-400"></span> Unit Types
                                </A>
                            </li>
                        </ul>
                    </div>
                </details>
            </li>

            {/* Person & Identity Registry */}
            <li>
                <details class="group/person animated-details">
                    <summary class="list-none [&::-webkit-details-marker]:hidden cursor-pointer w-full text-start flex items-center gap-x-3 py-2 px-2.5 text-sm font-medium text-neutral-800 dark:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                        <svg class="size-4 shrink-0 text-amber-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                            <circle cx="9" cy="7" r="4"/>
                            <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                        </svg>
                        <span>Person Registry</span>
                        <svg class="group-open/person:block ms-auto hidden size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>
                        <svg class="group-open/person:hidden ms-auto block size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                    </summary>
                    <div class="w-full details-anim-content">
                        <ul class="pt-1 ps-6 space-y-1 overflow-hidden border-s-2 border-neutral-200 dark:border-neutral-700 ms-3 mt-1">
                            <li>
                                <A href="/person/master/individual" class="flex items-center gap-2 py-1.5 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 rounded">
                                    <span class="size-1.5 rounded-full bg-amber-400"></span> Master Individuals
                                </A>
                            </li>
                            <li>
                                <A href="/person/reference/gender" class="flex items-center gap-2 py-1.5 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 rounded">
                                    <span class="size-1.5 rounded-full bg-amber-400"></span> Demographics & References
                                </A>
                            </li>
                            <li>
                                <A href="/person/reference/religion" class="flex items-center gap-2 py-1.5 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 rounded">
                                    <span class="size-1.5 rounded-full bg-amber-400"></span> Religions
                                </A>
                            </li>
                            <li>
                                <A href="/person/reference/identification-type" class="flex items-center gap-2 py-1.5 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 rounded">
                                    <span class="size-1.5 rounded-full bg-amber-400"></span> Identity Types
                                </A>
                            </li>
                        </ul>
                    </div>
                </details>
            </li>

            {/* Campus & Infrastructure */}
            <li>
                <details class="group/infra animated-details">
                    <summary class="list-none [&::-webkit-details-marker]:hidden cursor-pointer w-full text-start flex items-center gap-x-3 py-2 px-2.5 text-sm font-medium text-neutral-800 dark:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                        <svg class="size-4 shrink-0 text-cyan-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M3 21h18"/>
                            <path d="M5 21V7l8-4v18"/>
                            <path d="M19 21V11l-6-4"/>
                            <path d="M9 9v.01M9 12v.01M9 15v.01M9 18v.01"/>
                        </svg>
                        <span>Infrastructure</span>
                        <svg class="group-open/infra:block ms-auto hidden size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>
                        <svg class="group-open/infra:hidden ms-auto block size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                    </summary>
                    <div class="w-full details-anim-content">
                        <ul class="pt-1 ps-6 space-y-1 overflow-hidden border-s-2 border-neutral-200 dark:border-neutral-700 ms-3 mt-1">
                            <li>
                                <A href="/building/reference/room-type" class="flex items-center gap-2 py-1.5 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 rounded">
                                    <span class="size-1.5 rounded-full bg-cyan-400"></span> Rooms & Spaces
                                </A>
                            </li>
                            <li>
                                <A href="/building/reference/category" class="flex items-center gap-2 py-1.5 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 rounded">
                                    <span class="size-1.5 rounded-full bg-cyan-400"></span> Building Categories
                                </A>
                            </li>
                        </ul>
                    </div>
                </details>
            </li>

            {/* System Utilities */}
            <li>
                <A 
                    href="/dashboard/user" 
                    class="flex items-center gap-x-3 py-2 px-2.5 text-sm text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                    <svg class="size-4 shrink-0 text-neutral-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="3"/>
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
                    </svg>
                    <span>My Account & Roles</span>
                </A>
            </li>
        </ul>
    );
}
