import { onMount, Show, For, type JSX } from 'solid-js';
import { A } from '@solidjs/router';
import TopBar from '~/components/navigation/TopBar';
import { getInstitutionLogo } from '~/lib/institutionLogo';

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

const documents: DocumentItem[] = [
    {
        name: 'Kartu Keluarga (KK)',
        description: 'Kartu Keluarga terbaru yang memuat nama Anda beserta orang tua atau wali.',
        format: 'JPG, PNG atau PDF • maks. 5 MB',
        tips: [
            'Pindai atau foto seluruh halaman KK hingga keempat sudutnya terlihat.',
            'Pastikan nomor KK (16 digit) dan seluruh nama anggota keluarga terbaca jelas.',
        ],
    },
    {
        name: 'Kartu Tanda Penduduk (KTP)',
        description: 'KTP elektronik milik Anda. Jika belum memiliki KTP, gunakan Kartu Identitas Anak (KIA) atau surat keterangan kependudukan.',
        format: 'JPG, PNG atau PDF • maks. 5 MB',
        tips: [
            'Foto KTP di atas permukaan polos dengan pencahayaan cukup, hindari pantulan cahaya (glare).',
            'NIK pada KTP harus sama dengan NIK yang Anda isi pada formulir pendaftaran.',
        ],
    },
    {
        name: 'Pas Foto',
        description: 'Pas foto berwarna terbaru dengan wajah menghadap ke depan.',
        format: 'JPG atau PNG • maks. 5 MB (PDF tidak diterima)',
        tips: [
            'Gunakan latar belakang polos (merah atau biru) dan pakaian rapi berkerah.',
            'Wajah terlihat jelas, tidak memakai kacamata hitam atau masker.',
            'Foto akan digunakan untuk kartu ujian dan kartu mahasiswa, jadi gunakan foto yang layak.',
        ],
    },
    {
        name: 'Ijazah SMA / SMK / MA',
        description: 'Ijazah sekolah menengah atas atau sederajat. Bagi lulusan tahun berjalan yang ijazahnya belum terbit, unggah Surat Keterangan Lulus (SKL) dari sekolah.',
        format: 'JPG, PNG atau PDF • maks. 5 MB',
        tips: [
            'Unggah halaman depan ijazah yang memuat nama, tanggal lahir, dan nomor seri ijazah.',
            'Ijazah atau SKL asli wajib dibawa saat verifikasi berkas di kampus.',
        ],
    },
];

const dataChecklist: string[] = [
    'NIK 16 digit sesuai KTP / Kartu Keluarga',
    'Nomor Kartu Keluarga 16 digit',
    'NISN 10 digit (jika ada) dan nama sekolah asal',
    'Email aktif yang dapat Anda buka',
    'Nomor WhatsApp aktif',
    'NIK, nama, tempat dan tanggal lahir ibu kandung',
    'Data ayah kandung (opsional) atau wali (jika diperlukan)',
];

const formFields: FieldItem[] = [
    { label: 'Nama Lengkap', description: 'Tulis sesuai KTP atau ijazah, tanpa gelar dan tanpa singkatan.', required: true },
    { label: 'NIK', description: '16 digit angka Nomor Induk Kependudukan, sesuai KTP atau Kartu Keluarga.', required: true },
    { label: 'Jenis Kelamin & Agama', description: 'Pilih sesuai data kependudukan Anda.', required: true },
    { label: 'Tempat & Tanggal Lahir', description: 'Isi kota/kabupaten tempat lahir dan pilih tanggal lahir sesuai akta kelahiran.', required: true },
    { label: 'Nomor WhatsApp', description: 'Gunakan format 62 (contoh: 6281234567890). Informasi seleksi akan dikirim ke nomor ini.', required: true },
    { label: 'NISN', description: '10 digit Nomor Induk Siswa Nasional. Dapat dicek di ijazah, rapor, atau situs NISN Kemendikdasmen.', required: false },
    { label: 'Nama Sekolah Asal', description: 'Nama SMA / SMK / MA tempat Anda lulus.', required: false },
    { label: 'Email', description: 'Email aktif milik sendiri. Email ini menjadi nama pengguna saat masuk ke portal.', required: true },
    { label: 'Kata Sandi & Konfirmasi', description: 'Minimal 6 karakter. Simpan baik-baik dan jangan berikan kepada orang lain.', required: true },
];

