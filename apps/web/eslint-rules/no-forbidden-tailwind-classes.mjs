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
    pattern: /\brounded-(?:lg|xl)\b/,
    message:
      'Use rounded-card (surfaces) or rounded-control (inputs/buttons) instead of rounded-lg/rounded-xl.',
  },
  {
    pattern: /\bborder-input\b/,
    message:
      'No border-input — text inputs use the <Input> component (bg-muted/60, no border). See ui-system.md.',
  },
];

/** Named surface components that must never carry a border or shadow (ui-system.md hard ban). */
const SURFACE_COMPONENTS = new Set(['Card', 'SectionCard', 'CrudMainView', 'SplitView']);

/** A width-drawing border utility (`border`, `border-2`, `border-t`, `border-x-2`, …) — NOT a color/style utility (`border-border`, `border-input`, `border-dashed`). */
function isBorderWidthToken(token) {
  return (
    token === 'border' || /^border-[0-8]$/.test(token) || /^border-[xytrbl](-[0-8])?$/.test(token)
  );
}

/** A shadow utility (`shadow`, `shadow-sm`, …) — but not `shadow-none`. */
function isShadowToken(token) {
  return token === 'shadow' || /^shadow-(sm|md|lg|xl|2xl|inner)$/.test(token);
}

function inspectSurfaceString(node, value, context) {
  if (typeof value !== 'string') return;

  for (const token of value.split(/\s+/)) {
    if (isBorderWidthToken(token)) {
      context.report({
        node,
        message:
          'No border on Card / SectionCard / CrudMainView / SplitView surfaces (ui-system.md). Remove the border utility or use a sanctioned bordered component (e.g. SettingsTable).',
      });
    } else if (isShadowToken(token)) {
      context.report({
        node,
        message:
          'No shadow on Card / SectionCard / CrudMainView / SplitView surfaces (ui-system.md).',
      });
    }
  }
}

function inspectSurfaceExpression(node, context) {
  if (!node) return;

  switch (node.type) {
    case 'Literal':
      inspectSurfaceString(node, node.value, context);
      return;
    case 'TemplateLiteral':
      for (const quasi of node.quasis) {
        inspectSurfaceString(quasi, quasi.value.cooked ?? quasi.value.raw, context);
      }
      return;
    case 'CallExpression':
      if (node.callee.type === 'Identifier' && node.callee.name === 'cn') {
        for (const arg of node.arguments) {
          inspectSurfaceExpression(arg, context);
        }
      }
      return;
    case 'ArrayExpression':
      for (const element of node.elements) {
        inspectSurfaceExpression(element, context);
      }
      return;
    case 'ConditionalExpression':
      inspectSurfaceExpression(node.consequent, context);
      inspectSurfaceExpression(node.alternate, context);
      return;
    case 'LogicalExpression':
      inspectSurfaceExpression(node.left, context);
      inspectSurfaceExpression(node.right, context);
      return;
    default:
      return;
  }
}

function isSurfaceComponentAttribute(node) {
  const opening = node.parent;
  if (!opening || opening.type !== 'JSXOpeningElement') return false;
  return opening.name.type === 'JSXIdentifier' && SURFACE_COMPONENTS.has(opening.name.name);
}

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
    case 'ConditionalExpression':
      inspectExpression(node.consequent, context);
      inspectExpression(node.alternate, context);
      return;
    case 'LogicalExpression':
      inspectExpression(node.left, context);
      inspectExpression(node.right, context);
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

        const onSurface = isSurfaceComponentAttribute(node);

        if (node.value.type === 'Literal') {
          inspectExpression(node.value, context);
          if (onSurface) inspectSurfaceExpression(node.value, context);
          return;
        }

        if (node.value.type === 'JSXExpressionContainer') {
          inspectExpression(node.value.expression, context);
          if (onSurface) inspectSurfaceExpression(node.value.expression, context);
        }
      },
    };
  },
};
