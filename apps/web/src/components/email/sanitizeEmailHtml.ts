const ALLOWED_TAGS = new Set([
  'a',
  'b',
  'blockquote',
  'br',
  'code',
  'em',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'i',
  'img',
  'li',
  'ol',
  'p',
  'pre',
  's',
  'small',
  'span',
  'strong',
  'sub',
  'sup',
  'table',
  'tbody',
  'td',
  'tfoot',
  'th',
  'thead',
  'tr',
  'u',
  'ul',
]);

const COMMON_ATTRS = new Set(['class', 'id', 'lang', 'dir', 'title']);
const TAG_ATTR_MAP: Record<string, Set<string>> = {
  a: new Set([...COMMON_ATTRS, 'href', 'rel', 'target']),
  img: new Set([...COMMON_ATTRS, 'alt', 'src', 'width', 'height']),
  table: new Set([...COMMON_ATTRS]),
  tbody: new Set([...COMMON_ATTRS]),
  thead: new Set([...COMMON_ATTRS]),
  tfoot: new Set([...COMMON_ATTRS]),
  tr: new Set([...COMMON_ATTRS]),
  td: new Set([...COMMON_ATTRS, 'colspan', 'rowspan']),
  th: new Set([...COMMON_ATTRS, 'colspan', 'rowspan']),
  li: new Set([...COMMON_ATTRS]),
  ol: new Set([...COMMON_ATTRS]),
  ul: new Set([...COMMON_ATTRS]),
};

function stripText(value: string) {
  return value.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function sanitizeUri(raw: string, tag: string): string | null {
  const value = raw.trim();
  if (!value) return null;

  if (
    value.startsWith('#') ||
    value.startsWith('./') ||
    value.startsWith('../') ||
    value.startsWith('/')
  ) {
    return value;
  }

  const lower = value.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('file:') ||
    (lower.startsWith('data:') && tag !== 'img')
  ) {
    return null;
  }

  if (lower.startsWith('http://') || lower.startsWith('https://') || lower.startsWith('mailto:')) {
    return value;
  }

  if (tag === 'img' && /^data:image\/(?:png|jpe?g|gif|webp);base64,/i.test(lower)) {
    return value;
  }

  try {
    const parsed = new URL(value, 'https://example.invalid');
    return parsed.protocol === 'http:' ||
      parsed.protocol === 'https:' ||
      parsed.protocol === 'mailto:' ||
      parsed.protocol === 'tel:'
      ? parsed.href
      : null;
  } catch {
    return null;
  }
}

function sanitizeAttributes(node: Element, clone: Element) {
  const allowed = TAG_ATTR_MAP[node.tagName.toLowerCase()] ?? COMMON_ATTRS;

  for (const attr of Array.from(node.attributes)) {
    const name = attr.name.toLowerCase();
    if (!allowed.has(name) || name.startsWith('on')) {
      continue;
    }
    if (name === 'href' || name === 'src') {
      const sanitized = sanitizeUri(attr.value, node.tagName.toLowerCase());
      if (sanitized) {
        clone.setAttribute(name, sanitized);
      }
      continue;
    }
    clone.setAttribute(name, attr.value);
  }

  if (node.tagName.toLowerCase() === 'a') {
    const href = clone.getAttribute('href');
    if (!href) return;

    const target = clone.getAttribute('target');
    if (target === '_blank') {
      clone.setAttribute('rel', 'noopener noreferrer');
    }
  }
}

function sanitizeNodes(nodes: NodeListOf<ChildNode>, doc: Document): Node[] {
  const output: Node[] = [];

  nodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      output.push(doc.createTextNode(node.textContent ?? ''));
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;

    const source = node as Element;
    const tag = source.tagName.toLowerCase();
    if (!ALLOWED_TAGS.has(tag)) {
      output.push(...sanitizeNodes(source.childNodes, doc));
      return;
    }

    const clone = doc.createElement(tag);
    sanitizeAttributes(source, clone);
    const sanitizedChildren = sanitizeNodes(source.childNodes, doc);
    for (const child of sanitizedChildren) {
      clone.append(child);
    }
    output.push(clone);
  });

  return output;
}

export function sanitizeEmailHtml(value: string): string {
  if (!value) return '';
  if (typeof DOMParser === 'undefined') return stripText(value);

  const parser = new DOMParser();
  const parsed = parser.parseFromString(value, 'text/html');
  if (parsed.body === null) {
    return stripText(value);
  }

  const fragment = parsed.createDocumentFragment();
  const normalizedChildren = sanitizeNodes(parsed.body.childNodes, parsed);
  for (const node of normalizedChildren) {
    fragment.append(node);
  }

  const container = parsed.createElement('div');
  container.append(fragment);
  return container.innerHTML;
}
