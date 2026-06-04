import type { NavigateFunction } from 'react-router-dom';

export interface AgentPageLink {
  label: string;
  href: string;
  kind: 'link' | 'button';
  newTab?: boolean;
}

export interface AgentPagePrimaryEntity {
  entityType: string;
  entityId: string;
  displayLabel?: string;
  reference?: string;
}

export interface AgentPageContextMetadata {
  url?: string;
  pathname?: string;
  search?: string;
  moduleId?: string;
  moduleLabel?: string;
  routeLabel?: string;
  primaryEntity?: AgentPagePrimaryEntity;
}

export interface AgentPageContextSnapshot {
  url?: string;
  pathname?: string;
  search?: string;
  title?: string;
  moduleId?: string;
  moduleLabel?: string;
  routeLabel?: string;
  primaryEntity?: AgentPagePrimaryEntity;
  links: AgentPageLink[];
  agentFeatureToggles?: {
    pageRouting?: boolean;
  };
}

type OpenLinkResult = {
  href?: string;
  navigateTo?: string | null;
  newTab?: boolean;
};

const MAX_LINKS = 75;
const LINK_SELECTOR = 'a[href], button, [role="button"], [role="link"], [data-route], [data-href]';
const MOBILE_MEDIA_QUERY = '(max-width: 768px)';

function collapseWhitespace(value: string | null | undefined): string {
  return (value ?? '').replace(/\s+/g, ' ').trim();
}

function trimOptional(value: string | undefined, maxLength: number): string | undefined {
  const trimmed = collapseWhitespace(value);
  return trimmed ? trimmed.slice(0, maxLength) : undefined;
}

function normalizePrimaryEntity(
  value: AgentPagePrimaryEntity | undefined,
): AgentPagePrimaryEntity | undefined {
  if (!value) return undefined;

  const entityType = trimOptional(value.entityType, 100);
  const entityId = trimOptional(value.entityId, 200);
  const displayLabel = trimOptional(value.displayLabel, 200);
  const reference = trimOptional(value.reference, 120);
  if (!entityType || !entityId) return undefined;

  return {
    entityType,
    entityId,
    ...(displayLabel ? { displayLabel } : {}),
    ...(reference ? { reference } : {}),
  };
}

function isVisible(element: HTMLElement): boolean {
  if (element.hidden || element.getAttribute('aria-hidden') === 'true') {
    return false;
  }

  const view = element.ownerDocument.defaultView;
  const style = view?.getComputedStyle(element);
  return style?.display !== 'none' && style?.visibility !== 'hidden';
}

function getElementLabel(element: HTMLElement): string {
  return (
    collapseWhitespace(element.getAttribute('aria-label')) ||
    collapseWhitespace(element.getAttribute('title')) ||
    collapseWhitespace(element.innerText) ||
    ''
  );
}

function isMobileViewport(view: Window | null): boolean {
  if (!view?.matchMedia) return false;
  return view.matchMedia(MOBILE_MEDIA_QUERY).matches;
}

function resolveLinkTarget(element: HTMLElement, currentUrl: URL) {
  const dataRoute = element.getAttribute('data-route') ?? element.getAttribute('data-href');
  const hrefAttr = element.getAttribute('href');

  if (dataRoute) {
    const href = new URL(dataRoute, currentUrl).toString();
    return { href, kind: 'link' as const, newTab: false };
  }

  if (hrefAttr && hrefAttr !== '#') {
    const href = new URL(hrefAttr, currentUrl).toString();
    const newTab = element.getAttribute('target') === '_blank';
    return { href, kind: 'link' as const, newTab };
  }

  if (element.tagName === 'BUTTON' || element.getAttribute('role') === 'button') {
    return null;
  }

  return null;
}

export function captureAgentPageContext(
  doc: Document = document,
  currentHref = typeof window !== 'undefined' && window.location
    ? window.location.href
    : 'http://localhost/',
  metadata: AgentPageContextMetadata = {},
): AgentPageContextSnapshot {
  const currentUrl = new URL(currentHref);
  const links: AgentPageLink[] = [];
  const seen = new Set<string>();

  for (const element of Array.from(doc.querySelectorAll<HTMLElement>(LINK_SELECTOR))) {
    if (!isVisible(element)) continue;

    const target = resolveLinkTarget(element, currentUrl);
    if (!target) continue;

    const label = getElementLabel(element) || target.href;
    const signature = `${label}|${target.href}|${target.kind}|${target.newTab ? '1' : '0'}`;
    if (seen.has(signature)) continue;

    seen.add(signature);
    links.push({
      label: label.slice(0, 200),
      href: target.href,
      kind: target.kind,
      ...(target.newTab ? { newTab: true } : {}),
    });

    if (links.length >= MAX_LINKS) break;
  }

  const title = collapseWhitespace(doc.title).slice(0, 200);
  const agentFeatureToggles = isMobileViewport(doc.defaultView)
    ? { pageRouting: false }
    : undefined;

  return {
    url: trimOptional(metadata.url, 2048) ?? currentUrl.toString(),
    pathname: trimOptional(metadata.pathname, 512) ?? currentUrl.pathname ?? '/',
    search: trimOptional(metadata.search, 512) ?? (currentUrl.search || undefined),
    ...(title ? { title } : {}),
    ...(trimOptional(metadata.moduleId, 100)
      ? { moduleId: trimOptional(metadata.moduleId, 100) }
      : {}),
    ...(trimOptional(metadata.moduleLabel, 120)
      ? { moduleLabel: trimOptional(metadata.moduleLabel, 120) }
      : {}),
    ...(trimOptional(metadata.routeLabel, 200)
      ? { routeLabel: trimOptional(metadata.routeLabel, 200) }
      : {}),
    ...(normalizePrimaryEntity(metadata.primaryEntity)
      ? { primaryEntity: normalizePrimaryEntity(metadata.primaryEntity) }
      : {}),
    links,
    ...(agentFeatureToggles ? { agentFeatureToggles } : {}),
  };
}

export function executeAgentOpenLink(result: unknown, navigate: NavigateFunction): boolean {
  if (!result || typeof result !== 'object') return false;

  const payload = result as OpenLinkResult;
  const href = typeof payload.href === 'string' ? payload.href.trim() : '';
  const navigateTo =
    typeof payload.navigateTo === 'string' && payload.navigateTo.trim().length > 0
      ? payload.navigateTo.trim()
      : null;

  if (!href && !navigateTo) return false;

  const target = navigateTo ?? href;
  const absoluteUrl = new URL(target, window.location.href).toString();

  if (payload.newTab) {
    return window.open(absoluteUrl, '_blank', 'noopener,noreferrer') !== null;
  }

  if (navigateTo) {
    navigate(navigateTo);
    return true;
  }

  const resolved = new URL(absoluteUrl);
  if (resolved.origin === window.location.origin) {
    navigate(`${resolved.pathname}${resolved.search}${resolved.hash}`);
    return true;
  }

  window.location.assign(absoluteUrl);
  return true;
}
