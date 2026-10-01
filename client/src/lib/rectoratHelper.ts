import {
    userRolesSignal,
    getStoredRoles,
    currentRoleIdSignal,
    getStoredUser,
    currentUserSignal,
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
    // Basic UUID check
    return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(trimmed);
}

/**
 * Resolves the institution ID for rectorat views.
 * Uses the user role's roleable_id to find the institution
 * where roleable_type = 'App\Models\Institution\Master\Staff'.
 *
 * Lookup flow:
 * 1. staff (roleable_id) -> employee_id -> employee -> institution_id
 * 2. staff (roleable_id) -> unit_id -> unit -> institution_id
 */
export async function resolveInstitutionFromStaffRole(preferredInstitutionId?: string): Promise<string> {
    if (isValidUuid(preferredInstitutionId)) {
        setStorageItem('institution_id', preferredInstitutionId!);
        return preferredInstitutionId!;
    }

    // Check cached in storage
    const cached = getStorageItem('institution_id');
    if (isValidUuid(cached)) {
        return cached!;
    }

    // Collect all user roles
    const storedRoles = getStoredRoles() || [];
    const signalRoles = userRolesSignal() || [];
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

    const currentRoleId = currentRoleIdSignal() || getStorageItem('current_role') || '';

    // Find staff roles: roleable_type = 'App\Models\Institution\Master\Staff' (or contains 'Staff')
    const staffRoles = allRoles.filter((r) => {
        const type = r.roleable_type || '';
        return (
            (type === 'App\\Models\\Institution\\Master\\Staff' || type.includes('Staff')) &&
            isValidUuid(r.roleable_id)
        );
    });

    // Prioritize active role first, then roles with names suggesting rectorat / leadership / staff
    staffRoles.sort((a, b) => {
        if (a.id === currentRoleId) return -1;
        if (b.id === currentRoleId) return 1;
        const aName = (a.name || '').toLowerCase();
        const bName = (b.name || '').toLowerCase();
        const aIsRectorat = aName.includes('rektor') || aName.includes('dekan') || aName.includes('lpti') || aName.includes('yayasan');
        const bIsRectorat = bName.includes('rektor') || bName.includes('dekan') || bName.includes('lpti') || bName.includes('yayasan');
        if (aIsRectorat && !bIsRectorat) return -1;
        if (!aIsRectorat && bIsRectorat) return 1;
        return 0;
    });

    for (const role of staffRoles) {
        if (isValidUuid(role.institution_id)) {
            setStorageItem('institution_id', role.institution_id!);
            return role.institution_id!;
        }

        const staffId = role.roleable_id;
        if (!isValidUuid(staffId)) continue;

        try {
            const staffRes = await masterApiShow<any>('institution/master/staffes', staffId!);
            const staff = staffRes.data;
            if (staff) {
                // 1. Try staff -> employee -> institution_id
                if (isValidUuid(staff.employee_id)) {
                    const empRes = await masterApiShow<any>('institution/master/employees', staff.employee_id);
                    const emp = empRes.data;
                    const instId = emp?.institution_id || emp?.institution?.id;
                    if (isValidUuid(instId)) {
                        setStorageItem('institution_id', instId);
                        role.institution_id = instId;
                        return instId;
                    }
                }

                // 2. Try staff -> unit -> institution_id
                if (isValidUuid(staff.unit_id)) {
                    const unitRes = await masterApiShow<any>('institution/master/units', staff.unit_id);
                    const unit = unitRes.data;
                    const instId = unit?.institution_id || unit?.institution?.id;
                    if (isValidUuid(instId)) {
                        setStorageItem('institution_id', instId);
                        role.institution_id = instId;
                        return instId;
                    }
                }
            }
        } catch (e) {
            console.warn(`Failed to resolve institution from staff role ${role.name} (${staffId}):`, e);
        }
    }

    // Fallback: environment variables or default known institution
    const envInstId =
        (import.meta as any).env?.VITE_INSTITUTION_ID ||
        (import.meta as any).env?.CURRENT_INSTITUTION_ID;
    if (isValidUuid(envInstId)) {
        setStorageItem('institution_id', envInstId);
        return envInstId;
    }

    const defaultFallback = 'ed7e8c02-451b-4548-aa81-26b8d0b7fdec';
    setStorageItem('institution_id', defaultFallback);
    return defaultFallback;
}
