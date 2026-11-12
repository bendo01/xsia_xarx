import { createSignal, createMemo, onMount, onCleanup, For, Show } from 'solid-js';
import { useParams, A } from '@solidjs/router';
import TopBar from '~/components/navigation/TopBar';
import { Spinner } from '~/components/loader';
import { toast } from '~/components/toast/Toaster';
import QrDisplay from '~/components/attendance/QrDisplay';
import { Dialog, DialogContent, DialogTitle, DialogClose } from '~/components/ui/dialog';
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
    const [qrFullscreen, setQrFullscreen] = createSignal(false);
    const [qrSize, setQrSize] = createSignal(256);
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

    const openQrFullscreen = () => {
        setQrSize(Math.max(200, Math.floor(Math.min(window.innerWidth - 64, window.innerHeight - 220))));
        setQrFullscreen(true);
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

    const StatusSelect = (p: { r: RosterItem; class?: string }) => (
        <select
            value={p.r.attend_type_id ?? ''}
            onChange={(e) => setAttendType(p.r.student_id, e.currentTarget.value)}
            class={`rounded-md border border-border bg-card ${p.class ?? ''}`}
        >
            <option value="" disabled>Belum dicatat</option>
            <For each={attendTypes()}>{(o) => <option value={o.id}>{o.name}</option>}</For>
        </select>
    );

    return (
        <div class="min-h-screen bg-neutral-100 dark:bg-neutral-900 text-foreground flex flex-col">
            <TopBar />

            <main class="flex-1 w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
                <div class="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-3 sm:gap-4 pb-4 border-b border-border">
                    <nav class="flex items-center gap-1.5 text-xs text-muted-foreground overflow-x-auto whitespace-nowrap scrollbar-none">
                        <A href="/lecturer/dashboard" class="hover:text-blue-600 transition-colors">
                            {t('lc.dashboard')}
                        </A>
                        <span>/</span>
                        <A href="/lecturer/academic/campaign/transaction/teach" class="hover:text-blue-600 transition-colors">
                            {t('lc.pengajaran')}
                        </A>
                        <span>/</span>
                        <span class="font-medium text-foreground">
                            {t('lc.presensiRoster')}
                        </span>
                    </nav>

                    <div class="grid grid-cols-2 sm:flex items-center gap-2">
                        <A
                            href="/lecturer/academic/campaign/transaction/teach"
                            class="px-3 py-2 sm:py-1.5 rounded-md border border-border bg-card text-xs font-semibold text-foreground/80 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors inline-flex items-center justify-center gap-1.5 text-center"
                        >
                            <svg class="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            {t('lc.kembaliKeDaftarKelas')}
                        </A>
                        <A
                            href={`/lecturer/academic/campaign/transaction/teach/${teachId()}/grade`}
                            class="px-3 py-2 sm:py-1.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900 text-xs font-semibold transition-colors inline-flex items-center justify-center gap-1.5 text-center"
                        >
                            {t('lc.nilaiMahasiswa2')}
                        </A>
                    </div>
                </div>

                <div class="grid gap-4 sm:gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
                    <section class="min-w-0 bg-card rounded-md border border-border shadow-2xs p-3 sm:p-6 space-y-4">
                        <div class="flex items-center justify-between gap-2">
                            <h1 class="text-lg font-bold">{t('lc.presensiRoster')}</h1>
                            <span class="flex items-center gap-1.5 text-[11px] text-neutral-500" aria-live="polite">
                                <span class={`size-2 rounded-full ${connected() ? 'bg-emerald-500' : 'bg-neutral-400'}`} />
                                {connected() ? 'Live' : 'Offline'}
                            </span>
                        </div>

                        <div class="flex gap-1.5 overflow-x-auto sm:flex-wrap -mx-3 px-3 sm:mx-0 sm:px-0 pb-1 sm:pb-0 scrollbar-none" role="tablist" aria-label="Pertemuan">
                            <For each={meetings()}>
                                {(m) => (
                                    <button
                                        role="tab"
                                        aria-selected={m.id === activeMeetingId()}
                                        onClick={() => selectMeeting(m.id)}
                                        class={`shrink-0 min-w-9 px-3 sm:px-2.5 py-2 sm:py-1 rounded-md text-xs font-semibold border transition-colors ${
                                            m.id === activeMeetingId()
                                                ? 'bg-blue-600 border-blue-600 text-white'
                                                : 'bg-card border-border hover:bg-neutral-50 dark:hover:bg-neutral-700'
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
                            <div class="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-2">
                                <p class="text-sm text-muted-foreground">
                                    {meetingLabel()} · Hadir {presentCount()} / {roster().length}
                                </p>
                                <div class="grid grid-cols-2 sm:flex gap-2 w-full sm:w-auto">
                                    <button onClick={markAll} class="px-3 py-2 sm:py-1.5 rounded-md border border-border text-xs font-semibold hover:bg-neutral-50 dark:hover:bg-neutral-700">
                                        Tandai semua hadir
                                    </button>
                                    <button
                                        onClick={save}
                                        disabled={isSaving() || dirty().size === 0}
                                        class="px-3 py-2 sm:py-1.5 rounded-md bg-blue-600 text-white text-xs font-semibold disabled:opacity-50"
                                    >
                                        {isSaving() ? 'Menyimpan…' : `Simpan & kirim${dirty().size ? ` (${dirty().size})` : ''}`}
                                    </button>
                                </div>
                            </div>

                            <div class="hidden sm:block overflow-x-auto">
                                <table class="w-full text-sm">
                                    <thead>
                                        <tr class="text-left text-xs text-neutral-500 border-b border-border">
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
                                                        <StatusSelect r={r} class="px-2 py-1 text-xs" />
                                                    </td>
                                                    <td class="py-2 text-xs text-neutral-500">{r.method === 'qr' ? 'QR' : r.method === 'manual' ? 'Manual' : '-'}</td>
                                                </tr>
                                            )}
                                        </For>
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile: card list */}
                            <ul class="sm:hidden space-y-2">
                                <For each={roster()} fallback={<li class="py-6 text-center text-sm text-muted-foreground">Belum ada peserta terdaftar.</li>}>
                                    {(r) => (
                                        <li class="rounded-md border border-border p-3 space-y-2">
                                            <div class="flex items-start justify-between gap-2">
                                                <div class="min-w-0">
                                                    <p class="text-sm font-medium wrap-break-words">{r.student_name}</p>
                                                    <p class="font-mono text-xs text-muted-foreground">{r.student_code}</p>
                                                </div>
                                                <span class="shrink-0 text-[11px] text-muted-foreground">{r.method === 'qr' ? 'QR' : r.method === 'manual' ? 'Manual' : '-'}</span>
                                            </div>
                                            <StatusSelect r={r} class="w-full px-3 py-2 text-sm" />
                                        </li>
                                    )}
                                </For>
                            </ul>
                        </Show>
                    </section>

                    <aside class="min-w-0 bg-card rounded-md border border-border shadow-2xs p-3 sm:p-6 space-y-4 h-fit">
                        <h2 class="text-sm font-bold">Presensi QR-Code</h2>
                        <Show
                            when={qr()}
                            fallback={
                                <div class="space-y-3">
                                    <p class="text-xs text-neutral-500">Tampilkan QR-Code agar mahasiswa memindainya dengan kamera. Kode berganti tiap 30 detik.</p>
                                    <button
                                        onClick={startQr}
                                        disabled={!activeMeeting()}
                                        class="w-full px-3 py-2.5 sm:py-2 rounded-md bg-blue-600 text-white text-xs font-semibold disabled:opacity-50"
                                    >
                                        Buka presensi QR
                                    </button>
                                </div>
                            }
                        >
                            <div class="space-y-3 text-center">
                                <div class="flex justify-center max-w-full overflow-hidden [&_canvas]:max-w-full [&_canvas]:h-auto [&_img]:max-w-full [&_img]:h-auto [&_svg]:max-w-full [&_svg]:h-auto"><QrDisplay value={qr()!.token} size={256} /></div>
                                <p class="text-xs text-neutral-500">Berganti dalam {secondsLeft()} dtk</p>
                                <button
                                    onClick={openQrFullscreen}
                                    class="w-full px-3 py-2.5 sm:py-2 rounded-md border border-border text-xs font-semibold hover:bg-neutral-50 dark:hover:bg-neutral-700 inline-flex items-center justify-center gap-1.5"
                                >
                                    <svg class="size-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4h4M20 8V4h-4M4 16v4h4M20 16v4h-4" /></svg>
                                    Layar penuh
                                </button>
                                <button onClick={stopQr} class="w-full px-3 py-2.5 sm:py-2 rounded-md border border-red-300 text-red-600 text-xs font-semibold hover:bg-red-50 dark:hover:bg-red-950/40">
                                    Tutup presensi QR
                                </button>
                            </div>
                        </Show>
                    </aside>
                </div>
            </main>

            <Dialog open={qrFullscreen() && !!qr()} onOpenChange={setQrFullscreen}>
                <DialogContent class="max-w-none h-[calc(100dvh-2rem)] flex flex-col items-center justify-center gap-4 text-center">
                    <DialogTitle>{activeMeeting() ? meetingLabel() : 'Presensi QR-Code'}</DialogTitle>
                    <Show when={qr()}>
                        <div class="rounded-xl bg-white p-4 shadow-md">
                            <QrDisplay value={qr()!.token} size={qrSize()} />
                        </div>
                        <p class="text-sm text-muted-foreground" aria-live="off">Berganti dalam {secondsLeft()} dtk · Hadir {presentCount()} / {roster().length}</p>
                    </Show>
                    <DialogClose class="px-5 py-2.5 rounded-md border border-border text-sm font-semibold hover:bg-neutral-50 dark:hover:bg-neutral-700">
                        Tutup layar penuh
                    </DialogClose>
                </DialogContent>
            </Dialog>
        </div>
    );
}
