import { useState } from 'react';

import { AutomationDetail } from '../components/automations/AutomationDetail';
import { AutomationForm } from '../components/automations/AutomationForm';
import { AutomationsList } from '../components/automations/AutomationsList';

type View =
  | { kind: 'list' }
  | { kind: 'detail'; taskId: string }
  | { kind: 'form'; taskId: string | null };

export function AgentAutomationsSection() {
  const [view, setView] = useState<View>({ kind: 'list' });

  if (view.kind === 'detail') {
    return (
      <AutomationDetail
        taskId={view.taskId}
        onBack={() => setView({ kind: 'list' })}
        onEdit={(taskId) => setView({ kind: 'form', taskId })}
      />
    );
  }
  if (view.kind === 'form') {
    return (
      <AutomationForm
        taskId={view.taskId}
        onDone={() => setView({ kind: 'list' })}
        onCancel={() => setView({ kind: 'list' })}
      />
    );
  }
  return (
    <AutomationsList
      onOpen={(taskId) => setView({ kind: 'detail', taskId })}
      onCreate={() => setView({ kind: 'form', taskId: null })}
    />
  );
}
