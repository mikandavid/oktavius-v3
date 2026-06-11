# V3 Login Brand Refresh Design

## Goal

Refresh the V3 login screen so it feels more branded and polished while staying clean and operational. Add the Osiris browser tab icon assets to the V3 UI.

## Approved Direction

Use the Quiet Brand Wash direction:

- Center the auth card on a subtle, brand-tinted page wash.
- Keep the logo treatment clean with the octopus icon in a compact mark above the product name.
- Use brand color for the primary sign-in CTA instead of a plain default button treatment.
- Keep Google and Microsoft provider buttons as secondary outline actions.
- Avoid marketing copy, hero panels, or decorative layouts that would make the ERP login feel like a landing page.

## Implementation Scope

- Update `apps/web/src/modules/auth/AuthShell.tsx` to own the visual shell, logo mark, and card styling.
- Update `apps/web/src/modules/auth/LoginPage.tsx` only where needed for the primary CTA styling and divider contrast.
- Copy Osiris favicon assets from `osiris_erp/apps/web/public` into `oktavius-v3/apps/web/public`.
- Add favicon links to `apps/web/index.html`, matching the Osiris asset set.
- Keep existing auth behavior, redirect logic, provider sign-in behavior, translations, and tests intact.

## Testing

- Run the focused login tests.
- Run typecheck or lint if the local project state allows it.
- Start the V3 dev server and inspect `/login` in the browser for desktop and mobile layout.
