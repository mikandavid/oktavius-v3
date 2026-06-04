import { describe, expect, it } from 'vitest';

import { filterEventsByTeamMembers, type CalendarEvent } from './calendar-shared';

const events: CalendarEvent[] = [
  { id: '1', title: 'All hands', start: '2026-06-01', end: '2026-06-01' },
  {
    id: '2',
    title: 'Anna sync',
    start: '2026-06-02T09:00',
    end: '2026-06-02T10:00',
    attendeeIds: ['a'],
  },
  {
    id: '3',
    title: 'Bob sync',
    start: '2026-06-03T09:00',
    end: '2026-06-03T10:00',
    attendeeIds: ['b'],
  },
];

describe('filterEventsByTeamMembers', () => {
  it('returns all events when every member is selected', () => {
    expect(filterEventsByTeamMembers(events, ['a', 'b'], ['a', 'b'])).toHaveLength(3);
  });

  it('keeps events without attendees visible', () => {
    expect(filterEventsByTeamMembers(events, ['a'], ['a', 'b']).map((e) => e.id)).toEqual([
      '1',
      '2',
    ]);
  });

  it('filters to matching attendee ids', () => {
    expect(filterEventsByTeamMembers(events, ['b'], ['a', 'b']).map((e) => e.id)).toEqual([
      '1',
      '3',
    ]);
  });

  it('returns all events when selection is cleared (demo clear-all)', () => {
    expect(filterEventsByTeamMembers(events, [], ['a', 'b']).map((e) => e.id)).toEqual([
      '1',
      '2',
      '3',
    ]);
  });
});
