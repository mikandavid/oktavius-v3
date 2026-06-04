export type DocumentGenerationPayload = {
  templateId: string;
  format: string;
};

export type DocumentSendPayload = {
  templateId: string;
  recipient: string;
  subject: string;
  message: string;
};

type DocumentActionToast = {
  success: (message: string) => unknown;
  fromApiError: (error: unknown, fallback?: string) => unknown;
};

export async function completeDocumentGeneration({
  payload,
  generateDocument,
  toast,
}: {
  payload: DocumentGenerationPayload;
  generateDocument: (payload: DocumentGenerationPayload) => Promise<void>;
  toast: DocumentActionToast;
}) {
  try {
    await generateDocument(payload);
    toast.success(`Generated ${payload.format.toUpperCase()} from ${payload.templateId}.`);
    return true;
  } catch (error) {
    toast.fromApiError(error, 'Document could not be generated.');
    return false;
  }
}

export async function completeDocumentSend({
  payload,
  sendDocument,
  toast,
}: {
  payload: DocumentSendPayload;
  sendDocument: (payload: DocumentSendPayload) => Promise<void>;
  toast: DocumentActionToast;
}) {
  try {
    await sendDocument(payload);
    toast.success(`Sent to ${payload.recipient}.`);
    return true;
  } catch (error) {
    toast.fromApiError(error, 'Document could not be sent.');
    return false;
  }
}
