import { AuthLogin, AuthUser, initialAuthUser, ResetPassword, UserClaim, UserWithRole, AuthUserDetail } from "../../models/auth/User";
import { isKeyExists, removeStorageItem, setStorageItem, getStorageItem } from "../../lib/storage";
import { TypePaginationForm } from "../../lib/types";
import { ModelAuthUserPaginationResponse } from "../../models/pagination/ModelPagination";

const getBaseUrl = () => (import.meta.env.VITE_API_SERVER_URL ?? "http://127.0.0.1:5800/api/v1/").replace(/\/+$/, "");
const path = "user";

export async function LoginUser(credential: AuthLogin, isSession: boolean = false) {
    if (!credential.email || !credential.password) {
        return {
            code: 400,
            message: "Email dan kata sandi wajib diisi"
        };
    }

    try {
        const response = await fetch(`${getBaseUrl()}/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify({
                email: credential.email.trim(),
                password: credential.password
            }),
        });

        let data: any = {};
        try {
            data = await response.json();
        } catch {
            const text = await response.text();
            data = { message: text };
        }

        if (!response.ok) {
            const errorMessage =
                data?.message ||
                data?.brief ||
                data?.error?.brief ||
                data?.error?.message ||
                data?.error ||
                "Email atau kata sandi tidak valid";
            return {
                code: response.status || data.code || 401,
                message: typeof errorMessage === "string" ? errorMessage : JSON.stringify(errorMessage)
            };
        }

        if (data.token) {
            setStorageItem("token", data.token, isSession);
        }

        if (data.user) {
            setStorageItem("user", JSON.stringify(data.user), isSession);
            if (data.user.id) setStorageItem("id", String(data.user.id), isSession);
            if (data.user.pid) setStorageItem("pid", String(data.user.pid), isSession);
            if (data.user.name) setStorageItem("name", data.user.name, isSession);
            if (data.user.email) setStorageItem("email", data.user.email, isSession);
            if (data.user.is_active !== undefined) setStorageItem("is_verified", String(data.user.is_active), isSession);
            if (data.user.current_role_id) setStorageItem("current_role", String(data.user.current_role_id), isSession);
        }

        return {
            code: 200,
            message: "Login berhasil",
            token: data.token,
            user: data.user,
            data
        };
    } catch (error: any) {
        return {
            code: 500,
            message: error?.message || "Gagal terhubung ke server"
        };
    }
}

export async function LoginUserWithSession(credential: AuthLogin) {
    if (!credential.email || !credential.password) {
        return {
            code: 400,
            message: "Email dan kata sandi wajib diisi"
        };
    }

    try {
        const response = await fetch(`${getBaseUrl()}/login-with-session`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify({
                email: credential.email.trim(),
                password: credential.password
            }),
        });

        let data: any = {};
        try {
            data = await response.json();
        } catch {
            const text = await response.text();
            data = { message: text };
        }

        if (!response.ok) {
            const errorMessage =
                data?.message ||
                data?.brief ||
                data?.error?.brief ||
                data?.error?.message ||
                data?.error ||
                "Email atau kata sandi tidak valid";
            return {
                code: response.status || data.code || 401,
                message: typeof errorMessage === "string" ? errorMessage : JSON.stringify(errorMessage)
            };
        }

        if (data.session_id) {
            setStorageItem("session_id", data.session_id, true);
        }

        if (data.token) {
            setStorageItem("token", data.token, true);
        }

        if (data.user) {
            setStorageItem("user", JSON.stringify(data.user), true);
            if (data.user.id) setStorageItem("id", String(data.user.id), true);
            if (data.user.pid) setStorageItem("pid", String(data.user.pid), true);
            if (data.user.name) setStorageItem("name", data.user.name, true);
            if (data.user.email) setStorageItem("email", data.user.email, true);
            if (data.user.is_active !== undefined) setStorageItem("is_verified", String(data.user.is_active), true);
            if (data.user.current_role_id) setStorageItem("current_role", String(data.user.current_role_id), true);
        }

        return {
            code: 200,
            message: "Sesi login berhasil dimulai",
            session_id: data.session_id,
            token: data.token,
            user: data.user,
            data
        };
    } catch (error: any) {
        return {
            code: 500,
            message: error?.message || "Gagal terhubung ke server"
        };
    }
}

export async function GetUserRoles() {
    try {
        const response = await fetch(`${getBaseUrl()}/role`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: `Bearer ${getStorageItem("token")}`,
            },
        });
        const data = await response.json();

        if (!response.ok) {
            return {
                code: response.status || 500,
                message: data?.message || data?.brief || "Pengambilan Daftar Peran Pengguna Gagal"
            };
        }
        setStorageItem("roles", JSON.stringify(data));
        return {
            code: 200,
            message: "Get Role successful",
            data
        };
    } catch (error) {
        return {
            code: 500,
            message: "Gagal terhubung ke server"
        };
    }
}

export async function GetCurrentUser() {
    try {
        const response = await fetch(`${getBaseUrl()}/current`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: `Bearer ${getStorageItem("token")}`,
            },
        });
        const data = await response.json();

        if (!response.ok) {
            return {
                code: response.status || 500,
                message: data?.message || data?.brief || "Pengambilan Data Pengguna Gagal"
            };
        }
        setStorageItem("current_user", JSON.stringify(data));
        if (data.id) setStorageItem("id", String(data.id));
        if (data.pid) setStorageItem("pid", String(data.pid));
        if (data.name) setStorageItem("name", data.name);
        if (data.email) setStorageItem("email", data.email);
        if (data.current_role_id) setStorageItem("current_role", String(data.current_role_id));

        return {
            code: 200,
            message: "Get Current User successful",
            data
        };
    } catch (error) {
        return {
            code: 500,
            message: "Gagal terhubung ke server"
        };
    }
}

export async function ChangeUserRole(role_id: string) {
    try {
        const response = await fetch(`${getBaseUrl()}/user/set_current_role/${role_id}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: `Bearer ${getStorageItem("token")}`,
            }
        });
        const data = await response.json();
        if (!response.ok) {
            return {
                code: response.status || 500,
                message: data?.message || data?.brief || "Mengganti Peran Pengguna Gagal"
            };
        }
        setStorageItem("current_user", JSON.stringify(data));
        if (data.current_role_id) setStorageItem("current_role", String(data.current_role_id));
        return {
            code: 200,
            message: "Ubah peran berhasil",
            data
        };
    } catch (error) {
        return {
            code: 500,
            message: "Gagal terhubung ke server"
        };
    }
}

