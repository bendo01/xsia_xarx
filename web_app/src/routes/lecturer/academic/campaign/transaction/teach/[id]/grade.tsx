import { Title } from '@solidjs/meta';
import type { RouteDefinition } from '@solidjs/router';
import { revalidate, useParams } from '@solidjs/router';
import { Errored, For, Show, createEffect, createMemo, createSignal } from 'solid-js';
import { toast } from 'solid-sonner';
import { env } from 'virtual:solid-env/client';

import PageHeader from '../../../../../../../components/student/PageHeader';
import { Badge } from '../../../../../../../components/ui/badge';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../../../../../../components/ui/dialog';
import { t } from '../../../../../../../i18n';
import { crudErrorText } from '../../../../../../../lib/crud-errors';
import { classStats, finalMark, gradeForMark, marksForGrade, totalWeight, weightsValid, type Evaluation } from '../../../../../../../lib/grading';
import { createDefaultComponents, deleteComponent, getGradeSheet, lockGrades, saveComponent, saveGrades } from '../../../../../../../lib/grading-fns';
import type { GradeSheet } from '../../../../../../../server/grading';

export const route = {
  preload: ({ params }) => {
    void getGradeSheet(params.id as string);
  },
} satisfies RouteDefinition;

const base = '/lecturer/academic/campaign/transaction/teach';
const card = 'rounded-xs border border-card-line bg-card shadow-2xs';
const btn = 'rounded-xs border border-layer-line bg-layer px-3 py-1.5 text-sm font-medium hover:bg-layer-hover disabled:opacity-50';
const primary = 'rounded-xs bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50';
const msg = (e: unknown) => (e instanceof Error ? e.message : String(e));

interface Row {
  id: string;
  name: string;
  code: string;
  locked: boolean;
  marks: Record<string, number>;
  mark: number;
  gradeId: string | null;
  dirty: boolean;
  saving: boolean;
}

/** Grade entry for one class: evaluation components, per-student marks, save and lock. */
export default function LecturerTeachGrade() {
  const params = useParams();
  const teachId = () => params.id as string;
  const sheet = createMemo(() => getGradeSheet(teachId()));

  return (
    <Errored
      fallback={(err) => (
        <div role="alert" class="rounded-xs border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          <p class="font-medium">{t('lc.gradeLoadFailed')}</p>
          <p class="mt-1 opacity-80">{(err() as Error).message}</p>
        </div>
      )}
    >
      <Title>{`${t('lc.formPenilaianMahasiswa')} - ${env.VITE_APP_NAME}`}</Title>
      <PageHeader
        title={t('lc.formPenilaianMahasiswa')}
        description={t('lc.kelolaBobotPenilaianDanInputNilai')}
        actions={
          <>
            <a href={base} class={btn}>{t('lc.kembaliKeDaftarKelas')}</a>
            <a href={`${base}/${encodeURIComponent(teachId())}/attendance`} class={btn}>{t('lc.presensiRoster2')}</a>
            <a href={`/api/lecturer/print/grade/${encodeURIComponent(teachId())}?filled=false`} target="_blank" rel="noopener" class={btn}>{t('lc.gradePrintBlank')}</a>
            <a href={`/api/lecturer/print/grade/${encodeURIComponent(teachId())}?filled=true`} target="_blank" rel="noopener" class={btn}>{t('lc.gradePrintFilled')}</a>
            <a href={`/api/lecturer/print/grade-xlsx/${encodeURIComponent(teachId())}?filled=false`} class={btn}>{t('lc.gradeExcelBlank')}</a>
            <a href={`/api/lecturer/print/grade-xlsx/${encodeURIComponent(teachId())}?filled=true`} class={btn}>{t('lc.gradeExcelFilled')}</a>
          </>
        }
      />
      <Sheet data={sheet()} teachId={teachId()} />
    </Errored>
  );
}

function Stat(props: { label: string; value: string }) {
  return (
    <div class={`${card} p-4`}>
      <p class="text-xs font-medium uppercase text-muted-foreground-1">{props.label}</p>
      <p class="mt-1 text-2xl font-semibold text-foreground">{props.value}</p>
    </div>
  );
}

