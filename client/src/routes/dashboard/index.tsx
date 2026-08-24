import { onMount } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { getActiveRole, getDashboardPathForRole, refreshAuthState, isAuthenticatedSignal } from '../../lib/authStore';

export default function DashboardIndex() {
    const navigate = useNavigate();

    onMount(() => {
        refreshAuthState();
        if (!isAuthenticatedSignal()) {
            navigate('/authentification/login', { replace: true });
            return;
        }

        const activeRole = getActiveRole();
        const targetPath = getDashboardPathForRole(activeRole);
        navigate(targetPath, { replace: true });
    });

    return (
        <div class="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900">
            <div class="flex flex-col items-center gap-3">
                <div class="animate-spin size-8 border-3 border-blue-600 border-t-transparent rounded-full"></div>
                <p class="text-xs text-neutral-500 font-mono">Redirecting to your role workspace...</p>
            </div>
        </div>
    );
}
