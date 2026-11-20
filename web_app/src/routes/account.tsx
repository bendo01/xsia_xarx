import type { ParentProps } from 'solid-js';

import AppShell from '../components/shell/AppShell';

// Layout for pages any signed-in user may open, whatever their role.
export default function Layout(props: ParentProps) {
  return <AppShell>{props.children}</AppShell>;
}
