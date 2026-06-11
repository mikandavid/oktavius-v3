# V3 Login Brand Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refresh the V3 login screen with clean logo-led branding, a brand-color primary CTA, and Osiris favicon parity.

**Architecture:** Keep auth logic unchanged. Put the page-level visual treatment in `AuthShell`, keep login form behavior in `LoginPage`, and serve browser icons through static public assets referenced from `index.html`.

**Tech Stack:** React 19, React Router 7, Tailwind v3 semantic tokens, Vite, Vitest.

---

## File Structure

- Modify `apps/web/src/modules/auth/AuthShell.tsx`: page wash, logo mark, centered product identity, and card surface.
- Modify `apps/web/src/modules/auth/LoginPage.tsx`: primary CTA styling and divider label background to fit the refreshed card.
- Modify `apps/web/index.html`: favicon and touch icon links.
- Copy into `apps/web/public`: `favicon.ico`, `favicon-16x16.png`, `favicon-32x32.png`, `oktavius-app-icon.png`, and `apple-touch-icon.png` from Osiris.
- Test `apps/web/src/modules/auth/LoginPage.test.tsx`: existing behavior coverage should remain green.

### Task 1: Auth Shell Visual Refresh

**Files:**

- Modify: `apps/web/src/modules/auth/AuthShell.tsx`
- Test: `apps/web/src/modules/auth/LoginPage.test.tsx`

- [ ] **Step 1: Run the existing focused login test baseline**

Run: `pnpm --filter @oktavius/web exec vitest run src/modules/auth/LoginPage.test.tsx`

Expected: PASS before visual-only edits, or fail only for an existing unrelated environment issue.

- [ ] **Step 2: Update the auth shell**

Replace the `AuthShell` render markup with a centered branded shell:

```tsx
return (
  <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary)/0.14),transparent_34%),linear-gradient(145deg,hsl(var(--background))_0%,hsl(var(--muted)/0.72)_48%,hsl(var(--background))_100%)] p-4">
    <div className="w-full max-w-sm">
      <div className="mb-5 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-card bg-primary shadow-sm shadow-primary/25">
          <img src="/oktavius_shaded.svg" alt="" className="h-8 w-8" aria-hidden="true" />
        </div>
        <h1 className="text-xl font-semibold text-foreground">{t('auth.productName')}</h1>
      </div>
      <Card className="rounded-card bg-card/95 shadow-xl shadow-primary/10">
        <CardHeader className="text-center">
          <CardTitle className="text-lg">{title}</CardTitle>
          <p className="text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </div>
  </main>
);
```

- [ ] **Step 3: Run focused login tests**

Run: `pnpm --filter @oktavius/web exec vitest run src/modules/auth/LoginPage.test.tsx`

Expected: PASS.

### Task 2: Login CTA And Divider Polish

**Files:**

- Modify: `apps/web/src/modules/auth/LoginPage.tsx`
- Test: `apps/web/src/modules/auth/LoginPage.test.tsx`

- [ ] **Step 1: Update the primary submit button**

Change the submit button to use the brand CTA variant and keep full width:

```tsx
<Button type="submit" variant="cta" className="w-full" disabled={isSubmitting}>
  {isSubmitting ? t('auth.signingIn') : t('auth.login')}
</Button>
```

- [ ] **Step 2: Adjust the divider label background**

Keep the divider readable inside the updated translucent card:

```tsx
<span className="bg-card px-2 text-muted-foreground">{t('auth.orContinueWith')}</span>
```

If `bg-card` already fits after visual inspection, leave this line unchanged.

- [ ] **Step 3: Run focused login tests**

Run: `pnpm --filter @oktavius/web exec vitest run src/modules/auth/LoginPage.test.tsx`

Expected: PASS.

### Task 3: Favicon Parity

**Files:**

- Modify: `apps/web/index.html`
- Create or replace: `apps/web/public/favicon.ico`
- Create or replace: `apps/web/public/favicon-16x16.png`
- Create or replace: `apps/web/public/favicon-32x32.png`
- Create or replace: `apps/web/public/oktavius-app-icon.png`
- Create or replace: `apps/web/public/apple-touch-icon.png`

- [ ] **Step 1: Copy Osiris favicon assets**

Run these copies from the repository root:

```bash
cp ../osiris_erp/apps/web/public/favicon.ico apps/web/public/favicon.ico
cp ../osiris_erp/apps/web/public/favicon-16x16.png apps/web/public/favicon-16x16.png
cp ../osiris_erp/apps/web/public/favicon-32x32.png apps/web/public/favicon-32x32.png
cp ../osiris_erp/apps/web/public/oktavius-app-icon.png apps/web/public/oktavius-app-icon.png
cp ../osiris_erp/apps/web/public/apple-touch-icon.png apps/web/public/apple-touch-icon.png
```

- [ ] **Step 2: Add favicon links to `apps/web/index.html`**

Add these lines inside `<head>` after the viewport meta tag:

```html
<link rel="shortcut icon" href="/favicon.ico?v=2" />
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png?v=2" />
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png?v=2" />
<link rel="icon" type="image/png" href="/oktavius-app-icon.png?v=2" />
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png?v=2" />
```

- [ ] **Step 3: Confirm assets exist**

Run: `find apps/web/public -maxdepth 1 -type f | sort`

Expected: output includes all five copied icon files plus existing `oktavius_shaded.svg`.

### Task 4: Final Verification

**Files:**

- Verify only.

- [ ] **Step 1: Run focused tests**

Run: `pnpm --filter @oktavius/web exec vitest run src/modules/auth/LoginPage.test.tsx`

Expected: PASS.

- [ ] **Step 2: Run typecheck**

Run: `pnpm --filter @oktavius/web typecheck`

Expected: PASS.

- [ ] **Step 3: Start local dev server**

Run: `pnpm --filter @oktavius/web dev -- --host 127.0.0.1 --port 5177`

Expected: Vite serves the app at `http://127.0.0.1:5177`.

- [ ] **Step 4: Inspect `/login`**

Open `http://127.0.0.1:5177/login`. Confirm the page shows a clean centered login card, octopus logo mark, brand-color sign-in button, quiet provider buttons, and the browser tab icon.
