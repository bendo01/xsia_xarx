import TopBar from '~/components/navigation/TopBar';
import { t } from '../../../../../../../../i18n';

export default function AcademicCampaignTransactionTeachdecreePage() {
    return (
        <div class="min-h-screen bg-muted text-foreground flex flex-col">
            <TopBar />

            <main class="flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                <div class="bg-card rounded-md p-6 border border-border shadow-2xs">
                    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <div class="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-mono font-semibold mb-2 border border-blue-200 dark:border-blue-800/80">
                                <span class="size-1.5 rounded-md bg-blue-500"></span>
                                <span>{t('rt.academicCampaignTransaction')}</span>
                            </div>
                            <h1 class="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-mono">
                                {t('rt.teachDecree')}
                            </h1>
                            <p class="text-xs text-muted-foreground mt-1 font-mono">
                                {t('rt.route')} <span class="text-blue-600 dark:text-blue-400">/academic/campaign/transaction/teach-decree</span>
                            </p>
                        </div>
                    </div>
                </div>

                <div class="bg-card rounded-md p-10 border border-border shadow-2xs flex flex-col items-center justify-center text-center min-h-[320px]">
                    <div class="size-14 rounded-md bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/80 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4 shadow-xs">
                        <svg class="size-7" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect width="18" height="18" x="3" y="3" rx="2" />
                            <path d="M3 9h18" />
                            <path d="M9 21V9" />
                        </svg>
                    </div>
                    <h3 class="text-base font-bold text-foreground mb-1.5 font-mono">
                        {t('rt.teachDecreeWorkspace')}
                    </h3>
                    <p class="text-xs text-muted-foreground max-w-md font-mono leading-relaxed">
                        {t('rt.dataManagementRegistryEntitiesAndOperational2')}
                    </p>
                </div>
            </main>
        </div>
    );
}
