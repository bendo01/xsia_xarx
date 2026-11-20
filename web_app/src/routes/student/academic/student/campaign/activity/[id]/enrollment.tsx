import { Title } from '@solidjs/meta';
import type { RouteDefinition } from '@solidjs/router';
import { revalidate, useParams, useSearchParams } from '@solidjs/router';
import { Errored, For, Show, createEffect, createMemo, createSignal } from 'solid-js';
import { toast } from 'solid-sonner';
import { env } from 'virtual:solid-env/client';

import ActivityError from '../../../../../../../components/student/ActivityError';
import PageHeader from '../../../../../../../components/student/PageHeader';
import { Badge } from '../../../../../../../components/ui/badge';
import { Button } from '../../../../../../../components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../../../../../../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../../../../../components/ui/table';
import { t } from '../../../../../../../i18n';
import { dropCourse, enroll, getEnrollment } from '../../../../../../../lib/enrollment';
import { dropErrorMessage, enrollErrorMessage } from '../../../../../../../lib/enrollment-messages';
import { openEnrollmentFeed } from '../../../../../../../lib/realtime-client';
import { MAX_SKS, enrollBlocker, totalCredits } from '../../../../../../../lib/enrollment-rules';
import type { EnrolledCourse, OfferedClass } from '../../../../../../../lib/enrollment-types';

type Query = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? '';

export const route = {
  preload: ({ params }) => {
    void getEnrollment(params.id as string);
  },
} satisfies RouteDefinition;

