import {
    userRolesSignal,
    getStoredRoles,
    currentRoleIdSignal,
    getStoredUser,
    currentUserSignal,
    activeInstitutionIdSignal,
    setActiveInstitution,
    setUserRolesSignal,
    institutionCache,
    lookupInstitutionName,
    type UserRoleItem,
} from './authStore';
import { getStorageItem, setStorageItem } from './storage';
import { masterApiShow } from '~/controllers/master/masterApiController';

const ZERO_UUID = '00000000-0000-0000-0000-000000000000';

function isValidUuid(id?: string | null): boolean {
    if (!id) return false;
    const trimmed = id.trim();
    if (trimmed === '' || trimmed === '[id]' || trimmed === ':id' || trimmed === ZERO_UUID) {
        return false;
    }
    return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(trimmed);
}

/**
 * Resolves the institution ID for rectorat views.
 * Lookup flow:
 * 1. staff (roleable_id) -> unit_id -> unit -> institution_id
 * 2. staff (roleable_id) -> employee_id -> employee -> institution_id
 */
export async function resolveInstitutionFromStaffRole(
    preferredInstitutionId?: string,
    targetRoleOrId?: UserRoleItem | string | null
): Promise<string> {
    // If an explicit valid UUID is provided without a target role request (e.g. from page route params.id)
    if (isValidUuid(preferredInstitutionId) && !targetRoleOrId) {
        setActiveInstitution(preferredInstitutionId!);
        return preferredInstitutionId!;
    }

    // Collect all available roles
    const signalRoles = userRolesSignal() || [];
    const storedRoles = getStoredRoles() || [];
    const user = currentUserSignal() || getStoredUser();
    const userObjRoles = user?.roles || [];

    const allRoles: UserRoleItem[] = [];
    const seenIds = new Set<string>();
    for (const r of [...signalRoles, ...storedRoles, ...userObjRoles]) {
        if (r && r.id && !seenIds.has(r.id)) {
            seenIds.add(r.id);
            allRoles.push(r);
        }
    }

    // Identify target role
    let targetRole: UserRoleItem | undefined;
    if (targetRoleOrId) {
        if (typeof targetRoleOrId === 'object' && targetRoleOrId.id) {
            targetRole = allRoles.find(r => r.id === targetRoleOrId.id) || targetRoleOrId;
        } else if (typeof targetRoleOrId === 'string') {
            const q = targetRoleOrId.toLowerCase().trim();
            const qClean = q.replace(/[-\s_]+/g, '');
            targetRole = allRoles.find(r => r.id === targetRoleOrId) ||
                allRoles.find(r => r.name.toLowerCase().trim() === q) ||
                allRoles.find(r => r.name.toLowerCase().replace(/[-\s_]+/g, '') === qClean) ||
                (qClean.includes('lpti') ? allRoles.find(r => r.name.toLowerCase().includes('lpti')) : undefined) ||
                (qClean.includes('dekan') ? allRoles.find(r => r.name.toLowerCase().includes('dekan')) : undefined) ||
                (qClean.includes('fakultas') ? allRoles.find(r => r.name.toLowerCase().includes('fakultas')) : undefined) ||
                (qClean.includes('rektor') ? allRoles.find(r => r.name.toLowerCase().includes('rektor')) : undefined);
        }
    }

    if (!targetRole) {
        const activeRoleId = currentRoleIdSignal() || getStorageItem('current_role') || '';
        if (activeRoleId) {
            targetRole = allRoles.find(r => r.id === activeRoleId);
        }
    }

    // If target role already has institution_id cached
    if (targetRole && isValidUuid(targetRole.institution_id)) {
        setActiveInstitution(targetRole.institution_id!, false, targetRole.institution_name);
        return targetRole.institution_id!;
    }

    // If target role is a staff role, resolve from its roleable_id
    if (targetRole && isValidUuid(targetRole.roleable_id)) {
        const instId = await lookupStaffInstitution(targetRole.roleable_id!);
        if (isValidUuid(instId)) {
            const instName = targetRole.institution_name || institutionCache[instId!] || '';
            targetRole.institution_id = instId;
            if (instName) targetRole.institution_name = instName;
            cacheRoleInstitution(targetRole.id, instId!, instName);
            setActiveInstitution(instId!, false, instName);
            return instId!;
        }
    }

    // Only search other staff roles if NO specific target role or active role exists
    if (!targetRoleOrId) {
        const currentRoleId = currentRoleIdSignal() || getStorageItem('current_role') || '';
        const otherStaffRoles = allRoles.filter((r) => {
            const type = r.roleable_type || '';
            return (
                r.id !== currentRoleId &&
                (type === 'App\\Models\\Institution\\Master\\Staff' || type.includes('Staff')) &&
                isValidUuid(r.roleable_id)
            );
        });

        for (const role of otherStaffRoles) {
            if (isValidUuid(role.institution_id)) {
                setActiveInstitution(role.institution_id!);
                return role.institution_id!;
            }
            if (isValidUuid(role.roleable_id)) {
                const instId = await lookupStaffInstitution(role.roleable_id!);
                if (isValidUuid(instId)) {
                    role.institution_id = instId;
                    cacheRoleInstitution(role.id, instId!);
                    setActiveInstitution(instId!);
                    return instId!;
                }
            }
        }
    }

    // Fallback: environment variables or default known institution
    const envInstId =
        (import.meta as any).env?.CURRENT_INSTITUTION_ID ||
        (import.meta as any).env?.VITE_INSTITUTION_ID;
    if (isValidUuid(envInstId)) {
        setActiveInstitution(envInstId);
        return envInstId;
    }

    const cached = getStorageItem('institution_id');
    if (isValidUuid(cached)) {
        setActiveInstitution(cached!);
        return cached!;
    }

    const defaultFallback = 'ed7e8c02-451b-4548-aa81-26b8d0b7fdec';
    setActiveInstitution(defaultFallback);
    return defaultFallback;
}

