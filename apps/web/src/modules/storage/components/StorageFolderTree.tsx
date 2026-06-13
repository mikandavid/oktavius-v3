import { cn } from '@oktavius/base-ui';
import { useState } from 'react';

import { ChevronDownIcon, ChevronRightIcon, FolderIcon } from '@/lib/icons';

import type { StorageTreeNode } from '../data/types';

function TreeRow({
  node,
  depth,
  selectedId,
  onSelect,
}: {
  node: StorageTreeNode;
  depth: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(depth === 0);
  const hasChildren = node.children.length > 0;
  const isSelected = node.id === selectedId;

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        className={cn(
          'flex cursor-pointer items-center gap-1.5 rounded-control px-2 py-1.5 text-sm',
          isSelected ? 'bg-cta/10 font-medium text-cta' : 'text-foreground hover:bg-muted',
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={() => onSelect(node.id)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onSelect(node.id);
          }
        }}
      >
        <button
          type="button"
          aria-label={expanded ? 'Collapse' : 'Expand'}
          className={cn('shrink-0 text-muted-foreground', !hasChildren && 'invisible')}
          onClick={(event) => {
            event.stopPropagation();
            setExpanded((value) => !value);
          }}
        >
          {expanded ? <ChevronDownIcon size={14} /> : <ChevronRightIcon size={14} />}
        </button>
        <FolderIcon size={16} weight="duotone" className="shrink-0 text-cta" />
        <span className="truncate">{node.name}</span>
      </div>
      {expanded &&
        node.children.map((child) => (
          <TreeRow
            key={child.id}
            node={child}
            depth={depth + 1}
            selectedId={selectedId}
            onSelect={onSelect}
          />
        ))}
    </div>
  );
}

export function StorageFolderTree({
  tree,
  selectedId,
  onSelect,
}: {
  tree: StorageTreeNode[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      {tree.map((node) => (
        <TreeRow key={node.id} node={node} depth={0} selectedId={selectedId} onSelect={onSelect} />
      ))}
    </div>
  );
}
