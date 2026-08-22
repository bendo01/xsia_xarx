import { createSignal, onMount, createEffect, Show, For } from 'solid-js';
import { useSearchParams } from '@solidjs/router';
import TopBar from '~/components/navigation/TopBar';
import { toast } from '~/components/toast/Toaster';
import type { PersonMasterIndividual, PersonMasterIndividualDataObject } from '~/models/person/master/Individual';
import { PersonMasterIndividualControllerShow, PersonMasterIndividualControllerList } from '~/controllers/person/master/PersonMasterIndividualController';
import type { ModelSelectItem } from '~/models/common/select/ModelSelectItem';

export default function PersonMasterIndividualShowPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [isLoading, setIsLoading] = createSignal(true);
    const [individualData, setIndividualData] = createSignal<PersonMasterIndividualDataObject | null>(null);
    const [individualList, setIndividualList] = createSignal<ModelSelectItem[]>([]);
    const [selectedIndividualId, setSelectedIndividualId] = createSignal<string>(
        (searchParams.id as string) || ''
    );
    const [activeTab, setActiveTab] = createSignal<'demographics' | 'biometrics' | 'family' | 'roles' | 'audit'>('demographics');
    const [photoSrc, setPhotoSrc] = createSignal<string>('/images/Portrait_Placeholder.png');
    const [isPhotoModalOpen, setIsPhotoModalOpen] = createSignal(false);

    // Dialog refs
    let photoDialogRef!: HTMLDialogElement;
    let fileInputRef!: HTMLInputElement;

    // Load available individual list for dropdown switcher
    const fetchIndividualList = async () => {
        try {
            const res = await PersonMasterIndividualControllerList();
            if (res.code === 200 && Array.isArray(res.message)) {
                setIndividualList(res.message);
                const currentId = (searchParams.id as string) || selectedIndividualId();
                if (!currentId && res.message.length > 0 && res.message[0].id) {
                    const firstId = res.message[0].id;
                    setSelectedIndividualId(firstId);
                    setSearchParams({ id: firstId });
                    fetchIndividualDetail(firstId);
                }
            }
        } catch (err) {
            console.error('Failed to load individual selection list', err);
        }
    };

    // Fetch individual detail
    const fetchIndividualDetail = async (id: string) => {
        if (!id || id === '' || id === '00000000-0000-0000-0000-000000000000') {
            setIndividualData(null);
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const res = await PersonMasterIndividualControllerShow(id);
            if (!res.is_error && res.data) {
                setIndividualData(res.data);
            } else {
                setIndividualData(null);
                toast.danger(res.message || 'Individual record not found on server.');
            }
        } catch (error) {
            console.error('Error fetching individual data:', error);
            setIndividualData(null);
            toast.danger('Failed to load individual profile from server.');
        } finally {
            setIsLoading(false);
        }
    };

    onMount(() => {
        fetchIndividualList();
        const initialId = (searchParams.id as string) || '';
        fetchIndividualDetail(initialId);
    });

    createEffect(() => {
        const idFromQuery = searchParams.id as string;
        if (idFromQuery && idFromQuery !== selectedIndividualId()) {
            setSelectedIndividualId(idFromQuery);
            fetchIndividualDetail(idFromQuery);
        }
    });

    const handleSelectIndividual = (e: Event) => {
        const targetId = (e.target as HTMLSelectElement).value;
        setSelectedIndividualId(targetId);
        setSearchParams({ id: targetId });
        fetchIndividualDetail(targetId);
    };

    // Copy to clipboard helper
    const copyToClipboard = (text: string, label: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        toast.success(`Copied ${label} to clipboard: ${text}`, 3000);
    };

    // Photo Dialog Handlers
    const openPhotoModal = () => {
        setIsPhotoModalOpen(true);
        photoDialogRef?.showModal();
    };

    const closePhotoModal = () => {
        setIsPhotoModalOpen(false);
        photoDialogRef?.close();
    };

    const handlePhotoUploadChange = (e: Event) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.danger('File size exceeds 5MB limit.');
                return;
            }
            const reader = new FileReader();
            reader.onload = (loadEv) => {
                if (loadEv.target?.result) {
                    setPhotoSrc(loadEv.target.result as string);
                    toast.success('Portrait photo preview updated!', 3000);
                    closePhotoModal();
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleResetPhoto = () => {
        setPhotoSrc('/images/Portrait_Placeholder.png');
        toast.info('Portrait reset to default placeholder.', 3000);
        closePhotoModal();
    };

    // Helpers for full name, age calculation, and BMI
    const fullPersonName = () => {
        const ind = individualData()?.individual;
        if (!ind) return 'Individual Profile';
        const parts = [ind.front_title, ind.name, ind.last_title].filter(Boolean);
        return parts.join(' ') || ind.name || 'Unnamed Individual';
    };

    const calculateAge = (birthDateStr?: string | null) => {
        if (!birthDateStr) return null;
        const birthDate = new Date(birthDateStr);
        if (isNaN(birthDate.getTime())) return null;
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    const calculateBMI = (heightCm?: number, weightKg?: number) => {
        if (!heightCm || !weightKg || heightCm <= 0 || weightKg <= 0) return null;
        const heightM = heightCm / 100;
        const bmi = weightKg / (heightM * heightM);
        let category = 'Normal';
        let color = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';

        if (bmi < 18.5) {
            category = 'Underweight';
            color = 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-200 dark:border-amber-800';
        } else if (bmi >= 25 && bmi < 30) {
            category = 'Overweight';
            color = 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 border-orange-200 dark:border-orange-800';
        } else if (bmi >= 30) {
            category = 'Obese';
            color = 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border-red-200 dark:border-red-800';
        }

        return {
            value: bmi.toFixed(1),
            category,
            color,
        };
    };

    const totalRolesCount = () => {
        let count = 0;
        if (individualData()?.lecturer) count++;
        if (individualData()?.user) count++;
        count += (individualData()?.employees || []).length;
        count += (individualData()?.students || []).length;
        count += (individualData()?.candidates || []).length;
        count += (individualData()?.evaluators || []).length;
        return count;
    };

    const printPage = () => {
        window.print();
    };

    return (
        <div class="min-h-screen bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100">
            <TopBar />

            <div class="mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
                {/* 1. Header Navigation & Quick Actions */}
                <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-neutral-200 dark:border-neutral-800 pb-4">
                    <div>
                        {/* Breadcrumbs */}
                        <nav class="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400 mb-1" aria-label="Breadcrumb">
                            <a href="/" class="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Home</a>
                            <span>/</span>
                            <span class="text-neutral-600 dark:text-neutral-300">Person</span>
                            <span>/</span>
                            <a href="/person/master/individual" class="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Master Individual</a>
                            <span>/</span>
                            <span class="font-medium text-neutral-900 dark:text-white">Profile Details</span>
                        </nav>
                        <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-white flex items-center gap-3">
                            <span>Individual Master Profile</span>
                            <Show when={individualData()?.individual.is_deceased}>
                                <span class="px-2 py-0.5 text-xs font-semibold uppercase tracking-wider bg-neutral-800 text-neutral-200 dark:bg-neutral-700">
                                    Deceased / Almarhum
                                </span>
                            </Show>
                        </h1>
                        <p class="text-sm text-neutral-600 dark:text-neutral-400 mt-0.5">
                            Comprehensive biometric, demographic, civil registration, and institutional identity record.
                        </p>
                    </div>

                    {/* Quick Action Toolbar */}
                    <div class="flex items-center flex-wrap gap-2">
                        {/* Individual Selector Dropdown */}
                        <Show when={individualList().length > 0}>
                            <div class="relative min-w-48">
                                <select
                                    class="w-full text-xs font-medium bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 py-2 px-3 text-neutral-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-none cursor-pointer transition-colors shadow-2xs"
                                    value={selectedIndividualId()}
                                    onChange={handleSelectIndividual}
                                    id="select-active-individual"
                                    aria-label="Switch individual record"
                                >
                                    <option value="">-- Switch Individual Record --</option>
                                    <For each={individualList()}>
                                        {(item) => (
                                            <option value={item.id}>{item.label || item.name}</option>
                                        )}
                                    </For>
                                </select>
                            </div>
                        </Show>

                        {/* Back Button */}
                        <a
                            href="/person/master/individual"
                            class="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-white hover:bg-neutral-50 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 rounded-none shadow-2xs transition-colors cursor-pointer"
                            id="btn-back-to-list"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="m15 18-6-6 6-6" />
                            </svg>
                            <span>Back to Index</span>
                        </a>

                        {/* Print Button */}
                        <button
                            type="button"
                            onClick={printPage}
                            class="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-white hover:bg-neutral-50 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 rounded-none shadow-2xs transition-colors cursor-pointer"
                            id="btn-print-profile"
                            title="Print profile sheet"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <polyline points="6 9 6 2 18 2 18 9" />
                                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                                <rect width="12" height="8" x="6" y="14" />
                            </svg>
                            <span>Print</span>
                        </button>

                        {/* Edit Button */}
                        <a
                            href={`/person/master/individual/edit?id=${individualData()?.individual.id || ''}`}
                            class="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-none shadow-2xs transition-colors cursor-pointer"
                            id="btn-edit-individual"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M12 20h9" />
                                <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
                            </svg>
                            <span>Edit Record</span>
                        </a>
                    </div>
                </div>

                {/* 2. Hero Profile Card with Portrait Placeholder */}
                <div class="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-2xs overflow-hidden">
                    <div class="p-6 md:p-8">
                        <div class="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">

                            {/* --- PHOTO / PORTRAIT SECTION --- */}
                            <div class="flex flex-col items-center shrink-0">
                                <div class="relative group cursor-pointer" onClick={openPhotoModal}>
                                    <div class="size-36 sm:size-44 md:size-48 bg-neutral-100 dark:bg-neutral-900 border-2 border-neutral-300 dark:border-neutral-600 overflow-hidden shadow-md flex items-center justify-center transition-transform duration-300 group-hover:scale-[1.02]">
                                        <img
                                            src={photoSrc()}
                                            alt={`Portrait of ${fullPersonName()}`}
                                            class="w-full h-full object-cover object-top"
                                            onError={(e) => {
                                                (e.currentTarget as HTMLImageElement).src = '/images/Portrait_Placeholder.png';
                                            }}
                                            id="img-individual-portrait"
                                        />
                                    </div>

                                    {/* Hover Overlay with Action Hint */}
                                    <div class="absolute inset-0 bg-neutral-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white p-2 text-center pointer-events-none">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="size-6 mb-1 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <circle cx="11" cy="11" r="8" />
                                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                                            <line x1="11" y1="8" x2="11" y2="14" />
                                            <line x1="8" y1="11" x2="14" y2="11" />
                                        </svg>
                                        <span class="text-xs font-semibold">Inspect / Change</span>
                                    </div>

                                    {/* Placeholder Badge Indicator */}
                                    <div class="absolute -bottom-2.5 inset-x-0 flex justify-center">
                                        <span class="px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase bg-blue-600 text-white shadow-xs border border-white dark:border-neutral-800">
                                            Photo ID
                                        </span>
                                    </div>
                                </div>

                                <div class="mt-4 flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={openPhotoModal}
                                        class="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
                                        id="btn-open-photo-modal"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                                            <circle cx="12" cy="13" r="4" />
                                        </svg>
                                        <span>Change Avatar</span>
                                    </button>
                                </div>
                            </div>

                            {/* --- HERO SUMMARY DETAILS --- */}
                            <div class="flex-1 text-center md:text-left space-y-4 w-full">
                                <div>
                                    <div class="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-1.5">
                                        {/* Status & Role Tags */}
                                        <span class="inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                            <span class="size-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                            Active Record
                                        </span>

                                        <Show when={individualData()?.lecturer}>
                                            <span class="inline-flex items-center px-2 py-0.5 text-xs font-semibold bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                                                Lecturer / Dosen
                                            </span>
                                        </Show>

                                        <Show when={(individualData()?.employees || []).length > 0}>
                                            <span class="inline-flex items-center px-2 py-0.5 text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                                Staff / Pegawai ({(individualData()?.employees || []).length})
                                            </span>
                                        </Show>

                                        <Show when={(individualData()?.students || []).length > 0}>
                                            <span class="inline-flex items-center px-2 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                                Student / Mahasiswa ({(individualData()?.students || []).length})
                                            </span>
                                        </Show>

                                        <Show when={(individualData()?.candidates || []).length > 0}>
                                            <span class="inline-flex items-center px-2 py-0.5 text-xs font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                                PMB Candidate
                                            </span>
                                        </Show>

                                        <Show when={(individualData()?.evaluators || []).length > 0}>
                                            <span class="inline-flex items-center px-2 py-0.5 text-xs font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                                                RPL Evaluator
                                            </span>
                                        </Show>

                                        <Show when={individualData()?.user}>
                                            <span class="inline-flex items-center px-2 py-0.5 text-xs font-semibold bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                                                User Account
                                            </span>
                                        </Show>

                                        <Show when={individualData()?.individual?.is_social_protection_card_recipient}>
                                            <span class="inline-flex items-center px-2 py-0.5 text-xs font-semibold bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-950 dark:text-fuchsia-300 border border-fuchsia-200 dark:border-fuchsia-800">
                                                KPS / KIP Recipient
                                            </span>
                                        </Show>

                                        <Show when={individualData()?.individual?.is_special_need}>
                                            <span class="inline-flex items-center px-2 py-0.5 text-xs font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                                Special Needs
                                            </span>
                                        </Show>
                                    </div>

                                    <h2 class="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight" id="txt-individual-fullname">
                                        {fullPersonName()}
                                    </h2>

                                    <div class="mt-1 flex flex-wrap items-center justify-center md:justify-start gap-3 text-xs text-neutral-600 dark:text-neutral-400">
                                        <div class="flex items-center gap-1">
                                            <span class="font-semibold text-neutral-500 uppercase">NIK / Code:</span>
                                            <span class="font-mono font-medium text-neutral-900 dark:text-neutral-200">{individualData()?.individual.code || '-'}</span>
                                            <button
                                                type="button"
                                                onClick={() => copyToClipboard(individualData()?.individual.code || '', 'NIK/Code')}
                                                class="text-neutral-400 hover:text-neutral-700 dark:hover:text-white p-0.5 cursor-pointer"
                                                title="Copy NIK/Code"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                                    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                                                    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                                                </svg>
                                            </button>
                                        </div>
                                        <span>•</span>
                                        <div>
                                            <span class="font-semibold text-neutral-500 uppercase">ID Type:</span>{' '}
                                            <span class="font-medium text-neutral-800 dark:text-neutral-200">{individualData()?.identification_type?.name || '-'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Quick Highlights Grid */}
                                <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                                    <div class="p-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-left">
                                        <span class="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">Gender</span>
                                        <span class="text-sm font-semibold text-neutral-900 dark:text-white flex items-center gap-1 mt-0.5">
                                            {individualData()?.gender?.name || '-'}
                                        </span>
                                    </div>

                                    <div class="p-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-left">
                                        <span class="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">Age & Bracket</span>
                                        <span class="text-sm font-semibold text-neutral-900 dark:text-white mt-0.5 block truncate">
                                            {calculateAge(individualData()?.individual.birth_date) ? `${calculateAge(individualData()?.individual.birth_date)} Tahun` : '-'}
                                            <span class="text-xs font-normal text-neutral-500 block truncate">
                                                {individualData()?.age_classification?.name || '-'}
                                            </span>
                                        </span>
                                    </div>

                                    <div class="p-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-left">
                                        <span class="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">Religion</span>
                                        <span class="text-sm font-semibold text-neutral-900 dark:text-white mt-0.5 block">
                                            {individualData()?.religion?.name || '-'}
                                        </span>
                                    </div>

                                    <div class="p-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-left">
                                        <span class="block text-[11px] font-semibold text-neutral-500 uppercase tracking-wider">Marital Status</span>
                                        <span class="text-sm font-semibold text-neutral-900 dark:text-white mt-0.5 block">
                                            {individualData()?.marital_status?.name || '-'}
                                        </span>
                                    </div>
                                </div>

                                {/* Place & Date of Birth Strip */}
                                <div class="flex flex-wrap items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-900/60 border border-neutral-200 dark:border-neutral-700/80 text-xs">
                                    <div class="flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="size-4 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                                            <line x1="16" y1="2" x2="16" y2="6" />
                                            <line x1="8" y1="2" x2="8" y2="6" />
                                            <line x1="3" y1="10" x2="21" y2="10" />
                                        </svg>
                                        <span class="text-neutral-600 dark:text-neutral-400">Place & Date of Birth:</span>
                                        <span class="font-semibold text-neutral-900 dark:text-white">
                                            {individualData()?.individual.birth_place || '-'},{' '}
                                            {individualData()?.individual.birth_date ? new Date(individualData()!.individual.birth_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                                        </span>
                                    </div>

                                    <div class="flex items-center gap-2 mt-1 sm:mt-0 text-neutral-500">
                                        <span>Profession:</span>
                                        <span class="font-medium text-neutral-800 dark:text-neutral-200">
                                            {individualData()?.profession?.name || individualData()?.occupation?.name || '-'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Navigation Tabs */}
                    <div class="flex border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/80 overflow-x-auto">
                        <button
                            type="button"
                            onClick={() => setActiveTab('demographics')}
                            class={`px-4 sm:px-6 py-3 text-xs sm:text-sm font-semibold whitespace-nowrap border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${activeTab() === 'demographics'
                                    ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-neutral-800'
                                    : 'border-transparent text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
                                }`}
                            id="tab-demographics"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                                <circle cx="12" cy="7" r="4" />
                            </svg>
                            <span>1. Demographics & Civil ID</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('biometrics')}
                            class={`px-4 sm:px-6 py-3 text-xs sm:text-sm font-semibold whitespace-nowrap border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${activeTab() === 'biometrics'
                                    ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-neutral-800'
                                    : 'border-transparent text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
                                }`}
                            id="tab-biometrics"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                            </svg>
                            <span>2. Biometrics & Biodata</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('family')}
                            class={`px-4 sm:px-6 py-3 text-xs sm:text-sm font-semibold whitespace-nowrap border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${activeTab() === 'family'
                                    ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-neutral-800'
                                    : 'border-transparent text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
                                }`}
                            id="tab-family"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                            <span>3. Family Card</span>
                            <Show when={(individualData()?.family_card_members || []).length > 0}>
                                <span class="px-1.5 py-0.2 text-[10px] rounded-full bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 font-bold">
                                    {(individualData()?.family_card_members || []).length}
                                </span>
                            </Show>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('roles')}
                            class={`px-4 sm:px-6 py-3 text-xs sm:text-sm font-semibold whitespace-nowrap border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${activeTab() === 'roles'
                                    ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-neutral-800'
                                    : 'border-transparent text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
                                }`}
                            id="tab-roles"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
                                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                            </svg>
                            <span>4. Academic & Staff Roles</span>
                            <Show when={totalRolesCount() > 0}>
                                <span class="px-1.5 py-0.2 text-[10px] rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-bold">
                                    {totalRolesCount()}
                                </span>
                            </Show>
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('audit')}
                            class={`px-4 sm:px-6 py-3 text-xs sm:text-sm font-semibold whitespace-nowrap border-b-2 transition-colors cursor-pointer flex items-center gap-2 ${activeTab() === 'audit'
                                    ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-white dark:bg-neutral-800'
                                    : 'border-transparent text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white'
                                }`}
                            id="tab-audit"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                            </svg>
                            <span>5. System Audit Log</span>
                        </button>
                    </div>
                </div>

                {/* 3. Tab Content Panels */}

                {/* --- TAB 1: DEMOGRAPHICS & CIVIL REGISTRATION --- */}
                <Show when={activeTab() === 'demographics'}>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Civil Identity Card */}
                        <div class="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-2xs p-6">
                            <div class="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-700 mb-4">
                                <h3 class="font-bold text-sm text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="size-4 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <rect width="20" height="14" x="2" y="5" rx="2" />
                                        <line x1="2" x2="22" y1="10" y2="10" />
                                    </svg>
                                    Civil Registration & Identity
                                </h3>
                                <span class="text-xs text-neutral-400 font-mono">Dukcapil Ref</span>
                            </div>

                            <dl class="divide-y divide-neutral-100 dark:divide-neutral-700/60 text-xs sm:text-sm">
                                <div class="py-2.5 grid grid-cols-3">
                                    <dt class="font-medium text-neutral-500 dark:text-neutral-400">Full Legal Name</dt>
                                    <dd class="col-span-2 font-semibold text-neutral-900 dark:text-white">{individualData()?.individual.name || '-'}</dd>
                                </div>
                                <div class="py-2.5 grid grid-cols-3">
                                    <dt class="font-medium text-neutral-500 dark:text-neutral-400">Front Title (Gelar Depan)</dt>
                                    <dd class="col-span-2 font-mono text-neutral-800 dark:text-neutral-200">{individualData()?.individual.front_title || '-'}</dd>
                                </div>
                                <div class="py-2.5 grid grid-cols-3">
                                    <dt class="font-medium text-neutral-500 dark:text-neutral-400">Last Title (Gelar Belakang)</dt>
                                    <dd class="col-span-2 font-mono text-neutral-800 dark:text-neutral-200">{individualData()?.individual.last_title || '-'}</dd>
                                </div>
                                <div class="py-2.5 grid grid-cols-3">
                                    <dt class="font-medium text-neutral-500 dark:text-neutral-400">Identification (NIK)</dt>
                                    <dd class="col-span-2 font-mono font-bold text-neutral-900 dark:text-white flex items-center justify-between">
                                        <span>{individualData()?.individual.code || '-'}</span>
                                        <button
                                            type="button"
                                            onClick={() => copyToClipboard(individualData()?.individual.code || '', 'NIK')}
                                            class="text-blue-600 dark:text-blue-400 text-xs hover:underline cursor-pointer"
                                        >
                                            Copy
                                        </button>
                                    </dd>
                                </div>
                                <div class="py-2.5 grid grid-cols-3">
                                    <dt class="font-medium text-neutral-500 dark:text-neutral-400">ID Document Type</dt>
                                    <dd class="col-span-2 text-neutral-800 dark:text-neutral-200">{individualData()?.identification_type?.name || '-'}</dd>
                                </div>
                                <div class="py-2.5 grid grid-cols-3">
                                    <dt class="font-medium text-neutral-500 dark:text-neutral-400">Place of Birth</dt>
                                    <dd class="col-span-2 text-neutral-800 dark:text-neutral-200">{individualData()?.individual.birth_place || '-'}</dd>
                                </div>
                                <div class="py-2.5 grid grid-cols-3">
                                    <dt class="font-medium text-neutral-500 dark:text-neutral-400">Date of Birth</dt>
                                    <dd class="col-span-2 text-neutral-800 dark:text-neutral-200">
                                        {individualData()?.individual.birth_date ? new Date(individualData()!.individual.birth_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                                    </dd>
                                </div>
                            </dl>
                        </div>

                        {/* Socio-Demographics & Welfare Card */}
                        <div class="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-2xs p-6">
                            <div class="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-700 mb-4">
                                <h3 class="font-bold text-sm text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" class="size-4 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                                    </svg>
                                    Socio-Economic & Demographics
                                </h3>
                                <span class="text-xs text-neutral-400 font-mono">Classification</span>
                            </div>

                            <dl class="divide-y divide-neutral-100 dark:divide-neutral-700/60 text-xs sm:text-sm">
                                <div class="py-2.5 grid grid-cols-3">
                                    <dt class="font-medium text-neutral-500 dark:text-neutral-400">Gender</dt>
                                    <dd class="col-span-2 text-neutral-800 dark:text-neutral-200">{individualData()?.gender?.name || '-'}</dd>
                                </div>
                                <div class="py-2.5 grid grid-cols-3">
                                    <dt class="font-medium text-neutral-500 dark:text-neutral-400">Religion</dt>
                                    <dd class="col-span-2 text-neutral-800 dark:text-neutral-200">{individualData()?.religion?.name || '-'}</dd>
                                </div>
                                <div class="py-2.5 grid grid-cols-3">
                                    <dt class="font-medium text-neutral-500 dark:text-neutral-400">Marital Status</dt>
                                    <dd class="col-span-2 text-neutral-800 dark:text-neutral-200">{individualData()?.marital_status?.name || '-'}</dd>
                                </div>
                                <div class="py-2.5 grid grid-cols-3">
                                    <dt class="font-medium text-neutral-500 dark:text-neutral-400">Occupation</dt>
                                    <dd class="col-span-2 text-neutral-800 dark:text-neutral-200">{individualData()?.occupation?.name || '-'}</dd>
                                </div>
                                <div class="py-2.5 grid grid-cols-3">
                                    <dt class="font-medium text-neutral-500 dark:text-neutral-400">Profession</dt>
                                    <dd class="col-span-2 text-neutral-800 dark:text-neutral-200">{individualData()?.profession?.name || '-'}</dd>
                                </div>
                                <div class="py-2.5 grid grid-cols-3">
                                    <dt class="font-medium text-neutral-500 dark:text-neutral-400">Latest Education</dt>
                                    <dd class="col-span-2 text-neutral-800 dark:text-neutral-200">{individualData()?.education?.name || individualData()?.education?.abbreviation || '-'}</dd>
                                </div>
                                <div class="py-2.5 grid grid-cols-3">
                                    <dt class="font-medium text-neutral-500 dark:text-neutral-400">Income Bracket</dt>
                                    <dd class="col-span-2 text-neutral-800 dark:text-neutral-200">{individualData()?.income?.name || '-'}</dd>
                                </div>
                                <div class="py-2.5 grid grid-cols-3">
                                    <dt class="font-medium text-neutral-500 dark:text-neutral-400">Age Classification</dt>
                                    <dd class="col-span-2 text-neutral-800 dark:text-neutral-200">{individualData()?.age_classification?.name || '-'}</dd>
                                </div>
                                <div class="py-2.5 grid grid-cols-3">
                                    <dt class="font-medium text-neutral-500 dark:text-neutral-400">Social Protection (KPS)</dt>
                                    <dd class="col-span-2">
                                        <span class={`inline-flex items-center px-2 py-0.5 text-xs font-semibold ${individualData()?.individual?.is_social_protection_card_recipient
                                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
                                                : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300'
                                            }`}>
                                            {individualData()?.individual?.is_social_protection_card_recipient ? 'Recipient (Penerima)' : 'No (Bukan Penerima)'}
                                        </span>
                                    </dd>
                                </div>
                                <div class="py-2.5 grid grid-cols-3">
                                    <dt class="font-medium text-neutral-500 dark:text-neutral-400">Special Needs (Disabilitas)</dt>
                                    <dd class="col-span-2">
                                        <span class={`inline-flex items-center px-2 py-0.5 text-xs font-semibold ${individualData()?.individual?.is_special_need
                                                ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                                                : 'bg-neutral-100 text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300'
                                            }`}>
                                            {individualData()?.individual?.is_special_need ? 'Yes (Berkebutuhan Khusus)' : 'None (Tidak Ada)'}
                                        </span>
                                    </dd>
                                </div>
                            </dl>
                        </div>
                    </div>
                </Show>

                {/* --- TAB 2: BIOMETRICS & BIODATA --- */}
                <Show when={activeTab() === 'biometrics'}>
                    <Show
                        when={individualData()?.biodata}
                        fallback={
                            <div class="p-8 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-center text-xs text-neutral-500 dark:text-neutral-400">
                                No physical measurements or biometric records available for this individual.
                            </div>
                        }
                    >
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Physical Metrics & BMI */}
                            <div class="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-2xs p-6 md:col-span-1 space-y-4">
                                <h3 class="font-bold text-sm text-neutral-900 dark:text-white uppercase tracking-wider pb-2 border-b border-neutral-200 dark:border-neutral-700">
                                    Height & Weight Index
                                </h3>

                                <div class="space-y-3">
                                    <div class="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700">
                                        <span class="text-xs text-neutral-500">Height (Tinggi)</span>
                                        <span class="text-lg font-bold text-neutral-900 dark:text-white">
                                            {individualData()?.biodata?.height || '-'} <span class="text-xs font-normal text-neutral-500">cm</span>
                                        </span>
                                    </div>

                                    <div class="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700">
                                        <span class="text-xs text-neutral-500">Weight (Berat)</span>
                                        <span class="text-lg font-bold text-neutral-900 dark:text-white">
                                            {individualData()?.biodata?.weight || '-'} <span class="text-xs font-normal text-neutral-500">kg</span>
                                        </span>
                                    </div>

                                    {/* BMI Indicator */}
                                    {(() => {
                                        const h = individualData()?.biodata?.height;
                                        const w = individualData()?.biodata?.weight;
                                        if (!h || !w) return null;
                                        const bmi = calculateBMI(h, w);
                                        return (
                                            <div class="p-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 space-y-2">
                                                <div class="flex justify-between items-center">
                                                    <span class="text-xs text-neutral-500">BMI Calculation</span>
                                                    <span class={`px-2 py-0.5 text-xs font-semibold border ${bmi?.color}`}>
                                                        {bmi?.category}
                                                    </span>
                                                </div>
                                                <div class="text-2xl font-black text-neutral-900 dark:text-white">
                                                    {bmi?.value} <span class="text-xs font-normal text-neutral-500">kg/m²</span>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>

                            {/* Blood Type & Biometric Features */}
                            <div class="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-2xs p-6 md:col-span-2 space-y-4">
                                <h3 class="font-bold text-sm text-neutral-900 dark:text-white uppercase tracking-wider pb-2 border-b border-neutral-200 dark:border-neutral-700">
                                    Biological & Morphological Features
                                </h3>

                                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                                    <div class="p-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700">
                                        <span class="block text-xs text-neutral-500">Blood Type & Rhesus</span>
                                        <span class="text-base font-bold text-red-600 dark:text-red-400 mt-1 block">
                                            Type {individualData()?.biodata?.blood_type || '-'}{' '}
                                            <span class="text-xs font-medium text-neutral-700 dark:text-neutral-300">
                                                ({individualData()?.biodata?.is_positive_blood_rhesus ? 'Rh+' : 'Rh-'})
                                            </span>
                                        </span>
                                    </div>

                                    <div class="p-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700">
                                        <span class="block text-xs text-neutral-500">Eye Color (Warna Mata)</span>
                                        <span class="text-base font-semibold text-neutral-900 dark:text-white mt-1 block">
                                            {individualData()?.biodata?.eye_color || '-'}
                                        </span>
                                    </div>

                                    <div class="p-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700">
                                        <span class="block text-xs text-neutral-500">Hair Type (Jenis Rambut)</span>
                                        <span class="text-base font-semibold text-neutral-900 dark:text-white mt-1 block">
                                            {individualData()?.biodata?.hair_type || '-'}
                                        </span>
                                    </div>

                                    <div class="p-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700">
                                        <span class="block text-xs text-neutral-500">Hair Color (Warna Rambut)</span>
                                        <span class="text-base font-semibold text-neutral-900 dark:text-white mt-1 block">
                                            {individualData()?.biodata?.hair_color || '-'}
                                        </span>
                                    </div>
                                </div>

                                {/* Anthropometric Circumferences */}
                                <div class="pt-2">
                                    <h4 class="text-xs font-semibold text-neutral-600 dark:text-neutral-400 uppercase tracking-wider mb-2">
                                        Body Circumferences (Lingkar Tubuh)
                                    </h4>
                                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                                        <div class="p-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700">
                                            <span class="text-neutral-500 block">Bust / Dada</span>
                                            <span class="font-bold text-sm text-neutral-900 dark:text-white">{individualData()?.biodata?.bust || '-'} cm</span>
                                        </div>
                                        <div class="p-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700">
                                            <span class="text-neutral-500 block">Waist / Pinggang</span>
                                            <span class="font-bold text-sm text-neutral-900 dark:text-white">{individualData()?.biodata?.waist || '-'} cm</span>
                                        </div>
                                        <div class="p-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700">
                                            <span class="text-neutral-500 block">Hip / Pinggul</span>
                                            <span class="font-bold text-sm text-neutral-900 dark:text-white">{individualData()?.biodata?.hip || '-'} cm</span>
                                        </div>
                                        <div class="p-2.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700">
                                            <span class="text-neutral-500 block">Arm / Lengan</span>
                                            <span class="font-bold text-sm text-neutral-900 dark:text-white">{individualData()?.biodata?.arm_circumference || '-'} cm</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Show>
                </Show>

                {/* --- TAB 3: FAMILY CARD & RELATIVES --- */}
                <Show when={activeTab() === 'family'}>
                    <Show
                        when={(individualData()?.family_card_members || []).length > 0}
                        fallback={
                            <div class="p-8 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-center text-xs text-neutral-500 dark:text-neutral-400">
                                No family card or household member records linked to this individual.
                            </div>
                        }
                    >
                        <div class="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-2xs p-6 space-y-4">
                            <div class="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-700">
                                <div>
                                    <h3 class="font-bold text-sm text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="size-4 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                            <circle cx="9" cy="7" r="4" />
                                            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                                        </svg>
                                        Family Card & Household Members (Kartu Keluarga)
                                    </h3>
                                    <p class="text-xs text-neutral-500 mt-0.5">
                                        Official household relations and registered family members.
                                    </p>
                                </div>
                            </div>

                            <div class="overflow-x-auto">
                                <table class="w-full text-xs sm:text-sm text-left">
                                    <thead class="text-xs text-neutral-600 uppercase bg-neutral-100 dark:bg-neutral-900 dark:text-neutral-300 border-b border-neutral-200 dark:border-neutral-700">
                                        <tr>
                                            <th class="px-4 py-3 font-semibold">Relative Name</th>
                                            <th class="px-4 py-3 font-semibold">NIK</th>
                                            <th class="px-4 py-3 font-semibold">Relation Type</th>
                                            <th class="px-4 py-3 font-semibold">Gender</th>
                                            <th class="px-4 py-3 font-semibold">Birth Date</th>
                                        </tr>
                                    </thead>
                                    <tbody class="divide-y divide-neutral-200 dark:divide-neutral-700">
                                        <For each={individualData()?.family_card_members || []}>
                                            {(member) => (
                                                <tr class="hover:bg-neutral-50 dark:hover:bg-neutral-700/50 transition-colors">
                                                    <td class="px-4 py-3 font-medium text-neutral-900 dark:text-white">
                                                        {member.relative_name}
                                                    </td>
                                                    <td class="px-4 py-3 font-mono text-neutral-600 dark:text-neutral-300">
                                                        {member.relative_nik}
                                                    </td>
                                                    <td class="px-4 py-3">
                                                        <span class="px-2 py-0.5 text-xs font-medium bg-neutral-100 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-200">
                                                            {member.relative_type}
                                                        </span>
                                                    </td>
                                                    <td class="px-4 py-3">{member.gender}</td>
                                                    <td class="px-4 py-3">{member.birth_date}</td>
                                                </tr>
                                            )}
                                        </For>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </Show>
                </Show>

                {/* --- TAB 4: ACADEMIC & INSTITUTIONAL ROLES --- */}
                <Show when={activeTab() === 'roles'}>
                    <div class="space-y-6">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">

                            {/* 1. Lecturer / Dosen Master Card */}
                            <div class="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-2xs p-6 space-y-4">
                                <div class="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-700">
                                    <h3 class="font-bold text-sm text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="size-4 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
                                            <path d="M6 6h10" />
                                            <path d="M6 10h10" />
                                        </svg>
                                        Lecturer Profile (Dosen)
                                    </h3>
                                    <Show when={individualData()?.lecturer}>
                                        <span class="px-2 py-0.5 text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                                            Active Faculty
                                        </span>
                                    </Show>
                                </div>

                                <Show
                                    when={individualData()?.lecturer}
                                    fallback={
                                        <p class="text-xs text-neutral-500 dark:text-neutral-400 py-6 text-center">
                                            No academic lecturer profile linked to this individual.
                                        </p>
                                    }
                                >
                                    <div class="divide-y divide-neutral-100 dark:divide-neutral-700/60 text-xs sm:text-sm">
                                        <div class="py-2 grid grid-cols-3">
                                            <span class="text-neutral-500">Lecturer Code / NIDN:</span>
                                            <span class="col-span-2 font-mono font-bold text-neutral-900 dark:text-white">{individualData()?.lecturer?.code}</span>
                                        </div>
                                        <div class="py-2 grid grid-cols-3">
                                            <span class="text-neutral-500">Lecturer Name:</span>
                                            <span class="col-span-2 font-medium text-neutral-900 dark:text-white">
                                                {[individualData()?.lecturer?.front_title, individualData()?.lecturer?.name, individualData()?.lecturer?.last_title].filter(Boolean).join(' ') || '-'}
                                            </span>
                                        </div>
                                        <div class="py-2 grid grid-cols-3">
                                            <span class="text-neutral-500">NUPTK:</span>
                                            <span class="col-span-2 font-mono text-neutral-800 dark:text-neutral-200">{individualData()?.lecturer?.nuptk || '-'}</span>
                                        </div>
                                        <div class="py-2 grid grid-cols-3">
                                            <span class="text-neutral-500">Accessor Number:</span>
                                            <span class="col-span-2 text-neutral-800 dark:text-neutral-200">{individualData()?.lecturer?.accessor_number || '-'}</span>
                                        </div>
                                        <div class="py-2 grid grid-cols-3">
                                            <span class="text-neutral-500">Identification No:</span>
                                            <span class="col-span-2 font-mono text-neutral-800 dark:text-neutral-200">{individualData()?.lecturer?.identification_number || '-'}</span>
                                        </div>
                                        <div class="py-2 grid grid-cols-3">
                                            <span class="text-neutral-500">Appointment Term:</span>
                                            <span class="col-span-2 text-neutral-800 dark:text-neutral-200">
                                                {individualData()?.lecturer?.start_date ? new Date(individualData()!.lecturer!.start_date!).toLocaleDateString('id-ID') : '-'}
                                                {' to '}
                                                {individualData()?.lecturer?.end_date ? new Date(individualData()!.lecturer!.end_date!).toLocaleDateString('id-ID') : 'Present'}
                                            </span>
                                        </div>
                                    </div>
                                </Show>
                            </div>

                            {/* 2. Employee / Kepegawaian Card */}
                            <div class="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-2xs p-6 space-y-4">
                                <div class="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-700">
                                    <h3 class="font-bold text-sm text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="size-4 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
                                            <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
                                        </svg>
                                        Institution Employee Records (Kepegawaian)
                                    </h3>
                                    <span class="px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                                        {(individualData()?.employees || []).length} Records
                                    </span>
                                </div>

                                <Show
                                    when={(individualData()?.employees || []).length > 0}
                                    fallback={
                                        <p class="text-xs text-neutral-500 dark:text-neutral-400 py-6 text-center">
                                            No active employee appointments on record.
                                        </p>
                                    }
                                >
                                    <div class="space-y-3">
                                        <For each={individualData()?.employees || []}>
                                            {(emp) => (
                                                <div class="p-3.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 space-y-1.5 text-xs sm:text-sm">
                                                    <div class="flex items-center justify-between">
                                                        <span class="font-bold text-neutral-900 dark:text-white">{emp.name}</span>
                                                        <span class={`px-2 py-0.5 text-[11px] font-semibold ${emp.is_active ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300' : 'bg-neutral-200 text-neutral-700'}`}>
                                                            {emp.is_active ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </div>
                                                    <div class="text-xs text-neutral-600 dark:text-neutral-400 font-mono">
                                                        NIP / Code: {emp.code}
                                                    </div>
                                                    <div class="text-xs text-neutral-500 pt-1 border-t border-neutral-200 dark:border-neutral-700">
                                                        Decree (SK): {emp.decree_number || '-'} {emp.decree_date ? `(${new Date(emp.decree_date).toLocaleDateString('id-ID')})` : ''}
                                                    </div>
                                                </div>
                                            )}
                                        </For>
                                    </div>
                                </Show>
                            </div>

                            {/* 3. Academic Student Enrollments (Mahasiswa) */}
                            <div class="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-2xs p-6 space-y-4">
                                <div class="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-700">
                                    <h3 class="font-bold text-sm text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="size-4 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                                            <path d="M6 12v5c3 3 9 3 12 0v-5" />
                                        </svg>
                                        Student Master Registrations (Mahasiswa)
                                    </h3>
                                    <span class="px-2 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                        {(individualData()?.students || []).length} Enrollments
                                    </span>
                                </div>

                                <Show
                                    when={(individualData()?.students || []).length > 0}
                                    fallback={
                                        <p class="text-xs text-neutral-500 dark:text-neutral-400 py-6 text-center">
                                            No academic student enrollments linked to this individual.
                                        </p>
                                    }
                                >
                                    <div class="space-y-3">
                                        <For each={individualData()?.students || []}>
                                            {(student) => (
                                                <div class="p-3.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 space-y-1.5 text-xs sm:text-sm">
                                                    <div class="flex items-center justify-between">
                                                        <span class="font-bold text-neutral-900 dark:text-white">{student.name}</span>
                                                        <span class="font-mono text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 border border-emerald-200 dark:border-emerald-800">
                                                            NIM: {student.code}
                                                        </span>
                                                    </div>
                                                    <div class="grid grid-cols-2 gap-2 text-xs text-neutral-600 dark:text-neutral-400 pt-1">
                                                        <div>Registered: <span class="font-medium text-neutral-800 dark:text-neutral-200">{student.registered ? new Date(student.registered).toLocaleDateString('id-ID') : '-'}</span></div>
                                                        <div>NISN: <span class="font-mono font-medium text-neutral-800 dark:text-neutral-200">{student.nisn || '-'}</span></div>
                                                        <Show when={student.transfer_code}>
                                                            <div>Transfer Code: <span class="font-mono text-neutral-800 dark:text-neutral-200">{student.transfer_code}</span></div>
                                                        </Show>
                                                        <Show when={student.finance_fee !== null && student.finance_fee !== undefined}>
                                                            <div>Fee: <span class="font-medium text-neutral-800 dark:text-neutral-200">Rp {Number(student.finance_fee).toLocaleString('id-ID')}</span></div>
                                                        </Show>
                                                    </div>
                                                </div>
                                            )}
                                        </For>
                                    </div>
                                </Show>
                            </div>

                            {/* 4. PMB Candidate / Admissions */}
                            <div class="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-2xs p-6 space-y-4">
                                <div class="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-700">
                                    <h3 class="font-bold text-sm text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="size-4 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                            <circle cx="9" cy="7" r="4" />
                                            <line x1="19" x2="19" y1="8" y2="14" />
                                            <line x1="22" x2="16" y1="11" y2="11" />
                                        </svg>
                                        Admissions / PMB Candidates
                                    </h3>
                                    <span class="px-2 py-0.5 text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                                        {(individualData()?.candidates || []).length} Candidates
                                    </span>
                                </div>

                                <Show
                                    when={(individualData()?.candidates || []).length > 0}
                                    fallback={
                                        <p class="text-xs text-neutral-500 dark:text-neutral-400 py-6 text-center">
                                            No admission candidate applications found.
                                        </p>
                                    }
                                >
                                    <div class="space-y-3">
                                        <For each={individualData()?.candidates || []}>
                                            {(candidate) => (
                                                <div class="p-3.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 space-y-1.5 text-xs sm:text-sm">
                                                    <div class="flex items-center justify-between">
                                                        <span class="font-bold text-neutral-900 dark:text-white">{candidate.name}</span>
                                                        <span class="font-mono text-xs font-medium text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 border border-amber-200 dark:border-amber-800">
                                                            No: {candidate.code || '-'}
                                                        </span>
                                                    </div>
                                                    <div class="grid grid-cols-2 gap-2 text-xs text-neutral-600 dark:text-neutral-400 pt-1">
                                                        <div>School: <span class="font-medium text-neutral-800 dark:text-neutral-200">{candidate.school_name || '-'}</span></div>
                                                        <div>NISN: <span class="font-mono text-neutral-800 dark:text-neutral-200">{candidate.student_national_number || '-'}</span></div>
                                                        <div>KIP/Card: <span class="font-mono text-neutral-800 dark:text-neutral-200">{candidate.state_smart_card_number || '-'}</span></div>
                                                        <div>Guidance: <span class="font-medium text-neutral-800 dark:text-neutral-200">{candidate.guidence_name || '-'}</span></div>
                                                    </div>
                                                </div>
                                            )}
                                        </For>
                                    </div>
                                </Show>
                            </div>

                            {/* 5. RPL Evaluator Appointments */}
                            <div class="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-2xs p-6 space-y-4">
                                <div class="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-700">
                                    <h3 class="font-bold text-sm text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="size-4 text-rose-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                                            <path d="m9 12 2 2 4-4" />
                                        </svg>
                                        RPL Evaluator Appointments
                                    </h3>
                                    <span class="px-2 py-0.5 text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                                        {(individualData()?.evaluators || []).length} Records
                                    </span>
                                </div>

                                <Show
                                    when={(individualData()?.evaluators || []).length > 0}
                                    fallback={
                                        <p class="text-xs text-neutral-500 dark:text-neutral-400 py-6 text-center">
                                            No RPL evaluator appointments registered for this individual.
                                        </p>
                                    }
                                >
                                    <div class="space-y-3">
                                        <For each={individualData()?.evaluators || []}>
                                            {(ev) => (
                                                <div class="p-3.5 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 space-y-1 text-xs">
                                                    <div class="font-mono font-medium text-neutral-900 dark:text-white">
                                                        Evaluator ID: {ev.id}
                                                    </div>
                                                    <div class="text-neutral-600 dark:text-neutral-400">
                                                        Recognition Ref: <span class="font-mono text-neutral-800 dark:text-neutral-200">{ev.recognition_id || '-'}</span>
                                                    </div>
                                                    <div class="text-neutral-500">
                                                        Appointed: {ev.created_at ? new Date(ev.created_at).toLocaleDateString('id-ID') : '-'}
                                                    </div>
                                                </div>
                                            )}
                                        </For>
                                    </div>
                                </Show>
                            </div>

                            {/* 6. System User & Authentication */}
                            <div class="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-2xs p-6 space-y-4">
                                <div class="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-700">
                                    <h3 class="font-bold text-sm text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" class="size-4 text-teal-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                        </svg>
                                        System User Account (Autentikasi)
                                    </h3>
                                    <Show when={individualData()?.user}>
                                        <span class={`px-2 py-0.5 text-xs font-semibold ${individualData()?.user?.is_active ? 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300' : 'bg-neutral-200 text-neutral-700'}`}>
                                            {individualData()?.user?.is_active ? 'Active User' : 'Inactive'}
                                        </span>
                                    </Show>
                                </div>

                                <Show
                                    when={individualData()?.user}
                                    fallback={
                                        <p class="text-xs text-neutral-500 dark:text-neutral-400 py-6 text-center">
                                            No system authentication login account linked to this individual.
                                        </p>
                                    }
                                >
                                    <div class="divide-y divide-neutral-100 dark:divide-neutral-700/60 text-xs sm:text-sm">
                                        <div class="py-2 grid grid-cols-3">
                                            <span class="text-neutral-500">Account Email:</span>
                                            <span class="col-span-2 font-semibold text-neutral-900 dark:text-white font-mono">{individualData()?.user?.email}</span>
                                        </div>
                                        <div class="py-2 grid grid-cols-3">
                                            <span class="text-neutral-500">User PID:</span>
                                            <span class="col-span-2 font-mono text-neutral-800 dark:text-neutral-200 truncate">{individualData()?.user?.pid}</span>
                                        </div>
                                        <div class="py-2 grid grid-cols-3">
                                            <span class="text-neutral-500">Email Verification:</span>
                                            <span class="col-span-2 text-neutral-800 dark:text-neutral-200">
                                                {individualData()?.user?.email_verified_at ? `Verified on ${new Date(individualData()!.user!.email_verified_at!).toLocaleDateString('id-ID')}` : 'Unverified'}
                                            </span>
                                        </div>
                                        <div class="py-2 grid grid-cols-3">
                                            <span class="text-neutral-500">API Key:</span>
                                            <span class="col-span-2 font-mono text-neutral-500 text-xs truncate">
                                                {individualData()?.user?.api_key ? `${individualData()!.user!.api_key.substring(0, 12)}...` : '-'}
                                            </span>
                                        </div>
                                    </div>
                                </Show>
                            </div>

                        </div>
                    </div>
                </Show>

                {/* --- TAB 5: SYSTEM AUDIT & METADATA --- */}
                <Show when={activeTab() === 'audit'}>
                    <div class="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 shadow-2xs p-6 space-y-4">
                        <div class="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-700">
                            <h3 class="font-bold text-sm text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" class="size-4 text-neutral-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <circle cx="12" cy="12" r="10" />
                                    <line x1="12" y1="8" x2="12" y2="12" />
                                    <line x1="12" y1="16" x2="12.01" y2="16" />
                                </svg>
                                System Traceability & Audit Metadata
                            </h3>
                            <span class="text-xs text-neutral-400 font-mono">UUID v7 Standard</span>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm font-mono">
                            <div class="p-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700">
                                <span class="text-neutral-500 block text-xs">Primary Record UUID</span>
                                <div class="flex items-center justify-between mt-1">
                                    <span class="font-bold text-neutral-900 dark:text-white truncate">
                                        {individualData()?.individual.id || '-'}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => copyToClipboard(individualData()?.individual.id || '', 'Record UUID')}
                                        class="text-blue-600 dark:text-blue-400 text-xs hover:underline cursor-pointer ml-2"
                                    >
                                        Copy
                                    </button>
                                </div>
                            </div>

                            <div class="p-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700">
                                <span class="text-neutral-500 block text-xs">Feeder / PDDIKTI Sync Timestamp</span>
                                <span class="font-bold text-neutral-900 dark:text-white mt-1 block">
                                    {individualData()?.individual.sync_at ? new Date(individualData()!.individual.sync_at!).toLocaleString('id-ID') : 'Not Yet Synchronized'}
                                </span>
                            </div>

                            <div class="p-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700">
                                <span class="text-neutral-500 block text-xs">Created At</span>
                                <span class="font-semibold text-neutral-800 dark:text-neutral-200 mt-1 block">
                                    {individualData()?.individual.created_at ? new Date(individualData()!.individual.created_at!).toLocaleString('id-ID') : '-'}
                                </span>
                                <span class="text-[11px] text-neutral-400 block mt-0.5 truncate">
                                    Author: {individualData()?.individual.created_by || 'SYSTEM'}
                                </span>
                            </div>

                            <div class="p-3 bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700">
                                <span class="text-neutral-500 block text-xs">Last Updated At</span>
                                <span class="font-semibold text-neutral-800 dark:text-neutral-200 mt-1 block">
                                    {individualData()?.individual.updated_at ? new Date(individualData()!.individual.updated_at!).toLocaleString('id-ID') : '-'}
                                </span>
                                <span class="text-[11px] text-neutral-400 block mt-0.5 truncate">
                                    Modifier: {individualData()?.individual.updated_by || 'SYSTEM'}
                                </span>
                            </div>
                        </div>
                    </div>
                </Show>
            </div>

            {/* ========================================================= */}
            {/* PORTRAIT PREVIEW & UPLOAD MODAL DIALOG                    */}
            {/* ========================================================= */}
            <dialog
                ref={photoDialogRef}
                class="fixed inset-0 m-auto p-0 rounded-none bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 shadow-2xl text-neutral-900 dark:text-neutral-100 max-w-md w-full"
                onClick={(e) => {
                    if (e.target === e.currentTarget) closePhotoModal();
                }}
            >
                <div class="p-6 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100">
                    <div class="flex items-center justify-between pb-4 border-b border-neutral-200 dark:border-neutral-700">
                        <div>
                            <h3 class="text-base font-bold text-neutral-900 dark:text-white">
                                Individual Portrait Photo
                            </h3>
                            <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                                Preview or update passport-size portrait photo.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={closePhotoModal}
                            class="size-8 inline-flex items-center justify-center text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                            aria-label="Close dialog"
                        >
                            <svg class="size-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div class="py-6 flex flex-col items-center justify-center space-y-4">
                        <div class="size-56 bg-neutral-100 dark:bg-neutral-950 border-2 border-neutral-300 dark:border-neutral-700 overflow-hidden shadow-inner flex items-center justify-center">
                            <img
                                src={photoSrc()}
                                alt="Full Resolution Portrait Preview"
                                class="w-full h-full object-cover object-top"
                                onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).src = '/images/Portrait_Placeholder.png';
                                }}
                            />
                        </div>
                        <p class="text-xs text-neutral-500 text-center max-w-xs">
                            Format: PNG, JPG, or WebP. Recommended aspect ratio 3:4 or 1:1, max size 5MB.
                        </p>
                    </div>

                    {/* Hidden file input */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        class="hidden"
                        onChange={handlePhotoUploadChange}
                    />

                    <div class="flex items-center justify-between gap-2 pt-4 border-t border-neutral-200 dark:border-neutral-700">
                        <button
                            type="button"
                            onClick={handleResetPhoto}
                            class="px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-neutral-800 border border-transparent transition-colors cursor-pointer"
                        >
                            Reset to Default
                        </button>

                        <div class="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => fileInputRef.click()}
                                class="px-4 py-2 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-none shadow-xs transition-colors cursor-pointer"
                            >
                                Upload Photo
                            </button>
                            <button
                                type="button"
                                onClick={closePhotoModal}
                                class="px-4 py-2 text-xs font-medium text-neutral-700 dark:text-neutral-200 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 rounded-none border border-neutral-300 dark:border-neutral-600 transition-colors cursor-pointer"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            </dialog>
        </div>
    );
}
