import { useCallback, useEffect, useRef, useState } from 'react';

import type { AppNavModule } from '@/lib/appNavModules';
import { useUserPreferences } from '@/lib/userPreferences';

import { orderItems, readStoredModuleOrder, writeStoredModuleOrder } from './sidebarNav';

/**
 * Owns module-list ordering and the drag-to-reorder interaction: the persisted
 * preferred order, edit mode, and the in-flight drag. Extracted verbatim from
 * SidebarContent — behavior unchanged.
 */
export function useModuleOrder(profileId: string, visibleModuleItems: AppNavModule[]) {
  const { moduleOrderPreference, setModuleOrderPreference } = useUserPreferences();

  const [preferredModuleOrder, setPreferredModuleOrder] = useState<string[]>(() =>
    moduleOrderPreference.length > 0 ? moduleOrderPreference : readStoredModuleOrder(),
  );
  const preferredModuleOrderRef = useRef(preferredModuleOrder);

  useEffect(() => {
    preferredModuleOrderRef.current = preferredModuleOrder;
  }, [preferredModuleOrder]);

  useEffect(() => {
    if (moduleOrderPreference.length > 0) {
      preferredModuleOrderRef.current = moduleOrderPreference;
      setPreferredModuleOrder(moduleOrderPreference);
    }
  }, [moduleOrderPreference]);

  useEffect(() => {
    const allowedIds = visibleModuleItems.map((item) => item.id);
    const allowed = new Set<string>(allowedIds);
    setPreferredModuleOrder((current) => {
      const filtered = current.filter((id) => allowed.has(id));
      const nextOrder = filtered.length > 0 ? filtered : allowedIds;
      preferredModuleOrderRef.current = nextOrder;
      return nextOrder;
    });
  }, [profileId, visibleModuleItems]);

  const [isEditingModules, setIsEditingModules] = useState(false);
  const [draggingItemId, setDraggingItemId] = useState<string | null>(null);
  const draggingItemIdRef = useRef<string | null>(null);

  useEffect(() => {
    writeStoredModuleOrder(preferredModuleOrder);
  }, [preferredModuleOrder]);

  const orderedModuleItems = orderItems(visibleModuleItems, preferredModuleOrder);

  const startModuleDrag = useCallback((itemId: string) => {
    draggingItemIdRef.current = itemId;
    setDraggingItemId(itemId);
  }, []);

  const moveModuleItem = useCallback(
    (targetItemId: string) => {
      if (!draggingItemId || draggingItemId === targetItemId) return;
      const currentIds = orderedModuleItems.map((item) => item.id as string);
      const fromIndex = currentIds.indexOf(draggingItemId);
      const toIndex = currentIds.indexOf(targetItemId);
      if (fromIndex === -1 || toIndex === -1) return;

      const nextIds = [...currentIds];
      const [movedId] = nextIds.splice(fromIndex, 1);
      if (movedId === undefined) return;
      nextIds.splice(toIndex, 0, movedId);
      preferredModuleOrderRef.current = nextIds;
      setPreferredModuleOrder(nextIds);
    },
    [draggingItemId, orderedModuleItems],
  );

  const finishModuleDrag = useCallback(() => {
    const draggedItemId = draggingItemIdRef.current;
    draggingItemIdRef.current = null;
    setDraggingItemId(null);
    if (draggedItemId) {
      setModuleOrderPreference(preferredModuleOrderRef.current);
    }
  }, [setModuleOrderPreference]);

  const toggleModuleEditing = useCallback(() => {
    if (isEditingModules) {
      setModuleOrderPreference(preferredModuleOrderRef.current);
    }
    setIsEditingModules((current) => !current);
  }, [isEditingModules, setModuleOrderPreference]);

  return {
    orderedModuleItems,
    isEditingModules,
    draggingItemId,
    startModuleDrag,
    moveModuleItem,
    finishModuleDrag,
    toggleModuleEditing,
  };
}
