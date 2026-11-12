import TopBar from '~/components/navigation/TopBar';
import { t } from '../../../../../i18n';

export default function FeederRekapitulasiIndeksprestasisementaramahasiswaPage() {
    return (
        <div class="min-h-screen bg-neutral-100 dark:bg-neutral-900 text-foreground flex flex-col">
            <TopBar />

            <main class="flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
                <div class="sm:flex sm:items-center sm:justify-between border-b border-border pb-4">
                    <div>
                        <nav class="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                            <a href="/administrator/dashboard" class="hover:text-blue-600 transition-colors">{t('ad.administrator')}</a>
                            <span>/</span>
                            <span>{t('ad.feeder')}</span>
                            <span>/</span>
                            <span>{t('ad.rekapitulasi')}</span>
                            <span>/</span>
                            <span class="font-medium text-foreground">{t('ad.indeksPrestasiSementaraMahasiswa')}</span>
                        </nav>
                        <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-mono">
                            {t('ad.indeksPrestasiSementaraMahasiswa')}
                        </h1>
                        <p class="text-sm text-muted-foreground mt-0.5">
                            {t('ad.dataManagementRegistryEntitiesAndOperational26')}
                        </p>
                    </div>
                </div>

                <div class="bg-card rounded-md p-10 border border-border shadow-2xs flex flex-col items-center justify-center text-center min-h-80">
                    <div class="size-14 rounded-md bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/80 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4 shadow-xs">
                        <svg class="size-7" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect width="18" height="18" x="3" y="3" rx="2" />
                            <path d="M3 9h18" />
                            <path d="M9 21V9" />
                        </svg>
                    </div>
                    <h3 class="text-base font-bold text-foreground mb-1.5 font-mono">
                        {t('ad.indeksPrestasiSementaraMahasiswaWorkspace')}
                    </h3>
                    <p class="text-xs text-muted-foreground max-w-md font-mono leading-relaxed">
                        {t('ad.dataManagementRegistryEntitiesAndOperational26')}
                    </p>
                </div>
            </main>
        </div>
    );
}
