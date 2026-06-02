# Date display format

## Standard

**All user-visible dates:** `DD.MM.YYYY` (e.g. `18.12.2024`)

**Date + time:** `DD.MM.YYYY HH:mm` (e.g. `18.12.2024 09:12`)

## API

```ts
import { formatDisplayDate, formatDisplayDateTime } from '@oktavius/base-ui';
```

| Use                                                 | Function                           |
| --------------------------------------------------- | ---------------------------------- |
| Table `type: 'date'`, detail fields, StatCard dates | `formatDisplayDate(iso)`           |
| Incident meta, RelativeTime tooltip                 | `formatDisplayDateTime(iso)`       |
| Form / API state                                    | ISO `YYYY-MM-DD` — never shown raw |

## Don't

- `toLocaleDateString('en-US', { month: 'short', … })` or `MMM d, yyyy` in UI
- Ad-hoc `formatDate` helpers per module — use shared formatters
- `DatePicker` already displays `dd.MM.yyyy` — keep internal value ISO

## Tables

`CrudTable` `type: 'date'` uses `formatDisplayDate` automatically.

List tables must stay inside `max-w-full` containers (`CrudMainView` + `columnStretch="all"`).
