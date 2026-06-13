import {
  Combobox,
  Input,
  NumberInput,
  SettingsRow,
  SettingsSection,
  Switch,
  Textarea,
} from '@oktavius/base-ui';

import { useTranslation } from '@/core/i18n';
import { normalizeCountryCode, useCountryOptions } from '@/lib/reference-data';
import { isValidBic, isValidIban } from '@/lib/validation/bankIdentifiers';
import type { OsirisWorkspaceSettings } from '@/runtime/osiris/workspaceSettingsClient';

import { AutosaveStatus } from './AutosaveStatus';

type OrganizationSettingsSectionProps = {
  settings: OsirisWorkspaceSettings;
  saving: boolean;
  savedAt: number | null;
  onChange: (settings: OsirisWorkspaceSettings) => void;
};

const INPUT_CLASS = 'w-full sm:w-[24rem]';
const SHORT_INPUT_CLASS = 'w-full sm:w-[12rem]';
const TEXTAREA_CLASS = 'min-h-[88px]';

function parseInteger(value: string, fallback: number) {
  const next = Number.parseInt(value, 10);
  return Number.isFinite(next) ? next : fallback;
}

export function OrganizationSettingsSection({
  settings,
  saving,
  savedAt,
  onChange,
}: OrganizationSettingsSectionProps) {
  const { t } = useTranslation();
  const s = (key: string, fallback: string) => t(`settings.${key}`, undefined, fallback);
  const countryOptions = useCountryOptions('dach');

  const updateCompany = (key: keyof OsirisWorkspaceSettings['company'], value: string) => {
    onChange({
      ...settings,
      company: {
        ...settings.company,
        [key]: value,
      },
    });
  };

  const updateAddress = (
    key: keyof OsirisWorkspaceSettings['company']['address'],
    value: string,
  ) => {
    onChange({
      ...settings,
      company: {
        ...settings.company,
        address: {
          ...settings.company.address,
          [key]: value,
        },
      },
    });
  };

  const updateBanking = (key: keyof OsirisWorkspaceSettings['banking'], value: string) => {
    onChange({
      ...settings,
      banking: {
        ...settings.banking,
        [key]: value,
      },
    });
  };

  const updateInvoicing = <Key extends keyof OsirisWorkspaceSettings['invoicing']>(
    key: Key,
    value: OsirisWorkspaceSettings['invoicing'][Key],
  ) => {
    onChange({
      ...settings,
      invoicing: {
        ...settings.invoicing,
        [key]: value,
      },
    });
  };

  // Stored country is an ISO code; normalize any legacy free-text value so the
  // picker matches an option instead of showing blank.
  const countryValue =
    normalizeCountryCode(settings.company.address.country) ?? settings.company.address.country;
  const ibanInvalid = settings.banking.iban.trim() !== '' && !isValidIban(settings.banking.iban);
  const bicInvalid = settings.banking.bic.trim() !== '' && !isValidBic(settings.banking.bic);

  return (
    <div className="space-y-8">
      <SettingsSection
        title={s('companyInfo', 'Company Information')}
        description={s('companyInfoDesc', 'This data appears on invoices and quotes.')}
      >
        <SettingsRow label={s('legalName', 'Legal Name')}>
          <Input
            className={INPUT_CLASS}
            name="company.legalName"
            value={settings.company.legalName}
            onChange={(event) => updateCompany('legalName', event.target.value)}
          />
        </SettingsRow>
        <SettingsRow label={s('address', 'Address')}>
          <Input
            className={INPUT_CLASS}
            value={settings.company.address.line1}
            onChange={(event) => updateAddress('line1', event.target.value)}
          />
        </SettingsRow>
        <SettingsRow label={s('addressLine2', 'Address Line 2')}>
          <Input
            className={INPUT_CLASS}
            value={settings.company.address.line2}
            onChange={(event) => updateAddress('line2', event.target.value)}
          />
        </SettingsRow>
        <SettingsRow label={s('postalCode', 'Postal Code')}>
          <Input
            className={SHORT_INPUT_CLASS}
            value={settings.company.address.postalCode}
            onChange={(event) => updateAddress('postalCode', event.target.value)}
          />
        </SettingsRow>
        <SettingsRow label={s('city', 'City')}>
          <Input
            className={INPUT_CLASS}
            value={settings.company.address.city}
            onChange={(event) => updateAddress('city', event.target.value)}
          />
        </SettingsRow>
        <SettingsRow label={s('country', 'Country')}>
          <Combobox
            className={SHORT_INPUT_CLASS}
            options={countryOptions}
            value={countryValue}
            onChange={(value) => updateAddress('country', value ?? '')}
            placeholder={s('countryPlaceholder', 'Select country…')}
            clearable
          />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection
        title={s('taxAndRegistry', 'Tax & Registry')}
        description={s(
          'taxAndRegistryDesc',
          'Legal identifiers used for official documents and finance workflows.',
        )}
      >
        <SettingsRow label={s('taxId', 'Tax ID')}>
          <Input
            className={INPUT_CLASS}
            value={settings.company.taxId}
            onChange={(event) => updateCompany('taxId', event.target.value)}
          />
        </SettingsRow>
        <SettingsRow label={s('vatId', 'VAT ID')}>
          <Input
            className={INPUT_CLASS}
            value={settings.company.vatId}
            onChange={(event) => updateCompany('vatId', event.target.value)}
          />
        </SettingsRow>
        <SettingsRow label={s('registrationNumber', 'Registration Number')}>
          <Input
            className={INPUT_CLASS}
            value={settings.company.registrationNumber}
            onChange={(event) => updateCompany('registrationNumber', event.target.value)}
          />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection
        title={s('contact', 'Contact')}
        description={s('contactDesc', 'Public company contact details for documents and emails.')}
      >
        <SettingsRow label={s('email', 'Email')}>
          <Input
            className={INPUT_CLASS}
            type="email"
            value={settings.company.email}
            onChange={(event) => updateCompany('email', event.target.value)}
          />
        </SettingsRow>
        <SettingsRow label={s('phone', 'Phone')}>
          <Input
            className={INPUT_CLASS}
            value={settings.company.phone}
            onChange={(event) => updateCompany('phone', event.target.value)}
          />
        </SettingsRow>
        <SettingsRow label={s('website', 'Website')}>
          <Input
            className={INPUT_CLASS}
            value={settings.company.website}
            onChange={(event) => updateCompany('website', event.target.value)}
          />
        </SettingsRow>
      </SettingsSection>

      <SettingsSection
        title={s('banking', 'Bank Details')}
        description={s('bankingDesc', 'Displayed on invoices and dunning letters.')}
      >
        <SettingsRow label={s('bankName', 'Bank Name')}>
          <Input
            className={INPUT_CLASS}
            name="banking.bankName"
            value={settings.banking.bankName}
            onChange={(event) => updateBanking('bankName', event.target.value)}
          />
        </SettingsRow>
        <SettingsRow label={s('accountHolder', 'Account Holder')}>
          <Input
            className={INPUT_CLASS}
            value={settings.banking.accountHolder}
            onChange={(event) => updateBanking('accountHolder', event.target.value)}
          />
        </SettingsRow>
        <SettingsRow label={s('iban', 'IBAN')} layout="stacked">
          <div className="space-y-1">
            <Input
              className={`${INPUT_CLASS} font-mono`}
              value={settings.banking.iban}
              validationState={ibanInvalid ? 'invalid' : undefined}
              aria-invalid={ibanInvalid || undefined}
              onChange={(event) => updateBanking('iban', event.target.value)}
            />
            {ibanInvalid ? (
              <p className="text-xs text-destructive">
                {s('ibanInvalid', 'This does not look like a valid IBAN.')}
              </p>
            ) : null}
          </div>
        </SettingsRow>
        <SettingsRow label={s('bic', 'BIC')} layout="stacked">
          <div className="space-y-1">
            <Input
              className={`${INPUT_CLASS} font-mono`}
              value={settings.banking.bic}
              validationState={bicInvalid ? 'invalid' : undefined}
              aria-invalid={bicInvalid || undefined}
              onChange={(event) => updateBanking('bic', event.target.value)}
            />
            {bicInvalid ? (
              <p className="text-xs text-destructive">
                {s('bicInvalid', 'This does not look like a valid BIC/SWIFT code.')}
              </p>
            ) : null}
          </div>
        </SettingsRow>
      </SettingsSection>

      <SettingsSection
        title={s('invoicing', 'Invoice Settings')}
        description={s('invoicingDesc', 'Default values for new invoices and dunning.')}
      >
        <SettingsRow label={s('paymentTermsDays', 'Payment Terms (days)')}>
          <NumberInput
            className={`${SHORT_INPUT_CLASS} text-right`}
            decimals={0}
            min={0}
            value={settings.invoicing.defaultPaymentTermsDays}
            onChange={(value) =>
              updateInvoicing(
                'defaultPaymentTermsDays',
                parseInteger(value, settings.invoicing.defaultPaymentTermsDays),
              )
            }
          />
        </SettingsRow>
        <SettingsRow
          label={s('dunningEnabled', 'Dunning enabled')}
          description={s(
            'dunningEnabledDesc',
            'Apply the configured reminder workflow to overdue invoices.',
          )}
        >
          <Switch
            checked={settings.invoicing.dunningEnabled}
            onCheckedChange={(checked) => updateInvoicing('dunningEnabled', checked)}
          />
        </SettingsRow>
        <SettingsRow label={s('footerText', 'Invoice Footer Text')} layout="stacked">
          <Textarea
            className={TEXTAREA_CLASS}
            value={settings.invoicing.footerText}
            placeholder={s('footerTextPlaceholder', 'Optional text at the bottom of each invoice')}
            onChange={(event) => updateInvoicing('footerText', event.target.value)}
          />
        </SettingsRow>
      </SettingsSection>

      <div className="flex min-h-[1.25rem] justify-end border-t border-border/50 pt-4">
        <AutosaveStatus
          saving={saving}
          savedAt={savedAt}
          savingLabel={t('common.saving', undefined, 'Saving…')}
          savedLabel={s('saved', 'Saved')}
        />
      </div>
    </div>
  );
}
