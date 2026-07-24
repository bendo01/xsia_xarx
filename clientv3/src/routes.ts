import { lazy } from 'solid-js';
import type { RouteDefinition } from '@solidjs/router';

import Home from './pages/home';
import ReferencePage from './pages/reference_page';

export const routes: RouteDefinition[] = [
  {
    path: '/',
    component: Home,
  },
  {
    path: '/reference-page',
    component: ReferencePage,
  },
  {
    path: '**',
    component: lazy(() => import('./errors/404')),
  },
];
