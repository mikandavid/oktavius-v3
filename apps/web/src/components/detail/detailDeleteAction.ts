type DetailDeleteToast = {
  success: (message: string) => unknown;
  fromApiError: (error: unknown, fallback?: string) => unknown;
};

type RunDetailDeleteActionOptions = {
  deleteRecord: () => Promise<void>;
  navigate: (to: string) => void;
  redirectTo: string;
  successMessage: string;
  errorMessage: string;
  toast: DetailDeleteToast;
};

export async function runDetailDeleteAction({
  deleteRecord,
  navigate,
  redirectTo,
  successMessage,
  errorMessage,
  toast,
}: RunDetailDeleteActionOptions) {
  try {
    await deleteRecord();
    toast.success(successMessage);
    navigate(redirectTo);
  } catch (error) {
    toast.fromApiError(error, errorMessage);
  }
}
