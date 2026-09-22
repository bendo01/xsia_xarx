import { A } from '@solidjs/router';
import { t } from '../../i18n';
import { getStorageItem } from '../../lib/storage';

export default function MenuCourseDepartment() {
    const unitHref = () => {
        const uId = getStorageItem('unit_id');
        return uId ? `/course-department/institution/master/unit/${uId}` : '/course-department/institution/master/unit/[id]';
    };

    const staffHref = () => {
        const uId = getStorageItem('unit_id');
        return uId ? `/course-department/institution/master/unit/${uId}/staff` : '/course-department/institution/master/unit/[id]/staff';
    };

    return (
        <ul class="space-y-1">
            {/* Dashboard */}
            <li>
                <A
                    href={unitHref()}
                    activeClass="bg-teal-600/15 text-teal-600 dark:text-teal-400 font-semibold"
                    class="flex items-center gap-x-3 py-2 px-2.5 text-sm rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                    <svg class="size-4 shrink-0 text-teal-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
                        <path d="M6 6h10M6 10h10M6 14h6" />
                    </svg>
                    <span>{t('menu.courseDepartment.departmentDashboard')}</span>
                </A>
            </li>

            {/* Students Directory */}
            <li>
                <A
                    href="/course-department/academic/student/master/student"
                    activeClass="bg-teal-600/15 text-teal-600 dark:text-teal-400 font-semibold"
                    class="flex items-center gap-x-3 py-2 px-2.5 text-sm rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                    <svg class="size-4 shrink-0 text-teal-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    <span>Student Directory</span>
                </A>
            </li>

            {/* Courses Directory */}
            <li>
                <A
                    href="/course-department/academic/course/master/course"
                    activeClass="bg-teal-600/15 text-teal-600 dark:text-teal-400 font-semibold"
                    class="flex items-center gap-x-3 py-2 px-2.5 text-sm rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                    <svg class="size-4 shrink-0 text-teal-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path>
                        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path>
                    </svg>
                    <span>Course Directory</span>
                </A>
            </li>

            {/* Curriculum */}
            <li>
                <A
                    href="/course-department/academic/course/master/curriculum"
                    activeClass="bg-teal-600/15 text-teal-600 dark:text-teal-400 font-semibold"
                    class="flex items-center gap-x-3 py-2 px-2.5 text-sm rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                    <svg class="size-4 shrink-0 text-teal-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="m16 6 4 14" />
                        <path d="M12 6v14" />
                        <path d="M8 8v12" />
                        <path d="M4 4v16" />
                    </svg>
                    <span>Curriculum Directory</span>
                </A>
            </li>

            {/* Class Code */}
            <li>
                <A
                    href="/course-department/academic/campaign/transaction/class-code"
                    activeClass="bg-teal-600/15 text-teal-600 dark:text-teal-400 font-semibold"
                    class="flex items-center gap-x-3 py-2 px-2.5 text-sm rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                    <svg class="size-4 shrink-0 text-teal-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polygon points="12 2 2 7 12 12 22 7 12 2" />
                        <polyline points="2 12 12 17 22 12" />
                        <polyline points="2 17 12 22 22 17" />
                    </svg>
                    <span>Class Code Directory</span>
                </A>
            </li>

            {/* Lecturers */}
            <li>
                <A
                    href="/course-department/academic/lecturer/master/lecturer"
                    activeClass="bg-teal-600/15 text-teal-600 dark:text-teal-400 font-semibold"
                    class="flex items-center gap-x-3 py-2 px-2.5 text-sm rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                    <svg class="size-4 shrink-0 text-teal-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                    </svg>
                    <span>Lecturer Directory</span>
                </A>
            </li>

            {/* Staff */}
            <li>
                <A
                    href={staffHref()}
                    activeClass="bg-teal-600/15 text-teal-600 dark:text-teal-400 font-semibold"
                    class="flex items-center gap-x-3 py-2 px-2.5 text-sm rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                    <svg class="size-4 shrink-0 text-teal-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                    </svg>
                    <span>Staff Directory</span>
                </A>
            </li>
        </ul>
    );
}
