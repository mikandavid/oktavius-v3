import { useVocabularyLabel } from '@/lib/reference-data';

type PartyContactLineProps = {
  role: string;
  email: string;
};

export function PartyContactLine({ role, email }: PartyContactLineProps) {
  const roleLabel = useVocabularyLabel('partyRole', role);
  return (
    <>
      {roleLabel || role} · {email}
    </>
  );
}
