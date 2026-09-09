import { createSignal } from 'solid-js';
export { getStorageItem, setStorageItem, removeStorageItem } from './storage';
import { getStorageItem, setStorageItem, removeStorageItem } from './storage';
import { GetUserRoles, GetCurrentUser, LogoutUser as apiLogoutUser } from '../controllers/auth/AuthUser';
import { getStudentById } from '../controllers/academic/student/master/AcademicStudentMasterStudentController';
import { masterApiShow } from '../controllers/master/masterApiController';
import { t } from '../i18n';

export interface UserRoleItem {
    id: string;
    name: string;
    user_id?: string;
    position_type_id?: string;
    position_type_name?: string;
    position_type?: any;
    roleable_id?: string;
    roleable_type?: string;
    code?: string;
    unit_id?: string;
}

export interface StoredUser {
    id?: string;
    pid?: string;
    individual_id?: string;
    name?: string;
    email?: string;
    current_role_id?: string;
    is_active?: boolean;
    roles?: UserRoleItem[];
    position_types?: any[];
}

export function isProgramStudiPosition(positionNameOrType: any): boolean {
    if (!positionNameOrType) return false;
    const name = typeof positionNameOrType === 'string' 
        ? positionNameOrType 
        : (positionNameOrType.name || positionNameOrType.title || '');
    const lower = name.toLowerCase().trim();
    return (
        lower.includes('kepala program studi') ||
        lower.includes('sekertaris program studi') ||
        lower.includes('sekretaris program studi') ||
        lower.includes('staff program studi') ||
        lower.includes('staf program studi') ||
        lower.includes('staff prodi') ||
        lower.includes('staf prodi') ||
        lower.includes('kaprodi') ||
        lower.includes('sekprodi')
    );
}

export function isStaffProgramStudi(role?: UserRoleItem | string | null, user?: StoredUser | null): boolean {
    if (!role && !user) return false;
    
    // Check role name directly
    const roleName = typeof role === 'string' ? role : role?.name;
    if (roleName && isProgramStudiPosition(roleName)) {
        return true;
    }

    // Check position_type on role item
    if (typeof role === 'object' && role !== null) {
        if (role.position_type && isProgramStudiPosition(role.position_type)) {
            return true;
        }
        if (role.position_type_name && isProgramStudiPosition(role.position_type_name)) {
            return true;
        }
    }

    // Check position_types on stored user
    const u = user || getStoredUser();
    if (u && (u as any).position_types && Array.isArray((u as any).position_types)) {
        const hasPos = (u as any).position_types.some((pt: any) => isProgramStudiPosition(pt));
        if (hasPos) return true;
    }

    return false;
}

export function normalizeRoleName(rawRole: string | null | undefined, roleItem?: UserRoleItem | null): string {
    if (roleItem && isStaffProgramStudi(roleItem)) {
        return 'course_department';
    }
    if (!rawRole) return 'guest';
    const lower = rawRole.toLowerCase().trim().replace(/[-\s]+/g, '_');
    if (lower.includes('admin') || lower === 'administrator') {
        return 'administrator';
    }
    if (lower.includes('kandidat') || lower.includes('candidate') || lower.includes('camaba') || lower.includes('pmb') || lower.includes('applicant') || lower.includes('calon_mahasiswa')) {
        return 'candidate';
    }
    if (lower.includes('mahasiswa') || lower.includes('student') || lower.includes('mhs')) {
        return 'student';
    }
    if (lower.includes('dosen') || lower.includes('lecturer') || lower.includes('pengajar') || lower.includes('instructor') || lower.includes('faculty')) {
        return 'lecturer';
    }
    if (
        lower.includes('prodi') || 
        lower.includes('jurusan') || 
        lower.includes('kajur') || 
        lower.includes('kaprodi') || 
        lower.includes('sekprodi') ||
        lower.includes('department') || 
        lower.includes('course') || 
        lower.includes('baak') ||
        lower.includes('kepala_program_studi') ||
        lower.includes('sekertaris_program_studi') ||
        lower.includes('sekretaris_program_studi') ||
        lower.includes('staff_program_studi') ||
        lower.includes('staf_program_studi')
    ) {
        return 'course_department';
    }
    if (lower.includes('rektor') || lower.includes('rector') || lower.includes('yayasan') || lower.includes('pimpinan')) {
        return 'rectorat';
    }
    if (lower === 'user' || lower === 'staff') {
        if (isStaffProgramStudi(rawRole)) {
            return 'course_department';
        }
        return 'user';
    }
    return lower;
}

