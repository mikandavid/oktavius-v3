import type { FieldDefinition } from './types';

export class FieldRegistry {
  private readonly definitions = new Map<string, FieldDefinition>();

  register(definition: FieldDefinition) {
    if (this.definitions.has(definition.id)) {
      throw new Error(`Field type "${definition.id}" is already registered.`);
    }
    this.definitions.set(definition.id, definition);
    return definition;
  }

  get(id: string) {
    return this.definitions.get(id);
  }

  list() {
    return Array.from(this.definitions.values());
  }
}

export const fieldRegistry = new FieldRegistry();
