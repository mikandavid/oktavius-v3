import { useState } from 'react';

import {
  AddressField,
  Checkbox,
  Combobox,
  DatePicker,
  DateRangePicker,
  FileInput,
  FormField,
  Input,
  Label,
  MultiSelect,
  NumberInput,
  PhoneInput,
  RadioGroupField,
  Switch,
  TagsInput,
  Textarea,
} from '@oktavius/base-ui';

import { ShowcaseBlock } from '../shared';

export function InputsSection() {
  const [text, setText] = useState('Apex Technologies');
  const [combobox, setCombobox] = useState('vienna');
  const [multi, setMulti] = useState<string[]>(['sales', 'support']);
  const [tags, setTags] = useState<string[]>(['enterprise', 'priority']);
  const [checked, setChecked] = useState(true);
  const [switched, setSwitched] = useState(true);
  const [number, setNumber] = useState('128450');
  const [phone, setPhone] = useState('+43 1 234 5678');
  const [date, setDate] = useState('2024-12-15');
  const [time, setTime] = useState('14:30');
  const [datetime, setDatetime] = useState('2024-12-15T14:30');
  const [rangeStart, setRangeStart] = useState('2024-12-01');
  const [rangeEnd, setRangeEnd] = useState('2024-12-31');
  const [radio, setRadio] = useState('company');
  const [address, setAddress] = useState({
    line1: 'Mariahilfer Straße 1',
    line2: '',
    postalCode: '1060',
    city: 'Vienna',
    country: 'AT',
  });

  return (
    <div className="space-y-4">
      <ShowcaseBlock title="Text inputs" meta="Filled grey · h-9 · focus ring">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="inp-text" label="Normal">
            <Input id="inp-text" value={text} onChange={(e) => setText(e.target.value)} />
          </FormField>
          <FormField id="inp-disabled" label="Disabled">
            <Input id="inp-disabled" disabled defaultValue="Read-only" />
          </FormField>
          <FormField id="inp-error" label="Error" error="This field is required">
            <Input id="inp-error" defaultValue="" placeholder="Required" />
          </FormField>
          <FormField id="inp-valid" label="Valid" valid>
            <Input id="inp-valid" validationState="valid" defaultValue="anna.hofer@osiris.test" />
          </FormField>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="inp-textarea">Textarea</Label>
            <Textarea id="inp-textarea" rows={3} defaultValue="Multi-line notes for the record." />
          </div>
        </div>
      </ShowcaseBlock>

      <ShowcaseBlock
        title="Pickers & selects"
        meta="Combobox for all single-select · MultiSelect for many"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="inp-combobox" label="Combobox">
            <Combobox
              id="inp-combobox"
              value={combobox}
              onChange={(v) => setCombobox(v ?? '')}
              options={[
                { value: 'vienna', label: 'Vienna' },
                { value: 'linz', label: 'Linz' },
                { value: 'munich', label: 'Munich' },
              ]}
              placeholder="Select city"
            />
          </FormField>
          <FormField id="inp-multi" label="MultiSelect">
            <MultiSelect
              value={multi}
              onChange={setMulti}
              options={[
                { value: 'sales', label: 'Sales' },
                { value: 'support', label: 'Support' },
                { value: 'billing', label: 'Billing' },
              ]}
              placeholder="Select teams"
            />
          </FormField>
          <FormField id="inp-tags" label="TagsInput" className="sm:col-span-2">
            <TagsInput value={tags} onChange={setTags} placeholder="Add tag, Enter to confirm" />
          </FormField>
        </div>
      </ShowcaseBlock>

      <ShowcaseBlock
        title="Numbers, phone, dates"
        meta="NumberInput formats on blur · DD.MM.YYYY display"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField id="inp-number" label="NumberInput">
            <NumberInput id="inp-number" value={number} onChange={setNumber} decimals={0} />
          </FormField>
          <FormField id="inp-phone" label="PhoneInput">
            <PhoneInput id="inp-phone" value={phone} onChange={setPhone} />
          </FormField>
          <FormField id="inp-date" label="Date">
            <DatePicker mode="date" value={date} onChange={(v) => setDate(v ?? '')} />
          </FormField>
          <FormField id="inp-time" label="Time">
            <DatePicker mode="time" value={time} onChange={(v) => setTime(v ?? '')} />
          </FormField>
          <FormField id="inp-datetime" label="Date & time" className="sm:col-span-2">
            <DatePicker mode="datetime" value={datetime} onChange={(v) => setDatetime(v ?? '')} />
          </FormField>
          <FormField id="inp-range" label="DateRangePicker" className="sm:col-span-2">
            <DateRangePicker
              startValue={rangeStart}
              endValue={rangeEnd}
              onStartChange={(v) => setRangeStart(v ?? '')}
              onEndChange={(v) => setRangeEnd(v ?? '')}
            />
          </FormField>
        </div>
      </ShowcaseBlock>

      <ShowcaseBlock title="Boolean & choice" meta="Checkbox / Switch inline label in forms">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-2">
            <Checkbox
              id="inp-check"
              checked={checked}
              onCheckedChange={(v) => setChecked(v === true)}
            />
            <Label htmlFor="inp-check">Accept terms</Label>
          </div>
          <div className="flex items-center justify-between gap-4">
            <Label htmlFor="inp-switch">Enable sync</Label>
            <Switch id="inp-switch" checked={switched} onCheckedChange={setSwitched} />
          </div>
          <FormField id="inp-radio" label="Account type" className="sm:col-span-2">
            <RadioGroupField
              value={radio}
              onChange={setRadio}
              options={[
                { value: 'company', label: 'Company' },
                { value: 'individual', label: 'Individual' },
              ]}
            />
          </FormField>
        </div>
      </ShowcaseBlock>

      <ShowcaseBlock title="Address & file" meta="AddressField · FileInput drag-and-drop">
        <div className="grid gap-4">
          <FormField id="inp-address" label="AddressField">
            <AddressField value={address} onChange={setAddress} />
          </FormField>
          <FormField id="inp-file" label="FileInput">
            <FileInput id="inp-file" onChange={() => undefined} accept=".csv,.xlsx,.pdf" />
          </FormField>
        </div>
      </ShowcaseBlock>
    </div>
  );
}
