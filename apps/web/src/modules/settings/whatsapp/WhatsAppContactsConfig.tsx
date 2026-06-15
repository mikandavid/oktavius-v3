import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Badge,
  Button,
  Combobox,
  type ComboboxOption,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  SettingsRow,
  SettingsSection,
  SettingsTable,
  type SettingsTableColumn,
  Switch,
} from '@oktavius/base-ui';
import { useMemo, useState } from 'react';

import { SubEntityFormDialog } from '@/components/common/SubEntityFormDialog';
import type { FormField } from '@/components/forms/EntityForm';
import { SHORT_INPUT_WIDTH } from '@/components/settings/settingsForm';
import { useTranslation } from '@/core/i18n';
import { MoreIcon, PhoneIcon, PlusIcon } from '@/lib/icons';
import { appToast } from '@/lib/toast';

import {
  useAddWhatsAppContact,
  useDeleteWhatsAppContact,
  useUpdateWhatsAppConfig,
  useUpdateWhatsAppContact,
  useWhatsAppConfig,
  useWhatsAppContacts,
  useWhatsAppOrgMembers,
} from './data/useWhatsApp';
import type { OsirisWhatsAppContact, WhatsAppPolicy, WhatsAppRole } from './data/whatsappClient';

const ROLE_VARIANT: Record<WhatsAppRole, 'destructive' | 'secondary' | 'outline'> = {
  owner: 'destructive',
  admin: 'secondary',
  member: 'outline',
  viewer: 'outline',
};

const ROLES: WhatsAppRole[] = ['owner', 'admin', 'member', 'viewer'];
const DM_GROUP_POLICIES: WhatsAppPolicy[] = ['allowlist', 'disabled'];

