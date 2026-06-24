import {
	action,
	DialRotateEvent,
	DialDownEvent,
	SingletonAction,
	WillAppearEvent,
	WillDisappearEvent
} from "@elgato/streamdeck";
import streamDeck from "@elgato/streamdeck";
import { subscribe, unsubscribe, deckAction, GlobalSettings, KaraokeState, StateCallback } from "../client";
import { renderEncoderStrip, renderKeyButton, svgToDataUrl } from "../button-renderer";

type Settings = { step?: number };

const ACCENT = "#880e4f";

/**
 * Microphone volume dial (Stream Deck + encoder).
 * Rotate → delta volume. Press → reset to 80%.
 */
@action({ UUID: "com.karaokebrowser.plugin.mic-volume" })
export class MicVolumeAction extends SingletonAction<Settings> {
	private currentVolume = 80;

	private readonly onState: StateCallback = (state: KaraokeState) => {
		const vol = typeof state.micVolume === "number" ? state.micVolume : this.currentVolume;
		this.currentVolume = vol;
		this.actions.forEach((act) => {
			if (!act.isDial()) return;
			act.setFeedback({ full: svgToDataUrl(renderEncoderStrip({
				label: "Mic Volume",
				value: `${Math.round(vol)}%`,
				indicatorPct: Math.min(100, Math.max(0, vol)),
				accentColor: ACCENT,
			})) });
		});
	};

	override async onWillAppear(ev: WillAppearEvent<Settings>): Promise<void> {
		const { serverUrl = "", sessionId = "", authToken = "" } = await streamDeck.settings.getGlobalSettings<GlobalSettings>();
		if (ev.action.isKey()) ev.action.setTitle("");
		if (ev.action.isDial()) ev.action.setFeedback({ full: svgToDataUrl(renderEncoderStrip({ label: "Mic Volume", value: "–", indicatorPct: 0, accentColor: ACCENT })) });
		if (ev.action.isKey()) ev.action.setImage(svgToDataUrl(renderKeyButton({ emoji: "🎙", label: "Mic Volume", accentColor: ACCENT })));
		subscribe(serverUrl, sessionId, authToken, this.onState);
	}

	override async onWillDisappear(_ev: WillDisappearEvent<Settings>): Promise<void> {
		unsubscribe(this.onState);
	}

	override async onDialRotate(ev: DialRotateEvent<Settings>): Promise<void> {
		const { serverUrl = "", sessionId = "", authToken = "" } = await streamDeck.settings.getGlobalSettings<GlobalSettings>();
		if (!serverUrl || !sessionId) return;
		const step = ev.payload.settings.step ?? 5;
		const delta = ev.payload.ticks * step;
		const newVol = Math.round(Math.max(0, Math.min(100, this.currentVolume + delta)));
		deckAction(serverUrl, sessionId, authToken, "set-mic-volume", { volume: newVol });
	}

	// Press the dial → reset to 80%
	override async onDialDown(ev: DialDownEvent<Settings>): Promise<void> {
		const { serverUrl = "", sessionId = "", authToken = "" } = await streamDeck.settings.getGlobalSettings<GlobalSettings>();
		if (!serverUrl || !sessionId) return;
		deckAction(serverUrl, sessionId, authToken, "set-mic-volume", { volume: 80 });
	}
}
