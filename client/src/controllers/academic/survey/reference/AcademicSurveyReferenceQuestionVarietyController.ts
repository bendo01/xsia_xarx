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
    const params = new URLSearchParams();
    if (props.page) params.append('page', props.page.toString());
    if (props.per_page) params.append('per_page', props.per_page.toString());
    if (props.search) params.append('search', props.search);
    if (props.sort_by) params.append('sort_by', props.sort_by);
    if (props.sort_dir) params.append('sort_dir', props.sort_dir);

    const res = await fetch(`${getBaseUrl()}/academic/survey/reference/question-varieties?${params.toString()}`);
    return await res.json();
}

export async function AcademicSurveyReferenceControllerQuestionVarietyUpsert(
    form: TypeInputEntityReferenceForm,
): Promise<{ is_error: boolean; message: string; data?: AcademicSurveyReferenceQuestionVariety }> {
    const isUpdate = !!form.id;
    const url = isUpdate
        ? `${getBaseUrl()}/academic/survey/reference/question-varieties/${form.id}`
        : `${getBaseUrl()}/academic/survey/reference/question-varieties`;
    const method = isUpdate ? 'PUT' : 'POST';

    const payload: Record<string, any> = {
        code: isNaN(Number(form.code)) ? form.code : Number(form.code),
        alphabet_code: form.alphabet_code,
        name: form.name,
    };
    if (isUpdate) {
        payload.id = form.id;
    }

    const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    return await res.json();
}

export async function AcademicSurveyReferenceControllerQuestionVarietyDelete(
    props: { id: string },
): Promise<{ is_error: boolean; message: string }> {
    const res = await fetch(`${getBaseUrl()}/academic/survey/reference/question-varieties/${props.id}`, {
        method: 'DELETE',
    });
    return await res.json();
}