export function getRoleDisplayName(roleName: string): string {
    const norm = normalizeRoleName(roleName);
    switch (norm) {
        case 'administrator':
            return t('roles.administrator');
        case 'course_department':
            return t('roles.course_department');
        case 'student':
            return t('roles.student');
        case 'lecturer':
            return t('roles.lecturer');
        case 'candidate':
            return t('roles.candidate');
        case 'rectorat':
            return t('roles.rectorat');
        case 'user':
            return t('roles.user');
        case 'guest':
            return t('roles.guest');
        default:
            return roleName.charAt(0).toUpperCase() + roleName.slice(1);
    }
}

export function getDashboardPathForRole(
    roleName: string, 
    roleItem?: UserRoleItem,
    user?: StoredUser | null
): string {
    const targetUser = user || currentUserSignal() || getStoredUser();
    const indId = targetUser?.individual_id || getStorageItem('individual_id');

    const resolveRoleItemUnitId = (item?: UserRoleItem): string => {
        if (!item) return getStorageItem('unit_id') || '';
        if (item.unit_id) return item.unit_id;
        const isStaff = item.roleable_type?.includes('Staff') || isStaffProgramStudi(item);
        if (!isStaff && item.roleable_id) return item.roleable_id;
        return getStorageItem('unit_id') || '';
    };

    if (roleItem && isStaffProgramStudi(roleItem, targetUser)) {
        const uId = resolveRoleItemUnitId(roleItem);
        return uId ? `/course-department/institution/master/unit/${uId}/show` : '/course-department/institution/master/unit/[id]/show';
    }
    const norm = normalizeRoleName(roleName, roleItem);
    switch (norm) {
        case 'administrator':
            return '/administrator/person/master/individual';
        case 'course_department': {
            const uId = resolveRoleItemUnitId(roleItem);
            return uId ? `/course-department/institution/master/unit/${uId}/show` : '/course-department/institution/master/unit/[id]/show';
        }
        case 'student':
            return indId ? `/student/person/master/individual/${indId}/show` : '/student/person/master/individual/[id]/show';
        case 'lecturer':
            return indId ? `/lecturer/person/master/individual/${indId}/show` : '/lecturer/person/master/individual/[id]/show';
        case 'candidate':
            return '/candidate/academic/candidate/master/candidate';
        case 'rectorat':
            return '/dashboard/rectorat';
        default:
            if (isStaffProgramStudi(roleName, targetUser)) {
                const uId = resolveRoleItemUnitId(roleItem);
                return uId ? `/course-department/institution/master/unit/${uId}/show` : '/course-department/institution/master/unit/[id]/show';
            }
            return indId ? `/student/person/master/individual/${indId}/show` : '/student/person/master/individual/[id]/show';
    }
}

export function getStoredUser(): StoredUser | null {
    const raw = getStorageItem('user');
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

export function getStoredRoles(): UserRoleItem[] {
    const raw = getStorageItem('roles');
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
            return parsed.map((item, idx) => {
                if (typeof item === 'string') {
                    return { id: String(idx + 1), name: item };
                }
                return item;
            });
        }
        if (parsed && Array.isArray(parsed.data)) {
            return parsed.data.map((item: any, idx: number) => {
                if (typeof item === 'string') {
                    return { id: String(idx + 1), name: item };
                }
                return item;
            });
        }
        return [];
    } catch {
        return [];
    }
}

export function getActiveRole(): string {
    const explicitRole = getStorageItem('active_role');
    if (explicitRole) {
        return normalizeRoleName(explicitRole);
    }
    const currentRole = getStorageItem('current_role');
    if (currentRole) {
        const roles = getStoredRoles();
        const found = roles.find(r => r.id === currentRole || r.name === currentRole);
        if (found) {
            return normalizeRoleName(found.name);
        }
        // If currentRole is a role name directly
        if (['administrator', 'course_department', 'student', 'lecturer', 'candidate', 'rectorat', 'user', 'admin'].includes(normalizeRoleName(currentRole))) {
            return normalizeRoleName(currentRole);
        }
    }
    const roles = getStoredRoles();
    if (roles.length > 0) {
        return normalizeRoleName(roles[0].name);
    }
    const user = getStoredUser();
    if (user?.email) {
        const emailLower = user.email.toLowerCase();
        if (emailLower.includes('admin') || emailLower.includes('superadmin')) return 'administrator';
        if (emailLower.includes('dept') || emailLower.includes('prodi') || emailLower.includes('course') || emailLower.includes('jurusan')) return 'course_department';
        if (emailLower.includes('lecturer') || emailLower.includes('dosen')) return 'lecturer';
        if (emailLower.includes('student') || emailLower.includes('mhs') || emailLower.includes('mahasiswa')) return 'student';
        if (emailLower.includes('candidate') || emailLower.includes('pmb') || emailLower.includes('camaba') || emailLower.includes('kandidat')) return 'candidate';
        if (emailLower.includes('rector') || emailLower.includes('rektor') || emailLower.includes('yayasan')) return 'rectorat';
    }
    return 'student';
}

