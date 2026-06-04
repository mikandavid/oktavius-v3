import { Badge, Button, SectionCard, StatCard } from '@oktavius/base-ui';

import { Cluster, Grid, Sidebar, Split, Stack } from '@/components/layout/primitives';

import { ShowcaseBlock } from '../shared';

function Box({ label, className }: { label: string; className?: string }) {
  return (
    <div
      className={`flex items-center justify-center rounded-md border border-dashed border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground ${className ?? ''}`}
    >
      {label}
    </div>
  );
}

function Tile({ label, hint }: { label: string; hint?: string }) {
  return (
    <div className="rounded-card bg-card p-4">
      <div className="text-sm font-semibold text-foreground">{label}</div>
      {hint ? <div className="mt-1 text-xs text-muted-foreground">{hint}</div> : null}
    </div>
  );
}

function Code({ children }: { children: string }) {
  return (
    <code className="mt-2 block rounded-md bg-muted/40 px-2 py-1 font-mono text-[11px] text-muted-foreground">
      {children}
    </code>
  );
}

export function LayoutsSection() {
  return (
    <Stack gap="md">
      <ShowcaseBlock
        title="Layout primitives"
        meta="Composable wrappers — Stack, Cluster, Split, Sidebar, Grid"
      >
        <Stack gap="lg">
          <div>
            <p className="text-xs font-medium text-muted-foreground">
              Stack — vertical column with gap
            </p>
            <div className="mt-2 rounded-md border border-border/60 p-3">
              <Stack gap="sm">
                <Box label="item" />
                <Box label="item" />
                <Box label="item" />
              </Stack>
            </div>
            <Code>{'<Stack gap="sm">…</Stack>'}</Code>
          </div>

          <div>
            <p className="text-xs font-medium text-muted-foreground">
              Cluster — horizontal wrap (toolbars, chips)
            </p>
            <div className="mt-2 rounded-md border border-border/60 p-3">
              <Cluster gap="sm">
                <Badge>active</Badge>
                <Badge variant="secondary">draft</Badge>
                <Badge variant="outline">archived</Badge>
                <Button size="sm" variant="outline">
                  Action
                </Button>
              </Cluster>
            </div>
            <Code>{'<Cluster gap="sm">…</Cluster>'}</Code>
          </div>

          <div>
            <p className="text-xs font-medium text-muted-foreground">
              Split — fixed ratio, collapses on mobile
            </p>
            <div className="mt-2 rounded-md border border-border/60 p-3">
              <Split ratio="2:1">
                <Box label="main (2fr)" className="h-16" />
                <Box label="side (1fr)" className="h-16" />
              </Split>
            </div>
            <Code>{'<Split ratio="2:1">…</Split>'}</Code>
          </div>

          <div>
            <p className="text-xs font-medium text-muted-foreground">
              Sidebar — main + fixed-width rail
            </p>
            <div className="mt-2 rounded-md border border-border/60 p-3">
              <Sidebar
                aside={
                  <Stack gap="sm">
                    <Box label="rail item" />
                    <Box label="rail item" />
                  </Stack>
                }
              >
                <Box label="main content area" className="h-24" />
              </Sidebar>
            </div>
            <Code>{'<Sidebar aside={…}>{…}</Sidebar>'}</Code>
          </div>

          <div>
            <p className="text-xs font-medium text-muted-foreground">
              Grid — responsive equal columns
            </p>
            <div className="mt-2 rounded-md border border-border/60 p-3">
              <Grid cols={4} gap="sm">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Box key={i} label={`cell ${i + 1}`} className="h-12" />
                ))}
              </Grid>
            </div>
            <Code>{'<Grid cols={4}>…</Grid>'}</Code>
          </div>
        </Stack>
      </ShowcaseBlock>

      <ShowcaseBlock title="Page templates" meta="Skeleton patterns — copy as starting point">
        <Stack gap="lg">
          <div>
            <p className="text-xs font-medium text-muted-foreground">
              Single wide column — long-form content, narrative dashboards
            </p>
            <div className="mt-2 rounded-md border border-border/60 bg-muted/40 p-3">
              <Stack gap="md">
                <Box label="page header" className="h-10" />
                <Box label="one wide section" className="h-32" />
                <Box label="another wide section" className="h-24" />
              </Stack>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-muted-foreground">
              Detail + side rail — record page with meta column
            </p>
            <div className="mt-2 rounded-md border border-border/60 bg-muted/40 p-3">
              <Stack gap="md">
                <Box label="record hero" className="h-12" />
                <Sidebar
                  aside={
                    <Stack gap="sm">
                      <Box label="related" className="h-16" />
                      <Box label="audit" className="h-16" />
                    </Stack>
                  }
                >
                  <Stack gap="sm">
                    <Box label="primary fields" className="h-16" />
                    <Box label="secondary section" className="h-16" />
                  </Stack>
                </Sidebar>
              </Stack>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-muted-foreground">
              Dashboard grid — KPI tiles + main panel
            </p>
            <div className="mt-2 rounded-md border border-border/60 bg-muted/40 p-3">
              <Stack gap="md">
                <Grid cols={4} gap="sm">
                  <StatCard label="Open" value="142" delta="+12" trend="up" />
                  <StatCard label="Resolved" value="89" delta="+5" trend="up" />
                  <StatCard label="SLA breach" value="3" delta="−1" trend="down" />
                  <StatCard label="Avg cycle" value="2.4d" />
                </Grid>
                <Split ratio="2:1">
                  <Box label="chart" className="h-32" />
                  <Box label="activity feed" className="h-32" />
                </Split>
              </Stack>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-muted-foreground">
              Form page — stacked fields, side help
            </p>
            <div className="mt-2 rounded-md border border-border/60 bg-muted/40 p-3">
              <Sidebar width="sm" aside={<Box label="help / context" className="h-28" />}>
                <Stack gap="sm">
                  <Box label="field" className="h-9" />
                  <Box label="field" className="h-9" />
                  <Box label="field" className="h-9" />
                  <Box label="submit row" className="h-9" />
                </Stack>
              </Sidebar>
            </div>
          </div>
        </Stack>
      </ShowcaseBlock>

      <ShowcaseBlock
        title="Section density — fewer cards, more breathing room"
        meta="Prefer one wide section when content is continuous"
      >
        <Stack gap="lg">
          <div>
            <p className="text-xs font-medium text-muted-foreground">
              Avoid — three small cards side-by-side for related continuous content
            </p>
            <div className="mt-2 rounded-md border border-border/60 bg-muted/40 p-3">
              <Grid cols={3} gap="sm">
                <Tile label="Contact info" hint="Name, email, phone" />
                <Tile label="Address" hint="Street, city, zip" />
                <Tile label="Preferences" hint="Language, timezone" />
              </Grid>
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-muted-foreground">
              Prefer — one wide section, internal structure via sub-headings
            </p>
            <div className="mt-2 rounded-md border border-border/60 bg-muted/40 p-3">
              <SectionCard title="Profile" meta="Contact, address, preferences">
                <Stack gap="md">
                  <div>
                    <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Contact
                    </div>
                    <Grid cols={3} gap="sm">
                      <Box label="name" />
                      <Box label="email" />
                      <Box label="phone" />
                    </Grid>
                  </div>
                  <div>
                    <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Address
                    </div>
                    <Grid cols={3} gap="sm">
                      <Box label="street" />
                      <Box label="city" />
                      <Box label="zip" />
                    </Grid>
                  </div>
                  <div>
                    <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Preferences
                    </div>
                    <Grid cols={3} gap="sm">
                      <Box label="language" />
                      <Box label="timezone" />
                      <Box label="locale" />
                    </Grid>
                  </div>
                </Stack>
              </SectionCard>
            </div>
          </div>

          <div className="rounded-md bg-muted/40 p-3 text-xs text-muted-foreground">
            <strong className="text-foreground">When to split into cards:</strong> independent
            domains with different actions (e.g. Billing vs Tax vs Shipping settings). Each card is
            then a unit of work.
            <br />
            <strong className="text-foreground">When to merge into one section:</strong> fields that
            read as a single profile or narrative — splitting fragments the reading flow.
          </div>
        </Stack>
      </ShowcaseBlock>
    </Stack>
  );
}