function Sheet(props: { data: GradeSheet; teachId: string }) {
  const [rows, setRows] = createSignal<Row[]>([]);
  const [search, setSearch] = createSignal('');
  const [savingAll, setSavingAll] = createSignal(false);
  const [lockOpen, setLockOpen] = createSignal(false);
  const [editing, setEditing] = createSignal<Partial<Evaluation> | null>(null);
  const [compName, setCompName] = createSignal('');
  const [compWeight, setCompWeight] = createSignal(20);
  const [compBusy, setCompBusy] = createSignal(false);

  const evals = () => props.data.evaluations;
  const scale = () => props.data.scale;
  const gradeLabel = (id: string | null) => {
    const g = scale().find((s) => s.id === id);
    return g ? g.alphabet_code || g.name : '-';
  };

  // Fresh server data (first load, or after components changed) replaces the local edits.
  createEffect(
    () => props.data,
    (d) => {
      setRows(
        d.rows.map((r) => ({ id: r.detail_activity_id, name: r.name, code: r.code, locked: r.is_lock, marks: { ...r.marks }, mark: r.mark, gradeId: r.grade_id, dirty: false, saving: false })),
      );
    },
  );

  const classLocked = () => props.data.classLocked;
  const locked = () => classLocked() || (rows().length > 0 && rows().every((r) => r.locked));
  const valid = () => weightsValid(evals());
  const stats = createMemo(() => classStats(rows().map((r) => r.mark)));
  const shown = createMemo(() => {
    const q = search().toLowerCase().trim();
    return q ? rows().filter((r) => r.name.toLowerCase().includes(q) || r.code.toLowerCase().includes(q) || gradeLabel(r.gradeId).toLowerCase().includes(q)) : rows();
  });
  const dirtyCount = () => rows().filter((r) => r.dirty).length;

  const patch = (id: string, fn: (r: Row) => Row) => setRows((list) => list.map((r) => (r.id === id ? fn(r) : r)));
  const recalc = (r: Row, marks: Record<string, number>): Row => {
    const mark = finalMark(marks, evals());
    return { ...r, marks, mark, gradeId: gradeForMark(mark, scale())?.id ?? r.gradeId, dirty: true };
  };
  const setMark = (id: string, evalId: string, v: string) =>
    patch(id, (r) => recalc(r, { ...r.marks, [evalId]: Math.min(100, Math.max(0, Number(v) || 0)) }));
  const setGrade = (id: string, gradeId: string) => {
    const g = scale().find((s) => s.id === gradeId);
    if (g) patch(id, (r) => ({ ...recalc(r, marksForGrade(g, evals())), gradeId: g.id }));
  };

  const persist = async (targets: Row[]) => {
    const res = await saveGrades(props.teachId, targets.map((r) => ({ detail_activity_id: r.id, marks: r.marks })));
    const ok = new Set(res.saved);
    setRows((list) => list.map((r) => (ok.has(r.id) ? { ...r, dirty: false } : r)));
    return res;
  };

  const saveOne = async (r: Row) => {
    patch(r.id, (x) => ({ ...x, saving: true }));
    try {
      const res = await persist([r]);
      if (res.failed.length) toast.error(t('lc.failedToSaveTheGradeFor', { name: r.name }));
      else toast.success(t('lc.gradeForNameWasSavedSuccessfully', { name: r.name }));
    } catch (e) {
      toast.error(crudErrorText(e, 'lc.gagalMenyimpanKomponenEvaluasi'));
    } finally {
      patch(r.id, (x) => ({ ...x, saving: false }));
    }
  };

  const saveAll = async () => {
    const targets = rows().filter((r) => r.dirty && !r.locked);
    if (targets.length === 0) return;
    setSavingAll(true);
    try {
      const res = await persist(targets);
      if (res.failed.length === 0) toast.success(t('lc.allStudentGradesCountRecordsWere', { count: res.saved.length }));
      else toast.error(t('lc.savedSuccessFailedFailedPleaseReview', { success: res.saved.length, failed: res.failed.length }));
    } catch (e) {
      toast.error(crudErrorText(e, 'lc.gagalMenyimpanKomponenEvaluasi'));
    } finally {
      setSavingAll(false);
    }
  };

  const lock = async () => {
    setLockOpen(false);
    try {
      await lockGrades(props.teachId);
      await revalidate(getGradeSheet.keyFor(props.teachId));
      toast.success(t('lc.nilaiKelasBerhasilDikunciDanDifinalisasi'));
    } catch (e) {
      toast.error(msg(e) === 'weights' ? t('lc.gradeWeightsMustBe100') : t('lc.gagalMengunciNilaiKelasSilakanCoba'));
    }
  };

  const reload = () => revalidate(getGradeSheet.keyFor(props.teachId));

  const openComponent = (e: Partial<Evaluation> | null) => {
    setEditing(e ?? {});
    setCompName(e?.name ?? '');
    setCompWeight(e?.weight ?? 20);
  };
  const submitComponent = async (ev: Event) => {
    ev.preventDefault();
    if (!compName().trim()) return;
    setCompBusy(true);
    try {
      await saveComponent(props.teachId, { id: editing()?.id, name: compName(), weight: Number(compWeight()) || 0 });
      setEditing(null);
      await reload();
      toast.success(t('lc.komponenEvaluasiKelasBerhasilDiperbarui'));
    } catch (e) {
      toast.error(msg(e) === 'locked' ? t('lc.gradeComponentsLocked') : t('lc.gagalMenyimpanKomponenEvaluasi'));
    } finally {
      setCompBusy(false);
    }
  };
  const removeComponent = async (id: string) => {
    if (!confirm(t('lc.apakahAndaYakinInginMenghapusKomponen'))) return;
    try {
      await deleteComponent(props.teachId, id);
      await reload();
      toast.success(t('lc.komponenPenilaianBerhasilDihapus'));
    } catch (e) {
      toast.error(msg(e) === 'locked' ? t('lc.gradeComponentsLocked') : t('lc.gagalMenghapusKomponenPenilaian'));
    }
  };
  const seed = async () => {
    try {
      await createDefaultComponents(props.teachId, {
        tugas: t('lc.tugas'),
        kuis: t('lc.kuis'),
        kehadiranPartisipasi: t('lc.kehadiranPartisipasi'),
        uts: 'UTS',
        uas: 'UAS',
      });
      await reload();
    } catch (e) {
      toast.error(crudErrorText(e, 'lc.gagalMenyimpanKomponenEvaluasi'));
    }
  };

  return (
    <div class="space-y-6">
      <section class={`${card} flex flex-wrap items-center justify-between gap-3 p-4`}>
        <div class="min-w-0">
          <p class="truncate font-semibold">
            {props.data.course ? `${props.data.course.code} · ${props.data.course.name}` : props.data.teach.name}
          </p>
          <p class="text-sm text-muted-foreground-1">
            {[props.data.academicYear, props.data.course ? `${props.data.course.credit} ${t('lc.sks')}` : ''].filter(Boolean).join(' · ')}
          </p>
        </div>
        <Show when={locked()}>
          <Badge variant="success">{t('lc.nilaiPerkuliahanTelahDikunciDifinalisasi')}</Badge>
        </Show>
      </section>

      <Show when={classLocked()}>
        <p role="status" class="rounded-xs border border-warning/40 bg-warning/10 p-3 text-sm">{t('lc.classLocked')}</p>
      </Show>

      <section class="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label={t('lc.mahasiswaDinilai')} value={`${stats().graded} / ${rows().length}`} />
        <Stat label={t('lc.rataRataKelas')} value={String(stats().avg)} />
        <Stat label={t('lc.nilaiTertinggi')} value={String(stats().highest)} />
        <Stat label={t('lc.totalBobotEvaluasi')} value={`${totalWeight(evals())}%`} />
      </section>

      <section class={card}>
        <div class="flex flex-wrap items-center justify-between gap-2 border-b border-card-line px-4 py-3">
          <h2 class="font-semibold">{t('lc.komponenEvaluasiPerkuliahan')}</h2>
          <Show when={!locked()}>
            <button type="button" class={btn} onClick={() => openComponent(null)}>{t('lc.tambahKomponenPenilaian')}</button>
          </Show>
        </div>
        <Show
          when={evals().length > 0}
          fallback={
            <div class="space-y-3 p-6 text-center">
              <p class="text-sm text-muted-foreground-1">{t('lc.gradeNoComponents')}</p>
              <button type="button" class={primary} onClick={() => void seed()}>{t('lc.gradeCreateDefaults')}</button>
            </div>
          }
        >
          <ul class="divide-y divide-card-divider">
            <For each={evals()}>
              {(e) => (
                <li class="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5">
                  <span class="text-sm font-medium">{e.name}</span>
                  <span class="flex items-center gap-3 text-sm">
                    <span class="font-mono">{e.weight}%</span>
                    <Show when={!locked()}>
                      <button type="button" class="text-primary hover:underline" onClick={() => openComponent(e)}>{t('lc.editKomponen')}</button>
                      <button type="button" class="text-destructive hover:underline" onClick={() => void removeComponent(e.id)}>{t('lc.hapusKomponen')}</button>
                    </Show>
                  </span>
                </li>
              )}
            </For>
          </ul>
          <p class={['px-4 py-2 text-xs', valid() ? 'text-muted-foreground-1' : 'text-destructive']}>
            {t('lc.totalBobot')} {totalWeight(evals())}% · {t('lc.wajib100')}
          </p>
        </Show>
      </section>

      <Show when={scale().length > 0} fallback={<p class="text-sm text-muted-foreground-1">{t('lc.belumAdaSkalaPenilaianYangDikonfigurasi')}</p>}>
        <section class={`${card} p-4`}>
          <h2 class="mb-2 text-sm font-semibold">{t('lc.pedomanSkalaPenilaianKonversiNilaiGrades')}</h2>
          <div class="flex flex-wrap gap-2 text-xs">
            <For each={scale()}>
              {(g) => <span class="rounded-xs border border-card-line px-2 py-1">{g.alphabet_code || g.name} · {g.grade} · {g.minimum}–{g.maximum}</span>}
            </For>
          </div>
        </section>
      </Show>

      <section class={card}>
        <div class="flex flex-wrap items-center justify-between gap-2 border-b border-card-line px-4 py-3">
          <input
            type="search"
            value={search()}
            onInput={(e) => setSearch(e.currentTarget.value)}
            placeholder={t('lc.cariMahasiswaBerdasarkanNamaNIMAtau')}
            class="h-9 min-w-0 flex-1 rounded-xs border border-layer-line bg-layer px-3 text-sm sm:max-w-sm"
          />
          <div class="flex gap-2">
            <button type="button" class={primary} disabled={classLocked() || savingAll() || dirtyCount() === 0} onClick={() => void saveAll()}>
              {savingAll() ? t('lc.menyimpan') : `${t('lc.simpanSemuaNilai')}${dirtyCount() ? ` (${dirtyCount()})` : ''}`}
            </button>
            <button type="button" class={btn} disabled={locked() || rows().length === 0 || dirtyCount() > 0} onClick={() => setLockOpen(true)}>
              {t('lc.kunciNilaiKelas')}
            </button>
          </div>
        </div>

        <Show when={rows().length > 0} fallback={<p class="p-6 text-center text-sm text-muted-foreground-1">{t('lc.kelasPengajaranIniBelumMemilikiMahasiswa')}</p>}>
          <Show when={shown().length > 0} fallback={<p class="p-6 text-center text-sm text-muted-foreground-1">{t('lc.noStudentsMatchTheSearchQuery')}</p>}>
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="border-b border-card-line text-start text-xs text-muted-foreground-1">
                    <th class="px-3 py-2 text-start">{t('lc.mahasiswa')}</th>
                    <For each={evals()}>{(e) => <th class="px-2 py-2 text-start">{e.name} ({e.weight}%)</th>}</For>
                    <th class="px-2 py-2 text-start">{t('lc.nilaiAkhir')}</th>
                    <th class="px-2 py-2 text-start">{t('lc.grade')}</th>
                    <th class="px-3 py-2 text-end">{t('lc.status')}</th>
                  </tr>
                </thead>
                <tbody>
                  <For each={shown()}>
                    {(r) => (
                      <tr class="border-b border-card-divider">
                        <td class="px-3 py-2">
                          <p class="font-medium">{r.name}</p>
                          <p class="font-mono text-xs text-muted-foreground-1">{r.code}</p>
                        </td>
                        <For each={evals()}>
                          {(e) => (
                            <td class="px-2 py-2">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                inputmode="decimal"
                                disabled={r.locked || classLocked()}
                                value={r.marks[e.id] ?? 0}
                                onChange={(ev) => setMark(r.id, e.id, ev.currentTarget.value)}
                                aria-label={`${r.name}: ${e.name}`}
                                class="h-8 w-20 rounded-xs border border-layer-line bg-layer px-2 disabled:opacity-60"
                              />
                            </td>
                          )}
                        </For>
                        <td class="px-2 py-2 font-mono">{r.mark}</td>
                        <td class="px-2 py-2">
                          <select
                            disabled={r.locked || classLocked() || scale().length === 0}
                            value={r.gradeId ?? ''}
                            onChange={(ev) => setGrade(r.id, ev.currentTarget.value)}
                            aria-label={`${r.name}: ${t('lc.grade')}`}
                            class="h-8 rounded-xs border border-layer-line bg-layer px-1 disabled:opacity-60"
                          >
                            <option value="" disabled>-</option>
                            <For each={scale()}>{(g) => <option value={g.id}>{g.alphabet_code || g.name} ({g.grade})</option>}</For>
                          </select>
                        </td>
                        <td class="px-3 py-2 text-end">
                          <Show
                            when={!r.locked && !classLocked()}
                            fallback={<Badge variant="success">{t('lc.locked')}</Badge>}
                          >
                            <button type="button" class="text-primary hover:underline disabled:opacity-50" disabled={!r.dirty || r.saving} onClick={() => void saveOne(r)}>
                              {r.saving ? t('lc.menyimpan') : r.dirty ? t('lc.simpan') : t('lc.saved')}
                            </button>
                          </Show>
                        </td>
                      </tr>
                    )}
                  </For>
                </tbody>
              </table>
            </div>
          </Show>
        </Show>
      </section>

      <Dialog open={editing() !== null} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <form onSubmit={submitComponent} class="space-y-4">
            <DialogHeader>
              <DialogTitle>{editing()?.id ? t('lc.editKomponenPenilaian') : t('lc.tambahKomponenPenilaian')}</DialogTitle>
              <DialogDescription>{t('lc.totalAkumulasiSeluruhKomponenHarusMencapai')}</DialogDescription>
            </DialogHeader>
            <label class="block text-sm">
              {t('lc.komponenPenilaian')}
              <input required maxlength="100" value={compName()} onInput={(e) => setCompName(e.currentTarget.value)} placeholder={t('lc.namaKomponenEGTugasUTS')} class="mt-1 h-9 w-full rounded-xs border border-layer-line bg-layer px-3" />
            </label>
            <label class="block text-sm">
              {t('lc.bobotPenilaian')}
              <input required type="number" min="0" max="100" step="0.01" value={compWeight()} onInput={(e) => setCompWeight(Number(e.currentTarget.value))} class="mt-1 h-9 w-full rounded-xs border border-layer-line bg-layer px-3" />
            </label>
            <DialogFooter>
              <DialogClose class={btn}>{t('lc.batal')}</DialogClose>
              <button type="submit" disabled={compBusy()} class={primary}>{compBusy() ? t('lc.menyimpan') : t('lc.simpanKomponen')}</button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={lockOpen()} onOpenChange={setLockOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('lc.kunciFinalisasiNilaiKelas')}</DialogTitle>
            <DialogDescription>
              {valid() ? t('lc.setelahNilaiDikunciDosen') : t('lc.gradeWeightsMustBe100')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose class={btn}>{t('lc.batal')}</DialogClose>
            <button type="button" disabled={!valid()} class={primary} onClick={() => void lock()}>{t('lc.yaKunciNilai')}</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
