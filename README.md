# Karaoke Browser — Stream Deck Plugin

A Stream Deck plugin for [Karaoke Browser](https://github.com/drewgourley/karaoke-browser) that gives the host full mixer control from their deck without touching a keyboard.

## Actions

| Action | Controllers | Description |
|---|---|---|
| **Play / Pause** | Key | Toggle play/pause for the current karaoke song |
| **Skip Song** | Key | Skip to the next song in the queue |
| **Restart Song** | Key | Restart the current song from the beginning |
| **Requeue Song** | Key | Send the current song to the end of the queue and skip |
| **Player Mode** | Key | Toggle between Karaoke and Standby mode |
| **Standby Play/Pause** | Key | Toggle play/pause for standby background music |
| **Standby Skip** | Key | Skip the current standby track |
| **Mic Mute** | Key | Toggle microphone mute |
| **Video Volume** | Encoder | Rotate to adjust · Press to reset to 100% |
| **Standby Volume** | Encoder | Rotate to adjust · Press to reset to 50% |
| **Mic Volume** | Encoder | Rotate to adjust · Press to reset to 100% |

All key buttons render a live SVG preview on the key face showing the current state (playing/paused, muted, active mode, volume level, etc.).

## Requirements

- [Stream Deck](https://www.elgato.com/stream-deck) hardware with Stream Deck app ≥ 6.6
- [Karaoke Browser](https://github.com/drewgourley/karaoke-browser) server running and accessible
- [Node.js](https://nodejs.org/) 20+ (for building from source)

## Installation

### From source

```bash
git clone https://github.com/drewgourley/karaoke-streamdeck.git
cd karaoke-streamdeck
npm install
npm run build
npm run link          # installs the plugin into the Stream Deck app
```

After linking, restart the Stream Deck app. The **Karaoke Browser** category will appear in the action list.

### Configuration

Each action has a Property Inspector where you set:

- **Server URL** — the base URL of your Karaoke Browser instance (e.g. `http://192.168.1.10:3000`)
- **Session ID** — the session identifier shown in the Karaoke Browser player URL

## Development

```bash
npm run build      # compile TypeScript + generate icon PNGs
npm run watch      # rebuild on file changes
```

### Project structure

```
src/
  plugin.ts           # entry point — registers all actions
  client.ts           # shared WebSocket client (role=mixer)
  button-renderer.ts  # SVG renderer for key faces and encoder strips
  actions/            # one file per Stream Deck action
scripts/
  create-icons.mjs    # generates PNG icons from inline SVG paths
com.karaokebrowser.plugin.sdPlugin/
  manifest.json       # Stream Deck plugin manifest
  ui/                 # Property Inspector HTML
  layouts/            # encoder touch-strip layout
  imgs/               # generated icon PNGs (output of create-icons.mjs)
```

> **Note:** `com.karaokebrowser.plugin.sdPlugin/bin/plugin.js` is a build artifact. Run `npm run build` to generate it.

## Disclaimer

This is an independent project. It is not affiliated with, endorsed by or sponsored by Elgato, Corsair or YouTube. Stream Deck is a
trademark of its owner, and YouTube is a trademark of Google LLC. Other product names are used only to say what this plugin works with.

## License

Released under the [MIT License](LICENSE).
