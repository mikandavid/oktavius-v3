import { builtinFieldDefinitions } from './builtin';
import { fieldRegistry } from './registry';

for (const definition of builtinFieldDefinitions) {
  if (!fieldRegistry.get(definition.id)) {
    fieldRegistry.register(definition);
  }
}

export { FieldRegistry, fieldRegistry } from './registry';
export type {
  FieldDefinition,
  FieldRenderContext,
  FieldRenderer,
  FieldRendererProps,
} from './types';
