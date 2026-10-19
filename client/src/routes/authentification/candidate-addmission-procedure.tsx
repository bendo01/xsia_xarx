import { onMount, Show, For, type JSX } from 'solid-js';
import { A } from '@solidjs/router';
import TopBar from '~/components/navigation/TopBar';
import { getInstitutionLogo } from '~/lib/institutionLogo';
import { t } from '../../i18n';

interface DocumentItem {
    name: string;
    description: string;
    format: string;
    tips: string[];
}

interface FieldItem {
    label: string;
    description: string;
    required: boolean;
}

interface StepItem {
    title: string;
    description: string;
    points: string[];
}

const getDocuments = (): DocumentItem[] => [
    {
        name: t('au.kartuKeluargaKK'),
        description: t('au.kartuKeluargaTerbaruYangMemuatNama'),
        format: t('au.jpgPNGAtauPDFMaks5'),
        tips: [
            t('au.pindaiAtauFotoSeluruhHalamanKK'),
            t('au.pastikanNomorKK16DigitDan'),
        ],
    },
    {
        name: t('au.kartuTandaPendudukKTP'),
        description: t('au.ktpElektronikMilikAndaJikaBelum'),
        format: t('au.jpgPNGAtauPDFMaks5'),
        tips: [
            t('au.fotoKTPDiAtasPermukaanPolos'),
            t('au.nikPadaKTPHarusSamaDengan'),
        ],
    },
    {
        name: t('au.pasFoto'),
        description: t('au.pasFotoBerwarnaTerbaruDenganWajah'),
        format: t('au.jpgAtauPNGMaks5MB'),
        tips: [
            t('au.gunakanLatarBelakangPolosMerahAtau'),
            t('au.wajahTerlihatJelasTidakMemakaiKacamata'),
            t('au.fotoAkanDigunakanUntukKartuUjian'),
        ],
    },
    {
        name: t('au.ijazahSMASMKMA'),
        description: t('au.ijazahSekolahMenengahAtasAtauSederajat'),
        format: t('au.jpgPNGAtauPDFMaks5'),
        tips: [
            t('au.unggahHalamanDepanIjazahYangMemuat'),
            t('au.ijazahAtauSKLAsliWajibDibawa'),
        ],
    },
];

const getDataChecklist = (): string[] => [
    t('au.nik16DigitSesuaiKTPKartu'),
    t('au.nomorKartuKeluarga16Digit'),
    t('au.nisn10DigitJikaAdaDan'),
    t('au.emailAktifYangDapatAndaBuka'),
    t('au.nomorWhatsAppAktif'),
    t('au.nikNamaTempatDanTanggalLahir'),
    t('au.dataAyahKandungOpsionalAtauWali'),
];

const getFormFields = (): FieldItem[] => [
    { label: t('au.namaLengkap2'), description: t('au.tulisSesuaiKTPAtauIjazahTanpa'), required: true },
    { label: t('au.nik'), description: t('au.n16DigitAngkaNomorIndukKependudukan'), required: true },
    { label: t('au.jenisKelaminAgama'), description: t('au.pilihSesuaiDataKependudukanAnda'), required: true },
    { label: t('au.tempatTanggalLahir'), description: t('au.isiKotaKabupatenTempatLahirDan'), required: true },
    { label: t('au.nomorWhatsApp'), description: t('au.gunakanFormat62Contoh6281234567890Informasi'), required: true },
    { label: t('au.nisn'), description: t('au.n10DigitNomorIndukSiswaNasional'), required: false },
    { label: t('au.namaSekolahAsal'), description: t('au.namaSMASMKMATempatAnda'), required: false },
    { label: t('au.email'), description: t('au.emailAktifMilikSendiriEmailIni'), required: true },
    { label: t('au.kataSandiKonfirmasi'), description: t('au.minimal6KarakterSimpanBaikBaik'), required: true },
];

