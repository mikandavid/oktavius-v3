/** @type {import('eslint').Rule.RuleModule} */

import { MAX_ENTITY_DETAIL_EXTRA_TABS, MAX_LIST_FILTERS } from './ux-limits.mjs';

function countArrayItems(node) {
  if (!node || node.type !== 'ArrayExpression') return null;
  return node.elements.filter((element) => element && element.type !== 'SpreadElement').length;
}

function reportIfTooMany(context, node, count, label, max) {
  if (count != null && count > max) {
    context.report({
      node,
      message: `${label} has ${count} items; maximum is ${max}. See docs/ui-rules/ui-system.md.`,
    });
  }
}

function inspectFiltersArray(context, node, label) {
  const count = countArrayItems(node);
  reportIfTooMany(context, node, count, label, MAX_LIST_FILTERS);
}

function isFiltersName(name) {
  return typeof name === 'string' && /Filters$/.test(name);
}

function isBuildFiltersName(name) {
  return typeof name === 'string' && /^build\w*Filters$/.test(name);
}

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Limit FilterDef[] and extraTabs length for ERP UX chunking',
    },
    schema: [],
  },
  create(context) {
    return {
      ExportNamedDeclaration(node) {
        if (node.declaration?.type !== 'VariableDeclaration') return;

        for (const declarator of node.declaration.declarations) {
          if (declarator.id?.type !== 'Identifier') continue;
          if (!isFiltersName(declarator.id.name)) continue;
          inspectFiltersArray(context, declarator.init, declarator.id.name);
        }
      },
      VariableDeclarator(node) {
        if (node.id?.type !== 'Identifier' || !isFiltersName(node.id.name)) return;
        if (node.parent?.type === 'VariableDeclaration' && node.parent.kind === 'const') {
          inspectFiltersArray(context, node.init, node.id.name);
        }
      },
      ReturnStatement(node) {
        const ancestors = context.sourceCode.getAncestors(node);
        const fn = ancestors.find((ancestor) => {
          return (
            ancestor.type === 'FunctionDeclaration' ||
            ancestor.type === 'FunctionExpression' ||
            ancestor.type === 'ArrowFunctionExpression'
          );
        });
        const fnName =
          fn?.id?.name ??
          (fn?.parent?.type === 'VariableDeclarator' && fn.parent.id?.type === 'Identifier'
            ? fn.parent.id.name
            : null);

        if (!fnName || !isBuildFiltersName(fnName)) return;
        inspectFiltersArray(context, node.argument, fnName);
      },
      JSXAttribute(node) {
        if (node.name.type !== 'JSXIdentifier' || node.name.name !== 'extraTabs') return;
        if (node.value?.type !== 'JSXExpressionContainer') return;
        const expr = node.value.expression;
        if (expr.type !== 'ArrayExpression') return;
        const count = countArrayItems(expr);
        reportIfTooMany(context, expr, count, 'extraTabs', MAX_ENTITY_DETAIL_EXTRA_TABS);
      },
    };
  },
};
