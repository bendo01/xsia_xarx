import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@solidjs/testing-library';
import { Router, Route } from '@solidjs/router';
import CourseMasterCreatePage from './create';
import CourseMasterEditPage from './[id]/edit';
import CourseMasterShowPage from './[id]/show';
import MasterIndexPage from './index';

const mockUnits = [
    { id: 'unit-123', code: 'IF', name: 'Informatika' },
    { id: 'unit-456', code: 'SI', name: 'Sistem Informasi' },
];

const mockVarieties = [
    { id: 'var-1', code: '1', name: 'Wajib Program Studi' },
    { id: 'var-2', code: '2', name: 'Pilihan' },
];

const mockGroups = [
    { id: 'grp-1', code: 'MKK', name: 'Mata Kuliah Keilmuan' },
];

const mockCompetences = [
    { id: 'comp-1', code: 'U', name: 'Utama' },
];

const mockStaff = {
    id: 'staff-001',
    name: 'Dr. Budi Santoso',
    unit_id: 'unit-123',
};

const mockCourse = {
    id: 'course-999',
    code: 'IF101',
    name: 'Pemrograman Terstruktur',
    unit_id: 'unit-123',
    variety_id: 'var-1',
    group_id: 'grp-1',
    competence_id: 'comp-1',
    implementation_method: 'Kuliah',
    total_credit: 3,
    lecture_credit: 2,
    practice_credit: 1,
    field_practice_credit: 0,
    simulation_credit: 0,
    has_unit: true,
    has_syllabus: true,
    has_material: true,
    has_practice: true,
    has_dictation: false,
    start_date: '2025-01-01',
    end_date: null,
    created_at: '2025-01-01T00:00:00.000Z',
    updated_at: '2025-01-01T00:00:00.000Z',
};

