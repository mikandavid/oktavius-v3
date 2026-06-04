import type { AgentMessage } from './types';
import {
  DEMO_DOCUMENT_CARD,
  DEMO_ENTITY_DETAIL_CARD,
  DEMO_ENTITY_LIST_CARD,
  DEMO_FINANCIAL_CARD,
  DEMO_PYTHON_CARD,
  DEMO_SCHEDULE_CARD,
  DEMO_SEARCH_RESULTS_CARD,
  DEMO_SKILL_APPROVAL_CARD,
} from './agentDemoCardPayloads';

/** Demo assistant follow-up after a user message — tool + confirmation cards. */
export function buildDemoAgentFollowUp(userContent: string, now: string): AgentMessage[] {
  const lower = userContent.toLowerCase();
  const wantsClient = lower.includes('client') || lower.includes('contact');
  const wantsDelete = lower.includes('delete') || lower.includes('remove');
  const wantsSchedule = lower.includes('schedule') || lower.includes('calendar');
  const wantsDocument = lower.includes('document') || lower.includes('proposal');
  const wantsPython = lower.includes('python') || lower.includes('analyze');
  const wantsSkill = lower.includes('enrich') || lower.includes('skill');
  const wantsFinancial =
    lower.includes('financial') || lower.includes('revenue') || lower.includes('receivable');
  const wantsSearch = lower.includes('search') || lower.includes('find ');
  const wantsChart = lower.includes('chart') || lower.includes('graph');

  const messages: AgentMessage[] = [
    {
      id: `assistant_${Date.now()}`,
      role: 'assistant',
      createdAt: now,
      content: wantsChart
        ? `Here is the trend for the last quarter:

<oct-bar-chart title="Receivables by month">
{"data":[{"name":"Sep","value":92000},{"name":"Oct","value":104000},{"name":"Nov","value":128400}],"yFormat":"currency","currency":"EUR"}
</oct-bar-chart>`
        : wantsClient
          ? 'I found matching client records and prepared the cards below.'
          : wantsFinancial
            ? 'Here is the receivables snapshot for this workspace.'
            : wantsSearch
              ? 'I ran a global search and grouped the results below.'
              : 'I reviewed the workspace context and prepared the next steps below.',
    },
  ];

  if (wantsClient) {
    messages.push(
      {
        id: `card_list_${Date.now()}`,
        role: 'card',
        createdAt: now,
        card: DEMO_ENTITY_LIST_CARD,
      },
      {
        id: `card_detail_${Date.now()}`,
        role: 'card',
        createdAt: now,
        card: DEMO_ENTITY_DETAIL_CARD,
      },
    );
  } else if (wantsFinancial) {
    messages[0].ui = { component: 'FinancialOverview', props: DEMO_FINANCIAL_CARD };
  } else if (wantsSearch) {
    messages.push({
      id: `ui_search_${Date.now()}`,
      role: 'tool',
      createdAt: now,
      toolName: 'global_search',
      toolResult: '3 groups · 5 matches',
      ui: { component: 'GlobalSearch', props: DEMO_SEARCH_RESULTS_CARD },
    });
  } else {
    messages.push({
      id: `tool_${Date.now()}`,
      role: 'tool',
      createdAt: now,
      toolName: 'list_open_tasks',
      toolInput: { assignee: 'current_user', status: 'open' },
      toolResult: JSON.stringify({ count: 3, modules: ['Cases', 'Tasks', 'Approvals'] }, null, 2),
    });
  }

  if (wantsSchedule) {
    messages.push({
      id: `card_schedule_${Date.now()}`,
      role: 'card',
      createdAt: now,
      card: DEMO_SCHEDULE_CARD,
    });
  }

  if (wantsDocument) {
    messages.push({
      id: `card_doc_${Date.now()}`,
      role: 'card',
      createdAt: now,
      card: DEMO_DOCUMENT_CARD,
    });
  }

  if (wantsPython) {
    messages.push({
      id: `card_python_${Date.now()}`,
      role: 'card',
      createdAt: now,
      card: DEMO_PYTHON_CARD,
    });
  }

  if (wantsSkill) {
    messages.push({
      id: `card_skill_${Date.now()}`,
      role: 'card',
      createdAt: now,
      card: DEMO_SKILL_APPROVAL_CARD,
    });
  }

  if (wantsDelete) {
    messages.push({
      id: `confirm_${Date.now()}`,
      role: 'confirmation',
      createdAt: now,
      confirmation: {
        id: `confirm_${Date.now()}`,
        action: 'Delete record',
        description: 'This will permanently remove the selected record and related links.',
        details: {
          Module: 'Clients',
          Record: 'Apex Technologies',
        },
        status: 'pending',
      },
    });
  }

  return messages;
}
