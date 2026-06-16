import { useMemo } from 'react';

import { PageHeaderCtaLink } from '@/components/common/PageHeaderButtons';
import { ModulePage } from '@/components/common/PageLayout';
import { CrudListShell } from '@/components/data/CrudListShell';
import { useTranslation } from '@/core/i18n';
import { PlusIcon, UsersIcon } from '@/lib/icons';
import { modulePageIcon } from '@/lib/modulePageIcons';
import { useListPageState } from '@/lib/useListPageState';

import { useContactCategories, useContactMutations, useContacts } from './data/useContactsData';
import { contactColumns, contactFilters, type ContactRow, toContactRow } from './shared';

export function ContactsListView() {
  const { t } = useTranslation();
  const contactsQuery = useContacts();
  const categoriesQuery = useContactCategories();
  const { deleteContacts } = useContactMutations();

  const categoryNameById = useMemo(
    () => new Map((categoriesQuery.data ?? []).map((category) => [category.id, category.name])),
    [categoriesQuery.data],
  );

  const rows = useMemo(
    () =>
      (contactsQuery.data?.data ?? []).map((contact) => toContactRow(contact, t, categoryNameById)),
    [contactsQuery.data, t, categoryNameById],
  );

  const list = useListPageState<ContactRow>({
    rows,
    defaultSort: 'name',
    pageSize: 20,
    filterKeys: ['type', 'category'],
    queryNamespace: 'contacts-list',
    filterFn: (row, { search, filters }) => {
      const query = search.trim().toLowerCase();
      const matchesSearch =
        query.length === 0 ||
        ['name', 'email', 'phone', 'mobile', 'city'].some((key) =>
          String((row as Record<string, unknown>)[key] ?? '')
            .toLowerCase()
            .includes(query),
        );
      const matchesType = !filters['type'] || row.typeValue === filters['type'];
      const matchesCategory =
        !filters['category'] || row.categoryIds.includes(filters['category'] ?? '');
      return matchesSearch && matchesType && matchesCategory;
    },
  });

  return (
    <ModulePage
      title={t('contacts.title', undefined, 'Contacts')}
      subtitle={t('contacts.subtitle', undefined, 'People and organizations')}
      icon={modulePageIcon(UsersIcon)}
      actions={
        <PageHeaderCtaLink to="/contacts?mode=new">
          <PlusIcon size={16} />
          {t('contacts.newContact', undefined, 'New contact')}
        </PageHeaderCtaLink>
      }
    >
      <CrudListShell<ContactRow>
        search={list.search}
        onSearchChange={list.onSearchChange}
        searchPlaceholder={t('contacts.searchPlaceholder', undefined, 'Search name, email, phone…')}
        filters={contactFilters(t, categoriesQuery.data ?? [])}
        values={list.values}
        onFilterChange={list.onFilterChange}
        onReset={list.onReset}
        rows={list.paged}
        columns={contactColumns(t)}
        sort={list.sort}
        onSortChange={list.onSortChange}
        page={list.page}
        pageSize={list.pageSize}
        total={list.total}
        totalPages={list.totalPages}
        onPageChange={list.onPageChange}
        isLoading={contactsQuery.isLoading}
        emptyTitle={t('contacts.emptyTitle', undefined, 'No contacts yet')}
        emptyDescription={t(
          'contacts.emptyDescription',
          undefined,
          'Create your first contact to get started.',
        )}
        entityLabel="contact"
        getRowHref={(row) => `/contacts?id=${row.id}`}
        onDeleteRows={async (ids) => {
          await deleteContacts.mutateAsync(ids);
        }}
      />
    </ModulePage>
  );
}
