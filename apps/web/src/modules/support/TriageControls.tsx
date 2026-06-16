import { Button, Combobox, SectionCard, Textarea } from '@oktavius/base-ui';
import { useState } from 'react';

import { ConfirmActionDialog } from '@/components/common/ConfirmActionDialog';
import { useTranslation } from '@/core/i18n';
import { appToast } from '@/lib/toast';

import type { SupportPriority, SupportStatus, SupportTicket } from './data/types';
import { useSupportAssignees, useSupportMutations } from './data/useSupportData';
import { PRIORITIES_FOR_UI, STATUSES_FOR_UI } from './triageOptions';

interface TriageControlsProps {
  ticket: SupportTicket;
}

export function TriageControls({ ticket }: TriageControlsProps) {
  const { t } = useTranslation();
  const { updateStatus, updatePriority, assign, resolve } = useSupportMutations();
  const assignees = useSupportAssignees();
  const [resolveOpen, setResolveOpen] = useState(false);
  const [resolution, setResolution] = useState('');

  const statusOptions = STATUSES_FOR_UI.map((s) => ({
    value: s,
    label: t(`support.statusLabel_${s}`),
  }));
  const priorityOptions = PRIORITIES_FOR_UI.map((p) => ({
    value: p,
    label: t(`support.priorityLabel_${p}`),
  }));
  const assigneeOptions = (assignees.data ?? []).map((a) => ({ value: a.userId, label: a.name }));

  const isClosed = ticket.status === 'resolved' || ticket.status === 'closed';

  async function onStatusChange(value: string | null) {
    if (!value) return;
    try {
      await updateStatus.mutateAsync({ ticketId: ticket.id, status: value as SupportStatus });
      appToast.success(t('support.triageStatusUpdated'));
    } catch (error) {
      appToast.fromApiError(error, t('support.triageUpdateFailed'));
    }
  }

  async function onPriorityChange(value: string | null) {
    if (!value) return;
    try {
      await updatePriority.mutateAsync({
        ticketId: ticket.id,
        priority: value as SupportPriority,
      });
      appToast.success(t('support.triagePriorityUpdated'));
    } catch (error) {
      appToast.fromApiError(error, t('support.triageUpdateFailed'));
    }
  }

  async function onAssigneeChange(value: string | null) {
    try {
      await assign.mutateAsync({ ticketId: ticket.id, assigneeUserId: value });
      appToast.success(t('support.triageAssigneeUpdated'));
    } catch (error) {
      appToast.fromApiError(error, t('support.triageUpdateFailed'));
    }
  }

  async function onResolveConfirm() {
    try {
      await resolve.mutateAsync({ ticketId: ticket.id, resolutionMessage: resolution.trim() });
      setResolveOpen(false);
      setResolution('');
      appToast.success(t('support.resolveSuccess'));
    } catch (error) {
      appToast.fromApiError(error, t('support.resolveFailed'));
    }
  }

  return (
    <SectionCard className="flex flex-col gap-4">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">
            {t('support.statusFieldLabel')}
          </span>
          <Combobox
            options={statusOptions}
            value={ticket.status}
            onChange={(v) => void onStatusChange(v)}
            clearable={false}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">
            {t('support.priorityFieldLabel')}
          </span>
          <Combobox
            options={priorityOptions}
            value={ticket.priority}
            onChange={(v) => void onPriorityChange(v)}
            clearable={false}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-foreground">{t('support.assigneeLabel')}</span>
          <Combobox
            options={assigneeOptions}
            value={ticket.assigneeUserId ?? undefined}
            onChange={(v) => void onAssigneeChange(v)}
            placeholder={t('support.assigneeUnassigned')}
          />
        </div>

        {!isClosed ? (
          <Button type="button" variant="outline" onClick={() => setResolveOpen(true)}>
            {t('support.resolveAction')}
          </Button>
        ) : null}
      </div>

      <ConfirmActionDialog
        open={resolveOpen}
        onOpenChange={setResolveOpen}
        title={t('support.resolveDialogTitle')}
        description={t('support.resolveDialogDescription')}
        confirmLabel={t('support.resolveConfirm')}
        cancelLabel={t('support.resolveCancel')}
        confirmVariant="cta"
        confirmDisabled={!resolution.trim() || resolve.isPending}
        onConfirm={() => void onResolveConfirm()}
      >
        <Textarea
          value={resolution}
          onChange={(e) => setResolution(e.target.value)}
          placeholder={t('support.resolveMessagePlaceholder')}
          rows={3}
          className="mt-2 resize-none"
        />
      </ConfirmActionDialog>
    </SectionCard>
  );
}
