import { action, KeyDownEvent, SingletonAction, WillAppearEvent, WillDisappearEvent } from "@elgato/streamdeck";
import streamDeck from "@elgato/streamdeck";
import { subscribe, unsubscribe, deckAction, GlobalSettings, KaraokeState, StateCallback } from "../client";
import { renderKeyButton, svgToDataUrl } from "../button-renderer";

const ACCENT = "#6a1b9a";

@action({ UUID: "com.karaokebrowser.plugin.requeue" })
export class RequeueAction extends SingletonAction {
	private hasTrack = false;
	private hasQueue = false;

	private readonly onState: StateCallback = (state: KaraokeState) => {
		this.hasTrack = !!state.nowPlaying;
		this.hasQueue = (state.queue?.length ?? 0) > 0;
		const label = !this.hasTrack ? "No Song" : this.hasQueue ? "Requeue" : "No Queue";
		this.actions.forEach((act) => {
			if (!act.isKey()) return;
			act.setImage(svgToDataUrl(renderKeyButton({ emoji: "🔄", label, accentColor: ACCENT })));
		});
	};

	override async onWillAppear(ev: WillAppearEvent): Promise<void> {
		const { serverUrl = "", sessionId = "", authToken = "" } = await streamDeck.settings.getGlobalSettings<GlobalSettings>();
		if (ev.action.isKey()) {
			ev.action.setTitle("");
			const label = !this.hasTrack ? "No Song" : this.hasQueue ? "Requeue" : "No Queue";
			ev.action.setImage(svgToDataUrl(renderKeyButton({ emoji: "🔄", label, accentColor: ACCENT })));
		}
		subscribe(serverUrl, sessionId, authToken, this.onState);
	}

	override async onWillDisappear(_ev: WillDisappearEvent): Promise<void> {
		unsubscribe(this.onState);
	}

	override async onKeyDown(ev: KeyDownEvent): Promise<void> {
		if (!this.hasTrack) { await ev.action.showAlert(); return; }
		const { serverUrl = "", sessionId = "", authToken = "" } = await streamDeck.settings.getGlobalSettings<GlobalSettings>();
		if (!serverUrl || !sessionId) { await ev.action.showAlert(); return; }
		const ok = deckAction(serverUrl, sessionId, authToken, "requeue");
		if (!ok) await ev.action.showAlert();
	}
}