export function isAuthenticated(): boolean {
    const token = getStorageItem('token');
    return Boolean(token && token !== 'undefined' && token !== '');
}

// Reactive Signals for global SolidJS state
// Initial state is SSR-safe default values so the initial client hydration pass matches the server DOM.
// Client auth state from localStorage/sessionStorage is synchronized on client mount via refreshAuthState().
const [currentUserSignal, setCurrentUserSignal] = createSignal<StoredUser | null>(null);
const [userRolesSignal, setUserRolesSignal] = createSignal<UserRoleItem[]>([]);
const [activeRoleSignal, setActiveRoleSignal] = createSignal<string>('student');
const [currentRoleIdSignal, setCurrentRoleIdSignal] = createSignal<string>('');
const [isAuthenticatedSignal, setIsAuthenticatedSignal] = createSignal<boolean>(false);
const [activeStudentIdSignal, setActiveStudentIdSignal] = createSignal<string>('');
const [activeStudentCodeSignal, setActiveStudentCodeSignal] = createSignal<string>('');

export {
    currentUserSignal,
    userRolesSignal,
    activeRoleSignal,
    currentRoleIdSignal,
    isAuthenticatedSignal,
    activeStudentIdSignal,
    activeStudentCodeSignal
};

export function getActiveStudentId(): string {
    return getStorageItem('active_student_id') || '';
}

export function getActiveStudentCode(): string {
    return getStorageItem('active_student_code') || '';
}

export function setActiveStudent(studentId: string, studentCode?: string, isSession: boolean = false): void {
    setStorageItem('active_student_id', studentId, isSession);
    setActiveStudentIdSignal(studentId);
    if (studentCode) {
        setStorageItem('active_student_code', studentCode, isSession);
        setActiveStudentCodeSignal(studentCode);
    }
}

export async function enrichUserRolesWithStudentCodes(): Promise<UserRoleItem[]> {
    const roles = getStoredRoles();
    if (roles.length === 0) return [];
    let changed = false;
    const updatedRoles = await Promise.all(roles.map(async (r) => {
        if ((normalizeRoleName(r.name) === 'student' || r.roleable_type?.includes('Student')) && r.roleable_id && !r.code) {
            try {
                const std = await getStudentById(r.roleable_id);
                if (std?.code) {
                    changed = true;
                    return { ...r, code: std.code };
                }
            } catch {
                // Ignore
            }
        }
        if (
            (normalizeRoleName(r.name) === 'course_department' || isStaffProgramStudi(r) || r.roleable_type?.includes('Staff')) && 
            r.roleable_id && 
            !r.unit_id
        ) {
            try {
                const staffRes = await masterApiShow<any>('institution/master/staffes', r.roleable_id);
                if (staffRes.data?.unit_id) {
                    changed = true;
                    if (!getStorageItem('unit_id')) {
                        setStorageItem('unit_id', staffRes.data.unit_id);
                    }
                    return { ...r, unit_id: staffRes.data.unit_id };
                }
            } catch {
                // Ignore
            }
        }
        return r;
    }));

    if (changed) {
        setStorageItem('roles', JSON.stringify(updatedRoles));
        setUserRolesSignal(updatedRoles);
        const currentRole = updatedRoles.find(r => r.id === getStorageItem('current_role') || (getActiveStudentId() && r.roleable_id === getActiveStudentId()));
        if (currentRole?.code && !getActiveStudentCode()) {
            setActiveStudent(currentRole.roleable_id || getActiveStudentId(), currentRole.code);
        }
        if (currentRole?.unit_id) {
            setStorageItem('unit_id', currentRole.unit_id);
        }
    }
    return updatedRoles;
}

