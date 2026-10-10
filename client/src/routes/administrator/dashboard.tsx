import { createSignal, onMount, For, Show } from 'solid-js';
import { A } from '@solidjs/router';
import TopBar from '~/components/navigation/TopBar';
import { currentUserSignal, activeInstitutionNameSignal } from '~/lib/authStore';
import { AuthUserControllerIndex } from '~/controllers/auth/AuthUserController';
import { AuthRoleControllerIndex } from '~/controllers/auth/AuthRoleController';
import { AuthPermissionControllerIndex } from '~/controllers/auth/AuthPermissionController';
import {
    PersonMasterIndividualControllerIndex,
    PersonMasterIndividualControllerStatistics,
    type PersonMasterIndividualStatistics,
} from '~/controllers/person/master/PersonMasterIndividualController';
import { InstitutionMasterInstitutionControllerIndex } from '~/controllers/institution/master/InstitutionMasterInstitutionController';
import ReferenceDistributionChart from '~/components/chart/reference_distribution_chart';

// Reference distributions charted on the dashboard, in display order
const PERSON_REFERENCE_CHARTS: { key: string; description: string; variant?: 'donut' | 'bar' | 'column' }[] = [
    { key: 'gender', description: 'Individuals by gender.', variant: 'donut' },
    { key: 'marital_status', description: 'Individuals by marital status.' },
    { key: 'religion', description: 'Individuals by religion.' },
    { key: 'age_classification', description: 'Individuals by age classification reference.' },
    { key: 'education', description: 'Individuals by highest education level.', variant: 'bar' },
    { key: 'identification_type', description: 'Individuals by identification document type.' },
    { key: 'occupation', description: 'Individuals by occupation.', variant: 'bar' },
    { key: 'profession', description: 'Individuals by profession.', variant: 'bar' },
    { key: 'income', description: 'Individuals by income bracket.', variant: 'bar' },
];

