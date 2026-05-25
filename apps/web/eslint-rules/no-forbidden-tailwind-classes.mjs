/** @type {import('eslint').Rule.RuleModule} */

/** Tailwind default palette scales (numbered steps) — not our semantic `neutral-*` ramp. */
const FORBIDDEN_NUMBERED_PALETTE =
  'slate|gray|zinc|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose';

const FORBIDDEN = [
  {
    pattern: /\btext-gray-\d+\b/,
    message: 'Use text-foreground or text-muted-foreground instead of text-gray-*.',
  },
  {
    pattern: /\bbg-white\b/,
    message: 'Use bg-card or bg-background instead of bg-white.',
  },
  {
    pattern: /\btext-white\b/,
    message:
      'Use text-foreground or a semantic *-foreground token (e.g. text-cta-foreground) instead of text-white.',
  },
  {
    pattern: new RegExp(
      `\\b(text|bg|border|ring|from|to|via)-(?:${FORBIDDEN_NUMBERED_PALETTE})-\\d+\\b`,
    ),
    message:
      'Use semantic design tokens (success, warning, info, teal, orange, cta, neutral-*) instead of raw Tailwind palette scales.',
  },
  {
    pattern: /\brounded-lg\b/,
    message:
      'Use rounded-card (surfaces) or rounded-control (inputs/buttons) instead of rounded-lg.',
  },
];

function inspectString(node, value, context) {
  if (typeof value !== 'string') return;

  for (const { pattern, message } of FORBIDDEN) {
    if (pattern.test(value)) {
      context.report({ node, message });
    }
  }
}

function inspectExpression(node, context) {
  if (!node) return;

  switch (node.type) {
    case 'Literal':
      inspectString(node, node.value, context);
      return;
    case 'TemplateLiteral':
      for (const quasi of node.quasis) {
        inspectString(quasi, quasi.value.cooked ?? quasi.value.raw, context);
      }
      return;
    case 'CallExpression':
      if (node.callee.type === 'Identifier' && node.callee.name === 'cn') {
        for (const arg of node.arguments) {
          inspectExpression(arg, context);
        }
      }
      return;
    case 'ArrayExpression':
      for (const element of node.elements) {
        inspectExpression(element, context);
      }
      return;
    default:
      return;
  }
}

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow raw Tailwind classes that bypass the Oktavius design token system',
    },
    schema: [],
  },
  create(context) {
    return {
      JSXAttribute(node) {
        if (node.name.type !== 'JSXIdentifier' || node.name.name !== 'className' || !node.value) {
          return;
        }

        if (node.value.type === 'Literal') {
          inspectExpression(node.value, context);
          return;
        }

        if (node.value.type === 'JSXExpressionContainer') {
          inspectExpression(node.value.expression, context);
        }
      },
    };
  },
};
