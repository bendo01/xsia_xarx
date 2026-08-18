import {
    TypePaginationForm,
    TypePaginationResponse,
    TypeInputEntityReferenceForm,
} from '~/lib/types';
import type { AcademicCandidateReferenceRegistrationCategory } from '~/models/academic/candidate/reference/RegistrationCategory';
import type { ModelSelectItem } from '~/models/common/select/ModelSelectItem';

const getBaseUrl = () => {
    return (import.meta.env.VITE_API_SERVER_URL ?? 'http://127.0.0.1:5800/api/v1/').replace(/\/+$/, '');
};

export async function AcademicCandidateReferenceControllerRegistrationCategoryIndex(
    props: TypePaginationForm,
): Promise<TypePaginationResponse<AcademicCandidateReferenceRegistrationCategory>> {
    const params = new URLSearchParams();
    if (props.page) params.append('page', props.page.toString());
    if (props.per_page) params.append('per_page', props.per_page.toString());
    if (props.search) params.append('search', props.search);
    if (props.sort_by) params.append('sort_by', props.sort_by);
    if (props.sort_dir) params.append('sort_dir', props.sort_dir);

    const res = await fetch(`${getBaseUrl()}/academic/candidate/reference/registration-categories?${params.toString()}`);
    return await res.json();
}

export async function AcademicCandidateReferenceControllerRegistrationCategoryUpsert(
    form: TypeInputEntityReferenceForm,
): Promise<{ is_error: boolean; message: string; data?: AcademicCandidateReferenceRegistrationCategory }> {
    const isUpdate = !!form.id;
    const url = isUpdate
        ? `${getBaseUrl()}/academic/candidate/reference/registration-categories/${form.id}`
        : `${getBaseUrl()}/academic/candidate/reference/registration-categories`;
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

export async function AcademicCandidateReferenceControllerRegistrationCategoryDelete(
    props: { id: string },
): Promise<{ is_error: boolean; message: string }> {
    const res = await fetch(`${getBaseUrl()}/academic/candidate/reference/registration-categories/${props.id}`, {
        method: 'DELETE',
    });
    return await res.json();
}

export async function getRegistrationCategoryLists(): Promise<{
    code: number;
    message: string | ModelSelectItem[];
}> {
    const server_api_url = import.meta.env.VITE_API_SERVER_URL ?? 'http://localhost:5150/api/';
    try {
        const response = await fetch(`${server_api_url}academic/candidate/reference/registration_categories`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
        });
        const data: ModelSelectItem[] = await response.json();

        if (!response.ok) {
            return {
                code: response.status || 500,
                message: 'Gagal Mengambil Data Program Studi',
            };
        }

        return {
            code: 200,
            message: data,
        };
    } catch (error) {
        return {
            code: 500,
            message: 'Internal server error',
        };
    }
}
