import { createSignal } from 'solid-js';
import { getStorageItem, setStorageItem, removeStorageItem } from './storage';
import { GetUserRoles, LogoutUser as apiLogoutUser } from '../controllers/auth/AuthUser';

export interface UserRoleItem {
    id: string;
    name: string;
    user_id?: string;
    position_type_id?: string;
    roleable_id?: string;
    roleable_type?: string;
}

export interface StoredUser {
    id?: string;
    pid?: string;
    name?: string;
    email?: string;
    current_role_id?: string;
    is_active?: boolean;
    roles?: UserRoleItem[];
}

export function normalizeRoleName(rawRole: string | null | undefined): string {
    if (!rawRole) return 'guest';
    const lower = rawRole.toLowerCase().trim().replace(/[-\s]+/g, '_');
    if (lower === 'admin' || lower === 'administrator' || lower.includes('admin')) {
        return 'administrator';
    }
    if (lower === 'course_department' || lower === 'coursedepartment' || lower === 'department' || lower === 'prodi' || lower === 'jurusan' || lower === 'kajur' || lower === 'kaprodi') {
        return 'course_department';
    }
    if (lower === 'student' || lower === 'mahasiswa' || lower === 'mhs') {
        return 'student';
    }
    if (lower === 'candidate' || lower === 'calon_mahasiswa' || lower === 'camaba' || lower === 'pmb' || lower === 'applicant') {
        return 'candidate';
    }
    if (lower === 'rectorat' || lower === 'rektorat' || lower === 'rector' || lower === 'pimpinan') {
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
            return '/dashboard/administrator';
        case 'course_department':
            return '/dashboard/course_department';
        case 'student':
            return '/dashboard/student';
        case 'candidate':
            return '/dashboard/candidate';
        case 'rectorat':
            return '/dashboard/rectorat';
        default:
            return '/dashboard/user';
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
        if (['administrator', 'course_department', 'student', 'candidate', 'rectorat', 'user', 'admin'].includes(currentRole.toLowerCase())) {
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
        if (emailLower.includes('admin')) return 'administrator';
        if (emailLower.includes('dept') || emailLower.includes('prodi') || emailLower.includes('course')) return 'course_department';
        if (emailLower.includes('student') || emailLower.includes('mhs')) return 'student';
        if (emailLower.includes('candidate') || emailLower.includes('pmb')) return 'candidate';
    }
    return 'administrator';
}

// Reactive Signals for global SolidJS state
// Initial state is SSR-safe default values so the initial client hydration pass matches the server DOM.
// Client auth state from localStorage/sessionStorage is synchronized on client mount via refreshAuthState().
const [currentUserSignal, setCurrentUserSignal] = createSignal<StoredUser | null>(null);
const [userRolesSignal, setUserRolesSignal] = createSignal<UserRoleItem[]>([]);
const [activeRoleSignal, setActiveRoleSignal] = createSignal<string>('administrator');
const [isAuthenticatedSignal, setIsAuthenticatedSignal] = createSignal<boolean>(false);

export {
    currentUserSignal,
    userRolesSignal,
    activeRoleSignal,
    isAuthenticatedSignal
};

export function refreshAuthState(): void {
    const user = getStoredUser();
    const roles = getStoredRoles();
    const active = getActiveRole();
    const token = getStorageItem('token');
    setCurrentUserSignal(user);
    setUserRolesSignal(roles);
    setActiveRoleSignal(active);
    setIsAuthenticatedSignal(Boolean(token && token !== 'undefined' && token !== ''));
}

export function setActiveRole(roleNameOrId: string, isSession: boolean = false): void {
    const roles = getStoredRoles();
    let targetName = roleNameOrId;
    let targetId = roleNameOrId;

    const matchedById = roles.find(r => r.id === roleNameOrId);
    if (matchedById) {
        targetName = matchedById.name;
        targetId = matchedById.id;
    } else {
        const matchedByName = roles.find(r => normalizeRoleName(r.name) === normalizeRoleName(roleNameOrId));
        if (matchedByName) {
            targetName = matchedByName.name;
            targetId = matchedByName.id;
        }
    }

    const normalized = normalizeRoleName(targetName);
    setStorageItem('active_role', normalized, isSession);
    setStorageItem('current_role', targetId, isSession);
    setActiveRoleSignal(normalized);
}

export async function processLoginSuccess(loginResponse: any, isSession: boolean = false): Promise<string> {
    const user = loginResponse.user || {};
    let roles: UserRoleItem[] = [];

    // 1. Check if roles were provided directly with user
    if (Array.isArray(user.roles)) {
        roles = user.roles;
    } else if (Array.isArray(loginResponse.roles)) {
        roles = loginResponse.roles;
    }

    // 2. Fetch roles from API if not embedded
    if (roles.length === 0) {
        try {
            const roleRes = await GetUserRoles();
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

    // 3. If roles are still empty, derive default roles based on user credentials/profile
    if (roles.length === 0) {
        const email = (user.email || '').toLowerCase();
        if (email.includes('course') || email.includes('dept') || email.includes('prodi')) {
            roles = [
                { id: '1', name: 'course_department' },
                { id: '2', name: 'administrator' }
            ];
        } else if (email.includes('student') || email.includes('mhs')) {
            roles = [
                { id: '1', name: 'student' }
            ];
        } else if (email.includes('candidate') || email.includes('pmb') || email.includes('camaba')) {
            roles = [
                { id: '1', name: 'candidate' }
            ];
        } else if (email.includes('rector') || email.includes('rektor')) {
            roles = [
                { id: '1', name: 'rectorat' },
                { id: '2', name: 'administrator' }
            ];
        } else {
            // Default multi-role administrative capabilities
            roles = [
                { id: '1', name: 'administrator' },
                { id: '2', name: 'course_department' },
                { id: '3', name: 'student' },
                { id: '4', name: 'candidate' }
            ];
        }
    }

    setStorageItem('roles', JSON.stringify(roles), isSession);

    // 4. Determine active role
    let activeRole = 'administrator';
    if (user.current_role_id) {
        const found = roles.find(r => r.id === user.current_role_id);
        if (found) {
            activeRole = normalizeRoleName(found.name);
        }
    }
    if (!activeRole || activeRole === 'guest') {
        activeRole = normalizeRoleName(roles[0]?.name || 'administrator');
    }

    setStorageItem('active_role', activeRole, isSession);
    setStorageItem('current_role', roles[0]?.id || activeRole, isSession);

    // 5. Update global reactive signals
    refreshAuthState();

    return getDashboardPathForRole(activeRole);
}

export function logout(): void {
    apiLogoutUser();
    removeStorageItem('active_role');
    refreshAuthState();
}
