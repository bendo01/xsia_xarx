import { revalidate, useNavigate } from '@solidjs/router';
import { createSignal } from 'solid-js';
import { toast } from 'solid-sonner';

import { t } from '../../i18n';
import { crudErrorText } from '../../lib/crud-errors';
import { deleteChildRow, deleteRow } from '../../lib/crud';
import { BASE, childBase, isChild } from '../../lib/crud-forms';
import type { ResourceKey } from '../../lib/crud-schema';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';

/** Delete with a confirmation dialog; afterwards goes back to the list. */
export default function DeleteButton(props: { resource: ResourceKey; id: string; parentId?: string; class?: string }) {
  const navigate = useNavigate();
  const [open, setOpen] = createSignal(false);
  const [busy, setBusy] = createSignal(false);

  const run = async () => {
    setBusy(true);
    try {
      const key = props.resource;
      if (isChild(key)) await deleteChildRow(key, props.parentId ?? '', props.id);
      else await deleteRow(key, props.id);
      setOpen(false);
      toast.success(t('cd.recordDeleted'));
      await revalidate();
      if (isChild(props.resource)) navigate(childBase(props.resource, props.parentId ?? ''));
      else navigate(BASE[props.resource]);
    } catch (e) {
      toast.error(crudErrorText(e, 'cd.deleteFailed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} class={props.class ?? 'rounded-xs border border-destructive/40 px-3 py-1.5 text-sm font-medium text-destructive hover:bg-destructive/10'}>
        {t('cd.delete')}
      </button>
      <Dialog open={open()} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('cd.deleteTitle')}</DialogTitle>
            <DialogDescription>{t('cd.deleteBody')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose class="rounded-xs border border-layer-line bg-layer px-3 py-1.5 text-sm hover:bg-layer-hover">{t('cd.cancel')}</DialogClose>
            <button type="button" disabled={busy()} onClick={() => void run()} class="rounded-xs bg-destructive px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50">
              {t('cd.delete')}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
