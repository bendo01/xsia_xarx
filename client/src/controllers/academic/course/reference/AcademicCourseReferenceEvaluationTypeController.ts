import {
    TypePaginationForm,
    TypePaginationResponse,
    TypeInputEntityReferenceForm,
} from '~/lib/types';
import type { AcademicCourseReferenceEvaluationType } from '~/models/academic/course/reference/EvaluationType';

const getBaseUrl = () => {
    return (import.meta.env.VITE_API_SERVER_URL ?? 'http://127.0.0.1:5800/api/v1/').replace(/\/+$/, '');
};

export async function AcademicCourseReferenceControllerEvaluationTypeIndex(
    props: TypePaginationForm,
): Promise<TypePaginationResponse<AcademicCourseReferenceEvaluationType>> {
    try {
        const params = new URLSearchParams();
        if (props.page) params.append('page', props.page.toString());
        if (props.per_page) params.append('page_size', props.per_page.toString());
        if (props.search) params.append('name', props.search);
        if (props.name) params.append('name', props.name);
        if (props.code !== undefined && props.code !== null && !isNaN(Number(props.code))) {
            params.append('code', props.code.toString());
        }

        const res = await fetch(`${getBaseUrl()}/academic/course/reference/evaluation-types?${params.toString()}`);
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        const resJson = await res.json();
        return {
            pagination: {
                search: props.search || '',
                sort_by: props.sort_by || '',
                column: props.column || '',
                sort_dir: props.sort_dir || '',
                page: resJson.page || props.page || 1,
                per_page: resJson.page_size || props.per_page || 10,
                total_page: resJson.total_pages || 0,
                last_page: resJson.total_pages || 1,
                total_data: resJson.total ?? (Array.isArray(resJson.data) ? resJson.data.length : 0),
            },
            data: Array.isArray(resJson.data) ? resJson.data : (Array.isArray(resJson) ? resJson : []),
        };
    } catch (e) {
        console.error('Error in AcademicCourseReferenceControllerEvaluationTypeIndex:', e);
        return {
            pagination: {
                search: props.search || '',
                sort_by: props.sort_by || '',
                column: props.column || '',
                sort_dir: props.sort_dir || '',
                page: props.page || 1,
                per_page: props.per_page || 10,
                total_page: 0,
                last_page: 1,
                total_data: 0,
            },
            data: [],
        };
    }
}

export async function AcademicCourseReferenceControllerEvaluationTypeUpsert(
    form: TypeInputEntityReferenceForm,
): Promise<{ is_error: boolean; message: string; data?: AcademicCourseReferenceEvaluationType }> {
    try {
        const isUpdate = !!form.id;
        const url = isUpdate
            ? `${getBaseUrl()}/academic/course/reference/evaluation-types/${form.id}`
            : `${getBaseUrl()}/academic/course/reference/evaluation-types`;
        const method = isUpdate ? 'PUT' : 'POST';

        const payload: Record<string, any> = {
            code: isNaN(Number(form.code)) ? form.code : Number(form.code),
            alphabet_code: form.alphabet_code || form.alphabetic_code || '',
            name: form.name,
        };

        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        const resJson = await res.json().catch(() => ({}));
        if (!res.ok) {
            return {
                is_error: true,
                message: resJson.message || resJson.brief || (isUpdate ? 'Failed to update record.' : 'Failed to create record.'),
            };
        }

        return {
            is_error: false,
            message: isUpdate ? 'Record updated successfully.' : 'Record created successfully.',
            data: resJson,
        };
    } catch (error: any) {
        return {
            is_error: true,
            message: error.message || 'Network error while saving record.',
        };
    }
}

export async function AcademicCourseReferenceControllerEvaluationTypeDelete(
    props: { id: string },
): Promise<{ is_error: boolean; message: string }> {
    try {
        const res = await fetch(`${getBaseUrl()}/academic/course/reference/evaluation-types/${props.id}`, {
            method: 'DELETE',
        });
        const resJson = await res.json().catch(() => ({}));
        if (!res.ok) {
            return {
                is_error: true,
                message: resJson.message || resJson.brief || 'Failed to delete record.',
            };
        }
        return {
            is_error: false,
            message: resJson.message || 'Record deleted successfully.',
        };
    } catch (error: any) {
        return {
            is_error: true,
            message: error.message || 'Network error while deleting record.',
        };
    }
}
