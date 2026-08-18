import { AuthLogin, AuthUser, initialAuthUser, ResetPassword, UserClaim, UserWithRole, AuthUserDetail } from "../../models/auth/User";
import { isKeyExists, removeStorageItem, setStorageItem, getStorageItem } from "../../lib/storage";
import { useNavigate } from "@solidjs/router";
import { TypePaginationForm } from "../../lib/types";
import { ModelAuthUserPaginationResponse, ModelCommonReferencePaginationResponse } from "../../models/pagination/ModelPagination";

const server_api_url = import.meta.env.VITE_API_SERVER_URL ?? "http://localhost:5150/api/";
const path = "auth/users";

export async function LoginUser(credensial: AuthLogin) {

    // Function to handle user login
    if (credensial.email && credensial.password) {
        try {
            const response = await fetch(`${server_api_url}auth/users/login`, {
                method: "POST", // HTTP method
                headers: {
                    "Content-Type": "application/json", // Specify the data format
                    Accept: "application/json",
                },
                body: JSON.stringify(credensial), // Send form data as JSON
            });
            const data = await response.json();

            if (!response.ok) {
                return {
                    code: data.code || 500,
                    message: data.message || "Login failed"
                };
            }
            // If login is successful, you might want to store user data or token here
            // setStorageItem("user", data.user); // Example if you want to store user
            setStorageItem("token", data.token);
            setStorageItem("pid", data.pid);
            setStorageItem("name", data.name);
            setStorageItem("is_verified", data.is_verified);
            return {
                code: data.code || 200,
                message: data.message || "Login successful"
            };
        } catch (error) {
            return {
                code: 500,
                message: "Gagal terhubung ke server"
            };
        }
    }
    // Return null if credentials are missing
    return {
        code: 500,
        message: "Empty Credentials"
    };
}

