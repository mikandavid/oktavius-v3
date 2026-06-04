import type { ComponentType, ReactElement } from 'react';

import { AgentActionItemsCard } from './cards/AgentActionItemsCard';
import { AgentActiveTimerCard } from './cards/AgentActiveTimerCard';
import { AgentCatalogItemCard } from './cards/AgentCatalogItemCard';
import { AgentContextDumpCard } from './cards/AgentContextDumpCard';
import { AgentDocProcessingCard } from './cards/AgentDocProcessingCard';
import { AgentEmailComposeCard } from './cards/AgentEmailComposeCard';
import { AgentFinancialCard } from './cards/AgentFinancialCard';
import { AgentGeneratedDocumentCard } from './cards/AgentGeneratedDocumentCard';
import { AgentMemoryCard } from './cards/AgentMemoryCard';
import { AgentPlannerCard } from './cards/AgentPlannerCard';
import { AgentProjectSummaryCard } from './cards/AgentProjectSummaryCard';
import { AgentSalesDocumentCard } from './cards/AgentSalesDocumentCard';
import { AgentScheduleCard } from './cards/AgentScheduleCard';
import { AgentSearchResultsCard } from './cards/AgentSearchResultsCard';
import { AgentSkillApprovalCard } from './cards/AgentSkillApprovalCard';
import { AgentTimelineCard } from './cards/AgentTimelineCard';
import RegistryEntityDetailCard, { RegistryEntityListCard } from './cards/registryEntityAdapters';

type RegistryComponent = (props: Record<string, unknown>) => ReactElement | null;

function registryComponent<P extends object>(Component: ComponentType<P>): RegistryComponent {
  return (props) => <Component {...(props as P)} />;
}

const COMPONENTS: Record<string, RegistryComponent> = {
  DocProcessingResultCard: registryComponent(AgentDocProcessingCard),
  DocProcessingProgress: registryComponent(AgentDocProcessingCard),
  DocProcessingCaseList: registryComponent(AgentDocProcessingCard),
  DocProcessingCaseDetail: registryComponent(AgentDocProcessingCard),

  ClientCard: registryComponent(RegistryEntityDetailCard),
  ClientDetail: registryComponent(RegistryEntityDetailCard),
  ClientList: registryComponent(RegistryEntityListCard),
  CustomFieldDefinitionList: registryComponent(RegistryEntityListCard),
  CustomFieldDefinitionCard: registryComponent(RegistryEntityDetailCard),

  SalesDocumentDetail: registryComponent(AgentSalesDocumentCard),
  SalesDocumentList: registryComponent(RegistryEntityListCard),
  ReceivablesSummary: registryComponent(AgentSalesDocumentCard),
  FinancialOverview: registryComponent(AgentFinancialCard),

  ProjectDetail: registryComponent(RegistryEntityDetailCard),
  ProjectList: registryComponent(RegistryEntityListCard),
  ProjectSummary: registryComponent(AgentProjectSummaryCard),
  ProjectTimeReport: registryComponent(AgentProjectSummaryCard),

  CalendarEventDetail: registryComponent(RegistryEntityDetailCard),
  CalendarEventList: registryComponent(RegistryEntityListCard),
  CalendarDayView: registryComponent(AgentScheduleCard),

  BusinessOverview: registryComponent(AgentFinancialCard),
  FinancialSummary: registryComponent(AgentFinancialCard),
  ActionItems: registryComponent(AgentActionItemsCard),
  SearchResults: registryComponent(AgentSearchResultsCard),
  GlobalSearch: registryComponent(AgentSearchResultsCard),
  DashboardTasks: registryComponent(AgentActionItemsCard),
  KpiDashboard: registryComponent(AgentFinancialCard),

  StaffList: registryComponent(RegistryEntityListCard),
  StaffMemberDetail: registryComponent(RegistryEntityDetailCard),
  TeamList: registryComponent(RegistryEntityListCard),
  TeamDetail: registryComponent(AgentScheduleCard),
  QualificationExpiryList: registryComponent(AgentPlannerCard),

  PlannerAssignment: registryComponent(AgentPlannerCard),
  PlannerAssignmentList: registryComponent(AgentPlannerCard),
  StaffAvailability: registryComponent(AgentPlannerCard),
  StaffSuggestions: registryComponent(AgentPlannerCard),
  WeeklySchedule: registryComponent(AgentScheduleCard),
  WeeklyPlan: registryComponent(AgentScheduleCard),

  ActiveTimer: registryComponent(AgentActiveTimerCard),
  TimeEntryDetail: registryComponent(AgentActiveTimerCard),
  WeeklyTimesheet: registryComponent(AgentScheduleCard),

  CatalogItemDetail: registryComponent(AgentCatalogItemCard),
  CatalogItemList: registryComponent(AgentCatalogItemCard),

  DocumentTimeline: registryComponent(AgentTimelineCard),

  MemorySearchResults: registryComponent(AgentMemoryCard),
  MemoryEntry: registryComponent(AgentMemoryCard),

  CronJobCard: registryComponent(RegistryEntityDetailCard),
  CronJobList: registryComponent(RegistryEntityListCard),

  GeneratedDocumentCard: registryComponent(AgentGeneratedDocumentCard),

  EmailComposePrompt: registryComponent(AgentEmailComposeCard),

  AgentSkillApprovalCard: registryComponent(AgentSkillApprovalCard),

  AgentContextDumpCard: registryComponent(AgentContextDumpCard),
};

type ChatUIComponentProps = {
  name: string;
  props: Record<string, unknown>;
};

export function ChatUIComponent({ name, props }: ChatUIComponentProps) {
  const Component = COMPONENTS[name];
  if (!Component) return null;

  return <Component {...props} />;
}

export function isRegisteredUIComponent(name: string): boolean {
  return name in COMPONENTS;
}

export const UI_COMPONENT_REGISTRY_NAMES = Object.keys(COMPONENTS);