const dashboardSteps: StepItem[] = [
    {
        title: 'Pilihan Program Studi',
        description: 'Tentukan program studi dan kelas yang ingin Anda ikuti.',
        points: [
            'Pilih program studi dari daftar yang tersedia di institusi.',
            'Pilih kelas: Reguler atau Hybrid / Blended.',
            'Klik "Simpan Pilihan". Pilihan masih dapat diubah selama pendaftaran belum diverifikasi.',
        ],
    },
    {
        title: 'Nomor Kartu Keluarga',
        description: 'Masukkan 16 digit nomor KK sebelum mengisi data orang tua.',
        points: [
            'Nomor KK tercantum di bagian atas Kartu Keluarga.',
            'Klik "Simpan". Data orang tua / wali baru dapat ditambahkan setelah nomor KK tersimpan.',
        ],
    },
    {
        title: 'Data Orang Tua / Wali',
        description: 'Tambahkan anggota keluarga sesuai hubungan dengan Anda.',
        points: [
            'Data Ibu Kandung wajib diisi, termasuk apabila beliau telah meninggal dunia (centang "Sudah meninggal dunia").',
            'Data Ayah Kandung bersifat opsional.',
            'Jika ibu telah meninggal dan ayah telah meninggal atau tidak tercatat (yatim piatu), data Wali (Ayah Wali / Ibu Wali) wajib diisi.',
            'Setiap anggota keluarga memerlukan NIK 16 digit, nama, tempat dan tanggal lahir. Untuk mengganti data, hapus lalu tambahkan kembali.',
        ],
    },
    {
        title: 'Unggah Berkas',
        description: 'Unggah keempat dokumen yang telah Anda siapkan.',
        points: [
            'Klik "Pilih Berkas" pada setiap jenis dokumen, lalu pilih file dari perangkat Anda.',
            'Status berubah menjadi "Terunggah" bila berhasil. Gunakan tombol "Lihat" untuk memeriksa kembali.',
            'Berkas yang salah dapat diganti dengan "Ganti Berkas"; berkas lama otomatis tergantikan.',
        ],
    },
];

const faqs: { question: string; answer: string }[] = [
    {
        question: 'NIK saya ditolak karena "sudah memiliki akun". Apa yang harus dilakukan?',
        answer: 'Artinya NIK tersebut sudah pernah didaftarkan. Masuk menggunakan email yang dulu dipakai, atau gunakan menu Lupa Kata Sandi. Jika Anda tidak pernah mendaftar, hubungi panitia PMB.',
    },
    {
        question: 'Apakah data bisa diubah setelah formulir dikirim?',
        answer: 'Pilihan program studi, nomor KK, data orang tua/wali, dan berkas dapat diperbarui dari dasbor calon mahasiswa. Perubahan data diri (nama, NIK, tanggal lahir) dilakukan melalui panitia PMB.',
    },
    {
        question: 'Saya belum memiliki ijazah karena baru lulus tahun ini.',
        answer: 'Unggah Surat Keterangan Lulus (SKL) dari sekolah pada kolom Ijazah. Ijazah asli diserahkan saat daftar ulang.',
    },
    {
        question: 'Ukuran file saya lebih dari 5 MB.',
        answer: 'Kompres gambar menggunakan aplikasi pemindai di ponsel (mis. mode "dokumen") atau simpan ulang dengan resolusi lebih kecil. Pastikan tulisan tetap terbaca.',
    },
];

