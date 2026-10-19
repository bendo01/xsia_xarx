import { createSignal, createEffect, onMount, Show, For, type JSX } from 'solid-js';
import { useParams } from '@solidjs/router';
import TopBar from '~/components/navigation/TopBar';
import { toast } from '~/components/toast/Toaster';
import configuration from '~/config/configuration';
import {
    admissionStatus,
    admissionUnitOptions,
    admissionSaveUnit,
    admissionSaveFamilyCard,
    admissionStoreFamilyMember,
    admissionDeleteFamilyMember,
    admissionUploadArchive,
    admissionArchiveObjectUrl,
    fetchPublicOptions,
    type AdmissionStatus,
    type ApiResult,
    type OptionItem,
} from '~/controllers/academic/candidate/AcademicCandidateAdmissionController';
import { t } from '../../../../../../../i18n';

/** Relative types a candidate may register, matched by `relative_types.name` */
const PARENT_RELATIVE_TYPES = ['Ayah Kandung', 'Ibu Kandung', 'Ayah Wali', 'Ibu Wali'];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const inputClass = "w-full bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-600 px-3 py-2 rounded-xs text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500 disabled:opacity-50";
const primaryButton = "px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xs text-xs font-bold shadow-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed";

function StatusBadge(props: { done: boolean; optional?: boolean; label?: string }) {
    return (
        <span
            class="px-2.5 py-0.5 rounded-xs text-[10px] font-bold whitespace-nowrap"
            classList={{
                'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300': props.done,
                'bg-neutral-100 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300': !props.done && props.optional,
                'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300': !props.done && !props.optional,
            }}
        >
            {props.label ?? (props.done ? t('cn.lengkap') : props.optional ? t('cn.opsional') : t('cn.belumLengkap'))}
        </span>
    );
}

function SectionCard(props: { step: number; title: string; done: boolean; description?: string; children: JSX.Element }) {
    return (
        <div class="bg-white dark:bg-neutral-800 rounded-xs p-6 border border-neutral-200 dark:border-neutral-700 shadow-2xs space-y-4">
            <div class="flex items-start justify-between gap-4 pb-3 border-b border-neutral-200 dark:border-neutral-700">
                <div class="flex items-start gap-3">
                    <div
                        class="size-7 shrink-0 rounded-xs flex items-center justify-center text-xs font-black"
                        classList={{
                            'bg-emerald-600 text-white': props.done,
                            'bg-neutral-200 text-neutral-600 dark:bg-neutral-700 dark:text-neutral-300': !props.done,
                        }}
                    >
                        {props.done ? '✓' : props.step}
                    </div>
                    <div>
                        <h3 class="text-sm font-bold text-neutral-900 dark:text-white">{props.title}</h3>
                        <Show when={props.description}>
                            <p class="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">{props.description}</p>
                        </Show>
                    </div>
                </div>
                <StatusBadge done={props.done} />
            </div>
            {props.children}
        </div>
    );
}

function formatSize(size?: number | null) {
    if (!size) return '-';
    return size >= 1024 * 1024 ? `${(size / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(size / 1024)} KB`;
}

