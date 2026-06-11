import type { InterpolationParams } from './types';

export function interpolate(text: string, params?: InterpolationParams): string {
  if (!params) return text;
  return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const value = params[key];
    return value !== undefined ? String(value) : match;
  });
}

export function extractVars(text: string): string[] {
  const vars: string[] = [];
  const regex = /\{\{(\w+)\}\}/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    vars.push(match[1]);
  }
  return vars;
}
