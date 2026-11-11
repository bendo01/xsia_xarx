import { createSignal, createMemo, onMount, onCleanup, For, Show } from 'solid-js';
import { useParams, A } from '@solidjs/router';
import TopBar from '~/components/navigation/TopBar';
import { Spinner } from '~/components/loader';
import { toast } from '~/components/toast/Toaster';
import QrDisplay from '~/components/attendance/QrDisplay';
import { createRealtime, RealtimeConnection } from '~/lib/realtime';
import {
    listMeetings,
    getRoster,
    saveAttendances,
    openQr,
    getQrToken,
    closeQr,
    MeetingItem,
    RosterItem,
    QrToken,
    AttendTypeOption
} from '~/controllers/academic/campaign/transaction/AcademicCampaignTransactionTeachAttendanceController';
import { t } from '../../../../../../../i18n';

export default function LecturerTeachAttendancePage() {
    const params = useParams();
    const teachId = () => params.id || '';

    const [meetings, setMeetings] = createSignal<MeetingItem[]>([]);
    const [activeMeetingId, setActiveMeetingId] = createSignal('');
    const [roster, setRoster] = createSignal<RosterItem[]>([]);
    const [attendTypes, setAttendTypes] = createSignal<AttendTypeOption[]>([]);
    const [dirty, setDirty] = createSignal<Map<string, string>>(new Map());
    const [isLoading, setIsLoading] = createSignal(true);
    const [isSaving, setIsSaving] = createSignal(false);
    const [connected, setConnected] = createSignal(false);
    const [qr, setQr] = createSignal<QrToken | null>(null);
    const [secondsLeft, setSecondsLeft] = createSignal(0);

    let realtime: RealtimeConnection | null = null;
    let qrTimer: ReturnType<typeof setTimeout> | undefined;
    let tickTimer: ReturnType<typeof setInterval> | undefined;

    const activeMeeting = createMemo(() => meetings().find((m) => m.id === activeMeetingId()) ?? null);
    const presentType = () => attendTypes().find((a) => a.alphabet_code.trim().toUpperCase() === 'H');
    const presentCount = () => roster().filter((r) => r.attend_type_id && r.attend_type_id === presentType()?.id).length;
    const meetingLabel = () => {
        const m = activeMeeting();
        if (!m) return '';
        const kind = m.meeting_type === 'midterm' ? ' (UTS)' : m.meeting_type === 'final' ? ' (UAS)' : '';
        return `Pertemuan ${m.sequence}${kind}`;
    };

    const stopQrTimers = () => {
        clearTimeout(qrTimer);
        clearInterval(tickTimer);
    };

    const scheduleQrRotation = (token: QrToken) => {
        stopQrTimers();
        setQr(token);
        setSecondsLeft(token.expires_in);
        tickTimer = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
        qrTimer = setTimeout(async () => {
            const id = activeMeetingId();
            const res = await getQrToken(id);
            if (id !== activeMeetingId()) return;
            if (res.is_error || !res.data) {
                stopQrTimers();
                setQr(null);
                toast.warning(res.message);
                return;
            }
            scheduleQrRotation(res.data);
        }, Math.max(1, token.expires_in) * 1000);
    };

    const loadRoster = async (meetingId: string) => {
        const res = await getRoster(meetingId);
        if (meetingId !== activeMeetingId()) return;
        if (res.is_error || !res.data) {
            toast.danger(res.message);
            setRoster([]);
            return;
        }
        setAttendTypes(res.data.attend_types);
        setRoster(res.data.entries);
        setDirty(new Map());
    };

    const selectMeeting = async (id: string) => {
        if (id === activeMeetingId()) return;
        stopQrTimers();
        setQr(null);
        setActiveMeetingId(id);
        realtime?.subscribe([`meeting:${id}`]);
        setIsLoading(true);
        await loadRoster(id);
        // A QR session may already be open for this meeting
        if (activeMeeting()?.is_qr_open) {
            const res = await getQrToken(id);
            if (!res.is_error && res.data && id === activeMeetingId()) scheduleQrRotation(res.data);
        }
        setIsLoading(false);
    };

    const setAttendType = (studentId: string, attendTypeId: string) => {
        if (!attendTypeId) return;
        setRoster((list) => list.map((r) => (r.student_id === studentId ? { ...r, attend_type_id: attendTypeId } : r)));
        setDirty((m) => new Map(m).set(studentId, attendTypeId));
    };

    const markAll = () => {
        const present = presentType();
        if (!present) {
            toast.warning("Jenis kehadiran dengan kode 'H' (Hadir) belum dikonfigurasi.");
            return;
        }
        roster().forEach((r) => r.attend_type_id !== present.id && setAttendType(r.student_id, present.id));
    };

    const save = async () => {
        const id = activeMeetingId();
        const entries = [...dirty().entries()].map(([student_id, attend_type_id]) => ({ student_id, attend_type_id }));
        if (!id || entries.length === 0) return;
        setIsSaving(true);
        const res = await saveAttendances(id, entries);
        setIsSaving(false);
        if (res.is_error) {
            toast.danger(res.message);
            return;
        }
        toast.success('Presensi tersimpan dan dikirim ke mahasiswa.');
        setDirty(new Map());
    };

    const startQr = async () => {
        const id = activeMeetingId();
        const res = await openQr(id);
        if (res.is_error || !res.data) {
            toast.danger(res.message);
            return;
        }
        setMeetings((l) => l.map((m) => (m.id === id ? { ...m, is_qr_open: true } : m)));
        scheduleQrRotation(res.data);
    };

    const stopQr = async () => {
        const id = activeMeetingId();
        stopQrTimers();
        setQr(null);
        const res = await closeQr(id);
        if (res.is_error) toast.danger(res.message);
        setMeetings((l) => l.map((m) => (m.id === id ? { ...m, is_qr_open: false } : m)));
    };

    onMount(async () => {
        realtime = createRealtime([], {
            onStatusChange: setConnected,
            onEvent: ({ channel, data }) => {
                if (channel !== `meeting:${activeMeetingId()}` || data.type !== 'attendance_changed') return;
                // Do not overwrite a status the lecturer is editing right now
                if (dirty().has(data.student_id)) return;
                setRoster((list) =>
                    list.map((r) =>
                        r.student_id === data.student_id ? { ...r, attend_type_id: data.attend_type_id, method: data.method } : r
                    )
                );
            }
        });

        const res = await listMeetings(teachId());
        if (res.is_error || !res.data) {
            toast.danger(res.message);
            setIsLoading(false);
            return;
        }
        setMeetings(res.data);
        const first = res.data.find((m) => m.is_qr_open) ?? res.data[0];
        setIsLoading(false);
        if (first) await selectMeeting(first.id);
    });

    onCleanup(() => {
        stopQrTimers();
        realtime?.close();
    });

    return (
        <div class="min-h-screen bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 flex flex-col">
            <TopBar />

            <main class="flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
                <div class="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-neutral-200 dark:border-neutral-800">
                    <nav class="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
                        <A href="/lecturer/dashboard" class="hover:text-blue-600 transition-colors">
                            {t('lc.dashboard')}
                        </A>
                        <span>/</span>
                        <A href="/lecturer/academic/campaign/transaction/teach" class="hover:text-blue-600 transition-colors">
                            {t('lc.pengajaran')}
                        </A>
                        <span>/</span>
                        <span class="font-medium text-neutral-900 dark:text-white">
                            {t('lc.presensiRoster')}
                        </span>
                    </nav>

                    <div class="flex items-center gap-2">
                        <A
                            href="/lecturer/academic/campaign/transaction/teach"
                            class="px-3 py-1.5 rounded-xs border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors inline-flex items-center gap-1.5"
                        >
                            <svg class="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            {t('lc.kembaliKeDaftarKelas')}
                        </A>
                        <A
                            href={`/lecturer/academic/campaign/transaction/teach/${teachId()}/grade`}
                            class="px-3 py-1.5 rounded-xs bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900 text-xs font-semibold transition-colors inline-flex items-center gap-1.5"
                        >
                            {t('lc.nilaiMahasiswa2')}
                        </A>
                    </div>
                </div>

                <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                    <section class="bg-white dark:bg-neutral-800 rounded-xs border border-neutral-200 dark:border-neutral-700 shadow-2xs p-4 sm:p-6 space-y-4">
                        <div class="flex items-center justify-between gap-2">
                            <h1 class="text-lg font-bold">{t('lc.presensiRoster')}</h1>
                            <span class="flex items-center gap-1.5 text-[11px] text-neutral-500" aria-live="polite">
                                <span class={`size-2 rounded-full ${connected() ? 'bg-emerald-500' : 'bg-neutral-400'}`} />
                                {connected() ? 'Live' : 'Offline'}
                            </span>
                        </div>

                        <div class="flex flex-wrap gap-1.5" role="tablist" aria-label="Pertemuan">
                            <For each={meetings()}>
                                {(m) => (
                                    <button
                                        role="tab"
                                        aria-selected={m.id === activeMeetingId()}
                                        onClick={() => selectMeeting(m.id)}
                                        class={`px-2.5 py-1 rounded-xs text-xs font-semibold border transition-colors ${
                                            m.id === activeMeetingId()
                                                ? 'bg-blue-600 border-blue-600 text-white'
                                                : 'bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-700'
                                        }`}
                                        title={m.meeting_type === 'midterm' ? 'Ujian Tengah Semester' : m.meeting_type === 'final' ? 'Ujian Akhir Semester' : `Pertemuan ${m.sequence}`}
                                    >
                                        {m.sequence}
                                        <Show when={m.meeting_type !== 'regular'}>
                                            <span class="ml-1 text-[10px] opacity-80">{m.meeting_type === 'midterm' ? 'UTS' : 'UAS'}</span>
                                        </Show>
                                    </button>
                                )}
                            </For>
                        </div>

                        <Show when={isLoading()}>
                            <div class="py-10 flex justify-center"><Spinner /></div>
                        </Show>

                        <Show when={!isLoading() && activeMeeting()}>
                            <div class="flex flex-wrap items-center justify-between gap-2">
                                <p class="text-sm text-neutral-600 dark:text-neutral-300">
                                    {meetingLabel()} · Hadir {presentCount()} / {roster().length}
                                </p>
                                <div class="flex gap-2">
                                    <button onClick={markAll} class="px-3 py-1.5 rounded-xs border border-neutral-300 dark:border-neutral-700 text-xs font-semibold hover:bg-neutral-50 dark:hover:bg-neutral-700">
                                        Tandai semua hadir
                                    </button>
                                    <button
                                        onClick={save}
                                        disabled={isSaving() || dirty().size === 0}
                                        class="px-3 py-1.5 rounded-xs bg-blue-600 text-white text-xs font-semibold disabled:opacity-50"
                                    >
                                        {isSaving() ? 'Menyimpan…' : `Simpan & kirim${dirty().size ? ` (${dirty().size})` : ''}`}
                                    </button>
                                </div>
                            </div>

                            <div class="overflow-x-auto">
                                <table class="w-full text-sm">
                                    <thead>
                                        <tr class="text-left text-xs text-neutral-500 border-b border-neutral-200 dark:border-neutral-700">
                                            <th class="py-2 pr-2">NIM</th>
                                            <th class="py-2 pr-2">Nama</th>
                                            <th class="py-2 pr-2">Status</th>
                                            <th class="py-2">Via</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <For each={roster()} fallback={<tr><td colspan="4" class="py-6 text-center text-neutral-500">Belum ada peserta terdaftar.</td></tr>}>
                                            {(r) => (
                                                <tr class="border-b border-neutral-100 dark:border-neutral-700/60">
                                                    <td class="py-2 pr-2 font-mono text-xs">{r.student_code}</td>
                                                    <td class="py-2 pr-2">{r.student_name}</td>
                                                    <td class="py-2 pr-2">
                                                        <select
                                                            value={r.attend_type_id ?? ''}
                                                            onChange={(e) => setAttendType(r.student_id, e.currentTarget.value)}
                                                            class="rounded-xs border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-2 py-1 text-xs"
                                                        >
                                                            <option value="" disabled>Belum dicatat</option>
                                                            <For each={attendTypes()}>{(o) => <option value={o.id}>{o.name}</option>}</For>
                                                        </select>
                                                    </td>
                                                    <td class="py-2 text-xs text-neutral-500">{r.method === 'qr' ? 'QR' : r.method === 'manual' ? 'Manual' : '-'}</td>
                                                </tr>
                                            )}
                                        </For>
                                    </tbody>
                                </table>
                            </div>
                        </Show>
                    </section>

                    <aside class="bg-white dark:bg-neutral-800 rounded-xs border border-neutral-200 dark:border-neutral-700 shadow-2xs p-4 sm:p-6 space-y-4 h-fit">
                        <h2 class="text-sm font-bold">Presensi QR-Code</h2>
                        <Show
                            when={qr()}
                            fallback={
                                <div class="space-y-3">
                                    <p class="text-xs text-neutral-500">Tampilkan QR-Code agar mahasiswa memindainya dengan kamera. Kode berganti tiap 30 detik.</p>
                                    <button
                                        onClick={startQr}
                                        disabled={!activeMeeting()}
                                        class="w-full px-3 py-2 rounded-xs bg-blue-600 text-white text-xs font-semibold disabled:opacity-50"
                                    >
                                        Buka presensi QR
                                    </button>
                                </div>
                            }
                        >
                            <div class="space-y-3 text-center">
                                <div class="flex justify-center"><QrDisplay value={qr()!.token} size={256} /></div>
                                <p class="text-xs text-neutral-500">Berganti dalam {secondsLeft()} dtk</p>
                                <button onClick={stopQr} class="w-full px-3 py-2 rounded-xs border border-red-300 text-red-600 text-xs font-semibold hover:bg-red-50 dark:hover:bg-red-950/40">
                                    Tutup presensi QR
                                </button>
                            </div>
                        </Show>
                    </aside>
                </div>
            </main>
        </div>
    );
}
