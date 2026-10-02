import { onMount, createEffect } from 'solid-js';
import { A } from '@solidjs/router';
import { t } from '../../i18n';
import { getStorageItem, activeInstitutionIdSignal, currentRoleIdSignal, setActiveInstitution } from '../../lib/authStore';
import { resolveInstitutionFromStaffRole } from '../../lib/rectoratHelper';

const getInitialInstId = () => {
    const stored = activeInstitutionIdSignal() || getStorageItem('institution_id');
    if (stored && stored !== '00000000-0000-0000-0000-000000000000') return stored;
    return (import.meta as any).env?.CURRENT_INSTITUTION_ID || import.meta.env.VITE_INSTITUTION_ID || 'ed7e8c02-451b-4548-aa81-26b8d0b7fdec';
};

export default function MenuRectorat() {
    const instId = () => activeInstitutionIdSignal() || getInitialInstId();

    createEffect(async () => {
        const roleId = currentRoleIdSignal();
        if (roleId) {
            const resolved = await resolveInstitutionFromStaffRole(undefined, roleId);
            if (resolved && resolved !== activeInstitutionIdSignal()) {
                setActiveInstitution(resolved);
            }
        }
    });

    onMount(async () => {
        const current = activeInstitutionIdSignal();
        if (!current || current === '00000000-0000-0000-0000-000000000000') {
            const resolved = await resolveInstitutionFromStaffRole();
            if (resolved) {
                setActiveInstitution(resolved);
            }
        }
    });

    return (
        <ul class="space-y-1">
            {/* Dashboard */}
            <li>
                <A
                    href={`/rectorat/institution/${instId()}`}
                    activeClass="bg-purple-600/15 text-purple-600 dark:text-purple-400 font-semibold"
                    class="flex items-center gap-x-3 py-2 px-2.5 text-sm rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                    <svg class="size-4 shrink-0 text-purple-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" x2="18" y1="20" y2="10" />
                        <line x1="12" x2="12" y1="20" y2="4" />
                        <line x1="6" x2="6" y1="20" y2="14" />
                    </svg>
                    <span>{t('menu.rectorat.executiveDashboard')}</span>
                </A>
            </li>

            {/* University Analytics */}
            <li>
                <details class="group/exec-analytics animated-details" open>
                    <summary class="list-none [&::-webkit-details-marker]:hidden cursor-pointer w-full text-start flex items-center gap-x-3 py-2 px-2.5 text-sm font-medium text-neutral-800 dark:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors">
                        <svg class="size-4 shrink-0 text-indigo-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M3 3v18h18" />
                            <path d="m19 9-5 5-4-4-3 3" />
                        </svg>
                        <span>{t('menu.rectorat.listData')}</span>
                        <svg class="group-open/exec-analytics:block ms-auto hidden size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m18 15-6-6-6 6" /></svg>
                        <svg class="group-open/exec-analytics:hidden ms-auto block size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6" /></svg>
                    </summary>
                    <div class="w-full details-anim-content">
                        <ul class="pt-1 ps-6 space-y-1 overflow-hidden border-s-2 border-neutral-200 dark:border-neutral-700 ms-3 mt-1">
                            <li>
                                <A href={`/rectorat/institution/${instId()}/academic/student/master/student`} class="flex items-center gap-2 py-1.5 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 rounded">
                                    <span class="size-1.5 rounded-full bg-purple-400"></span> {t('menu.rectorat.studentList')}
                                </A>
                            </li>
                            <li>
                                <A href={`/rectorat/institution/${instId()}/academic/lecturer/master/lecturer`} class="flex items-center gap-2 py-1.5 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 rounded">
                                    <span class="size-1.5 rounded-full bg-purple-400"></span> {t('menu.rectorat.lecturerList')}
                                </A>
                            </li>
                            <li>
                                <A
                                    href={`/rectorat/institution/${instId()}/academic/campaign/transaction/activity`}
                                    activeClass="text-purple-600 dark:text-purple-400 font-semibold bg-purple-50 dark:bg-purple-950/40"
                                    class="flex items-center gap-2 py-1.5 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 rounded transition-colors"
                                >
                                    <span class="size-1.5 rounded-full bg-purple-400"></span> {t('menu.rectorat.activityUnitList')}
                                </A>
                            </li>
                            <li>
                                <A
                                    href={`/rectorat/institution/${instId()}/academic/campaign/transaction/class-code`}
                                    activeClass="text-purple-600 dark:text-purple-400 font-semibold bg-purple-50 dark:bg-purple-950/40"
                                    class="flex items-center gap-2 py-1.5 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 rounded transition-colors"
                                >
                                    <span class="size-1.5 rounded-full bg-purple-400"></span> {t('menu.rectorat.classCodeUnitList')}
                                </A>
                            </li>
                            <li>
                                <A
                                    href={`/rectorat/institution/${instId()}/academic/campaign/transaction/grade`}
                                    activeClass="text-purple-600 dark:text-purple-400 font-semibold bg-purple-50 dark:bg-purple-950/40"
                                    class="flex items-center gap-2 py-1.5 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 rounded transition-colors"
                                >
                                    <span class="size-1.5 rounded-full bg-purple-400"></span> {t('menu.rectorat.gradeUnitList')}
                                </A>
                            </li>
                            <li>
                                <A href={`/rectorat/institution/${instId()}/academic/campaign/transaction/teach`} class="flex items-center gap-2 py-1.5 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 rounded">
                                    <span class="size-1.5 rounded-full bg-purple-400"></span> {t('menu.rectorat.teachActivityList')}
                                </A>
                            </li>
                            <li>
                                <A href={`/rectorat/institution/${instId()}/academic/campaign/transaction/teach`} class="flex items-center gap-2 py-1.5 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 rounded">
                                    <span class="size-1.5 rounded-full bg-purple-400"></span> {t('menu.rectorat.studentActivityList')}
                                </A>
                            </li>
                            <li>
                                <A href={`/rectorat/institution/${instId()}/unit`} class="flex items-center gap-2 py-1.5 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 rounded">
                                    <span class="size-1.5 rounded-full bg-purple-400"></span> {t('menu.rectorat.facultiesDepartments')}
                                </A>
                            </li>
                            <li>
                                <A href={`/rectorat/institution/${instId()}/employee`} class="flex items-center gap-2 py-1.5 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 rounded">
                                    <span class="size-1.5 rounded-full bg-indigo-400"></span> Pegawai
                                </A>
                            </li>
                            <li>
                                <A href={`/rectorat/institution/${instId()}/staff`} class="flex items-center gap-2 py-1.5 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 rounded">
                                    <span class="size-1.5 rounded-full bg-teal-400"></span> Staf
                                </A>
                            </li>
                            <li>
                                <A href={`/rectorat/institution/${instId()}/academic`} class="flex items-center gap-2 py-1.5 px-2 text-xs text-neutral-600 dark:text-neutral-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 rounded">
                                    <span class="size-1.5 rounded-full bg-blue-400"></span> Akademik
                                </A>
                            </li>
                        </ul>
                    </div>
                </details>
            </li>

            {/* Accreditation & Quality Assurance */}
            <li>
                <A
                    href="/academic/survey/reference/bundle-category"
                    class="flex items-center gap-x-3 py-2 px-2.5 text-sm text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                    <svg class="size-4 shrink-0 text-emerald-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        <path d="m9 12 2 2 4-4" />
                    </svg>
                    <span>Quality Assurance (SPMI)</span>
                </A>
            </li>

            {/* Infrastructure & Assets */}
            <li>
                <A
                    href="/building/reference/category"
                    class="flex items-center gap-x-3 py-2 px-2.5 text-sm text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                    <svg class="size-4 shrink-0 text-cyan-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M3 21h18" />
                        <path d="M5 21V7l8-4v18" />
                        <path d="M19 21V11l-6-4" />
                    </svg>
                    <span>Campus Infrastructure</span>
                </A>
            </li>
        </ul>
    );
}
