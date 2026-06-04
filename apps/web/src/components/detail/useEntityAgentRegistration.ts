import { useMemo } from 'react';

import { useRegisterAgentPageContext } from '@/components/agent/page-context';

type EntityAgentTarget = {
  entityType: string;
  entityId: string;
  displayLabel: string;
};

type EntityAgentModule = {
  moduleId: string;
  moduleLabel: string;
};

/** Registers the current record with the agent sidebar / chat context. */
export function useEntityAgentRegistration(
  entity: EntityAgentTarget | null,
  module: EntityAgentModule,
): void {
  const registration = useMemo(
    () =>
      entity
        ? {
            moduleId: module.moduleId,
            moduleLabel: module.moduleLabel,
            routeLabel: entity.displayLabel,
            primaryEntity: {
              entityType: entity.entityType,
              entityId: entity.entityId,
              displayLabel: entity.displayLabel,
            },
          }
        : null,
    [entity, module.moduleId, module.moduleLabel],
  );

  useRegisterAgentPageContext(registration);
}
