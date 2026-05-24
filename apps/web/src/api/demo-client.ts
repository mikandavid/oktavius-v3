import type { ClientRecord } from '@/app/demo-data';

export type ListResponse<T> = {
  data: T[];
  total: number;
  totalPages: number;
  page: number;
  pageSize: number;
};

export type ClientsListParams = {
  page?: string;
  pageSize?: string;
  sort?: string;
  search?: string;
  status?: string;
  type?: string;
};

export type ClientsHandlers = {
  list: (params: ClientsListParams) => Promise<ListResponse<ClientRecord>>;
  get: (id: string) => Promise<ClientRecord | null>;
  delete: (id: string) => Promise<void>;
};

export type DemoApiRegistry = {
  clients: ClientsHandlers;
};
