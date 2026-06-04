export function getRichTextPlainText(html: string) {
  if (!html.trim()) return '';

  const withoutTags = html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/(p|div|li|h[1-6]|blockquote)>/gi, ' ')
    .replace(/<[^>]*>/g, ' ');

  return decodeHtmlEntities(withoutTags).replace(/\s+/g, ' ').trim();
}

export function isRichTextEmpty(html: string) {
  return getRichTextPlainText(html).length === 0;
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}
