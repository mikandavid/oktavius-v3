import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

export type UserRecord = {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Manager' | 'Member';
  status: 'Active' | 'Pending' | 'Suspended';
  team: string;
};

export type ClientRecord = {
  id: string;
  name: string;
  type: 'Company' | 'Individual';
  industry: string;
  status: 'Active' | 'Inactive' | 'Prospect' | 'Churned';
  email: string;
  phone: string;
  website: string;
  country: string;
  city: string;
  tags: string[];
  notes: string;
  annualRevenue: string;
  contractStart: string;
  contractEnd: string;
  accountManager: string;
  createdAt: string;
};

type CreateUserInput = Omit<UserRecord, 'id'>;
type CreateClientInput = Omit<ClientRecord, 'id' | 'createdAt'>;

type DemoDataContextValue = {
  users: UserRecord[];
  createUser: (input: CreateUserInput) => UserRecord;
  clients: ClientRecord[];
  createClient: (input: CreateClientInput) => ClientRecord;
};

const DemoDataContext = createContext<DemoDataContextValue | null>(null);

const INITIAL_CLIENTS: ClientRecord[] = [
  {
    id: 'cli_1001',
    name: 'Apex Technologies GmbH',
    type: 'Company',
    industry: 'Technology',
    status: 'Active',
    email: 'contact@apex-tech.test',
    phone: '+43 1 234 5678',
    website: 'https://apex-tech.test',
    country: 'Austria',
    city: 'Vienna',
    tags: ['enterprise', 'priority'],
    notes: 'Key strategic account. Renewal due Q1.',
    annualRevenue: '480000',
    contractStart: '2024-01-15',
    contractEnd: '2025-01-14',
    accountManager: 'Anna Hofer',
    createdAt: '2024-01-10',
  },
  {
    id: 'cli_1002',
    name: 'Bruckner Consulting',
    type: 'Company',
    industry: 'Consulting',
    status: 'Active',
    email: 'office@bruckner.test',
    phone: '+43 732 987 654',
    website: 'https://bruckner.test',
    country: 'Austria',
    city: 'Linz',
    tags: ['consulting', 'mid-market'],
    notes: '',
    annualRevenue: '120000',
    contractStart: '2024-03-01',
    contractEnd: '2025-02-28',
    accountManager: 'Markus Leitner',
    createdAt: '2024-02-20',
  },
  {
    id: 'cli_1003',
    name: 'Clara Sonnenschein',
    type: 'Individual',
    industry: 'Freelance',
    status: 'Prospect',
    email: 'clara@sonnenschein.test',
    phone: '+43 699 111 2233',
    website: '',
    country: 'Germany',
    city: 'Munich',
    tags: ['freelance'],
    notes: 'Interested in the starter plan. Follow up next week.',
    annualRevenue: '18000',
    contractStart: '',
    contractEnd: '',
    accountManager: 'Nina Weiss',
    createdAt: '2024-05-03',
  },
  {
    id: 'cli_1004',
    name: 'Donau Logistics AG',
    type: 'Company',
    industry: 'Logistics',
    status: 'Inactive',
    email: 'info@donau-logistics.test',
    phone: '+43 1 555 7890',
    website: 'https://donau-logistics.test',
    country: 'Austria',
    city: 'Vienna',
    tags: ['logistics', 'enterprise'],
    notes: 'Contract expired. Re-engagement campaign scheduled.',
    annualRevenue: '220000',
    contractStart: '2023-06-01',
    contractEnd: '2024-05-31',
    accountManager: 'Anna Hofer',
    createdAt: '2023-05-15',
  },
  {
    id: 'cli_1005',
    name: 'Eiger Software Ltd',
    type: 'Company',
    industry: 'Technology',
    status: 'Churned',
    email: 'hello@eiger.test',
    phone: '+41 44 300 1122',
    website: 'https://eiger.test',
    country: 'Switzerland',
    city: 'Zurich',
    tags: ['saas', 'churned'],
    notes: 'Moved to competitor. Post-mortem completed.',
    annualRevenue: '95000',
    contractStart: '2023-01-01',
    contractEnd: '2023-12-31',
    accountManager: 'Markus Leitner',
    createdAt: '2022-12-01',
  },
];

const INITIAL_USERS: UserRecord[] = [
  {
    id: 'usr_1001',
    name: 'Anna Hofer',
    email: 'anna.hofer@osiris.test',
    role: 'Admin',
    status: 'Active',
    team: 'Operations',
  },
  {
    id: 'usr_1002',
    name: 'Markus Leitner',
    email: 'markus.leitner@osiris.test',
    role: 'Manager',
    status: 'Pending',
    team: 'Projects',
  },
  {
    id: 'usr_1003',
    name: 'Nina Weiss',
    email: 'nina.weiss@osiris.test',
    role: 'Member',
    status: 'Suspended',
    team: 'Support',
  },
];

export function DemoDataProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<UserRecord[]>(INITIAL_USERS);
  const [clients, setClients] = useState<ClientRecord[]>(INITIAL_CLIENTS);

  const value = useMemo<DemoDataContextValue>(
    () => ({
      users,
      createUser: (input) => {
        const next: UserRecord = {
          id: `usr_${Date.now()}`,
          ...input,
        };
        setUsers((current) => [next, ...current]);
        return next;
      },
      clients,
      createClient: (input) => {
        const next: ClientRecord = {
          id: `cli_${Date.now()}`,
          createdAt: new Date().toISOString().slice(0, 10),
          ...input,
        };
        setClients((current) => [next, ...current]);
        return next;
      },
    }),
    [users, clients],
  );

  return <DemoDataContext.Provider value={value}>{children}</DemoDataContext.Provider>;
}

export function useDemoData() {
  const context = useContext(DemoDataContext);
  if (!context) {
    throw new Error('useDemoData must be used inside DemoDataProvider');
  }
  return context;
}

