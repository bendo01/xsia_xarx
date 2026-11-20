import { Title } from '@solidjs/meta';
import type { RouteDefinition } from '@solidjs/router';
import { Show, createMemo } from 'solid-js';
import { env } from 'virtual:solid-env/client';

import { signOutAction, getAuthState } from '../lib/auth';
import { LOGIN_PATH, getDashboardPathForRole } from '../lib/roles';

export const route = {
  preload: () => {
    void getAuthState();
  },
} satisfies RouteDefinition;

export default function Home() {
  const auth = createMemo(() => getAuthState());

  return (
    <main class="mx-auto max-w-md p-8 text-center">
      <Title>{env.VITE_APP_NAME}</Title>
      <h1 class="text-3xl font-bold">{env.VITE_APP_NAME}</h1>
      <Show
        when={auth().authenticated}
        fallback={
          <a class="mt-6 inline-block rounded-xs bg-slate-900 px-4 py-2 text-white" href={LOGIN_PATH}>
            Masuk
          </a>
        }
      >
        <p class="mt-4">{auth().user?.name}</p>
        <a
          class="mt-4 inline-block rounded-xs bg-slate-900 px-4 py-2 text-white"
          href={getDashboardPathForRole(auth().activeRole, {
            role: auth().activeRoleItem,
            roles: auth().roles,
            user: auth().user,
            defaultInstitutionId: auth().defaultInstitutionId,
          })}
        >
          Dashboard
        </a>
        <form action={signOutAction} method="post" class="mt-4">
          <button type="submit" class="underline">
            Keluar
          </button>
        </form>
      </Show>
    </main>
  );
}