export function LogoutUser(): boolean {
    removeStorageItem("token");
    removeStorageItem("user");
    removeStorageItem("id");
    removeStorageItem("pid");
    removeStorageItem("name");
    removeStorageItem("email");
    removeStorageItem("is_verified");
    removeStorageItem("current_role");
    removeStorageItem("roles");
    removeStorageItem("current_user");
    removeStorageItem("dashboard_path");
    removeStorageItem("student");
    return true;
}

export function isTokenExists(): boolean {
    const token = getStorageItem("token");
    return token !== null && token !== "" && token !== "undefined";
}

export function isAuthenticated(): boolean {
    return isTokenExists();
}

export function isAuthorized(): boolean {
    return isAuthenticated();
}

export async function claimAccount(userClaim: UserClaim) {
    try {
        const response = await fetch(`${getBaseUrl()}/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify(userClaim),
        });
        const responseData = await response.json();
        if (response.ok) {
            return {
                code: 200,
                message: responseData?.message || "Registrasi / klaim akun berhasil",
                errors: undefined
            };
        }
        return {
            code: response.status || responseData?.code || 500,
            message: responseData?.message || responseData?.brief || "Klaim akun gagal",
            errors: responseData?.errors
        };
    } catch (error) {
        return {
            code: 500,
            message: "Gagal terhubung ke server"
        };
    }
}

export async function verifyAccount(token: string) {
    try {
        const response = await fetch(`${getBaseUrl()}/verify/${token}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            }
        });

        let responseData: any = {};
        try {
            responseData = await response.json();
        } catch {
            if (response.ok) {
                return {
                    code: 200,
                    message: "Email berhasil diverifikasi"
                };
            }
        }

        if (response.ok) {
            return {
                code: 200,
                message: responseData?.message || "Email berhasil diverifikasi"
            };
        }
        return {
            code: response.status || responseData?.code || 400,
            message: responseData?.message || responseData?.brief || "Verifikasi Gagal"
        };
    } catch (error) {
        return {
            code: 500,
            message: "Gagal terhubung ke server"
        };
    }
}

