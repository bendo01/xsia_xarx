import { t } from '../../i18n';
import { Icon } from '../shell/icons';
import { Badge } from '../ui/badge';

/** Lock state of a semester or course: a padlock (closed when locked, open when not) plus the word. */
export default function LockStatus(props: { locked: boolean }) {
  return (
    <Badge variant={props.locked ? 'secondary' : 'success'} class="gap-1">
      <Icon name={props.locked ? 'lock' : 'unlock'} class="size-3 shrink-0" />
      {props.locked ? t('st.locked') : t('st.unlocked')}
    </Badge>
  );
}
