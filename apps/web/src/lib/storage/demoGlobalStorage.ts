export type GlobalStorageNode = {
  id: string;
  name: string;
  fileSizeBytes: number;
  mimeType?: string;
  uploadStatus: 'ready' | 'processing' | 'failed';
  updatedAt: string;
};

export const DEMO_GLOBAL_STORAGE: GlobalStorageNode[] = [
  {
    id: 'node_1',
    name: 'Contract-template-v3.docx',
    fileSizeBytes: 84_000,
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    uploadStatus: 'ready',
    updatedAt: '2024-11-02',
  },
  {
    id: 'node_2',
    name: 'Brand-guidelines.pdf',
    fileSizeBytes: 2_400_000,
    mimeType: 'application/pdf',
    uploadStatus: 'ready',
    updatedAt: '2024-10-18',
  },
  {
    id: 'node_3',
    name: 'Office-floorplan.png',
    fileSizeBytes: 512_000,
    mimeType: 'image/png',
    uploadStatus: 'ready',
    updatedAt: '2024-09-05',
  },
  {
    id: 'node_4',
    name: 'Onboarding-video.mp4',
    fileSizeBytes: 18_000_000,
    mimeType: 'video/mp4',
    uploadStatus: 'processing',
    updatedAt: '2024-11-10',
  },
  {
    id: 'node_5',
    name: 'Q4-pricing.xlsx',
    fileSizeBytes: 120_000,
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    uploadStatus: 'ready',
    updatedAt: '2024-11-01',
  },
];

export function searchDemoGlobalStorage(query: string): GlobalStorageNode[] {
  const normalized = query.trim().toLowerCase();
  if (normalized.length < 2) return DEMO_GLOBAL_STORAGE;
  return DEMO_GLOBAL_STORAGE.filter((node) => node.name.toLowerCase().includes(normalized));
}
