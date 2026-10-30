import { createSignal, Show } from 'solid-js';
import TopBar from '~/components/navigation/TopBar';
import { toast } from '~/components/toast/Toaster';
import { changePassword } from '~/controllers/auth/AuthUser';
import { t } from '../../i18n';

export default function ChangePasswordPage() {
    const [currentPassword, setCurrentPassword] = createSignal('');
    const [newPassword, setNewPassword] = createSignal('');
    const [confirmPassword, setConfirmPassword] = createSignal('');
    const [showPassword, setShowPassword] = createSignal(false);
    const [isLoading, setIsLoading] = createSignal(false);
    const [errorMessage, setErrorMessage] = createSignal<string | null>(null);

    const inputClass = 'w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white placeholder-neutral-400 px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all text-sm';

    const handleSubmit = async (e: SubmitEvent) => {
        e.preventDefault();
        setErrorMessage(null);

        if (!currentPassword() || !newPassword() || !confirmPassword()) {
            setErrorMessage(t('au.semuaKolomHarusDiisi'));
            return;
        }
        if (newPassword() !== confirmPassword()) {
            setErrorMessage(t('au.kataSandiTidakCocok'));
            return;
        }
        if (newPassword() === currentPassword()) {
            setErrorMessage(t('au.kataSandiBaruHarusBerbeda'));
            return;
        }

        setIsLoading(true);
        const res = await changePassword(currentPassword(), newPassword());
        setIsLoading(false);

        if (res.code === 200) {
            toast.success(res.message || t('au.kataSandiBerhasilDiubah'));
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } else {
            setErrorMessage(res.message);
            toast.danger(res.message);
        }
    };

    return (
        <div class="min-h-screen bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 flex flex-col">
            <TopBar />

            <main class="flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
                <div class="border-b border-neutral-200 dark:border-neutral-800 pb-4">
                    <h1 class="text-xl font-bold">{t('au.ubahKataSandi')}</h1>
                    <p class="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{t('au.ubahKataSandiDeskripsi')}</p>
                </div>

                <form
                    onSubmit={handleSubmit}
                    class="w-full max-w-lg space-y-4 p-6 bg-white dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-800 rounded-lg"
                >
                    <Show when={errorMessage()}>
                        <div class="p-3 bg-red-50 dark:bg-red-500/15 border border-red-500/30 rounded-lg text-red-700 dark:text-red-200 text-xs font-medium">
                            {errorMessage()}
                        </div>
                    </Show>

                    <div class="space-y-1">
                        <label class="block text-xs font-medium px-1">{t('au.kataSandiSaatIni')}</label>
                        <input
                            type={showPassword() ? 'text' : 'password'}
                            autocomplete="current-password"
                            placeholder={t('au.masukkanKataSandiSaatIni')}
                            required
                            value={currentPassword()}
                            onInput={(e) => setCurrentPassword(e.currentTarget.value)}
                            class={inputClass}
                        />
                    </div>

                    <div class="space-y-1">
                        <label class="block text-xs font-medium px-1">{t('au.kataSandiBaru')}</label>
                        <input
                            type={showPassword() ? 'text' : 'password'}
                            autocomplete="new-password"
                            placeholder={t('au.minimal6Karakter')}
                            required
                            minlength={6}
                            value={newPassword()}
                            onInput={(e) => setNewPassword(e.currentTarget.value)}
                            class={inputClass}
                        />
                    </div>

                    <div class="space-y-1">
                        <label class="block text-xs font-medium px-1">{t('au.konfirmasiKataSandi')}</label>
                        <input
                            type={showPassword() ? 'text' : 'password'}
                            autocomplete="new-password"
                            placeholder={t('au.ulangiKataSandi')}
                            required
                            minlength={6}
                            value={confirmPassword()}
                            onInput={(e) => setConfirmPassword(e.currentTarget.value)}
                            class={inputClass}
                        />
                    </div>

                    <label class="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={showPassword()}
                            onChange={(e) => setShowPassword(e.currentTarget.checked)}
                        />
                        <span>{t('au.tampilkanKataSandi')}</span>
                    </label>

                    <button
                        type="submit"
                        disabled={isLoading()}
                        class="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 px-4 rounded-lg transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading() ? t('au.memproses') : t('au.ubahKataSandi')}
                    </button>
                </form>
            </main>
        </div>
    );
}
