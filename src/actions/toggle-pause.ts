import { action, KeyDownEvent, SingletonAction, WillAppearEvent, WillDisappearEvent } from "@elgato/streamdeck";
import streamDeck from "@elgato/streamdeck";
import { subscribe, unsubscribe, deckAction, GlobalSettings, KaraokeState, StateCallback } from "../client";
import { renderKeyButton, svgToDataUrl } from "../button-renderer";

const ACCENT = "#1565c0";

@action({ UUID: "com.karaokebrowser.plugin.toggle-pause" })
export class TogglePauseAction extends SingletonAction {
	private inKaraokeMode = true;
	private paused = false;
	private hasTrack = false;

	private readonly onState: StateCallback = (state: KaraokeState) => {
		this.inKaraokeMode = state.playerMode !== "standby";
		this.paused = !!state.paused;
		this.hasTrack = !!state.nowPlaying;
		this.actions.forEach((act) => {
			if (!act.isKey()) return;
			act.setImage(svgToDataUrl(renderKeyButton({
				emoji: this.paused ? "▶️" : "⏸",
				label: !this.inKaraokeMode ? "On Standby" : this.hasTrack ? (this.paused ? "Begin" : "Pause") : "No Song",
				accentColor: ACCENT,
				active: this.inKaraokeMode && this.paused && this.hasTrack,
			})));
		});
	};

	private keyLabel(): string {
		return !this.inKaraokeMode ? "On Standby" : this.hasTrack ? (this.paused ? "Begin" : "Pause") : "No Song";
	}

	override async onWillAppear(ev: WillAppearEvent): Promise<void> {
		const { serverUrl = "", sessionId = "", authToken = "" } = await streamDeck.settings.getGlobalSettings<GlobalSettings>();
		if (ev.action.isKey()) {
			ev.action.setTitle("");
			ev.action.setImage(svgToDataUrl(renderKeyButton({
				emoji: this.paused ? "▶️" : "⏸",
				label: this.keyLabel(),
				accentColor: ACCENT,
				active: this.inKaraokeMode && this.paused && this.hasTrack,
			})));
		}
		subscribe(serverUrl, sessionId, authToken, this.onState);
	}

	override async onWillDisappear(_ev: WillDisappearEvent): Promise<void> {
		unsubscribe(this.onState);
	}

	override async onKeyDown(ev: KeyDownEvent): Promise<void> {
		if (!this.inKaraokeMode) { await ev.action.showAlert(); return; }
		const { serverUrl = "", sessionId = "", authToken = "" } = await streamDeck.settings.getGlobalSettings<GlobalSettings>();
		if (!serverUrl || !sessionId) { await ev.action.showAlert(); return; }
		const ok = deckAction(serverUrl, sessionId, authToken, "toggle-pause");
		if (!ok) await ev.action.showAlert();
	}
}
