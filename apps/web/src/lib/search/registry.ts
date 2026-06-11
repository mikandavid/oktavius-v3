import type { SearchProvider } from './types';

export class SearchRegistry {
  private readonly providers = new Map<string, SearchProvider>();

  register(provider: SearchProvider) {
    if (this.providers.has(provider.id)) {
      throw new Error(`Search provider "${provider.id}" is already registered.`);
    }
    this.providers.set(provider.id, provider);
    return provider;
  }

  list() {
    return Array.from(this.providers.values());
  }
}

export const searchRegistry = new SearchRegistry();
