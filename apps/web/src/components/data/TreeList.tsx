import { useState } from 'react';

import { CollapsibleSection, cn } from '@oktavius/base-ui';

import { FolderIcon } from '@/lib/icons';

export type TreeNode = {
  id: string;
  label: string;
  children?: TreeNode[];
};

type TreeListProps = {
  nodes: TreeNode[];
  className?: string;
  defaultExpandedIds?: string[];
};

function TreeBranch({
  node,
  depth,
  expanded,
  onToggle,
}: {
  node: TreeNode;
  depth: number;
  expanded: Set<string>;
  onToggle: (id: string, open: boolean) => void;
}) {
  const hasChildren = Boolean(node.children?.length);
  const isOpen = expanded.has(node.id);

  if (!hasChildren) {
    return (
      <button
        type="button"
        className="flex w-full items-center gap-2 rounded-control py-1.5 text-left text-sm text-foreground transition-colors hover:bg-muted/40"
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        <FolderIcon size={14} className="shrink-0 text-muted-foreground" />
        <span className="truncate">{node.label}</span>
      </button>
    );
  }

  return (
    <div style={{ paddingLeft: depth > 0 ? `${depth * 12}px` : undefined }}>
      <CollapsibleSection
        variant="plain"
        title={node.label}
        open={isOpen}
        onOpenChange={(open) => onToggle(node.id, open)}
        className="border-0 bg-transparent shadow-none"
      >
        <div className="space-y-0.5">
          {node.children?.map((child) => (
            <TreeBranch
              key={child.id}
              node={child}
              depth={depth + 1}
              expanded={expanded}
              onToggle={onToggle}
            />
          ))}
        </div>
      </CollapsibleSection>
    </div>
  );
}

export function TreeList({ nodes, className, defaultExpandedIds = [] }: TreeListProps) {
  const [expanded, setExpanded] = useState(() => new Set(defaultExpandedIds));

  const onToggle = (id: string, open: boolean) => {
    setExpanded((current) => {
      const next = new Set(current);
      if (open) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  return (
    <div className={cn('rounded-card bg-card px-2 py-2', className)}>
      {nodes.map((node) => (
        <TreeBranch key={node.id} node={node} depth={0} expanded={expanded} onToggle={onToggle} />
      ))}
    </div>
  );
}
