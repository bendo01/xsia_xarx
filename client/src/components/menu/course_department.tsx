import { A } from '@solidjs/router';
import { t } from '../../i18n';

export default function MenuCourseDepartment() {
    return (
        <ul class="space-y-1">
            {/* Dashboard */}
            <li>
                <A 
                    href="/dashboard/course_department" 
                    activeClass="bg-teal-600/15 text-teal-600 dark:text-teal-400 font-semibold"
                    class="flex items-center gap-x-3 py-2 px-2.5 text-sm rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                    <svg class="size-4 shrink-0 text-teal-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/>
                        <path d="M6 6h10M6 10h10M6 14h6"/>
                    </svg>
                    <span>{t('menu.courseDepartment.departmentDashboard')}</span>
                </A>
            </li>

            {/* Curriculum & Courses */}
            <li>
                <details class="group/courses animated-details" open>
                    <summary class="list-none [&::-webkit-details-marker]:hidden cursor-pointer w-full text-start flex items-center gap-x-3 py-2 px-2.5 text-sm font-medium text-neutral-800 dark:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                        <svg class="size-4 shrink-0 text-emerald-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
                        </svg>
                        <span>{t('menu.courseDepartment.curriculumCourses')}</span>
                        <svg class="group-open/courses:block ms-auto hidden size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>
                        <svg class="group-open/courses:hidden ms-auto block size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                    </summary>
                    <div class="w-full details-anim-content">
                        <ul class="pt-1 ps-6 space-y-1 overflow-hidden border-s-2 border-neutral-200 dark:border-neutral-700 ms-3 mt-1">
                            <li>
                                <A href="/academic/course/reference/curriculum-type" class="flex items-center gap-2 py-1.5 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 rounded">
                                    <span class="size-1.5 rounded-full bg-teal-400"></span> {t('menu.courseDepartment.curriculumTypes')}
                                </A>
                            </li>
                            <li>
                                <A href="/academic/course/reference/group" class="flex items-center gap-2 py-1.5 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 rounded">
                                    <span class="size-1.5 rounded-full bg-teal-400"></span> {t('menu.courseDepartment.courseGroups')}
                                </A>
                            </li>
                            <li>
                                <A href="/academic/course/reference/competence" class="flex items-center gap-2 py-1.5 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 rounded">
                                    <span class="size-1.5 rounded-full bg-teal-400"></span> {t('menu.courseDepartment.competencesOutcomes')}
                                </A>
                            </li>
                            <li>
                                <A href="/academic/course/reference/course-evaluation-base" class="flex items-center gap-2 py-1.5 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 rounded">
                                    <span class="size-1.5 rounded-full bg-teal-400"></span> {t('menu.courseDepartment.evaluationBase')}
                                </A>
                            </li>
                            <li>
                                <A href="/academic/course/reference/evaluation-type" class="flex items-center gap-2 py-1.5 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 rounded">
                                    <span class="size-1.5 rounded-full bg-teal-400"></span> {t('menu.courseDepartment.gradingTypes')}
                                </A>
                            </li>
                        </ul>
                    </div>
                </details>
            </li>

            {/* Teaching & Scheduling */}
            <li>
                <details class="group/teaching animated-details">
                    <summary class="list-none [&::-webkit-details-marker]:hidden cursor-pointer w-full text-start flex items-center gap-x-3 py-2 px-2.5 text-sm font-medium text-neutral-800 dark:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                        <svg class="size-4 shrink-0 text-cyan-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
                            <line x1="16" x2="16" y1="2" y2="6"/>
                            <line x1="8" x2="8" y1="2" y2="6"/>
                            <line x1="3" x2="21" y1="10" y2="10"/>
                        </svg>
                        <span>Class & Encounters</span>
                        <svg class="group-open/teaching:block ms-auto hidden size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>
                        <svg class="group-open/teaching:hidden ms-auto block size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                    </summary>
                    <div class="w-full details-anim-content">
                        <ul class="pt-1 ps-6 space-y-1 overflow-hidden border-s-2 border-neutral-200 dark:border-neutral-700 ms-3 mt-1">
                            <li>
                                <A href="/academic/campaign/reference/implementation" class="flex items-center gap-2 py-1.5 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 rounded">
                                    <span class="size-1.5 rounded-full bg-cyan-400"></span> Implementation Modes
                                </A>
                            </li>
                            <li>
                                <A href="/academic/campaign/reference/encounter-category" class="flex items-center gap-2 py-1.5 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 rounded">
                                    <span class="size-1.5 rounded-full bg-cyan-400"></span> Encounter Categories
                                </A>
                            </li>
                            <li>
                                <A href="/academic/campaign/reference/attend-type" class="flex items-center gap-2 py-1.5 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 rounded">
                                    <span class="size-1.5 rounded-full bg-cyan-400"></span> Attendance Types
                                </A>
                            </li>
                        </ul>
                    </div>
                </details>
            </li>

            {/* Lecturers & Faculty */}
            <li>
                <details class="group/lecturers animated-details">
                    <summary class="list-none [&::-webkit-details-marker]:hidden cursor-pointer w-full text-start flex items-center gap-x-3 py-2 px-2.5 text-sm font-medium text-neutral-800 dark:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                        <svg class="size-4 shrink-0 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                            <circle cx="9" cy="7" r="4"/>
                            <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                        </svg>
                        <span>Faculty & Lecturers</span>
                        <svg class="group-open/lecturers:block ms-auto hidden size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>
                        <svg class="group-open/lecturers:hidden ms-auto block size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                    </summary>
                    <div class="w-full details-anim-content">
                        <ul class="pt-1 ps-6 space-y-1 overflow-hidden border-s-2 border-neutral-200 dark:border-neutral-700 ms-3 mt-1">
                            <li>
                                <A href="/academic/lecturer/reference/rank" class="flex items-center gap-2 py-1.5 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 rounded">
                                    <span class="size-1.5 rounded-full bg-blue-400"></span> Academic Ranks
                                </A>
                            </li>
                            <li>
                                <A href="/academic/lecturer/reference/contract" class="flex items-center gap-2 py-1.5 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 rounded">
                                    <span class="size-1.5 rounded-full bg-blue-400"></span> Contracts
                                </A>
                            </li>
                            <li>
                                <A href="/academic/lecturer/reference/status" class="flex items-center gap-2 py-1.5 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 rounded">
                                    <span class="size-1.5 rounded-full bg-blue-400"></span> Lecturer Status
                                </A>
                            </li>
                        </ul>
                    </div>
                </details>
            </li>

            {/* Final Assignment & Thesis */}
            <li>
                <details class="group/thesis animated-details">
                    <summary class="list-none [&::-webkit-details-marker]:hidden cursor-pointer w-full text-start flex items-center gap-x-3 py-2 px-2.5 text-sm font-medium text-neutral-800 dark:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                        <svg class="size-4 shrink-0 text-purple-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                            <polyline points="14 2 14 8 20 8"/>
                            <path d="M9 13h6M9 17h3"/>
                        </svg>
                        <span>Final Assignment & Thesis</span>
                        <svg class="group-open/thesis:block ms-auto hidden size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6"/></svg>
                        <svg class="group-open/thesis:hidden ms-auto block size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                    </summary>
                    <div class="w-full details-anim-content">
                        <ul class="pt-1 ps-6 space-y-1 overflow-hidden border-s-2 border-neutral-200 dark:border-neutral-700 ms-3 mt-1">
                            <li>
                                <A href="/academic/student/final_assignment/reference/category" class="flex items-center gap-2 py-1.5 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 rounded">
                                    <span class="size-1.5 rounded-full bg-purple-400"></span> Thesis Categories
                                </A>
                            </li>
                            <li>
                                <A href="/academic/student/final_assignment/reference/adviser-category" class="flex items-center gap-2 py-1.5 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 rounded">
                                    <span class="size-1.5 rounded-full bg-purple-400"></span> Adviser Categories
                                </A>
                            </li>
                            <li>
                                <A href="/academic/student/final_assignment/reference/stage" class="flex items-center gap-2 py-1.5 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 rounded">
                                    <span class="size-1.5 rounded-full bg-purple-400"></span> Defense Stages
                                </A>
                            </li>
                            <li>
                                <A href="/academic/student/final_assignment/reference/requirement" class="flex items-center gap-2 py-1.5 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 rounded">
                                    <span class="size-1.5 rounded-full bg-purple-400"></span> Stage Requirements
                                </A>
                            </li>
                        </ul>
                    </div>
                </details>
            </li>

            {/* Quality & Evaluation Surveys */}
            <li>
                <A 
                    href="/academic/survey/reference/bundle-category" 
                    class="flex items-center gap-x-3 py-2 px-2.5 text-sm text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                    <svg class="size-4 shrink-0 text-amber-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="m9 12 2 2 4-4"/>
                    </svg>
                    <span>Teaching Surveys</span>
                </A>
            </li>
        </ul>
    );
}
