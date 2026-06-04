type DeleteOrganizationsOptions = {
  deleteOrganization: (id: string) => Promise<void>;
};

export async function deleteOrganizationsFromList(
  ids: string[],
  { deleteOrganization }: DeleteOrganizationsOptions,
) {
  if (ids.length === 0) return;
  await Promise.all(ids.map((id) => deleteOrganization(id)));
}
