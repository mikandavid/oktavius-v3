import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';

afterEach(() => {
  cleanup();
});

describe('Tabs', () => {
  it('switches uncontrolled tab content when a trigger is clicked', async () => {
    const user = userEvent.setup();

    render(
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">Overview content</TabsContent>
        <TabsContent value="files">Files content</TabsContent>
      </Tabs>,
    );

    await user.click(screen.getByRole('tab', { name: 'Files' }));

    expect(screen.getByRole('tab', { name: 'Files' })).toHaveAttribute('data-state', 'active');
    expect(screen.queryByText('Overview content')).not.toBeInTheDocument();
    expect(screen.getByText('Files content')).toBeInTheDocument();
  });

  it('notifies controlled callers without mutating a fixed controlled value', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();

    render(
      <Tabs value="overview" onValueChange={onValueChange}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">Overview content</TabsContent>
        <TabsContent value="activity">Activity content</TabsContent>
      </Tabs>,
    );

    await user.click(screen.getByRole('tab', { name: 'Activity' }));

    expect(onValueChange).toHaveBeenCalledWith('activity');
    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveAttribute('data-state', 'active');
    expect(screen.getByRole('tab', { name: 'Activity' })).toHaveAttribute('data-state', 'inactive');
  });
});