export function refreshAuthState(): void {
    const user = getStoredUser();
    const roles = getStoredRoles();
    const active = getActiveRole();
    const token = getStorageItem('token');
    const studentId = getActiveStudentId();
    const studentCode = getActiveStudentCode();
    const currentRoleId = getStorageItem('current_role') || '';
    setCurrentUserSignal(user);
    setUserRolesSignal(roles);
    setActiveRoleSignal(active);
    setCurrentRoleIdSignal(currentRoleId);
    setActiveStudentIdSignal(studentId);
    setActiveStudentCodeSignal(studentCode);
    setIsAuthenticatedSignal(Boolean(token && token !== 'undefined' && token !== ''));
}

export function setActiveRole(roleNameOrId: string, isSession: boolean = false): void {
    const roles = getStoredRoles();
    let targetName = roleNameOrId;
    let targetId = roleNameOrId;
    let targetRole: UserRoleItem | undefined;

    const matchedById = roles.find(r => r.id === roleNameOrId);
    if (matchedById) {
        targetName = matchedById.name;
        targetId = matchedById.id;
        targetRole = matchedById;
    } else {
        const matchedByName = roles.find(r => normalizeRoleName(r.name) === normalizeRoleName(roleNameOrId));
        if (matchedByName) {
            targetName = matchedByName.name;
            targetId = matchedByName.id;
            targetRole = matchedByName;
        }
    }

    const normalized = normalizeRoleName(targetName);
    setStorageItem('active_role', normalized, isSession);
    setStorageItem('current_role', targetId, isSession);
    setActiveRoleSignal(normalized);
    setCurrentRoleIdSignal(targetId);

    if (targetRole && normalized === 'student' && targetRole.roleable_id) {
        setActiveStudent(targetRole.roleable_id, targetRole.code, isSession);
    }
    if (targetRole?.unit_id) {
        setStorageItem('unit_id', targetRole.unit_id, isSession);
    }
}

export async function processLoginSuccess(loginResponse: any, isSession: boolean = false): Promise<string> {
    const user = loginResponse.user || {};
    if (!user.individual_id && loginResponse.data?.individual_id) {
        user.individual_id = loginResponse.data.individual_id;
    }
    if (!user.individual_id && getStorageItem('individual_id')) {
        user.individual_id = getStorageItem('individual_id');
    }
    let roles: UserRoleItem[] = [];

    // 1. Check if roles were provided directly with user or loginResponse
    if (Array.isArray(user.roles) && user.roles.length > 0) {
        roles = user.roles;
    } else if (Array.isArray(loginResponse.roles) && loginResponse.roles.length > 0) {
        roles = loginResponse.roles;
    }

    // 2. Fetch roles from API if not embedded
    if (roles.length === 0 && user.id) {
        try {
            const roleRes = await GetUserRoles(user.id);
            if (roleRes.code === 200 && roleRes.data) {
                if (Array.isArray(roleRes.data)) {
                    roles = roleRes.data;
                } else if (roleRes.data.data && Array.isArray(roleRes.data.data)) {
                    roles = roleRes.data.data;
                }
            }
        } catch (e) {
            console.warn('Failed to fetch user roles dynamically:', e);
        }
    }

    // 3. Fallback only if NO roles found from backend (Least privilege: never assign administrator by default!)
    if (roles.length === 0) {
        const email = (user.email || '').toLowerCase();
        if (email.includes('admin') || email.includes('superadmin')) {
            roles = [
                { id: '1', name: 'administrator' }
            ];
        } else if (email.includes('course') || email.includes('dept') || email.includes('prodi') || email.includes('jurusan')) {
            roles = [
                { id: '1', name: 'course_department' }
            ];
        } else if (email.includes('lecturer') || email.includes('dosen')) {
            roles = [
                { id: '1', name: 'lecturer' }
            ];
        } else if (email.includes('candidate') || email.includes('pmb') || email.includes('camaba') || email.includes('kandidat')) {
            roles = [
                { id: '1', name: 'candidate' }
            ];
        } else if (email.includes('rector') || email.includes('rektor') || email.includes('yayasan')) {
            roles = [
                { id: '1', name: 'rectorat' }
            ];
        } else {
            // Default to student for standard accounts (safe least-privilege)
            roles = [
                { id: '1', name: 'student' }
            ];
        }
    }

    setStorageItem('roles', JSON.stringify(roles), isSession);

    // 4. Determine active role
    let activeRole = '';
    let currentRoleId = '';
    let activeRoleItem: UserRoleItem | undefined;
    if (user.current_role_id) {
        const found = roles.find(r => r.id === user.current_role_id);
        if (found) {
            activeRole = normalizeRoleName(found.name, found);
            currentRoleId = found.id;
            activeRoleItem = found;
        }
    }
    if (!activeRole || activeRole === 'guest') {
        const firstRole = roles[0];
        activeRole = normalizeRoleName(firstRole?.name || 'student', firstRole);
        currentRoleId = firstRole?.id || activeRole;
        activeRoleItem = firstRole;
    }

    setStorageItem('active_role', activeRole, isSession);
    setStorageItem('current_role', currentRoleId, isSession);

    // 5. Update global reactive signals
    refreshAuthState();

    if (activeRole === 'student' && !user.individual_id && !getStorageItem('individual_id')) {
        try {
            const curUserRes = await GetCurrentUser();
            if (curUserRes.code === 200 && curUserRes.data?.individual_id) {
                user.individual_id = curUserRes.data.individual_id;
                setStorageItem('individual_id', user.individual_id, isSession);
                refreshAuthState();
            }
        } catch {
            // Ignore
        }
    }

    if (
        (activeRole === 'course_department' || isStaffProgramStudi(activeRoleItem)) &&
        activeRoleItem?.roleable_id &&
        (activeRoleItem.roleable_type?.includes('Staff') || !activeRoleItem.unit_id)
    ) {
        try {
            const staffRes = await masterApiShow<any>('institution/master/staffes', activeRoleItem.roleable_id);
            if (staffRes.data?.unit_id) {
                activeRoleItem.unit_id = staffRes.data.unit_id;
                setStorageItem('unit_id', staffRes.data.unit_id, isSession);
                const roleIdx = roles.findIndex(r => r.id === activeRoleItem?.id);
                if (roleIdx !== -1) {
                    roles[roleIdx] = { ...roles[roleIdx], unit_id: staffRes.data.unit_id };
                    setStorageItem('roles', JSON.stringify(roles), isSession);
                    setUserRolesSignal(roles);
                }
            }
        } catch (e) {
            console.warn('Failed to resolve staff unit_id on login:', e);
        }
    }

    return getDashboardPathForRole(activeRole, activeRoleItem, user);
}

