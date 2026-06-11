/**
 * Warns when JSX renders a bare string literal containing letters.
 * Forces the use of `t('ns.key')` for user-facing copy.
 *
 * Exempt:
 * - Whitespace / single-character / punctuation-only text
 * - Strings starting with `[` (already a missing-key marker)
 * - Strings that look like icon names, hex colors, or pure digits
 * - File annotated with `// eslint-disable-next-line oktavius/no-bare-jsx-strings`
 */

const ALLOWLIST_REGEX = /^[\s\-—·•⋅()/|\d+.,:%·×–]+$/u;

export default {
  meta: {
    type: 'suggestion',
    docs: { description: 'No bare JSX string literals — use t() instead.' },
    schema: [],
    messages: {
      bare: "Bare JSX text '{{text}}' — wrap with t() or move into translations.",
    },
  },
  create(context) {
    function check(node, raw) {
      const text = raw.trim();
      if (!text) return;
      if (!/[A-Za-zÀ-ÿ]/.test(text)) return;
      if (ALLOWLIST_REGEX.test(text)) return;
      if (text.startsWith('[')) return;
      context.report({ node, messageId: 'bare', data: { text: text.slice(0, 40) } });
    }
    return {
      JSXText(node) {
        check(node, node.value);
      },
      Literal(node) {
        if (typeof node.value !== 'string') return;
        if (node.parent?.type !== 'JSXExpressionContainer') return;
        if (node.parent.parent?.type !== 'JSXElement' && node.parent.parent?.type !== 'JSXFragment')
          return;
        check(node, node.value);
      },
    };
  },
};