export async function forgotPassword(email: string) {
    try {
        const response = await fetch(`${getBaseUrl()}/forgot`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify({ email }),
        });
        let responseData: any = {};
        try {
            responseData = await response.json();
        } catch {
            if (response.ok) {
                return {
                    code: 200,
                    message: "Instruksi reset kata sandi telah dikirim ke email"
                };
            }
        }

        if (response.ok) {
            return {
                code: 200,
                message: responseData?.message || "Instruksi reset kata sandi telah dikirim ke email"
            };
        }
        return {
            code: response.status || responseData?.code || 500,
            message: responseData?.message || responseData?.brief || "Permintaan reset gagal"
        };
    } catch (error) {
        return {
            code: 500,
            message: "Gagal terhubung ke server"
        };
    }
}

export async function resetPassword(resetPayload: ResetPassword) {
    try {
        const response = await fetch(`${getBaseUrl()}/reset`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
            },
            body: JSON.stringify({
                token: resetPayload.token,
                new_password: resetPayload.password,
            }),
        });
        let responseData: any = {};
        try {
            responseData = await response.json();
        } catch {
            if (response.ok) {
                return {
                    code: 200,
                    message: "Kata sandi berhasil diperbarui"
                };
            }
        }

        if (response.ok) {
            return {
                code: 200,
                message: responseData?.message || "Kata sandi berhasil diperbarui"
            };
        }
        return {
            code: response.status || responseData?.code || 500,
            message: responseData?.message || responseData?.brief || "Reset Password Gagal"
        };
    } catch (error) {
        return {
            code: 500,
            message: "Gagal terhubung ke server"
        };
    }
}

export async function AuthUserIndex(pagination: TypePaginationForm): Promise<ModelAuthUserPaginationResponse> {
    try {
        const queryParams = new URLSearchParams();
        if (pagination.page) queryParams.set("page", String(pagination.page));
        if (pagination.per_page) queryParams.set("page_size", String(pagination.per_page));
        if (pagination.search) queryParams.set("name", pagination.search);

        const response = await fetch(`${getBaseUrl()}/${path}?${queryParams.toString()}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: `Bearer ${getStorageItem("token")}`,
            },
        });
        const response_data = await response.json();
        if (response_data && response_data.data) {
            return {
                pagination: {
                    search: pagination.search || "",
                    sort_by: pagination.sort_by || "",
                    column: pagination.column || "",
                    sort_dir: pagination.sort_dir || "",
                    page: response_data.page || pagination.page || 1,
                    per_page: response_data.page_size || pagination.per_page || 10,
                    total_page: response_data.total_pages || 0,
                    last_page: response_data.total_pages || 1,
                    total_data: response_data.total || 0,
                },
                data: response_data.data,
            };
        }
        return response_data;
    } catch (error) {
        return {
            pagination: {
                search: "",
                sort_by: "",
                column: "",
                sort_dir: "",
                page: 1,
                per_page: 10,
                total_page: 0,
                last_page: 1,
                total_data: 0,
            },
            data: [],
        };
    }
}

export async function AuthUserShow(id: string): Promise<AuthUserDetail | null> {
    try {
        const response = await fetch(`${getBaseUrl()}/${path}/${id}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: `Bearer ${getStorageItem("token")}`,
            },
        });
        const response_data: AuthUserDetail = await response.json();
        return response_data;
    } catch (error) {
        return null;
    }
}

export async function AuthUserSyncPermission(id: string) {
    try {
        const response = await fetch(`${getBaseUrl()}/${path}/${id}/sync_permission`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: `Bearer ${getStorageItem("token")}`,
            },
        });

        if (!response.ok) {
            return {
                code: response.status || 500,
                message: "Sync Permission failed"
            };
        }
        return {
            code: 200,
            message: "Sync Permission successful"
        };
    } catch (error) {
        return {
            code: 500,
            message: "Gagal terhubung ke server"
        };
    }
}