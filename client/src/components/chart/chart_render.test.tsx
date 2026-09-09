import { describe, it, expect } from 'vitest';
import { render } from '@solidjs/testing-library';
import StudentAcademicYearChart from './student_academic_year_chart';
import CourseCategoryPieChart from './course_category_pie_chart';
import AcademicPerformanceChart from './academic_performance_chart';
import StudentCreditChart from './student_credit_chart';
import TeachCreditChart from './teach_credit_chart';
import CourseDepartmentUnitShowPage from '~/routes/course-department/institution/master/unit/[id]/show';
import CourseDepartmentStudentMasterShowPage from '~/routes/course-department/academic/student/master/show';
import LecturerIndividualShowPage from '~/routes/lecturer/person/master/individual/[id]/show';
import { Router, Route } from '@solidjs/router';

describe('Chart Components', () => {
    it('renders AcademicPerformanceChart with ECharts without throwing', () => {
        const { container } = render(() => (
            <AcademicPerformanceChart
                data={[
                    { semName: 'Sem 1', ips: 3.5, ipk: 3.5, sks: 20, totalSks: 20 },
                    { semName: 'Sem 2', ips: 3.8, ipk: 3.65, sks: 22, totalSks: 42 },
                ]}
            />
        ));
        expect(container).toBeDefined();
    });

    it('renders StudentCreditChart with ECharts without throwing', () => {
        const { container } = render(() => (
            <StudentCreditChart
                data={[
                    { semName: 'Sem 1', ips: 3.5, ipk: 3.5, sks: 20, totalSks: 20 },
                    { semName: 'Sem 2', ips: 3.8, ipk: 3.65, sks: 22, totalSks: 42 },
                ]}
            />
        ));
        expect(container).toBeDefined();
    });

    it('renders TeachCreditChart with ECharts without throwing', () => {
        const { container } = render(() => (
            <TeachCreditChart
                data={[
                    {
                        yearId: 'y1',
                        yearName: '2023/2024 Ganjil',
                        yearCode: 20231,
                        totalCredit: 12,
                        classCount: 3,
                        totalPlannedSessions: 48,
                        totalRealizedSessions: 48,
                        courses: [{ name: 'Algoritma', code: 'IF101', credit: 4, className: 'A' }],
                    },
                ]}
            />
        ));
        expect(container).toBeDefined();
        expect(container.querySelector('[role="img"]')).not.toBeNull();
    });

    it('renders TeachCreditChart with empty data gracefully', () => {
        const { container } = render(() => <TeachCreditChart data={[]} />);
        expect(container).toBeDefined();
    });
    it('renders CourseCategoryPieChart with ECharts without error', () => {
        const { container } = render(() => (
            <CourseCategoryPieChart
                data={[
                    { name: 'Wajib', count: 10, credits: 30 },
                    { name: 'Pilihan', count: 5, credits: 15 },
                ]}
                unitName="Test Prodi"
            />
        ));
        expect(container).toBeDefined();
        expect(container.textContent).toContain('Distribusi Kategori Mata Kuliah');
        expect(container.textContent).toContain('Wajib');
        expect(container.textContent).toContain('Pilihan');
        expect(container.querySelector('[role="img"]')).not.toBeNull();
    });

    it('renders CourseCategoryPieChart with empty data gracefully', () => {
        const { container } = render(() => (
            <CourseCategoryPieChart
                data={[]}
                unitName="Prodi Kosong"
            />
        ));
        expect(container).toBeDefined();
        expect(container.textContent).toContain('Belum ada data mata kuliah terdaftar');
    });

    it('renders StudentAcademicYearChart with ECharts without crashing', () => {
        const { container } = render(() => (
            <StudentAcademicYearChart
                data={[
                    { yearName: '2022/2023', total: 50, active: 45, leave: 3, graduated: 2, other: 0 },
                    { yearName: '2023/2024', total: 60, active: 55, leave: 4, graduated: 1, other: 0 },
                ]}
                unitName="Test Prodi"
            />
        ));
        expect(container).toBeDefined();
        expect(container.textContent).toContain('Tren Jumlah Mahasiswa per Tahun Akademik');
        expect(container.textContent).toContain('2022/2023');
        expect(container.textContent).toContain('2023/2024');
        expect(container.querySelector('[role="img"]')).not.toBeNull();
    });

    it('renders StudentAcademicYearChart with empty data gracefully', () => {
        const { container } = render(() => (
            <StudentAcademicYearChart
                data={[]}
                unitName="Prodi Kosong"
            />
        ));
        expect(container).toBeDefined();
        expect(container.textContent).toContain('Belum ada data tren mahasiswa');
    });

    it('renders CourseDepartmentUnitShowPage without throwing uncaught error', async () => {
        const { container } = render(() => (
            <Router>
                <Route path="/" component={CourseDepartmentUnitShowPage} />
            </Router>
        ));
        expect(container).toBeDefined();
        expect(container.querySelector('main')).toBeDefined();
    });

    it('renders CourseDepartmentStudentMasterShowPage with ECharts without throwing uncaught error', async () => {
        const { container } = render(() => (
            <Router>
                <Route path="/" component={CourseDepartmentStudentMasterShowPage} />
            </Router>
        ));
        expect(container).toBeDefined();
        expect(container.querySelector('main')).toBeDefined();
    });

    it('renders LecturerIndividualShowPage with ECharts without throwing uncaught error', async () => {
        const { container } = render(() => (
            <Router>
                <Route path="/" component={LecturerIndividualShowPage} />
            </Router>
        ));
        expect(container).toBeDefined();
        expect(container.querySelector('main')).toBeDefined();
    });
});
