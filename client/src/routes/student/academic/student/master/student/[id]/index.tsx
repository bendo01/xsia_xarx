import { createSignal, onMount, createEffect, Show } from 'solid-js';
import { useParams, useSearchParams, A } from '@solidjs/router';
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
import { t } from '../../../../../../../i18n';

export default function StudentMasterShowPage() {
    const params = useParams();
    const [searchParams] = useSearchParams();
    const [student, setStudent] = createSignal<StudentMasterItem | null>(null);
    const [individual, setIndividual] = createSignal<PersonMasterIndividualDataObject | null>(null);
    const [isLoading, setIsLoading] = createSignal(true);

    const fetchStudentDetail = async () => {
        setIsLoading(true);
        try {
            const studentId = params.id || (searchParams.id as string) || '';
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
            toast.danger(t('st.failedToLoadStudentDetailFrom'));
        } finally {
            setIsLoading(false);
        }
    };

    onMount(() => {
        fetchStudentDetail();
    });

    createEffect(() => {
        const id = params.id || (searchParams.id as string);
        if (id) {
            fetchStudentDetail();
        }
    });

    const ind = () => individual()?.individual;

    return (
        <div class="min-h-screen bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 flex flex-col">
            <TopBar />

            <main class="flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
                {/* Header Card */}
                <div class="bg-white dark:bg-neutral-800 rounded-xs p-6 sm:p-8 border border-neutral-200 dark:border-neutral-700 shadow-2xs">
                    <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div class="flex items-center gap-5">
                            <div class="size-16 sm:size-20 rounded-xs bg-linear-to-tr from-blue-500 to-emerald-500 text-white font-black text-2xl flex items-center justify-center shadow-md">
                                {(student()?.name || 'S').charAt(0)}
                            </div>
                            <div class="space-y-1">
                                <div class="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-xs bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-xs font-mono font-semibold border border-blue-200 dark:border-blue-800/80">
                                    <span class="size-1.5 rounded-xs bg-blue-500"></span>
                                    <span>{t('st.nim')} {student()?.code || '-'}</span>
                                </div>
                                <h1 class="text-2xl sm:text-3xl font-black tracking-tight text-neutral-900 dark:text-white">
                                    {student()?.name || t('st.studentDetails')}
                                </h1>
                                <p class="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
                                    {student()?.unit_name || '-'} • Cohort {student()?.academic_year_name || '-'}
                                </p>
                            </div>
                        </div>

                        <div class="flex items-center gap-3">
                            <A
                                href="/student/academic/student/master"
                                class="px-4 py-2.5 bg-neutral-100 dark:bg-neutral-700 hover:bg-neutral-200 dark:hover:bg-neutral-600 rounded-xs text-xs font-bold transition-colors"
                            >
                                {t('st.studentDirectory')}
                            </A>
                            <A
                                href="/student/academic/student/campaign/activity"
                                class="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xs text-xs font-bold shadow-xs transition-colors"
                            >
                                {t('st.viewAcademicRecords')}
                            </A>
                        </div>
                    </div>
                </div>

                {/* Details Section */}
                <Show when={!isLoading()} fallback={
                    <div class="py-16 flex flex-col items-center justify-center gap-3 text-neutral-400">
                        <div class="size-8 border-3 border-blue-500 border-t-transparent rounded-xs animate-spin"></div>
                        <p class="text-xs font-mono">{t('st.loadingStudentDetailFromServer')}</p>
                    </div>
                }>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                        {/* Admission Card */}
                        <div class="bg-white dark:bg-neutral-800 rounded-xs p-6 border border-neutral-200 dark:border-neutral-700 shadow-2xs space-y-4">
                            <div class="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-700">
                                <h3 class="text-sm font-bold text-neutral-900 dark:text-white">{t('st.academicAdmissionInformation')}</h3>
                                <span class="px-2.5 py-0.5 rounded-xs text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                    {student()?.status_name || t('st.admittedRegistered')}
                                </span>
                            </div>

                            <div class="space-y-3">
                                <div class="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-700/50">
                                    <span class="text-neutral-400 font-mono">{t('st.studentNIM2')}</span>
                                    <span class="font-bold text-neutral-800 dark:text-neutral-100 font-mono">{student()?.code || '-'}</span>
                                </div>
                                <div class="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-700/50">
                                    <span class="text-neutral-400 font-mono">{t('st.registrationNumber')}</span>
                                    <span class="font-bold text-neutral-800 dark:text-neutral-100 font-mono">{student()?.registration_id || '-'}</span>
                                </div>
                                <div class="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-700/50">
                                    <span class="text-neutral-400 font-mono">{t('st.admissionPathType')}</span>
                                    <span class="font-bold text-neutral-800 dark:text-neutral-100">{student()?.selection_type_name || '-'}</span>
                                </div>
                                <div class="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-700/50">
                                    <span class="text-neutral-400 font-mono">{t('st.officialAdmissionDate')}</span>
                                    <span class="font-bold text-neutral-800 dark:text-neutral-100">{student()?.registered || '-'}</span>
                                </div>
                                <div class="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-700/50">
                                    <span class="text-neutral-400 font-mono">{t('st.studyProgramDepartment')}</span>
                                    <span class="font-bold text-neutral-800 dark:text-neutral-100">{student()?.unit_name || '-'}</span>
                                </div>
                                <div class="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-700/50">
                                    <span class="text-neutral-400 font-mono">{t('st.curriculumCohort')}</span>
                                    <span class="font-bold text-neutral-800 dark:text-neutral-100 font-mono">{student()?.curriculum_id || '-'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Personal & Demographics Card */}
                        <div class="bg-white dark:bg-neutral-800 rounded-xs p-6 border border-neutral-200 dark:border-neutral-700 shadow-2xs space-y-4">
                            <div class="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-700">
                                <h3 class="text-sm font-bold text-neutral-900 dark:text-white">{t('st.individualBiodataIdentity')}</h3>
                                <span class="text-xs text-neutral-400 font-mono">{t('st.civilRegistry')}</span>
                            </div>

                            <div class="space-y-3">
                                <div class="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-700/50">
                                    <span class="text-neutral-400 font-mono">{t('st.fullLegalName')}</span>
                                    <span class="font-bold text-neutral-800 dark:text-neutral-100">{student()?.name || '-'}</span>
                                </div>
                                <div class="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-700/50">
                                    <span class="text-neutral-400 font-mono">{t('st.nationalIDNIK')}</span>
                                    <span class="font-bold text-neutral-800 dark:text-neutral-100 font-mono">{ind()?.code || '-'}</span>
                                </div>
                                <div class="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-700/50">
                                    <span class="text-neutral-400 font-mono">{t('st.nisn')}</span>
                                    <span class="font-bold text-neutral-800 dark:text-neutral-100 font-mono">{student()?.nisn || '-'}</span>
                                </div>
                                <div class="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-700/50">
                                    <span class="text-neutral-400 font-mono">{t('st.birthPlaceDate')}</span>
                                    <span class="font-bold text-neutral-800 dark:text-neutral-100">
                                        {ind()?.birth_place ? `${ind()?.birth_place}, ${ind()?.birth_date || '-'}` : (ind()?.birth_date || '-')}
                                    </span>
                                </div>
                                <div class="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-700/50">
                                    <span class="text-neutral-400 font-mono">{t('st.tuitionFinancialFee')}</span>
                                    <span class="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                                        {student()?.finance_fee != null ? `Rp ${(student()!.finance_fee!).toLocaleString('id-ID')}` : '-'}
                                    </span>
                                </div>
                                <div class="flex justify-between py-1 border-b border-neutral-100 dark:border-neutral-700/50">
                                    <span class="text-neutral-400 font-mono">{t('st.permanentAddress')}</span>
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
