import { action, KeyDownEvent, SingletonAction, WillAppearEvent, WillDisappearEvent } from "@elgato/streamdeck";
import streamDeck from "@elgato/streamdeck";
import { subscribe, unsubscribe, deckAction, GlobalSettings, KaraokeState, StateCallback } from "../client";
import { renderKeyButton, svgToDataUrl } from "../button-renderer";

const ACCENT = "#1565c0";

@action({ UUID: "com.karaokebrowser.plugin.toggle-pause" })
export class TogglePauseAction extends SingletonAction {
	private readonly onState: StateCallback = (state: KaraokeState) => {
		const paused = !!state.paused;
		const hasTrack = !!state.nowPlaying;
		this.actions.forEach((act) => {
			if (!act.isKey()) return;
			act.setImage(svgToDataUrl(renderKeyButton({
				emoji: paused ? "▶️" : "⏸",
				label: hasTrack ? (paused ? "Begin" : "Pause") : "No Song",
				accentColor: ACCENT,
				active: paused && hasTrack,
			})));
		});
	};

	override async onWillAppear(ev: WillAppearEvent): Promise<void> {
		const { serverUrl = "", sessionId = "", authToken = "" } = await streamDeck.settings.getGlobalSettings<GlobalSettings>();
		if (ev.action.isKey()) {
			ev.action.setTitle("");
			ev.action.setImage(svgToDataUrl(renderKeyButton({ emoji: "⏸", label: "Pause", accentColor: ACCENT })));
		}
		subscribe(serverUrl, sessionId, authToken, this.onState);
	}

	override async onWillDisappear(_ev: WillDisappearEvent): Promise<void> {
		unsubscribe(this.onState);
	}

	override async onKeyDown(ev: KeyDownEvent): Promise<void> {
		const { serverUrl = "", sessionId = "", authToken = "" } = await streamDeck.settings.getGlobalSettings<GlobalSettings>();
		if (!serverUrl || !sessionId) { await ev.action.showAlert(); return; }
		const ok = deckAction(serverUrl, sessionId, authToken, "toggle-pause");
		if (!ok) await ev.action.showAlert();
	}
}
