import streamDeck from "@elgato/streamdeck";

import { GlobalSettings, reconnectAll } from "./client";
import { TogglePauseAction }    from "./actions/toggle-pause";
import { SkipAction }           from "./actions/skip";
import { RestartAction }        from "./actions/restart";
import { RequeueAction }        from "./actions/requeue";
import { PlayerModeAction }     from "./actions/player-mode";
import { StandbyPlayPauseAction } from "./actions/standby-playpause";
import { StandbySkipAction }    from "./actions/standby-skip";
import { MicMuteAction }        from "./actions/mic-mute";
import { VideoVolumeAction }    from "./actions/video-volume";
import { StandbyVolumeAction }  from "./actions/standby-volume";
import { MicVolumeAction }      from "./actions/mic-volume";

// Register all actions before connecting — order matters per SDK docs.
streamDeck.actions.registerAction(new TogglePauseAction());
streamDeck.actions.registerAction(new SkipAction());
streamDeck.actions.registerAction(new RestartAction());
streamDeck.actions.registerAction(new RequeueAction());
streamDeck.actions.registerAction(new PlayerModeAction());
streamDeck.actions.registerAction(new StandbyPlayPauseAction());
streamDeck.actions.registerAction(new StandbySkipAction());
streamDeck.actions.registerAction(new MicMuteAction());
streamDeck.actions.registerAction(new VideoVolumeAction());
streamDeck.actions.registerAction(new StandbyVolumeAction());
streamDeck.actions.registerAction(new MicVolumeAction());

// When the user updates global settings (serverUrl, sessionId, authToken),
// migrate all active WS subscriptions to the new connection.
streamDeck.settings.onDidReceiveGlobalSettings(({ settings }) => {
	reconnectAll(settings as GlobalSettings);
});

streamDeck.connect();