const getDashboardSteps = (): StepItem[] => [
    {
        title: t('au.pilihanProgramStudi'),
        description: t('au.tentukanProgramStudiDanKelasYang'),
        points: [
            t('au.pilihProgramStudiDariDaftarYang'),
            t('au.pilihKelasRegulerAtauHybridBlended'),
            t('au.klikSimpanPilihanPilihanMasihDapat'),
        ],
    },
    {
        title: t('au.nomorKartuKeluarga'),
        description: t('au.masukkan16DigitNomorKKSebelum'),
        points: [
            t('au.nomorKKTercantumDiBagianAtas'),
            t('au.klikSimpanDataOrangTuaWali'),
        ],
    },
    {
        title: t('au.dataOrangTuaWali'),
        description: t('au.tambahkanAnggotaKeluargaSesuaiHubunganDengan'),
        points: [
            t('au.dataIbuKandungWajibDiisiTermasuk'),
            t('au.dataAyahKandungBersifatOpsional'),
            t('au.jikaIbuTelahMeninggalDanAyah'),
            t('au.setiapAnggotaKeluargaMemerlukanNIK16'),
        ],
    },
    {
        title: t('au.unggahBerkas'),
        description: t('au.unggahKeempatDokumenYangTelahAnda'),
        points: [
            t('au.klikPilihBerkasPadaSetiapJenis'),
            t('au.statusBerubahMenjadiTerunggahBilaBerhasil'),
            t('au.berkasYangSalahDapatDigantiDengan'),
        ],
    },
];

const getFaqs = (): { question: string; answer: string }[] => [
    {
        question: t('au.nikSayaDitolakKarenaSudahMemiliki'),
        answer: t('au.artinyaNIKTersebutSudahPernahDidaftarkan'),
    },
    {
        question: t('au.apakahDataBisaDiubahSetelahFormulir'),
        answer: t('au.pilihanProgramStudiNomorKKData'),
    },
    {
        question: t('au.sayaBelumMemilikiIjazahKarenaBaru'),
        answer: t('au.unggahSuratKeteranganLulusSKLDari'),
    },
    {
        question: t('au.ukuranFileSayaLebihDari5'),
        answer: t('au.kompresGambarMenggunakanAplikasiPemindaiDi'),
    },
];

function SectionHeading(props: { number: string; title: string; subtitle: string }) {
    return (
        <div class="mb-6">
            <div class="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-xs bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-xs font-mono font-bold uppercase mb-2 border border-emerald-500/20">
                {t('au.bagian')} {props.number}
            </div>
            <h2 class="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white tracking-wide mb-1">{props.title}</h2>
            <p class="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-3xl">{props.subtitle}</p>
        </div>
    );
}

function Card(props: { children: JSX.Element; class?: string }) {
    return (
        <div class={`bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-neutral-200 dark:border-slate-800 rounded-xs p-6 sm:p-8 shadow-xl ${props.class ?? ''}`}>
            {props.children}
        </div>
    );
}

