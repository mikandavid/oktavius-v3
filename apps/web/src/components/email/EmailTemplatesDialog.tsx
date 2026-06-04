import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@oktavius/base-ui';

import type { EmailTemplate } from './types';

type EmailTemplatesDialogProps = {
  open: boolean;
  templates: EmailTemplate[];
  onOpenChange: (open: boolean) => void;
  onUseTemplate: (template: EmailTemplate) => void;
};

export function EmailTemplatesDialog({
  open,
  templates,
  onOpenChange,
  onUseTemplate,
}: EmailTemplatesDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Email templates</DialogTitle>
          <DialogDescription>
            Pick a template to start a new message with pre-filled subject and body.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] space-y-2 overflow-y-auto">
          {templates.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No templates available.
            </p>
          ) : (
            templates.map((template) => (
              <div
                key={template.id}
                className="flex items-start gap-3 rounded-md border border-border/60 bg-card p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{template.name}</p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {template.subject}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {template.description}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onUseTemplate(template);
                    onOpenChange(false);
                  }}
                >
                  Use
                </Button>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
