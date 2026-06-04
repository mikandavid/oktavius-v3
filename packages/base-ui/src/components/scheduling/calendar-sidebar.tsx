import { useMemo } from 'react';

import { cn } from '../../lib/utils';
import { CalendarMiniPicker } from './calendar-mini-picker';
import { CalendarSourceLegend } from './calendar-source-legend';
import { CalendarSidebarSection, CalendarSidebarToggleRow } from './calendar-sidebar-primitives';
import { type CalendarTeamMember, type CalendarViewMode } from './calendar-shared';
import { type CalendarSource } from './calendar-colors';

function memberInitials(label: string): string {
  const parts = label.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]?.[0] ?? ''}${parts[parts.length - 1]?.[0] ?? ''}`.toUpperCase();
  }
  return (parts[0]?.slice(0, 2) || '?').toUpperCase();
}

export interface CalendarSidebarProps {
  anchor: Date;
  view: CalendarViewMode;
  onAnchorChange: (date: Date) => void;
  teamMembers?: CalendarTeamMember[];
  selectedTeamMemberIds?: string[];
  onTeamMemberVisibilityChange?: (memberId: string, visible: boolean) => void;
  onSelectAllTeamMembers?: () => void;
  onClearTeamMembers?: () => void;
  calendars?: CalendarSource[];
  onCalendarVisibilityChange?: (calendarId: string, visible: boolean) => void;
  className?: string;
}

export function CalendarSidebar({
  anchor,
  onAnchorChange,
  teamMembers = [],
  selectedTeamMemberIds,
  onTeamMemberVisibilityChange,
  onSelectAllTeamMembers,
  onClearTeamMembers,
  calendars,
  onCalendarVisibilityChange,
  className,
}: CalendarSidebarProps) {
  const selectedSet = useMemo(
    () => new Set(selectedTeamMemberIds ?? teamMembers.map((member) => member.id)),
    [selectedTeamMemberIds, teamMembers],
  );
  const allTeamSelected =
    teamMembers.length > 0 && teamMembers.every((member) => selectedSet.has(member.id));

  const selectAllAction =
    onSelectAllTeamMembers && onClearTeamMembers ? (
      <button
        type="button"
        className="text-xs font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
        onClick={allTeamSelected ? onClearTeamMembers : onSelectAllTeamMembers}
      >
        {allTeamSelected ? 'Clear' : 'All'}
      </button>
    ) : null;

  return (
    <aside
      className={cn(
        'hidden min-h-0 w-60 shrink-0 flex-col gap-6 overflow-y-auto overscroll-y-contain border-r border-border/40 p-4 lg:flex',
        className,
      )}
    >
      {teamMembers.length > 0 ? (
        <CalendarSidebarSection title="Team" action={selectAllAction}>
          {teamMembers.map((member) => {
            const checked = selectedSet.has(member.id);
            return (
              <CalendarSidebarToggleRow
                key={member.id}
                checked={checked}
                onCheckedChange={
                  onTeamMemberVisibilityChange
                    ? (visible) => onTeamMemberVisibilityChange(member.id, visible)
                    : undefined
                }
                leading={
                  <span
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-control bg-muted/60 text-[10px] font-medium text-muted-foreground"
                    aria-hidden
                  >
                    {memberInitials(member.label)}
                  </span>
                }
                label={member.label}
                hint={member.description}
              />
            );
          })}
        </CalendarSidebarSection>
      ) : null}

      {calendars && calendars.length > 0 ? (
        <CalendarSidebarSection title="Calendars">
          <CalendarSourceLegend calendars={calendars} onToggle={onCalendarVisibilityChange} />
        </CalendarSidebarSection>
      ) : null}

      <CalendarSidebarSection title="Jump to date">
        <CalendarMiniPicker selected={anchor} onSelect={onAnchorChange} />
      </CalendarSidebarSection>
    </aside>
  );
}
