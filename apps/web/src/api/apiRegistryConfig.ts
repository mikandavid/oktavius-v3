import type { ApiRegistry } from './contracts';
import {
  createHttpRegistry,
  type HttpRegistryEndpoints,
  type HttpRegistryFetcher,
} from './httpRegistry';
import { createOsirisApiFetcher } from '@/runtime/osiris/apiClient';
import type { OsirisApiClientOptions } from '@/runtime/osiris/apiClient';

export const DEFAULT_HTTP_REGISTRY_ENDPOINTS: HttpRegistryEndpoints = {
  cases: '/cases',
  caseChecklists: '/case-checklists',
  clients: '/clients',
  contracts: '/contracts',
  incidents: '/incidents',
  invoices: '/invoices',
  orders: '/orders',
  organizations: '/organizations',
  parties: '/parties',
  products: '/products',
  projects: '/projects',
  users: '/users',
  contacts: '/contacts',
  vendors: '/vendors',
  leads: '/leads',
  staff: '/staff',
  purchasing: '/purchasing',
};

export type ApiRegistryEnvironment = {
  VITE_OKTAVIUS_API_BASE_URL?: string;
  VITE_OKTAVIUS_API_TOKEN?: string;
};

export type OsirisApiRegistryContextGetters = Omit<OsirisApiClientOptions, 'baseUrl'>;

export function createOsirisApiRegistry({
  env,
  osiris,
}: {
  env: ApiRegistryEnvironment;
  osiris: OsirisApiRegistryContextGetters;
}): ApiRegistry {
  const baseUrl = env.VITE_OKTAVIUS_API_BASE_URL?.trim() || undefined;

  return createHttpRegistry({
    baseUrl: '',
    endpoints: DEFAULT_HTTP_REGISTRY_ENDPOINTS,
    fetcher: createOsirisApiFetcher({ baseUrl, ...osiris }),
  });
}

export function createConfiguredApiRegistry({
  env,
  fetcher,
  osiris,
}: {
  env: ApiRegistryEnvironment;
  fetcher?: HttpRegistryFetcher;
  osiris?: OsirisApiRegistryContextGetters;
}): ApiRegistry {
  if (osiris) {
    return createOsirisApiRegistry({ env, osiris });
  }

  const baseUrl = env.VITE_OKTAVIUS_API_BASE_URL?.trim();
  if (!baseUrl) {
    throw new Error('VITE_OKTAVIUS_API_BASE_URL is required for API registry.');
  }

  const token = env.VITE_OKTAVIUS_API_TOKEN?.trim();

  return createHttpRegistry({
    baseUrl,
    endpoints: DEFAULT_HTTP_REGISTRY_ENDPOINTS,
    fetcher,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
}
