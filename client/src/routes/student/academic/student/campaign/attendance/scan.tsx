import { createSignal, onMount, onCleanup, For, Show } from 'solid-js';
import { A } from '@solidjs/router';
import TopBar from '~/components/navigation/TopBar';
import { toast } from '~/components/toast/Toaster';
import QrScanner from '~/components/attendance/QrScanner';
import { getActiveStudentId } from '~/lib/authStore';
import { createRealtime, RealtimeConnection } from '~/lib/realtime';
import { scanAttendanceQr } from '~/controllers/academic/campaign/transaction/AcademicCampaignTransactionTeachAttendanceController';

interface AttendanceNotice {
    key: string;
    sequence: number;
    meetingType: string;
    statusName: string;
    method: string;
    at: Date;
}

const meetingName = (n: { sequence: number; meeting_type?: string; meetingType?: string }) => {
    const type = n.meeting_type ?? n.meetingType;
    return `Pertemuan ${n.sequence}${type === 'midterm' ? ' (UTS)' : type === 'final' ? ' (UAS)' : ''}`;
};

export default function StudentAttendanceScanPage() {
    const [scanning, setScanning] = createSignal(false);
    const [busy, setBusy] = createSignal(false);
    const [connected, setConnected] = createSignal(false);
    const [notices, setNotices] = createSignal<AttendanceNotice[]>([]);
    let realtime: RealtimeConnection | null = null;

    const pushNotice = (n: Omit<AttendanceNotice, 'key' | 'at'>) =>
        setNotices((l) => [{ ...n, key: crypto.randomUUID(), at: new Date() }, ...l].slice(0, 20));

    onMount(() => {
        const studentId = getActiveStudentId();
        realtime = createRealtime(studentId ? [`student-attendance:${studentId}`] : [], {
            onStatusChange: setConnected,
            onEvent: ({ data }) => {
                if (data.type !== 'attendance_changed') return;
                const statusName = String(data.attend_type_name ?? '-');
                pushNotice({
                    sequence: data.sequence,
                    meetingType: data.meeting_type,
                    statusName,
                    method: data.method
                });
                // A scan already toasts from the HTTP response; avoid showing it twice
                if (data.method !== 'qr') {
                    toast.info(`${meetingName({ sequence: data.sequence, meetingType: data.meeting_type })}: kehadiran Anda dicatat "${statusName}".`);
                }
            }
        });
    });

    onCleanup(() => realtime?.close());

    const onDetect = async (text: string) => {
        if (busy()) return;
        setBusy(true);
        const res = await scanAttendanceQr(text.trim());
        setBusy(false);
        if (res.is_error || !res.data) {
            toast.danger(res.message);
            return;
        }
        setScanning(false);
        toast.success(`Presensi berhasil: Pertemuan ${res.data.sequence} — ${res.data.attend_type.name}.`);
    };

    return (
        <div class="min-h-screen bg-neutral-100 dark:bg-neutral-900 text-foreground flex flex-col">
            <TopBar />
            <main class="flex-1 w-full max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-6">
                <nav class="text-xs text-neutral-500">
                    <A href="/student/dashboard" class="hover:text-blue-600">Dashboard</A> / <span class="font-medium">Presensi</span>
                </nav>

                <section class="bg-card rounded-md border border-border shadow-2xs p-5 space-y-4">
                    <div class="flex items-center justify-between">
                        <h1 class="text-lg font-bold">Presensi Perkuliahan</h1>
                        <span class="flex items-center gap-1.5 text-[11px] text-neutral-500" aria-live="polite">
                            <span class={`size-2 rounded-full ${connected() ? 'bg-emerald-500' : 'bg-neutral-400'}`} />
                            {connected() ? 'Live' : 'Offline'}
                        </span>
                    </div>

                    <Show
                        when={scanning()}
                        fallback={
                            <button
                                onClick={() => setScanning(true)}
                                class="w-full px-4 py-3 rounded-md bg-blue-600 text-white text-sm font-semibold"
                            >
                                Pindai QR-Code dosen
                            </button>
                        }
                    >
                        <QrScanner onDetect={onDetect} />
                        <p class="text-center text-xs text-neutral-500">
                            {busy() ? 'Memproses…' : 'Arahkan kamera ke QR-Code yang ditampilkan dosen.'}
                        </p>
                        <button
                            onClick={() => setScanning(false)}
                            class="w-full px-4 py-2 rounded-md border border-border text-xs font-semibold"
                        >
                            Batal
                        </button>
                    </Show>
                </section>

                <section class="bg-card rounded-md border border-border shadow-2xs p-5 space-y-3">
                    <h2 class="text-sm font-bold">Pemberitahuan kehadiran</h2>
                    <ul class="space-y-2">
                        <For each={notices()} fallback={<li class="text-xs text-neutral-500">Belum ada pemberitahuan pada sesi ini.</li>}>
                            {(n) => (
                                <li class="flex items-center justify-between text-sm border-b border-neutral-100 dark:border-neutral-700/60 pb-2">
                                    <span>{meetingName({ sequence: n.sequence, meetingType: n.meetingType })}</span>
                                    <span class="flex items-center gap-2">
                                        <span class="font-semibold">{n.statusName}</span>
                                        <span class="text-[11px] text-neutral-500">
                                            {n.method === 'qr' ? 'QR' : 'Dosen'} · {n.at.toLocaleTimeString()}
                                        </span>
                                    </span>
                                </li>
                            )}
                        </For>
                    </ul>
                </section>
            </main>
        </div>
    );
}
