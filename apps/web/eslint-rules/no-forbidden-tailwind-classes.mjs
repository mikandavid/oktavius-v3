/** @type {import('eslint').Rule.RuleModule} */
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
