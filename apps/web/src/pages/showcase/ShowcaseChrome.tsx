import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { SectionCard, Tabs, TabsList, TabsTrigger, cn } from '@oktavius/base-ui';

import {
  ALL_SECTIONS,
  SHOWCASE_GROUPS,
  SECTION_TO_GROUP,
  type ShowcaseGroupId,
} from './showcaseConfig';

type ShowcaseGroupContextValue = {
  activeGroup: ShowcaseGroupId;
  setActiveGroup: (group: ShowcaseGroupId) => void;
  scrollToSection: (sectionId: string) => void;
};

const ShowcaseGroupContext = createContext<ShowcaseGroupContextValue | null>(null);

function useShowcaseGroup() {
  const ctx = useContext(ShowcaseGroupContext);
  if (!ctx) throw new Error('Showcase chrome must be used inside ShowcaseGroupProvider');
  return ctx;
}

function scrollToSectionId(sectionId: string) {
  const el = document.getElementById(sectionId);
  if (!el) return;
  const scroller = document.getElementById('app-main-content');
  const offset = 120;
  if (scroller) {
    const scrollerRect = scroller.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const target = scroller.scrollTop + (elRect.top - scrollerRect.top) - offset;
    scroller.scrollTo({ top: target, behavior: 'smooth' });
  } else {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  history.replaceState(null, '', `#${sectionId}`);
}

export function ShowcaseGroupProvider({ children }: { children: ReactNode }) {
  const [activeGroup, setActiveGroupState] = useState<ShowcaseGroupId>(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash && SECTION_TO_GROUP[hash]) return SECTION_TO_GROUP[hash];
    return 'foundations';
  });

  const setActiveGroup = useCallback((group: ShowcaseGroupId) => {
    setActiveGroupState(group);
    const first = SHOWCASE_GROUPS.find((g) => g.id === group)?.sections[0]?.id;
    if (first) {
      requestAnimationFrame(() => scrollToSectionId(first));
    }
  }, []);

  const scrollToSection = useCallback(
    (sectionId: string) => {
      const group = SECTION_TO_GROUP[sectionId];
      if (group && group !== activeGroup) {
        setActiveGroupState(group);
        requestAnimationFrame(() => scrollToSectionId(sectionId));
        return;
      }
      scrollToSectionId(sectionId);
    },
    [activeGroup],
  );

  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && SECTION_TO_GROUP[hash]) {
        setActiveGroupState(SECTION_TO_GROUP[hash]);
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const value = useMemo(
    () => ({ activeGroup, setActiveGroup, scrollToSection }),
    [activeGroup, setActiveGroup, scrollToSection],
  );

  return <ShowcaseGroupContext.Provider value={value}>{children}</ShowcaseGroupContext.Provider>;
}

export function ShowcaseOverview() {
  const { setActiveGroup, scrollToSection } = useShowcaseGroup();

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {SHOWCASE_GROUPS.map((group) => (
        <button
          key={group.id}
          type="button"
          onClick={() => setActiveGroup(group.id)}
          className={cn(
            'rounded-card bg-card p-4 text-left transition-colors',
            'hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
          )}
        >
          <p className="text-sm font-semibold text-foreground">{group.label}</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{group.description}</p>
          <p className="mt-3 text-[11px] font-medium text-muted-foreground">
            {group.sections.length} section{group.sections.length === 1 ? '' : 's'}
          </p>
          <div className="mt-2 flex flex-wrap gap-1">
            {group.sections.map((section) => (
              <span
                key={section.id}
                role="link"
                tabIndex={0}
                onClick={(event) => {
                  event.stopPropagation();
                  scrollToSection(section.id);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    event.stopPropagation();
                    scrollToSection(section.id);
                  }
                }}
                className="rounded-control bg-muted/50 px-2 py-0.5 text-[10px] text-muted-foreground hover:text-foreground"
              >
                {section.label}
              </span>
            ))}
          </div>
        </button>
      ))}
    </div>
  );
}

export function ShowcaseGroupTabs() {
  const { activeGroup, setActiveGroup } = useShowcaseGroup();
  const group = SHOWCASE_GROUPS.find((g) => g.id === activeGroup);

  return (
    <div className="space-y-3">
      <Tabs value={activeGroup} onValueChange={(value) => setActiveGroup(value as ShowcaseGroupId)}>
        <TabsList className="h-auto flex-wrap justify-start gap-1 bg-transparent p-0">
          {SHOWCASE_GROUPS.map((item) => (
            <TabsTrigger
              key={item.id}
              value={item.id}
              className="rounded-control data-[state=active]:bg-muted data-[state=active]:shadow-none"
            >
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {group ? <p className="text-sm text-muted-foreground">{group.description}</p> : null}
    </div>
  );
}

export function ShowcaseSectionNav() {
  const { activeGroup, scrollToSection } = useShowcaseGroup();
  const [activeSection, setActiveSection] = useState<string>('');

  const sections = SHOWCASE_GROUPS.find((g) => g.id === activeGroup)?.sections ?? [];

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActiveSection(visible[0].target.id);
      },
      { rootMargin: '-25% 0px -55% 0px', threshold: [0, 0.25, 0.5] },
    );

    sections.forEach((section) => {
      const el = document.getElementById(section.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [sections]);

  if (sections.length <= 1) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {sections.map((section) => (
        <button
          key={section.id}
          type="button"
          onClick={() => scrollToSection(section.id)}
          className={cn(
            'rounded-control px-2.5 py-1 text-xs font-medium transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
            activeSection === section.id
              ? 'bg-cta/10 text-cta'
              : 'bg-muted/40 text-muted-foreground hover:bg-muted/60 hover:text-foreground',
          )}
        >
          {section.label}
        </button>
      ))}
    </div>
  );
}

export function ShowcaseSection({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  const { activeGroup } = useShowcaseGroup();
  if (SECTION_TO_GROUP[id] !== activeGroup) return null;

  return (
    <section id={id} className="scroll-mt-28 space-y-4">
      <div className="space-y-1">
        <h2 className="text-base font-semibold text-foreground">{title}</h2>
        {description ? (
          <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">{description}</p>
        ) : null}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

/** Consistent demo tile — prefer over raw Card in showcase. */
export function DemoBlock({
  title,
  meta,
  children,
  className,
}: {
  title: string;
  meta?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <SectionCard title={title} meta={meta} className={className}>
      {children}
    </SectionCard>
  );
}

export function ShowcaseQuickIndex() {
  return (
    <SectionCard
      title="Quick index"
      meta={`${ALL_SECTIONS.length} sections · pick a group or jump directly`}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {SHOWCASE_GROUPS.map((group) => (
          <div key={group.id} className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              {group.label}
            </p>
            <ul className="space-y-1">
              {group.sections.map((section) => (
                <li key={section.id}>
                  <ShowcaseIndexLink
                    sectionId={section.id}
                    label={section.label}
                    blurb={section.blurb}
                  />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

function ShowcaseIndexLink({
  sectionId,
  label,
  blurb,
}: {
  sectionId: string;
  label: string;
  blurb: string;
}) {
  const { scrollToSection } = useShowcaseGroup();

  return (
    <button
      type="button"
      onClick={() => scrollToSection(sectionId)}
      className="flex w-full flex-col rounded-control px-2 py-1.5 text-left hover:bg-muted/40"
    >
      <span className="text-sm font-medium text-foreground">{label}</span>
      <span className="text-xs text-muted-foreground">{blurb}</span>
    </button>
  );
}
