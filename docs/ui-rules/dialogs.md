# Dialogs

## Pick the right pattern

| Need                                  | Component                                                              |
| ------------------------------------- | ---------------------------------------------------------------------- |
| Form modal (add/edit sub-entity)      | `<Dialog>` + `<EntityForm surface="dialog">`                           |
| Standard Cancel + Save footer         | `<DialogFormFooter confirmVariant="cta">`                              |
| Page-level delete (header trash icon) | `<ConfirmActionDialog>` — `confirmLabel="Delete"`, destructive         |
| Row-level delete (table/menu)         | Built-in `confirm` on `CrudRowAction`, or `<ConfirmPopover>`           |
| Blocking yes/no (rare)                | `<AlertDialog>` — `AlertDialogAction variant="destructive"` for delete |

## DialogFormFooter

```tsx
<DialogFooter via DialogFormFooter>
  cancelLabel="Cancel"
  confirmLabel="Save"
  confirmForm="party-form"   // when submit is type="submit" on external form
  confirmVariant="cta"       // Save / Create — always cta in dialogs
/>
```

Cancel is always `ghost`. Confirm is always `cta` unless destructive delete.

## ConfirmActionDialog (page delete)

```tsx
<ConfirmActionDialog
  open={confirmDeleteOpen}
  onOpenChange={setConfirmDeleteOpen}
  title={`Delete ${name}?`}
  description="This action cannot be undone."
  confirmLabel="Delete"
  onConfirm={() => navigate('/clients')}
/>
```

## Don't

- `window.confirm()` or custom overlay divs
- `variant="default"` on dialog Save buttons — use `cta`
- `ConfirmActionDialog` for inline row deletes — too heavy; use `ConfirmPopover` or row action `confirm`
- `variant="outline"` on dialog Cancel / Back / dismiss buttons — use `ghost`
- Hand-roll `<DialogFooter>` with mismatched button sizes

Transient success/error after dialog actions: `toast` from `@/lib/toast`.
