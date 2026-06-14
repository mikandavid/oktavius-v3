import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createOsirisWhatsAppClient } from './whatsappClient';

const BASE = 'https://api.example.test/v1';

describe('createOsirisWhatsAppClient', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function jsonResponse(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  it('reads and normalizes bot status', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        status: 'connected',
        phoneNumber: '+431234567',
        connectedAt: 't',
        uptime: 90,
      }),
    );
    const client = createOsirisWhatsAppClient({ baseUrl: BASE });

    const status = await client.getStatus();

    expect(fetchMock).toHaveBeenCalledWith(`${BASE}/whatsapp/status`, { credentials: 'include' });
    expect(status).toEqual({
      status: 'connected',
      phoneNumber: '+431234567',
      connectedAt: 't',
      uptime: 90,
    });
  });

  it('falls back to disconnected for an unknown status value', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ status: 'weird', phoneNumber: null }));
    const client = createOsirisWhatsAppClient({ baseUrl: BASE });

    const status = await client.getStatus();

    expect(status.status).toBe('disconnected');
    expect(status.phoneNumber).toBeNull();
    expect(status.uptime).toBeNull();
  });

  it('reads org config (camelCase) with policy fallbacks', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        orgId: 'org_1',
        autoReply: false,
        dmPolicy: 'allowlist',
        groupPolicy: 'bogus',
      }),
    );
    const client = createOsirisWhatsAppClient({ baseUrl: BASE });

    const config = await client.getConfig();

    expect(config).toEqual({
      orgId: 'org_1',
      autoReply: false,
      dmPolicy: 'allowlist',
      groupPolicy: 'disabled',
    });
  });

  it('patches config and lists/normalizes contacts', async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({
          orgId: 'org_1',
          autoReply: true,
          dmPolicy: 'allowlist',
          groupPolicy: 'disabled',
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          contacts: [
            {
              id: 'c1',
              org_id: 'org_1',
              phone_number: '+4311111',
              display_name: null,
              contact_type: 'individual',
              group_jid: null,
              auto_reply: true,
              user_id: null,
              wa_role: 'viewer',
              created_by: null,
              created_at: 'a',
              updated_at: 'b',
            },
          ],
        }),
      );
    const client = createOsirisWhatsAppClient({ baseUrl: BASE });

    await client.updateConfig({ autoReply: true });
    const { contacts } = await client.listContacts();

    expect(fetchMock).toHaveBeenNthCalledWith(1, `${BASE}/whatsapp/config`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ autoReply: true }),
    });
    expect(contacts[0]).toMatchObject({
      id: 'c1',
      phoneNumber: '+4311111',
      autoReply: true,
      waRole: 'viewer',
      contactType: 'individual',
    });
  });

  it('adds, updates, and deletes a contact', async () => {
    fetchMock
      .mockResolvedValueOnce(
        jsonResponse({
          id: 'c2',
          org_id: 'org_1',
          phone_number: '+4322222',
          display_name: 'Max',
          contact_type: 'individual',
          group_jid: null,
          auto_reply: true,
          user_id: 'u1',
          wa_role: 'member',
          created_by: 'u0',
          created_at: 'a',
          updated_at: 'b',
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          id: 'c2',
          org_id: 'org_1',
          phone_number: '+4322222',
          display_name: 'Max',
          contact_type: 'individual',
          group_jid: null,
          auto_reply: false,
          user_id: 'u1',
          wa_role: 'admin',
          created_by: 'u0',
          created_at: 'a',
          updated_at: 'c',
        }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 204 }));
    const client = createOsirisWhatsAppClient({ baseUrl: BASE });

    const created = await client.addContact({
      phoneNumber: '+4322222',
      displayName: 'Max',
      userId: 'u1',
      waRole: 'member',
    });
    const updated = await client.updateContact('c2', { autoReply: false, waRole: 'admin' });
    await client.deleteContact('c2');

    expect(created.waRole).toBe('member');
    expect(updated.autoReply).toBe(false);
    expect(fetchMock).toHaveBeenNthCalledWith(1, `${BASE}/whatsapp/contacts`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phoneNumber: '+4322222',
        displayName: 'Max',
        userId: 'u1',
        waRole: 'member',
      }),
    });
    expect(fetchMock).toHaveBeenNthCalledWith(3, `${BASE}/whatsapp/contacts/c2`, {
      method: 'DELETE',
      credentials: 'include',
    });
  });

  it('throws the server message on a failed request', async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ message: 'Number already registered' }), { status: 400 }),
    );
    const client = createOsirisWhatsAppClient({ baseUrl: BASE });

    await expect(client.addContact({ phoneNumber: '+4300000' })).rejects.toThrow(
      'Number already registered',
    );
  });
});