export default function AdministratorDashboardPage() {
    const [stats, setStats] = createSignal({
        users: 0,
        roles: 0,
        permissions: 0,
        individuals: 0,
        institutions: 0,
    });
    const [isLoading, setIsLoading] = createSignal(true);
    const [personStats, setPersonStats] = createSignal<PersonMasterIndividualStatistics | null>(null);
    const [isPersonStatsLoading, setIsPersonStatsLoading] = createSignal(true);

    onMount(async () => {
        if (typeof document !== 'undefined') {
            document.title = 'Administrator Dashboard - XSIA XARX';
        }
        PersonMasterIndividualControllerStatistics()
            .then(setPersonStats)
            .catch((e) => console.error('Error fetching individual statistics:', e))
            .finally(() => setIsPersonStatsLoading(false));
        try {
            const [users, roles, permissions, individuals, institutions] = await Promise.allSettled([
                AuthUserControllerIndex({ page: 1, per_page: 1 }),
                AuthRoleControllerIndex({ page: 1, per_page: 1 }),
                AuthPermissionControllerIndex({ page: 1, per_page: 1 }),
                PersonMasterIndividualControllerIndex({ page: 1, per_page: 1 }),
                InstitutionMasterInstitutionControllerIndex({ page: 1, per_page: 1 }),
            ]);

            setStats({
                users: users.status === 'fulfilled' ? (users.value.pagination?.total_data ?? 0) : 0,
                roles: roles.status === 'fulfilled' ? (roles.value.pagination?.total_data ?? 0) : 0,
                permissions: permissions.status === 'fulfilled' ? (permissions.value.pagination?.total_data ?? 0) : 0,
                individuals: individuals.status === 'fulfilled' ? (individuals.value.pagination?.total_data ?? 0) : 0,
                institutions: institutions.status === 'fulfilled' ? (institutions.value.pagination?.total_data ?? 0) : 0,
            });
        } catch (e) {
            console.error('Error fetching administrator dashboard stats:', e);
        } finally {
            setIsLoading(false);
        }
    });

    const statCards = () => [
        { label: 'Users', value: stats().users, path: '/administrator/auth/user', color: 'text-blue-600 dark:text-blue-400' },
        { label: 'Roles', value: stats().roles, path: '/administrator/auth/role', color: 'text-indigo-600 dark:text-indigo-400' },
        { label: 'Permissions', value: stats().permissions, path: '/administrator/auth/permission', color: 'text-purple-600 dark:text-purple-400' },
        { label: 'Individuals', value: stats().individuals, path: '/administrator/person/master/individual', color: 'text-emerald-600 dark:text-emerald-400' },
        { label: 'Institutions', value: stats().institutions, path: '/administrator/institution/master/institution', color: 'text-amber-600 dark:text-amber-400' },
    ];

    const personSummaryCards = () => {
        const s = personStats();
        const total = s?.total ?? 0;
        const share = (n: number) => (total > 0 ? `${((n / total) * 100).toFixed(1)}% of individuals` : '-');
        return [
            { label: 'Living Individuals', value: total - (s?.deceased ?? 0), note: share(total - (s?.deceased ?? 0)), color: 'text-emerald-600 dark:text-emerald-400' },
            { label: 'Deceased', value: s?.deceased ?? 0, note: share(s?.deceased ?? 0), color: 'text-neutral-600 dark:text-neutral-300' },
            { label: 'Special Needs', value: s?.special_need ?? 0, note: share(s?.special_need ?? 0), color: 'text-pink-600 dark:text-pink-400' },
            { label: 'KPS Recipients', value: s?.social_protection_card_recipient ?? 0, note: share(s?.social_protection_card_recipient ?? 0), color: 'text-amber-600 dark:text-amber-400' },
        ];
    };

    const distribution = (key: string) => personStats()?.distributions.find((d) => d.key === key);

    const modules = [
        {
            title: 'Auth (Otorisasi)',
            description: 'Users, roles, permissions, role-permission mapping and account verification.',
            links: [
                { label: 'Users', path: '/administrator/auth/user' },
                { label: 'Roles', path: '/administrator/auth/role' },
                { label: 'Permissions', path: '/administrator/auth/permission' },
                { label: 'Permission Roles', path: '/administrator/auth/permission-role' },
                { label: 'Verification', path: '/administrator/auth/verification' },
            ],
        },
        {
            title: 'Person (Individu)',
            description: 'Individual master records, personal history and person reference data.',
            links: [
                { label: 'Individuals', path: '/administrator/person/master/individual' },
            ],
        },
        {
            title: 'Institution (Institusi)',
            description: 'Institutions, units, staff and employees with their reference types.',
            links: [
                { label: 'Institutions', path: '/administrator/institution/master/institution' },
                { label: 'Units', path: '/administrator/institution/master/unit' },
                { label: 'Staff', path: '/administrator/institution/master/staff' },
                { label: 'Employees', path: '/administrator/institution/master/employee' },
            ],
        },
        {
            title: 'Academic (Akademik)',
            description: 'Campaigns, candidates, courses, lecturers, students, surveys and RPL.',
            links: [
                { label: 'Students', path: '/administrator/academic/student/master/student' },
                { label: 'Lecturers', path: '/administrator/academic/lecturer/master/lecturer' },
                { label: 'Candidates', path: '/administrator/academic/candidate/master/candidate' },
                { label: 'Courses', path: '/administrator/academic/course/master/course' },
                { label: 'Curriculums', path: '/administrator/academic/course/master/curriculum' },
                { label: 'Teaches', path: '/administrator/academic/campaign/transaction/teach' },
                { label: 'Academic Years', path: '/administrator/academic/general/reference/academic-year' },
            ],
        },
        {
            title: 'Location (Lokasi)',
            description: 'Continents, countries, provinces, regencies, sub-districts and villages.',
            links: [
                { label: 'Overview', path: '/administrator/location' },
            ],
        },
        {
            title: 'Literate (Pendidikan)',
            description: 'Education levels, categories, groups and varieties.',
            links: [
                { label: 'Overview', path: '/administrator/literate' },
            ],
        },
        {
            title: 'Building (Gedung)',
            description: 'Buildings and rooms used for academic activities.',
            links: [
                { label: 'Buildings', path: '/administrator/building/master/building' },
                { label: 'Rooms', path: '/administrator/building/master/room' },
            ],
        },
        {
            title: 'Contact (Kontak)',
            description: 'Electronic mails, phones, residences and websites.',
            links: [
                { label: 'E-mails', path: '/administrator/contact/master/electronic-mail' },
                { label: 'Phones', path: '/administrator/contact/master/phone' },
                { label: 'Residences', path: '/administrator/contact/master/residence' },
                { label: 'Websites', path: '/administrator/contact/master/website' },
            ],
        },
        {
            title: 'Document (Dokumen)',
            description: 'Archive types and document transactions.',
            links: [
                { label: 'Archive Types', path: '/administrator/document/reference/archive-type' },
            ],
        },
        {
            title: 'Feeder (PDDikti)',
            description: 'PDDikti feeder synchronisation: master, referensi, akumulasi and rekapitulasi.',
            links: [
                { label: 'Aktifitas Kuliah Mahasiswa', path: '/administrator/feeder/master/aktifitas-kuliah-mahasiswa' },
                { label: 'Aktifitas Mahasiswa', path: '/administrator/feeder/master/aktifitas-mahasiswa' },
            ],
        },
    ];

    return (
        <div class="min-h-screen bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100">
            <TopBar />

            <div class="mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
                <div class="border-b border-neutral-200 dark:border-neutral-800 pb-4">
                    <nav class="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                        <a href="/administrator/dashboard" class="hover:text-blue-600 transition-colors">Administrator</a>
                        <span>/</span>
                        <span class="font-medium text-neutral-900 dark:text-white">Dashboard</span>
                    </nav>
                    <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white font-mono">
                        Administrator Dashboard
                    </h1>
                    <p class="text-sm text-neutral-600 dark:text-neutral-400 mt-0.5">
                        Welcome{currentUserSignal()?.name ? `, ${currentUserSignal()?.name}` : ''}.
                        {activeInstitutionNameSignal() ? ` ${activeInstitutionNameSignal()} — ` : ' '}
                        System-wide management of master, reference and transaction data.
                    </p>
                </div>

                <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    <For each={statCards()}>
                        {(card) => (
                            <A
                                href={card.path}
                                class="group p-5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 hover:border-blue-500 dark:hover:border-blue-500 shadow-2xs hover:shadow-md transition-all"
                            >
                                <p class="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                                    {card.label}
                                </p>
                                <p class={`mt-2 text-2xl font-bold font-mono ${card.color}`}>
                                    {isLoading() ? '...' : card.value.toLocaleString()}
                                </p>
                            </A>
                        )}
                    </For>
                </div>

                <div>
                    <h2 class="text-lg font-bold text-neutral-900 dark:text-white">Person Demographics</h2>
                    <p class="text-xs text-neutral-500 dark:text-neutral-400">
                        Distribution of individual master records across person reference data.
                    </p>
                </div>

                <Show
                    when={!isPersonStatsLoading()}
                    fallback={
                        <div class="p-10 text-center text-xs font-mono text-neutral-400 dark:text-neutral-500 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                            Loading demographics...
                        </div>
                    }
                >
                    <Show
                        when={personStats()}
                        fallback={
                            <div class="p-10 text-center text-xs font-mono text-neutral-400 dark:text-neutral-500 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                                Demographic statistics are unavailable.
                            </div>
                        }
                    >
                        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <For each={personSummaryCards()}>
                                {(card) => (
                                    <div class="p-5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-2xs">
                                        <p class="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                                            {card.label}
                                        </p>
                                        <p class={`mt-2 text-2xl font-bold font-mono ${card.color}`}>
                                            {card.value.toLocaleString()}
                                        </p>
                                        <p class="mt-0.5 text-xs font-mono text-neutral-400 dark:text-neutral-500">{card.note}</p>
                                    </div>
                                )}
                            </For>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            <ReferenceDistributionChart
                                title="Kelompok Umur"
                                description="Living individuals by age computed from birth date."
                                items={personStats()?.age_groups ?? []}
                                variant="column"
                            />
                            <For each={PERSON_REFERENCE_CHARTS}>
                                {(chart) => (
                                    <Show when={distribution(chart.key)}>
                                        {(dist) => (
                                            <ReferenceDistributionChart
                                                title={dist().label}
                                                description={chart.description}
                                                items={dist().items}
                                                variant={chart.variant}
                                            />
                                        )}
                                    </Show>
                                )}
                            </For>
                        </div>
                    </Show>
                </Show>

                <div>
                    <h2 class="text-lg font-bold text-neutral-900 dark:text-white">Modules</h2>
                    <p class="text-xs text-neutral-500 dark:text-neutral-400">
                        Quick access to the main administration areas. Use the sidebar tree for every entity.
                    </p>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <For each={modules}>
                        {(mod) => (
                            <div class="flex flex-col p-5 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-2xs">
                                <h3 class="font-bold text-neutral-900 dark:text-white">{mod.title}</h3>
                                <p class="mt-1 text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                                    {mod.description}
                                </p>
                                <div class="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex flex-wrap gap-2">
                                    <For each={mod.links}>
                                        {(link) => (
                                            <A
                                                href={link.path}
                                                class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-neutral-700 dark:hover:text-blue-400 transition-colors"
                                            >
                                                {link.label}
                                                <svg class="size-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                                                </svg>
                                            </A>
                                        )}
                                    </For>
                                </div>
                            </div>
                        )}
                    </For>
                </div>
            </div>
        </div>
    );
}
