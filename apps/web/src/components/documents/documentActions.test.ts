import { describe, expect, it, vi } from 'vitest';

import { completeDocumentGeneration, completeDocumentSend } from './documentActions';

describe('document action helpers', () => {
  it('waits for document generation before reporting success', async () => {
    const calls: string[] = [];

    const result = await completeDocumentGeneration({
      payload: { templateId: 'tpl_invoice', format: 'pdf' },
      generateDocument: async (payload) => {
        calls.push(`generate:start:${payload.templateId}:${payload.format}`);
        await Promise.resolve();
        calls.push('generate:end');
      },
      toast: {
        success: (message) => calls.push(`success:${message}`),
        fromApiError: vi.fn(),
      },
    });

    expect(result).toBe(true);
    expect(calls).toEqual([
      'generate:start:tpl_invoice:pdf',
      'generate:end',
      'success:Generated PDF from tpl_invoice.',
    ]);
  });

  it('reports generation failures without claiming success', async () => {
    const error = new Error('Generate failed.');
    const toast = { success: vi.fn(), fromApiError: vi.fn() };

    const result = await completeDocumentGeneration({
      payload: { templateId: 'tpl_invoice', format: 'pdf' },
      generateDocument: async () => {
        throw error;
      },
      toast,
    });

    expect(result).toBe(false);
    expect(toast.fromApiError).toHaveBeenCalledWith(error, 'Document could not be generated.');
    expect(toast.success).not.toHaveBeenCalled();
  });

  it('waits for document sending before reporting success', async () => {
    const calls: string[] = [];
    const payload = {
      templateId: 'em_invoice',
      recipient: 'billing@example.test',
      subject: 'Invoice',
      message: 'Please find attached.',
    };

    const result = await completeDocumentSend({
      payload,
      sendDocument: async (nextPayload) => {
        calls.push(`send:start:${nextPayload.recipient}`);
        await Promise.resolve();
        calls.push('send:end');
      },
      toast: {
        success: (message) => calls.push(`success:${message}`),
        fromApiError: vi.fn(),
      },
    });

    expect(result).toBe(true);
    expect(calls).toEqual([
      'send:start:billing@example.test',
      'send:end',
      'success:Sent to billing@example.test.',
    ]);
  });

  it('reports send failures without claiming success', async () => {
    const error = new Error('Send failed.');
    const toast = { success: vi.fn(), fromApiError: vi.fn() };

    const result = await completeDocumentSend({
      payload: {
        templateId: 'em_invoice',
        recipient: 'billing@example.test',
        subject: 'Invoice',
        message: '',
      },
      sendDocument: async () => {
        throw error;
      },
      toast,
    });

    expect(result).toBe(false);
    expect(toast.fromApiError).toHaveBeenCalledWith(error, 'Document could not be sent.');
    expect(toast.success).not.toHaveBeenCalled();
  });
});
