import { A } from '@solidjs/router';
import { t } from '../../i18n';
import { currentUserSignal } from '../../lib/authStore';
import { getStorageItem } from '../../lib/storage';

export default function MenuStudent() {
    const profileHref = () => {
        const indId = currentUserSignal()?.individual_id || getStorageItem('individual_id');
        return indId ? `/student/person/master/individual/${indId}/show` : '/student/person/master/individual/[id]/show';
    };

    return (
        <ul class="space-y-1">
            {/* Dashboard & Profile */}
            <li>
                <A
                    href={profileHref()}
                    activeClass="bg-blue-600/15 text-blue-600 dark:text-blue-400 font-semibold"
                    class="flex items-center gap-x-3 py-2 px-2.5 text-sm rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                    <svg class="size-4 shrink-0 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="8" r="5" />
                        <path d="M20 21a8 8 0 0 0-16 0" />
                    </svg>
                    <span>{t('menu.student.dashboardProfile')}</span>
                </A>
            </li>

            {/* Academic Advisers */}
            <li>
                <A
                    href="/student/academic/student/adviser"
                    activeClass="bg-blue-600/15 text-blue-600 dark:text-blue-400 font-semibold"
                    class="flex items-center gap-x-3 py-2 px-2.5 text-sm rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                    <svg class="size-4 shrink-0 text-amber-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    <span>{t('menu.student.academicAdvisers')}</span>
                </A>
            </li>

            {/* Academic Activities */}
            <li>
                <A
                    href="/student/academic/student/campaign/activity"
                    activeClass="bg-blue-600/15 text-blue-600 dark:text-blue-400 font-semibold"
                    class="flex items-center gap-x-3 py-2 px-2.5 text-sm rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                    <svg class="size-4 shrink-0 text-indigo-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
                        <path d="M6 6h10M6 10h10M6 14h6" />
                    </svg>
                    <span>{t('menu.student.academicActivities')}</span>
                </A>
            </li>

            {/* Admitted Student Directory */}
            <li>
                <A
                    href="/student/academic/student/master"
                    activeClass="bg-blue-600/15 text-blue-600 dark:text-blue-400 font-semibold"
                    class="flex items-center gap-x-3 py-2 px-2.5 text-sm rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                    <svg class="size-4 shrink-0 text-teal-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                        <path d="M6 12v5c3 3 9 3 12 0v-5" />
                    </svg>
                    <span>{t('menu.student.admittedStudents')}</span>
                </A>
            </li>
        </ul>
    );
}