/** KRS: build the semester study plan by enrolling in (or dropping) classes. */
export default function EnrollmentPage() {
  const params = useParams();
  const [search] = useSearchParams();
  const activityId = () => params.id as string;
  const data = createMemo(() => getEnrollment(activityId()));

  // Live seat counts from the realtime feed sit on top of the loaded offerings and are
  // dropped whenever fresh data arrives (the server's numbers are then the truth).
  type Seat = { enrolled: number; max: number | null };
  const [seats, setSeats] = createSignal<Record<string, Seat>>({});
  const [live, setLive] = createSignal(false);
  let ownChangeAt = 0; // our own enrol/drop also echoes back as a "plan changed" event
  let planTimer: ReturnType<typeof setTimeout> | undefined;

  const offerings = createMemo(() =>
    data().offerings.map((o) => {
      const s = seats()[o.id];
      return s ? { ...o, enrolled_count: s.enrolled, max_member: s.max ?? o.max_member } : o;
    }),
  );
  createEffect(() => data().offerings, () => { setSeats({}); });

  createEffect(
    () => activityId(),
    (id) => {
      const feed = openEnrollmentFeed(id, {
        onStatus: setLive,
        onEvent: (e) => {
          if (e.kind === 'seat') {
            setSeats((prev) => ({ ...prev, [e.teachId]: { enrolled: e.enrolled, max: e.max } }));
          } else if (e.kind === 'resync' || (e.kind === 'plan' && Date.now() - ownChangeAt > 2500)) {
            // Plan changed elsewhere (or we may have missed events): reload, coalescing bursts.
            clearTimeout(planTimer);
            planTimer = setTimeout(() => void revalidate(), 300);
          }
        },
      });
      return () => {
        clearTimeout(planTimer);
        feed.close();
      };
    },
  );

  const used = () => totalCredits(data().enrolled);
  const remaining = () => Math.max(0, MAX_SKS - used());
  const locked = () => data().activity.is_lock;

  // Filters live in the URL (a plain GET form), applied to the offerings already loaded.
  const credits = createMemo(() => [...new Set(offerings().map((o) => o.credits))].sort((a, b) => a - b));
  const visible = createMemo(() => {
    const q = one((search as Query).q).trim().toLowerCase();
    const credit = one((search as Query).credit) || 'all';
    return offerings().filter(
      (o) =>
        (!q || [o.course_name, o.course_code, o.class_name, o.lecturer_name].join(' ').toLowerCase().includes(q)) &&
        (credit === 'all' || String(o.credits) === credit),
    );
  });

  const blockerFor = (o: OfferedClass) => enrollBlocker({ locked: locked(), enrolled: data().enrolled, offering: o });

  const [enrollingId, setEnrollingId] = createSignal<string | null>(null);
  const onEnroll = async (o: OfferedClass) => {
    setEnrollingId(o.id);
    try {
      await enroll(activityId(), o.id);
      ownChangeAt = Date.now();
      toast.success(t('st.successfullyEnrolledInCourseCreditSKS', { course: o.course_name, credit: o.credits }));
    } catch (err) {
      toast.error(enrollErrorMessage(err, t, { course: o.course_name }));
      void revalidate(); // our view was stale (e.g. the class just filled up)
    } finally {
      setEnrollingId(null);
    }
  };

  const [target, setTarget] = createSignal<EnrolledCourse | null>(null);
  const [dropping, setDropping] = createSignal(false);
  const onConfirmDrop = async () => {
    const c = target();
    if (!c) return;
    setDropping(true);
    try {
      await dropCourse(activityId(), c.id);
      ownChangeAt = Date.now();
      toast.info(t('st.droppedCourseFromStudyPlan', { course: c.course_name }));
      setTarget(null);
    } catch (err) {
      toast.error(dropErrorMessage(err, t));
      void revalidate();
    } finally {
      setDropping(false);
    }
  };

  return (
    <Errored fallback={(err) => <ActivityError error={err()} fallbackKey="st.failedToLoadCourseOfferingsFrom" />}>
      <Title>{`${t('st.semesterCourseEnrollmentKRS')} - ${env.VITE_APP_NAME}`}</Title>
      <PageHeader
        title={t('st.krsCourseEnrollmentGateway')}
        description={t('st.selectAndEnrollIntoClassOfferings')}
        actions={
          <>
            <span class="flex items-center gap-1.5 text-xs text-muted-foreground-1" role="status" aria-live="polite">
              <span class={['size-2 rounded-full', live() ? 'bg-success' : 'bg-muted-foreground-1']} />
              {live() ? t('st.realtimeLive') : t('st.realtimeOffline')}
            </span>
            <button type="button" onClick={() => void revalidate()} class="rounded-xs border border-layer-line bg-layer px-3 py-2 text-sm text-layer-foreground hover:bg-layer-hover focus:outline-hidden">
              {t('common.refresh')}
            </button>
            <a href={`/student/academic/student/campaign/activity/${encodeURIComponent(activityId())}`} class="rounded-xs border border-layer-line bg-layer px-3 py-2 text-sm text-layer-foreground hover:bg-layer-hover focus:outline-hidden">
              {t('st.viewStudyPlanKRSDetail')}
            </a>
          </>
        }
      />

      <Show when={locked()}>
        <p role="status" class="mb-4 rounded-xs border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-foreground">
          {t('st.aktivitasPerkuliahanTelahDikunciDifinalisasi')}
        </p>
      </Show>

      {/* Credit load */}
      <section class="mb-6 rounded-xs border border-card-line bg-card p-5 shadow-2xs">
        <div class="flex items-baseline justify-between">
          <h2 class="font-semibold text-foreground">{t('st.creditLoadSKS')}</h2>
          <p class="text-sm text-muted-foreground-1">
            <strong class="text-foreground">{used()}</strong> / {MAX_SKS} {t('st.sks')} · {t('st.remainingAllowance')} {remaining()}
          </p>
        </div>
        <div class="mt-3 h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuemin={0} aria-valuemax={MAX_SKS} aria-valuenow={used()}>
          <div class="h-full rounded-full bg-primary transition-[width]" style={{ width: `${Math.min(100, (used() / MAX_SKS) * 100)}%` }} />
        </div>
      </section>

      {/* The study plan so far */}
      <section class="mb-6 rounded-xs border border-card-line bg-card shadow-2xs">
        <div class="border-b border-card-line px-5 py-4">
          <h2 class="font-semibold text-foreground">{t('st.enrolledCourses')}</h2>
        </div>
        <Show
          when={data().enrolled.length > 0}
          fallback={<p class="p-6 text-center text-sm text-muted-foreground-1">{t('st.noCoursesSelectedYetChooseFrom')}</p>}
        >
          <ul class="divide-y divide-card-divider">
            <For each={data().enrolled}>
              {(c) => (
                <li class="flex flex-wrap items-center justify-between gap-3 px-5 py-3">
                  <div class="min-w-0">
                    <p class="truncate text-sm font-medium text-foreground">
                      <span class="font-mono text-primary">{c.course_code}</span> · {c.course_name}
                    </p>
                    <p class="text-xs text-muted-foreground-1">
                      {t('st.class')} {c.class_name} · {c.credit} {t('st.sks')}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" disabled={locked()} onClick={() => setTarget(c)}>
                    {t('st.dropClass')}
                  </Button>
                </li>
              )}
            </For>
          </ul>
        </Show>
      </section>

      {/* Classes on offer */}
      <section class="rounded-xs border border-card-line bg-card shadow-2xs">
        <div class="border-b border-card-line px-5 py-4">
          <h2 class="font-semibold text-foreground">{t('st.availableClassOfferings')}</h2>
          <p class="mt-1 text-sm text-muted-foreground-1">{t('st.courseClassesAvailableForYourActive')}</p>
        </div>
        <form method="get" class="flex flex-wrap items-center gap-3 border-b border-card-line px-5 py-3">
          <label class="min-w-56 flex-1">
            <span class="sr-only">{t('common.search')}</span>
            <input
              type="search"
              name="q"
              value={one((search as Query).q)}
              placeholder={t('st.filterByCourseCodeClassLecturer')}
              class="h-9 w-full rounded-xs border border-input bg-card px-3 text-sm focus:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
            />
          </label>
          <select name="credit" class="h-9 rounded-xs border border-input bg-card px-2 text-sm text-foreground" aria-label={t('st.sks')}>
            <option value="all" selected={(one((search as Query).credit) || 'all') === 'all'}>{t('st.allSKS')}</option>
            <For each={credits()}>{(c) => <option value={String(c)} selected={one((search as Query).credit) === String(c)}>{c} {t('st.sks')}</option>}</For>
          </select>
          <button type="submit" class="h-9 rounded-xs bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary-hover focus:outline-hidden">
            {t('common.search')}
          </button>
        </form>

        <Show
          when={visible().length > 0}
          fallback={<p class="p-8 text-center text-sm text-muted-foreground-1">{t('st.noClassOfferingsAvailableForCurrent')}</p>}
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('st.code')}</TableHead>
                <TableHead>{t('st.courseTitle')}</TableHead>
                <TableHead>{t('st.class')}</TableHead>
                <TableHead>{t('st.sks')}</TableHead>
                <TableHead>{t('st.lecturer')}</TableHead>
                <TableHead>{t('st.scheduleRoom')}</TableHead>
                <TableHead>{t('st.quota')}</TableHead>
                <TableHead class="text-end">{t('st.action')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <For each={visible()}>
                {(o) => {
                  const block = () => blockerFor(o);
                  return (
                    <TableRow>
                      <TableCell class="font-mono font-semibold text-primary">{o.course_code}</TableCell>
                      <TableCell class="font-medium">{o.course_name}</TableCell>
                      <TableCell>{o.class_name}</TableCell>
                      <TableCell>{o.credits}</TableCell>
                      <TableCell>{o.lecturer_name}</TableCell>
                      <TableCell>
                        <span class="block">{o.schedule_time}</span>
                        <span class="block text-xs text-muted-foreground-1">{o.room_name}</span>
                      </TableCell>
                      <TableCell>{o.enrolled_count} / {o.max_member}</TableCell>
                      <TableCell class="text-end">
                        <Show
                          when={block() === null || block() === 'CREDIT_LIMIT'}
                          fallback={
                            <Badge variant={block() === 'ALREADY_ENROLLED' ? 'success' : 'secondary'}>
                              {block() === 'ALREADY_ENROLLED' ? t('st.enrolledCourses')
                                : block() === 'DUPLICATE_COURSE' ? t('st.otherClassEnrolled')
                                : block() === 'FULL' ? t('st.classFull')
                                : t('st.locked')}
                            </Badge>
                          }
                        >
                          <Button
                            size="sm"
                            disabled={block() !== null || enrollingId() !== null}
                            title={block() === 'CREDIT_LIMIT' ? t('st.cannotEnrollExceedsMaximumSKSAllowance', { max: MAX_SKS }) : undefined}
                            onClick={() => void onEnroll(o)}
                          >
                            {enrollingId() === o.id ? t('st.enrolling') : t('st.enrollKRS')}
                          </Button>
                        </Show>
                      </TableCell>
                    </TableRow>
                  );
                }}
              </For>
            </TableBody>
          </Table>
        </Show>
      </section>

      {/* Confirm drop */}
      <Dialog open={target() !== null} onOpenChange={(open) => { if (!open && !dropping()) setTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('st.confirmUnenrollClass')}</DialogTitle>
            <DialogDescription>{t('st.areYouSureYouWantTo', { course: target()?.course_name ?? '' })}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" disabled={dropping()} onClick={() => setTarget(null)}>{t('st.cancel')}</Button>
            <Button variant="destructive" disabled={dropping()} onClick={() => void onConfirmDrop()}>
              {dropping() ? t('st.unenrolling') : t('st.yesUnenroll')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Errored>
  );
}
