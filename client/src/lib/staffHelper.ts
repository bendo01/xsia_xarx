import {
    currentUserSignal,
    userRolesSignal,
    activeRoleSignal,
    currentRoleIdSignal,
    getStoredRoles,
    getStoredUser,
    refreshAuthState,
    isStaffProgramStudi,
    normalizeRoleName
} from './authStore';
import { getStorageItem, setStorageItem } from './storage';
import { masterApiShow } from '~/controllers/master/masterApiController';
import { GetCurrentUser } from '~/controllers/auth/AuthUser';

export interface LoggedInStaffUnitResult {
    unitId: string;
    unit: any | null;
    staff: any | null;
    staffName: string | null;
    staffId: string | null;
    isFromStaff: boolean;
    isAdmin: boolean;
}

/**
 * Resolves the unit_id of the currently logged-in staff member.
 * Inspects active roles, user roles, staff records, and individual employee relations.
 */
export async function getLoggedInStaffUnit(preferredUnitId?: string): Promise<LoggedInStaffUnitResult> {
    let resolvedUnitId = '';
    let staffData: any | null = null;
    let staffName: string | null = null;
    let staffId: string | null = null;
    let isFromStaff = false;

    // Check if user is administrator
    const roles = userRolesSignal().length > 0 ? userRolesSignal() : (getStoredRoles() || []);
    const activeRoleName = typeof activeRoleSignal() === 'string' ? activeRoleSignal() : '';
    const currentRoleId = currentRoleIdSignal() || getStorageItem('current_role') || '';
    const activeRoleItem = roles.find(r => r.id === currentRoleId) ||
                           roles.find(r => normalizeRoleName(r.name) === activeRoleName);

    const isAdmin = roles.some(r => normalizeRoleName(r.name) === 'administrator') ||
                    normalizeRoleName(activeRoleName) === 'administrator';

    // Helper to evaluate a staff record ID
    const checkStaffId = async (sId: string): Promise<boolean> => {
        if (!sId || sId === '00000000-0000-0000-0000-000000000000') return false;
        try {
            const staffRes = await masterApiShow<any>('institution/master/staffes', sId);
            if (staffRes.data?.unit_id) {
                resolvedUnitId = staffRes.data.unit_id;
                staffData = staffRes.data;
                staffName = staffRes.data.name || staffRes.data.nama || null;
                staffId = staffRes.data.id || sId;
                isFromStaff = true;
                setStorageItem('unit_id', resolvedUnitId);
                return true;
            }
        } catch {
            // Continue
        }
        return false;
    };

    // 1. Try active role item
    if (activeRoleItem) {
        if (activeRoleItem.unit_id && activeRoleItem.unit_id !== '00000000-0000-0000-0000-000000000000') {
            resolvedUnitId = activeRoleItem.unit_id;
            isFromStaff = true;
            if (activeRoleItem.roleable_id) {
                await checkStaffId(activeRoleItem.roleable_id);
            }
        } else if (activeRoleItem.roleable_id) {
            await checkStaffId(activeRoleItem.roleable_id);
        }
    }

    // 2. Try user roles list
    if (!resolvedUnitId) {
        for (const role of roles) {
            if (role.unit_id && role.unit_id !== '00000000-0000-0000-0000-000000000000') {
                resolvedUnitId = role.unit_id;
                isFromStaff = true;
                if (role.roleable_id) {
                    await checkStaffId(role.roleable_id);
                }
                break;
            }
            if (
                role.roleable_id &&
                (role.roleable_type?.includes('Staff') || isStaffProgramStudi(role) || String(role.name || '').toLowerCase().includes('prodi'))
            ) {
                const found = await checkStaffId(role.roleable_id);
                if (found) break;
            }
        }
    }

    // 3. Try individual -> employee -> staffes relation
    if (!resolvedUnitId) {
        const user = currentUserSignal();
        let indId = user?.individual_id || getStorageItem('individual_id');
        if (!indId || indId === '00000000-0000-0000-0000-000000000000') {
            try {
                const userRes = await GetCurrentUser();
                if (userRes?.code === 200 && userRes.data?.individual_id) {
                    indId = userRes.data.individual_id;
                }
            } catch {
                // Ignore
            }
        }

        if (indId && indId !== '00000000-0000-0000-0000-000000000000') {
            try {
                const indRes = await masterApiShow<any>('person/master/individuals', indId);
                if (indRes.data?.employees && Array.isArray(indRes.data.employees)) {
                    for (const emp of indRes.data.employees) {
                        if (emp.staffes && Array.isArray(emp.staffes) && emp.staffes.length > 0) {
                            for (const st of emp.staffes) {
                                if (st.unit_id) {
                                    resolvedUnitId = st.unit_id;
                                    staffData = st;
                                    staffName = st.name || indRes.data.name || null;
                                    staffId = st.id;
                                    isFromStaff = true;
                                    setStorageItem('unit_id', resolvedUnitId);
                                    break;
                                }
                            }
                            if (resolvedUnitId) break;
                        }
                    }
                }
            } catch {
                // Ignore
            }
        }
    }

    // 4. Try storage item unit_id (might be staff_id or direct unit_id)
    if (!resolvedUnitId) {
        const storedUnitId = getStorageItem('unit_id');
        if (storedUnitId && storedUnitId !== '00000000-0000-0000-0000-000000000000') {
            // Check if storedUnitId is actually a staff ID
            const wasStaff = await checkStaffId(storedUnitId);
            if (!wasStaff) {
                resolvedUnitId = storedUnitId;
            }
        }
    }

    // 5. If admin and preferredUnitId passed in (e.g. from query params), allow admin override
    if (preferredUnitId && preferredUnitId.trim() !== '') {
        if (isAdmin || !resolvedUnitId) {
            resolvedUnitId = preferredUnitId.trim();
        }
    }

    // Load Unit metadata if resolved
    let unitData: any | null = null;
    if (resolvedUnitId) {
        try {
            const unitRes = await masterApiShow<any>('institution/master/units', resolvedUnitId);
            if (unitRes.data) {
                unitData = unitRes.data;
            }
        } catch {
            // Ignore
        }
    }

    if (!staffName) {
        staffName = currentUserSignal()?.name || getStoredUser()?.name || null;
    }

    return {
        unitId: resolvedUnitId,
        unit: unitData,
        staff: staffData,
        staffName,
        staffId,
        isFromStaff,
        isAdmin,
    };
}
