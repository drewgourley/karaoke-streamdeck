import { action, KeyDownEvent, SingletonAction, WillAppearEvent, WillDisappearEvent } from "@elgato/streamdeck";
import streamDeck from "@elgato/streamdeck";
import { subscribe, unsubscribe, deckAction, GlobalSettings, KaraokeState, StateCallback } from "../client";
import { renderKeyButton, svgToDataUrl } from "../button-renderer";

const ACCENT_KARAOKE = "#ad1457";
const ACCENT_STANDBY = "#1565c0";

@action({ UUID: "com.karaokebrowser.plugin.player-mode" })
export class PlayerModeAction extends SingletonAction {
	private readonly onState: StateCallback = (state: KaraokeState) => {
		const isKaraoke = state.playerMode === "karaoke";
		this.actions.forEach((act) => {
			if (!act.isKey()) return;
			act.setImage(svgToDataUrl(renderKeyButton({
				emoji: isKaraoke ? "🎤" : "📺",
				label: isKaraoke ? "Karaoke" : "Standby",
				accentColor: isKaraoke ? ACCENT_KARAOKE : ACCENT_STANDBY,
				active: !isKaraoke,
			})));
		});
	};

	override async onWillAppear(ev: WillAppearEvent): Promise<void> {
		const { serverUrl = "", sessionId = "", authToken = "" } = await streamDeck.settings.getGlobalSettings<GlobalSettings>();
		if (ev.action.isKey()) {
			ev.action.setTitle("");
			ev.action.setImage(svgToDataUrl(renderKeyButton({ emoji: "🎤", label: "Karaoke", accentColor: ACCENT_KARAOKE })));
		}
		subscribe(serverUrl, sessionId, authToken, this.onState);
	}

	override async onWillDisappear(_ev: WillDisappearEvent): Promise<void> {
		unsubscribe(this.onState);
	}

	override async onKeyDown(ev: KeyDownEvent): Promise<void> {
		const { serverUrl = "", sessionId = "", authToken = "" } = await streamDeck.settings.getGlobalSettings<GlobalSettings>();
		if (!serverUrl || !sessionId) { await ev.action.showAlert(); return; }
		const ok = deckAction(serverUrl, sessionId, authToken, "toggle-player-mode");
		if (!ok) await ev.action.showAlert();
	}
}
