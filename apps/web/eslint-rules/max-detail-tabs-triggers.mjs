/** @type {import('eslint').Rule.RuleModule} */

import { MAX_DETAIL_TABS } from './ux-limits.mjs';

function isTabsTriggerName(name) {
  if (!name) return false;
  if (name.type === 'JSXIdentifier') return name.name === 'TabsTrigger';
  if (name.type === 'JSXMemberExpression') {
    return name.property.type === 'JSXIdentifier' && name.property.name === 'TabsTrigger';
  }
  return false;
}

export default {
  meta: {
    type: 'problem',
    docs: {
      description: 'Limit TabsTrigger count on entity detail pages (Miller/Hick ERP chunking)',
    },
    schema: [],
  },
  create(context) {
    let count = 0;

    return {
      JSXOpeningElement(node) {
        if (isTabsTriggerName(node.name)) count += 1;
      },
      'Program:exit'() {
        if (count > MAX_DETAIL_TABS) {
          context.report({
            loc: { line: 1, column: 0 },
            message: `Detail pages may have at most ${MAX_DETAIL_TABS} <TabsTrigger> elements (found ${count}). Split IA with section-nav or fewer tabs — see docs/ui-rules/ui-system.md.`,
          });
        }
      },
    };
  },
};
