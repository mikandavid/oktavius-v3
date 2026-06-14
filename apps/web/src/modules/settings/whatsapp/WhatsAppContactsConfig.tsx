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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Input,
  Label,
  PhoneInput,
  Switch,
} from '@oktavius/base-ui';
import { useMemo, useState } from 'react';

import { useTranslation } from '@/core/i18n';
import { MoreIcon, PhoneIcon, PlusIcon, WhatsAppPolicyIcon } from '@/lib/icons';
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

  const [newPhone, setNewPhone] = useState('');
  const [newName, setNewName] = useState('');
  const [newUserId, setNewUserId] = useState<string | null>(null);
  const [newRole, setNewRole] = useState<WhatsAppRole>('viewer');

  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [editRole, setEditRole] = useState<WhatsAppRole>('viewer');
  const [editAutoReply, setEditAutoReply] = useState(true);

  const contacts = contactsData?.contacts ?? [];

  const roleLabel = (role: WhatsAppRole) =>
    t(`settings.role${role.charAt(0).toUpperCase()}${role.slice(1)}`, undefined, role);

  const policyLabel = (policy: WhatsAppPolicy) => {
    if (policy === 'allowlist')
      return t('settings.whatsappPolicyAllowlist', undefined, 'Allowlist');
    return t('settings.whatsappPolicyDisabled', undefined, 'Disabled');
  };

  const resetAddForm = () => {
    setNewPhone('');
    setNewName('');
    setNewUserId(null);
    setNewRole('viewer');
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

  const handleAdd = async () => {
    const phoneNumber = newPhone.replace(/\s+/g, '');
    if (!phoneNumber) {
      appToast.error(t('settings.whatsappPhoneRequired', undefined, 'Enter a phone number.'));
      return;
    }
    try {
      await addContact.mutateAsync({
        phoneNumber,
        displayName: newName.trim() || undefined,
        autoReply: true,
        userId: newUserId,
        waRole: newRole,
      });
      resetAddForm();
      setAddOpen(false);
      appToast.success(t('settings.whatsappContactAdded', undefined, 'Contact added.'));
    } catch (error) {
      appToast.fromApiError(
        error,
        t('settings.whatsappAddContactFailed', undefined, 'Contact could not be added.'),
      );
    }
  };

  const openEdit = (contact: OsirisWhatsAppContact) => {
    setEditUserId(contact.userId ?? null);
    setEditRole(contact.waRole);
    setEditAutoReply(contact.autoReply);
    setEditing(contact);
  };

  const handleEditSave = async () => {
    if (!editing) return;
    try {
      await updateContact.mutateAsync({
        id: editing.id,
        userId: editUserId,
        waRole: editRole,
        autoReply: editAutoReply,
      });
      setEditing(null);
      appToast.success(t('settings.whatsappContactUpdated', undefined, 'Contact updated.'));
    } catch (error) {
      appToast.fromApiError(
        error,
        t('settings.whatsappUpdateContactFailed', undefined, 'Contact could not be updated.'),
      );
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

  return (
    <>
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <WhatsAppPolicyIcon size={14} className="text-muted-foreground" aria-hidden="true" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t('settings.whatsappMessagingPolicies', undefined, 'Messaging policies')}
          </h2>
        </div>

        {configLoading ? (
          <p className="text-sm text-muted-foreground">
            {t('common.loading', undefined, 'Loading…')}
          </p>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label className="text-sm">
                  {t('settings.whatsappAutoReply', undefined, 'Auto-reply')}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {t(
                    'settings.whatsappAutoReplyDescription',
                    undefined,
                    'Let the bot reply automatically to allowed contacts.',
                  )}
                </p>
              </div>
              <Switch
                checked={configData?.autoReply ?? true}
                onCheckedChange={(checked) => void handleConfigChange({ autoReply: checked })}
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <Label className="text-sm">
                  {t('settings.whatsappDmPolicy', undefined, 'Direct messages')}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {t(
                    'settings.whatsappDmPolicyDescription',
                    undefined,
                    'Who the bot responds to in direct chats.',
                  )}
                </p>
              </div>
              <Combobox
                className="w-[150px]"
                value={configData?.dmPolicy ?? 'allowlist'}
                options={policyOptions}
                clearable={false}
                onChange={(value) => {
                  if (!value) return;
                  void handleConfigChange({ dmPolicy: value as WhatsAppPolicy });
                }}
              />
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <Label className="text-sm">
                  {t('settings.whatsappGroupPolicy', undefined, 'Group messages')}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {t(
                    'settings.whatsappGroupPolicyDescription',
                    undefined,
                    'Who the bot responds to in group chats.',
                  )}
                </p>
              </div>
              <Combobox
                className="w-[150px]"
                value={configData?.groupPolicy ?? 'disabled'}
                options={policyOptions}
                clearable={false}
                onChange={(value) => {
                  if (!value) return;
                  void handleConfigChange({ groupPolicy: value as WhatsAppPolicy });
                }}
              />
            </div>
          </div>
        )}
      </section>

      <div className="border-t border-border" />

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PhoneIcon size={14} className="text-muted-foreground" aria-hidden="true" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t('settings.whatsappAllowedContacts', undefined, 'Allowed contacts')}
            </h2>
            {!contactsLoading && contacts.length > 0 ? (
              <span className="text-xs text-muted-foreground">({contacts.length})</span>
            ) : null}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              resetAddForm();
              setAddOpen(true);
            }}
          >
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
          <div className="divide-y divide-border rounded-control border border-border">
            {contacts.map((contact) => (
              <div key={contact.id} className="flex items-center justify-between gap-4 px-3 py-2.5">
                <div className="flex min-w-0 items-center gap-2.5">
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
                    <PhoneIcon size={14} aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {contact.displayName || contact.phoneNumber}
                    </p>
                    {contact.displayName ? (
                      <p className="font-mono text-xs text-muted-foreground">
                        {contact.phoneNumber}
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge variant={ROLE_VARIANT[contact.waRole]} className="text-xs">
                    {roleLabel(contact.waRole)}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-muted-foreground"
                      >
                        <MoreIcon size={14} aria-hidden="true" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onSelect={() => openEdit(contact)}>
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
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('settings.whatsappAddContact', undefined, 'Add contact')}</DialogTitle>
            <DialogDescription>
              {t(
                'settings.whatsappAllowedContactsDescription',
                undefined,
                'Only contacts on this list can interact with the bot.',
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="wa-phone" className="text-xs text-muted-foreground">
                {t('settings.whatsappPhoneNumber', undefined, 'Phone number')}
              </Label>
              <PhoneInput id="wa-phone" value={newPhone} onChange={setNewPhone} />
              <p className="text-xs text-muted-foreground">
                {t(
                  'settings.whatsappPhoneHint',
                  undefined,
                  'Select the country and enter the number; it is normalized to international format.',
                )}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="wa-name" className="text-xs text-muted-foreground">
                {t('settings.whatsappDisplayNameOptional', undefined, 'Display name (optional)')}
              </Label>
              <Input
                id="wa-name"
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  {t('settings.whatsappLinkUser', undefined, 'Linked user')}
                </Label>
                <Combobox
                  value={newUserId ?? '__none__'}
                  options={memberOptions}
                  clearable={false}
                  onChange={(value) => {
                    setNewUserId(value === '__none__' || !value ? null : value);
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  {t('settings.whatsappRoleOverride', undefined, 'Role override')}
                </Label>
                <Combobox
                  value={newRole}
                  options={roleOptions}
                  clearable={false}
                  onChange={(value) => {
                    if (value) setNewRole(value as WhatsAppRole);
                  }}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setAddOpen(false)}>
              {t('common.cancel', undefined, 'Cancel')}
            </Button>
            <Button size="sm" onClick={() => void handleAdd()} disabled={addContact.isPending}>
              {t('settings.whatsappAddContact', undefined, 'Add contact')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t('settings.whatsappEditContact', undefined, 'Edit contact')}
            </DialogTitle>
            <DialogDescription>{editing?.displayName || editing?.phoneNumber}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                {t('settings.whatsappLinkUser', undefined, 'Linked user')}
              </Label>
              <Combobox
                value={editUserId ?? '__none__'}
                options={memberOptions}
                clearable={false}
                onChange={(value) => {
                  setEditUserId(value === '__none__' || !value ? null : value);
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                {t('settings.whatsappRoleOverride', undefined, 'Role override')}
              </Label>
              <Combobox
                value={editRole}
                options={roleOptions}
                clearable={false}
                onChange={(value) => {
                  if (value) setEditRole(value as WhatsAppRole);
                }}
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <Label className="text-sm">
                {t('settings.whatsappAutoReply', undefined, 'Auto-reply')}
              </Label>
              <Switch checked={editAutoReply} onCheckedChange={setEditAutoReply} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setEditing(null)}>
              {t('common.cancel', undefined, 'Cancel')}
            </Button>
            <Button
              size="sm"
              onClick={() => void handleEditSave()}
              disabled={updateContact.isPending}
            >
              {t('common.save', undefined, 'Save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
