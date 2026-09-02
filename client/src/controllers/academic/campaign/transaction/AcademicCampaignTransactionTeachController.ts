import { getStorageItem } from '~/lib/storage';

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

export interface TeachItem {
    id: string;
    name?: string | null;
    class_code_id: string;
    course_id: string;
    activity_id?: string | null;
    description?: string | null;
    start_date?: string | null;
    end_date?: string | null;
    practice_start_date?: string | null;
    practice_end_date?: string | null;
    curriculum_detail_id?: string | null;
    teach_decree_id: string;
    is_lecturer_credit_sum_problem?: boolean;
    is_lock?: boolean;
    encounter_category_id?: string | null;
    scope_id?: string | null;
    created_at?: string;
    updated_at?: string;
    max_member?: number;
    feeder_id?: string | null;
    // Enhanced UI fields
    course_code?: string;
    course_name?: string;
    credits?: number;
    lecturer_name?: string;
    class_name?: string;
    schedule_time?: string;
    room_name?: string;
    enrolled_count?: number;
}

export async function listTeaches(queryParams?: {
    page?: number;
    page_size?: number;
    name?: string;
    activity_id?: string;
    teach_decree_id?: string;
    course_id?: string;
}): Promise<{
    data: TeachItem[];
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
        if (queryParams?.activity_id) params.set('activity_id', queryParams.activity_id);
        if (queryParams?.teach_decree_id) params.set('teach_decree_id', queryParams.teach_decree_id);
        if (queryParams?.course_id) params.set('course_id', queryParams.course_id);

        const res = await fetch(`${getBaseUrl()}/academic/campaign/transaction/teaches?${params.toString()}`, {
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
        console.warn('Error fetching teaches list:', err);
        return {
            data: [],
            total: 0,
            page: 1,
            page_size: 10,
            total_pages: 0,
        };
    }
}

export async function getTeachById(id: string): Promise<TeachItem | null> {
    if (!id || id === '00000000-0000-0000-0000-000000000000') return null;
    try {
        const res = await fetch(`${getBaseUrl()}/academic/campaign/transaction/teaches/${id}`, {
            method: 'GET',
            headers: getHeaders(),
        });
        if (!res.ok) return null;
        return await res.json();
    } catch (err) {
        console.warn(`Error fetching teach ${id}:`, err);
        return null;
    }
}

export async function getCourseById(id: string): Promise<any | null> {
    if (!id || id === '00000000-0000-0000-0000-000000000000') return null;
    try {
        const res = await fetch(`${getBaseUrl()}/academic/course/master/courses/${id}`, {
            method: 'GET',
            headers: getHeaders(),
        });
        if (!res.ok) return null;
        return await res.json();
    } catch (err) {
        console.warn(`Error fetching course ${id}:`, err);
        return null;
    }
}

export async function getClassCodeById(id: string): Promise<any | null> {
    if (!id || id === '00000000-0000-0000-0000-000000000000') return null;
    try {
        const res = await fetch(`${getBaseUrl()}/academic/campaign/transaction/class-codes/${id}`, {
            method: 'GET',
            headers: getHeaders(),
        });
        if (!res.ok) return null;
        return await res.json();
    } catch (err) {
        console.warn(`Error fetching class code ${id}:`, err);
        return null;
    }
}

export async function listCourses(queryParams?: { page?: number; page_size?: number; name?: string; code?: string; unit_id?: string }): Promise<any[]> {
    try {
        const params = new URLSearchParams();
        const size = queryParams?.page_size || 500;
        params.set('page_size', String(size));
        if (queryParams?.page) params.set('page', String(queryParams.page));
        if (queryParams?.name) params.set('name', queryParams.name);
        if (queryParams?.code) params.set('code', queryParams.code);
        if (queryParams?.unit_id) params.set('unit_id', queryParams.unit_id);

        const res = await fetch(`${getBaseUrl()}/academic/course/master/courses?${params.toString()}`, {
            method: 'GET',
            headers: getHeaders(),
        });
        if (!res.ok) return [];
        const json = await res.json();
        return json.data || [];
    } catch (err) {
        console.warn('Error fetching courses:', err);
        return [];
    }
}

export async function listTeachDecrees(queryParams?: { page?: number; page_size?: number; activity_id?: string }): Promise<any[]> {
    try {
        const params = new URLSearchParams();
        const size = queryParams?.page_size || 200;
        params.set('page_size', String(size));
        if (queryParams?.page) params.set('page', String(queryParams.page));
        if (queryParams?.activity_id) params.set('activity_id', queryParams.activity_id);

        const res = await fetch(`${getBaseUrl()}/academic/campaign/transaction/teach-decrees?${params.toString()}`, {
            method: 'GET',
            headers: getHeaders(),
        });
        if (!res.ok) return [];
        const json = await res.json();
        return json.data || [];
    } catch (err) {
        console.warn('Error fetching teach decrees:', err);
        return [];
    }
}

export async function listClassCodes(queryParams?: { page_size?: number }): Promise<any[]> {
    try {
        const size = queryParams?.page_size || 200;
        const res = await fetch(`${getBaseUrl()}/academic/campaign/transaction/class-codes?page_size=${size}`, {
            method: 'GET',
            headers: getHeaders(),
        });
        if (!res.ok) return [];
        const json = await res.json();
        return json.data || [];
    } catch (err) {
        console.warn('Error fetching class codes:', err);
        return [];
    }
}

export interface LecturerAssignedTeachItem {
    teach_lecturer_id: string;
    teach_id: string;
    lecturer_id: string;
    planning: number;
    realization: number;
    credit: number;
    is_lecturer_home_base: boolean;
    role_name?: string | null;
    
    // Teach info
    teach_name?: string | null;
    description?: string | null;
    start_date?: string | null;
    end_date?: string | null;
    max_member?: number;
    activity_id?: string | null;
    activity_name?: string | null;
    academic_year_id?: string | null;
    academic_year_name?: string | null;
    academic_year_code?: number | string | null;
    
    // Course info (from academic_course_master.courses)
    course_id: string;
    course_code?: string;
    course_name?: string;
    course_total_credit?: number;
    course_lecture_credit?: number;
    course_practice_credit?: number;
    
    // Class code info (from academic_campaign_transaction.class_codes)
    class_code_id: string;
    class_name?: string;
    class_alphabet_code?: string;
    class_capacity?: number;
}

export async function listActivities(queryParams?: { page_size?: number }): Promise<any[]> {
    try {
        const size = queryParams?.page_size || 500;
        const res = await fetch(`${getBaseUrl()}/academic/campaign/transaction/activities?page_size=${size}`, {
            method: 'GET',
            headers: getHeaders(),
        });
        if (!res.ok) return [];
        const json = await res.json();
        return json.data || [];
    } catch (err) {
        console.warn('Error fetching activities:', err);
        return [];
    }
}

export async function getActivityById(id: string): Promise<any | null> {
    if (!id || id === '00000000-0000-0000-0000-000000000000') return null;
    try {
        const res = await fetch(`${getBaseUrl()}/academic/campaign/transaction/activities/${id}`, {
            method: 'GET',
            headers: getHeaders(),
        });
        if (!res.ok) return null;
        return await res.json();
    } catch (err) {
        console.warn(`Error fetching activity ${id}:`, err);
        return null;
    }
}

export async function listAcademicYears(queryParams?: { page_size?: number }): Promise<any[]> {
    try {
        const size = queryParams?.page_size || 500;
        const res = await fetch(`${getBaseUrl()}/academic/general/reference/academic-years?page_size=${size}`, {
            method: 'GET',
            headers: getHeaders(),
        });
        if (!res.ok) return [];
        const json = await res.json();
        return json.data || [];
    } catch (err) {
        console.warn('Error fetching academic years:', err);
        return [];
    }
}

export async function getAcademicYearById(id: string): Promise<any | null> {
    if (!id || id === '00000000-0000-0000-0000-000000000000') return null;
    try {
        const res = await fetch(`${getBaseUrl()}/academic/general/reference/academic-years/${id}`, {
            method: 'GET',
            headers: getHeaders(),
        });
        if (!res.ok) return null;
        return await res.json();
    } catch (err) {
        console.warn(`Error fetching academic year ${id}:`, err);
        return null;
    }
}

export async function listTeachLecturers(queryParams?: { page?: number; page_size?: number; lecturer_id?: string; teach_id?: string }): Promise<any[]> {
    try {
        const size = queryParams?.page_size || 200;
        const params = new URLSearchParams();
        params.set('page_size', String(size));
        if (queryParams?.page) params.set('page', String(queryParams.page));
        if (queryParams?.lecturer_id) params.set('lecturer_id', queryParams.lecturer_id);
        if (queryParams?.teach_id) params.set('teach_id', queryParams.teach_id);

        const res = await fetch(`${getBaseUrl()}/academic/campaign/transaction/teach-lecturers?${params.toString()}`, {
            method: 'GET',
            headers: getHeaders(),
        });
        if (!res.ok) return [];
        const json = await res.json();
        return json.data || [];
    } catch (err) {
        console.warn('Error fetching teach lecturers:', err);
        return [];
    }
}

export async function getLecturerAssignedTeaches(lecturerId: string): Promise<LecturerAssignedTeachItem[]> {
    if (!lecturerId || lecturerId === '00000000-0000-0000-0000-000000000000') return [];
    try {
        const [teachLecturers, coursesList, classCodesList, activitiesList, academicYearsList] = await Promise.all([
            listTeachLecturers({ lecturer_id: lecturerId, page_size: 500 }),
            listCourses({ page_size: 1000 }),
            listClassCodes({ page_size: 1000 }),
            listActivities({ page_size: 1000 }),
            listAcademicYears({ page_size: 500 }),
        ]);

        const filteredTeachLecturers = Array.isArray(teachLecturers) 
            ? teachLecturers.filter(tl => tl.lecturer_id === lecturerId)
            : [];

        if (filteredTeachLecturers.length === 0) return [];

        const coursesMap = new Map<string, any>();
        coursesList.forEach((c: any) => { if (c.id) coursesMap.set(c.id, c); });

        const classCodesMap = new Map<string, any>();
        classCodesList.forEach((cc: any) => { if (cc.id) classCodesMap.set(cc.id, cc); });

        const activitiesMap = new Map<string, any>();
        activitiesList.forEach((a: any) => { if (a.id) activitiesMap.set(a.id, a); });

        const academicYearsMap = new Map<string, any>();
        academicYearsList.forEach((ay: any) => { if (ay.id) academicYearsMap.set(ay.id, ay); });

        const results: LecturerAssignedTeachItem[] = [];

        await Promise.all(
            filteredTeachLecturers.map(async (tl) => {
                let teach: any = null;
                if (tl.teach_id) {
                    teach = await getTeachById(tl.teach_id);
                }

                const courseId = teach?.course_id || '';
                let course = courseId ? coursesMap.get(courseId) : null;
                if (!course && courseId) {
                    course = await getCourseById(courseId);
                    if (course) coursesMap.set(courseId, course);
                }

                const classCodeId = teach?.class_code_id || '';
                let classCode = classCodeId ? classCodesMap.get(classCodeId) : null;
                if (!classCode && classCodeId) {
                    classCode = await getClassCodeById(classCodeId);
                    if (classCode) classCodesMap.set(classCodeId, classCode);
                }

                const activityId = teach?.activity_id || null;
                let activity = activityId ? activitiesMap.get(activityId) : null;
                if (!activity && activityId) {
                    activity = await getActivityById(activityId);
                    if (activity) activitiesMap.set(activityId, activity);
                }

                const academicYearId = activity?.academic_year_id || null;
                let academicYear = academicYearId ? academicYearsMap.get(academicYearId) : null;
                if (!academicYear && academicYearId) {
                    academicYear = await getAcademicYearById(academicYearId);
                    if (academicYear) academicYearsMap.set(academicYearId, academicYear);
                }

                results.push({
                    teach_lecturer_id: tl.id,
                    teach_id: tl.teach_id,
                    lecturer_id: tl.lecturer_id,
                    planning: Number(tl.planning) || 0,
                    realization: Number(tl.realization) || 0,
                    credit: Number(tl.credit) || (course?.total_credit ? Number(course.total_credit) : 0),
                    is_lecturer_home_base: Boolean(tl.is_lecturer_home_base),
                    role_name: tl.name || null,

                    teach_name: teach?.name || null,
                    description: teach?.description || null,
                    start_date: teach?.start_date || null,
                    end_date: teach?.end_date || null,
                    max_member: teach?.max_member || 0,
                    activity_id: activityId,
                    activity_name: activity?.name || null,
                    academic_year_id: academicYearId,
                    academic_year_name: academicYear?.name || (academicYear?.code ? String(academicYear.code) : null),
                    academic_year_code: academicYear?.code || null,

                    course_id: courseId,
                    course_code: course?.code || '-',
                    course_name: course?.name || (teach?.name ? `Mata Kuliah (${teach.name})` : 'Mata Kuliah'),
                    course_total_credit: course?.total_credit ? Number(course.total_credit) : (Number(tl.credit) || 0),
                    course_lecture_credit: course?.lecture_credit ? Number(course.lecture_credit) : 0,
                    course_practice_credit: course?.practice_credit ? Number(course.practice_credit) : 0,

                    class_code_id: classCodeId,
                    class_name: classCode?.name || (classCode?.alphabet_code ? `Kelas ${classCode.alphabet_code}` : 'Kelas'),
                    class_alphabet_code: classCode?.alphabet_code || classCode?.name || '-',
                    class_capacity: classCode?.capacity || teach?.max_member || 0,
                });
            })
        );

        results.sort((a, b) => {
            const yearCodeA = Number(a.academic_year_code) || 0;
            const yearCodeB = Number(b.academic_year_code) || 0;
            if (yearCodeA !== yearCodeB) {
                return yearCodeB - yearCodeA;
            }
            const yearNameA = a.academic_year_name || '';
            const yearNameB = b.academic_year_name || '';
            const yearComp = yearNameB.localeCompare(yearNameA);
            if (yearComp !== 0) return yearComp;

            return (a.course_name || '').localeCompare(b.course_name || '');
        });
        return results;
    } catch (err) {
        console.error('Error getting lecturer assigned teaches:', err);
        return [];
    }
}

export async function listSchedules(queryParams?: { page_size?: number }): Promise<any[]> {
    try {
        const size = queryParams?.page_size || 200;
        const res = await fetch(`${getBaseUrl()}/academic/campaign/transaction/schedules?page_size=${size}`, {
            method: 'GET',
            headers: getHeaders(),
        });
        if (!res.ok) return [];
        const json = await res.json();
        return json.data || [];
    } catch (err) {
        console.warn('Error fetching schedules:', err);
        return [];
    }
}

export async function listLecturers(queryParams?: { page_size?: number }): Promise<any[]> {
    try {
        const size = queryParams?.page_size || 200;
        const res = await fetch(`${getBaseUrl()}/academic/lecturer/master/lecturers?page_size=${size}`, {
            method: 'GET',
            headers: getHeaders(),
        });
        if (!res.ok) return [];
        const json = await res.json();
        return json.data || [];
    } catch (err) {
        console.warn('Error fetching lecturers:', err);
        return [];
    }
}

export async function listRooms(queryParams?: { page_size?: number }): Promise<any[]> {
    try {
        const size = queryParams?.page_size || 200;
        const res = await fetch(`${getBaseUrl()}/building/master/rooms?page_size=${size}`, {
            method: 'GET',
            headers: getHeaders(),
        });
        if (!res.ok) return [];
        const json = await res.json();
        return json.data || [];
    } catch (err) {
        console.warn('Error fetching rooms:', err);
        return [];
    }
}

export async function academicCampaignTransactionTeachList(unit_activity_id: string): Promise<{
    code: number;
    message: string | object;
}> {
    try {
        const response = await fetch(`${getBaseUrl()}/academic/campaign/transaction/teaches`, {
            method: 'GET',
            headers: getHeaders(),
        });
        const data = await response.json();
        if (!response.ok) {
            return {
                code: response.status || 500,
                message: 'Gagal mengambil detail aktivitas kuliah',
            };
        }
        return { code: 200, message: data };
    } catch (error) {
        return { code: 500, message: 'Internal server error' };
    }
}