import { createSignal, onMount, createEffect, Show } from 'solid-js';
import { useSearchParams, A } from '@solidjs/router';
import TopBar from '~/components/navigation/TopBar';
import { toast } from '~/components/toast/Toaster';
import { 
    getStudentById, 
    StudentMasterItem 
} from '~/controllers/academic/student/master/AcademicStudentMasterStudentController';
import { 
    PersonMasterIndividualControllerShow 
} from '~/controllers/person/master/PersonMasterIndividualController';
import type { PersonMasterIndividualDataObject } from '~/models/person/master/Individual';

export default function CourseDepartmentStudentMasterShowPage() {
    const [searchParams] = useSearchParams();
    const [student, setStudent] = createSignal<StudentMasterItem | null>(null);
    const [individual, setIndividual] = createSignal<PersonMasterIndividualDataObject | null>(null);
    const [isLoading, setIsLoading] = createSignal(true);

    const fetchStudentDetail = async () => {
        setIsLoading(true);
        try {
            const studentId = (searchParams.id as string) || '';
            let stdRecord: StudentMasterItem | null = null;

            if (studentId) {
                stdRecord = await getStudentById(studentId);
            }

            setStudent(stdRecord);

            // Fetch linked individual details
            if (stdRecord?.individual_id && stdRecord.individual_id !== '00000000-0000-0000-0000-000000000000') {
                const indRes = await PersonMasterIndividualControllerShow(stdRecord.individual_id);
                if (!indRes.is_error && indRes.data) {
                    setIndividual(indRes.data);
                }
            }
        } catch (err) {
            console.error('Error fetching student master details:', err);
            toast.danger('Failed to load student details from server.');
        } finally {
            setIsLoading(false);
        }
    };

    onMount(() => {
        fetchStudentDetail();
    });

    createEffect(() => {
        const idFromQuery = searchParams.id as string;
        if (idFromQuery) {
            fetchStudentDetail();
        }
    });

    const ind = () => individual()?.individual;

    return (
        <div class="min-h-screen bg-neutral-50 dark:bg-neutral-900 text-neutral-800 dark:text-neutral-100 flex flex-col font-sans transition-colors duration-200">
            <TopBar />

            <main class="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                {/* Header Banner */}
                <div class="bg-white dark:bg-neutral-800 rounded-3xl p-6 sm:p-8 border border-neutral-200 dark:border-neutral-700 shadow-2xs">
                    <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div class="flex items-center gap-5">
                            <div class="size-16 sm:size-20 rounded-2xl bg-gradient-to-tr from-teal-500 to-cyan-600 text-white font-black text-2xl flex items-center justify-center shadow-md">
                                {(student()?.name || 'S').charAt(0).toUpperCase()}
                            </div>
                            <div class="space-y-1">
                                <div class="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 text-xs font-mono font-semibold border border-teal-200 dark:border-teal-800/80">
                                    <span class="size-1.5 rounded-full bg-teal-500"></span>
                                    <span>NIM: {student()?.code || '-'}</span>
                                </div>
                                <h1 class="text-2xl sm:text-3xl font-black tracking-tight text-neutral-900 dark:text-white">
                                    {student()?.name || 'Student Details'}
                                </h1>
                                <p class="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
                                    {student()?.unit_name || 'Program Studi'} • Academic Year {student()?.academic_year_name || '-'}
                                </p>
                            </div>
                        </div>

                        <div class="flex items-center gap-3">
                            <A
                                href={student()?.unit_id ? `/course-department/academic/student/master?unit_id=${student()!.unit_id}` : '/course-department/academic/student/master'}
                                class="px-4 py-2.5 bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1.5"
                            >
                                <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                                <span>← Back to Student List</span>
                            </A>
                        </div>
                    </div>
                </div>

                {/* Details Section */}
                <Show when={!isLoading()} fallback={
                    <div class="py-20 flex flex-col items-center justify-center gap-3 text-neutral-400">
                        <div class="size-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                        <p class="text-xs font-mono">Loading student detail from server...</p>
                    </div>
                }>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                        {/* Admission Card */}
                        <div class="bg-white dark:bg-neutral-800 rounded-3xl p-6 border border-neutral-200 dark:border-neutral-700 shadow-2xs space-y-4">
                            <div class="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-700">
                                <h3 class="text-sm font-bold text-neutral-900 dark:text-white">Academic & Enrolment Information</h3>
                                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                    {student()?.status_name || 'Active'}
                                </span>
                            </div>

                            <div class="space-y-3">
                                <div class="flex justify-between py-1.5 border-b border-neutral-100 dark:border-neutral-700/50">
                                    <span class="text-neutral-400 font-mono">Student NIM:</span>
                                    <span class="font-bold text-teal-600 dark:text-teal-400 font-mono">{student()?.code || '-'}</span>
                                </div>
                                <div class="flex justify-between py-1.5 border-b border-neutral-100 dark:border-neutral-700/50">
                                    <span class="text-neutral-400 font-mono">Registration Number:</span>
                                    <span class="font-bold text-neutral-800 dark:text-neutral-100 font-mono">{student()?.registration_id || '-'}</span>
                                </div>
                                <div class="flex justify-between py-1.5 border-b border-neutral-100 dark:border-neutral-700/50">
                                    <span class="text-neutral-400 font-mono">Admission Path:</span>
                                    <span class="font-bold text-neutral-800 dark:text-neutral-100">{student()?.selection_type_name || '-'}</span>
                                </div>
                                <div class="flex justify-between py-1.5 border-b border-neutral-100 dark:border-neutral-700/50">
                                    <span class="text-neutral-400 font-mono">Enrolment Date:</span>
                                    <span class="font-bold text-neutral-800 dark:text-neutral-100">{student()?.registered || '-'}</span>
                                </div>
                                <div class="flex justify-between py-1.5 border-b border-neutral-100 dark:border-neutral-700/50">
                                    <span class="text-neutral-400 font-mono">Study Program (Unit):</span>
                                    <span class="font-bold text-neutral-800 dark:text-neutral-100">{student()?.unit_name || '-'}</span>
                                </div>
                                <div class="flex justify-between py-1.5 border-b border-neutral-100 dark:border-neutral-700/50">
                                    <span class="text-neutral-400 font-mono">Academic Year / Cohort:</span>
                                    <span class="font-bold text-neutral-800 dark:text-neutral-100">{student()?.academic_year_name || '-'}</span>
                                </div>
                                <div class="flex justify-between py-1.5 border-b border-neutral-100 dark:border-neutral-700/50">
                                    <span class="text-neutral-400 font-mono">Curriculum:</span>
                                    <span class="font-bold text-neutral-800 dark:text-neutral-100">{student()?.curriculum_name || student()?.curriculum_id || '-'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Personal & Demographics Card */}
                        <div class="bg-white dark:bg-neutral-800 rounded-3xl p-6 border border-neutral-200 dark:border-neutral-700 shadow-2xs space-y-4">
                            <div class="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-700">
                                <h3 class="text-sm font-bold text-neutral-900 dark:text-white">Individual Biodata & Identity</h3>
                                <span class="text-xs text-neutral-400 font-mono">Student Registry</span>
                            </div>

                            <div class="space-y-3">
                                <div class="flex justify-between py-1.5 border-b border-neutral-100 dark:border-neutral-700/50">
                                    <span class="text-neutral-400 font-mono">Full Legal Name:</span>
                                    <span class="font-bold text-neutral-800 dark:text-neutral-100">{student()?.name || '-'}</span>
                                </div>
                                <div class="flex justify-between py-1.5 border-b border-neutral-100 dark:border-neutral-700/50">
                                    <span class="text-neutral-400 font-mono">National ID (NIK):</span>
                                    <span class="font-bold text-neutral-800 dark:text-neutral-100 font-mono">{ind()?.code || '-'}</span>
                                </div>
                                <div class="flex justify-between py-1.5 border-b border-neutral-100 dark:border-neutral-700/50">
                                    <span class="text-neutral-400 font-mono">NISN:</span>
                                    <span class="font-bold text-neutral-800 dark:text-neutral-100 font-mono">{student()?.nisn || '-'}</span>
                                </div>
                                <div class="flex justify-between py-1.5 border-b border-neutral-100 dark:border-neutral-700/50">
                                    <span class="text-neutral-400 font-mono">Birth Place & Date:</span>
                                    <span class="font-bold text-neutral-800 dark:text-neutral-100">
                                        {ind()?.birth_place ? `${ind()?.birth_place}, ${ind()?.birth_date || '-'}` : (ind()?.birth_date || '-')}
                                    </span>
                                </div>
                                <div class="flex justify-between py-1.5 border-b border-neutral-100 dark:border-neutral-700/50">
                                    <span class="text-neutral-400 font-mono">Tuition & Financial Fee:</span>
                                    <span class="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                                        {student()?.finance_fee != null ? `Rp ${(student()!.finance_fee!).toLocaleString('id-ID')}` : '-'}
                                    </span>
                                </div>
                                <div class="flex justify-between py-1.5 border-b border-neutral-100 dark:border-neutral-700/50">
                                    <span class="text-neutral-400 font-mono">Permanent Address:</span>
                                    <span class="font-bold text-neutral-800 dark:text-neutral-100">{individual()?.biodata?.address || '-'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </Show>
            </main>
        </div>
    );
}
