import type { FieldDefinition } from '../types';
import { fieldDefinition as addressFieldDefinition } from './address';
import { fieldDefinition as checkboxFieldDefinition } from './checkbox';
import { fieldDefinition as comboboxFieldDefinition } from './combobox';
import { fieldDefinition as countryFieldDefinition } from './country';
import { fieldDefinition as currencyFieldDefinition } from './currency';
import { fieldDefinition as currencySelectFieldDefinition } from './currencySelect';
import { fieldDefinition as dateFieldDefinition } from './date';
import { fieldDefinition as datetimeFieldDefinition } from './datetime';
import { fieldDefinition as emailFieldDefinition } from './email';
import { fieldDefinition as fileFieldDefinition } from './file';
import { fieldDefinition as jsonFieldDefinition } from './json';
import { fieldDefinition as multiselectFieldDefinition } from './multiselect';
import { fieldDefinition as numberFieldDefinition } from './number';
import { fieldDefinition as phoneFieldDefinition } from './phone';
import { fieldDefinition as radioFieldDefinition } from './radio';
import { fieldDefinition as relationFieldDefinition } from './relation';
import { fieldDefinition as repeatingFieldDefinition } from './repeating';
import { fieldDefinition as selectFieldDefinition } from './select';
import { fieldDefinition as switchFieldDefinition } from './switch';
import { fieldDefinition as tagsFieldDefinition } from './tags';
import { fieldDefinition as textFieldDefinition } from './text';
import { fieldDefinition as textareaFieldDefinition } from './textarea';
import { fieldDefinition as timeFieldDefinition } from './time';
import { fieldDefinition as urlFieldDefinition } from './url';
import { fieldDefinition as vocabularyFieldDefinition } from './vocabulary';

export const builtinFieldDefinitions: FieldDefinition[] = [
  textFieldDefinition,
  emailFieldDefinition,
  urlFieldDefinition,
  textareaFieldDefinition,
  selectFieldDefinition,
  comboboxFieldDefinition,
  relationFieldDefinition,
  multiselectFieldDefinition,
  tagsFieldDefinition,
  radioFieldDefinition,
  vocabularyFieldDefinition,
  phoneFieldDefinition,
  addressFieldDefinition,
  countryFieldDefinition,
  currencySelectFieldDefinition,
  checkboxFieldDefinition,
  switchFieldDefinition,
  dateFieldDefinition,
  timeFieldDefinition,
  datetimeFieldDefinition,
  currencyFieldDefinition,
  numberFieldDefinition,
  fileFieldDefinition,
  jsonFieldDefinition,
  repeatingFieldDefinition,
];
