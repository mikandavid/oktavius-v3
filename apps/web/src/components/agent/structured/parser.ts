export type ParsedSegment =
  | { type: 'text'; text: string }
  | { type: 'tag'; name: string; attrs: Record<string, string>; body: string }
  | { type: 'partial'; name: string };

const OCT_PREFIX = 'oct-';
const TAG_NAME_RE = /^[a-z][a-z0-9-]*$/;

export function parseStructuredContent(input: string): ParsedSegment[] {
  const segments: ParsedSegment[] = [];
  let i = 0;
  let textBuf = '';

  const flushText = () => {
    if (textBuf.length > 0) {
      segments.push({ type: 'text', text: textBuf });
      textBuf = '';
    }
  };

  while (i < input.length) {
    if (isFenceStart(input, i)) {
      const end = findFenceEnd(input, i);
      textBuf += input.slice(i, end);
      i = end;
      continue;
    }

    if (input[i] === '<' && startsWithOctTag(input, i)) {
      const parsed = tryParseTagAt(input, i);
      if (parsed) {
        flushText();
        if (parsed.kind === 'partial') {
          segments.push({ type: 'partial', name: parsed.name });
          return segments;
        }
        segments.push({ type: 'tag', name: parsed.name, attrs: parsed.attrs, body: parsed.body });
        i = parsed.end;
        continue;
      }
    }

    textBuf += input[i];
    i += 1;
  }

  flushText();
  return segments;
}

function isFenceStart(input: string, i: number): boolean {
  if (i > 0 && input[i - 1] !== '\n') return false;
  return input.startsWith('```', i) || input.startsWith('~~~', i);
}

function findFenceEnd(input: string, start: number): number {
  const fenceChar = input[start];
  const fence = fenceChar.repeat(3);
  const newline = input.indexOf('\n', start);
  if (newline === -1) return input.length;
  let cursor = newline + 1;
  while (cursor < input.length) {
    const lineStart = cursor;
    const lineEnd = input.indexOf('\n', cursor);
    const line = input.slice(lineStart, lineEnd === -1 ? input.length : lineEnd);
    if (line.trim().startsWith(fence)) {
      return lineEnd === -1 ? input.length : lineEnd + 1;
    }
    if (lineEnd === -1) return input.length;
    cursor = lineEnd + 1;
  }
  return input.length;
}

function startsWithOctTag(input: string, i: number): boolean {
  if (input[i] !== '<') return false;
  return input.startsWith(`<${OCT_PREFIX}`, i);
}

type TryParseResult =
  | { kind: 'partial'; name: string }
  | {
      kind: 'complete';
      name: string;
      attrs: Record<string, string>;
      body: string;
      end: number;
    };

function tryParseTagAt(input: string, start: number): TryParseResult | null {
  let i = start + 1;
  const nameStart = i;
  while (i < input.length) {
    const ch = input[i];
    if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '/' || ch === '>') break;
    i += 1;
  }
  if (i >= input.length) {
    return { kind: 'partial', name: input.slice(nameStart, i) };
  }
  const name = input.slice(nameStart, i);
  if (!name.startsWith(OCT_PREFIX) || !TAG_NAME_RE.test(name)) {
    return null;
  }

  const attrs: Record<string, string> = {};
  while (i < input.length) {
    const ch = input[i];
    if (ch === ' ' || ch === '\t' || ch === '\n') {
      i += 1;
      continue;
    }
    if (ch === '/') {
      if (i + 1 >= input.length) return { kind: 'partial', name };
      if (input[i + 1] !== '>') return null;
      return { kind: 'complete', name, attrs, body: '', end: i + 2 };
    }
    if (ch === '>') {
      const bodyStart = i + 1;
      const closing = `</${name}>`;
      const closeIdx = input.indexOf(closing, bodyStart);
      if (closeIdx === -1) {
        return { kind: 'partial', name };
      }
      const body = input.slice(bodyStart, closeIdx);
      return { kind: 'complete', name, attrs, body, end: closeIdx + closing.length };
    }

    const attrParse = parseAttrAt(input, i);
    if (!attrParse) return null;
    if (attrParse.kind === 'partial') {
      return { kind: 'partial', name };
    }
    attrs[attrParse.key] = attrParse.value;
    i = attrParse.end;
  }

  return { kind: 'partial', name };
}

type AttrParseResult =
  | { kind: 'partial' }
  | { kind: 'ok'; key: string; value: string; end: number };

function parseAttrAt(input: string, start: number): AttrParseResult | null {
  let i = start;
  const keyStart = i;
  while (i < input.length) {
    const ch = input[i];
    if (ch === '=' || ch === ' ' || ch === '\t' || ch === '\n' || ch === '/' || ch === '>') {
      break;
    }
    i += 1;
  }
  if (i === keyStart) return null;
  if (i >= input.length) return { kind: 'partial' };
  const key = input.slice(keyStart, i);
  if (!/^[a-zA-Z_][a-zA-Z0-9_-]*$/.test(key)) return null;

  if (input[i] !== '=') {
    return { kind: 'ok', key, value: 'true', end: i };
  }
  i += 1;
  if (i >= input.length) return { kind: 'partial' };

  const quote = input[i];
  if (quote !== '"' && quote !== "'") {
    const valStart = i;
    while (i < input.length) {
      const ch = input[i];
      if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '/' || ch === '>') break;
      i += 1;
    }
    if (i >= input.length) return { kind: 'partial' };
    return { kind: 'ok', key, value: decodeAttrValue(input.slice(valStart, i)), end: i };
  }

  i += 1;
  const valStart = i;
  while (i < input.length && input[i] !== quote) {
    i += 1;
  }
  if (i >= input.length) return { kind: 'partial' };
  const value = input.slice(valStart, i);
  return { kind: 'ok', key, value: decodeAttrValue(value), end: i + 1 };
}

function decodeAttrValue(raw: string): string {
  return raw
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}
