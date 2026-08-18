import { Permission } from "./Permission";
import { Role } from "./Role";
import { InstitutionReferencePositionType } from "../institution/reference/PositionType";

export interface AuthLogin {
    email: string
    password: string
}

export interface AuthUser {
    id: string;
    code: string;
    name: string;
    email: string;
    created_at: string | null;
    updated_at: string | null;
    sync_at: string | null;
    deleted_at: string | null;
    created_by: string | null;
    updated_by: string | null;
}

export interface CurrentUser {
    user: {
        email: string | null;
        name: string | null;
        current_role_id: string | null;
    };
}

export interface User {
    email: string;
    name: string;
    current_role_id: string;
}

export const initialCurrentUser: CurrentUser = {
    user: {
        email: null,
        name: null,
        current_role_id: null,
    },
};

export interface UserWithRole {
    user: User;
    role: Role;
    permissions: Permission[];
    position_types: InstitutionReferencePositionType[];
}

export const initialUserWithRole: UserWithRole = {
    user: {
        email: "",
        name: "",
        current_role_id: "",
    },
    role: {
        id: "",
        name: "",
        user_id: "",
        position_type_id: "",
        roleable_id: "",
        roleable_type: "",
        created_at: "",
        updated_at: "",
        sync_at: null,
        deleted_at: null,
        created_by: "",
        updated_by: "",
    },
    permissions: [],
    position_types: [],
};

export interface UserClaim {
    email: string;
    password: string;
    student_code: string;
    individual_code: string;
}

export const initialUserClaim: UserClaim = {
    email: "",
    password: "",
    student_code: "",
    individual_code: "",
};

export interface ResetPassword {
    token: string;
    password: string;
}

export const initialResetPassword: ResetPassword = {
    token: "",
    password: "",
};


export const initialAuthUser: AuthUser = {
    id: "",
    code: "",
    name: "",
    email: "",
    created_at: null,
    updated_at: null,
    sync_at: null,
    deleted_at: null,
    created_by: null,
    updated_by: null,
};

export interface AuthUserDetail {
    user: AuthUser;
    role: Role | null;
    permissions: Permission[] | null;
    position_types: InstitutionReferencePositionType[] | null;
}
    