import { Title } from '@solidjs/meta';
import { Show, createSignal } from 'solid-js';
import { toast } from 'solid-sonner';
import { env } from 'virtual:solid-env/client';

import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { t } from '../../i18n';
import { changePassword } from '../../lib/auth';

export default function ChangePassword() {
  const [current, setCurrent] = createSignal('');
  const [next, setNext] = createSignal('');
  const [confirm, setConfirm] = createSignal('');
  const [pending, setPending] = createSignal(false);
  const [error, setError] = createSignal<string | null>(null);

  const submit = async (e: SubmitEvent) => {
    e.preventDefault();
    if (!current() || !next() || !confirm()) return setError(t('au.semuaKolomHarusDiisi'));
    if (next().length < 6) return setError(t('au.minimal6Karakter'));
    if (next() !== confirm()) return setError(t('au.kataSandiTidakCocok'));

    setPending(true);
    setError(null);
    try {
      const res = await changePassword(current(), next());
      toast.success(res.message || t('au.kataSandiBerhasilDiubah'));
      setCurrent('');
      setNext('');
      setConfirm('');
    } catch (err) {
      const msg = (err as Error).message || t('au.networkError');
      setError(msg);
      toast.error(msg);
    } finally {
      setPending(false);
    }
  };

  return (
    <div class="mx-auto max-w-lg">
      <Title>{`${t('au.ubahKataSandi')} - ${env.VITE_APP_NAME}`}</Title>
      <div class="rounded-xs border border-card-line bg-card shadow-2xs">
        <div class="border-b border-card-line px-5 py-4">
          <h1 class="text-lg font-semibold text-foreground">{t('au.ubahKataSandi')}</h1>
          <p class="mt-1 text-sm text-muted-foreground-1">{t('au.ubahKataSandiDeskripsi')}</p>
        </div>
        <form onSubmit={submit} class="space-y-4 p-5">
          <Show when={error()}>
            <p role="alert" class="rounded-xs border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{error()}</p>
          </Show>
          <div class="space-y-1.5">
            <Label for="current">{t('au.kataSandiSaatIni')}</Label>
            <Input id="current" type="password" autocomplete="current-password" value={current()} onInput={(e) => setCurrent(e.currentTarget.value)} />
          </div>
          <div class="space-y-1.5">
            <Label for="next">{t('au.kataSandiBaru')}</Label>
            <Input id="next" type="password" autocomplete="new-password" value={next()} onInput={(e) => setNext(e.currentTarget.value)} />
          </div>
          <div class="space-y-1.5">
            <Label for="confirm">{t('au.ulangiKataSandi')}</Label>
            <Input id="confirm" type="password" autocomplete="new-password" value={confirm()} onInput={(e) => setConfirm(e.currentTarget.value)} />
          </div>
          <Button type="submit" disabled={pending()}>
            {pending() ? t('au.memproses') : t('common.save')}
          </Button>
        </form>
      </div>
    </div>
  );
}
