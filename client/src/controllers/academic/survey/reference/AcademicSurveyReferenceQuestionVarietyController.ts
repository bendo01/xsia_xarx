import {
    TypePaginationForm,
    TypePaginationResponse,
    TypeInputEntityReferenceForm,
} from '~/lib/types';
import type { AcademicSurveyReferenceQuestionVariety } from '~/models/academic/survey/reference/QuestionVariety';

const getBaseUrl = () => {
    return (import.meta.env.VITE_API_SERVER_URL ?? 'http://127.0.0.1:5800/api/v1/').replace(/\/+$/, '');
};

export async function AcademicSurveyReferenceControllerQuestionVarietyIndex(
    props: TypePaginationForm,
): Promise<TypePaginationResponse<AcademicSurveyReferenceQuestionVariety>> {
    try {
        const params = new URLSearchParams();
        if (props.page) params.append('page', props.page.toString());
        if (props.per_page) params.append('page_size', props.per_page.toString());
        if (props.search) params.append('name', props.search);
        if (props.name) params.append('name', props.name);
        if (props.code !== undefined && props.code !== null && !isNaN(Number(props.code))) {
            params.append('code', props.code.toString());
        }

        const res = await fetch(`${getBaseUrl()}/academic/survey/reference/question-varieties?${params.toString()}`);
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
        console.error('Error in AcademicSurveyReferenceControllerQuestionVarietyIndex:', e);
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

export async function AcademicSurveyReferenceControllerQuestionVarietyUpsert(
    form: TypeInputEntityReferenceForm,
): Promise<{ is_error: boolean; message: string; data?: AcademicSurveyReferenceQuestionVariety }> {
    try {
        const isUpdate = !!form.id;
        const url = isUpdate
            ? `${getBaseUrl()}/academic/survey/reference/question-varieties/${form.id}`
            : `${getBaseUrl()}/academic/survey/reference/question-varieties`;
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
                message: resJson.message || resJson.brief || (isUpdate ? 'Failed to update question variety.' : 'Failed to create question variety.'),
            };
        }

        return {
            is_error: false,
            message: isUpdate ? 'Question variety updated successfully.' : 'Question variety created successfully.',
            data: resJson,
        };
    } catch (error: any) {
        return {
            is_error: true,
            message: error.message || 'Network error while saving question variety.',
        };
    }
}

export async function AcademicSurveyReferenceControllerQuestionVarietyDelete(
    props: { id: string },
): Promise<{ is_error: boolean; message: string }> {
    try {
        const res = await fetch(`${getBaseUrl()}/academic/survey/reference/question-varieties/${props.id}`, {
            method: 'DELETE',
        });
        const resJson = await res.json().catch(() => ({}));
        if (!res.ok) {
            return {
                is_error: true,
                message: resJson.message || resJson.brief || 'Failed to delete question variety.',
            };
        }
        return {
            is_error: false,
            message: resJson.message || 'Question variety deleted successfully.',
        };
    } catch (error: any) {
        return {
            is_error: true,
            message: error.message || 'Network error while deleting question variety.',
        };
    }
}
