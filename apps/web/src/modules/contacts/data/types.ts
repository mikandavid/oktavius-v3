export type Contact = {
  id: string;
  orgId: string | null;
  name: string;
  isBusiness: boolean;
  email: string;
  phone: string;
  mobile: string;
  fax: string;
  linkedin: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  clientCode: string;
  categoryIds: string[];
  tags: string[];
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type ContactCategory = { id: string; name: string };

export type ListContactsParams = {
  page?: number;
  pageSize?: number;
  sort?: string;
  search?: string;
};

export type ListContactsResult = {
  data: Contact[];
  total: number;
  totalPages: number;
};

/** Write payload for create + update (no id/org/timestamps). */
export type ContactInput = {
  name: string;
  isBusiness: boolean;
  email: string;
  phone: string;
  mobile: string;
  fax: string;
  linkedin: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  clientCode: string;
  categoryIds: string[];
  tags: string[];
  notes: string;
};
