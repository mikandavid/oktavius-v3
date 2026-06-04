/** Parse HSL token value: "222 84% 4.9%" */
export function parseHslValue(value: string): { h: number; s: number; l: number } | null {
  const match = value.trim().match(/(-?\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%/);
  if (!match) return null;
  const h = Number(match[1]);
  const s = Number(match[2]);
  const l = Number(match[3]);
  if (!Number.isFinite(h) || !Number.isFinite(s) || !Number.isFinite(l)) return null;
  return { h, s, l };
}

export function hslToHex({ h, s, l }: { h: number; s: number; l: number }): string {
  const sNorm = Math.max(0, Math.min(100, s)) / 100;
  const lNorm = Math.max(0, Math.min(100, l)) / 100;
  const c = (1 - Math.abs(2 * lNorm - 1)) * sNorm;
  const hPrime = (((h % 360) + 360) % 360) / 60;
  const x = c * (1 - Math.abs((hPrime % 2) - 1));
  let r = 0;
  let g = 0;
  let b = 0;

  if (hPrime >= 0 && hPrime < 1) [r, g, b] = [c, x, 0];
  else if (hPrime >= 1 && hPrime < 2) [r, g, b] = [x, c, 0];
  else if (hPrime >= 2 && hPrime < 3) [r, g, b] = [0, c, x];
  else if (hPrime >= 3 && hPrime < 4) [r, g, b] = [0, x, c];
  else if (hPrime >= 4 && hPrime < 5) [r, g, b] = [x, 0, c];
  else if (hPrime >= 5 && hPrime < 6) [r, g, b] = [c, 0, x];

  const m = lNorm - c / 2;
  const toHex = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function hexToHsl(hex: string): { h: number; s: number; l: number } | null {
  const match = hex.trim().match(/^#?([0-9a-fA-F]{6})$/);
  if (!match) return null;
  const int = parseInt(match[1], 16);
  const r = ((int >> 16) & 255) / 255;
  const g = ((int >> 8) & 255) / 255;
  const b = (int & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let h = 0;

  if (delta !== 0) {
    if (max === r) h = ((g - b) / delta) % 6;
    else if (max === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
    h *= 60;
  }
  if (h < 0) h += 360;

  const l = (max + min) / 2;
  const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
  return { h, s: s * 100, l: l * 100 };
}

export function hslStringFromHex(hex: string): string | null {
  const hsl = hexToHsl(hex);
  if (!hsl) return null;
  return hslStringFromParts(hsl);
}

export function hslStringFromParts({ h, s, l }: { h: number; s: number; l: number }): string {
  return `${h.toFixed(1)} ${s.toFixed(1)}% ${l.toFixed(1)}%`;
}

/** Parse OKLCH token value: "0.595 0.1488 293.77" */
export function parseOklchValue(value: string): { l: number; c: number; h: number } | null {
  const match = value.trim().match(/(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/);
  if (!match) return null;
  const l = Number(match[1]);
  const c = Number(match[2]);
  const h = Number(match[3]);
  if (!Number.isFinite(l) || !Number.isFinite(c) || !Number.isFinite(h)) return null;
  return { l, c, h };
}

export function oklchStringFromParts({ l, c, h }: { l: number; c: number; h: number }): string {
  return `${l.toFixed(3)} ${c.toFixed(4)} ${h.toFixed(2)}`;
}

/** CSS color for preview swatches — wraps HSL or OKLCH token values. */
export function tokenToCssColor(value: string, format: 'hsl' | 'oklch'): string {
  const trimmed = value.trim();
  if (!trimmed) return 'transparent';
  if (format === 'oklch') return `oklch(${trimmed})`;
  return `hsl(${trimmed})`;
}
