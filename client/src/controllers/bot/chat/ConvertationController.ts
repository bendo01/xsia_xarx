import { getStorageItem } from "../../../lib/storage";

const server_api_url =
    import.meta.env.VITE_API_SERVER_URL ?? "http://localhost:5150/api/";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Conversation {
    id: string;
    title?: string | null;
    user_id?: string | null;
    is_pinned?: boolean | null;
    created_at?: string | null;
    updated_at?: string | null;
}

export interface Message {
    id: string;
    conversation_id: string;
    role: string; // "user" | "assistant"
    content: string;
    created_at?: string | null;
    updated_at?: string | null;
}

// ---------------------------------------------------------------------------
// conversationStore — POST /api/bot/conversations/store
// ---------------------------------------------------------------------------

export async function conversationStore(body: string): Promise<{
    code: number;
    message: string;
    data?: Conversation;
}> {
    try {
        const response = await fetch(`${server_api_url}bot/conversations/store`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: `Bearer ${getStorageItem("token")}`,
            },
            body: JSON.stringify({ body }),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Gagal membuat percakapan", data);
            return {
                code: response.status,
                message: data.message || "Gagal membuat percakapan",
            };
        }

        return {
            code: 200,
            message: "Berhasil membuat percakapan",
            data,
        };
    } catch (error) {
        console.error("Gagal terhubung ke server", error);
        return { code: 500, message: "Gagal terhubung ke server" };
    }
}

// ---------------------------------------------------------------------------
// conversationMessages — GET /api/bot/conversations/:id/messages[?before_id=<uuid>]
// ---------------------------------------------------------------------------

export async function conversationMessages(
    id: string,
    beforeId?: string
): Promise<{
    code: number;
    message: string;
    data?: Message[];
}> {
    try {
        const url = new URL(`${server_api_url}bot/conversations/${id}/messages`);
        if (beforeId) {
            url.searchParams.set("before_id", beforeId);
        }

        const response = await fetch(url.toString(), {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
                Authorization: `Bearer ${getStorageItem("token")}`,
            },
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Gagal mengambil pesan", data);
            return {
                code: response.status,
                message: data.message || "Gagal mengambil pesan",
            };
        }

        return {
            code: 200,
            message: "Berhasil mengambil pesan",
            data,
        };
    } catch (error) {
        console.error("Gagal terhubung ke server", error);
        return { code: 500, message: "Gagal terhubung ke server" };
    }
}

// ---------------------------------------------------------------------------
// conversationChat — POST /api/bot/conversations/:id/chat (SSE stream)
//
// Uses fetch + ReadableStream to read the SSE response. Calls:
//   onToken(text)  — for every streamed AI token
//   onDone()       — when the server emits event: done
//   onError(msg)   — on connection or upstream errors
// ---------------------------------------------------------------------------

export async function conversationChatQwen2505b(
    id: string,
    body: string,
    onToken: (token: string) => void,
    onDone: () => void,
    onError: (msg: string) => void,
    onThinking?: (step: string) => void,
    signal?: AbortSignal
): Promise<void> {
    try {
        const response = await fetch(
            `${server_api_url}bot/conversations/${id}/chat_stream_qwen25_05b`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "text/event-stream",
                    Authorization: `Bearer ${getStorageItem("token")}`,
                },
                body: JSON.stringify({ body }),
            }
        );

        if (!response.ok || !response.body) {
            onError(`HTTP ${response.status}`);
            return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            // Process complete lines from the buffer.
            const lines = buffer.split("\n");
            buffer = lines.pop() ?? ""; // keep last (possibly incomplete) line

            let eventType = "message";
            for (const line of lines) {
                const trimmedLine = line.trim();
                if (trimmedLine.startsWith("event: ")) {
                    eventType = trimmedLine.slice(7).trim();
                } else if (trimmedLine.startsWith("data: ")) {
                    const data = trimmedLine.slice(6).trim();
                    if (eventType === "done") {
                        onDone();
                        return;
                    }
                    if (eventType === "thinking") {
                        onThinking?.(data);
                    } else if (eventType === "error") {
                        // Avoid double errors if multiple lines are caught
                        onError(data);
                        return;
                    } else {
                        onToken(data);
                    }
                    // Standard SSE resets data buffer after a full event (\n\n), 
                    // but here we treat each data line as a token for responsiveness.
                } else if (trimmedLine === "") {
                    eventType = "message";
                }
            }
        }

        onDone();
    } catch (error: any) {
        if (error.name === "AbortError") {
            onDone();
            return;
        }
        onError(error instanceof Error ? error.message : "Gagal terhubung ke server");
    }
}

export async function conversationChatLlma321b(
    id: string,
    body: string,
    onToken: (token: string) => void,
    onDone: () => void,
    onError: (msg: string) => void,
    onThinking?: (step: string) => void,
    signal?: AbortSignal
): Promise<void> {
    try {
        const response = await fetch(
            `${server_api_url}bot/conversations/${id}/chat_stream_llma32_1b`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "text/event-stream",
                    Authorization: `Bearer ${getStorageItem("token")}`,
                },
                body: JSON.stringify({ body }),
            }
        );

        if (!response.ok || !response.body) {
            onError(`HTTP ${response.status}`);
            return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";

            let eventType = "message";
            for (const line of lines) {
                const trimmedLine = line.trim();
                if (trimmedLine.startsWith("event: ")) {
                    eventType = trimmedLine.slice(7).trim();
                } else if (trimmedLine.startsWith("data: ")) {
                    const data = trimmedLine.slice(6).trim();
                    if (eventType === "done") {
                        onDone();
                        return;
                    }
                    if (eventType === "thinking") {
                        onThinking?.(data);
                    } else if (eventType === "error") {
                        onError(data);
                        return;
                    } else {
                        onToken(data);
                    }
                } else if (trimmedLine === "") {
                    eventType = "message";
                }
            }
        }

        onDone();
    } catch (error: any) {
        if (error.name === "AbortError") {
            onDone();
            return;
        }
        onError(error instanceof Error ? error.message : "Gagal terhubung ke server");
    }
}