describe('Course Department Course Master CRUD Operations', () => {
    beforeEach(() => {
        localStorage.clear();
        sessionStorage.clear();
        localStorage.setItem('unit_id', 'unit-123');

        vi.stubGlobal('fetch', vi.fn(async (url: any, options: any) => {
            const urlStr = String(url);

            if (urlStr.includes('institution/master/staffes/staff-001') || urlStr.includes('institution/master/staffes')) {
                return {
                    ok: true,
                    json: async () => ({ data: mockStaff }),
                };
            }
            if (urlStr.includes('institution/master/units/unit-123')) {
                return {
                    ok: true,
                    json: async () => ({ data: mockUnits[0] }),
                };
            }
            if (urlStr.includes('institution/master/units')) {
                return {
                    ok: true,
                    json: async () => ({ data: mockUnits, total: 2 }),
                };
            }
            if (urlStr.includes('academic/course/reference/varieties/var-1')) {
                return {
                    ok: true,
                    json: async () => ({ data: mockVarieties[0] }),
                };
            }
            if (urlStr.includes('academic/course/reference/varieties')) {
                return {
                    ok: true,
                    json: async () => ({ data: mockVarieties }),
                };
            }
            if (urlStr.includes('academic/course/reference/groups/grp-1')) {
                return {
                    ok: true,
                    json: async () => ({ data: mockGroups[0] }),
                };
            }
            if (urlStr.includes('academic/course/reference/groups')) {
                return {
                    ok: true,
                    json: async () => ({ data: mockGroups }),
                };
            }
            if (urlStr.includes('academic/course/reference/competences/comp-1')) {
                return {
                    ok: true,
                    json: async () => ({ data: mockCompetences[0] }),
                };
            }
            if (urlStr.includes('academic/course/reference/competences')) {
                return {
                    ok: true,
                    json: async () => ({ data: mockCompetences }),
                };
            }
            if (urlStr.includes('academic/course/master/courses/course-999')) {
                return {
                    ok: true,
                    json: async () => ({ data: mockCourse }),
                };
            }
            if (urlStr.includes('academic/course/master/courses')) {
                return {
                    ok: true,
                    json: async () => ({ data: [mockCourse], total: 1, total_pages: 1 }),
                };
            }

            return {
                ok: true,
                json: async () => ({ data: [] }),
            };
        }));
    });

    afterEach(() => {
        vi.restoreAllMocks();
        document.body.innerHTML = '';
    });

    it('renders Course Create Page with complete form sections', async () => {
        render(() => (
            <Router>
                <Route path="*" component={CourseMasterCreatePage} />
            </Router>
        ));

        await waitFor(() => {
            expect(screen.getByText('Add New Course')).toBeInTheDocument();
            expect(screen.getByText('Course Identification')).toBeInTheDocument();
            expect(screen.getByText('Credits Allocation (Beban SKS)')).toBeInTheDocument();
            expect(screen.getByText('Attributes & Validity Range')).toBeInTheDocument();
        });

        expect(screen.getByPlaceholderText('e.g. IF101, TIS-204')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('e.g. Algoritma dan Pemrograman')).toBeInTheDocument();
        expect(screen.getByText('Save Course')).toBeInTheDocument();
    });

    it('automatically retrieves and binds unit_id from logged-in staff in create page', async () => {
        const mockStaffRole = {
            id: 'role-staff-1',
            name: 'Staff Program Studi',
            roleable_id: 'staff-001',
            roleable_type: 'Staff',
            unit_id: 'unit-123',
        };
        localStorage.setItem('roles', JSON.stringify([mockStaffRole]));
        localStorage.setItem('current_role', 'role-staff-1');
        localStorage.setItem('active_role', 'course_department');

        render(() => (
            <Router>
                <Route path="*" component={CourseMasterCreatePage} />
            </Router>
        ));

        await waitFor(() => {
            expect(screen.getByText('Staff Department')).toBeInTheDocument();
            expect(screen.getByText(/Retrieved from logged-in staff profile:/)).toBeInTheDocument();
            expect(screen.getByText('Dr. Budi Santoso')).toBeInTheDocument();
            expect(screen.getByText('Informatika')).toBeInTheDocument();
        });
    });

    it('renders Course Show Page with details, credits breakdown, and RPS links', async () => {
        window.history.pushState({}, '', '/course-department/academic/course/master/course/course-999/show');

        render(() => (
            <Router>
                <Route path="/course-department/academic/course/master/course/:id/show" component={CourseMasterShowPage} />
                <Route path="*" component={CourseMasterShowPage} />
            </Router>
        ));

        await waitFor(() => {
            expect(screen.getByText('Course Details:')).toBeInTheDocument();
        });
    });

    it('cleans up duplicate id query parameter when visiting show page with ?id=', async () => {
        window.history.pushState({}, '', '/course-department/academic/course/master/course/019b886f-b540-7f14-b48e-850933244c86/show?id=019b886f-b540-7f14-b48e-850933244c86');

        render(() => (
            <Router>
                <Route path="/course-department/academic/course/master/course/:id/show" component={CourseMasterShowPage} />
                <Route path="*" component={CourseMasterShowPage} />
            </Router>
        ));

        await waitFor(() => {
            expect(screen.getByText('Course Details:')).toBeInTheDocument();
        });

        // The redundant ?id= parameter should have been stripped from the URL
        expect(window.location.search).toBe('');
        expect(window.location.pathname).toBe('/course-department/academic/course/master/course/019b886f-b540-7f14-b48e-850933244c86/show');
    });

    it('renders Course Edit Page with pre-filled fields', async () => {
        window.history.pushState({}, '', '/course-department/academic/course/master/course/course-999/edit');

        render(() => (
            <Router>
                <Route path="*" component={CourseMasterEditPage} />
            </Router>
        ));

        await waitFor(() => {
            expect(screen.getByText(/Edit Course:/)).toBeInTheDocument();
        });
    });

    it('renders Course Index Page with department courses list', async () => {
        render(() => (
            <Router>
                <Route path="*" component={MasterIndexPage} />
            </Router>
        ));

        await waitFor(() => {
            expect(screen.getByText('Department Courses Directory')).toBeInTheDocument();
            expect(screen.getByText('Add New Course')).toBeInTheDocument();
        });
    });
});
