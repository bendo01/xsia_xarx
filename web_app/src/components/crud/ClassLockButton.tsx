import { revalidate } from '@solidjs/router';
import { Show, createMemo, createSignal } from 'solid-js';
import { toast } from 'solid-sonner';

import { t } from '../../i18n';
import { getProdiRights, lockClassRow } from '../../lib/crud';
import { crudErrorText } from '../../lib/crud-errors';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';

/** Lock / unlock a teaching class. Locking asks first because it freezes grades, attendance and enrollment. */
export default function ClassLockButton(props: { teachId: string; locked: boolean }) {
  const [open, setOpen] = createSignal(false);
  const [busy, setBusy] = createSignal(false);
  const rights = createMemo(() => getProdiRights());

  const run = async () => {
    setBusy(true);
    try {
      await lockClassRow(props.teachId, !props.locked);
      setOpen(false);
      toast.success(t(props.locked ? 'cd.classUnlocked' : 'cd.classLockedDone'));
      await revalidate();
    } catch (e) {
      toast.error(crudErrorText(e, 'cd.saveFailed'));
    } finally {
      setBusy(false);
    }
  };
  const btn = 'rounded-xs border border-layer-line bg-layer px-3 py-1.5 text-sm font-medium hover:bg-layer-hover';

  return (
    <Show when={rights().canLockClass}>
      <button type="button" class={btn} onClick={() => (props.locked ? void run() : setOpen(true))} disabled={busy()}>
        {props.locked ? t('cd.unlockClass') : t('cd.lockClass')}
      </button>
      <Dialog open={open()} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('cd.lockClassTitle')}</DialogTitle>
            <DialogDescription>{t('cd.lockClassBody')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose class={btn}>{t('cd.cancel')}</DialogClose>
            <button type="button" disabled={busy()} onClick={() => void run()} class="rounded-xs bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">
              {t('cd.lockClass')}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Show>
  );
}
