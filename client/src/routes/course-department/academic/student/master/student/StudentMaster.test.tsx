import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@solidjs/testing-library';
import { Router, Route } from '@solidjs/router';
import CourseDepartmentStudentMasterPage from './index';
import CourseDepartmentStudentMasterShowPage from './[id]/show';

const mockUnits = [
    { id: '94a676ce-06e6-4fd5-88c2-3122533f9ccb', code: 'IF', name: 'Informatika' },
    { id: 'unit-456', code: 'SI', name: 'Sistem Informasi' },
];

const mockStaff = {
    id: 'staff-001',
    name: 'Dr. Budi Santoso',
    unit_id: '94a676ce-06e6-4fd5-88c2-3122533f9ccb',
};

const mockStudents = [
    {
        id: 'std-1',
        code: '2024001',
        name: 'Ahmad Dahlan',
        unit_id: '94a676ce-06e6-4fd5-88c2-3122533f9ccb',
        unit_name: 'Informatika',
        academic_year_name: '2024/2025',
        status_name: 'Aktif',
        registered: '2024-08-01',
    },
];

describe('Course Department Student Master Page Unit ID Handling', () => {
    beforeEach(() => {
        localStorage.clear();
        sessionStorage.clear();
        localStorage.setItem('unit_id', '94a676ce-06e6-4fd5-88c2-3122533f9ccb');

        const mockStaffRole = {
            id: 'role-staff-1',
            name: 'Staff Program Studi',
            roleable_id: 'staff-001',
            roleable_type: 'Staff',
            unit_id: '94a676ce-06e6-4fd5-88c2-3122533f9ccb',
        };
        localStorage.setItem('roles', JSON.stringify([mockStaffRole]));
        localStorage.setItem('current_role', 'role-staff-1');
        localStorage.setItem('active_role', 'course_department');

        vi.stubGlobal('fetch', vi.fn(async (url: any) => {
            const urlStr = String(url);

            if (urlStr.includes('institution/master/staffes')) {
                return {
                    ok: true,
                    json: async () => ({ data: mockStaff }),
                };
            }
            if (urlStr.includes('institution/master/units/94a676ce-06e6-4fd5-88c2-3122533f9ccb')) {
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
            if (urlStr.includes('academic/student/master/students/academic-years')) {
                return {
                    ok: true,
                    json: async () => ({ data: [{ id: 'ay-1', name: '2024/2025', code: '20241' }] }),
                };
            }
            if (urlStr.includes('academic/student/master/students/std-1') || urlStr.includes('academic/student/master/students/')) {
                return {
                    ok: true,
                    json: async () => ({ data: mockStudents[0] }),
                };
            }
            if (urlStr.includes('academic/student/master/students')) {
                return {
                    ok: true,
                    json: async () => ({ data: mockStudents, total: 1, total_pages: 1 }),
                };
            }
            if (urlStr.includes('academic/general/reference/academic-years')) {
                return {
                    ok: true,
                    json: async () => ({ data: [{ id: 'ay-1', name: '2024/2025' }] }),
                };
            }
            if (urlStr.includes('academic/student/reference/statuses')) {
                return {
                    ok: true,
                    json: async () => ({ data: [{ id: 'st-1', name: 'Aktif' }] }),
                };
            }
            if (urlStr.includes('person/master/individuals')) {
                return {
                    ok: true,
                    json: async () => ({ data: { individual: { id: 'ind-1', name: 'Ahmad Dahlan' } } }),
                };
            }
            if (urlStr.includes('academic/student/campaign/activities')) {
                return {
                    ok: true,
                    json: async () => ({ data: [] }),
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
    });

    it('cleans redundant unit_id query parameter when visited with ?unit_id= and binds unit from staff data', async () => {
        window.history.pushState({}, '', '/course-department/academic/student/master/student?unit_id=94a676ce-06e6-4fd5-88c2-3122533f9ccb');

        render(() => (
            <Router>
                <Route path="*" component={CourseDepartmentStudentMasterPage} />
            </Router>
        ));

        await waitFor(() => {
            expect(screen.getByText('Current Unit')).toBeInTheDocument();
            expect(screen.getAllByText('Informatika').length).toBeGreaterThanOrEqual(1);
            expect(screen.getAllByText('Ahmad Dahlan').length).toBeGreaterThanOrEqual(2);
        });

        // The URL should have redundant unit_id cleaned up
        expect(window.location.search).not.toContain('unit_id=');
    });

    it('automatically binds unit_id from staff data even when no query param is provided', async () => {
        window.history.pushState({}, '', '/course-department/academic/student/master/student');

        render(() => (
            <Router>
                <Route path="*" component={CourseDepartmentStudentMasterPage} />
            </Router>
        ));

        await waitFor(() => {
            expect(screen.getByText('Current Unit')).toBeInTheDocument();
            expect(screen.getAllByText('Informatika').length).toBeGreaterThanOrEqual(1);
            expect(screen.getAllByText('Ahmad Dahlan').length).toBeGreaterThanOrEqual(2);
        });

        expect(window.location.search).toBe('');
    });

    it('renders show page with Back to Student List linking to clean route without unit_id param', async () => {
        window.history.pushState({}, '', '/course-department/academic/student/master/student/std-1/show');

        render(() => (
            <Router>
                <Route path="*" component={CourseDepartmentStudentMasterShowPage} />
            </Router>
        ));

        await waitFor(() => {
            expect(screen.getByText('← Back to Student List')).toBeInTheDocument();
        });

        const backLink = screen.getByText('← Back to Student List').closest('a');
        expect(backLink).not.toBeNull();
        expect(backLink?.getAttribute('href')).toBe('/course-department/academic/student/master/student');
    });
});
