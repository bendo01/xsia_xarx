import { createSignal, onMount, onCleanup, For, Show } from "solid-js";
import TopBar from "../../components/navigation/TopBar";
import { toast } from "../../components/toast/Toaster";

interface WsMessage {
    id: string;
    direction: "in" | "out" | "system";
    type: "text" | "json" | "binary" | "ping" | "pong";
    channel?: string;
    content: string;
    timestamp: string;
    latencyMs?: number;
    rawSize?: number;
}

export default function WebSocketExample() {
    // Default server websocket URL
    const defaultWsUrl = () => {
        if (typeof window === "undefined") return "ws://127.0.0.1:5800/api/v1/realtime/ws";
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const apiBase = import.meta.env.VITE_API_SERVER_URL || "http://127.0.0.1:5800/api/v1/";
        try {
            const parsed = new URL(apiBase);
            return `${protocol}//${parsed.host}/api/v1/realtime/ws`;
        } catch {
            return `${protocol}//127.0.0.1:5800/api/v1/realtime/ws`;
        }
    };

    // State
    const [wsUrl, setWsUrl] = createSignal("");
    const [status, setStatus] = createSignal<"disconnected" | "connecting" | "connected" | "error">("disconnected");
    const [messages, setMessages] = createSignal<WsMessage[]>([]);
    const [inputMessage, setInputMessage] = createSignal("");
    const [payloadType, setPayloadType] = createSignal<"text" | "json">("json");
    
    // Channels State
    const [activeChannels, setActiveChannels] = createSignal<string[]>(["general"]);
    const [targetChannel, setTargetChannel] = createSignal<string>("general");
    const [newChannelInput, setNewChannelInput] = createSignal("");
    const [channelFilter, setChannelFilter] = createSignal<string>("all");

    // UI filters
    const [filterType, setFilterType] = createSignal<"all" | "in" | "out" | "system">("all");
    const [autoScroll, setAutoScroll] = createSignal(true);
    const [autoReconnect, setAutoReconnect] = createSignal(false);
    const [heartbeatActive, setHeartbeatActive] = createSignal(false);
    const [latency, setLatency] = createSignal<number | null>(null);
    const [uptime, setUptime] = createSignal(0);
    const [sentCount, setSentCount] = createSignal(0);
    const [receivedCount, setReceivedCount] = createSignal(0);
    const [bytesTransferred, setBytesTransferred] = createSignal(0);

    // SSE companion state
    const [sseActive, setSseActive] = createSignal(false);
    const [sseLastEvent, setSseLastEvent] = createSignal<string | null>(null);

    let socket: WebSocket | null = null;
    let sseSource: EventSource | null = null;
    let pingStartTime = 0;
    let heartbeatTimer: any = null;
    let uptimeTimer: any = null;
    let reconnectTimer: any = null;
    let logContainerRef: HTMLDivElement | undefined;

    // Helper: Append a message to the stream
    const addMessage = (msg: Omit<WsMessage, "id" | "timestamp">) => {
        const newMsg: WsMessage = {
            ...msg,
            id: Math.random().toString(36).substring(2, 9),
            timestamp: new Date().toLocaleTimeString(),
        };
        setMessages((prev) => [...prev, newMsg]);

        if (autoScroll() && logContainerRef) {
            setTimeout(() => {
                logContainerRef?.scrollTo({ top: logContainerRef.scrollHeight, behavior: "smooth" });
            }, 50);
        }
    };

    // Connect to WebSocket
    const connect = () => {
        if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
            return;
        }

        const initialChan = targetChannel() || "general";
        let targetUrl = wsUrl().trim() || defaultWsUrl();
        if (!targetUrl.includes("channel=")) {
            const sep = targetUrl.includes("?") ? "&" : "?";
            targetUrl = `${targetUrl}${sep}channel=${encodeURIComponent(initialChan)}`;
        }

        setStatus("connecting");
        addMessage({
            direction: "system",
            type: "text",
            content: `Connecting to ${targetUrl}...`,
        });

        try {
            socket = new WebSocket(targetUrl);

            socket.onopen = () => {
                setStatus("connected");
                toast.success("WebSocket connected to Multi-Channel Hub!");
                addMessage({
                    direction: "system",
                    type: "text",
                    channel: initialChan,
                    content: `Connection established. Subscribed to channel '${initialChan}'`,
                });

                // Start uptime timer
                setUptime(0);
                clearInterval(uptimeTimer);
                uptimeTimer = setInterval(() => {
                    setUptime((prev) => prev + 1);
                }, 1000);

                // Auto-subscribe to any extra active channels
                for (const chan of activeChannels()) {
                    if (chan !== initialChan) {
                        subscribeChannel(chan, false);
                    }
                }

                // Start heartbeat if enabled
                if (heartbeatActive()) {
                    startHeartbeat();
                }
            };

            socket.onmessage = (event) => {
                setReceivedCount((c) => c + 1);
                const dataSize = typeof event.data === "string" ? event.data.length : event.data.byteLength || 0;
                setBytesTransferred((b) => b + dataSize);

                let currentLatency: number | undefined;
                if (pingStartTime > 0) {
                    currentLatency = Date.now() - pingStartTime;
                    setLatency(currentLatency);
                    pingStartTime = 0;
                }

                let detectedType: "text" | "json" | "binary" = "text";
                let displayContent = event.data;
                let msgChannel: string | undefined = undefined;

                if (typeof event.data === "string") {
                    try {
                        const parsed = JSON.parse(event.data);
                        displayContent = JSON.stringify(parsed, null, 2);
                        detectedType = "json";

                        // Handle server multi-channel protocol events
                        if (parsed.channel) {
                            msgChannel = parsed.channel;
                        }
                        if (parsed.event === "subscribed" && parsed.channel) {
                            if (!activeChannels().includes(parsed.channel)) {
                                setActiveChannels((prev) => [...prev, parsed.channel]);
                            }
                        } else if (parsed.event === "unsubscribed" && parsed.channel) {
                            setActiveChannels((prev) => prev.filter((c) => c !== parsed.channel));
                        }
                    } catch {
                        detectedType = "text";
                    }
                } else if (event.data instanceof Blob || event.data instanceof ArrayBuffer) {
                    detectedType = "binary";
                    displayContent = `[Binary Data: ${dataSize} bytes]`;
                }

                addMessage({
                    direction: "in",
                    type: detectedType,
                    channel: msgChannel,
                    content: displayContent,
                    latencyMs: currentLatency,
                    rawSize: dataSize,
                });
            };

            socket.onerror = () => {
                setStatus("error");
                toast.danger("WebSocket error occurred");
                addMessage({
                    direction: "system",
                    type: "text",
                    content: "WebSocket transport error encountered.",
                });
            };

            socket.onclose = (event) => {
                setStatus("disconnected");
                clearInterval(uptimeTimer);
                stopHeartbeat();
                addMessage({
                    direction: "system",
                    type: "text",
                    content: `Disconnected (Code: ${event.code}${event.reason ? `, Reason: ${event.reason}` : ""})`,
                });

                if (autoReconnect()) {
                    addMessage({
                        direction: "system",
                        type: "text",
                        content: "Auto-reconnect active. Attempting reconnection in 3s...",
                    });
                    clearTimeout(reconnectTimer);
                    reconnectTimer = setTimeout(connect, 3000);
                }
            };
        } catch (err: any) {
            setStatus("error");
            toast.danger("Failed to initiate WebSocket connection");
            addMessage({
                direction: "system",
                type: "text",
                content: `Connection error: ${err.message}`,
            });
        }
    };

    // Disconnect from WebSocket
    const disconnect = () => {
        clearTimeout(reconnectTimer);
        stopHeartbeat();
        clearInterval(uptimeTimer);
        if (socket) {
            socket.close(1000, "User requested disconnect");
            socket = null;
        }
        setStatus("disconnected");
        toast.info("WebSocket disconnected");
    };

    // Subscribe to a new channel
    const subscribeChannel = (channelName: string, updateActiveList = true) => {
        const chan = channelName.trim();
        if (!chan) return;

        if (updateActiveList && !activeChannels().includes(chan)) {
            setActiveChannels((prev) => [...prev, chan]);
        }

        if (socket && socket.readyState === WebSocket.OPEN) {
            const payload = JSON.stringify({ action: "subscribe", channel: chan });
            socket.send(payload);
            setSentCount((c) => c + 1);
            addMessage({
                direction: "out",
                type: "json",
                channel: chan,
                content: payload,
            });
        }
    };

    // Unsubscribe from a channel
    const unsubscribeChannel = (chan: string) => {
        if (socket && socket.readyState === WebSocket.OPEN) {
            const payload = JSON.stringify({ action: "unsubscribe", channel: chan });
            socket.send(payload);
            setSentCount((c) => c + 1);
            addMessage({
                direction: "out",
                type: "json",
                channel: chan,
                content: payload,
            });
        }
        setActiveChannels((prev) => prev.filter((c) => c !== chan));
        if (targetChannel() === chan) {
            const remaining = activeChannels().filter((c) => c !== chan);
            setTargetChannel(remaining[0] || "general");
        }
    };

    // Send Message / Broadcast to Channel
    const sendMessage = (customPayload?: string, type: "text" | "json" | "ping" = payloadType()) => {
        const text = customPayload !== undefined ? customPayload : inputMessage().trim();
        if (!text) return;

        if (!socket || socket.readyState !== WebSocket.OPEN) {
            toast.warning("WebSocket is not connected. Please connect first.");
            return;
        }

        try {
            let finalPayload = text;

            if (type === "ping") {
                pingStartTime = Date.now();
                finalPayload = "PING";
            } else if (type === "json") {
                // If it's pure data, wrap into channel action if not already framed
                try {
                    const parsed = JSON.parse(text);
                    if (!parsed.action) {
                        finalPayload = JSON.stringify({
                            action: "publish",
                            channel: targetChannel(),
                            data: parsed,
                        });
                    }
                } catch {
                    finalPayload = JSON.stringify({
                        action: "publish",
                        channel: targetChannel(),
                        data: { text },
                    });
                }
            }

            socket.send(finalPayload);
            setSentCount((c) => c + 1);
            setBytesTransferred((b) => b + finalPayload.length);

            addMessage({
                direction: "out",
                type: type,
                channel: targetChannel(),
                content: finalPayload,
                rawSize: finalPayload.length,
            });

            if (customPayload === undefined) {
                setInputMessage("");
            }
        } catch (err: any) {
            toast.danger(`Send failed: ${err.message}`);
        }
    };

    // Heartbeat logic
    const startHeartbeat = () => {
        stopHeartbeat();
        heartbeatTimer = setInterval(() => {
            if (socket && socket.readyState === WebSocket.OPEN) {
                sendMessage(JSON.stringify({ action: "ping", client_time: Date.now() }), "ping");
            }
        }, 5000);
    };

    const stopHeartbeat = () => {
        if (heartbeatTimer) {
            clearInterval(heartbeatTimer);
            heartbeatTimer = null;
        }
    };

    // Request list of active server channels
    const listServerChannels = () => {
        if (!socket || socket.readyState !== WebSocket.OPEN) {
            toast.warning("Please connect to WebSocket first");
            return;
        }
        const payload = JSON.stringify({ action: "list_channels" });
        socket.send(payload);
        setSentCount((c) => c + 1);
        addMessage({
            direction: "out",
            type: "json",
            content: payload,
        });
    };

    // Toggle SSE companion
    const toggleSse = () => {
        if (sseActive()) {
            if (sseSource) {
                sseSource.close();
                sseSource = null;
            }
            setSseActive(false);
            setSseLastEvent(null);
            toast.info("SSE Stream disconnected");
        } else {
            const sseUrl = (import.meta.env.VITE_API_SERVER_URL || "http://127.0.0.1:5800/api/v1/").replace(/\/+$/, "") + "/realtime/sse";
            try {
                sseSource = new EventSource(sseUrl);
                setSseActive(true);
                toast.success("SSE Stream connected!");

                sseSource.addEventListener("heartbeat", (event) => {
                    setSseLastEvent(event.data);
                });

                sseSource.onerror = () => {
                    toast.danger("SSE Stream error");
                };
            } catch {
                toast.danger("Failed to connect to SSE stream");
            }
        }
    };

    // Quick channel templates
    const channelPresets = [
        {
            label: "Class Broadcast (# class:cs101)",
            channel: "class:cs101",
            payload: JSON.stringify({ sender: "Prof. Alan", text: "Welcome to Data Structures 101." }, null, 2),
        },
        {
            label: "Academic Alert (# academic:announcements)",
            channel: "academic:announcements",
            payload: JSON.stringify({ priority: "high", title: "Semester Registration Open", deadline: "2026-09-01" }, null, 2),
        },
        {
            label: "Campus Notice (# building:campus)",
            channel: "building:campus",
            payload: JSON.stringify({ building: "Building A", status: "Open", capacity: "85%" }, null, 2),
        },
        {
            label: "General Chat (# general)",
            channel: "general",
            payload: JSON.stringify({ sender: "Student_992", text: "Hello everyone on the channel!" }, null, 2),
        },
    ];

    // Lifecycle
    onMount(() => {
        setWsUrl(defaultWsUrl());
    });

    onCleanup(() => {
        disconnect();
        if (sseSource) sseSource.close();
    });

    // Filtered messages
    const filteredMessages = () => {
        let list = messages();
        if (filterType() !== "all") {
            list = list.filter((m) => m.direction === filterType());
        }
        if (channelFilter() !== "all") {
            list = list.filter((m) => m.channel === channelFilter() || m.direction === "system");
        }
        return list;
    };

    // Format uptime
    const formatUptime = (secs: number) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    };

    return (
        <div class="min-h-screen bg-neutral-100 dark:bg-neutral-950 text-neutral-800 dark:text-neutral-100 flex flex-col font-sans transition-colors duration-200 selection:bg-blue-600 selection:text-white">
            <TopBar />

            {/* Sub-header / Title Bar */}
            <div class="border-b border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-900/60 backdrop-blur-md px-4 sm:px-8 py-5 transition-colors">
                <div class="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <div class="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1">
                            <span class="size-2 rounded-full bg-blue-500 animate-ping"></span>
                            Multi-Channel Pub/Sub Hub
                        </div>
                        <h1 class="text-2xl sm:text-3xl font-extrabold text-neutral-900 dark:text-white tracking-tight flex items-center gap-3">
                            Multi-Channel WebSocket Studio
                        </h1>
                        <p class="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                            Full-duplex channel multiplexer with on-demand room subscriptions, targeted pub/sub broadcasting, and live traffic analysis.
                        </p>
                    </div>

                    {/* Quick Status Pill */}
                    <div class="flex items-center gap-3 bg-neutral-200/60 dark:bg-neutral-950/80 border border-neutral-300/80 dark:border-neutral-800 p-2 rounded-2xl shadow-inner transition-colors">
                        <div class="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs dark:shadow-none">
                            <span
                                class={`size-2.5 rounded-full ${
                                    status() === "connected"
                                        ? "bg-emerald-500 dark:bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                                        : status() === "connecting"
                                        ? "bg-amber-500 dark:bg-amber-400 animate-pulse"
                                        : status() === "error"
                                        ? "bg-rose-500"
                                        : "bg-neutral-400 dark:bg-neutral-500"
                                }`}
                            ></span>
                            <span class="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
                                {status()}
                            </span>
                        </div>

                        <Show when={latency() !== null}>
                            <div class="text-xs font-mono text-emerald-700 dark:text-emerald-400 px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-500/20 rounded-lg">
                                {latency()} ms RTT
                            </div>
                        </Show>
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <main class="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 flex flex-col gap-6">
                
                {/* Metric Cards Bar */}
                <div class="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
                    <div class="p-4 rounded-2xl bg-white dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800 shadow-xs dark:shadow-none flex flex-col transition-colors">
                        <span class="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Uptime</span>
                        <span class="text-xl font-bold font-mono text-neutral-900 dark:text-white mt-1">{formatUptime(uptime())}</span>
                    </div>
                    <div class="p-4 rounded-2xl bg-white dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800 shadow-xs dark:shadow-none flex flex-col transition-colors">
                        <span class="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Active Channels</span>
                        <span class="text-xl font-bold font-mono text-purple-600 dark:text-purple-400 mt-1">{activeChannels().length}</span>
                    </div>
                    <div class="p-4 rounded-2xl bg-white dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800 shadow-xs dark:shadow-none flex flex-col transition-colors">
                        <span class="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Sent Messages</span>
                        <span class="text-xl font-bold font-mono text-blue-600 dark:text-blue-400 mt-1">{sentCount()}</span>
                    </div>
                    <div class="p-4 rounded-2xl bg-white dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800 shadow-xs dark:shadow-none flex flex-col transition-colors">
                        <span class="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Received Messages</span>
                        <span class="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">{receivedCount()}</span>
                    </div>
                    <div class="p-4 rounded-2xl bg-white dark:bg-neutral-900/80 border border-neutral-200 dark:border-neutral-800 shadow-xs dark:shadow-none flex flex-col col-span-2 sm:col-span-1 transition-colors">
                        <span class="text-xs text-neutral-500 dark:text-neutral-400 font-medium">Payload Volume</span>
                        <span class="text-xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-1">{bytesTransferred()} B</span>
                    </div>
                </div>

                {/* Connection Config Bar */}
                <div class="p-4 rounded-2xl bg-white dark:bg-neutral-900/90 border border-neutral-200 dark:border-neutral-800 shadow-xs dark:shadow-none flex flex-col md:flex-row items-stretch md:items-center gap-3 transition-colors">
                    <div class="relative flex-1 flex items-center">
                        <span class="absolute left-3.5 text-neutral-400 dark:text-neutral-500">
                            <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                            </svg>
                        </span>
                        <input
                            type="text"
                            value={wsUrl()}
                            onInput={(e) => setWsUrl(e.currentTarget.value)}
                            placeholder={defaultWsUrl()}
                            disabled={status() === "connected" || status() === "connecting"}
                            class="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700/80 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 pl-10 pr-4 py-2.5 rounded-xl text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-60"
                        />
                    </div>

                    <div class="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                        <Show
                            when={status() === "connected"}
                            fallback={
                                <button
                                    onClick={connect}
                                    disabled={status() === "connecting"}
                                    class="flex-1 sm:flex-none px-5 py-2.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow-[0_0_15px_rgba(37,99,235,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                                >
                                    <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                        <path d="M5 12h14" />
                                        <path d="m12 5 7 7-7 7" />
                                    </svg>
                                    CONNECT
                                </button>
                            }
                        >
                            <button
                                onClick={disconnect}
                                class="flex-1 sm:flex-none px-5 py-2.5 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-bold text-xs rounded-xl shadow-[0_0_15px_rgba(225,29,72,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                                DISCONNECT
                            </button>
                        </Show>

                        {/* List server channels */}
                        <button
                            onClick={listServerChannels}
                            disabled={status() !== "connected"}
                            class="px-3.5 py-2.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 active:scale-95 disabled:opacity-40 text-neutral-700 dark:text-neutral-200 font-semibold text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                            <svg class="size-3.5 text-purple-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                            Channels
                        </button>

                        {/* Ping button */}
                        <button
                            onClick={() => sendMessage("PING", "ping")}
                            disabled={status() !== "connected"}
                            class="px-3.5 py-2.5 bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 active:scale-95 disabled:opacity-40 text-neutral-700 dark:text-neutral-200 font-semibold text-xs rounded-xl border border-neutral-300 dark:border-neutral-700 transition-all flex items-center gap-1.5 cursor-pointer"
                        >
                            <svg class="size-3.5 text-amber-500 dark:text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 14 14" />
                            </svg>
                            PING
                        </button>

                        {/* Heartbeat toggle */}
                        <button
                            onClick={() => {
                                const next = !heartbeatActive();
                                setHeartbeatActive(next);
                                if (next && status() === "connected") startHeartbeat();
                                else stopHeartbeat();
                            }}
                            class={`px-3 py-2.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                                heartbeatActive()
                                    ? "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-500/50 text-emerald-700 dark:text-emerald-300 shadow-xs"
                                    : "bg-neutral-100 dark:bg-neutral-800/80 border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                            }`}
                        >
                            Heartbeat {heartbeatActive() ? "ON" : "OFF"}
                        </button>

                        {/* SSE toggle button */}
                        <button
                            onClick={toggleSse}
                            class={`px-3 py-2.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                                sseActive()
                                    ? "bg-purple-50 dark:bg-purple-950/50 border-purple-300 dark:border-purple-500/50 text-purple-700 dark:text-purple-300 shadow-xs"
                                    : "bg-neutral-100 dark:bg-neutral-800/80 border-neutral-300 dark:border-neutral-700 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                            }`}
                        >
                            SSE {sseActive() ? "ON" : "OFF"}
                        </button>
                    </div>
                </div>

                {/* Channel Subscriptions Manager Bar */}
                <div class="p-4 rounded-2xl bg-white dark:bg-neutral-900/90 border border-neutral-200 dark:border-neutral-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
                    <div class="flex items-center gap-2 flex-wrap">
                        <span class="text-xs font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                            My Channels:
                        </span>
                        <For each={activeChannels()}>
                            {(chan) => (
                                <div
                                    class={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                                        targetChannel() === chan
                                            ? "bg-purple-100 dark:bg-purple-950/60 border-purple-400 dark:border-purple-500/50 text-purple-900 dark:text-purple-200 font-bold shadow-xs"
                                            : "bg-neutral-100 dark:bg-neutral-950 border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300"
                                    }`}
                                >
                                    <button
                                        onClick={() => setTargetChannel(chan)}
                                        class="cursor-pointer hover:underline"
                                    >
                                        # {chan}
                                    </button>
                                    <Show when={activeChannels().length > 1}>
                                        <button
                                            onClick={() => unsubscribeChannel(chan)}
                                            class="text-neutral-400 hover:text-rose-500 ml-1 cursor-pointer"
                                            title={`Unsubscribe from #${chan}`}
                                        >
                                            &times;
                                        </button>
                                    </Show>
                                </div>
                            )}
                        </For>
                    </div>

                    {/* Join new channel form */}
                    <div class="flex items-center gap-2">
                        <input
                            type="text"
                            value={newChannelInput()}
                            onInput={(e) => setNewChannelInput(e.currentTarget.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && newChannelInput().trim()) {
                                    subscribeChannel(newChannelInput().trim());
                                    setTargetChannel(newChannelInput().trim());
                                    setNewChannelInput("");
                                }
                            }}
                            placeholder="Join channel (e.g. class:cs101)..."
                            class="bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700/80 text-neutral-900 dark:text-white placeholder-neutral-400 text-xs px-3 py-1.5 rounded-xl font-mono focus:outline-none focus:ring-1 focus:ring-purple-500"
                        />
                        <button
                            onClick={() => {
                                if (newChannelInput().trim()) {
                                    subscribeChannel(newChannelInput().trim());
                                    setTargetChannel(newChannelInput().trim());
                                    setNewChannelInput("");
                                }
                            }}
                            disabled={!newChannelInput().trim()}
                            class="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 active:scale-95 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                        >
                            + Join
                        </button>
                    </div>
                </div>

                {/* Split Workspace */}
                <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
                    
                    {/* Left: Message Composer */}
                    <div class="lg:col-span-5 flex flex-col gap-4">
                        <div class="p-5 rounded-3xl bg-white dark:bg-neutral-900/90 border border-neutral-200 dark:border-neutral-800 flex-1 flex flex-col shadow-sm dark:shadow-xl transition-colors">
                            <div class="flex items-center justify-between mb-4">
                                <div>
                                    <h2 class="text-sm font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-300 flex items-center gap-2">
                                        <svg class="size-4 text-blue-600 dark:text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                        </svg>
                                        Publish to #{targetChannel()}
                                    </h2>
                                </div>

                                <div class="flex items-center gap-1 bg-neutral-100 dark:bg-neutral-950 p-1 rounded-xl border border-neutral-200 dark:border-neutral-800">
                                    <button
                                        onClick={() => setPayloadType("json")}
                                        class={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                            payloadType() === "json"
                                                ? "bg-blue-600 text-white shadow-xs"
                                                : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200"
                                        }`}
                                    >
                                        JSON
                                    </button>
                                    <button
                                        onClick={() => setPayloadType("text")}
                                        class={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                            payloadType() === "text"
                                                ? "bg-blue-600 text-white shadow-xs"
                                                : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200"
                                        }`}
                                    >
                                        RAW
                                    </button>
                                </div>
                            </div>

                            {/* Message Textarea */}
                            <textarea
                                value={inputMessage()}
                                onInput={(e) => setInputMessage(e.currentTarget.value)}
                                onKeyDown={(e) => {
                                    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                                        e.preventDefault();
                                        sendMessage();
                                    }
                                }}
                                placeholder={payloadType() === "json" ? '{\n  "sender": "Student_01",\n  "text": "Hello channel"\n}' : "Enter raw message..."}
                                rows={6}
                                class="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-600 p-4 rounded-2xl text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all resize-none shadow-inner"
                            ></textarea>

                            <div class="flex items-center justify-between text-[11px] text-neutral-500 dark:text-neutral-400 mt-2 px-1">
                                <span>Target: <span class="font-bold text-purple-600 dark:text-purple-400 font-mono">#{targetChannel()}</span></span>
                                <span><kbd class="px-1.5 py-0.5 bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded text-[10px]">Ctrl</kbd> + <kbd class="px-1.5 py-0.5 bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 rounded text-[10px]">Enter</kbd></span>
                            </div>

                            {/* Send Action Button */}
                            <button
                                onClick={() => sendMessage()}
                                disabled={status() !== "connected" || !inputMessage().trim()}
                                class="w-full mt-4 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs uppercase tracking-widest rounded-2xl shadow-[0_4px_20px_rgba(37,99,235,0.25)] transition-all flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                    <line x1="22" y1="2" x2="11" y2="13" />
                                    <polygon points="22 2 15 22 11 13 2 9 22 2" />
                                </svg>
                                BROADCAST TO #{targetChannel()}
                            </button>

                            {/* Quick Channel Presets */}
                            <div class="mt-6 pt-5 border-t border-neutral-200 dark:border-neutral-800/80">
                                <span class="text-xs font-semibold text-neutral-600 dark:text-neutral-400 block mb-3">
                                    Multi-Channel Presets:
                                </span>
                                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    <For each={channelPresets}>
                                        {(preset) => (
                                            <button
                                                onClick={() => {
                                                    subscribeChannel(preset.channel);
                                                    setTargetChannel(preset.channel);
                                                    setInputMessage(preset.payload);
                                                    setPayloadType("json");
                                                }}
                                                class="p-2.5 text-start bg-neutral-50 dark:bg-neutral-950/60 hover:bg-neutral-100 dark:hover:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 rounded-xl text-xs font-medium text-neutral-700 dark:text-neutral-300 transition-colors cursor-pointer"
                                            >
                                                {preset.label}
                                            </button>
                                        )}
                                    </For>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Message Stream Log */}
                    <div class="lg:col-span-7 flex flex-col">
                        <div class="p-5 rounded-3xl bg-white dark:bg-neutral-900/90 border border-neutral-200 dark:border-neutral-800 flex-1 flex flex-col shadow-sm dark:shadow-xl min-h-[500px] transition-colors">
                            
                            {/* Stream Toolbar */}
                            <div class="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-neutral-200 dark:border-neutral-800">
                                <div class="flex items-center gap-2">
                                    <h2 class="text-sm font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-300 flex items-center gap-2">
                                        <svg class="size-4 text-emerald-600 dark:text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                                        </svg>
                                        Live Multi-Channel Feed
                                    </h2>
                                    <span class="text-xs font-mono text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-neutral-950 px-2 py-0.5 rounded-full border border-neutral-200 dark:border-neutral-800">
                                        {filteredMessages().length}
                                    </span>
                                </div>

                                <div class="flex items-center gap-2 flex-wrap">
                                    {/* Channel Filter */}
                                    <select
                                        value={channelFilter()}
                                        onChange={(e) => setChannelFilter(e.currentTarget.value)}
                                        class="bg-neutral-100 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 text-xs px-2 py-1 rounded-xl cursor-pointer"
                                    >
                                        <option value="all">All Channels</option>
                                        <For each={activeChannels()}>
                                            {(chan) => <option value={chan}>#{chan}</option>}
                                        </For>
                                    </select>

                                    {/* Direction Filter */}
                                    <div class="flex items-center bg-neutral-100 dark:bg-neutral-950 p-0.5 rounded-xl border border-neutral-200 dark:border-neutral-800 text-xs">
                                        <button
                                            onClick={() => setFilterType("all")}
                                            class={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                                                filterType() === "all"
                                                    ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-xs"
                                                    : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200"
                                            }`}
                                        >
                                            All
                                        </button>
                                        <button
                                            onClick={() => setFilterType("in")}
                                            class={`px-2 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                                                filterType() === "in"
                                                    ? "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 font-bold"
                                                    : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200"
                                            }`}
                                        >
                                            IN
                                        </button>
                                        <button
                                            onClick={() => setFilterType("out")}
                                            class={`px-2 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                                                filterType() === "out"
                                                    ? "bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 font-bold"
                                                    : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-200"
                                            }`}
                                        >
                                            OUT
                                        </button>
                                    </div>

                                    {/* Clear Stream Button */}
                                    <button
                                        onClick={() => setMessages([])}
                                        class="p-1.5 text-neutral-500 hover:text-rose-600 dark:text-neutral-400 dark:hover:text-rose-400 bg-neutral-100 dark:bg-neutral-950 hover:bg-neutral-200 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-800 rounded-xl transition-colors cursor-pointer"
                                        title="Clear messages"
                                        aria-label="Clear messages"
                                    >
                                        <svg class="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                            <polyline points="3 6 5 6 21 6" />
                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            {/* Message Stream Container */}
                            <div
                                ref={logContainerRef}
                                class="flex-1 overflow-y-auto max-h-[480px] my-3 pr-1 space-y-3 font-mono text-xs select-text scrollbar-thin scrollbar-thumb-neutral-300 dark:scrollbar-thumb-neutral-700 scrollbar-track-transparent"
                            >
                                <Show
                                    when={filteredMessages().length > 0}
                                    fallback={
                                        <div class="h-full min-h-[300px] flex flex-col items-center justify-center text-neutral-400 dark:text-neutral-500">
                                            <svg class="size-10 mb-2 opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                            </svg>
                                            <p class="text-sm font-sans font-medium">No messages in socket stream.</p>
                                            <p class="text-xs text-neutral-500 dark:text-neutral-600 font-sans mt-1">Join channels and publish payloads to view live traffic.</p>
                                        </div>
                                    }
                                >
                                    <For each={filteredMessages()}>
                                        {(msg) => (
                                            <div
                                                class={`p-3 rounded-2xl border transition-all ${
                                                    msg.direction === "in"
                                                        ? "bg-emerald-50/80 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-500/30 text-emerald-950 dark:text-emerald-100"
                                                        : msg.direction === "out"
                                                        ? "bg-blue-50/80 dark:bg-blue-950/20 border-blue-200 dark:border-blue-500/30 text-blue-950 dark:text-blue-100"
                                                        : "bg-neutral-100/80 dark:bg-neutral-950/40 border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-400"
                                                }`}
                                            >
                                                <div class="flex items-center justify-between gap-2 mb-1.5">
                                                    <div class="flex items-center gap-2 flex-wrap">
                                                        <span
                                                            class={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider ${
                                                                msg.direction === "in"
                                                                    ? "bg-emerald-200/80 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300"
                                                                    : msg.direction === "out"
                                                                    ? "bg-blue-200/80 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300"
                                                                    : "bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-400"
                                                            }`}
                                                        >
                                                            {msg.direction === "in" ? "▼ RECV" : msg.direction === "out" ? "▲ SENT" : "◆ SYS"}
                                                        </span>

                                                        <Show when={msg.channel}>
                                                            <span class="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 dark:bg-purple-950/50 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 font-mono">
                                                                #{msg.channel}
                                                            </span>
                                                        </Show>

                                                        <span class="text-[11px] text-neutral-500 dark:text-neutral-400">{msg.timestamp}</span>
                                                    </div>

                                                    <div class="flex items-center gap-2">
                                                        <Show when={msg.latencyMs !== undefined}>
                                                            <span class="text-[10px] text-amber-800 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/40 px-1.5 py-0.5 rounded">
                                                                {msg.latencyMs}ms
                                                            </span>
                                                        </Show>
                                                        <Show when={msg.rawSize !== undefined}>
                                                            <span class="text-[10px] text-neutral-500 dark:text-neutral-400">
                                                                {msg.rawSize}B
                                                            </span>
                                                        </Show>
                                                    </div>
                                                </div>

                                                <pre class="whitespace-pre-wrap break-all text-xs leading-relaxed text-neutral-900 dark:text-neutral-200 mt-1 font-mono">
                                                    {msg.content}
                                                </pre>
                                            </div>
                                        )}
                                    </For>
                                </Show>
                            </div>

                            {/* Stream Footer Options */}
                            <div class="pt-3 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
                                <label class="flex items-center gap-2 cursor-pointer hover:text-neutral-800 dark:hover:text-neutral-300 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={autoScroll()}
                                        onChange={(e) => setAutoScroll(e.currentTarget.checked)}
                                        class="rounded bg-neutral-100 dark:bg-neutral-950 border-neutral-300 dark:border-neutral-700 text-blue-600 focus:ring-0 size-3.5 cursor-pointer"
                                    />
                                    <span>Auto-scroll to latest</span>
                                </label>

                                <span class="font-mono text-[11px]">Salvo Multi-Channel Pub/Sub Hub</span>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
