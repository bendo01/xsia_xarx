import { getStorageItem, setStorageItem } from '~/lib/storage';
import { AcademicStudentMasterStudent, ModelPagination, StudentDataObject } from '~/models/academic/student/master/Student';
import { AcademicStudentMasterStudentValidate } from '~/models/academic/student/master/Student';
import type { PersonMasterIndividual } from '~/models/person/master/Individual';

const getBaseUrl = () => (import.meta.env.VITE_API_SERVER_URL ?? 'http://127.0.0.1:5800/api/v1/').replace(/\/+$/, '');

const getHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
    };
    if (typeof window !== 'undefined') {
        const token = getStorageItem('token');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
    }
    return headers;
};

export interface StudentMasterItem {
    id: string;
    code: string;
    name: string;
    selection_type_id: string;
    registered: string;
    individual_id: string;
    status_id: string;
    unit_id: string;
    academic_year_id: string;
    registration_id: string;
    nisn?: string | null;
    resign_status_id: string;
    concentration_id: string;
    curriculum_id: string;
    class_code_id: string;
    transfer_code?: string | null;
    transfer_unit_id: string;
    id_mahasiswa?: string | null;
    id_registrasi_mahasiswa?: string | null;
    finance_fee?: number;
    finance_id?: string | null;
    created_at?: string;
    updated_at?: string;
    // Enhanced UI
    unit_name?: string;
    status_name?: string;
    selection_type_name?: string;
    curriculum_name?: string;
    academic_year_name?: string;
}

export async function listStudents(queryParams?: {
    page?: number;
    page_size?: number;
    name?: string;
    code?: string;
}): Promise<{
    data: StudentMasterItem[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
}> {
    try {
        const params = new URLSearchParams();
        if (queryParams?.page) params.set('page', String(queryParams.page));
        if (queryParams?.page_size) params.set('page_size', String(queryParams.page_size));
        if (queryParams?.name) params.set('name', queryParams.name);
        if (queryParams?.code) params.set('code', queryParams.code);

        const res = await fetch(`${getBaseUrl()}/academic/student/master/students?${params.toString()}`, {
            method: 'GET',
            headers: getHeaders(),
        });

        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }

        const json = await res.json();
        return {
            data: json.data || [],
            total: json.total || (json.data ? json.data.length : 0),
            page: json.page || 1,
            page_size: json.page_size || 10,
            total_pages: json.total_pages || 1,
        };
    } catch (err) {
        console.warn('Error fetching student master list:', err);
        return {
            data: [],
            total: 0,
            page: 1,
            page_size: 10,
            total_pages: 0,
        };
    }
}

export async function getStudentById(id: string): Promise<StudentMasterItem | null> {
    if (!id || id === '00000000-0000-0000-0000-000000000000') return null;
    try {
        const res = await fetch(`${getBaseUrl()}/academic/student/master/students/${id}`, {
            method: 'GET',
            headers: getHeaders(),
        });
        if (!res.ok) return null;
        return await res.json();
    } catch (err) {
        console.warn(`Error fetching student ${id}:`, err);
        return null;
    }
}

export async function academicStudentMasterStudent(id: string): Promise<StudentDataObject | null> {
    try {
        const response = await fetch(`${getBaseUrl()}/academic/student/master/students/${id}`, {
            method: 'GET',
            headers: getHeaders(),
        });
        const data = await response.json();
        if (!response.ok) {
            console.error('Pengambilan Data Mahasiswa Gagal', data);
            return null;
        }
        setStorageItem('student', JSON.stringify(data));
        return data;
    } catch (error) {
        console.error('Gagal terhubung ke server', error);
        return null;
    }
}

export async function academicStudentMasterStudentShow(id: string): Promise<StudentDataObject | null> {
    return academicStudentMasterStudent(id);
}

export async function academicStudentMasterStudentValidate(id: string): Promise<AcademicStudentMasterStudentValidate | null> {
    try {
        const response = await fetch(`${getBaseUrl()}/academic/student/master/students/student_validation/${id}`, {
            method: 'GET',
            headers: getHeaders(),
        });
        const data = await response.json();
        if (!response.ok) {
            return null;
        }
        setStorageItem('student', JSON.stringify(data));
        return data;
    } catch (error) {
        return null;
    }
}

export async function listStudyUnits(): Promise<any[]> {
    try {
        const res = await fetch(`${getBaseUrl()}/institution/master/units`, {
            method: 'GET',
            headers: getHeaders(),
        });
        if (!res.ok) return [];
        const json = await res.json();
        return json.data || [];
    } catch {
        return [];
    }
}