import { action, KeyDownEvent, SingletonAction, WillAppearEvent, WillDisappearEvent } from "@elgato/streamdeck";
import streamDeck from "@elgato/streamdeck";
import { subscribe, unsubscribe, deckAction, GlobalSettings, KaraokeState, StateCallback } from "../client";
import { renderKeyButton, svgToDataUrl } from "../button-renderer";

const ACCENT_LIVE  = "#2e7d32";
const ACCENT_MUTED = "#b71c1c";

@action({ UUID: "com.karaokebrowser.plugin.mic-mute" })
export class MicMuteAction extends SingletonAction {
	private micMuted = false;

	private readonly onState: StateCallback = (state: KaraokeState) => {
		const muted = !!state.micMuted;
		this.micMuted = muted;
		this.actions.forEach((act) => {
			if (!act.isKey()) return;
			act.setImage(svgToDataUrl(renderKeyButton({
				emoji: muted ? "🔇" : "🎙",
				label: muted ? "Mic Muted" : "Mic Open",
				accentColor: muted ? ACCENT_MUTED : ACCENT_LIVE,
				active: muted,
			})));
		});
	};

	override async onWillAppear(ev: WillAppearEvent): Promise<void> {
		const { serverUrl = "", sessionId = "", authToken = "" } = await streamDeck.settings.getGlobalSettings<GlobalSettings>();
		if (ev.action.isKey()) {
			ev.action.setTitle("");
			// Use last-known mute state so re-appearing buttons don't flash the wrong icon.
			ev.action.setImage(svgToDataUrl(renderKeyButton({
				emoji: this.micMuted ? "🔇" : "🎙",
				label: this.micMuted ? "Mic Muted" : "Mic Open",
				accentColor: this.micMuted ? ACCENT_MUTED : ACCENT_LIVE,
				active: this.micMuted,
			})));
		}
		subscribe(serverUrl, sessionId, authToken, this.onState);
	}

	override async onWillDisappear(_ev: WillDisappearEvent): Promise<void> {
		unsubscribe(this.onState);
	}

	override async onKeyDown(ev: KeyDownEvent): Promise<void> {
		const { serverUrl = "", sessionId = "", authToken = "" } = await streamDeck.settings.getGlobalSettings<GlobalSettings>();
		if (!serverUrl || !sessionId) { await ev.action.showAlert(); return; }
		// Toggle: send explicit muted value based on tracked state
		const ok = deckAction(serverUrl, sessionId, authToken, "mic-mute", { muted: !this.micMuted });
		if (!ok) await ev.action.showAlert();
	}
}