export function logout(): void {
    apiLogoutUser();
    removeStorageItem('active_role');
    refreshAuthState();
}

export interface RouteAccessResult {
    allowed: boolean;
    redirectTo?: string;
    switchRole?: UserRoleItem;
    reason?: 'unauthenticated' | 'unauthorized' | 'role_mismatch';
}

export const ROLE_ROUTE_PREFIXES: { prefix: string; role: string }[] = [
    { prefix: '/administrator', role: 'administrator' },
    { prefix: '/course-department', role: 'course_department' },
    { prefix: '/student', role: 'student' },
    { prefix: '/lecturer', role: 'lecturer' },
    { prefix: '/candidate', role: 'candidate' },
];

export function getRequiredRoleForPath(pathname: string): string | null {
    const cleanPath = pathname.split('?')[0].split('#')[0];
    const matched = ROLE_ROUTE_PREFIXES.find(item => cleanPath === item.prefix || cleanPath.startsWith(`${item.prefix}/`));
    return matched ? matched.role : null;
}

export function canAccessRoute(pathname: string): RouteAccessResult {
    const requiredRole = getRequiredRoleForPath(pathname);

    // If path does not require any specific role (e.g. /, /authentification/*, /404), allow it
    if (!requiredRole) {
        return { allowed: true };
    }

    // If path requires a role but user is not authenticated
    if (!isAuthenticated()) {
        const cleanPath = pathname.split('#')[0];
        const returnUrl = encodeURIComponent(cleanPath);
        return {
            allowed: false,
            redirectTo: `/authentification/login?return_url=${returnUrl}`,
            reason: 'unauthenticated',
        };
    }

    const activeRole = getActiveRole();
    const storedRoles = getStoredRoles();

    // Administrator role has elevated bypass access across all areas
    const isAdmin = activeRole === 'administrator' || storedRoles.some(r => normalizeRoleName(r.name, r) === 'administrator');
    if (isAdmin) {
        return { allowed: true };
    }

    // If active role matches the required role, access is granted
    if (activeRole === requiredRole) {
        return { allowed: true };
    }

    // Check if the user has this role assigned in their roles list (e.g., multi-role user)
    const matchingRoleItem = storedRoles.find(r => normalizeRoleName(r.name, r) === requiredRole);
    if (matchingRoleItem) {
        return {
            allowed: true,
            switchRole: matchingRoleItem,
        };
    }

    // User is authenticated but does not possess the required role (e.g. student visiting /course-department/...)
    const safeDashboard = getDashboardPathForRole(activeRole);
    return {
        allowed: false,
        redirectTo: safeDashboard,
        reason: 'unauthorized',
    };
}

