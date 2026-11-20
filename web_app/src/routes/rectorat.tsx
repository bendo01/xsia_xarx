import type { ParentProps } from 'solid-js';

import AppShell from '../components/shell/AppShell';

// Layout route: wraps every page under this role's prefix in the app shell.
export default function Layout(props: ParentProps) {
  return <AppShell>{props.children}</AppShell>;
}
