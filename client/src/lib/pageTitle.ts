/** Browser tab titles, derived from the URL so every route gets one without editing 600+ page files. */

export const APP_NAME: string = import.meta.env.VITE_APP_NAME ?? 'XSIA XARX';

/** First path segment: who the area is for */
const AREAS: Record<string, string> = {
    administrator: 'Administrator',
    student: 'Mahasiswa',
    lecturer: 'Dosen',
    rectorat: 'Rektorat',
    candidate: 'Calon Mahasiswa',
    'course-department': 'Program Studi',
    institution: 'Institusi',
    authentification: 'Autentikasi',
};

/** Last path segment: what the page does */
const ACTIONS: Record<string, string> = {
    create: 'Tambah',
    edit: 'Ubah',
    show: 'Detail',
};

/** Folder names that only group pages and say nothing about the page itself */
const GROUPING = new Set(['master', 'reference', 'referensi', 'transaction', 'campaign', 'index']);

const LABELS: Record<string, string> = {
    'reset-password': 'Atur Ulang Kata Sandi',
    'forgot-password': 'Lupa Kata Sandi',
    'password-reset': 'Atur Ulang Kata Sandi',
    login: 'Masuk',
    login_with_session: 'Masuk',
    verify: 'Verifikasi',
    chatbot: 'Chatbot',
    dashboard: 'Dashboard',
    'what-app': 'WhatsApp',
    'mail-server': 'Server Email',
};

const looksLikeId = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(s) || /^\d+$/.test(s);

const humanize = (s: string) =>
    LABELS[s] ??
    s
        .split(/[-_]/)
        .filter(Boolean)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');

/** `/administrator/location/province/create` → `Tambah Province - Administrator - XSIA XARX` */
export function titleFromPath(pathname: string): string {
    const segments = pathname.split('/').filter(Boolean).map(decodeURIComponent);
    if (segments.length === 0) return APP_NAME;

    const area = AREAS[segments[0]];
    const rest = segments.slice(area ? 1 : 0).filter((s) => !looksLikeId(s));
    const action = rest.length > 0 ? ACTIONS[rest[rest.length - 1]] : undefined;
    const resources = rest.filter((s) => !ACTIONS[s] && !GROUPING.has(s));
    const resource = resources.length > 0 ? humanize(resources[resources.length - 1]) : undefined;

    const page = [action, resource].filter(Boolean).join(' ');
    return [page || undefined, area, APP_NAME].filter(Boolean).join(' - ');
}
