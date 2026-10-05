import { A } from '@solidjs/router';
import { t } from '../../i18n';

export default function MenuGuest() {
    return (
        <ul class="space-y-1">
            {/* Home Portal */}
            <li>
                <A
                    href="/"
                    activeClass="bg-blue-600/15 text-blue-600 dark:text-blue-400 font-semibold"
                    class="flex items-center gap-x-3 py-2 px-2.5 text-sm rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                    <svg class="size-4 shrink-0 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                    <span>{t('menu.guest.home')}</span>
                </A>
            </li>

            {/* Authentication Flows */}
            <li class="pt-2 pb-1">
                <span class="px-2.5 text-[11px] font-bold tracking-wider text-neutral-400 dark:text-neutral-500 uppercase font-mono">
                    {t('menu.guest.authentication')}
                </span>
            </li>
            {/* Session Login (Default) */}
            <li>
                <A
                    href="/authentification/login_with_session"
                    activeClass="bg-emerald-600/15 text-emerald-600 dark:text-emerald-400 font-semibold"
                    class="flex items-center justify-between py-2 px-2.5 text-sm text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-emerald-50 dark:hover:bg-neutral-800 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                >
                    <div class="flex items-center gap-x-3">
                        <svg class="size-4 shrink-0 text-emerald-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            <path d="m9 12 2 2 4-4" />
                        </svg>
                        <span>{t('menu.guest.sessionSignIn')}</span>
                    </div>
                    <span class="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        DEFAULT
                    </span>
                </A>
            </li>
            {/* Account Acquisition */}
            <li>
                <A
                    href="/authentification/account-acquisition-request"
                    activeClass="bg-teal-600/15 text-teal-600 dark:text-teal-400 font-semibold"
                    class="flex items-center gap-x-3 py-2 px-2.5 text-sm text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-teal-50 dark:hover:bg-neutral-800 hover:text-teal-600 dark:hover:text-teal-400 transition-colors"
                >
                    <svg class="size-4 shrink-0 text-teal-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <line x1="19" y1="8" x2="19" y2="14" />
                        <line x1="22" y1="11" x2="16" y2="11" />
                    </svg>
                    <span>{t('menu.guest.accountAcquisition')}</span>
                </A>
            </li>
            {/* Forgot Password */}
            <li>
                <A
                    href="/authentification/forgot-password"
                    activeClass="bg-amber-600/15 text-amber-600 dark:text-amber-400 font-semibold"
                    class="flex items-center gap-x-3 py-2 px-2.5 text-sm text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-amber-50 dark:hover:bg-neutral-800 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                >
                    <svg class="size-4 shrink-0 text-amber-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        <circle cx="12" cy="16" r="1" />
                    </svg>
                    <span>{t('menu.guest.forgotPassword')}</span>
                </A>
            </li>
            {/* Verify Account
            <li>
                <A
                    href="/authentification/verify"
                    activeClass="bg-cyan-600/15 text-cyan-600 dark:text-cyan-400 font-semibold"
                    class="flex items-center gap-x-3 py-2 px-2.5 text-sm text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-cyan-50 dark:hover:bg-neutral-800 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
                >
                    <svg class="size-4 shrink-0 text-cyan-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="9 12 12 15 16 10" />
                    </svg>
                    <span>{t('menu.guest.verifyAccount')}</span>
                </A>
            </li>
             */}
            {/* Password Reset */}
            <li>
                <A
                    href="/authentification/password-reset"
                    activeClass="bg-purple-600/15 text-purple-600 dark:text-purple-400 font-semibold"
                    class="flex items-center gap-x-3 py-2 px-2.5 text-sm text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-purple-50 dark:hover:bg-neutral-800 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                >
                    <svg class="size-4 shrink-0 text-purple-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 2v6h-6" />
                        <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                        <path d="M3 22v-6h6" />
                        <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
                    </svg>
                    <span>{t('menu.guest.passwordReset')}</span>
                </A>
            </li>
            {/* Standard JWT Login 
            <li>
                <A
                    href="/authentification/login"
                    activeClass="bg-blue-600/15 text-blue-600 dark:text-blue-400 font-semibold"
                    class="flex items-center gap-x-3 py-2 px-2.5 text-sm text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-blue-50 dark:hover:bg-neutral-800 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                    <svg class="size-4 shrink-0 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                        <polyline points="10 17 15 12 10 7" />
                        <line x1="15" x2="3" y1="12" y2="12" />
                    </svg>
                    <span>{t('menu.guest.jwtSignIn')}</span>
                </A>
            </li>
            */}

            {/* Information */}
            {/* 
            <li class="pt-3 pb-1">
                <span class="px-2.5 text-[11px] font-bold tracking-wider text-neutral-400 dark:text-neutral-500 uppercase font-mono">
                    {t('menu.guest.publicInfo')}
                </span>
            </li>
            <li>
                <A 
                    href="/institution/master/institution" 
                    class="flex items-center gap-x-3 py-2 px-2.5 text-sm text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                    <svg class="size-4 shrink-0 text-indigo-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect width="16" height="20" x="4" y="2" rx="2" ry="2"/>
                        <path d="M9 22v-4h6v4"/>
                    </svg>
                    <span>{t('menu.guest.institutionProfile')}</span>
                </A>
            </li>
            <li>
                <A 
                    href="/academic/candidate/reference/phase" 
                    class="flex items-center gap-x-3 py-2 px-2.5 text-sm text-neutral-700 dark:text-neutral-300 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                    <svg class="size-4 shrink-0 text-amber-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                        <circle cx="9" cy="7" r="4"/>
                        <path d="M19 8v6M22 11h-6"/>
                    </svg>
                    <span>{t('menu.guest.admissionsPmb')}</span>
                </A>
            </li>
            */}
        </ul>
    );
}
