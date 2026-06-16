import { parseAsString, useQueryStates } from 'nuqs';

import { usePreloadNamespaces } from '@/core/i18n';

import { ContactDetailView } from './ContactDetailView';
import { ContactFormView } from './ContactFormView';
import { ContactsListView } from './ContactsListView';

export function ContactsPage() {
  const { ready } = usePreloadNamespaces(['contacts']);
  const [params] = useQueryStates({
    id: parseAsString,
    mode: parseAsString,
  });

  if (!ready) return null;

  if (params.mode === 'new') return <ContactFormView mode="create" />;
  if (params.id && params.mode === 'edit')
    return <ContactFormView mode="edit" contactId={params.id} />;
  if (params.id) return <ContactDetailView contactId={params.id} />;
  return <ContactsListView />;
}
