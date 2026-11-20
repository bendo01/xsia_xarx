// The server middleware chain (wired via `start.middleware` in
// vite.config.ts). Each function is `(event, next) => Response`: the request
// is `event.request`, and `next()` takes no arguments. The chain fronts every
// request the server dispatches — page renders, server function calls, and
// API routes alike — and runs inside the request-event scope, so
// getRequestEvent() and the session helpers work here as in application code.
import type { StartMiddleware } from '@solidjs/vite-plugin';
import { createAPIHandler } from 'filesystem-routing/api';
import routes from 'virtual:file-routes';

import {
  evaluateRouteAccess,
  getDashboardPathForRole,
  getRequiredRoleForPath,
  guestOnlyRedirect,
  isAuthOnlyPath,
} from './lib/roles';
import { applyRoleSwitch, getAuth } from './server/auth';
import { serializeSession } from './server/session';

function redirectTo(location: string, cookie?: string): Response {
  const headers = new Headers({ Location: location });
  if (cookie) headers.append('Set-Cookie', cookie);
  return new Response(null, { status: 302, headers });
}

/**
 * Role-area guard, the server-side replacement for client RouteGuard:
 * /administrator, /student, ... require a signed-in user holding that role.
 * Everything else (/, /authentification/*, server functions, API) passes.
 * Server functions and the Rust API still authorise on their own; this is the
 * navigation gate, not the only one.
 */
const authGuard: StartMiddleware = async (event, next) => {
  const url = new URL(event.request.url);
  const requiresRole = getRequiredRoleForPath(url.pathname) ?? (isAuthOnlyPath(url.pathname) ? 'any' : null);
  const isLoginPage = url.pathname.startsWith('/authentification/login');
  if (!requiresRole && !isLoginPage) return next();

  const auth = await getAuth();
  if (!requiresRole) {
    const away = guestOnlyRedirect(url.pathname, auth);
    return away ? redirectTo(away) : next();
  }
  const access = evaluateRouteAccess(url.pathname + url.search, auth);

  if (access.switchRole) {
    // Multi-role user landing in another role's area: switch, then retry.
    try {
      const next_ = await applyRoleSwitch(access.switchRole.id);
      return redirectTo(url.pathname + url.search, await serializeSession(next_));
    } catch {
      /* switch refused: send them to their own dashboard */
    }
    return redirectTo(
      getDashboardPathForRole(auth.activeRole, {
        role: auth.activeRoleItem,
        roles: auth.roles,
        user: auth.user,
        defaultInstitutionId: auth.defaultInstitutionId,
      }),
    );
  }
  if (!access.allowed) return redirectTo(access.redirectTo ?? '/');
  return next();
};

// createAPIHandler serves the GET/POST/... exports of route modules
// (see src/routes/api) and passes everything else down the chain.
export default [authGuard, createAPIHandler(routes)] satisfies StartMiddleware[];
