import { onMount } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { isAuthenticated, getDashboardPathForRole, getActiveRole, refreshAuthState } from '~/lib/authStore';

export default function Home() {
    const navigate = useNavigate();

    onMount(() => {
        refreshAuthState();
        if (isAuthenticated()) {
            navigate(getDashboardPathForRole(getActiveRole()), { replace: true });
        } else {
            navigate('/authentification/login', { replace: true });
        }
    });

    return (
        <div class="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900">
            <div class="flex items-center gap-2 text-sm text-neutral-500 font-mono">
                <span class="size-2 rounded-full bg-blue-500 animate-ping"></span>
                <span>Loading XSIA XARX...</span>
            </div>
        </div>
    );
}