export default function CandidateDashboardPage() {
    const params = useParams();
    const candidateId = () => params.id ?? '';

    const [status, setStatus] = createSignal<AdmissionStatus | null>(null);
    const [isLoading, setIsLoading] = createSignal(true);
    const [loadError, setLoadError] = createSignal<string | null>(null);
    const [busy, setBusy] = createSignal<string | null>(null);

    const [units, setUnits] = createSignal<OptionItem[]>([]);
    const [categories, setCategories] = createSignal<OptionItem[]>([]);
    const [relativeTypes, setRelativeTypes] = createSignal<OptionItem[]>([]);
    const [genders, setGenders] = createSignal<OptionItem[]>([]);

    const [unitId, setUnitId] = createSignal('');
    const [categoryId, setCategoryId] = createSignal('');
    const [familyCardCode, setFamilyCardCode] = createSignal('');

    const emptyMember = { relative_type_id: '', name: '', nik: '', birth_place: '', birth_date: '', gender_id: '', is_deceased: false };
    const [member, setMember] = createSignal({ ...emptyMember });

    const applyStatus = (data: AdmissionStatus) => {
        setStatus(data);
        setUnitId(data.unit?.unit_id || '');
        setCategoryId(data.unit?.registration_category_id || '');
        setFamilyCardCode(data.family_card?.code || '');
    };

    const loadStatus = async () => {
        const id = candidateId();
        if (!id) return;
        setIsLoading(true);
        setLoadError(null);
        const result = await admissionStatus(id);
        if (result.ok && result.data?.candidate) {
            applyStatus(result.data);
        } else {
            setLoadError(result.message || t('cn.gagalMemuatDataPendaftaran'));
        }
        setIsLoading(false);
    };

    /** Runs a mutation that returns the refreshed status */
    const mutate = async (key: string, action: () => Promise<ApiResult<AdmissionStatus>>, successMessage: string) => {
        setBusy(key);
        try {
            const result = await action();
            if (result.ok && result.data?.candidate) {
                applyStatus(result.data);
                toast.success(successMessage);
                return true;
            }
            toast.danger(result.message || t('cn.gagalMenyimpanData'));
            return false;
        } finally {
            setBusy(null);
        }
    };

    onMount(async () => {
        const [unitResult, relativeOptions, genderOptions] = await Promise.all([
            admissionUnitOptions(configuration.institutionCode),
            fetchPublicOptions('person/reference/relative-type'),
            fetchPublicOptions('person/reference/gender'),
        ]);
        if (unitResult.ok && unitResult.data) {
            setUnits(unitResult.data.units);
            setCategories(unitResult.data.registration_categories);
        } else {
            toast.danger(unitResult.message || t('cn.gagalMemuatDaftarProgramStudi'));
        }
        setRelativeTypes(
            PARENT_RELATIVE_TYPES
                .map((name) => relativeOptions.find((o) => o.name === name))
                .filter((o): o is OptionItem => Boolean(o)),
        );
        setGenders(genderOptions);
    });

    createEffect(() => {
        if (candidateId()) loadStatus();
    });

    const req = () => status()?.requirements;
    const completedSteps = () => {
        const r = req();
        if (!r) return 0;
        return [r.unit_choice, r.family_card, r.parents, r.archives].filter(Boolean).length;
    };

    const saveUnit = () => {
        if (!unitId() || !categoryId()) {
            toast.warning(t('cn.pilihProgramStudiDanKelasPendaftaran'));
            return;
        }
        mutate('unit', () => admissionSaveUnit(candidateId(), unitId(), categoryId()), t('cn.pilihanProgramStudiDisimpan'));
    };

    const saveFamilyCard = () => {
        if (!/^\d{16}$/.test(familyCardCode().trim())) {
            toast.warning(t('cn.nomorKartuKeluargaHarus16Digit'));
            return;
        }
        mutate('family-card', () => admissionSaveFamilyCard(candidateId(), familyCardCode().trim()), t('cn.nomorKartuKeluargaDisimpan'));
    };

    const saveMember = async () => {
        const m = member();
        if (!m.relative_type_id || !m.name.trim() || !m.birth_place.trim() || !m.birth_date) {
            toast.warning(t('cn.lengkapiHubunganNamaTempatDanTanggal'));
            return;
        }
        if (!/^\d{16}$/.test(m.nik.trim())) {
            toast.warning(t('cn.nikHarus16DigitAngka'));
            return;
        }
        const saved = await mutate(
            'member',
            () => admissionStoreFamilyMember(candidateId(), {
                relative_type_id: m.relative_type_id,
                name: m.name.trim(),
                nik: m.nik.trim(),
                birth_place: m.birth_place.trim(),
                birth_date: m.birth_date,
                gender_id: m.gender_id || null,
                is_deceased: m.is_deceased,
            }),
            t('cn.dataKeluargaDitambahkan'),
        );
        if (saved) setMember({ ...emptyMember });
    };

    const deleteMember = (memberId: string, name?: string | null) => {
        if (!confirm(t('cn.deleteNameFromTheList', { name: name || t('cn.anggotaKeluarga') }))) return;
        mutate(`delete-${memberId}`, () => admissionDeleteFamilyMember(candidateId(), memberId), t('cn.dataKeluargaDihapus'));
    };

    const uploadArchive = (archiveTypeId: string, file?: File | null) => {
        if (!file) return;
        if (file.size > MAX_FILE_SIZE) {
            toast.warning(t('cn.ukuranBerkasMaksimal5MB'));
            return;
        }
        mutate(`archive-${archiveTypeId}`, () => admissionUploadArchive(candidateId(), archiveTypeId, file), t('cn.berkasBerhasilDiunggah'));
    };

    const viewArchive = async (archiveId: string) => {
        const url = await admissionArchiveObjectUrl(candidateId(), archiveId);
        if (!url) {
            toast.danger(t('cn.berkasTidakDapatDibuka'));
            return;
        }
        window.open(url, '_blank');
    };

    const updateMember = (field: keyof typeof emptyMember, value: string | boolean) =>
        setMember((prev) => ({ ...prev, [field]: value }));

    return (
        <div class="min-h-screen bg-neutral-50 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 flex flex-col">
            <TopBar />

            <main class="flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                <Show
                    when={!isLoading() || status()}
                    fallback={
                        <div class="py-16 flex flex-col items-center justify-center gap-3 text-neutral-400">
                            <div class="size-8 border-3 border-emerald-500 border-t-transparent rounded-xs animate-spin"></div>
                            <p class="text-xs font-mono">{t('cn.memuatDataPendaftaran')}</p>
                        </div>
                    }
                >
                    <Show
                        when={status()}
                        fallback={
                            <div class="bg-white dark:bg-neutral-800 rounded-xs p-8 border border-red-200 dark:border-red-900 text-center space-y-3">
                                <p class="text-sm font-bold text-red-600 dark:text-red-400">{loadError() || 'Data pendaftaran tidak ditemukan'}</p>
                                <button type="button" onClick={loadStatus} class={primaryButton}>{t('cn.cobaLagi')}</button>
                            </div>
                        }
                    >
                        {(data) => (
                            <>
                                {/* Header Card */}
                                <div class="bg-white dark:bg-neutral-800 rounded-xs p-6 sm:p-8 border border-neutral-200 dark:border-neutral-700 shadow-2xs">
                                    <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        <div class="flex items-center gap-5">
                                            <div class="size-16 sm:size-20 rounded-xs bg-linear-to-tr from-amber-500 to-emerald-500 text-white font-black text-2xl flex items-center justify-center shadow-md">
                                                {(data().candidate.name || 'C').charAt(0)}
                                            </div>
                                            <div class="space-y-1">
                                                <div class="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-xs bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-xs font-mono font-semibold border border-amber-200 dark:border-amber-800/80">
                                                    <span class="size-1.5 rounded-xs bg-amber-500"></span>
                                                    <span>{t('cn.calonMahasiswa')}{data().candidate.code ? ` • ${data().candidate.code}` : ''}</span>
                                                </div>
                                                <h1 class="text-2xl sm:text-3xl font-black tracking-tight text-neutral-900 dark:text-white">
                                                    {data().candidate.name}
                                                </h1>
                                                <p class="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 font-mono">
                                                    {t('cn.nik')} {data().candidate.nik || '-'} • {data().candidate.email || '-'}
                                                </p>
                                            </div>
                                        </div>

                                        <div class="min-w-56 space-y-2">
                                            <div class="flex items-center justify-between text-xs">
                                                <span class="font-bold text-neutral-700 dark:text-neutral-200">{t('cn.kelengkapanPendaftaran')}</span>
                                                <span class="font-mono text-neutral-500">{completedSteps()} / 4</span>
                                            </div>
                                            <div class="h-2 w-full bg-neutral-200 dark:bg-neutral-700 rounded-xs overflow-hidden">
                                                <div class="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${(completedSteps() / 4) * 100}%` }}></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <Show
                                    when={req()?.is_complete}
                                    fallback={
                                        <div class="p-4 rounded-xs border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/40 text-xs text-amber-800 dark:text-amber-300">
                                            {t('cn.lengkapiSeluruhTahapanDiBawahIni')}
                                        </div>
                                    }
                                >
                                    <div class="p-4 rounded-xs border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 text-xs text-emerald-800 dark:text-emerald-300 font-semibold">
                                        {t('cn.seluruhDataPendaftaranSudahLengkapSilakan')}
                                    </div>
                                </Show>

                                <div class="grid grid-cols-1 xl:grid-cols-2 gap-6 text-xs">
                                    {/* 1. Unit Choice */}
                                    <SectionCard step={1} title={t('cn.pilihanProgramStudi')} done={!!req()?.unit_choice} description={t('cn.pilihProgramStudiDanKelasYang')}>
                                        <Show when={data().unit}>
                                            {(unit) => (
                                                <div class="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-700/50">
                                                    <span class="text-neutral-400 font-mono">{t('cn.pilihanSaatIni')}</span>
                                                    <span class="font-bold text-neutral-800 dark:text-neutral-100 text-right">
                                                        {unit().unit_name || '-'} • {unit().registration_category_name || '-'}
                                                    </span>
                                                </div>
                                            )}
                                        </Show>
                                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div class="space-y-1">
                                                <label class="block font-medium text-neutral-600 dark:text-neutral-300">{t('cn.programStudi')}</label>
                                                <select class={inputClass} value={unitId()} onChange={(e) => setUnitId(e.currentTarget.value)}>
                                                    <option value="">{t('cn.pilihProgramStudi')}</option>
                                                    <For each={units()}>{(item) => <option value={item.id}>{item.name}</option>}</For>
                                                </select>
                                            </div>
                                            <div class="space-y-1">
                                                <label class="block font-medium text-neutral-600 dark:text-neutral-300">{t('cn.kelas')}</label>
                                                <select class={inputClass} value={categoryId()} onChange={(e) => setCategoryId(e.currentTarget.value)}>
                                                    <option value="">{t('cn.pilihKelas')}</option>
                                                    <For each={categories()}>{(item) => <option value={item.id}>{item.name}</option>}</For>
                                                </select>
                                            </div>
                                        </div>
                                        <div class="flex justify-end">
                                            <button type="button" class={primaryButton} disabled={busy() !== null} onClick={saveUnit}>
                                                {busy() === 'unit' ? t('cn.menyimpan') : t('cn.simpanPilihan')}
                                            </button>
                                        </div>
                                    </SectionCard>

                                    {/* 2. Family Card */}
                                    <SectionCard step={2} title={t('cn.nomorKartuKeluarga')} done={!!req()?.family_card} description={t('cn.masukkan16DigitNomorKartuKeluarga')}>
                                        <div class="flex flex-col sm:flex-row gap-3">
                                            <input
                                                type="text"
                                                inputmode="numeric"
                                                maxlength={16}
                                                placeholder={t('cn.nomorKartuKeluarga')}
                                                class={`${inputClass} font-mono`}
                                                value={familyCardCode()}
                                                onInput={(e) => setFamilyCardCode(e.currentTarget.value.replace(/\D/g, ''))}
                                            />
                                            <button type="button" class={`${primaryButton} shrink-0`} disabled={busy() !== null} onClick={saveFamilyCard}>
                                                {busy() === 'family-card' ? t('cn.menyimpan') : t('cn.simpan')}
                                            </button>
                                        </div>
                                    </SectionCard>

                                    {/* 3. Parents & Guardian */}
                                    <div class="xl:col-span-2">
                                        <SectionCard
                                            step={3}
                                            title={t('cn.dataOrangTuaWali')}
                                            done={!!req()?.parents}
                                            description={t('cn.dataIbuKandungWajibDiisiData')}
                                        >
                                            <div class="flex flex-wrap gap-2">
                                                <span class="inline-flex items-center gap-2">{t('cn.ibuKandung')} <StatusBadge done={!!req()?.mother} label={req()?.mother ? 'Terisi' : 'Wajib'} /></span>
                                                <span class="inline-flex items-center gap-2">{t('cn.ayahKandung')} <StatusBadge done={!!req()?.father} optional label={req()?.father ? 'Terisi' : 'Opsional'} /></span>
                                                <span class="inline-flex items-center gap-2">
                                                    {t('cn.wali')}
                                                    <StatusBadge
                                                        done={!!req()?.guardian}
                                                        optional={!req()?.guardian_required}
                                                        label={req()?.guardian ? t('cn.terisi') : req()?.guardian_required ? t('cn.wajib') : t('cn.tidakDiperlukan')}
                                                    />
                                                </span>
                                            </div>

                                            <Show
                                                when={data().family_members.length > 0}
                                                fallback={<p class="text-neutral-400 font-mono py-2">{t('cn.belumAdaDataOrangTuaWali')}</p>}
                                            >
                                                <div class="overflow-x-auto">
                                                    <table class="w-full text-left">
                                                        <thead>
                                                            <tr class="text-neutral-400 font-mono border-b border-neutral-200 dark:border-neutral-700">
                                                                <th class="py-2 pr-3 font-medium">{t('cn.hubungan')}</th>
                                                                <th class="py-2 pr-3 font-medium">{t('cn.nama')}</th>
                                                                <th class="py-2 pr-3 font-medium">{t('cn.nik')}</th>
                                                                <th class="py-2 pr-3 font-medium">{t('cn.tempatTanggalLahir')}</th>
                                                                <th class="py-2 pr-3 font-medium">{t('cn.status')}</th>
                                                                <th class="py-2"></th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            <For each={data().family_members}>
                                                                {(m) => (
                                                                    <tr class="border-b border-neutral-100 dark:border-neutral-700/50">
                                                                        <td class="py-2 pr-3 font-bold">{m.relative_type_name || '-'}</td>
                                                                        <td class="py-2 pr-3">{m.name || '-'}</td>
                                                                        <td class="py-2 pr-3 font-mono">{m.nik || '-'}</td>
                                                                        <td class="py-2 pr-3">{m.birth_place || '-'}, {m.birth_date || '-'}</td>
                                                                        <td class="py-2 pr-3">
                                                                            <StatusBadge done={!m.is_deceased} optional label={m.is_deceased ? t('cn.almarhumAh') : t('cn.hidup')} />
                                                                        </td>
                                                                        <td class="py-2 text-right">
                                                                            <button
                                                                                type="button"
                                                                                class="text-red-600 hover:text-red-700 dark:text-red-400 font-bold disabled:opacity-50"
                                                                                disabled={busy() !== null}
                                                                                onClick={() => deleteMember(m.id, m.name)}
                                                                            >
                                                                                {t('cn.hapus')}
                                                                            </button>
                                                                        </td>
                                                                    </tr>
                                                                )}
                                                            </For>
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </Show>

                                            <Show
                                                when={data().family_card}
                                                fallback={<p class="text-amber-600 dark:text-amber-400 font-semibold">{t('cn.isiNomorKartuKeluargaTerlebihDahulu')}</p>}
                                            >
                                                <div class="pt-3 border-t border-neutral-200 dark:border-neutral-700 space-y-3">
                                                    <h4 class="font-bold text-neutral-700 dark:text-neutral-200">{t('cn.tambahOrangTuaWali')}</h4>
                                                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                                        <select class={inputClass} value={member().relative_type_id} onChange={(e) => updateMember('relative_type_id', e.currentTarget.value)}>
                                                            <option value="">{t('cn.hubunganKeluarga')}</option>
                                                            <For each={relativeTypes()}>{(item) => <option value={item.id}>{item.name}</option>}</For>
                                                        </select>
                                                        <input type="text" class={inputClass} placeholder={t('cn.namaLengkap')} value={member().name} onInput={(e) => updateMember('name', e.currentTarget.value)} />
                                                        <input type="text" inputmode="numeric" maxlength={16} class={`${inputClass} font-mono`} placeholder={t('cn.nik16Digit')} value={member().nik} onInput={(e) => updateMember('nik', e.currentTarget.value.replace(/\D/g, ''))} />
                                                        <input type="text" class={inputClass} placeholder={t('cn.tempatLahir')} value={member().birth_place} onInput={(e) => updateMember('birth_place', e.currentTarget.value)} />
                                                        <input type="date" class={inputClass} value={member().birth_date} onInput={(e) => updateMember('birth_date', e.currentTarget.value)} />
                                                        <select class={inputClass} value={member().gender_id} onChange={(e) => updateMember('gender_id', e.currentTarget.value)}>
                                                            <option value="">{t('cn.jenisKelaminOpsional')}</option>
                                                            <For each={genders()}>{(item) => <option value={item.id}>{item.name}</option>}</For>
                                                        </select>
                                                    </div>
                                                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                        <label class="inline-flex items-center gap-2 cursor-pointer select-none">
                                                            <input type="checkbox" class="size-4 accent-emerald-600" checked={member().is_deceased} onChange={(e) => updateMember('is_deceased', e.currentTarget.checked)} />
                                                            <span>{t('cn.sudahMeninggalDunia')}</span>
                                                        </label>
                                                        <button type="button" class={primaryButton} disabled={busy() !== null} onClick={saveMember}>
                                                            {busy() === 'member' ? t('cn.menyimpan') : t('cn.tambah')}
                                                        </button>
                                                    </div>
                                                </div>
                                            </Show>
                                        </SectionCard>
                                    </div>

                                    {/* 4. Documents */}
                                    <div class="xl:col-span-2">
                                        <SectionCard step={4} title={t('cn.unggahBerkas')} done={!!req()?.archives} description={t('cn.formatJPGPNGAtauPDFDengan')}>
                                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <For each={data().archives}>
                                                    {(archive) => (
                                                        <div class="p-4 rounded-xs border border-neutral-200 dark:border-neutral-700 space-y-3">
                                                            <div class="flex items-center justify-between gap-3">
                                                                <span class="font-bold text-neutral-800 dark:text-neutral-100">{archive.archive_type_name}</span>
                                                                <StatusBadge done={!!archive.archive_id} label={archive.archive_id ? t('cn.terunggah') : t('cn.wajib')} />
                                                            </div>
                                                            <Show when={archive.archive_id}>
                                                                <div class="flex items-center justify-between gap-3 text-neutral-500 font-mono">
                                                                    <span class="truncate">{archive.file_name} • {formatSize(archive.size)}</span>
                                                                    <button type="button" class="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 font-bold shrink-0" onClick={() => viewArchive(archive.archive_id!)}>
                                                                        {t('cn.lihat')}
                                                                    </button>
                                                                </div>
                                                            </Show>
                                                            <label
                                                                class="flex items-center justify-center gap-2 px-3 py-2 rounded-xs border border-dashed border-neutral-300 dark:border-neutral-600 cursor-pointer hover:border-emerald-500 hover:text-emerald-600 transition-colors"
                                                                classList={{ 'opacity-50 pointer-events-none': busy() !== null }}
                                                            >
                                                                <input
                                                                    type="file"
                                                                    class="hidden"
                                                                    accept={archive.archive_type_name === 'Self Portrait' ? 'image/jpeg,image/png' : 'image/jpeg,image/png,application/pdf'}
                                                                    onChange={(e) => {
                                                                        uploadArchive(archive.archive_type_id, e.currentTarget.files?.[0]);
                                                                        e.currentTarget.value = '';
                                                                    }}
                                                                />
                                                                <span class="font-semibold">
                                                                    {busy() === `archive-${archive.archive_type_id}` ? t('cn.mengunggah') : archive.archive_id ? t('cn.gantiBerkas') : t('cn.pilihBerkas')}
                                                                </span>
                                                            </label>
                                                        </div>
                                                    )}
                                                </For>
                                            </div>
                                        </SectionCard>
                                    </div>
                                </div>
                            </>
                        )}
                    </Show>
                </Show>
            </main>
        </div>
    );
}
