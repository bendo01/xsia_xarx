import { createSignal } from 'solid-js';
export { getStorageItem, setStorageItem, removeStorageItem } from './storage';
import { getStorageItem, setStorageItem, removeStorageItem } from './storage';
import { GetUserRoles, GetCurrentUser, ChangeUserRole, LogoutUser as apiLogoutUser } from '../controllers/auth/AuthUser';
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
    institution_id?: string;
    institution_name?: string;
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

    // Specific rectorat keywords before generic admin keyword to avoid "biro_administrasi" or "dekan" etc. being caught
    if (
        lower.includes('rektor') ||
        lower.includes('rector') ||
        lower.includes('dekan') ||
        lower.includes('decan') ||
        lower.includes('fakultas') ||
        lower.includes('yayasan') ||
        lower.includes('pimpinan') ||
        lower.includes('biro_administrasi') ||
        lower.includes('pdpt') ||
        lower.includes('pengembangan_teknologi_informasi') ||
        lower.includes('sekertaris_rektor') ||
        lower.includes('sekretaris_rektor') ||
        lower.includes('lpti') ||
        lower.includes('bauk')
    ) {
        return 'rectorat';
    }

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
        lower.includes('program_studi') ||
        lower.includes('programstudi') ||
        lower.includes('kepala_program_studi') ||
        lower.includes('sekertaris_program_studi') ||
        lower.includes('sekretaris_program_studi') ||
        lower.includes('staff_program_studi') ||
        lower.includes('staf_program_studi')
    ) {
        return 'course_department';
    }
    if (lower === 'user' || lower === 'staff') {
        if (isStaffProgramStudi(rawRole)) {
            return 'course_department';
        }
        return 'user';
    }
    return lower;
}

