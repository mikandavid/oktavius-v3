import type { Attachment } from '@oktavius/base-ui';

export type EntityStorageFile = Attachment & {
  group: 'generated' | 'email' | 'images' | 'documents' | 'other';
};

const DEMO_STORAGE: Record<string, EntityStorageFile[]> = {
  cli_1001: [
    {
      id: 'stor_1',
      name: 'Master-agreement-2024.pdf',
      size: 248_000,
      mimeType: 'application/pdf',
      uploadedAt: '12.01.2024',
      uploadedBy: 'Anna Hofer',
      group: 'documents',
    },
    {
      id: 'stor_2',
      name: 'Onboarding-checklist.xlsx',
      size: 52_400,
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      uploadedAt: '15.01.2024',
      uploadedBy: 'Anna Hofer',
      group: 'documents',
    },
    {
      id: 'stor_3',
      name: 'Office-photo.jpg',
      size: 1_024_000,
      mimeType: 'image/jpeg',
      uploadedAt: '20.02.2024',
      uploadedBy: 'System',
      group: 'images',
    },
  ],
  cli_1002: [
    {
      id: 'stor_4',
      name: 'Proposal-v2.pdf',
      size: 180_000,
      mimeType: 'application/pdf',
      uploadedAt: '01.03.2024',
      uploadedBy: 'Markus Leitner',
      group: 'generated',
    },
  ],
};

export function getDemoEntityStorage(entityType: string, entityId: string): EntityStorageFile[] {
  if (entityType !== 'client') return [];
  return DEMO_STORAGE[entityId] ?? [];
}

export const STORAGE_GROUP_LABELS: Record<EntityStorageFile['group'], string> = {
  generated: 'Generated documents',
  email: 'Emails',
  images: 'Images & scans',
  documents: 'Documents',
  other: 'Other files',
};
