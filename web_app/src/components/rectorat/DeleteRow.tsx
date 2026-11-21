import { revalidate } from '@solidjs/router';
import { createSignal } from 'solid-js';
import { toast } from 'solid-sonner';

import { t } from '../../i18n';
import { crudErrorText } from '../../lib/crud-errors';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';

/** Delete with a confirmation dialog; the list refreshes afterwards. */
export default function DeleteRow(props: { remove: () => Promise<void> }) {
  const [open, setOpen] = createSignal(false);
  const [busy, setBusy] = createSignal(false);
  const run = async () => {
    setBusy(true);
    try {
      await props.remove();
      setOpen(false);
      toast.success(t('cd.recordDeleted'));
      await revalidate();
    } catch (e) {
      toast.error(crudErrorText(e, 'cd.deleteFailed'));
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} class="text-sm font-medium text-destructive hover:underline">{t('cd.delete')}</button>
      <Dialog open={open()} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('cd.deleteTitle')}</DialogTitle>
            <DialogDescription>{t('cd.deleteBody')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose class="rounded-xs border border-layer-line bg-layer px-3 py-1.5 text-sm hover:bg-layer-hover">{t('cd.cancel')}</DialogClose>
            <button type="button" disabled={busy()} onClick={() => void run()} class="rounded-xs bg-destructive px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50">{t('cd.delete')}</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
