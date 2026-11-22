import { Title } from '@solidjs/meta';
import type { RouteDefinition } from '@solidjs/router';
import { useParams } from '@solidjs/router';
import { Errored, For, Show, createEffect, createMemo, createSignal, onCleanup, onSettled } from 'solid-js';
import { toast } from 'solid-sonner';
import { env } from 'virtual:solid-env/client';

import QrDisplay from '../../../../../../../components/lecturer/QrDisplay';
import PageHeader from '../../../../../../../components/student/PageHeader';
import { Dialog, DialogClose, DialogContent, DialogTitle } from '../../../../../../../components/ui/dialog';
import { t } from '../../../../../../../i18n';
import { crudErrorText } from '../../../../../../../lib/crud-errors';
import { fetchRoster, getMeetings, nextQr, saveAttendance, startQr, stopQr } from '../../../../../../../lib/attendance';
import type { AttendTypeOption, MeetingItem, QrToken, RosterItem } from '../../../../../../../lib/attendance-types';
import { openMeetingFeed } from '../../../../../../../lib/realtime-client';

export const route = {
  preload: ({ params }) => {
    void getMeetings(params.id as string);
  },
} satisfies RouteDefinition;

const base = '/lecturer/academic/campaign/transaction/teach';
const card = 'rounded-xs border border-card-line bg-card shadow-2xs';
const btn = 'rounded-xs border border-layer-line bg-layer px-3 py-1.5 text-sm font-medium hover:bg-layer-hover disabled:opacity-50';
const msg = (e: unknown) => crudErrorText(e, 'lc.attLoadFailed');

/** Attendance for one class: pick a meeting, mark the roster, optionally run a rotating QR session. */
export default function LecturerTeachAttendance() {
  const params = useParams();
  const teachId = () => params.id as string;
  const meetings = createMemo(() => getMeetings(teachId()));

  return (
    <Errored
      fallback={(err) => (
        <div role="alert" class="rounded-xs border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          <p class="font-medium">{t('lc.attLoadFailed')}</p>
          <p class="mt-1 opacity-80">{(err() as Error).message}</p>
        </div>
      )}
    >
      <Title>{`${t('lc.presensiRoster')} - ${env.VITE_APP_NAME}`}</Title>
      <PageHeader
        title={t('lc.presensiRoster')}
        actions={
          <>
            <a href={base} class={btn}>{t('lc.kembaliKeDaftarKelas')}</a>
            <a href={`${base}/${encodeURIComponent(teachId())}/grade`} class={btn}>{t('lc.nilaiMahasiswa2')}</a>
            <a href={`/api/lecturer/print/attendance/${encodeURIComponent(teachId())}?filled=false`} target="_blank" rel="noopener" class={btn}>{t('lc.attPrintBlank')}</a>
            <a href={`/api/lecturer/print/attendance/${encodeURIComponent(teachId())}?filled=true`} target="_blank" rel="noopener" class={btn}>{t('lc.attPrintFilled')}</a>
          </>
        }
      />
      {/* Read the (possibly still pending) query inside a tracking scope; Board only mounts once it has landed. */}
      <Show when={meetings()}>{(m) => <Board meetings={m().meetings} locked={m().locked} teachId={teachId()} />}</Show>
    </Errored>
  );
}