function SectionHeading(props: { number: string; title: string; subtitle: string }) {
    return (
        <div class="mb-6">
            <div class="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-xs bg-emerald-500/10 text-emerald-400 text-xs font-mono font-bold uppercase mb-2 border border-emerald-500/20">
                Bagian {props.number}
            </div>
            <h2 class="text-xl sm:text-2xl font-bold text-white tracking-wide mb-1">{props.title}</h2>
            <p class="text-sm text-neutral-400 leading-relaxed max-w-3xl">{props.subtitle}</p>
        </div>
    );
}

function Card(props: { children: JSX.Element; class?: string }) {
    return (
        <div class={`bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-xs p-6 sm:p-8 shadow-xl ${props.class ?? ''}`}>
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
        <div class="min-h-screen flex flex-col bg-[#0A0F1D] text-neutral-100 selection:bg-emerald-500/30 selection:text-emerald-200">
            <TopBar />

            <main class="flex-1 relative overflow-hidden">
                {/* Ambient glowing background shapes */}
                <div class="absolute inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
                    <div class="absolute top-[-20%] left-[-10%] w-[65%] h-[65%] bg-[#0f3460]/40 rounded-full blur-[140px] opacity-70"></div>
                    <div class="absolute top-[40%] right-[-15%] w-[60%] h-[60%] bg-[#0d9488]/20 rounded-full blur-[150px] opacity-60"></div>
                    <div class="absolute bottom-[-20%] left-[20%] w-[55%] h-[55%] bg-[#3b82f6]/20 rounded-full blur-[140px] opacity-50"></div>
                </div>

                <article class="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12">
                    {/* Hero */}
                    <header class="flex flex-col items-center text-center">
                        <Show when={getInstitutionLogo()}>
                            {(logo) => (
                                <img src={logo()} alt="Logo Institusi" class="h-20 sm:h-24 w-auto object-contain mb-6 drop-shadow-[0_0_25px_rgba(16,185,129,0.35)]" />
                            )}
                        </Show>
                        <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold tracking-wide uppercase mb-5">
                            <span class="size-2 rounded-full bg-amber-400 animate-pulse"></span>
                            <span>Penerimaan Mahasiswa Baru • Panduan Pendaftaran</span>
                        </div>
                        <h1 class="text-3xl sm:text-5xl font-extrabold tracking-tight text-white max-w-3xl leading-tight mb-4">
                            Persiapan Dokumen dan Cara Mengisi Formulir Pendaftaran
                        </h1>
                        <p class="text-base sm:text-lg text-neutral-300 max-w-2xl leading-relaxed mb-8">
                            Pendaftaran calon mahasiswa baru dilakukan sepenuhnya secara daring. Baca panduan ini sampai selesai,
                            siapkan dokumen yang diperlukan, lalu ikuti langkah-langkahnya agar pendaftaran Anda lengkap dan dapat segera diverifikasi.
                        </p>
                        <div class="flex flex-wrap items-center justify-center gap-3">
                            <A
                                href="/authentification/candidate-addmission-form"
                                class="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xs bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-all shadow-[0_0_25px_rgba(16,185,129,0.4)] hover:-translate-y-0.5"
                            >
                                <span>Isi Formulir Pendaftaran</span>
                                <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                    <polyline points="12 5 19 12 12 19" />
                                </svg>
                            </A>
                            <A
                                href="/authentification/login_with_session"
                                class="inline-flex items-center gap-2 px-5 py-3.5 rounded-xs bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-neutral-200 text-sm font-semibold transition-all"
                            >
                                Sudah mendaftar? Masuk
                            </A>
                        </div>
                    </header>

                    {/* Overview */}
                    <Card>
                        <h2 class="text-lg font-bold text-white mb-4">Alur Pendaftaran Secara Singkat</h2>
                        <ol class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <For each={['Siapkan dokumen dan data', 'Isi formulir pendaftaran akun', 'Lengkapi data di dasbor calon mahasiswa', 'Tunggu verifikasi panitia PMB']}>
                                {(item, index) => (
                                    <li class="p-4 rounded-xs bg-slate-950/40 border border-slate-800/60 flex items-start gap-3">
                                        <span class="size-6 shrink-0 rounded-xs bg-emerald-600 text-white text-xs font-bold font-mono flex items-center justify-center">
                                            {index() + 1}
                                        </span>
                                        <span class="text-sm text-neutral-200 leading-snug">{item}</span>
                                    </li>
                                )}
                            </For>
                        </ol>
                    </Card>

                    {/* Part 1: Documents */}
                    <section>
                        <SectionHeading
                            number="1"
                            title="Persiapan Dokumen"
                            subtitle="Siapkan file digital dokumen berikut sebelum mulai mendaftar. Keempat dokumen wajib diunggah agar pendaftaran dinyatakan lengkap."
                        />
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <For each={documents}>
                                {(doc) => (
                                    <div class="bg-slate-900/60 border border-slate-800 rounded-xs p-5 space-y-3">
                                        <div class="flex items-start justify-between gap-3">
                                            <h3 class="text-base font-bold text-white">{doc.name}</h3>
                                            <span class="text-[10px] font-bold px-2 py-0.5 rounded-xs bg-amber-500/10 text-amber-300 border border-amber-500/30 whitespace-nowrap">Wajib</span>
                                        </div>
                                        <p class="text-sm text-neutral-300 leading-relaxed">{doc.description}</p>
                                        <p class="text-xs font-mono text-emerald-300">{doc.format}</p>
                                        <ul class="space-y-1.5 text-xs text-neutral-400 leading-relaxed">
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
                            <h3 class="text-base font-bold text-white mb-3">Data yang Perlu Disiapkan</h3>
                            <ul class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-neutral-300">
                                <For each={dataChecklist}>
                                    {(item) => (
                                        <li class="flex items-start gap-2">
                                            <svg class="size-4 mt-0.5 shrink-0 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                            <span>{item}</span>
                                        </li>
                                    )}
                                </For>
                            </ul>
                            <p class="mt-4 text-xs text-neutral-400 leading-relaxed">
                                Format file yang diterima adalah JPG, PNG, dan PDF dengan ukuran maksimal 5 MB per file. Pastikan file tidak buram,
                                tidak terpotong, dan seluruh tulisan dapat dibaca dengan jelas.
                            </p>
                        </Card>
                    </section>

                    {/* Part 2: Registration form */}
                    <section>
                        <SectionHeading
                            number="2"
                            title="Mengisi Formulir Pendaftaran"
                            subtitle="Formulir ini membuat akun pendaftaran Anda. Setelah berhasil, Anda otomatis masuk ke dasbor calon mahasiswa."
                        />
                        <Card>
                            <div class="overflow-x-auto">
                                <table class="w-full text-left text-sm">
                                    <thead>
                                        <tr class="text-xs font-mono uppercase tracking-wider text-neutral-400 border-b border-slate-800">
                                            <th class="py-2 pr-4 font-semibold">Kolom</th>
                                            <th class="py-2 pr-4 font-semibold">Keterangan</th>
                                            <th class="py-2 font-semibold">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <For each={formFields}>
                                            {(field) => (
                                                <tr class="border-b border-slate-800/60 align-top">
                                                    <td class="py-3 pr-4 font-semibold text-white whitespace-nowrap">{field.label}</td>
                                                    <td class="py-3 pr-4 text-neutral-300 leading-relaxed">{field.description}</td>
                                                    <td class="py-3">
                                                        <span
                                                            class="text-[10px] font-bold px-2 py-0.5 rounded-xs border whitespace-nowrap"
                                                            classList={{
                                                                'bg-amber-500/10 text-amber-300 border-amber-500/30': field.required,
                                                                'bg-slate-700/40 text-neutral-300 border-slate-600': !field.required,
                                                            }}
                                                        >
                                                            {field.required ? 'Wajib' : 'Opsional'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            )}
                                        </For>
                                    </tbody>
                                </table>
                            </div>
                            <div class="mt-5 p-3 bg-slate-950/60 border border-slate-800/80 rounded-xs flex items-start gap-2.5 text-xs text-neutral-300">
                                <svg class="size-4 shrink-0 text-amber-400 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="12" y1="16" x2="12" y2="12" />
                                    <line x1="12" y1="8" x2="12.01" y2="8" />
                                </svg>
                                <span class="leading-relaxed">
                                    Satu NIK dan satu email hanya dapat digunakan untuk satu akun. Periksa kembali seluruh isian sebelum menekan tombol
                                    <strong class="text-white"> Daftar Sekarang</strong>, karena data diri menjadi dasar penerbitan dokumen akademik Anda.
                                </span>
                            </div>
                        </Card>
                    </section>

                    {/* Part 3: Dashboard */}
                    <section>
                        <SectionHeading
                            number="3"
                            title="Melengkapi Data di Dasbor Calon Mahasiswa"
                            subtitle="Setelah mendaftar, dasbor menampilkan status kelengkapan dari empat tahapan berikut. Pendaftaran dinyatakan lengkap bila seluruh tahapan berstatus Lengkap."
                        />
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <For each={dashboardSteps}>
                                {(step, index) => (
                                    <div class="bg-slate-900/60 border border-slate-800 rounded-xs p-5 space-y-3">
                                        <div class="flex items-center gap-3">
                                            <span class="size-7 shrink-0 rounded-xs bg-slate-800 border border-slate-700 text-white text-xs font-bold font-mono flex items-center justify-center">
                                                {index() + 1}
                                            </span>
                                            <h3 class="text-base font-bold text-white">{step.title}</h3>
                                        </div>
                                        <p class="text-sm text-neutral-300">{step.description}</p>
                                        <ul class="space-y-1.5 text-xs text-neutral-400 leading-relaxed">
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
                            title="Pertanyaan yang Sering Diajukan"
                            subtitle="Beberapa kendala yang umum dialami calon mahasiswa saat mendaftar."
                        />
                        <div class="space-y-3">
                            <For each={faqs}>
                                {(faq) => (
                                    <details class="group bg-slate-900/60 border border-slate-800 rounded-xs p-5">
                                        <summary class="list-none [&::-webkit-details-marker]:hidden cursor-pointer flex items-center justify-between gap-4 text-sm font-semibold text-white">
                                            <span>{faq.question}</span>
                                            <svg class="size-4 shrink-0 text-neutral-400 transition-transform group-open:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                <path d="m6 9 6 6 6-6" />
                                            </svg>
                                        </summary>
                                        <p class="mt-3 text-sm text-neutral-300 leading-relaxed">{faq.answer}</p>
                                    </details>
                                )}
                            </For>
                        </div>
                    </section>

                    {/* Closing CTA */}
                    <section class="bg-linear-to-r from-emerald-950/40 via-slate-900/60 to-blue-950/40 border border-emerald-500/20 rounded-xs p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h2 class="text-xl font-bold text-white mb-1">Dokumen Anda sudah siap?</h2>
                            <p class="text-sm text-neutral-300">Mulai pendaftaran sekarang. Proses pengisian formulir hanya membutuhkan beberapa menit.</p>
                        </div>
                        <A
                            href="/authentification/candidate-addmission-form"
                            class="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xs bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold shrink-0 transition-colors"
                        >
                            Daftar Sekarang
                        </A>
                    </section>

                    <footer class="text-center pt-8 border-t border-slate-800/80 text-xs text-neutral-500">
                        Butuh bantuan? Hubungi Panitia Penerimaan Mahasiswa Baru atau Biro Administrasi Akademik dan Kemahasiswaan.
                    </footer>
                </article>
            </main>
        </div>
    );
}