export default function CandidateAdmissionProcedure() {
    onMount(() => {
        if (typeof document !== 'undefined') {
            document.title = 'Prosedur Pendaftaran Calon Mahasiswa Baru';
        }
    });

    return (
        <div class="min-h-screen flex flex-col bg-neutral-50 dark:bg-[#0A0F1D] text-neutral-800 dark:text-neutral-100 selection:bg-emerald-500/30 selection:text-emerald-200">
            <TopBar />

            <main class="flex-1 relative overflow-hidden">
                {/* Ambient glowing background shapes */}
                <div class="absolute inset-0 pointer-events-none z-0 overflow-hidden opacity-50 dark:opacity-100" aria-hidden="true">
                    <div class="absolute top-[-20%] left-[-10%] w-[65%] h-[65%] bg-[#0f3460]/40 rounded-full blur-[140px] opacity-70"></div>
                    <div class="absolute top-[40%] right-[-15%] w-[60%] h-[60%] bg-[#0d9488]/20 rounded-full blur-[150px] opacity-60"></div>
                    <div class="absolute bottom-[-20%] left-[20%] w-[55%] h-[55%] bg-[#3b82f6]/20 rounded-full blur-[140px] opacity-50"></div>
                </div>

                <article class="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12">
                    {/* Hero */}
                    <header class="flex flex-col items-center text-center">
                        <Show when={getInstitutionLogo()}>
                            {(logo) => (
                                <img src={logo()} alt={t('au.logoInstitusi')} class="h-20 sm:h-24 w-auto object-contain mb-6 drop-shadow-[0_0_25px_rgba(16,185,129,0.35)]" />
                            )}
                        </Show>
                        <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-semibold tracking-wide uppercase mb-5">
                            <span class="size-2 rounded-full bg-amber-400 animate-pulse"></span>
                            <span>{t('au.penerimaanMahasiswaBaruPanduanPendaftaran')}</span>
                        </div>
                        <h1 class="text-3xl sm:text-5xl font-extrabold tracking-tight text-neutral-900 dark:text-white max-w-3xl leading-tight mb-4">
                            {t('au.persiapanDokumenDanCaraMengisiFormulir')}
                        </h1>
                        <p class="text-base sm:text-lg text-neutral-600 dark:text-neutral-300 max-w-2xl leading-relaxed mb-8">
                            {t('au.pendaftaranCalonMahasiswaBaruDilakukanSepenuhnya')}
                        </p>
                        <div class="flex flex-wrap items-center justify-center gap-3">
                            <A
                                href="/authentification/candidate-addmission-form"
                                class="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xs bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-all shadow-[0_0_25px_rgba(16,185,129,0.4)] hover:-translate-y-0.5"
                            >
                                <span>{t('au.isiFormulirPendaftaran')}</span>
                                <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                    <polyline points="12 5 19 12 12 19" />
                                </svg>
                            </A>
                            <A
                                href="/authentification/login_with_session"
                                class="inline-flex items-center gap-2 px-5 py-3.5 rounded-xs bg-neutral-100 dark:bg-slate-800/80 hover:bg-neutral-200 dark:hover:bg-slate-700/80 border border-neutral-300 dark:border-slate-700 text-neutral-700 dark:text-neutral-200 text-sm font-semibold transition-all"
                            >
                                {t('au.sudahMendaftarMasuk')}
                            </A>
                        </div>
                    </header>

                    {/* Overview */}
                    <Card>
                        <h2 class="text-lg font-bold text-neutral-900 dark:text-white mb-4">{t('au.alurPendaftaranSecaraSingkat')}</h2>
                        <ol class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <For each={[t('au.siapkanDokumenDanData'), t('au.isiFormulirPendaftaranAkun'), t('au.lengkapiDataDiDasborCalonMahasiswa'), t('au.tungguVerifikasiPanitiaPMB')]}>
                                {(item, index) => (
                                    <li class="p-4 rounded-xs bg-neutral-100/80 dark:bg-slate-950/40 border border-neutral-200 dark:border-slate-800/60 flex items-start gap-3">
                                        <span class="size-6 shrink-0 rounded-xs bg-emerald-600 text-white text-xs font-bold font-mono flex items-center justify-center">
                                            {index() + 1}
                                        </span>
                                        <span class="text-sm text-neutral-700 dark:text-neutral-200 leading-snug">{item}</span>
                                    </li>
                                )}
                            </For>
                        </ol>
                    </Card>

                    {/* Part 1: Documents */}
                    <section>
                        <SectionHeading
                            number="1"
                            title={t('au.persiapanDokumen')}
                            subtitle={t('au.siapkanFileDigitalDokumenBerikutSebelum')}
                        />
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <For each={getDocuments()}>
                                {(doc) => (
                                    <div class="bg-white/80 dark:bg-slate-900/60 border border-neutral-200 dark:border-slate-800 rounded-xs p-5 space-y-3">
                                        <div class="flex items-start justify-between gap-3">
                                            <h3 class="text-base font-bold text-neutral-900 dark:text-white">{doc.name}</h3>
                                            <span class="text-[10px] font-bold px-2 py-0.5 rounded-xs bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30 whitespace-nowrap">{t('au.wajib')}</span>
                                        </div>
                                        <p class="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">{doc.description}</p>
                                        <p class="text-xs font-mono text-emerald-700 dark:text-emerald-300">{doc.format}</p>
                                        <ul class="space-y-1.5 text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                                            <For each={doc.tips}>
                                                {(tip) => (
                                                    <li class="flex items-start gap-2">
                                                        <span class="size-1.5 mt-1.5 shrink-0 rounded-full bg-slate-500"></span>
                                                        <span>{tip}</span>
                                                    </li>
                                                )}
                                            </For>
                                        </ul>
                                    </div>
                                )}
                            </For>
                        </div>

                        <Card class="mt-4">
                            <h3 class="text-base font-bold text-neutral-900 dark:text-white mb-3">{t('au.dataYangPerluDisiapkan')}</h3>
                            <ul class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-neutral-600 dark:text-neutral-300">
                                <For each={getDataChecklist()}>
                                    {(item) => (
                                        <li class="flex items-start gap-2">
                                            <svg class="size-4 mt-0.5 shrink-0 text-emerald-700 dark:text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                            <span>{item}</span>
                                        </li>
                                    )}
                                </For>
                            </ul>
                            <p class="mt-4 text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                                {t('au.formatFileYangDiterimaAdalahJPG')}
                            </p>
                        </Card>
                    </section>

                    {/* Part 2: Registration form */}
                    <section>
                        <SectionHeading
                            number="2"
                            title={t('au.mengisiFormulirPendaftaran')}
                            subtitle={t('au.formulirIniMembuatAkunPendaftaranAnda')}
                        />
                        <Card>
                            <div class="overflow-x-auto">
                                <table class="w-full text-left text-sm">
                                    <thead>
                                        <tr class="text-xs font-mono uppercase tracking-wider text-neutral-500 dark:text-neutral-400 border-b border-neutral-200 dark:border-slate-800">
                                            <th class="py-2 pr-4 font-semibold">{t('au.kolom')}</th>
                                            <th class="py-2 pr-4 font-semibold">{t('au.keterangan')}</th>
                                            <th class="py-2 font-semibold">{t('au.status')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <For each={getFormFields()}>
                                            {(field) => (
                                                <tr class="border-b border-neutral-200 dark:border-slate-800/60 align-top">
                                                    <td class="py-3 pr-4 font-semibold text-neutral-900 dark:text-white whitespace-nowrap">{field.label}</td>
                                                    <td class="py-3 pr-4 text-neutral-600 dark:text-neutral-300 leading-relaxed">{field.description}</td>
                                                    <td class="py-3">
                                                        <span
                                                            class="text-[10px] font-bold px-2 py-0.5 rounded-xs border whitespace-nowrap"
                                                            classList={{
                                                                'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30': field.required,
                                                                'bg-neutral-200/60 dark:bg-slate-700/40 text-neutral-600 dark:text-neutral-300 border-neutral-400 dark:border-slate-600': !field.required,
                                                            }}
                                                        >
                                                            {field.required ? t('au.wajib') : t('au.opsional')}
                                                        </span>
                                                    </td>
                                                </tr>
                                            )}
                                        </For>
                                    </tbody>
                                </table>
                            </div>
                            <div class="mt-5 p-3 bg-neutral-100/80 dark:bg-slate-950/60 border border-neutral-200 dark:border-slate-800/80 rounded-xs flex items-start gap-2.5 text-xs text-neutral-600 dark:text-neutral-300">
                                <svg class="size-4 shrink-0 text-amber-700 dark:text-amber-400 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="12" y1="16" x2="12" y2="12" />
                                    <line x1="12" y1="8" x2="12.01" y2="8" />
                                </svg>
                                <span class="leading-relaxed">
                                    {t('au.satuNIKDanSatuEmailHanya')}
                                    <strong class="text-neutral-900 dark:text-white"> {t('au.daftarSekarang')}</strong>{t('au.karenaDataDiriMenjadiDasarPenerbitan')}
                                </span>
                            </div>
                        </Card>
                    </section>

                    {/* Part 3: Dashboard */}
                    <section>
                        <SectionHeading
                            number="3"
                            title={t('au.melengkapiDataDiDasborCalonMahasiswa')}
                            subtitle={t('au.setelahMendaftarDasborMenampilkanStatusKelengkapan')}
                        />
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <For each={getDashboardSteps()}>
                                {(step, index) => (
                                    <div class="bg-white/80 dark:bg-slate-900/60 border border-neutral-200 dark:border-slate-800 rounded-xs p-5 space-y-3">
                                        <div class="flex items-center gap-3">
                                            <span class="size-7 shrink-0 rounded-xs bg-neutral-100 dark:bg-slate-800 border border-neutral-300 dark:border-slate-700 text-neutral-900 dark:text-white text-xs font-bold font-mono flex items-center justify-center">
                                                {index() + 1}
                                            </span>
                                            <h3 class="text-base font-bold text-neutral-900 dark:text-white">{step.title}</h3>
                                        </div>
                                        <p class="text-sm text-neutral-600 dark:text-neutral-300">{step.description}</p>
                                        <ul class="space-y-1.5 text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                                            <For each={step.points}>
                                                {(point) => (
                                                    <li class="flex items-start gap-2">
                                                        <span class="size-1.5 mt-1.5 shrink-0 rounded-full bg-emerald-500"></span>
                                                        <span>{point}</span>
                                                    </li>
                                                )}
                                            </For>
                                        </ul>
                                    </div>
                                )}
                            </For>
                        </div>
                    </section>

                    {/* Part 4: FAQ */}
                    <section>
                        <SectionHeading
                            number="4"
                            title={t('au.pertanyaanYangSeringDiajukan')}
                            subtitle={t('au.beberapaKendalaYangUmumDialamiCalon')}
                        />
                        <div class="space-y-3">
                            <For each={getFaqs()}>
                                {(faq) => (
                                    <details class="group bg-white/80 dark:bg-slate-900/60 border border-neutral-200 dark:border-slate-800 rounded-xs p-5">
                                        <summary class="list-none [&::-webkit-details-marker]:hidden cursor-pointer flex items-center justify-between gap-4 text-sm font-semibold text-neutral-900 dark:text-white">
                                            <span>{faq.question}</span>
                                            <svg class="size-4 shrink-0 text-neutral-500 dark:text-neutral-400 transition-transform group-open:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                <path d="m6 9 6 6 6-6" />
                                            </svg>
                                        </summary>
                                        <p class="mt-3 text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed">{faq.answer}</p>
                                    </details>
                                )}
                            </For>
                        </div>
                    </section>

                    {/* Closing CTA */}
                    <section class="bg-linear-to-r from-emerald-50 dark:from-emerald-950/40 via-white/60 dark:via-slate-900/60 to-blue-50 dark:to-blue-950/40 border border-emerald-500/20 rounded-xs p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h2 class="text-xl font-bold text-neutral-900 dark:text-white mb-1">{t('au.dokumenAndaSudahSiap')}</h2>
                            <p class="text-sm text-neutral-600 dark:text-neutral-300">{t('au.mulaiPendaftaranSekarangProsesPengisianFormulir')}</p>
                        </div>
                        <A
                            href="/authentification/candidate-addmission-form"
                            class="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xs bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold shrink-0 transition-colors"
                        >
                            {t('au.daftarSekarang')}
                        </A>
                    </section>

                    <footer class="text-center pt-8 border-t border-neutral-200 dark:border-slate-800/80 text-xs text-neutral-500">
                        {t('au.butuhBantuanHubungiPanitiaPenerimaanMahasiswa')}
                    </footer>
                </article>
            </main>
        </div>
    );
}