function Board(props: { meetings: MeetingItem[]; locked: boolean; teachId: string }) {
  const [meetings, setMeetings] = createSignal<MeetingItem[]>(() => props.meetings);
  const [activeId, setActiveId] = createSignal('');
  const [roster, setRoster] = createSignal<RosterItem[]>([]);
  const [types, setTypes] = createSignal<AttendTypeOption[]>([]);
  const [dirty, setDirty] = createSignal<Map<string, string>>(new Map());
  const [loading, setLoading] = createSignal(true);
  const [saving, setSaving] = createSignal(false);
  const [live, setLive] = createSignal(false);
  const [qr, setQr] = createSignal<QrToken | null>(null);
  const [secondsLeft, setSecondsLeft] = createSignal(0);
  const [fullscreen, setFullscreen] = createSignal(false);
  const [qrSize, setQrSize] = createSignal(256);

  let qrTimer: ReturnType<typeof setTimeout> | undefined;
  let tick: ReturnType<typeof setInterval> | undefined;
  const stopTimers = () => {
    clearTimeout(qrTimer);
    clearInterval(tick);
  };
  onCleanup(stopTimers);

  const active = createMemo(() => meetings().find((m) => m.id === activeId()) ?? null);
  const presentType = () => types().find((a) => a.alphabet_code.trim().toUpperCase() === 'H');
  const presentCount = () => roster().filter((r) => r.attend_type_id && r.attend_type_id === presentType()?.id).length;
  const meetingLabel = () => {
    const m = active();
    if (!m) return '';
    const kind = m.meeting_type === 'midterm' ? ` (${t('lc.attMidtermShort')})` : m.meeting_type === 'final' ? ` (${t('lc.attFinalShort')})` : '';
    return `${t('lc.attMeeting')} ${m.sequence}${kind}`;
  };

  const loadRoster = async (id: string, keepDirty = false) => {
    try {
      const r = await fetchRoster(id);
      if (id !== activeId()) return;
      setTypes(r.attend_types);
      const pending = keepDirty ? dirty() : new Map<string, string>();
      setRoster(r.entries.map((e) => (pending.has(e.student_id) ? { ...e, attend_type_id: pending.get(e.student_id)! } : e)));
      if (!keepDirty) setDirty(new Map());
    } catch (e) {
      toast.error(msg(e));
      setRoster([]);
    }
  };

  const rotateQr = (token: QrToken) => {
    stopTimers();
    setQr(token);
    setSecondsLeft(token.expires_in);
    tick = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    qrTimer = setTimeout(async () => {
      const id = activeId();
      try {
        const next = await nextQr(id);
        if (id === activeId()) rotateQr(next);
      } catch (e) {
        if (id !== activeId()) return;
        stopTimers();
        setQr(null);
        toast.warning(msg(e));
      }
    }, Math.max(1, token.expires_in) * 1000);
  };

  const select = async (id: string) => {
    if (id === activeId()) return;
    stopTimers();
    setQr(null);
    setActiveId(id);
    setLoading(true);
    await loadRoster(id);
    // A QR session may already be open for this meeting.
    if (active()?.is_qr_open) {
      try {
        const token = await nextQr(id);
        if (id === activeId()) rotateQr(token);
      } catch {
        /* session expired meanwhile */
      }
    }
    setLoading(false);
  };

  onSettled(() => {
    const first = props.meetings.find((m) => m.is_qr_open) ?? props.meetings[0];
    if (first) void select(first.id);
    else setLoading(false);
  });

  // Live updates for the open meeting (QR scans, edits from another device).
  createEffect(
    () => activeId(),
    (id) => {
      if (!id) return;
      const feed = openMeetingFeed(id, {
        onStatus: setLive,
        onEvent: (e) => {
          if (e.kind === 'resync') return void loadRoster(id, true);
          // Never overwrite a status the lecturer is editing right now.
          if (dirty().has(e.studentId)) return;
          setRoster((list) =>
            list.map((r) => (r.student_id === e.studentId ? { ...r, attend_type_id: e.attendTypeId, method: e.method } : r)),
          );
        },
      });
      return () => feed.close();
    },
  );

  const setType = (studentId: string, typeId: string) => {
    if (!typeId) return;
    setRoster((list) => list.map((r) => (r.student_id === studentId ? { ...r, attend_type_id: typeId } : r)));
    setDirty((m) => new Map(m).set(studentId, typeId));
  };

  const markAll = () => {
    const present = presentType();
    if (!present) return void toast.warning(t('lc.attPresentTypeMissing'));
    for (const r of roster()) if (r.attend_type_id !== present.id) setType(r.student_id, present.id);
  };

  const save = async () => {
    const id = activeId();
    const entries = [...dirty().entries()].map(([student_id, attend_type_id]) => ({ student_id, attend_type_id }));
    if (!id || entries.length === 0) return;
    setSaving(true);
    try {
      await saveAttendance(props.teachId, id, entries);
      toast.success(t('lc.attSaved'));
      setDirty(new Map());
    } catch (e) {
      toast.error(msg(e));
    } finally {
      setSaving(false);
    }
  };

  const openQr = async () => {
    const id = activeId();
    try {
      const token = await startQr(props.teachId, id);
      setMeetings((l) => l.map((m) => (m.id === id ? { ...m, is_qr_open: true } : m)));
      rotateQr(token);
    } catch (e) {
      toast.error(msg(e));
    }
  };

  const closeQr = async () => {
    const id = activeId();
    stopTimers();
    setQr(null);
    try {
      await stopQr(id);
    } catch (e) {
      toast.error(msg(e));
    }
    setMeetings((l) => l.map((m) => (m.id === id ? { ...m, is_qr_open: false } : m)));
  };

  const showFullscreen = () => {
    setQrSize(Math.max(200, Math.floor(Math.min(window.innerWidth - 64, window.innerHeight - 220))));
    setFullscreen(true);
  };

  const methodLabel = (r: RosterItem) => (r.method === 'qr' ? t('lc.attMethodQr') : r.method === 'manual' ? t('lc.attMethodManual') : '-');
  const StatusSelect = (p: { r: RosterItem; class?: string }) => (
    <select
      value={p.r.attend_type_id ?? ''}
      disabled={props.locked}
      onChange={(e) => setType(p.r.student_id, e.currentTarget.value)}
      class={`rounded-xs border border-layer-line bg-layer ${p.class ?? ''}`}
      aria-label={`${t('lc.attStatus')}: ${p.r.student_name}`}
    >
      <option value="" disabled>{t('lc.attNotRecorded')}</option>
      <For each={types()}>{(o) => <option value={o.id}>{o.name}</option>}</For>
    </select>
  );

  return (
    <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      <section class={`${card} min-w-0 space-y-4 p-4`}>
        <Show when={props.locked}>
          <p role="status" class="rounded-xs border border-warning/40 bg-warning/10 p-3 text-sm">{t('lc.classLocked')}</p>
        </Show>
        <div class="flex items-center justify-between gap-2">
          <div class="flex gap-1.5 overflow-x-auto sm:flex-wrap" role="group" aria-label={t('lc.attMeetings')}>
            <For each={meetings()}>
              {(m) => (
                <button
                  type="button"
                  aria-pressed={m.id === activeId() ? 'true' : 'false'}
                  onClick={() => void select(m.id)}
                  class={`min-w-9 shrink-0 rounded-xs border px-2.5 py-1 text-xs font-semibold ${m.id === activeId() ? 'border-primary bg-primary text-primary-foreground' : 'border-layer-line bg-layer hover:bg-layer-hover'}`}
                >
                  {m.sequence}
                  <Show when={m.meeting_type !== 'regular'}>
                    <span class="ml-1 text-[10px] opacity-80">{m.meeting_type === 'midterm' ? t('lc.attMidtermShort') : t('lc.attFinalShort')}</span>
                  </Show>
                </button>
              )}
            </For>
          </div>
          <span class="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground-1" aria-live="polite">
            <span class={`size-2 rounded-full ${live() ? 'bg-success' : 'bg-muted-foreground-1'}`} />
            {live() ? t('lc.attLive') : t('lc.attOffline')}
          </span>
        </div>

        <Show when={!loading() && active()}>
          <div class="flex flex-wrap items-center justify-between gap-2">
            <p class="text-sm text-muted-foreground-1">{meetingLabel()} · {t('lc.attPresent')} {presentCount()} / {roster().length}</p>
            <div class="flex gap-2">
              <button type="button" onClick={markAll} disabled={props.locked} class={btn}>{t('lc.attMarkAllPresent')}</button>
              <button
                type="button"
                onClick={() => void save()}
                disabled={props.locked || saving() || dirty().size === 0}
                class="rounded-xs bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {saving() ? t('lc.attSaving') : `${t('lc.attSave')}${dirty().size ? ` (${dirty().size})` : ''}`}
              </button>
            </div>
          </div>

          <Show when={roster().length > 0} fallback={<p class="py-6 text-center text-sm text-muted-foreground-1">{t('lc.attNoParticipants')}</p>}>
            <ul class="divide-y divide-card-divider">
              <For each={roster()}>
                {(r) => (
                  <li class="flex flex-wrap items-center justify-between gap-2 py-2.5">
                    <div class="min-w-0">
                      <p class="break-words text-sm font-medium">{r.student_name}</p>
                      <p class="font-mono text-xs text-muted-foreground-1">{r.student_code} · {t('lc.attVia')} {methodLabel(r)}</p>
                    </div>
                    <StatusSelect r={r} class="px-2 py-1 text-sm" />
                  </li>
                )}
              </For>
            </ul>
          </Show>
        </Show>
      </section>

      <aside class={`${card} h-fit min-w-0 space-y-3 p-4`}>
        <h2 class="text-sm font-semibold">{t('lc.attQrTitle')}</h2>
        <Show
          when={qr()}
          fallback={
            <>
              <p class="text-xs text-muted-foreground-1">{t('lc.attQrHint')}</p>
              <button type="button" onClick={() => void openQr()} disabled={props.locked || !active()} class="w-full rounded-xs bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">
                {t('lc.attQrOpen')}
              </button>
            </>
          }
        >
          {(token) => (
            <div class="space-y-3 text-center">
              <div class="flex justify-center overflow-hidden"><QrDisplay value={token().token} size={256} label={t('lc.attQrTitle')} /></div>
              <p class="text-xs text-muted-foreground-1">{t('lc.attQrRotates', { s: secondsLeft() })}</p>
              <button type="button" onClick={showFullscreen} class={`${btn} w-full`}>{t('lc.attQrFullscreen')}</button>
              <button type="button" onClick={() => void closeQr()} class="w-full rounded-xs border border-destructive/40 px-3 py-1.5 text-sm font-medium text-destructive hover:bg-destructive/10">
                {t('lc.attQrClose')}
              </button>
            </div>
          )}
        </Show>
      </aside>

      <Dialog open={fullscreen() && !!qr()} onOpenChange={setFullscreen}>
        <DialogContent class="flex h-[calc(100dvh-2rem)] max-w-none flex-col items-center justify-center gap-4 text-center">
          <DialogTitle>{active() ? meetingLabel() : t('lc.attQrTitle')}</DialogTitle>
          <Show when={qr()}>
            {(token) => (
              <>
                <div class="rounded-xs bg-white p-4 shadow-md"><QrDisplay value={token().token} size={qrSize()} label={t('lc.attQrTitle')} /></div>
                <p class="text-sm text-muted-foreground-1">{t('lc.attQrRotates', { s: secondsLeft() })} · {t('lc.attPresent')} {presentCount()} / {roster().length}</p>
              </>
            )}
          </Show>
          <DialogClose class={btn}>{t('lc.attQrCloseFullscreen')}</DialogClose>
        </DialogContent>
      </Dialog>
    </div>
  );
}
