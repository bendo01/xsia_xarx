import { BookOpen, GraduationCap, House, Lock, LockOpen, Presentation, Printer, User, Users } from '@lucide/solid';

import type { IconName } from '../../lib/menu';

export function Icon(props: { name: IconName; class?: string }) {
  const cls = () => props.class ?? 'size-4 shrink-0';
  switch (props.name) {
    case 'user': return <User class={cls()} />;
    case 'users': return <Users class={cls()} />;
    case 'book': return <BookOpen class={cls()} />;
    case 'graduation': return <GraduationCap class={cls()} />;
    case 'lock': return <Lock class={cls()} />;
    case 'unlock': return <LockOpen class={cls()} />;
    case 'printer': return <Printer class={cls()} />;
    case 'home': return <House class={cls()} />;
    case 'chalkboard': return <Presentation class={cls()} />;
  }
}
