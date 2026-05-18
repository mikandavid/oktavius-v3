import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';

import { Button, Badge } from '@oktavius/base-ui';
import { useDemoData } from '@/app/demo-data';
import { ConfirmActionDialog } from '@/components/common/ConfirmActionDialog';
import { DetailView } from '@/components/common/DetailView';
import { ModulePage } from '@/components/common/PageLayout';
import { StatusBadge } from '@/components/feedback/StatusBadge';
import { DeleteIcon, EditIcon } from '@/lib/icons';

const CLIENT_STATUS_MAP = {
  Active: 'success',
  Prospect: 'info',
  Inactive: 'warning',
  Churned: 'destructive',
} as const;

export function ClientDetailPage() {
  const { clientId } = useParams();
  const { clients } = useDemoData();
  const navigate = useNavigate();
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  const client = clients.find((c) => c.id === clientId);
  if (!client) return <Navigate to="/clients" replace />;

  const revenue = client.annualRevenue
    ? `€ ${Number(client.annualRevenue).toLocaleString('de-AT', { minimumFractionDigits: 2 })}`
    : '—';

  const formatDate = (d: string) =>
    d ? new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  return (
    <ModulePage
      title={client.name}
      subtitle={`${client.type} · ${client.industry}`}
      backTo="/clients"
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate(`/clients/${client.id}/edit`)}>
            <EditIcon size={16} />
            Edit
          </Button>
          <Button variant="outline" onClick={() => setConfirmDeleteOpen(true)}>
            <DeleteIcon size={16} />
            Delete
          </Button>
        </div>
      }
    >
      <DetailView
        title="Client overview"
        fields={[
          {
            key: 'status',
            label: 'Status',
            value: <StatusBadge status={client.status} variantMap={CLIENT_STATUS_MAP} />,
            section: 'Identity',
          },
          {
            key: 'type',
            label: 'Type',
            value: <Badge variant="outline">{client.type}</Badge>,
            section: 'Identity',
          },
          { key: 'industry', label: 'Industry', value: client.industry || '—', section: 'Identity' },
          {
            key: 'tags',
            label: 'Tags',
            value: client.tags.length ? (
              <div className="flex flex-wrap gap-1">
                {client.tags.map((t) => (
                  <Badge key={t} variant="secondary">{t}</Badge>
                ))}
              </div>
            ) : '—',
            section: 'Identity',
            colSpan: 2,
          },

          { key: 'email', label: 'Email', value: client.email || '—', section: 'Contact' },
          { key: 'phone', label: 'Phone', value: client.phone || '—', section: 'Contact' },
          {
            key: 'website',
            label: 'Website',
            value: client.website ? (
              <a href={client.website} target="_blank" rel="noreferrer" className="text-sm underline underline-offset-2">
                {client.website}
              </a>
            ) : '—',
            section: 'Contact',
          },
          {
            key: 'location',
            label: 'Location',
            value: [client.city, client.country].filter(Boolean).join(', ') || '—',
            section: 'Contact',
          },

          { key: 'revenue', label: 'Annual Revenue', value: revenue, section: 'Contract' },
          { key: 'accountManager', label: 'Account Manager', value: client.accountManager || '—', section: 'Contract' },
          { key: 'contractStart', label: 'Contract Start', value: formatDate(client.contractStart), section: 'Contract' },
          { key: 'contractEnd', label: 'Contract End', value: formatDate(client.contractEnd), section: 'Contract' },

          {
            key: 'notes',
            label: 'Notes',
            value: client.notes || '—',
            section: 'Notes',
            colSpan: 2,
          },
        ]}
      />

      <ConfirmActionDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        title={`Delete ${client.name}?`}
        description="This action cannot be undone. The client record will be permanently removed."
        confirmLabel="Delete"
        onConfirm={() => navigate('/clients')}
      />
    </ModulePage>
  );
}
