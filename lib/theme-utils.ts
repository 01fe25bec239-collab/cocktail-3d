/* ───────────────────────────────────────────────────────
   Color math utilities for the cocktail theme engine.
   Pure functions — no React, no side-effects.
   ─────────────────────────────────────────────────────── */

export interface RGB {
  r: number;
  g: number;
  b: number;
}

/**
 * Convert a hex color string (#RRGGBB or #RGB) to an RGB object.
 * Returns {r:0, g:0, b:0} for malformed input so we never crash.
 */
export function hexToRgb(hex: string): RGB {
  const cleaned = hex.replace('#', '');
  if (cleaned.length === 3) {
    return {
      r: parseInt(cleaned[0] + cleaned[0], 16),
      g: parseInt(cleaned[1] + cleaned[1], 16),
      b: parseInt(cleaned[2] + cleaned[2], 16),
    };
  }
  if (cleaned.length === 6) {
    return {
      r: parseInt(cleaned.slice(0, 2), 16),
      g: parseInt(cleaned.slice(2, 4), 16),
      b: parseInt(cleaned.slice(4, 6), 16),
    };
  }
  return { r: 0, g: 0, b: 0 };
}

/**
 * Convert an RGB object back to a hex string (#rrggbb).
 */
export function rgbToHex({ r, g, b }: RGB): string {
  const toHex = (n: number) =>
    Math.round(Math.max(0, Math.min(255, n)))
      .toString(16)
      .padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Relative luminance per WCAG 2.1 (sRGB linearised).
 * Returns a value between 0 (black) and 1 (white).
 */
export function relativeLuminance({ r, g, b }: RGB): number {
  const linearize = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

/**
 * Choose a readable text color for a given background hex.
 *
 *  • Dark bg  → crisp white text
 *  • Light bg → deep charcoal text (not pure black — softer on the eyes)
 *
 * The threshold of 0.35 is intentionally lower than the typical 0.5
 * so that medium-saturated colors (teal, coral, berry) still get
 * light text. Only genuinely bright backgrounds flip to dark text.
 */
export function textColorForBg(bgHex: string): string {
  const lum = relativeLuminance(hexToRgb(bgHex));
  return lum > 0.35 ? '#1a1a2e' : '#f5f5f7';
}

/**
 * A softer secondary text color that is the same hue direction as
 * the primary text but at reduced opacity-equivalent.
 */
export function secondaryTextColorForBg(bgHex: string): string {
  const lum = relativeLuminance(hexToRgb(bgHex));
  return lum > 0.35 ? '#3a3a4e' : '#c5c5d0';
}

/**
 * Linearly interpolate between two RGB colours.
 * t = 0 → `from`, t = 1 → `to`.
 */
export function lerpRgb(from: RGB, to: RGB, t: number): RGB {
  const clamp = Math.max(0, Math.min(1, t));
  return {
    r: from.r + (to.r - from.r) * clamp,
    g: from.g + (to.g - from.g) * clamp,
    b: from.b + (to.b - from.b) * clamp,
  };
}

/**
 * Linearly interpolate between two hex colours, returning a hex string.
 */
export function lerpHex(fromHex: string, toHex: string, t: number): string {
  return rgbToHex(lerpRgb(hexToRgb(fromHex), hexToRgb(toHex), t));
}

/**
 * Build a tint overlay CSS gradient value.
 * Used to colorise backdrop images/videos to match the cocktail palette.
 *
 * The overlay is a two-stop gradient from primary→secondary with
 * controlled opacity so the original footage texture bleeds through.
 */
export function tintOverlayGradient(
  primaryHex: string,
  secondaryHex: string,
  opacity: number = 0.55
): string {
  const p = hexToRgb(primaryHex);
  const s = hexToRgb(secondaryHex);
  return `linear-gradient(
    160deg,
    rgba(${p.r}, ${p.g}, ${p.b}, ${opacity}) 0%,
    rgba(${s.r}, ${s.g}, ${s.b}, ${opacity * 0.8}) 100%
  )`;
}
