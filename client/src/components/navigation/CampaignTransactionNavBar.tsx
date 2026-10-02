import { A } from '@solidjs/router';

interface CampaignTransactionNavBarProps {
    institutionId: () => string;
    activeTab?: 'activity' | 'class-code' | 'grade' | 'teach';
}

export default function CampaignTransactionNavBar(props: CampaignTransactionNavBarProps) {
    const instId = () => props.institutionId();

    const tabs = [
        {
            id: 'activity',
            name: 'Unit Aktivitas',
            href: () => `/rectorat/institution/${instId()}/academic/campaign/transaction/activity`,
            icon: (
                <svg class="size-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
                </svg>
            ),
        },
        {
            id: 'class-code',
            name: 'Unit Kode Kelas',
            href: () => `/rectorat/institution/${instId()}/academic/campaign/transaction/class-code`,
            icon: (
                <svg class="size-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <rect width="18" height="18" x="3" y="3" rx="2" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 9h18M9 21V9" />
                </svg>
            ),
        },
        {
            id: 'grade',
            name: 'Unit Skala Nilai',
            href: () => `/rectorat/institution/${instId()}/academic/campaign/transaction/grade`,
            icon: (
                <svg class="size-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                </svg>
            ),
        },
        {
            id: 'teach',
            name: 'Aktivitas Mengajar',
            href: () => `/rectorat/institution/${instId()}/academic/campaign/transaction/teach`,
            icon: (
                <svg class="size-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 3.741-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
                </svg>
            ),
        },
    ];

    return (
        <div class="flex items-center gap-1.5 p-1.5 bg-neutral-100 dark:bg-neutral-900/90 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 w-full overflow-x-auto scrollbar-none shadow-2xs">
            {tabs.map((tab) => {
                const isActive = props.activeTab === tab.id;
                return (
                    <A
                        href={tab.href()}
                        class={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                            isActive
                                ? 'bg-white dark:bg-neutral-800 text-blue-600 dark:text-blue-400 shadow-xs border border-neutral-200/60 dark:border-neutral-700/80'
                                : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-white/60 dark:hover:bg-neutral-800/60'
                        }`}
                    >
                        <span class={isActive ? 'text-blue-600 dark:text-blue-400' : 'text-neutral-400 dark:text-neutral-500'}>
                            {tab.icon}
                        </span>
                        <span>{tab.name}</span>
                    </A>
                );
            })}
        </div>
    );
}
