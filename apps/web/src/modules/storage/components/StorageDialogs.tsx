import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
} from '@oktavius/base-ui';
import { useEffect, useState } from 'react';

import { useTranslation } from '@/core/i18n';

import type { StorageNode, StorageTreeNode } from '../data/types';

export function NameDialog({
  open,
  title,
  label,
  confirmLabel,
  initialValue,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  label: string;
  confirmLabel: string;
  initialValue: string;
  onConfirm: (value: string) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [value, setValue] = useState(initialValue);
  useEffect(() => {
    if (open) setValue(initialValue);
  }, [open, initialValue]);

  return (
    <Dialog open={open} onOpenChange={(next) => (!next ? onClose() : undefined)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <label className="text-sm font-medium text-foreground">{label}</label>
        <Input
          autoFocus
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && value.trim()) onConfirm(value.trim());
          }}
        />
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            {t('storage.dialogs.cancel')}
          </Button>
          <Button variant="cta" disabled={!value.trim()} onClick={() => onConfirm(value.trim())}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ConfirmDialog({
  open,
  title,
  body,
  destructive,
  confirmLabel,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  body: string;
  destructive?: boolean;
  confirmLabel: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  return (
    <Dialog open={open} onOpenChange={(next) => (!next ? onClose() : undefined)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{body}</p>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            {t('storage.dialogs.cancel')}
          </Button>
          <Button variant={destructive ? 'destructive' : 'cta'} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function MoveDialog({
  open,
  tree,
  node,
  onConfirm,
  onClose,
}: {
  open: boolean;
  tree: StorageTreeNode[];
  node: StorageNode | null;
  onConfirm: (targetFolderId: string | null) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [target, setTarget] = useState<string | null>(null);

  function renderRow(folder: StorageTreeNode, depth: number) {
    if (folder.id === node?.id) return null;
    return (
      <div key={folder.id}>
        <button
          type="button"
          onClick={() => setTarget(folder.id)}
          style={{ paddingLeft: `${depth * 14 + 8}px` }}
          className={`flex w-full items-center rounded-control px-2 py-1.5 text-left text-sm ${
            target === folder.id ? 'bg-cta/10 text-cta' : 'hover:bg-muted'
          }`}
        >
          {folder.name}
        </button>
        {folder.children.map((child) => renderRow(child, depth + 1))}
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (!next ? onClose() : undefined)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('storage.dialogs.moveTitle')}</DialogTitle>
        </DialogHeader>
        <div className="max-h-72 overflow-y-auto rounded-card bg-muted/40 p-1">
          <button
            type="button"
            onClick={() => setTarget(null)}
            className={`flex w-full items-center rounded-control px-2 py-1.5 text-left text-sm ${
              target === null ? 'bg-cta/10 text-cta' : 'hover:bg-muted'
            }`}
          >
            {t('storage.nav.all')}
          </button>
          {tree.map((folder) => renderRow(folder, 1))}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            {t('storage.dialogs.cancel')}
          </Button>
          <Button variant="cta" onClick={() => onConfirm(target)}>
            {t('storage.actions.move')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
