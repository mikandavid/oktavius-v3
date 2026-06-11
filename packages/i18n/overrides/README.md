# Translation Overrides

This folder contains translation overrides for specific industries and organizations.

## Structure

```
overrides/
├── industries/
│   ├── healthcare/
│   │   ├── de/
│   │   │   └── entities.json
│   │   └── en/
│   │       └── entities.json
│   └── manufacturing/
│       ├── de/
│       │   └── entities.json
│       └── en/
│           └── entities.json
└── organizations/
    └── [organization-id]/
        ├── de/
        │   └── entities.json
        └── en/
            └── entities.json
```

## Override Priority

The translation resolution follows this priority order:

1. **Organization Override** - Specific to a single organization
2. **Industry Override** - Applies to all organizations in an industry
3. **Base Translation** - Default translations for the language
4. **Fallback Language** - English translations if key not found in target language

## Usage

### Industry Overrides

Create a folder named after the industry key (e.g., `healthcare`, `manufacturing`, `construction`, `retail`) in the `industries/` directory. Add language-specific JSON files following the same structure as base translations.

Example: Healthcare industry wants "Patient" instead of "Client"

```json
// overrides/industries/healthcare/en/entities.json
{
  "client": "Patient",
  "clients": "Patients"
}
```

### Organization Overrides

Create a folder named after the organization UUID in the `organizations/` directory. Add language-specific JSON files for any translations you want to override.

Example: Organization wants custom terminology

```json
// overrides/organizations/[org-uuid]/en/entities.json
{
  "client": "Member",
  "clients": "Members"
}
```

## Adding New Overrides

1. Create the appropriate directory structure
2. Only include the keys you want to override (not all keys)
3. Follow the same nested structure as base translations
4. The system will automatically merge overrides with base translations
