type TaskParentReference = {
  parentType: string;
  parentId: string;
};

export function buildTaskParentHref(_task: TaskParentReference): string | null {
  return null;
}