export function WhatsAppContactsConfig() {
  const { t } = useTranslation();
  const { data: configData, isLoading: configLoading } = useWhatsAppConfig();
  const { data: contactsData, isLoading: contactsLoading } = useWhatsAppContacts();
  const { data: orgMembers } = useWhatsAppOrgMembers();
  const updateConfig = useUpdateWhatsAppConfig();
  const addContact = useAddWhatsAppContact();
  const updateContact = useUpdateWhatsAppContact();
  const deleteContact = useDeleteWhatsAppContact();

  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<OsirisWhatsAppContact | null>(null);
  const [pendingDelete, setPendingDelete] = useState<OsirisWhatsAppContact | null>(null);

  const contacts = contactsData?.contacts ?? [];

  const roleLabel = (role: WhatsAppRole) =>
    t(`settings.role${role.charAt(0).toUpperCase()}${role.slice(1)}`, undefined, role);

  const policyLabel = (policy: WhatsAppPolicy) => {
    if (policy === 'allowlist')
      return t('settings.whatsappPolicyAllowlist', undefined, 'Allowlist');
    return t('settings.whatsappPolicyDisabled', undefined, 'Disabled');
  };

  const roleOptions: ComboboxOption[] = useMemo(
    () => ROLES.map((role) => ({ value: role, label: roleLabel(role) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t],
  );

  const policyOptions: ComboboxOption[] = useMemo(
    () => DM_GROUP_POLICIES.map((p) => ({ value: p, label: policyLabel(p) })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t],
  );

  const memberOptions: ComboboxOption[] = useMemo(
    () => [
      { value: '__none__', label: t('settings.whatsappNoLinkedUser', undefined, 'No linked user') },
      ...(orgMembers ?? []).map((member) => ({
        value: member.userId,
        label: member.fullName || member.email || member.userId,
      })),
    ],
    [orgMembers, t],
  );

  const handleConfigChange = async (input: {
    autoReply?: boolean;
    dmPolicy?: WhatsAppPolicy;
    groupPolicy?: WhatsAppPolicy;
  }) => {
    try {
      await updateConfig.mutateAsync(input);
    } catch (error) {
      appToast.fromApiError(
        error,
        t('settings.whatsappUpdateSettingsFailed', undefined, 'Settings could not be saved.'),
      );
    }
  };

  const addFields: FormField[] = useMemo(
    () => [
      {
        name: 'phoneNumber',
        label: t('settings.whatsappPhoneNumber', undefined, 'Phone number'),
        type: 'phone',
        required: true,
        description: t(
          'settings.whatsappPhoneHint',
          undefined,
          'Select the country and enter the number; it is normalized to international format.',
        ),
      },
      {
        name: 'displayName',
        label: t('settings.whatsappDisplayNameOptional', undefined, 'Display name (optional)'),
        type: 'text',
      },
      {
        name: 'userId',
        label: t('settings.whatsappLinkUser', undefined, 'Linked user'),
        type: 'combobox',
        options: memberOptions,
      },
      {
        name: 'waRole',
        label: t('settings.whatsappRoleOverride', undefined, 'Role override'),
        type: 'combobox',
        required: true,
        options: roleOptions,
      },
    ],
    [t, memberOptions, roleOptions],
  );

  const editFields: FormField[] = useMemo(
    () => [
      {
        name: 'userId',
        label: t('settings.whatsappLinkUser', undefined, 'Linked user'),
        type: 'combobox',
        options: memberOptions,
      },
      {
        name: 'waRole',
        label: t('settings.whatsappRoleOverride', undefined, 'Role override'),
        type: 'combobox',
        required: true,
        options: roleOptions,
      },
      {
        name: 'autoReply',
        label: t('settings.whatsappAutoReply', undefined, 'Auto-reply'),
        type: 'switch',
      },
    ],
    [t, memberOptions, roleOptions],
  );

  const handleAddSubmit = async (values: Record<string, unknown>) => {
    const phoneNumber = String(values.phoneNumber ?? '').replace(/\s+/g, '');
    const userId = values.userId === '__none__' ? null : (values.userId as string | null);
    try {
      await addContact.mutateAsync({
        phoneNumber,
        displayName: String(values.displayName ?? '').trim() || undefined,
        autoReply: true,
        userId,
        waRole: values.waRole as WhatsAppRole,
      });
      appToast.success(t('settings.whatsappContactAdded', undefined, 'Contact added.'));
    } catch (error) {
      appToast.fromApiError(
        error,
        t('settings.whatsappAddContactFailed', undefined, 'Contact could not be added.'),
      );
      throw error;
    }
  };

  const handleEditSubmit = async (values: Record<string, unknown>) => {
    if (!editing) return;
    const userId = values.userId === '__none__' ? null : (values.userId as string | null);
    try {
      await updateContact.mutateAsync({
        id: editing.id,
        userId,
        waRole: values.waRole as WhatsAppRole,
        autoReply: Boolean(values.autoReply),
      });
      appToast.success(t('settings.whatsappContactUpdated', undefined, 'Contact updated.'));
    } catch (error) {
      appToast.fromApiError(
        error,
        t('settings.whatsappUpdateContactFailed', undefined, 'Contact could not be updated.'),
      );
      throw error;
    }
  };

  const handleToggleAutoReply = async (contact: OsirisWhatsAppContact) => {
    try {
      await updateContact.mutateAsync({ id: contact.id, autoReply: !contact.autoReply });
    } catch (error) {
      appToast.fromApiError(
        error,
        t('settings.whatsappUpdateContactFailed', undefined, 'Contact could not be updated.'),
      );
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    try {
      await deleteContact.mutateAsync(pendingDelete.id);
      setPendingDelete(null);
      appToast.success(t('settings.whatsappContactRemoved', undefined, 'Contact removed.'));
    } catch (error) {
      appToast.fromApiError(
        error,
        t('settings.whatsappRemoveContactFailed', undefined, 'Contact could not be removed.'),
      );
    }
  };

  const contactColumns: SettingsTableColumn<OsirisWhatsAppContact>[] = [
    {
      key: 'contact',
      header: t('settings.whatsappContact', undefined, 'Contact'),
      cell: (contact) => (
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
            <PhoneIcon size={14} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">
              {contact.displayName || contact.phoneNumber}
            </p>
            {contact.displayName ? (
              <p className="font-mono text-xs text-muted-foreground">{contact.phoneNumber}</p>
            ) : null}
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: t('settings.whatsappRoleOverride', undefined, 'Role'),
      cell: (contact) => (
        <Badge variant={ROLE_VARIANT[contact.waRole]} className="text-xs">
          {roleLabel(contact.waRole)}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-10 text-right',
      cell: (contact) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground">
              <MoreIcon size={14} aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onSelect={() => setEditing(contact)}>
              {t('settings.whatsappEditContact', undefined, 'Edit contact')}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => void handleToggleAutoReply(contact)}>
              {contact.autoReply
                ? t('settings.whatsappDisableAutoReply', undefined, 'Disable auto-reply')
                : t('settings.whatsappEnableAutoReply', undefined, 'Enable auto-reply')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onSelect={() => setPendingDelete(contact)}
            >
              {t('common.delete', undefined, 'Delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <>
      <SettingsSection
        title={t('settings.whatsappMessagingPolicies', undefined, 'Messaging policies')}
      >
        {configLoading ? (
          <p className="text-sm text-muted-foreground">
            {t('common.loading', undefined, 'Loading…')}
          </p>
        ) : (
          <>
            <SettingsRow
              label={t('settings.whatsappAutoReply', undefined, 'Auto-reply')}
              description={t(
                'settings.whatsappAutoReplyDescription',
                undefined,
                'Let the bot reply automatically to allowed contacts.',
              )}
            >
              <Switch
                checked={configData?.autoReply ?? true}
                onCheckedChange={(checked) => void handleConfigChange({ autoReply: checked })}
              />
            </SettingsRow>
            <SettingsRow
              label={t('settings.whatsappDmPolicy', undefined, 'Direct messages')}
              description={t(
                'settings.whatsappDmPolicyDescription',
                undefined,
                'Who the bot responds to in direct chats.',
              )}
            >
              <Combobox
                className={SHORT_INPUT_WIDTH}
                value={configData?.dmPolicy ?? 'allowlist'}
                options={policyOptions}
                clearable={false}
                onChange={(value) => {
                  if (!value) return;
                  void handleConfigChange({ dmPolicy: value as WhatsAppPolicy });
                }}
              />
            </SettingsRow>
            <SettingsRow
              label={t('settings.whatsappGroupPolicy', undefined, 'Group messages')}
              description={t(
                'settings.whatsappGroupPolicyDescription',
                undefined,
                'Who the bot responds to in group chats.',
              )}
            >
              <Combobox
                className={SHORT_INPUT_WIDTH}
                value={configData?.groupPolicy ?? 'disabled'}
                options={policyOptions}
                clearable={false}
                onChange={(value) => {
                  if (!value) return;
                  void handleConfigChange({ groupPolicy: value as WhatsAppPolicy });
                }}
              />
            </SettingsRow>
          </>
        )}
      </SettingsSection>

      <div className="space-y-4 border-t border-border/50 pt-6">
        <div className="flex items-center justify-between gap-4">
          <h3 className="text-sm font-semibold text-foreground">
            {t('settings.whatsappAllowedContacts', undefined, 'Allowed contacts')}
            {!contactsLoading && contacts.length > 0 ? (
              <span className="ml-1.5 font-normal text-muted-foreground">({contacts.length})</span>
            ) : null}
          </h3>
          <Button type="button" variant="outline" size="sm" onClick={() => setAddOpen(true)}>
            <PlusIcon size={14} aria-hidden="true" />
            {t('settings.whatsappAddContact', undefined, 'Add contact')}
          </Button>
        </div>

        {contactsLoading ? (
          <p className="text-sm text-muted-foreground">
            {t('common.loading', undefined, 'Loading…')}
          </p>
        ) : contacts.length === 0 ? (
          <p data-testid="wa-contacts-empty" className="text-sm text-muted-foreground">
            {t('settings.whatsappNoContacts', undefined, 'No contacts yet.')}
          </p>
        ) : (
          <SettingsTable
            columns={contactColumns}
            rows={contacts}
            getRowId={(contact) => contact.id}
          />
        )}
      </div>

      <SubEntityFormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        title={t('settings.whatsappAddContact', undefined, 'Add contact')}
        description={t(
          'settings.whatsappAllowedContactsDescription',
          undefined,
          'Only contacts on this list can interact with the bot.',
        )}
        submitLabel={t('settings.whatsappAddContact', undefined, 'Add contact')}
        isSubmitting={addContact.isPending}
        fields={addFields}
        defaultValues={{ phoneNumber: '', displayName: '', userId: '__none__', waRole: 'viewer' }}
        onSubmit={handleAddSubmit}
      />

      {editing ? (
        <SubEntityFormDialog
          open
          onOpenChange={(open) => !open && setEditing(null)}
          title={t('settings.whatsappEditContact', undefined, 'Edit contact')}
          description={editing.displayName || editing.phoneNumber}
          submitLabel={t('common.save', undefined, 'Save')}
          isSubmitting={updateContact.isPending}
          fields={editFields}
          defaultValues={{
            userId: editing.userId ?? '__none__',
            waRole: editing.waRole,
            autoReply: editing.autoReply,
          }}
          onSubmit={handleEditSubmit}
        />
      ) : null}

      <AlertDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('settings.whatsappDeleteContactTitle', undefined, 'Remove contact?')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                'settings.whatsappDeleteContactDescription',
                undefined,
                'This contact will no longer be able to interact with the bot.',
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel', undefined, 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={() => void handleDelete()}>
              {t('common.delete', undefined, 'Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
