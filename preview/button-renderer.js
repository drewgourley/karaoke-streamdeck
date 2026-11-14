var BtnRenderer = (function (exports) {
  'use strict';

  /**
   * button-renderer.ts
   *
   * Canonical source for all button visuals in the plugin.
   * The preview page (preview/index.html) uses the JS-equivalent inline;
   * keep both in sync when changing styles.
   *
   * Stream Deck key buttons: 72×72 px
   * Stream Deck + encoder strips ($B2 layout): 200×100 px
   */
  // ---------------------------------------------------------------------------
  // Colour helpers
  // ---------------------------------------------------------------------------
  function hexToRgb(hex) {
      const n = parseInt(hex.replace("#", ""), 16);
      return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
  }
  function rgbToHex(r, g, b) {
      return "#" + [r, g, b].map((v) => Math.min(255, Math.max(0, Math.round(v))).toString(16).padStart(2, "0")).join("");
  }
  function lighten(hex, amt) {
      const [r, g, b] = hexToRgb(hex);
      return rgbToHex(r + amt, g + amt, b + amt);
  }
  function darken(hex, amt) {
      return lighten(hex, -28);
  }
  function alpha(hex, a) {
      const [r, g, b] = hexToRgb(hex);
      return `rgba(${r},${g},${b},${a})`;
  }
  // ---------------------------------------------------------------------------
  // Per-render unique ID counter  (prevents gradient/filter ID conflicts when
  // Stream Deck processes multiple button SVGs in the same rendering context)
  // ---------------------------------------------------------------------------
  let _uid = 0;
  function uid() { return `r${_uid++}`; }
  // ---------------------------------------------------------------------------
  // Key button  (72×72)
  // ---------------------------------------------------------------------------
  function renderKeyButton(opts) {
      const { emoji, label, sublabel, accentColor, active = false, indicator, size = 72 } = opts;
      const s = size / 72; // scale factor
      const id = uid();
      const bg0 = active ? accentColor : "#111926";
      const bg1 = active ? darken(accentColor) : "#080e18";
      const textMain = active ? "#ffffff" : "#cdd9e8";
      const textSub = active ? "rgba(255,255,255,0.7)" : "#5a7a9a";
      const border = active ? `stroke="${lighten(accentColor, 30)}" stroke-width="${1.5 * s}"` : "";
      const emojiY = (sublabel ? 30 : 34) * s;
      const labelY = (sublabel ? 54 : 62) * s;
      const emojiSize = 26 * s;
      const labelSize = 9.5 * s;
      const sublabelSize = 8.5 * s;
      const accentBar = !active
          ? `<rect x="${14 * s}" y="${68 * s}" width="${44 * s}" height="${2.5 * s}" rx="${1.25 * s}" fill="${accentColor}" opacity="0.9"/>`
          : "";
      const indicatorEl = indicator !== undefined
          ? `<text x="${size / 2}" y="${18 * s}" dy="0.35em" text-anchor="middle" font-size="${7 * s}" fill="${textSub}" font-family="sans-serif">${indicator}%</text>`
          : "";
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
  <defs>
    <linearGradient id="bg${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${bg0}"/>
      <stop offset="100%" stop-color="${bg1}"/>
    </linearGradient>
  </defs>
  <rect x="0.5" y="0.5" width="${size - 1}" height="${size - 1}" rx="${5 * s}" fill="url(#bg${id})" ${border}/>
  ${accentBar}
  ${indicatorEl}
  <text x="${size / 2}" y="${emojiY}" dy="0.35em" text-anchor="middle"
        font-size="${emojiSize}" font-family="'Segoe UI Emoji','Apple Color Emoji',sans-serif">${emoji}</text>
  <text x="${size / 2}" y="${labelY}" dy="0.35em" text-anchor="middle"
        font-size="${labelSize}" font-family="'Segoe UI','Helvetica Neue',sans-serif"
        font-weight="600" fill="${textMain}">${label}</text>
  ${sublabel ? `<text x="${size / 2}" y="${62 * s}" dy="0.35em" text-anchor="middle" font-size="${sublabelSize}" font-family="'Segoe UI','Helvetica Neue',sans-serif" fill="${textSub}">${sublabel}</text>` : ""}
</svg>`.trim();
  }
  // ---------------------------------------------------------------------------
  // Encoder strip  ($B2 layout, 200×100)
  // ---------------------------------------------------------------------------
  function renderEncoderStrip(opts) {
      const { label, value, indicatorPct, accentColor, width = 200, height = 100 } = opts;
      const id = uid();
      const s = width / 200; // scale factor — mirrors renderKeyButton pattern
      const clampedPct = Math.min(100, Math.max(0, indicatorPct));
      const barX = 12 * s, barH = 14 * s, barY = height - barH - 10 * s;
      const barW = width - 24 * s;
      const fillW = barW * clampedPct / 100;
      const fillColor = accentColor;
      const trackColor = "#1a2a3a";
      const glowColor = alpha(accentColor, 0.35);
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <defs>
    <linearGradient id="bg${id}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#131f2e"/>
      <stop offset="100%" stop-color="#080e18"/>
    </linearGradient>
    <filter id="glow${id}">
      <feGaussianBlur stdDeviation="${2 * s}" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#bg${id})"/>

  <!-- label -->
  <text x="${12 * s}" y="${24 * s}" font-size="${16 * s}" font-family="'Segoe UI','Helvetica Neue',sans-serif"
        font-weight="600" fill="#cdd9e8">${label}</text>

  <!-- value -->
  <text x="${width - 12 * s}" y="${barY - 5 * s}" text-anchor="end"
        font-size="${28 * s}" font-family="'Segoe UI','Helvetica Neue',sans-serif"
        font-weight="700" fill="#dce8f5">${value}</text>

  <!-- bar track -->
  <rect x="${barX}" y="${barY}" width="${barW}" height="${barH}" rx="${barH / 2}" fill="${trackColor}"/>

  <!-- bar glow layer -->
  ${fillW > 0 ? `<rect x="${barX}" y="${barY}" width="${fillW}" height="${barH}" rx="${barH / 2}" fill="${glowColor}" filter="url(#glow${id})"/>` : ""}

  <!-- bar fill -->
  ${fillW > 0 ? `<rect x="${barX}" y="${barY}" width="${fillW}" height="${barH}" rx="${barH / 2}" fill="${fillColor}"/>` : ""}
</svg>`.trim();
  }
  // ---------------------------------------------------------------------------
  // Utility: SVG string → data URL  (for setImage calls)
  // ---------------------------------------------------------------------------
  function svgToDataUrl(svg) {
      // Node.js plugin context: base64 via Buffer.
      // Browser preview context: percent-encode (Buffer not available).
      if (typeof Buffer !== "undefined") {
          return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
      }
      return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }

  exports.renderEncoderStrip = renderEncoderStrip;
  exports.renderKeyButton = renderKeyButton;
  exports.svgToDataUrl = svgToDataUrl;

  return exports;

})({});