export async function GetUserRoles() {
    try {
        const response = await fetch(`${server_api_url}auth/roles/user`, {
            method: "GET", // HTTP method
            headers: {
                "Content-Type": "application/json", // Specify the data format
                Accept: "application/json",
                Authorization: `Bearer ${getStorageItem("token")}`,
            },
        });
        const data = await response.json();

        if (!response.ok) {
            return {
                code: 500,
                message: "Pengambilan Daftar Peran Pengguna Gagal"
            };
        }
        setStorageItem("roles", JSON.stringify(data));
        return {
            code: data.code || 200,
            message: data.message || "Get Role successful"
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
        const response = await fetch(`${server_api_url}auth/users/current`, {
            method: "GET", // HTTP method
            headers: {
                "Content-Type": "application/json", // Specify the data format
                Accept: "application/json",
                Authorization: `Bearer ${getStorageItem("token")}`,
            },
        });
        const data = await response.json();

        if (!response.ok) {
            return {
                code: 500,
                message: "Pengambilan Peran Pengguna Gagal"
            };
        }
        setStorageItem("current_user", JSON.stringify(data));
        return {
            code: data.code || 200,
            message: data.message || "Get Role successful"
        };
    } catch (error) {
        return {
            code: 500,
            message: "Gagal terhubung ke server"
        };
    }
}

export async function ChangeUserRole(role_id: string) {
    const path = "auth/users/set_current_role";
    try {
        const response = await fetch(`${server_api_url}${path}/${role_id}`, {
            method: "GET", // HTTP method
            headers: {
                "Content-Type": "application/json", // Specify the data format
                Accept: "application/json",
                Authorization: `Bearer ${getStorageItem("token")}`,
            }
        });
        const data = await response.json();
        if (!response.ok) {
            return {
                code: 500,
                message: "Mengganti Peran Pengguna Gagal"
            };
        }
        setStorageItem("current_user", JSON.stringify(data));
    } catch (error) {
        return {
            code: 500,
            message: "Gagal terhubung ke server"
        };
    }
}

export function LogoutUser(): boolean {
    // const navigate = useNavigate();
    removeStorageItem("token");
    removeStorageItem("pid");
    removeStorageItem("name");
    removeStorageItem("is_verified");
    removeStorageItem("current_role");
    removeStorageItem("roles");
    removeStorageItem("current_user");
    removeStorageItem("dashboard_path");
    removeStorageItem("student");
    // navigate("/");
    return true;
}

export function isTokenExists(): boolean {
    return isKeyExists("token");
}

export function isAuthenticated(): boolean {
    return isTokenExists();
}

export function isAuthorized(): boolean {
    const returned = false;
    // const server_api_url = import.meta.env.VITE_API_SERVER_URL ?? "http://localhost:5153/api/";
    return returned;
}

export async function claimAccount(userClaim: UserClaim) {
    try {
        const response = await fetch(`${server_api_url}auth/users/user_claim`, {
            method: "POST", // HTTP method
            headers: {
                "Content-Type": "application/json", // Specify the data format
                Accept: "application/json",
            },
            body: JSON.stringify(userClaim), // Send form data as JSON
        });
        const responseData = await response.json();
        if (response.ok) {
            return {
                code: responseData.code || 200,
                message: responseData.message || "Claim Account successful",
                errors: undefined
            };
        }
        return {
            code: responseData.code || 500,
            message: responseData.message || "Claim Failed",
            errors: responseData.errors
        };
    } catch (error) {
        return {
            code: 500,
            message: "Gagal terhubung ke server"
        };
    }
}

export async function verifyAccount(code: string) {
    try {
        const response = await fetch(`${server_api_url}auth/users/verify/${code}`, {
            method: "GET", // HTTP method
            headers: {
                "Content-Type": "application/json", // Specify the data format
                Accept: "application/json",
            }
        });

        let responseData: any = {};
        try {
            responseData = await response.json();
        } catch (e) {
            // Ignore JSON parse error if response is OK (likely empty body)
            if (response.ok) {
                return {
                    code: 200,
                    message: "Verify Account successful"
                };
            }
        }

        if (response.ok) {
            return {
                code: responseData?.code || 200,
                message: responseData?.message || "Verify Account successful"
            };
        }
        return {
            code: responseData?.code || response.status || 400,
            message: responseData?.message || "Verifikasi Gagal"
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
        const response = await fetch(`${server_api_url}auth/users/forgot`, {
            method: "POST", // HTTP method
            headers: {
                "Content-Type": "application/json", // Specify the data format
                Accept: "application/json",
            },
            body: JSON.stringify({ email }), // Send form data as JSON
        });
        let responseData: any = {};
        try {
            responseData = await response.json();
        } catch (e) {
            // Ignore JSON parse error if response is OK (likely empty body)
            if (response.ok) {
                return {
                    code: 200,
                    message: "Forgot Password successful"
                };
            }
        }

        if (response.ok) {
            return {
                code: responseData?.code || 200,
                message: responseData?.message || "Forgot Password successful"
            };
        }
        return {
            code: responseData?.code || 500,
            message: responseData?.message || "Permintaan gagal"
        };
    } catch (error) {
        return {
            code: 500,
            message: "Gagal terhubung ke server"
        };
    }
}

export async function resetPassword(resetPassword: ResetPassword) {
    try {
        const response = await fetch(`${server_api_url}auth/users/reset`, {
            method: "POST", // HTTP method
            headers: {
                "Content-Type": "application/json", // Specify the data format
                Accept: "application/json",
            },
            body: JSON.stringify(resetPassword), // Send form data as JSON
        });
        let responseData: any = {};
        try {
            responseData = await response.json();
        } catch (e) {
            // Ignore JSON parse error if response is OK (likely empty body)
            if (response.ok) {
                return {
                    code: 200,
                    message: "Reset Password successful"
                };
            }
        }

        if (response.ok) {
            return {
                code: responseData?.code || 200,
                message: responseData?.message || "Reset Password successful"
            };
        }
        return {
            code: responseData?.code || 500,
            message: responseData?.message || "Reset Password Failed"
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
        const response = await fetch(`${server_api_url}${path}`, {
            method: "POST", // HTTP method
            headers: {
                "Content-Type": "application/json", // Specify the data format
                Accept: "application/json",
                Authorization: `Bearer ${getStorageItem("token")}`,
            },
            body: JSON.stringify(pagination), // Send form data as JSON
        });
        const response_data: ModelAuthUserPaginationResponse = await response.json();
        return response_data;
    }
    catch (error) {
        // console.error("Error:", error);
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
        }
    }
}

export async function AuthUserShow(id: string): Promise<AuthUserDetail | null> {
    try {
        const response = await fetch(`${server_api_url}${path}/${id}`, {
            method: "GET", // HTTP method
            headers: {
                "Content-Type": "application/json", // Specify the data format
                Accept: "application/json",
                Authorization: `Bearer ${getStorageItem("token")}`,
            },
        });
        const response_data: AuthUserDetail = await response.json();
        return response_data;
    }
    catch (error) {
        // console.error("Error:", error);
        return null; // Return null instead of initialAuthUser because structure is different
    }
}

export async function AuthUserSyncPermission(id: string) {
    try {
        const response = await fetch(`${server_api_url}${path}/${id}/sync_permission`, {
            method: "POST", // HTTP method
            headers: {
                "Content-Type": "application/json", // Specify the data format
                Accept: "application/json",
                Authorization: `Bearer ${getStorageItem("token")}`,
            },
        });

        if (!response.ok) {
            return {
                code: 500,
                message: "Sync Permission failed"
            };
        }
        return {
            code: 200,
            message: "Sync Permission successful"
        };
    }
    catch (error) {
        return {
            code: 500,
            message: "Gagal terhubung ke server"
        };
    }
}