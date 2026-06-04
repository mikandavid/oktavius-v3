type BulkImportToast = {
  success: (message: string) => unknown;
  error: (message: string) => unknown;
  fromApiError: (error: unknown, fallback?: string) => unknown;
};

type CompleteBulkImportOptions = {
  file: File | null;
  entityLabel: string;
  onImport: (file: File) => Promise<number | void>;
  toast: BulkImportToast;
};

function titleCase(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export async function completeBulkImport({
  file,
  entityLabel,
  onImport,
  toast,
}: CompleteBulkImportOptions) {
  if (!file) {
    toast.error(`Choose a file before importing ${entityLabel}.`);
    return false;
  }

  try {
    const importedCount = await onImport(file);
    toast.success(
      typeof importedCount === 'number'
        ? `Imported ${importedCount} ${entityLabel} from ${file.name}.`
        : `Imported ${entityLabel} from ${file.name}.`,
    );
    return true;
  } catch (error) {
    toast.fromApiError(error, `${titleCase(entityLabel)} could not be imported.`);
    return false;
  }
}
