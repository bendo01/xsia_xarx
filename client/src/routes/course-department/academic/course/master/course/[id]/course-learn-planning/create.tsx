import { createSignal, onMount, Show } from 'solid-js';
import { useParams, useSearchParams } from '@solidjs/router';
import TopBar from '~/components/navigation/TopBar';
import { toast } from '~/components/toast/Toaster';
import { masterApiCreate, masterApiShow } from '~/controllers/master/masterApiController';
import { t } from '../../../../../../../../i18n';

export default function MasterCreatePage() {
    const apiPath = "academic/course/master/course-learn-plannings";
    const courseMasterBasePath = "/course-department/academic/course/master/course";
    const params = useParams();
    const [searchParams] = useSearchParams();

    const courseId = () => {
        const pId = params.id;
        if (pId && pId !== '[id]' && pId !== ':id') {
            return pId.trim();
        }
        return ((searchParams.course_id as string) || (searchParams.id as string) || '').trim();
    };

    const courseDetailUrl = () => courseId() ? `${courseMasterBasePath}/${courseId()}/show` : courseMasterBasePath;
    const listUrl = () => courseId()
        ? `${courseMasterBasePath}/${courseId()}/course-learn-planning`
        : `/course-department/academic/course/master/course/[id]/course-learn-planning`;

    const cleanRedundantParams = () => {
        if (typeof window !== 'undefined') {
            const url = new URL(window.location.href);
            let changed = false;

            if (url.searchParams.has('course_id')) {
                url.searchParams.delete('course_id');
                changed = true;
            }
            if (url.searchParams.has('courseId')) {
                url.searchParams.delete('courseId');
                changed = true;
            }
            if (url.searchParams.has('id')) {
                url.searchParams.delete('id');
                changed = true;
            }

            if (changed) {
                const cleanUrl = url.pathname + (url.search ? url.search : '') + url.hash;
                window.history.replaceState(null, '', cleanUrl);
            }
        }
    };

    const [course, setCourse] = createSignal<any | null>(null);
    const [code, setCode] = createSignal('');
    const [name, setName] = createSignal('');
    const [description, setDescription] = createSignal('');
    const [isSubmitting, setIsSubmitting] = createSignal(false);

    onMount(async () => {
        cleanRedundantParams();
        const cId = courseId();
        if (cId) {
            try {
                const res = await masterApiShow<any>('academic/course/master/courses', cId);
                if (res?.data) setCourse(res.data);
            } catch {
                // ignore
            }
        }
    });

    const handleSubmit = async (e: Event) => {
        e.preventDefault();
        const cId = courseId();
        if (!cId) {
            toast.danger(t('cd.courseIDIsMissingCannotCreate'));
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await masterApiCreate(apiPath, {
                code: Number(code()) || 1,
                name: name(),
                decription_indonesian: description() || name(),
                course_id: cId,
            });

            if (res.success) {
                toast.success(res.message || t('cd.recordCreatedSuccessfully'));
                setTimeout(() => {
                    window.location.href = listUrl();
                }, 500);
            } else {
                toast.danger(res.message || t('cd.failedToCreateRecord'));
            }
        } catch (err: any) {
            toast.danger(err.message || t('cd.networkErrorOccurred'));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div class="min-h-screen bg-neutral-100 dark:bg-neutral-900 text-foreground">
            <TopBar />

            <div class="mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
                <div class="sm:flex sm:items-center sm:justify-between border-b border-border pb-4">
                    <div>
                        <nav class="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
                            <a href="/" class="hover:text-blue-600 transition-colors">{t('cd.home')}</a>
                            <span>/</span>
                            <span>{t('cd.academic')}</span>
                            <span>/</span>
                            <a href={courseMasterBasePath} class="hover:text-blue-600 transition-colors">{t('cd.course')}</a>
                            <span>/</span>
                            <a href={courseDetailUrl()} class="hover:text-blue-600 transition-colors">
                                {course()?.code ? `${course()?.code}` : (courseId() || 'Course')}
                            </a>
                            <span>/</span>
                            <a href={listUrl()} class="hover:text-blue-600 transition-colors">{t('cd.rps2')}</a>
                            <span>/</span>
                            <span class="font-medium text-foreground">{t('cd.create')}</span>
                        </nav>
                        <h1 class="text-2xl sm:text-3xl font-bold tracking-tight text-foreground font-mono">
                            {t('cd.addNewCourseLearningPlanning')}
                            <Show when={course()?.code || course()?.name}>
                                : <span class="text-blue-600 dark:text-blue-400">{course()?.code} {course()?.name ? `- ${course()?.name}` : ''}</span>
                            </Show>
                        </h1>
                    </div>

                    <div class="mt-4 sm:mt-0">
                        <a
                            href={listUrl()}
                            class="inline-flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-medium text-neutral-700 bg-card dark:text-neutral-200 border border-border hover:bg-neutral-50 dark:hover:bg-neutral-700/60 rounded-md shadow-2xs transition-colors"
                        >
                            <svg class="size-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="m15 18-6-6 6-6" />
                            </svg>
                            <span>{t('cd.cancel')}</span>
                        </a>
                    </div>
                </div>

                <div class="bg-card border border-border shadow-2xs p-6">
                    <form onSubmit={handleSubmit} class="space-y-6">
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <label class="block text-xs font-semibold uppercase tracking-wider text-foreground/80 font-mono mb-2">
                                    {t('cd.codeWeekPertemuanKe')} <span class="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    required
                                    value={code()}
                                    onInput={(e) => setCode(e.currentTarget.value)}
                                    placeholder="e.g. 1"
                                    class="w-full p-2.5 text-xs sm:text-sm border border-border bg-card text-foreground font-mono focus:ring-2 focus:ring-blue-500 outline-hidden transition-colors"
                                />
                            </div>

                            <div>
                                <label class="block text-xs font-semibold uppercase tracking-wider text-foreground/80 font-mono mb-2">
                                    {t('cd.nameTitle')} <span class="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={name()}
                                    onInput={(e) => setName(e.currentTarget.value)}
                                    placeholder={t('cd.enterName')}
                                    class="w-full p-2.5 text-xs sm:text-sm border border-border bg-card text-foreground font-mono focus:ring-2 focus:ring-blue-500 outline-hidden transition-colors"
                                />
                            </div>
                        </div>

                        <div>
                            <label class="block text-xs font-semibold uppercase tracking-wider text-foreground/80 font-mono mb-2">
                                {t('cd.descriptionNotes')}
                            </label>
                            <textarea
                                rows={4}
                                value={description()}
                                onInput={(e) => setDescription(e.currentTarget.value)}
                                placeholder={t('cd.additionalDetailsOrRemarks')}
                                class="w-full p-2.5 text-xs sm:text-sm border border-border bg-card text-foreground font-mono focus:ring-2 focus:ring-blue-500 outline-hidden transition-colors"
                            ></textarea>
                        </div>

                        <div class="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100 dark:border-neutral-700">
                            <a
                                href={listUrl()}
                                class="px-4 py-2 text-xs font-mono font-medium border border-border text-foreground/80 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
                            >
                                {t('cd.cancel')}
                            </a>
                            <button
                                type="submit"
                                disabled={isSubmitting()}
                                class="inline-flex items-center gap-2 px-5 py-2 text-xs font-mono font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs disabled:opacity-50 transition-colors cursor-pointer"
                            >
                                <span>{isSubmitting() ? t('cd.saving') : t('cd.saveCourseLearningPlanning')}</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
