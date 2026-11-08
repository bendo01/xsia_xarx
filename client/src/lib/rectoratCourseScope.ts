import { masterApiIndex } from '~/controllers/master/masterApiController';
import { getUnitOptions } from '~/controllers/institution/master/InstitutionMasterUnitController';

export const ZERO_UUID = '00000000-0000-0000-0000-000000000000';

export const isUsableInstitutionId = (id?: string | null): id is string =>
    !!id && id !== '[id]' && id !== ':id' && id !== ZERO_UUID;

export interface InstitutionUnit {
    id: string;
    name: string;
}

export async function loadInstitutionUnits(institutionId: string): Promise<InstitutionUnit[]> {
    return (await getUnitOptions({ institution_id: institutionId })) ?? [];
}

/**
 * Courses and curricula only carry a `unit_id`, so records are scoped to an
 * institution by fetching them once per unit belonging to that institution.
 */
export async function loadRecordsByUnits<T extends { id: string; unit_id?: string }>(
    apiPath: string,
    units: InstitutionUnit[],
): Promise<T[]> {
    const unitIds = new Set(units.map((u) => u.id));
    const pages = await Promise.all(
        units.map((u) => masterApiIndex<T>(apiPath, { page: 1, per_page: 500, unit_id: u.id } as any)),
    );
    const seen = new Set<string>();
    const merged: T[] = [];
    for (const page of pages) {
        for (const row of page.data ?? []) {
            if (seen.has(row.id)) continue;
            if (row.unit_id && !unitIds.has(row.unit_id)) continue;
            seen.add(row.id);
            merged.push(row);
        }
    }
    return merged;
}
