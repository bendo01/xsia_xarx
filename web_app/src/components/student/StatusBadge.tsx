import { statusTone, TONE_CLASS } from '../../lib/status-tone';
import { Badge } from '../ui/badge';

/** A student status as a coloured badge (green active, blue graduated, amber leave, red left, ...). */
export default function StatusBadge(props: { name?: string | null }) {
  return (
    <Badge variant="outline" class={['border-transparent whitespace-nowrap', TONE_CLASS[statusTone(props.name)]].join(' ')}>
      {props.name || '-'}
    </Badge>
  );
}
