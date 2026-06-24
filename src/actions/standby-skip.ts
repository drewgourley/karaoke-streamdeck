import { action, KeyDownEvent, SingletonAction, WillAppearEvent, WillDisappearEvent } from "@elgato/streamdeck";
import streamDeck from "@elgato/streamdeck";
import { subscribe, unsubscribe, deckAction, GlobalSettings, KaraokeState, StateCallback } from "../client";
import { renderKeyButton, svgToDataUrl } from "../button-renderer";

const ACCENT = "#00695c";

@action({ UUID: "com.karaokebrowser.plugin.standby-skip" })
export class StandbySkipAction extends SingletonAction {
	private hasPlaylist = false;

	private readonly onState: StateCallback = (state: KaraokeState) => {
		this.hasPlaylist = !!state.standbyPlaylistId;
		this.actions.forEach((act) => {
			if (!act.isKey()) return;
			act.setImage(svgToDataUrl(renderKeyButton({
				emoji: "⏭",
				label: this.hasPlaylist ? "Skip Music" : "No Playlist",
				accentColor: ACCENT,
			})));
		});
	};

	override async onWillAppear(ev: WillAppearEvent): Promise<void> {
		const { serverUrl = "", sessionId = "", authToken = "" } = await streamDeck.settings.getGlobalSettings<GlobalSettings>();
		if (ev.action.isKey()) {
			ev.action.setTitle("");
			ev.action.setImage(svgToDataUrl(renderKeyButton({ emoji: "⏭", label: this.hasPlaylist ? "Skip Music" : "No Playlist", accentColor: ACCENT })));
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
		const ok = deckAction(serverUrl, sessionId, authToken, "standby-skip");
		if (!ok) await ev.action.showAlert();
	}
}
