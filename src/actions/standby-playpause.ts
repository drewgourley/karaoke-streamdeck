import { action, KeyDownEvent, SingletonAction, WillAppearEvent, WillDisappearEvent } from "@elgato/streamdeck";
import streamDeck from "@elgato/streamdeck";
import { subscribe, unsubscribe, deckAction, GlobalSettings, KaraokeState, StateCallback } from "../client";
import { renderKeyButton, svgToDataUrl } from "../button-renderer";

const ACCENT = "#006064";

@action({ UUID: "com.karaokebrowser.plugin.standby-playpause" })
export class StandbyPlayPauseAction extends SingletonAction {
	private standbyPaused = false;
	private hasPlaylist = false;

	private readonly onState: StateCallback = (state: KaraokeState) => {
		this.standbyPaused = !!state.standbyPaused;
		this.hasPlaylist = !!state.standbyPlaylistId;
		this.actions.forEach((act) => {
			if (!act.isKey()) return;
			if (!this.hasPlaylist) {
				act.setImage(svgToDataUrl(renderKeyButton({ emoji: "⏸", label: "No Playlist", accentColor: ACCENT })));
			} else {
				act.setImage(svgToDataUrl(renderKeyButton({
					emoji: this.standbyPaused ? "▶️" : "⏸",
					label: this.standbyPaused ? "Play Standby" : "Pause Standby",
					accentColor: ACCENT,
					active: this.standbyPaused,
				})));
			}
		});
	};

	override async onWillAppear(ev: WillAppearEvent): Promise<void> {
		const { serverUrl = "", sessionId = "", authToken = "" } = await streamDeck.settings.getGlobalSettings<GlobalSettings>();
		if (ev.action.isKey()) {
			ev.action.setTitle("");
			if (!this.hasPlaylist) {
				ev.action.setImage(svgToDataUrl(renderKeyButton({ emoji: "⏸", label: "No Playlist", accentColor: ACCENT })));
			} else {
				ev.action.setImage(svgToDataUrl(renderKeyButton({
					emoji: this.standbyPaused ? "▶️" : "⏸",
					label: this.standbyPaused ? "Play Standby" : "Pause Standby",
					accentColor: ACCENT,
					active: this.standbyPaused,
				})));
			}
		}
		subscribe(serverUrl, sessionId, authToken, this.onState);
	}

	override async onWillDisappear(_ev: WillDisappearEvent): Promise<void> {
		unsubscribe(this.onState);
	}

	override async onKeyDown(ev: KeyDownEvent): Promise<void> {
		if (!this.hasPlaylist) { await ev.action.showAlert(); return; }
		const { serverUrl = "", sessionId = "", authToken = "" } = await streamDeck.settings.getGlobalSettings<GlobalSettings>();
		if (!serverUrl || !sessionId) { await ev.action.showAlert(); return; }
		const ok = deckAction(serverUrl, sessionId, authToken, "standby-toggle-pause");
		if (!ok) await ev.action.showAlert();
	}
}
