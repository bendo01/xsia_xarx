import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@solidjs/testing-library';
import { Router, Route } from '@solidjs/router';
import CourseLearnPlanningIndexPage from './[id]/course-learn-planning/index';
import CourseEvaluationPlanningIndexPage from './[id]/course-evaluation-planning/index';

const targetCourseId = 'course-target-111';
const otherCourseId = 'course-other-222';

const mockCourse = {
    id: targetCourseId,
    code: 'CS101',
    name: 'Introduction to Computer Science',
};

const mockLearnPlannings = [
    {
        id: 'plan-1',
        code: 1,
        name: 'Week 1: Algoritma Dasar',
        description: 'Pengenalan konsep dasar algoritma',
        course_id: targetCourseId,
    },
    {
        id: 'plan-2',
        code: 2,
        name: 'Week 2: Struktur Kontrol',
        description: 'Percabangan dan perulangan',
        course_id: targetCourseId,
    },
    {
        id: 'plan-unrelated',
        code: 1,
        name: 'Week 1: Akuntansi Keuangan',
        description: 'Materi kuliah lain',
        course_id: otherCourseId,
    },
];

const mockEvalPlannings = [
    {
        id: 'eval-1',
        code: 1,
        name: 'Tugas 1: Coding Dasar',
        percentage: 20,
        description: 'Tugas pemrograman pertama',
        course_id: targetCourseId,
    },
    {
        id: 'eval-2',
        code: 2,
        name: 'UTS: Pemrograman',
        percentage: 30,
        description: 'Ujian tengah semester',
        course_id: targetCourseId,
    },
    {
        id: 'eval-unrelated',
        code: 1,
        name: 'Tugas Akuntansi',
        percentage: 15,
        description: 'Tugas dari mata kuliah lain',
        course_id: otherCourseId,
    },
];

describe('Course Planning course_id Parameter Filtering', () => {
    beforeEach(() => {
        vi.stubGlobal('fetch', vi.fn(async (url: any, options: any) => {
            const urlStr = String(url);

            if (urlStr.includes(`academic/course/master/courses/${targetCourseId}`)) {
                return {
                    ok: true,
                    json: async () => ({ data: mockCourse }),
                };
            }

            if (urlStr.includes('academic/course/master/course-learn-plannings')) {
                return {
                    ok: true,
                    json: async () => ({
                        data: mockLearnPlannings,
                        total: mockLearnPlannings.length,
                        total_pages: 1,
                    }),
                };
            }

            if (urlStr.includes('academic/course/master/course-evaluation-plannings')) {
                return {
                    ok: true,
                    json: async () => ({
                        data: mockEvalPlannings,
                        total: mockEvalPlannings.length,
                        total_pages: 1,
                    }),
                };
            }

            return {
                ok: true,
                json: async () => ({ data: [] }),
            };
        }));
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('course-learn-planning only shows records related to course_id parameter', async () => {
        // Set URL before render
        window.history.pushState(
            {},
            '',
            `/course-department/academic/course/master/course/${targetCourseId}/course-learn-planning?course_id=${targetCourseId}`
        );

        render(() => (
            <Router>
                <Route
                    path="/course-department/academic/course/master/course/:id/course-learn-planning"
                    component={CourseLearnPlanningIndexPage}
                />
                <Route path="*" component={CourseLearnPlanningIndexPage} />
            </Router>
        ));

        // Target course items should be rendered
        await waitFor(() => {
            expect(screen.getAllByText('Week 1: Algoritma Dasar').length).toBeGreaterThan(0);
        });
        expect(screen.getAllByText('Week 2: Struktur Kontrol').length).toBeGreaterThan(0);

        // Unrelated course item must NOT be displayed
        expect(screen.queryByText('Week 1: Akuntansi Keuangan')).toBeNull();
    });

    it('course-evaluation-planning only shows records related to course_id parameter', async () => {
        // Set URL before render
        window.history.pushState(
            {},
            '',
            `/course-department/academic/course/master/course/${targetCourseId}/course-evaluation-planning?course_id=${targetCourseId}`
        );

        render(() => (
            <Router>
                <Route
                    path="/course-department/academic/course/master/course/:id/course-evaluation-planning"
                    component={CourseEvaluationPlanningIndexPage}
                />
                <Route path="*" component={CourseEvaluationPlanningIndexPage} />
            </Router>
        ));

        // Target course items should be rendered
        await waitFor(() => {
            expect(screen.getAllByText('Tugas 1: Coding Dasar').length).toBeGreaterThan(0);
        });
        expect(screen.getAllByText('UTS: Pemrograman').length).toBeGreaterThan(0);

        // Unrelated course item must NOT be displayed
        expect(screen.queryByText('Tugas Akuntansi')).toBeNull();
    });
});
