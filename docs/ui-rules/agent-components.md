# Agent chat components

Component registry: [`component-registry.md`](./component-registry.md) (Agent / AI section).

Live examples: `/showcase` → **Agent**. Chat shell: `OsirisChatShell` in the right rail and `/ai-chat`.

---

## Layout

Agent messages use a **left octopus avatar rail** for assistant, tool, confirmation, and card rows (grouped in chains with a vertical connector). User messages align right with a primary-tinted bubble — no avatar.

Do **not** nest `SectionCard` inside agent result cards that already sit inside a chat bubble. Result cards use `SectionCard` or bordered `rounded-card` **once** — never card-in-card.

---

## Message types

| `AgentMessage.role`         | Component                                               | When                                                    |
| --------------------------- | ------------------------------------------------------- | ------------------------------------------------------- |
| `user`                      | Plain bubble                                            | User text (+ optional attachment summary)               |
| `assistant`                 | `StructuredContent` (or `FormattedText` for plain text) | Markdown-ish text, `@mentions`, `<oct-*>` blocks, links |
| `tool` / `assistant` + `ui` | `ChatUIComponent`                                       | Backend `{ ui: { component, props } }` payloads         |
| `tool`                      | `AgentToolCallCard`                                     | Tool name, input JSON, result                           |
| `confirmation`              | `AgentConfirmationCard`                                 | Approve/reject destructive actions                      |
| `card`                      | `renderAgentCard(message.card)`                         | Structured results (see below)                          |

Types live in `@/components/agent/types`. Extend `AgentCardPayload` for new card kinds — do not invent parallel message shapes per module.

---

## Result cards (`role: 'card'`)

| `card.kind`       | Component                    | Use for                                      |
| ----------------- | ---------------------------- | -------------------------------------------- |
| `entity-list`     | `AgentEntityListCard`        | Search/list results with `ListRow`           |
| `entity-detail`   | `AgentEntityDetailCard`      | Single record summary + open action          |
| `python`          | `AgentPythonExecutionCard`   | Code run + output                            |
| `document`        | `AgentGeneratedDocumentCard` | Generated PDF/DOCX                           |
| `schedule`        | `AgentScheduleCard`          | Today's events / agenda snippet              |
| `skill-approval`  | `AgentSkillApprovalCard`     | Skill/action approval with confidence fields |
| `financial`       | `AgentFinancialCard`         | KPI / receivables summaries                  |
| `search-results`  | `AgentSearchResultsCard`     | Global search grouped results                |
| `timeline`        | `AgentTimelineCard`          | Document/contact event timeline              |
| `action-items`    | `AgentActionItemsCard`       | Dashboard todos / checklist                  |
| `active-timer`    | `AgentActiveTimerCard`       | Running time entry                           |
| `planner`         | `AgentPlannerCard`           | Staff assignments / availability             |
| `memory`          | `AgentMemoryCard`            | Memory search hits                           |
| `project-summary` | `AgentProjectSummaryCard`    | Project KPIs + highlights                    |
| `catalog-item`    | `AgentCatalogItemCard`       | Catalog product summary                      |
| `doc-processing`  | `AgentDocProcessingCard`     | OCR/extraction progress or result            |
| `email-compose`   | `AgentEmailComposeCard`      | Agent-drafted email                          |
| `context-dump`    | `AgentContextDumpCard`       | Debug context sections                       |
| `sales-document`  | `AgentSalesDocumentCard`     | Invoice/quote summary                        |

Import from `@/components/agent/cards`. Demo payloads: `@/components/agent/agentDemoCardPayloads`.

Backend tool UI names (e.g. `FinancialOverview`, `GlobalSearch`) map via `ChatUIComponent` in `@/components/agent/UIComponentRegistry`.

---

## Structured assistant content

Use `StructuredContent` for assistant messages that may include inline `<oct-stat>`, `<oct-data-card>`, `<oct-email>`, `<oct-bar-chart>`, `<oct-line-chart>`, or `<oct-pie-chart>` tags. Parser lives in `@/components/agent/structured/parser`. Unknown tags are dropped silently (streaming-safe).

Tool/backend UI components attach via `AgentMessage.ui` and render through `ChatUIComponent`.

Page context: wrap the app in `AgentPageContextProvider` and call `useRegisterAgentPageContext()` on detail pages. Snapshot helper: `captureAgentPageContext()`.

---

## Shell utilities

| Component                              | Use                                                        |
| -------------------------------------- | ---------------------------------------------------------- |
| `AgentWelcomeScreen`                   | Empty thread — hero + optional latest conversation         |
| `AgentThinkingIndicator`               | Inline loading while model responds                        |
| `AgentFileAttachmentChip`              | Composer attachment chips                                  |
| `ChatFilePreviewDialog`                | Full-screen attachment preview in chat                     |
| `EditableConversationTitle`            | Inline rename in chat header                               |
| `VoiceRecorder` / `RecordingBar`       | Voice input controls                                       |
| `ContentPanel`                         | Slide-over detail panel from chat                          |
| `AgentSettingsPopover`                 | Header: model mode + cloud/desktop runtime                 |
| `ContextUsageIndicator` / `TokenBadge` | Context window usage in chat header                        |
| `MobileAgentLayout`                    | Mobile history + chat split                                |
| `GoogleMapsPreviewButton`              | Maps links in assistant text (via `extractGoogleMapsUrls`) |

Chat composer: `ChatComposer` + `AgentFileAttachmentChip` — not raw file chip markup.

---

## Wiring pattern

```tsx
<AgentMessageList
  messages={messages}
  onConfirmationRespond={(id, approved) => …}
  onSkillApprovalRespond={(id, approved) => …}
/>
```

For Google Maps links in assistant content:

```tsx
import { extractGoogleMapsUrls, GoogleMapsPreviewButton } from '@/components/maps/GoogleMapsDialog';

const urls = extractGoogleMapsUrls(message.content ?? '');
{
  urls.map((url) => <GoogleMapsPreviewButton key={url} url={url} />);
}
```

---

## Visual rules

- Icons: `@/lib/icons` only (`BotIcon`, `MapIcon`, `WarningIcon`, …).
- Agent cards: `rounded-card border border-border/60` or borderless `SectionCard` on page wash — match surrounding chat card, not nested white tiles.
- Approve/reject: same pattern as `AgentConfirmationCard` / `AgentSkillApprovalCard` — warning tone when pending, success/destructive when resolved.
- Dates in schedule cards: `formatDisplayDate` from `@oktavius/base-ui` for display labels.

---

## Don't

- Build custom chat bubbles per module — extend `AgentMessageList` and card payloads.
- Use `Select` for agent settings — `AgentSettingsPopover` uses `RadioGroupField` + `Switch`.
- Embed full module pages inside chat — use result cards + deep links.
- Nest `SectionCard` inside `SectionCard` for agent results.
