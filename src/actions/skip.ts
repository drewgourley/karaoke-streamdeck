import { action, KeyDownEvent, SingletonAction, WillAppearEvent, WillDisappearEvent } from "@elgato/streamdeck";
import streamDeck from "@elgato/streamdeck";
import { subscribe, unsubscribe, deckAction, GlobalSettings, KaraokeState, StateCallback } from "../client";
import { renderKeyButton, svgToDataUrl } from "../button-renderer";

const ACCENT = "#00838f";

@action({ UUID: "com.karaokebrowser.plugin.skip" })
export class SkipAction extends SingletonAction {
	private inKaraokeMode = true;
	private hasTrack = false;

	private label(): string {
		return !this.inKaraokeMode ? "On Standby" : this.hasTrack ? "Skip" : "No Song";
	}

	private readonly onState: StateCallback = (state: KaraokeState) => {
		this.inKaraokeMode = state.playerMode !== "standby";
		this.hasTrack = !!state.nowPlaying;
		this.actions.forEach((act) => {
			if (!act.isKey()) return;
			act.setImage(svgToDataUrl(renderKeyButton({ emoji: "⏭", label: this.label(), accentColor: ACCENT })));
		});
	};

	override async onWillAppear(ev: WillAppearEvent): Promise<void> {
		const { serverUrl = "", sessionId = "", authToken = "" } = await streamDeck.settings.getGlobalSettings<GlobalSettings>();
		if (ev.action.isKey()) {
			ev.action.setTitle("");
			ev.action.setImage(svgToDataUrl(renderKeyButton({ emoji: "⏭", label: this.label(), accentColor: ACCENT })));
		}
		subscribe(serverUrl, sessionId, authToken, this.onState);
	}

	override async onWillDisappear(_ev: WillDisappearEvent): Promise<void> {
		unsubscribe(this.onState);
	}

	override async onKeyDown(ev: KeyDownEvent): Promise<void> {
		if (!this.inKaraokeMode || !this.hasTrack) { await ev.action.showAlert(); return; }
		const { serverUrl = "", sessionId = "", authToken = "" } = await streamDeck.settings.getGlobalSettings<GlobalSettings>();
		if (!serverUrl || !sessionId) { await ev.action.showAlert(); return; }
		const ok = deckAction(serverUrl, sessionId, authToken, "next");
		if (!ok) await ev.action.showAlert();
	}
}
