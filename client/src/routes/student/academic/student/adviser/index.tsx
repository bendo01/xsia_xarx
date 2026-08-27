import { createSignal, onMount, For, Show } from 'solid-js';
import { A } from '@solidjs/router';
import TopBar from '~/components/navigation/TopBar';
import { toast } from '~/components/toast/Toaster';
import { listCounsellors, listDecrees, CounsellorItem, DecreeItem } from '~/controllers/academic/student/adviser/AcademicStudentAdviserController';

export default function StudentAdviserIndexPage() {
    const [counsellors, setCounsellors] = createSignal<CounsellorItem[]>([]);
    const [decrees, setDecrees] = createSignal<DecreeItem[]>([]);
    const [isLoading, setIsLoading] = createSignal(true);
    const [searchQuery, setSearchQuery] = createSignal('');
    const [selectedRoleFilter, setSelectedRoleFilter] = createSignal('all');
    const [isConsultModalOpen, setIsConsultModalOpen] = createSignal(false);
    const [selectedAdviser, setSelectedAdviser] = createSignal<CounsellorItem | null>(null);
    const [consultTopic, setConsultTopic] = createSignal('');

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [cRes, dRes] = await Promise.all([
                listCounsellors({ page: 1, page_size: 20 }),
                listDecrees(),
            ]);

            setCounsellors(cRes.data || []);
            setDecrees(dRes || []);
        } catch (err) {
            console.error('Error loading adviser records:', err);
            toast.danger('Failed to load academic advisers from server.');
        } finally {
            setIsLoading(false);
        }
    };

    onMount(() => {
        fetchData();
    });

    const filteredAdvisers = () => {
        return counsellors().filter(item => {
            const matchesQuery = 
                !searchQuery() ||
                (item.lecturer_name || '').toLowerCase().includes(searchQuery().toLowerCase()) ||
                (item.decree_number || '').toLowerCase().includes(searchQuery().toLowerCase()) ||
                (item.lecturer_nidn || '').toLowerCase().includes(searchQuery().toLowerCase());

            const matchesRole = 
                selectedRoleFilter() === 'all' || 
                (item.role_type || '').toLowerCase().includes(selectedRoleFilter().toLowerCase());

            return matchesQuery && matchesRole;
        });
    };

    const handleOpenConsultModal = (adv: CounsellorItem) => {
        setSelectedAdviser(adv);
        setConsultTopic('');
        setIsConsultModalOpen(true);
    };

    const handleSendConsultRequest = (e: Event) => {
        e.preventDefault();
        if (!consultTopic()) {
            toast.danger('Please enter consultation topic or question.');
            return;
        }
        toast.success(`Consultation request submitted to ${selectedAdviser()?.lecturer_name || 'Advisor'}`);
        setIsConsultModalOpen(false);
    };

    return (
        <div class="min-h-screen bg-neutral-50 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 flex flex-col">
            <TopBar />

            <main class="flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                {/* Header Card */}
                <div class="bg-white dark:bg-neutral-800 rounded-3xl p-6 sm:p-8 border border-neutral-200 dark:border-neutral-700 shadow-2xs">
                    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div class="space-y-1">
                            <div class="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-xs font-mono font-semibold border border-amber-200 dark:border-amber-800/80">
                                <span class="size-1.5 rounded-full bg-amber-500"></span>
                                <span>Academic Student Advising</span>
                            </div>
                            <h1 class="text-2xl sm:text-3xl font-black tracking-tight text-neutral-900 dark:text-white">
                                My Academic Advisers & Counsellors
                            </h1>
                            <p class="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
                                View your designated Academic Advisors (Dosen Pembimbing Akademik), Thesis Supervisors, and consultation assignments.
                            </p>
                        </div>

                        <div class="flex items-center gap-3">
                            <A
                                href="/student/person/master/individual/show"
                                class="px-4 py-2.5 bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 rounded-xl text-xs font-bold transition-colors"
                            >
                                ← My Profile
                            </A>
                            <A
                                href="/student/academic/student/campaign/activity"
                                class="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
                            >
                                Semester Study Plan (KRS) →
                            </A>
                        </div>
                    </div>
                </div>

                {/* Filter & Search Bar */}
                <div class="bg-white dark:bg-neutral-800 rounded-2xl p-4 border border-neutral-200 dark:border-neutral-700 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div class="relative w-full sm:w-80">
                        <input
                            type="text"
                            placeholder="Search by advisor name, NIDN, or decree..."
                            value={searchQuery()}
                            onInput={(e) => setSearchQuery(e.currentTarget.value)}
                            class="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-hidden focus:border-blue-500"
                        />
                        <svg class="size-4 absolute left-3 top-2.5 text-neutral-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                    </div>

                    <div class="flex items-center gap-2 w-full sm:w-auto">
                        <label class="text-xs text-neutral-500 font-mono">Role Filter:</label>
                        <select
                            value={selectedRoleFilter()}
                            onChange={(e) => setSelectedRoleFilter(e.currentTarget.value)}
                            class="py-2 px-3 text-xs rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-hidden focus:border-blue-500"
                        >
                            <option value="all">All Advisers</option>
                            <option value="academic">Academic Advisor (PA)</option>
                            <option value="thesis">Thesis Supervisor</option>
                        </select>
                    </div>
                </div>

                {/* Adviser Cards Grid */}
                <Show when={!isLoading()} fallback={
                    <div class="py-16 flex flex-col items-center justify-center gap-3 text-neutral-400">
                        <div class="size-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                        <p class="text-xs font-mono">Loading assigned advisers from server...</p>
                    </div>
                }>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <For each={filteredAdvisers()} fallback={
                            <div class="col-span-2 py-12 text-center text-neutral-400 bg-white dark:bg-neutral-800 rounded-3xl border border-neutral-200 dark:border-neutral-700">
                                <p class="text-sm font-semibold">No assigned advisers found.</p>
                            </div>
                        }>
                            {(adv) => (
                                <div class="bg-white dark:bg-neutral-800 rounded-3xl p-6 border border-neutral-200 dark:border-neutral-700 shadow-2xs flex flex-col justify-between gap-5 hover:border-amber-500/50 transition-all">
                                    <div class="space-y-4">
                                        {/* Top Card Header */}
                                        <div class="flex items-start justify-between gap-3">
                                            <div class="flex items-center gap-3.5">
                                                <div class="size-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-black text-lg flex items-center justify-center">
                                                    {(adv.lecturer_name || 'A').charAt(0)}
                                                </div>
                                                <div>
                                                    <h3 class="text-sm font-bold text-neutral-900 dark:text-white">
                                                        {adv.lecturer_name || '-'}
                                                    </h3>
                                                    <p class="text-xs text-neutral-500 dark:text-neutral-400 font-mono">
                                                        NIDN: {adv.lecturer_nidn || '-'}
                                                    </p>
                                                </div>
                                            </div>

                                            <span class="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase bg-amber-50 text-amber-700 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                                {adv.role_type || 'Academic Advisor'}
                                            </span>
                                        </div>

                                        {/* Details Grid */}
                                        <div class="p-3.5 rounded-2xl bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200/60 dark:border-neutral-700/60 space-y-2 text-xs">
                                            <div class="flex justify-between">
                                                <span class="text-neutral-400 font-mono">Assignment Decree:</span>
                                                <span class="font-bold text-neutral-800 dark:text-neutral-200 font-mono">{adv.decree_number || '-'}</span>
                                            </div>
                                            <div class="flex justify-between">
                                                <span class="text-neutral-400 font-mono">Decree Date:</span>
                                                <span class="font-bold text-neutral-800 dark:text-neutral-200">{adv.decree_date || '-'}</span>
                                            </div>
                                            <div class="flex justify-between">
                                                <span class="text-neutral-400 font-mono">Email:</span>
                                                <span class="font-bold text-blue-600 dark:text-blue-400">{adv.lecturer_email || '-'}</span>
                                            </div>
                                        </div>

                                        <p class="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed">
                                            {adv.notes || ''}
                                        </p>
                                    </div>

                                    {/* Action buttons */}
                                    <div class="pt-3 border-t border-neutral-100 dark:border-neutral-700/50 flex items-center justify-between gap-3">
                                        <span class="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                                            <span class="size-2 rounded-full bg-emerald-500"></span>
                                            Available for Consultation
                                        </span>

                                        <button
                                            type="button"
                                            onClick={() => handleOpenConsultModal(adv)}
                                            class="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                                        >
                                            Request Consultation
                                        </button>
                                    </div>
                                </div>
                            )}
                        </For>
                    </div>
                </Show>
            </main>

            {/* Consultation Request Modal */}
            <Show when={isConsultModalOpen()}>
                <div class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div class="bg-white dark:bg-neutral-800 rounded-3xl max-w-lg w-full p-6 border border-neutral-200 dark:border-neutral-700 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
                        <div class="flex justify-between items-center pb-3 border-b border-neutral-200 dark:border-neutral-700">
                            <div>
                                <h3 class="text-base font-bold text-neutral-900 dark:text-white">Academic Consultation Request</h3>
                                <p class="text-xs text-neutral-500 dark:text-neutral-400">To: {selectedAdviser()?.lecturer_name}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsConsultModalOpen(false)}
                                class="p-1 rounded-lg text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-700"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSendConsultRequest} class="space-y-4 text-xs">
                            <div class="space-y-1.5">
                                <label class="font-bold text-neutral-700 dark:text-neutral-300">Consultation Category / Topic</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Study Plan approval, SKS overload, Thesis proposal"
                                    value={consultTopic()}
                                    onInput={(e) => setConsultTopic(e.currentTarget.value)}
                                    class="w-full p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-hidden focus:border-amber-500"
                                    required
                                />
                            </div>

                            <div class="space-y-1.5">
                                <label class="font-bold text-neutral-700 dark:text-neutral-300">Preferred Meeting Date / Time</label>
                                <input
                                    type="datetime-local"
                                    class="w-full p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-hidden focus:border-amber-500"
                                />
                            </div>

                            <div class="space-y-1.5">
                                <label class="font-bold text-neutral-700 dark:text-neutral-300">Consultation Notes / Description</label>
                                <textarea
                                    rows="3"
                                    placeholder="Briefly describe the items you wish to discuss..."
                                    class="w-full p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white focus:outline-hidden focus:border-amber-500"
                                ></textarea>
                            </div>

                            <div class="pt-3 border-t border-neutral-200 dark:border-neutral-700 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsConsultModalOpen(false)}
                                    class="px-4 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-bold hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    class="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold transition-colors shadow-xs"
                                >
                                    Submit Request
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </Show>
        </div>
    );
}
