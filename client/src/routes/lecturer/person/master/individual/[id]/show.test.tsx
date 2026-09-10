import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, waitFor } from '@solidjs/testing-library';
import { Router, Route } from '@solidjs/router';

vi.mock('@solidjs/router', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@solidjs/router')>();
    return {
        ...actual,
        useParams: () => ({ id: 'ind-123' }),
        useSearchParams: () => [{ id: 'ind-123' }, vi.fn()],
    };
});

import LecturerIndividualShowPage from './show';
import * as lecturerControllers from '~/controllers/academic/lecturer/AcademicLecturerTransactionController';
import * as individualControllers from '~/controllers/person/master/PersonMasterIndividualController';
import * as teachControllers from '~/controllers/academic/campaign/transaction/AcademicCampaignTransactionTeachController';

const mockIndividual = {
    id: 'ind-123',
    name: 'John Doe',
    code: '197501012000031001',
    front_title: 'Prof. Dr. Ir.',
    last_title: 'M.Kom.',
    identity_number: '3201234567890001',
    birth_date: '1975-01-01',
    birth_place: 'Jakarta',
    sex: 'L',
    email: 'john.doe@university.ac.id',
    phone_number: '08123456789',
    religion_name: 'Islam',
    blood_type_name: 'O',
};

const mockPreloadedLecturer = {
    id: 'lec-456',
    code: '0001017501',
    name: 'Prof. Dr. Ir. John Doe, M.Kom.',
    individual_id: 'ind-123',
    unit_name: 'Teknik Informatika',
    rank_name: 'Guru Besar',
    group_name: 'IV/e',
    status_name: 'Aktif',
    contract_name: 'Tetap',
    homebases: [
        {
            id: 'hb-1',
            lecturer_id: 'lec-456',
            unit_id: 'unit-1',
            unit_name: 'Teknik Informatika',
            status_id: 'st-1',
            status_name: 'Aktif',
            contract_id: 'ct-1',
            contract_name: 'Dosen Tetap',
            created_at: '2020-01-01',
            updated_at: '2023-01-01',
        },
    ],
    academic_ranks: [
        {
            id: 'rank-1',
            lecturer_id: 'lec-456',
            rank_id: 'rk-1',
            rank_name: 'Guru Besar',
            decree_number: 'SK/123/2023',
            decree_date: '2023-01-01',
            start_date: '2023-01-01',
            end_date: null,
            created_at: '2023-01-01',
            updated_at: '2023-01-01',
        },
    ],
    academic_groups: [
        {
            id: 'grp-1',
            lecturer_id: 'lec-456',
            group_id: 'gp-1',
            group_name: 'IV/e',
            decree_number: 'SK/GRP/456',
            decree_date: '2023-01-01',
            start_date: '2023-01-01',
            end_date: null,
            created_at: '2023-01-01',
            updated_at: '2023-01-01',
        },
    ],
    assigned_teaches: [
        {
            teach_lecturer_id: 'tl-1',
            teach_id: 'tch-1',
            lecturer_id: 'lec-456',
            planning: 16,
            realization: 16,
            credit: 3,
            is_lecturer_home_base: true,
            course_id: 'crs-1',
            course_code: 'IF301',
            course_name: 'Kecerdasan Buatan',
            class_code_id: 'cc-1',
            class_name: 'IF-A',
            class_alphabet_code: 'A',
            academic_year_id: 'ay-2024',
            academic_year_name: '2024/2025 Ganjil',
            academic_year_code: 20241,
        },
    ],
};

describe('Lecturer Individual Show Page - Preloaded Relations', () => {
    let individualSpy: any;
    let getLecturerByIdSpy: any;
    let getLecturerMasterByIndividualSpy: any;
    let getHomebasesSpy: any;
    let getRanksSpy: any;
    let getGroupsSpy: any;
    let getTeachesSpy: any;

    beforeEach(() => {
        individualSpy = vi.spyOn(individualControllers, 'PersonMasterIndividualControllerShow').mockResolvedValue({
            is_error: false,
            data: {
                individual: mockIndividual,
                picture: null,
                lecturer: { id: 'lec-456', code: '0001017501' },
            },
        } as any);

        getLecturerByIdSpy = vi.spyOn(lecturerControllers, 'getLecturerById').mockResolvedValue(mockPreloadedLecturer as any);
        getLecturerMasterByIndividualSpy = vi.spyOn(lecturerControllers, 'getLecturerMasterByIndividual');

        getHomebasesSpy = vi.spyOn(lecturerControllers, 'getLecturerHomebases');
        getRanksSpy = vi.spyOn(lecturerControllers, 'getLecturerAcademicRanks');
        getGroupsSpy = vi.spyOn(lecturerControllers, 'getLecturerAcademicGroups');
        getTeachesSpy = vi.spyOn(teachControllers, 'getLecturerAssignedTeaches');
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('uses get_lecturer by ID directly and consumes preloaded relations without query by individual_id or sub-queries', async () => {
        render(() => (
            <Router>
                <Route path="/" component={() => <LecturerIndividualShowPage />} />
            </Router>
        ));

        // Verify individual and lecturer info renders
        await waitFor(() => {
            expect(screen.getByText('Prof. Dr. Ir. John Doe, M.Kom.')).toBeTruthy();
        });

        // Verify homebase, rank, group are loaded from preloaded relations
        await waitFor(() => {
            expect(screen.getByText('Teknik Informatika')).toBeTruthy();
            expect(screen.getByText('Guru Besar')).toBeTruthy();
        });

        // Verify individual and lecturer details were fetched exactly once
        expect(individualSpy).toHaveBeenCalledTimes(1);
        expect(individualSpy).toHaveBeenCalledWith('ind-123');

        // Verify get_lecturer (GET /api/v1/academic/lecturer/master/lecturers/:id) was called
        expect(getLecturerByIdSpy).toHaveBeenCalledTimes(1);
        expect(getLecturerByIdSpy).toHaveBeenCalledWith('lec-456');

        // Verify query by individual_id (?individual_id=...) was NOT called
        expect(getLecturerMasterByIndividualSpy).not.toHaveBeenCalled();

        // The key assertion: getLecturerHomebases, getLecturerAcademicRanks, getLecturerAcademicGroups,
        // and getLecturerAssignedTeaches should NOT have been called because data was preloaded!
        expect(getHomebasesSpy).not.toHaveBeenCalled();
        expect(getRanksSpy).not.toHaveBeenCalled();
        expect(getGroupsSpy).not.toHaveBeenCalled();
        expect(getTeachesSpy).not.toHaveBeenCalled();
    });
});
