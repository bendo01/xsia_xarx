import { createSignal, createEffect, onMount, JSX, Show } from 'solid-js';
import { useLocation, useNavigate } from '@solidjs/router';
import { isServer } from 'solid-js/web';
import {
    canAccessRoute,
    setActiveRole,
    refreshAuthState,
    activeRoleSignal,
    isAuthenticatedSignal
} from '~/lib/authStore';
import { toast } from '~/components/toast/Toaster';

export default function RouteGuard(props: { children: JSX.Element }) {
    const location = useLocation();
    const navigate = useNavigate();
    const [isChecking, setIsChecking] = createSignal(true);
    const [isAllowed, setIsAllowed] = createSignal(false);
    let lastToastPath = '';

    const evaluateRoute = () => {
        if (isServer) {
            setIsAllowed(true);
            setIsChecking(false);
            return;
        }

        refreshAuthState();
        const currentPath = location.pathname;
        const check = canAccessRoute(currentPath);

        if (check.allowed) {
            if (check.switchRole) {
                setActiveRole(check.switchRole.id);
            }
            setIsAllowed(true);
            setIsChecking(false);
        } else {
            setIsAllowed(false);
            setIsChecking(true);

            if (check.reason === 'unauthorized') {
                if (lastToastPath !== currentPath) {
                    lastToastPath = currentPath;
                    toast.danger('Access Denied: You do not have permission to access this page.');
                }
            } else if (check.reason === 'unauthenticated') {
                if (lastToastPath !== currentPath) {
                    lastToastPath = currentPath;
                    toast.warning('Please sign in to access this page.');
                }
            }

            if (check.redirectTo) {
                navigate(check.redirectTo, { replace: true });
            }
        }
    };

    onMount(() => {
        evaluateRoute();
    });

    createEffect(() => {
        // Re-evaluate whenever pathname or auth signals update
        location.pathname;
        activeRoleSignal();
        isAuthenticatedSignal();
        evaluateRoute();
    });

    return (
        <Show
            when={!isChecking() && isAllowed()}
            fallback={
                <div class="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900">
                    <div class="flex flex-col items-center gap-3 text-xs text-neutral-500 font-mono">
                        <div class="size-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        <span>Verifying access permissions...</span>
                    </div>
                </div>
            }
        >
            {props.children}
        </Show>
    );
}
