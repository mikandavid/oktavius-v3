export type DemoFuneralCase = {
  id: string;
  caseNumber: string;
  deceasedFirstName: string | null;
  deceasedLastName: string | null;
};

export type FuneralCasePickerValue = {
  id: string;
  caseNumber: string;
  deceasedName: string;
};

const DEMO_FUNERAL_CASES: DemoFuneralCase[] = [
  {
    id: 'fc_1001',
    caseNumber: 'FC-2024-0142',
    deceasedFirstName: 'Helmut',
    deceasedLastName: 'Gruber',
  },
  {
    id: 'fc_1002',
    caseNumber: 'FC-2024-0143',
    deceasedFirstName: 'Maria',
    deceasedLastName: 'Steiner',
  },
  {
    id: 'fc_1003',
    caseNumber: 'FC-2024-0144',
    deceasedFirstName: 'Karl',
    deceasedLastName: 'Wagner',
  },
  {
    id: 'fc_1004',
    caseNumber: 'FC-2024-0145',
    deceasedFirstName: 'Elisabeth',
    deceasedLastName: 'Huber',
  },
  {
    id: 'fc_1005',
    caseNumber: 'FC-2024-0146',
    deceasedFirstName: 'Franz',
    deceasedLastName: 'Moser',
  },
];

export function formatDeceasedName(item: DemoFuneralCase): string {
  return [item.deceasedFirstName, item.deceasedLastName].filter(Boolean).join(' ') || '—';
}

export function searchDemoFuneralCases(
  query: string,
  locationId?: string | null,
): DemoFuneralCase[] {
  void locationId;
  const normalized = query.trim().toLowerCase();
  const base = DEMO_FUNERAL_CASES;
  if (!normalized) return base.slice(0, 10);
  return base.filter((item) => {
    const deceased = formatDeceasedName(item).toLowerCase();
    return deceased.includes(normalized) || item.caseNumber.toLowerCase().includes(normalized);
  });
}

export function toFuneralCasePickerValue(item: DemoFuneralCase): FuneralCasePickerValue {
  return {
    id: item.id,
    caseNumber: item.caseNumber,
    deceasedName: formatDeceasedName(item),
  };
}
