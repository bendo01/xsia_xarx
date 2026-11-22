import { revalidate } from '@solidjs/router';
import { For, Show, createSignal } from 'solid-js';
import type { JSX } from '@solidjs/web';
import { toast } from 'solid-sonner';

import { t } from '../../i18n';
import {
  completedSteps, formatSize, validateArchiveSize, validateFamilyCard, validateMember, validateUnitChoice,
  type AdmissionStatus, type MemberInput, type OptionItem,
} from '../../lib/admission-types';
import { addFamilyMember, chooseUnit, removeFamilyMember, saveFamilyCard } from '../../lib/admission';

interface Lookups {
  units: OptionItem[];
  categories: OptionItem[];
  relativeTypes: OptionItem[];
  genders: OptionItem[];
}

const control = 'h-9 w-full rounded-xs border border-input bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50';
const primary = 'h-9 shrink-0 rounded-xs bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50';
const emptyMember: MemberInput = { relative_type_id: '', name: '', nik: '', birth_place: '', birth_date: '', gender_id: '', is_deceased: false };

/** A server message is either an i18n key (our own validation) or already readable text. */
const text = (e: unknown, fallback: string) => {
  const m = e instanceof Error ? e.message : '';
  return /^cn\.[A-Za-z0-9]+$/.test(m) ? t(m) : m || fallback;
};

function Badge(props: { done: boolean; optional?: boolean; label?: string }) {
  return (
    <span
      class={[
        'whitespace-nowrap rounded-xs px-2.5 py-0.5 text-[10px] font-bold',
        props.done
          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
          : props.optional
            ? 'bg-muted text-muted-foreground-1'
            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
      ]}
    >
      {props.label ?? (props.done ? t('cn.lengkap') : props.optional ? t('cn.opsional') : t('cn.belumLengkap'))}
    </span>
  );
}

function Section(props: { step: number; title: string; done: boolean; description?: string; children: JSX.Element }) {
  return (
    <section class="min-w-0 space-y-4 rounded-xs border border-card-line bg-card p-4 shadow-2xs sm:p-6">
      <div class="flex items-start justify-between gap-4 border-b border-card-line pb-3">
        <div class="flex min-w-0 items-start gap-3">
          <span class={['flex size-7 shrink-0 items-center justify-center rounded-xs text-xs font-black', props.done ? 'bg-emerald-600 text-white' : 'bg-muted text-muted-foreground-1']}>
            {props.done ? '✓' : props.step}
          </span>
          <div class="min-w-0">
            <h3 class="text-sm font-bold">{props.title}</h3>
            <Show when={props.description}>
              <p class="mt-0.5 text-xs text-muted-foreground-1">{props.description}</p>
            </Show>
          </div>
        </div>
        <Badge done={props.done} />
      </div>
      {props.children}
    </section>
  );
}

