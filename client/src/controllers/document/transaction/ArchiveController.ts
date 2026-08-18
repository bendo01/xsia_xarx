import { getStorageItem } from "../../../lib/storage";
import { DocumentTransactionArchive, ModelPagination } from "../../../models/document/transaction/Archive";

const server_api_url = import.meta.env.VITE_API_SERVER_URL ?? "http://localhost:5150/api/";

export async function documentTransactionArchiveIndex(paginationData: {
    search?: string;
    sort_by?: string;
    column?: string;
    sort_dir?: string;
    page: number;
    per_page: number;
}): Promise<{
    code: number;
    message: string | ModelPagination;
}> {
    try {
        const response = await fetch(`${server_api_url}document/transaction/archives`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: `Bearer ${getStorageItem("token")}`,
            },
            body: JSON.stringify(paginationData),
        });
        const data = await response.json();

        if (!response.ok) {
            console.error("Gagal mengambil data archive", data);
            return {
                code: response.status,
                message: data.message || "Gagal mengambil data archive",
            };
        }

        return {
            code: 200,
            message: data,
        };
    } catch (error) {
        console.error("Gagal terhubung ke server", error);
        return {
            code: 500,
            message: "Gagal terhubung ke server",
        };
    }
}

export async function documentTransactionArchiveStore(formData: FormData): Promise<{
    code: number;
    message: string;
    data?: DocumentTransactionArchive;
    errors?: any;
}> {
    try {
        const response = await fetch(`${server_api_url}document/transaction/archives/store`, {
            method: "POST",
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${getStorageItem("token")}`,
                // Browser handles Content-Type for FormData
            },
            body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Gagal membuat archive", data);
            return {
                code: response.status,
                message: data.message || "Gagal membuat archive",
                errors: data.errors,
            };
        }

        return {
            code: 200,
            message: "Berhasil membuat archive",
            data: data,
        };
    } catch (error) {
        console.error("Gagal terhubung ke server", error);
        return {
            code: 500,
            message: "Gagal terhubung ke server",
        };
    }
}

export async function documentTransactionArchiveShow(id: string): Promise<DocumentTransactionArchive | null> {
    try {
        const response = await fetch(`${server_api_url}document/transaction/archives/${id}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: `Bearer ${getStorageItem("token")}`,
            },
        });
        const data = await response.json();

        if (!response.ok) {
            console.error("Gagal mengambil data archive", data);
            return null;
        }

        return data;
    } catch (error) {
        console.error("Gagal terhubung ke server", error);
        return null;
    }
}

export async function documentTransactionArchiveUpdate(id: string, formData: FormData): Promise<{
    code: number;
    message: string;
    data?: DocumentTransactionArchive;
    errors?: any;
}> {
    try {
        const response = await fetch(`${server_api_url}document/transaction/archives/${id}`, {
            method: "PUT",
            headers: {
                Accept: "application/json",
                Authorization: `Bearer ${getStorageItem("token")}`,
            },
            body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Gagal update archive", data);
            return {
                code: response.status,
                message: data.message || "Gagal update archive",
                errors: data.errors,
            };
        }

        return {
            code: 200,
            message: "Berhasil update archive",
            data: data,
        };
    } catch (error) {
        console.error("Gagal terhubung ke server", error);
        return {
            code: 500,
            message: "Gagal terhubung ke server",
        };
    }
}

export async function documentTransactionArchiveDestroy(id: string): Promise<{
    code: number;
    message: string;
}> {
    try {
        const response = await fetch(`${server_api_url}document/transaction/archives/${id}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: `Bearer ${getStorageItem("token")}`,
            },
        });

        if (!response.ok) {
            console.error("Gagal menghapus archive");
            return {
                code: response.status,
                message: "Gagal menghapus archive",
            };
        }

        return {
            code: 200,
            message: "Berhasil menghapus archive",
        };
    } catch (error) {
        console.error("Gagal terhubung ke server", error);
        return {
            code: 500,
            message: "Gagal terhubung ke server",
        };
    }
}

export async function documentTransactionArchiveConnect(payload: {
    from_archive_id: string;
    to_archive_id: string;
    connection_type?: string;
}): Promise<{
    code: number;
    message: string;
}> {
    try {
        const response = await fetch(`${server_api_url}document/transaction/archives/connect`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: `Bearer ${getStorageItem("token")}`,
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Gagal connect archive", data);
            return {
                code: response.status,
                message: data.message || "Gagal connect archive",
            };
        }

        return {
            code: 200,
            message: data.message || "Berhasil connect archive",
        };
    } catch (error) {
        console.error("Gagal terhubung ke server", error);
        return {
            code: 500,
            message: "Gagal terhubung ke server",
        };
    }
}

export async function documentTransactionArchiveDisconnect(payload: {
    from_archive_id: string;
    to_archive_id: string;
    connection_type?: string;
}): Promise<{
    code: number;
    message: string;
}> {
    try {
        const response = await fetch(`${server_api_url}document/transaction/archives/disconnect`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: `Bearer ${getStorageItem("token")}`,
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Gagal disconnect archive", data);
            return {
                code: response.status,
                message: data.message || "Gagal disconnect archive",
            };
        }

        return {
            code: 200,
            message: data.message || "Berhasil disconnect archive",
        };
    } catch (error) {
        console.error("Gagal terhubung ke server", error);
        return {
            code: 500,
            message: "Gagal terhubung ke server",
        };
    }
}
