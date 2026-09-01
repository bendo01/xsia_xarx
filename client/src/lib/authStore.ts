import { createSignal } from 'solid-js';
import { getStorageItem, setStorageItem, removeStorageItem } from './storage';
import { GetUserRoles, LogoutUser as apiLogoutUser } from '../controllers/auth/AuthUser';
import { getStudentById } from '../controllers/academic/student/master/AcademicStudentMasterStudentController';

export interface UserRoleItem {
    id: string;
    name: string;
    user_id?: string;
    position_type_id?: string;
    roleable_id?: string;
    roleable_type?: string;
    code?: string;
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
}

export function normalizeRoleName(rawRole: string | null | undefined): string {
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
    if (lower.includes('prodi') || lower.includes('jurusan') || lower.includes('kajur') || lower.includes('kaprodi') || lower.includes('department') || lower.includes('course') || lower.includes('baak')) {
        return 'course_department';
    }
    if (lower.includes('rektor') || lower.includes('rector') || lower.includes('yayasan') || lower.includes('pimpinan')) {
        return 'rectorat';
    }
    if (lower === 'user' || lower === 'staff') {
        return 'user';
    }
    return lower;
}

export function getRoleDisplayName(roleName: string): string {
    const norm = normalizeRoleName(roleName);
    switch (norm) {
        case 'administrator':
            return 'Administrator';
        case 'course_department':
            return 'Course & Department';
        case 'student':
            return 'Student';
        case 'lecturer':
            return 'Lecturer';
        case 'candidate':
            return 'Candidate / PMB';
        case 'rectorat':
            return 'Rectorat';
        case 'user':
            return 'Standard User';
        case 'guest':
            return 'Guest';
        default:
            return roleName.charAt(0).toUpperCase() + roleName.slice(1);
    }
}

export function getDashboardPathForRole(roleName: string): string {
    const norm = normalizeRoleName(roleName);
    switch (norm) {
        case 'administrator':
            return '/administrator/person/master/individual';
        case 'course_department':
            return '/course-department/academic/course/master/course';
        case 'student':
            return '/student/person/master/individual/show';
        case 'lecturer':
            return '/lecturer/academic/campaign/activity';
        case 'candidate':
            return '/candidate/academic/candidate/master/candidate';
        case 'rectorat':
            return '/dashboard/rectorat';
        default:
            return '/student/person/master/individual/show';
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
        return r;
    }));

    if (changed) {
        setStorageItem('roles', JSON.stringify(updatedRoles));
        setUserRolesSignal(updatedRoles);
        const currentRole = updatedRoles.find(r => r.id === getStorageItem('current_role') || (getActiveStudentId() && r.roleable_id === getActiveStudentId()));
        if (currentRole?.code && !getActiveStudentCode()) {
            setActiveStudent(currentRole.roleable_id || getActiveStudentId(), currentRole.code);
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
}

export async function processLoginSuccess(loginResponse: any, isSession: boolean = false): Promise<string> {
    const user = loginResponse.user || {};
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
    if (user.current_role_id) {
        const found = roles.find(r => r.id === user.current_role_id);
        if (found) {
            activeRole = normalizeRoleName(found.name);
            currentRoleId = found.id;
        }
    }
    if (!activeRole || activeRole === 'guest') {
        const firstRole = roles[0];
        activeRole = normalizeRoleName(firstRole?.name || 'student');
        currentRoleId = firstRole?.id || activeRole;
    }

    setStorageItem('active_role', activeRole, isSession);
    setStorageItem('current_role', currentRoleId, isSession);

    // 5. Update global reactive signals
    refreshAuthState();

    return getDashboardPathForRole(activeRole);
}

export function logout(): void {
    apiLogoutUser();
    removeStorageItem('active_role');
    refreshAuthState();
}
