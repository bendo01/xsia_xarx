import { createSignal, onMount, For } from 'solid-js';
import { A } from '@solidjs/router';
import TopBar from '~/components/navigation/TopBar';
import { LiterateCategoryControllerIndex } from '~/controllers/literate/LiterateCategoryController';
import { LiterateEducationControllerIndex } from '~/controllers/literate/LiterateEducationController';
import { LiterateGroupControllerIndex } from '~/controllers/literate/LiterateGroupController';
import { LiterateLevelControllerIndex } from '~/controllers/literate/LiterateLevelController';
import { LiterateVarietyControllerIndex } from '~/controllers/literate/LiterateVarietyController';
import { t } from '../../../i18n';

export default function LiterateHubPage() {
    const [counts, setCounts] = createSignal({
        educations: 0,
        categories: 0,
        groups: 0,
        levels: 0,
        varieties: 0,
    });
    const [isLoading, setIsLoading] = createSignal(true);

    onMount(async () => {
        try {
            const [eduRes, catRes, grpRes, lvlRes, varRes] = await Promise.all([
                LiterateEducationControllerIndex({ page: 1, per_page: 1 }),
                LiterateCategoryControllerIndex({ page: 1, per_page: 1 }),
                LiterateGroupControllerIndex({ page: 1, per_page: 1 }),
                LiterateLevelControllerIndex({ page: 1, per_page: 1 }),
                LiterateVarietyControllerIndex({ page: 1, per_page: 1 }),
            ]);

            setCounts({
                educations: eduRes.pagination?.total_data || 0,
                categories: catRes.pagination?.total_data || 0,
                groups: grpRes.pagination?.total_data || 0,
                levels: lvlRes.pagination?.total_data || 0,
                varieties: varRes.pagination?.total_data || 0,
            });
        } catch (e) {
            console.error('Error fetching literate statistics:', e);
        } finally {
            setIsLoading(false);
        }
    });

    const modules = () => [
        {
            title: t('ad.education'),
            subtitle: t('ad.jenjangPendidikan'),
            href: '/literate/education',
            count: counts().educations,
            description: t('ad.masterAcademicEducationDegreesAndStudy'),
            icon: (
                <svg class="size-6 text-blue-600 dark:text-blue-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                    <path d="M6 12v5c3 3 9 3 12 0v-5"/>
                </svg>
            ),
        },
        {
            title: t('ad.category'),
            subtitle: t('ad.kategoriLiterat'),
            href: '/literate/category',
            count: counts().categories,
            description: t('ad.referenceCategoriesClassificationForAcademicLiteracy'),
            icon: (
                <svg class="size-6 text-indigo-600 dark:text-indigo-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect width="18" height="18" x="3" y="3" rx="2"/>
                    <path d="M3 9h18"/>
                    <path d="M9 21V9"/>
                </svg>
            ),
        },
        {
            title: t('ad.group'),
            subtitle: t('ad.golonganLiterat'),
            href: '/literate/group',
            count: counts().groups,
            description: t('ad.groupingDesignationsAndFunctionalTiersFor'),
            icon: (
                <svg class="size-6 text-emerald-600 dark:text-emerald-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
            ),
        },
        {
            title: t('ad.level'),
            subtitle: t('ad.jenjangLiterat'),
            href: '/literate/level',
            count: counts().levels,
            description: t('ad.hierarchicalEducationLevelsAndQualificationFrameworks'),
            icon: (
                <svg class="size-6 text-purple-600 dark:text-purple-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18 20V10"/>
                    <path d="M12 20V4"/>
                    <path d="M6 20v-6"/>
                </svg>
            ),
        },
        {
            title: t('ad.variety'),
            subtitle: t('ad.ragamLiterat'),
            href: '/literate/variety',
            count: counts().varieties,
            description: t('ad.educationalProgramVarietiesAndTrackVariations'),
            icon: (
                <svg class="size-6 text-amber-600 dark:text-amber-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
            ),
        },
    ];

    return (
        <div class="min-h-screen bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 flex flex-col">
            <TopBar />

            <main class="flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
                <div class="border-b border-neutral-200 dark:border-neutral-800 pb-4">
                    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <nav class="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                                <a href="/administrator/dashboard" class="hover:text-blue-600 transition-colors">{t('ad.administrator')}</a>
                                <span>/</span>
                                <span class="font-medium text-neutral-900 dark:text-white">{t('ad.literate')}</span>
                            </nav>
                            <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white font-mono">
                                {t('ad.literateEducationManagement')}
                            </h1>
                            <p class="text-sm text-neutral-600 dark:text-neutral-400 mt-0.5">
                                {t('ad.manageEducationalReferencesCategoriesGroupsLevels')}
                            </p>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    <For each={modules()}>
                        {(mod) => (
                            <A
                                href={mod.href}
                                class="group bg-white dark:bg-neutral-800 rounded-xs p-6 border border-neutral-200 dark:border-neutral-700 hover:border-blue-500 dark:hover:border-blue-500 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
                            >
                                <div>
                                    <div class="flex items-center justify-between mb-4">
                                        <div class="p-3 bg-neutral-50 dark:bg-neutral-900 rounded-xs border border-neutral-200 dark:border-neutral-700 group-hover:scale-105 transition-transform">
                                            {mod.icon}
                                        </div>
                                        <span class="inline-flex items-center px-2.5 py-0.5 rounded-xs text-xs font-mono font-semibold bg-neutral-100 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200">
                                            {isLoading() ? '...' : `${mod.count} records`}
                                        </span>
                                    </div>
                                    <h3 class="text-base font-bold text-neutral-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                        {mod.title}
                                    </h3>
                                    <p class="text-xs font-medium text-blue-600 dark:text-blue-400 mb-2 font-mono">
                                        {mod.subtitle}
                                    </p>
                                    <p class="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                                        {mod.description}
                                    </p>
                                </div>
                                <div class="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-700 flex items-center justify-between text-xs font-semibold text-blue-600 dark:text-blue-400 group-hover:translate-x-0.5 transition-transform">
                                    <span>{t('ad.manageData')}</span>
                                    <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M5 12h14"/>
                                        <path d="m12 5 7 7-7 7"/>
                                    </svg>
                                </div>
                            </A>
                        )}
                    </For>
                </div>
            </main>
        </div>
    );
}
