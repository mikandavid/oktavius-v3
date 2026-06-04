import { describe, expect, it } from 'vitest';

import { getRichTextPlainText, isRichTextEmpty } from './rich-text';

describe('rich text utilities', () => {
  it('treats empty paragraphs and whitespace-only markup as empty', () => {
    expect(isRichTextEmpty('')).toBe(true);
    expect(isRichTextEmpty('<p></p>')).toBe(true);
    expect(isRichTextEmpty('<p><br></p>')).toBe(true);
    expect(isRichTextEmpty('<p>&nbsp;</p>')).toBe(true);
  });

  it('detects visible text content', () => {
    expect(isRichTextEmpty('<p>Hello <strong>team</strong></p>')).toBe(false);
  });

  it('extracts readable plain text from html', () => {
    expect(getRichTextPlainText('<p>Hello <strong>team</strong></p><p>Next line</p>')).toBe(
      'Hello team Next line',
    );
  });
});
