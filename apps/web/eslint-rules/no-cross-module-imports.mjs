/** @type {import('eslint').Rule.RuleModule} */

import path from 'node:path';

function moduleNameFromPath(filePath) {
  const normalized = filePath.split(path.sep).join('/');
  const match = normalized.match(/\/src\/modules\/([^/]+)/);
  return match ? match[1] : null;
}

function importTargetModule(specifier, filename) {
  if (specifier.startsWith('@/modules/')) {
    const name = specifier.slice('@/modules/'.length).split('/')[0];
    return name || null;
  }
  if (specifier.startsWith('.')) {
    return moduleNameFromPath(path.resolve(path.dirname(filename), specifier));
  }
  return null;
}

export default {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Modules may not import other modules; non-module code may not import modules. Lift shared code to @/lib or @/components.',
    },
    schema: [],
  },
  create(context) {
    const filename = context.filename;
    const ownModule = moduleNameFromPath(filename);

    function check(node, specifier) {
      if (typeof specifier !== 'string') return;
      const target = importTargetModule(specifier, filename);
      if (!target || target === ownModule) return;
      const message = ownModule
        ? `Module "${ownModule}" must not import from module "${target}". Lift shared code to @/lib or @/components.`
        : `Only app/ and the nav manifest may import from @/modules. Lift shared code to @/lib or @/components.`;
      context.report({ node, message });
    }

    return {
      ImportDeclaration(node) {
        check(node.source, node.source.value);
      },
      ExportNamedDeclaration(node) {
        if (node.source) check(node.source, node.source.value);
      },
      ExportAllDeclaration(node) {
        check(node.source, node.source.value);
      },
      ImportExpression(node) {
        if (node.source.type === 'Literal') check(node.source, node.source.value);
      },
    };
  },
};
