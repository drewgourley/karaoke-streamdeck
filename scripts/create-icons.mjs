/**
 * Generates styled PNG icon files for the Stream Deck plugin.
 * Each icon uses a dark gradient background + SVG path shape + accent bar + optional label.
 * Uses @resvg/resvg-js for SVG→PNG rendering (loads system fonts).
 * Run: node scripts/create-icons.mjs
 */
import { Resvg } from "@resvg/resvg-js";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const IMGS_DIR = join(__dirname, "..", "com.karaokebrowser.plugin.sdPlugin", "imgs");

// ---------------------------------------------------------------------------
// Icon shapes — drawn in a 72×72 coordinate space.
// Content occupies roughly y=8..56; accent bar sits at y=68; label at y=62.
// All strokes/fills use "white" so the shapes look great on the dark background.
// ---------------------------------------------------------------------------
const S = {
	pause: `
		<rect x="20" y="10" width="11" height="36" rx="3" fill="white"/>
		<rect x="41" y="10" width="11" height="36" rx="3" fill="white"/>`,

	next: `
		<polygon points="12,10 40,33 12,56" fill="white"/>
		<rect x="43" y="10" width="9" height="46" rx="3" fill="white"/>`,

	prev: `
		<rect x="20" y="10" width="9" height="46" rx="3" fill="white"/>
		<polygon points="60,10 32,33 60,56" fill="white"/>`,

	requeue: `
		<path d="M36,10 A22,22 0 1,1 14,32" stroke="white" stroke-width="5.5" fill="none" stroke-linecap="round"/>
		<polygon points="7,25 7,42 22,33" fill="white"/>`,

	mic: `
		<rect x="27" y="8" width="18" height="24" rx="9" fill="white"/>
		<path d="M14,30 Q14,48 36,48 Q58,48 58,30" stroke="white" stroke-width="4.5" fill="none" stroke-linecap="round"/>
		<line x1="36" y1="48" x2="36" y2="56" stroke="white" stroke-width="4.5" stroke-linecap="round"/>
		<line x1="22" y1="56" x2="50" y2="56" stroke="white" stroke-width="4.5" stroke-linecap="round"/>`,

	micMute: `
		<rect x="27" y="8" width="18" height="24" rx="9" fill="white"/>
		<path d="M14,30 Q14,48 36,48 Q58,48 58,30" stroke="white" stroke-width="4.5" fill="none" stroke-linecap="round"/>
		<line x1="36" y1="48" x2="36" y2="56" stroke="white" stroke-width="4.5" stroke-linecap="round"/>
		<line x1="22" y1="56" x2="50" y2="56" stroke="white" stroke-width="4.5" stroke-linecap="round"/>
		<line x1="16" y1="8" x2="56" y2="56" stroke="#ef5350" stroke-width="5.5" stroke-linecap="round"/>`,

	video: `
		<rect x="10" y="16" width="34" height="28" rx="4" fill="none" stroke="white" stroke-width="4"/>
		<polygon points="46,18 62,10 62,50 46,42" fill="white"/>
		<circle cx="27" cy="30" r="7" fill="white"/>
		<circle cx="27" cy="30" r="3" fill="#111926"/>`,

	music: `
		<line x1="28" y1="14" x2="56" y2="9" stroke="white" stroke-width="4.5" stroke-linecap="round"/>
		<line x1="28" y1="14" x2="28" y2="44" stroke="white" stroke-width="4.5" stroke-linecap="round"/>
		<line x1="56" y1="9"  x2="56" y2="36" stroke="white" stroke-width="4.5" stroke-linecap="round"/>
		<ellipse cx="22" cy="46" rx="10" ry="6.5" fill="white" transform="rotate(-15,22,46)"/>
		<ellipse cx="50" cy="38" rx="10" ry="6.5" fill="white" transform="rotate(-15,50,38)"/>`,
};

// ---------------------------------------------------------------------------
// SVG template: dark gradient bg + shape + accent bar + optional label
// ---------------------------------------------------------------------------
function renderSvg(shape, accentColor, label, size) {
	return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 72 72">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#111926"/>
      <stop offset="100%" stop-color="#080e18"/>
    </linearGradient>
  </defs>
  <rect x="0.5" y="0.5" width="71" height="71" rx="5" fill="url(#bg)"/>
  <rect x="14" y="68" width="44" height="2.5" rx="1.25" fill="${accentColor}" opacity="0.9"/>
  ${shape}
  ${label ? `<text x="36" y="62" text-anchor="middle" dy="0.35em"
      font-size="9.5" font-family="Segoe UI,Helvetica Neue,sans-serif"
      font-weight="600" fill="#cdd9e8">${label}</text>` : ""}
</svg>`.trim();
}

function toPng(svg) {
	const resvg = new Resvg(svg, { font: { loadSystemFonts: true } });
	return resvg.render().asPng();
}

// ---------------------------------------------------------------------------
// Action definitions
// ---------------------------------------------------------------------------
const ACTIONS = [
	{ name: "toggle-pause",      shape: S.pause,   accentColor: "#1565c0", label: "Play/Pause"  },
	{ name: "skip",              shape: S.next,    accentColor: "#00838f", label: "Skip"         },
	{ name: "restart",           shape: S.prev,    accentColor: "#e65100", label: "Restart"      },
	{ name: "requeue",           shape: S.requeue, accentColor: "#6a1b9a", label: "Requeue"      },
	{ name: "player-mode",       shape: S.mic,     accentColor: "#ad1457", label: "Mode"         },
	{ name: "standby-playpause", shape: S.pause,   accentColor: "#006064", label: "Music Play"   },
	{ name: "standby-skip",      shape: S.next,    accentColor: "#00695c", label: "Skip Music"   },
	{ name: "mic-mute",          shape: S.micMute, accentColor: "#2e7d32", label: "Mic Mute"     },
	{ name: "video-volume",      shape: S.video,   accentColor: "#283593", label: "Video Vol"    },
	{ name: "standby-volume",    shape: S.music,   accentColor: "#00695c", label: "Music Vol"    },
	{ name: "mic-volume",        shape: S.mic,     accentColor: "#880e4f", label: "Mic Vol"      },
];

// ---------------------------------------------------------------------------
// Generate PNGs
// ---------------------------------------------------------------------------
let count = 0;

for (const { name, shape, accentColor, label } of ACTIONS) {
	const dir = join(IMGS_DIR, "actions", name);
	mkdirSync(dir, { recursive: true });

	// icon.png (28×28) and @2x (56×56) — no label, shown in the action list sidebar
	writeFileSync(join(dir, "icon.png"),    toPng(renderSvg(shape, accentColor, null, 28)));
	writeFileSync(join(dir, "icon@2x.png"), toPng(renderSvg(shape, accentColor, null, 56)));

	// key.png (72×72) and @2x (144×144) — with label, default button state image
	writeFileSync(join(dir, "key.png"),     toPng(renderSvg(shape, accentColor, label, 72)));
	writeFileSync(join(dir, "key@2x.png"),  toPng(renderSvg(shape, accentColor, label, 144)));

	count += 4;
}

// Plugin category icon
{
	const dir = join(IMGS_DIR, "plugin");
	mkdirSync(dir, { recursive: true });
	writeFileSync(join(dir, "icon.png"),    toPng(renderSvg(S.mic, "#ad1457", null, 28)));
	writeFileSync(join(dir, "icon@2x.png"), toPng(renderSvg(S.mic, "#ad1457", null, 56)));
	count += 2;
}

console.log(`Generated ${count} icon PNG files.`);
