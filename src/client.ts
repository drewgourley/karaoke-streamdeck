/**
 * Shared WebSocket client for all karaoke-browser deck actions.
 *
 * Manages one WebSocket connection per (serverUrl, sessionId, authToken) triple,
 * distributes live state updates to subscribers, and sends action messages over
 * the same connection (role=mixer).
 *
 * Global settings (serverUrl, sessionId, authToken) are set once via the
 * Property Inspector and shared by all actions. Call reconnectAll() when they
 * change so every active subscription migrates to the new connection.
 */
import { createHash } from "node:crypto";
import WebSocket from "ws";
import streamDeck from "@elgato/streamdeck";

const logger = streamDeck.logger.createScope("client");

export type GlobalSettings = {
	serverUrl?: string;
	sessionId?: string;
	authToken?: string;
};

export type KaraokeState = {
	paused?: boolean;
	nowPlaying?: string | null;
	queue?: unknown[];
	requestMode?: string;        // "karaoke" | "standby"
	standbyPaused?: boolean;
	standbyPlaylistId?: string | null;
	micMuted?: boolean;
	playerMode?: string;         // "karaoke" | "standby"
	videoVolume?: number;
	standbyVolume?: number;
	micVolume?: number;
	[key: string]: unknown;
};

export type StateCallback = (state: KaraokeState) => void;

interface Connection {
	ws: WebSocket | null;
	callbacks: Set<StateCallback>;
	reconnectTimer: ReturnType<typeof setTimeout> | null;
	serverUrl: string;
	sessionId: string;
	authToken: string;
}

const connections = new Map<string, Connection>();

/** Tracks every active callback so reconnectAll() can re-wire them. */
const allCallbacks = new Set<StateCallback>();

function connKey(serverUrl: string, sessionId: string, authToken: string): string {
	return `${serverUrl}|${sessionId}|${authToken}`;
}

function openWs(conn: Connection): void {
	try {
		const base = conn.serverUrl.replace(/^http/, "ws").replace(/\/$/, "");
		const url = `${base}/?s=${encodeURIComponent(conn.sessionId)}&role=mixer`;

		const wsOptions: WebSocket.ClientOptions = { handshakeTimeout: 5000 };
		if (conn.authToken) {
			const hash = createHash("sha256").update(conn.authToken).digest("hex");
			wsOptions.headers = { Cookie: `kp_auth=${hash}` };
		}

		const ws = new WebSocket(url, wsOptions);
		conn.ws = ws;

		ws.on("message", (raw: WebSocket.RawData) => {
			try {
				const msg = JSON.parse(raw.toString()) as { type?: string } & KaraokeState;
				if (msg.type === "state") {
					conn.callbacks.forEach((cb) => cb(msg));
				}
			} catch {
				// malformed message — ignore
			}
		});

		ws.on("close", () => {
			conn.ws = null;
			if (conn.callbacks.size > 0) {
				conn.reconnectTimer = setTimeout(() => openWs(conn), 4000);
			}
		});

		ws.on("error", (err: Error) => {
			logger.warn(`WS error for ${conn.serverUrl}: ${err.message}`);
			ws.terminate();
		});
	} catch (err) {
		logger.warn(`Failed to open WS for ${conn.serverUrl}: ${String(err)}`);
	}
}

/**
 * Subscribe a callback to live state updates.
 * If the callback is already subscribed (possibly on a different connection),
 * it is moved to the new (serverUrl, sessionId, authToken) connection first.
 */
export function subscribe(serverUrl: string, sessionId: string, authToken: string, cb: StateCallback): void {
	if (!serverUrl || !sessionId) return;
	// Move callback away from any existing connection before re-subscribing.
	unsubscribe(cb);

	const k = connKey(serverUrl, sessionId, authToken);
	let conn = connections.get(k);
	if (!conn) {
		conn = { ws: null, callbacks: new Set(), reconnectTimer: null, serverUrl, sessionId, authToken };
		connections.set(k, conn);
		openWs(conn);
	}
	conn.callbacks.add(cb);
	allCallbacks.add(cb);
}

/**
 * Unsubscribe a callback identified by reference.
 * Finds the owning connection automatically — no serverUrl/sessionId needed.
 * Closes the WS when no more subscribers remain on that connection.
 */
export function unsubscribe(cb: StateCallback): void {
	for (const [k, conn] of connections) {
		if (!conn.callbacks.has(cb)) continue;
		conn.callbacks.delete(cb);
		allCallbacks.delete(cb);
		if (conn.callbacks.size === 0) {
			if (conn.reconnectTimer !== null) clearTimeout(conn.reconnectTimer);
			conn.ws?.close();
			connections.delete(k);
		}
		return;
	}
}

/**
 * Re-subscribe every active callback to a new (serverUrl, sessionId, authToken).
 * Called by plugin.ts when the user changes global settings.
 */
export function reconnectAll(settings: GlobalSettings): void {
	const { serverUrl = "", sessionId = "", authToken = "" } = settings;
	if (!serverUrl || !sessionId) return;
	const cbs = [...allCallbacks];
	for (const cb of cbs) {
		subscribe(serverUrl, sessionId, authToken, cb);
	}
}

/**
 * Send an action message over the active WebSocket for (serverUrl, sessionId, authToken).
 * Returns true if the message was sent successfully.
 */
export function deckAction(
	serverUrl: string,
	sessionId: string,
	authToken: string,
	action: string,
	body?: Record<string, unknown>
): boolean {
	if (!serverUrl || !sessionId) return false;
	const k = connKey(serverUrl, sessionId, authToken);
	const conn = connections.get(k);
	if (!conn?.ws || conn.ws.readyState !== WebSocket.OPEN) {
		logger.warn(`deck action "${action}" skipped: WS not open for ${serverUrl}`);
		return false;
	}
	try {
		conn.ws.send(JSON.stringify({ type: action, ...body }));
		return true;
	} catch (err) {
		logger.warn(`deck action "${action}" send error: ${String(err)}`);
		return false;
	}
}
