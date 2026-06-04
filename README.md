# oktavius-v3

This repository is the extracted ERP base workspace being pulled out of `osiris_erp`.

The first frontend extraction slice now includes:

- `apps/web`: the extracted ERP shell application
- `packages/base-ui`: reusable base UI primitives
- a sample `users` module proving list, create, and detail composition
- **Bestattung Kunz demo org** — funeral-industry tenant with Sterbefälle, Kontakte, Katalog, 8 Filialen, and Osiris-aligned seed data

### Try the Kunz replacement demo

```bash
cd oktavius-v3 && pnpm --filter web dev
```

Open with the Kunz org pre-selected:

`http://localhost:5173/dashboard?org=bestattung-kunz`

Or switch org in the account menu (header) to **Bestattung Kunz**. Demo user: Klaus Ostermann (`ostermann@bestattung-kunz.at`).

**Osiris URLs work in v3** (same paths as production Osiris):

| Osiris           | v3 page          |
| ---------------- | ---------------- |
| `/funeral/cases` | Sterbefälle list |
| `/contacts`      | Kontakte         |
| `/catalog`       | Katalog          |
| `/storage`       | Ablage           |
| `/sales`         | Verkauf          |

Detail deep links work across tenants (org switches automatically), e.g. `http://localhost:5173/clients/cli_1001` (Apex) or `http://localhost:5173/contacts/cli_kunz_4` (Kunz).

The target shape follows the architecture defined in `../FE`.

## UI rules

All frontend/UI documentation: [`docs/ui-rules/README.md`](docs/ui-rules/README.md) — start with [`ui-system.md`](docs/ui-rules/ui-system.md) and [`patterns.md`](docs/ui-rules/patterns.md).