export function getRoleDisplayName(roleName: string, roleItem?: UserRoleItem | null): string {
    const norm = normalizeRoleName(roleName, roleItem);
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
        return uId ? `/course-department/institution/master/unit/${uId}` : '/course-department/institution/master/unit/[id]';
    }
    const norm = normalizeRoleName(roleName, roleItem);
    switch (norm) {
        case 'administrator':
            return '/administrator/person/master/individual';
        case 'course_department': {
            const uId = resolveRoleItemUnitId(roleItem);
            return uId ? `/course-department/institution/master/unit/${uId}` : '/course-department/institution/master/unit/[id]';
        }
        case 'student':
            return indId ? `/student/person/master/individual/${indId}` : '/student/person/master/individual/[id]';
        case 'lecturer':
            return indId ? `/lecturer/person/master/individual/${indId}/show` : '/lecturer/person/master/individual/[id]/show';
        case 'candidate':
            return '/candidate/academic/candidate/master/candidate';
        case 'rectorat': {
            // Prefer dynamically resolved institution_id stored on roleItem,
            // then fall back to activeInstitutionIdSignal or storage, then env var or university default.
            const instId =
                roleItem?.institution_id ||
                activeInstitutionIdSignal() ||
                getStorageItem('institution_id') ||
                (import.meta as any).env?.CURRENT_INSTITUTION_ID ||
                import.meta.env.VITE_INSTITUTION_ID ||
                'ed7e8c02-451b-4548-aa81-26b8d0b7fdec';
            return `/rectorat/institution/${instId}`;
        }
        default:
            if (isStaffProgramStudi(roleName, targetUser)) {
                const uId = resolveRoleItemUnitId(roleItem);
                return uId ? `/course-department/institution/master/unit/${uId}` : '/course-department/institution/master/unit/[id]';
            }
            return indId ? `/student/person/master/individual/${indId}` : '/student/person/master/individual/[id]';
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
const [activeInstitutionIdSignal, setActiveInstitutionIdSignal] = createSignal<string>('');
const [activeInstitutionNameSignal, setActiveInstitutionNameSignal] = createSignal<string>(getStorageItem('institution_name') || '');
const [isAuthenticatedSignal, setIsAuthenticatedSignal] = createSignal<boolean>(false);
const [activeStudentIdSignal, setActiveStudentIdSignal] = createSignal<string>('');
const [activeStudentCodeSignal, setActiveStudentCodeSignal] = createSignal<string>('');

export {
    currentUserSignal,
    setCurrentUserSignal,
    userRolesSignal,
    setUserRolesSignal,
    activeRoleSignal,
    setActiveRoleSignal,
    currentRoleIdSignal,
    setCurrentRoleIdSignal,
    activeInstitutionIdSignal,
    setActiveInstitutionIdSignal,
    activeInstitutionNameSignal,
    setActiveInstitutionNameSignal,
    isAuthenticatedSignal,
    setIsAuthenticatedSignal,
    activeStudentIdSignal,
    setActiveStudentIdSignal,
    activeStudentCodeSignal,
    setActiveStudentCodeSignal
};

export function getActiveInstitutionId(): string {
    return activeInstitutionIdSignal() || getStorageItem('institution_id') || '';
}

export function getActiveInstitutionName(): string {
    return activeInstitutionNameSignal() || getStorageItem('institution_name') || '';
}

export function setActiveInstitution(institutionId: string, isSession: boolean = false, institutionName?: string): void {
    if (institutionId && institutionId !== '00000000-0000-0000-0000-000000000000') {
        setStorageItem('institution_id', institutionId, isSession);
        setActiveInstitutionIdSignal(institutionId);
    }
    if (institutionName) {
        setStorageItem('institution_name', institutionName, isSession);
        setActiveInstitutionNameSignal(institutionName);
        if (institutionId) institutionCache[institutionId] = institutionName;
    } else if (institutionId && institutionCache[institutionId]) {
        const cached = institutionCache[institutionId];
        setStorageItem('institution_name', cached, isSession);
        setActiveInstitutionNameSignal(cached);
    } else if (institutionId && institutionId !== '00000000-0000-0000-0000-000000000000') {
        lookupInstitutionName(institutionId).then((name) => {
            if (name) {
                setStorageItem('institution_name', name, isSession);
                setActiveInstitutionNameSignal(name);
            }
        });
    }
}

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

export const institutionCache: Record<string, string> = {
    'ed7e8c02-451b-4548-aa81-26b8d0b7fdec': 'Institut Teknologi dan Kesehatan Tri Tunas Nasional'
};

export async function lookupInstitutionName(instId?: string): Promise<string> {
    if (!instId || instId === '00000000-0000-0000-0000-000000000000') return '';
    if (institutionCache[instId]) return institutionCache[instId];
    try {
        const res = await masterApiShow<any>('institution/master/institutions', instId);
        const name = res?.data?.name || res?.data?.institution?.name || '';
        if (name) {
            institutionCache[instId] = name;
            return name;
        }
    } catch {}
    return '';
}

export async function enrichUserRolesWithStudentCodes(): Promise<UserRoleItem[]> {
    const roles = getStoredRoles();
    if (roles.length === 0) return [];
    let changed = false;
    const updatedRoles = await Promise.all(roles.map(async (r) => {
        let enrichedRole = { ...r };
        let roleChanged = false;

        // 1. Student code and unit/institution enrichment
        if ((normalizeRoleName(r.name) === 'student' || r.roleable_type?.includes('Student')) && r.roleable_id) {
            try {
                if (!enrichedRole.code || !enrichedRole.unit_id) {
                    const std = await getStudentById(r.roleable_id);
                    if (std?.code && !enrichedRole.code) {
                        enrichedRole.code = std.code;
                        roleChanged = true;
                    }
                    if (std?.unit_id && !enrichedRole.unit_id) {
                        enrichedRole.unit_id = std.unit_id;
                        roleChanged = true;
                    }
                }
                if (enrichedRole.unit_id && !enrichedRole.institution_name) {
                    const unitRes = await masterApiShow<any>('institution/master/units', enrichedRole.unit_id);
                    const instName = unitRes.data?.institution?.name || unitRes.data?.institution_name;
                    const instId = unitRes.data?.institution_id || unitRes.data?.institution?.id;
                    if (instId && !enrichedRole.institution_id) {
                        enrichedRole.institution_id = instId;
                        roleChanged = true;
                    }
                    if (instName) {
                        enrichedRole.institution_name = instName;
                        if (instId) institutionCache[instId] = instName;
                        roleChanged = true;
                    }
                }
            } catch {
                // Ignore
            }
        }

        // 2. Staff institution & unit enrichment
        if (
            (normalizeRoleName(r.name, r) === 'rectorat' || normalizeRoleName(r.name, r) === 'course_department' || isStaffProgramStudi(r) || r.roleable_type?.includes('Staff')) &&
            r.roleable_id &&
            (!enrichedRole.unit_id || !enrichedRole.institution_id || !enrichedRole.institution_name)
        ) {
            try {
                const staffRes = await masterApiShow<any>('institution/master/staffes', r.roleable_id);
                if (staffRes.data?.unit_id) {
                    if (!enrichedRole.unit_id) {
                        enrichedRole.unit_id = staffRes.data.unit_id;
                        roleChanged = true;
                    }
                    try {
                        const unitRes = await masterApiShow<any>('institution/master/units', staffRes.data.unit_id);
                        const instId = unitRes.data?.institution_id || unitRes.data?.institution?.id;
                        const instName = unitRes.data?.institution?.name || unitRes.data?.institution_name;
                        if (instId && !enrichedRole.institution_id) {
                            enrichedRole.institution_id = instId;
                            roleChanged = true;
                        }
                        if (instName && !enrichedRole.institution_name) {
                            enrichedRole.institution_name = instName;
                            roleChanged = true;
                        }
                    } catch {}
                }
                if (!enrichedRole.institution_name && staffRes.data?.employee_id) {
                    try {
                        const empRes = await masterApiShow<any>('institution/master/employees', staffRes.data.employee_id);
                        const instId = empRes.data?.institution_id || empRes.data?.institution?.id;
                        const instName = empRes.data?.institution?.name || empRes.data?.institution_name;
                        if (instId && !enrichedRole.institution_id) {
                            enrichedRole.institution_id = instId;
                            roleChanged = true;
                        }
                        if (instName && !enrichedRole.institution_name) {
                            enrichedRole.institution_name = instName;
                            roleChanged = true;
                        }
                    } catch {}
                }
            } catch {
                // Ignore
            }
        }

        // 3. Lecturer institution enrichment
        if ((normalizeRoleName(r.name) === 'lecturer' || r.roleable_type?.includes('Lecturer')) && r.roleable_id && (!enrichedRole.institution_id || !enrichedRole.institution_name)) {
            try {
                const lecRes = await masterApiShow<any>('academic/lecturer/master/lecturers', r.roleable_id);
                const instId = lecRes.data?.institution_id;
                if (instId && !enrichedRole.institution_id) {
                    enrichedRole.institution_id = instId;
                    roleChanged = true;
                }
            } catch {}
        }

        // 4. Candidate institution enrichment
        if ((normalizeRoleName(r.name) === 'candidate' || r.roleable_type?.includes('Candidate')) && r.roleable_id && (!enrichedRole.institution_id || !enrichedRole.institution_name)) {
            try {
                const candRes = await masterApiShow<any>('academic/candidate/master/candidates', r.roleable_id);
                const instId = candRes.data?.institution_id;
                if (instId && !enrichedRole.institution_id) {
                    enrichedRole.institution_id = instId;
                    roleChanged = true;
                }
            } catch {}
        }

        // 5. Look up institution name if institution_id is known
        if (enrichedRole.institution_id && !enrichedRole.institution_name) {
            try {
                const instName = await lookupInstitutionName(enrichedRole.institution_id);
                if (instName) {
                    enrichedRole.institution_name = instName;
                    roleChanged = true;
                }
            } catch {}
        }

        // 6. Fallback to default institution if still no institution_name and not staff with different unit
        if (!enrichedRole.institution_name && !r.roleable_type?.includes('Staff')) {
            const defaultId = (import.meta as any).env?.CURRENT_INSTITUTION_ID || 'ed7e8c02-451b-4548-aa81-26b8d0b7fdec';
            if (defaultId) {
                try {
                    const instName = await lookupInstitutionName(defaultId);
                    if (instName) {
                        enrichedRole.institution_name = instName;
                        if (!enrichedRole.institution_id) enrichedRole.institution_id = defaultId;
                        roleChanged = true;
                    }
                } catch {}
            }
        }

        if (roleChanged) {
            changed = true;
            return enrichedRole;
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
        if (currentRole?.institution_id || currentRole?.institution_name) {
            setActiveInstitution(currentRole.institution_id || '', false, currentRole.institution_name);
        }
    } else {
        const activeCurrent = updatedRoles.find(r => r.id === (currentRoleIdSignal() || getStorageItem('current_role')) || (getActiveStudentId() && r.roleable_id === getActiveStudentId()));
        if (activeCurrent && (activeCurrent.institution_id || activeCurrent.institution_name) && !activeInstitutionNameSignal()) {
            setActiveInstitution(activeCurrent.institution_id || '', false, activeCurrent.institution_name);
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
    const instId = getStorageItem('institution_id') || '';
    const instName = getStorageItem('institution_name') || '';
    setCurrentUserSignal(user);
    setUserRolesSignal(roles);
    setActiveRoleSignal(active);
    setCurrentRoleIdSignal(currentRoleId);
    setActiveInstitutionIdSignal(instId);
    setActiveInstitutionNameSignal(instName);
    setActiveStudentIdSignal(studentId);
    setActiveStudentCodeSignal(studentCode);
    setIsAuthenticatedSignal(Boolean(token && token !== 'undefined' && token !== ''));
}

export function setActiveRole(roleNameOrId: string, isSession: boolean = false): void {
    const signalRoles = userRolesSignal();
    const storedRoles = getStoredRoles();
    const roles = signalRoles.length > 0 ? signalRoles : storedRoles;
    let targetName = roleNameOrId;
    let targetId = roleNameOrId;
    let targetRole: UserRoleItem | undefined;

    const matchedById = roles.find(r => r.id === roleNameOrId);
    if (matchedById) {
        targetName = matchedById.name;
        targetId = matchedById.id;
        targetRole = matchedById;
    } else {
        const queryLower = roleNameOrId.toLowerCase().trim();
        const queryClean = queryLower.replace(/[-\s_]+/g, '');

        // 1. Exact name match
        let found = roles.find(r => r.name.toLowerCase().trim() === queryLower);
        // 2. Clean name match (ignoring whitespace and dashes)
        if (!found) {
            found = roles.find(r => r.name.toLowerCase().replace(/[-\s_]+/g, '') === queryClean);
        }
        // 3. Keyword match for LPTI / Dekan / Rektor etc.
        if (!found) {
            if (queryClean.includes('lpti')) {
                found = roles.find(r => r.name.toLowerCase().includes('lpti'));
            } else if (queryClean.includes('dekan') || queryClean.includes('fakultas')) {
                found = roles.find(r => r.name.toLowerCase().includes('dekan') || r.name.toLowerCase().includes('fakultas'));
            } else if (queryClean.includes('rektor')) {
                found = roles.find(r => r.name.toLowerCase().includes('rektor'));
            }
        }
        // 4. Role category match (only if matches exactly one role)
        if (!found) {
            const categoryMatches = roles.filter(r => normalizeRoleName(r.name, r) === normalizeRoleName(roleNameOrId));
            if (categoryMatches.length === 1) {
                found = categoryMatches[0];
            }
        }

        if (found) {
            targetName = found.name;
            targetId = found.id;
            targetRole = found;
        }
    }

    const normalized = normalizeRoleName(targetName, targetRole);
    setStorageItem('active_role', normalized, isSession);
    setStorageItem('current_role', targetId, isSession);
    setActiveRoleSignal(normalized);
    setCurrentRoleIdSignal(targetId);

    // Sync active institution for ANY targetRole with institution details
    if (targetRole?.institution_id || targetRole?.institution_name) {
        setActiveInstitution(targetRole.institution_id || '', isSession, targetRole.institution_name);
    }

    // Sync stored user with current_role_id
    const curUser = getStoredUser();
    if (curUser) {
        curUser.current_role_id = targetId;
        setStorageItem('user', JSON.stringify(curUser), isSession);
        setStorageItem('current_user', JSON.stringify(curUser), isSession);
        setCurrentUserSignal(curUser);
    }

    // Persist current_role_id to the database via API
    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(targetId);
    if (isUuid && isAuthenticated()) {
        ChangeUserRole(targetId).then((res) => {
            if (res.code === 200 && res.data) {
                setCurrentUserSignal(res.data);
                if (res.data.roles && Array.isArray(res.data.roles)) {
                    const currentRoles = userRolesSignal().length > 0 ? userRolesSignal() : getStoredRoles();
                    const merged = res.data.roles.map((r: any) => {
                        const prev = currentRoles.find((p: any) => p.id === r.id);
                        return {
                            ...r,
                            code: r.code || prev?.code,
                            unit_id: r.unit_id || prev?.unit_id,
                            institution_id: r.institution_id || prev?.institution_id,
                            institution_name: r.institution_name || prev?.institution_name,
                        };
                    });
                    setUserRolesSignal(merged);
                    setStorageItem('roles', JSON.stringify(merged), isSession);
                }
            }
        }).catch((err) => {
            console.warn('Failed to persist current_role_id to server:', err);
        });
    }

    if (targetRole && normalized === 'student' && targetRole.roleable_id) {
        setActiveStudent(targetRole.roleable_id, targetRole.code, isSession);
    }
    if (targetRole?.unit_id) {
        setStorageItem('unit_id', targetRole.unit_id, isSession);
    }

    // For rectorat roles: ensure valid institution_id in storage and resolve details
    if (normalized === 'rectorat') {
        if (targetRole?.institution_id) {
            setActiveInstitution(targetRole.institution_id, isSession);
        } else if (targetRole?.roleable_id && targetRole.roleable_type?.includes('Staff')) {
            (async () => {
                try {
                    const staffRes = await masterApiShow<any>('institution/master/staffes', targetRole!.roleable_id!);
                    let instId: string | undefined;
                    if (staffRes.data?.unit_id) {
                        try {
                            const unitRes = await masterApiShow<any>('institution/master/units', staffRes.data.unit_id);
                            instId = unitRes.data?.institution_id || unitRes.data?.institution?.id;
                        } catch {}
                    }
                    if (!instId && staffRes.data?.employee_id) {
                        try {
                            const employeeRes = await masterApiShow<any>('institution/master/employees', staffRes.data.employee_id);
                            instId = employeeRes.data?.institution_id || employeeRes.data?.institution?.id;
                        } catch {}
                    }
                    if (instId) {
                        setActiveInstitution(instId, isSession);
                        const storedRoles = getStoredRoles();
                        const roleIdx = storedRoles.findIndex(r => r.id === targetRole!.id);
                        if (roleIdx !== -1) {
                            storedRoles[roleIdx] = { ...storedRoles[roleIdx], institution_id: instId };
                            setStorageItem('roles', JSON.stringify(storedRoles), isSession);
                            setUserRolesSignal(storedRoles);
                        }
                    }
                } catch (e) {
                    console.warn('Failed to resolve institution_id for rectorat role switch:', e);
                }
            })();
        }
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

    // Resolve institution_id for rectorat roles via staff → employee chain
    if (
        activeRole === 'rectorat' &&
        activeRoleItem?.roleable_id &&
        activeRoleItem.roleable_type?.includes('Staff') &&
        !activeRoleItem.institution_id
    ) {
        try {
            const staffRes = await masterApiShow<any>('institution/master/staffes', activeRoleItem.roleable_id);
            let institutionId: string | undefined;
            if (staffRes.data?.unit_id) {
                try {
                    const unitRes = await masterApiShow<any>('institution/master/units', staffRes.data.unit_id);
                    institutionId = unitRes.data?.institution_id || unitRes.data?.institution?.id;
                } catch {}
            }
            if (!institutionId && staffRes.data?.employee_id) {
                try {
                    const employeeRes = await masterApiShow<any>('institution/master/employees', staffRes.data.employee_id);
                    institutionId = employeeRes.data?.institution_id || employeeRes.data?.institution?.id;
                } catch {}
            }
            if (institutionId) {
                const instName = institutionCache[institutionId] || '';
                activeRoleItem.institution_id = institutionId;
                if (instName) activeRoleItem.institution_name = instName;
                setActiveInstitution(institutionId, isSession, instName);
                const roleIdx = roles.findIndex(r => r.id === activeRoleItem?.id);
                if (roleIdx !== -1) {
                    roles[roleIdx] = { ...roles[roleIdx], institution_id: institutionId, ...(instName ? { institution_name: instName } : {}) };
                    setStorageItem('roles', JSON.stringify(roles), isSession);
                    setUserRolesSignal(roles);
                }
            }
        } catch (e) {
            console.warn('Failed to resolve institution_id for rectorat role on login:', e);
        }
    }

    return getDashboardPathForRole(activeRole, activeRoleItem, user);
}

export function logout(): void {
    apiLogoutUser();
    removeStorageItem('active_role');
    removeStorageItem('institution_id');
    removeStorageItem('institution_name');
    setActiveInstitutionIdSignal('');
    setActiveInstitutionNameSignal('');
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
    { prefix: '/rectorat', role: 'rectorat' },
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

    // Administrator role has elevated bypass access across all areas
    const isAdmin = activeRole === 'administrator' || storedRoles.some(r => normalizeRoleName(r.name, r) === 'administrator');
    if (isAdmin) {
        return { allowed: true };
    }

    // User is authenticated but does not possess the required role (e.g. student visiting /course-department/...)
    const safeDashboard = getDashboardPathForRole(activeRole);
    return {
        allowed: false,
        redirectTo: safeDashboard,
        reason: 'unauthorized',
    };
}