/** The candidate's admission checklist: programme, family card, parents / guardian, documents. */
export default function AdmissionDashboard(props: { id: string; data: AdmissionStatus; lookups: Lookups }) {
  const [busy, setBusy] = createSignal<string | null>(null);
  const [unitId, setUnitId] = createSignal(() => props.data.unit?.unit_id ?? '');
  const [categoryId, setCategoryId] = createSignal(() => props.data.unit?.registration_category_id ?? '');
  const [cardCode, setCardCode] = createSignal(() => props.data.family_card?.code ?? '');
  const [member, setMember] = createSignal<MemberInput>({ ...emptyMember });
  const req = () => props.data.requirements;
  const setField = <K extends keyof MemberInput>(k: K, v: MemberInput[K]) => setMember((m) => ({ ...m, [k]: v }));

  /** Runs one change, reports it, and refreshes the checklist. */
  const run = async (key: string, action: () => Promise<unknown>, done: string) => {
    setBusy(key);
    try {
      await action();
      toast.success(done);
      await revalidate();
      return true;
    } catch (e) {
      toast.error(text(e, t('cn.gagalMenyimpanData')));
      return false;
    } finally {
      setBusy(null);
    }
  };
  const warn = (key: string | null) => {
    if (key) toast.warning(t(key));
    return key !== null;
  };

  const saveUnit = () => {
    if (warn(validateUnitChoice(unitId(), categoryId()))) return;
    void run('unit', () => chooseUnit(props.id, unitId(), categoryId()), t('cn.pilihanProgramStudiDisimpan'));
  };
  const saveCard = () => {
    if (warn(validateFamilyCard(cardCode()))) return;
    void run('card', () => saveFamilyCard(props.id, cardCode().trim()), t('cn.nomorKartuKeluargaDisimpan'));
  };
  const addMember = async () => {
    if (warn(validateMember(member()))) return;
    if (await run('member', () => addFamilyMember(props.id, member()), t('cn.dataKeluargaDitambahkan'))) setMember({ ...emptyMember });
  };
  const deleteMember = (id: string, name?: string | null) => {
    if (!confirm(t('cn.deleteNameFromTheList', { name: name || t('cn.anggotaKeluarga') }))) return;
    void run(`del-${id}`, () => removeFamilyMember(props.id, id), t('cn.dataKeluargaDihapus'));
  };

  const upload = async (typeId: string, file?: File | null) => {
    if (!file) return;
    if (warn(validateArchiveSize(file.size))) return;
    setBusy(`archive-${typeId}`);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(`/api/candidate/${encodeURIComponent(props.id)}/archive/${encodeURIComponent(typeId)}`, { method: 'POST', body: form });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(body.message ?? '');
      }
      toast.success(t('cn.berkasBerhasilDiunggah'));
      await revalidate();
    } catch (e) {
      toast.error(text(e, t('cn.gagalMenyimpanData')));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div class="space-y-6">
      <div class="rounded-xs border border-card-line bg-card p-4 shadow-2xs sm:p-6">
        <div class="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div class="min-w-0 space-y-1">
            <span class="inline-flex items-center gap-2 rounded-xs border border-amber-200 bg-amber-50 px-2.5 py-0.5 font-mono text-xs font-semibold text-amber-700 dark:border-amber-800/80 dark:bg-amber-950/60 dark:text-amber-300">
              {t('cn.calonMahasiswa')}{props.data.candidate.code ? ` • ${props.data.candidate.code}` : ''}
            </span>
            <h1 class="truncate text-2xl font-black tracking-tight">{props.data.candidate.name}</h1>
            <p class="break-all font-mono text-xs text-muted-foreground-1">{t('cn.nik')} {props.data.candidate.nik || '-'} • {props.data.candidate.email || '-'}</p>
          </div>
          <div class="w-full space-y-2 md:w-56">
            <div class="flex items-center justify-between text-xs">
              <span class="font-bold">{t('cn.kelengkapanPendaftaran')}</span>
              <span class="font-mono text-muted-foreground-1">{completedSteps(req())} / 4</span>
            </div>
            <div class="h-2 w-full overflow-hidden rounded-xs bg-muted">
              <div class="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${(completedSteps(req()) / 4) * 100}%` }} />
            </div>
          </div>
        </div>
      </div>

      <Show
        when={req().is_complete}
        fallback={<p class="rounded-xs border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">{t('cn.lengkapiSeluruhTahapanDiBawahIni')}</p>}
      >
        <p class="rounded-xs border border-emerald-200 bg-emerald-50 p-4 text-xs font-semibold text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300">{t('cn.seluruhDataPendaftaranSudahLengkapSilakan')}</p>
      </Show>

      <div class="grid grid-cols-1 gap-6 text-xs xl:grid-cols-2">
        <Section step={1} title={t('cn.pilihanProgramStudi')} done={req().unit_choice} description={t('cn.pilihProgramStudiDanKelasYang')}>
          <Show when={props.data.unit}>
            {(unit) => (
              <div class="flex justify-between gap-3 border-b border-card-line py-1">
                <span class="font-mono text-muted-foreground-1">{t('cn.pilihanSaatIni')}</span>
                <span class="text-right font-bold">{unit().unit_name || '-'} • {unit().registration_category_name || '-'}</span>
              </div>
            )}
          </Show>
          <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label class="block min-w-0 space-y-1">
              <span class="font-medium text-muted-foreground-1">{t('cn.programStudi')}</span>
              <select class={control} onChange={(e) => setUnitId(e.currentTarget.value)}>
                <option value="">{t('cn.pilihProgramStudi')}</option>
                <For each={props.lookups.units}>{(o) => <option value={o.id} selected={unitId() === o.id}>{o.name}</option>}</For>
              </select>
            </label>
            <label class="block min-w-0 space-y-1">
              <span class="font-medium text-muted-foreground-1">{t('cn.kelas')}</span>
              <select class={control} onChange={(e) => setCategoryId(e.currentTarget.value)}>
                <option value="">{t('cn.pilihKelas')}</option>
                <For each={props.lookups.categories}>{(o) => <option value={o.id} selected={categoryId() === o.id}>{o.name}</option>}</For>
              </select>
            </label>
          </div>
          <div class="flex justify-end">
            <button type="button" class={primary} disabled={busy() !== null} onClick={saveUnit}>{busy() === 'unit' ? t('cn.menyimpan') : t('cn.simpanPilihan')}</button>
          </div>
        </Section>

        <Section step={2} title={t('cn.nomorKartuKeluarga')} done={req().family_card} description={t('cn.masukkan16DigitNomorKartuKeluarga')}>
          <div class="flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              inputmode="numeric"
              maxlength={16}
              placeholder={t('cn.nomorKartuKeluarga')}
              class={`${control} font-mono`}
              value={cardCode()}
              onInput={(e) => setCardCode(e.currentTarget.value.replace(/\D/g, ''))}
            />
            <button type="button" class={primary} disabled={busy() !== null} onClick={saveCard}>{busy() === 'card' ? t('cn.menyimpan') : t('cn.simpan')}</button>
          </div>
        </Section>

        <div class="min-w-0 xl:col-span-2">
          <Section step={3} title={t('cn.dataOrangTuaWali')} done={req().parents} description={t('cn.dataIbuKandungWajibDiisiData')}>
            <div class="flex flex-wrap gap-x-4 gap-y-2">
              <span class="inline-flex items-center gap-2">{t('cn.ibuKandung')} <Badge done={req().mother} label={req().mother ? t('cn.terisi') : t('cn.wajib')} /></span>
              <span class="inline-flex items-center gap-2">{t('cn.ayahKandung')} <Badge done={req().father} optional label={req().father ? t('cn.terisi') : t('cn.opsional')} /></span>
              <span class="inline-flex items-center gap-2">{t('cn.wali')} <Badge done={req().guardian} optional={!req().guardian_required} label={req().guardian ? t('cn.terisi') : req().guardian_required ? t('cn.wajib') : t('cn.tidakDiperlukan')} /></span>
            </div>
            <Show when={props.data.family_members.length > 0} fallback={<p class="py-2 font-mono text-muted-foreground-1">{t('cn.belumAdaDataOrangTuaWali')}</p>}>
              <ul class="divide-y divide-card-line">
                <For each={props.data.family_members}>
                  {(m) => (
                    <li class="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-2">
                      <div class="min-w-0">
                        <p class="font-bold">{m.relative_type_name || '-'} <span class="font-normal">• {m.name || '-'}</span></p>
                        <p class="break-all font-mono text-muted-foreground-1">{m.nik || '-'} • {m.birth_place || '-'}, {m.birth_date || '-'}</p>
                      </div>
                      <div class="flex items-center gap-3">
                        <Badge done={!m.is_deceased} optional label={m.is_deceased ? t('cn.almarhumAh') : t('cn.hidup')} />
                        <button type="button" class="font-bold text-destructive hover:underline disabled:opacity-50" disabled={busy() !== null} onClick={() => deleteMember(m.id, m.name)}>{t('cn.hapus')}</button>
                      </div>
                    </li>
                  )}
                </For>
              </ul>
            </Show>
            <Show when={props.data.family_card} fallback={<p class="font-semibold text-amber-600 dark:text-amber-400">{t('cn.isiNomorKartuKeluargaTerlebihDahulu')}</p>}>
              <div class="space-y-3 border-t border-card-line pt-3">
                <h4 class="font-bold">{t('cn.tambahOrangTuaWali')}</h4>
                <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <select class={control} onChange={(e) => setField('relative_type_id', e.currentTarget.value)}>
                    <option value="" selected={member().relative_type_id === ''}>{t('cn.hubunganKeluarga')}</option>
                    <For each={props.lookups.relativeTypes}>{(o) => <option value={o.id} selected={member().relative_type_id === o.id}>{o.name}</option>}</For>
                  </select>
                  <input type="text" class={control} placeholder={t('cn.namaLengkap')} value={member().name} onInput={(e) => setField('name', e.currentTarget.value)} />
                  <input type="text" inputmode="numeric" maxlength={16} class={`${control} font-mono`} placeholder={t('cn.nik16Digit')} value={member().nik} onInput={(e) => setField('nik', e.currentTarget.value.replace(/\D/g, ''))} />
                  <input type="text" class={control} placeholder={t('cn.tempatLahir')} value={member().birth_place} onInput={(e) => setField('birth_place', e.currentTarget.value)} />
                  <input type="date" class={control} value={member().birth_date} onInput={(e) => setField('birth_date', e.currentTarget.value)} />
                  <select class={control} onChange={(e) => setField('gender_id', e.currentTarget.value)}>
                    <option value="" selected={member().gender_id === ''}>{t('cn.jenisKelaminOpsional')}</option>
                    <For each={props.lookups.genders}>{(o) => <option value={o.id} selected={member().gender_id === o.id}>{o.name}</option>}</For>
                  </select>
                </div>
                <div class="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                  <label class="inline-flex cursor-pointer select-none items-center gap-2">
                    <input type="checkbox" class="size-4 accent-emerald-600" checked={member().is_deceased} onChange={(e) => setField('is_deceased', e.currentTarget.checked)} />
                    <span>{t('cn.sudahMeninggalDunia')}</span>
                  </label>
                  <button type="button" class={primary} disabled={busy() !== null} onClick={() => void addMember()}>{busy() === 'member' ? t('cn.menyimpan') : t('cn.tambah')}</button>
                </div>
              </div>
            </Show>
          </Section>
        </div>

        <div class="min-w-0 xl:col-span-2">
          <Section step={4} title={t('cn.unggahBerkas')} done={req().archives} description={t('cn.formatJPGPNGAtauPDFDengan')}>
            <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
              <For each={props.data.archives}>
                {(a) => (
                  <div class="min-w-0 space-y-3 rounded-xs border border-card-line p-4">
                    <div class="flex items-center justify-between gap-3">
                      <span class="font-bold">{a.archive_type_name}</span>
                      <Badge done={!!a.archive_id} label={a.archive_id ? t('cn.terunggah') : t('cn.wajib')} />
                    </div>
                    <Show when={a.archive_id}>
                      <div class="flex items-center justify-between gap-3 font-mono text-muted-foreground-1">
                        <span class="min-w-0 truncate">{a.file_name} • {formatSize(a.size)}</span>
                        <a href={`/api/candidate/${encodeURIComponent(props.id)}/file/${encodeURIComponent(a.archive_id as string)}`} target="_blank" rel="noopener" class="shrink-0 font-bold text-primary hover:underline">{t('cn.lihat')}</a>
                      </div>
                    </Show>
                    <label class={['flex cursor-pointer items-center justify-center gap-2 rounded-xs border border-dashed border-card-line px-3 py-2 transition-colors hover:border-primary hover:text-primary', { 'pointer-events-none opacity-50': busy() !== null }]}>
                      <input
                        type="file"
                        class="hidden"
                        accept={a.archive_type_name === 'Self Portrait' ? 'image/jpeg,image/png' : 'image/jpeg,image/png,application/pdf'}
                        onChange={(e) => {
                          void upload(a.archive_type_id, e.currentTarget.files?.[0]);
                          e.currentTarget.value = '';
                        }}
                      />
                      <span class="font-semibold">{busy() === `archive-${a.archive_type_id}` ? t('cn.mengunggah') : a.archive_id ? t('cn.gantiBerkas') : t('cn.pilihBerkas')}</span>
                    </label>
                  </div>
                )}
              </For>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
