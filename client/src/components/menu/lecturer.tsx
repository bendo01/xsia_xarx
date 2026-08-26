import { A } from '@solidjs/router';

export default function MenuLecturer() {
    return (
        <ul class="space-y-1">
            {/* Dashboard */}
            <li>
                <A 
                    href="/lecturer/academic/campaign/activity" 
                    activeClass="bg-blue-600/15 text-blue-600 dark:text-blue-400 font-semibold"
                    class="flex items-center gap-x-3 py-2 px-2.5 text-sm rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                    <svg class="size-4 shrink-0 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/>
                        <path d="M6 6h10M6 10h10M6 14h6"/>
                    </svg>
                    <span>Teaching Activities & Classes</span>
                </A>
            </li>

            {/* Lecturer Profile */}
            <li>
                <A 
                    href="/lecturer/person/master/individual/show" 
                    activeClass="bg-blue-600/15 text-blue-600 dark:text-blue-400 font-semibold"
                    class="flex items-center gap-x-3 py-2 px-2.5 text-sm rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                    <svg class="size-4 shrink-0 text-indigo-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="8" r="5" />
                        <path d="M20 21a8 8 0 0 0-16 0" />
                    </svg>
                    <span>Lecturer Profile</span>
                </A>
            </li>
        </ul>
    );
}