async function lookupStaffInstitution(staffId: string): Promise<string | undefined> {
    try {
        const staffRes = await masterApiShow<any>('institution/master/staffes', staffId);
        const staff = staffRes.data;
        if (!staff) return undefined;

        // Direct property check if relations are already loaded
        if (isValidUuid(staff.institution_id)) return staff.institution_id;
        if (isValidUuid(staff.unit?.institution_id)) return staff.unit.institution_id;
        if (isValidUuid(staff.employee?.institution_id)) return staff.employee.institution_id;

        // 1. Try staff -> unit -> institution_id
        if (isValidUuid(staff.unit_id)) {
            try {
                const unitRes = await masterApiShow<any>('institution/master/units', staff.unit_id);
                const instId = unitRes.data?.institution_id || unitRes.data?.institution?.id;
                const instName = unitRes.data?.institution?.name || unitRes.data?.institution_name;
                if (instId && instName) institutionCache[instId] = instName;
                if (isValidUuid(instId)) return instId;
            } catch (e) {
                // Ignore
            }
        }

        // 2. Try staff -> employee -> institution_id
        if (isValidUuid(staff.employee_id)) {
            try {
                const empRes = await masterApiShow<any>('institution/master/employees', staff.employee_id);
                const instId = empRes.data?.institution_id || empRes.data?.institution?.id;
                const instName = empRes.data?.institution?.name || empRes.data?.institution_name;
                if (instId && instName) institutionCache[instId] = instName;
                if (isValidUuid(instId)) return instId;
            } catch (e) {
                // Ignore
            }
        }
    } catch (e) {
        console.warn(`Failed to lookup staff institution for ${staffId}:`, e);
    }
    return undefined;
}

function cacheRoleInstitution(roleId: string, institutionId: string, institutionName?: string): void {
    const storedRoles = getStoredRoles();
    const idx = storedRoles.findIndex(r => r.id === roleId);
    const name = institutionName || institutionCache[institutionId] || '';
    if (idx !== -1) {
        storedRoles[idx] = {
            ...storedRoles[idx],
            institution_id: institutionId,
            ...(name ? { institution_name: name } : {})
        };
        setStorageItem('roles', JSON.stringify(storedRoles));
        setUserRolesSignal(storedRoles);
    }
}
