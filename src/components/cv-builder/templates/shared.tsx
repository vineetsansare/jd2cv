// ═══════════════════════════════════════════════════════════════════════════════
// Shared Template Utilities — Common rendering functions used across templates
// ═══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import type { StructuredCV, SectionId, CVThemeSettings } from '../../../types/cvBuilder';
import { SECTION_ICONS } from '../SectionHeadingControl';
import { FileText, Mail, Phone, MapPin, Globe, ExternalLink } from 'lucide-react';

// ── Font Size Maps ───────────────────────────────────────────────────────────

export const FONT_SIZE_MAP = {
  compact: { base: '10.5px', name: '20px', h2: '12.5px', h3: '11.5px', small: '9.5px' },
  standard: { base: '12px', name: '24px', h2: '14.5px', h3: '13px', small: '10.5px' },
  spacious: { base: '13.5px', name: '28px', h2: '16.5px', h3: '14.5px', small: '11.5px' },
};

export const LINE_HEIGHT_MAP = {
  tight: 1.35,
  normal: 1.5,
  relaxed: 1.7,
};

export const MARGIN_MAP = {
  compact: '20px 26px',
  standard: '32px 38px',
  spacious: '44px 50px',
};

export const SECTION_SPACING_MAP = {
  compact: '0.85rem',
  standard: '1.35rem',
  spacious: '1.85rem',
};

export type FontSizes = typeof FONT_SIZE_MAP['standard'];

export function getThemeValues(theme: CVThemeSettings) {
  return {
    accent: theme.accentColor || '#1e3a8a',
    fontFamily: theme.fontFamily || 'Plus Jakarta Sans',
    fs: FONT_SIZE_MAP[theme.fontSize || 'standard'],
    lineHeight: LINE_HEIGHT_MAP[theme.lineHeight || 'normal'],
    pagePadding: MARGIN_MAP[theme.pageMargin || 'standard'],
    sectionGap: SECTION_SPACING_MAP[theme.sectionSpacing || 'standard'],
    showIcons: theme.showIcons !== false,
    headingStyle: theme.headingStyle || 'uppercase',
  };
}

// ── Rich Text Renderer ───────────────────────────────────────────────────────

/**
 * Renders inline markdown formatting: **bold**, *italic*, <u>underline</u>, [link](url)
 */
export function renderRichText(text: string, accent: string): React.ReactNode {
  if (!text) return null;

  const tokens = text.split(/(\*\*.*?\*\*|\*.*?\*|<u>.*?<\/u>|\[.*?\]\(.*?\))/g);

  return tokens.map((token, idx) => {
    if (token.startsWith('**') && token.endsWith('**')) {
      return React.createElement('strong', { key: idx, style: { color: '#0f172a', fontWeight: 700 } }, token.slice(2, -2));
    }
    if (token.startsWith('*') && token.endsWith('*') && !token.startsWith('**')) {
      return React.createElement('em', { key: idx, style: { fontStyle: 'italic' } }, token.slice(1, -1));
    }
    if (token.startsWith('<u>') && token.endsWith('</u>')) {
      return React.createElement('u', { key: idx }, token.slice(3, -4));
    }
    if (token.startsWith('[') && token.includes('](') && token.endsWith(')')) {
      const match = token.match(/\[(.*?)\]\((.*?)\)/);
      if (match) {
        return React.createElement('a', {
          key: idx,
          href: match[2],
          target: '_blank',
          rel: 'noreferrer',
          style: { color: accent, textDecoration: 'underline' }
        }, match[1]);
      }
    }
    return token;
  });
}

/**
 * Renders multi-line content supporting paragraphs and bullet lists.
 */
export function renderRichContent(content: string, accent: string, alignment?: string): React.ReactNode {
  if (!content) return null;

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let currentBullets: string[] = [];

  const flushBullets = (keyIdx: number) => {
    if (currentBullets.length > 0) {
      elements.push(
        React.createElement('ul', {
          key: `ul-${keyIdx}`,
          style: {
            margin: '0.3rem 0',
            paddingLeft: '1.2rem',
            display: 'flex',
            flexDirection: 'column' as const,
            gap: '0.2rem',
            textAlign: (alignment as any) || 'inherit',
          }
        }, currentBullets.map((b, bIdx) =>
          React.createElement('li', { 
            key: bIdx, 
            style: { 
              color: '#334155',
              breakInside: 'avoid',
              pageBreakInside: 'avoid'
            } 
          }, renderRichText(b, accent))
        ))
      );
      currentBullets = [];
    }
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('* ') || trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
      currentBullets.push(trimmed.replace(/^[\*\-•]\s*/, ''));
    } else {
      flushBullets(idx);
      if (trimmed.length > 0) {
        elements.push(
          React.createElement('p', {
            key: `p-${idx}`,
            style: { 
              margin: '0 0 0.4rem 0', 
              textAlign: (alignment as any) || 'inherit', 
              lineHeight: 1.55,
              breakInside: 'avoid',
              pageBreakInside: 'avoid'
            }
          }, renderRichText(line, accent))
        );
      }
    }
  });

  flushBullets(lines.length);
  return React.createElement(React.Fragment, null, ...elements);
}

// ── Section Header Renderer ──────────────────────────────────────────────────

export interface SectionHeaderStyle {
  borderBottom?: string;
  borderTop?: string;
  textTransform?: string;
  letterSpacing?: string;
  textAlign?: string;
  paddingTop?: string;
  paddingBottom?: string;
  marginBottom?: string;
  iconSize?: number;
  showDot?: boolean;
}

export function renderSectionHeader(
  title: string,
  accent: string,
  fs: FontSizes,
  showIcons: boolean,
  iconKey: string = 'fileText',
  showIcon: boolean = true,
  headingStyle: string = 'uppercase',
  customStyle?: SectionHeaderStyle
) {
  const IconComp = SECTION_ICONS[iconKey] || FileText;
  const shouldShowIcon = showIcons && showIcon;

  return React.createElement('h2', {
    style: {
      fontSize: fs.h2,
      fontWeight: 700,
      color: '#0f172a',
      textTransform: customStyle?.textTransform || headingStyle,
      letterSpacing: customStyle?.letterSpacing || '0.05em',
      borderBottom: customStyle?.borderBottom ?? `1.5px solid ${accent}`,
      borderTop: customStyle?.borderTop,
      paddingTop: customStyle?.paddingTop,
      paddingBottom: customStyle?.paddingBottom || '0.3rem',
      marginBottom: customStyle?.marginBottom || '0.65rem',
      marginTop: 0,
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      textAlign: customStyle?.textAlign,
      breakAfter: 'avoid',
      pageBreakAfter: 'avoid',
    }
  },
    shouldShowIcon
      ? React.createElement('span', { style: { display: 'flex', alignItems: 'center', color: accent } },
          React.createElement(IconComp, { size: customStyle?.iconSize || 14 })
        )
      : (customStyle?.showDot !== false
          ? React.createElement('span', { style: { width: '7px', height: '7px', borderRadius: '50%', background: accent, flexShrink: 0 } })
          : null),
    React.createElement('span', null, title)
  );
}

// ── Contact Info Renderer ────────────────────────────────────────────────────

export function renderContactInfo(basics: StructuredCV['basics'], accent: string, style?: React.CSSProperties) {
  const items: React.ReactNode[] = [];
  const iconSize = 12;

  if (basics.email) {
    items.push(
      React.createElement('div', { key: 'email', style: { display: 'flex', alignItems: 'center', gap: '0.3rem' } },
        React.createElement(Mail, { size: iconSize, style: { color: accent } }),
        React.createElement('span', null, basics.email)
      )
    );
  }
  if (basics.phone) {
    items.push(
      React.createElement('div', { key: 'phone', style: { display: 'flex', alignItems: 'center', gap: '0.3rem' } },
        React.createElement(Phone, { size: iconSize, style: { color: accent } }),
        React.createElement('span', null, basics.phone)
      )
    );
  }
  if (basics.location) {
    items.push(
      React.createElement('div', { key: 'loc', style: { display: 'flex', alignItems: 'center', gap: '0.3rem' } },
        React.createElement(MapPin, { size: iconSize, style: { color: accent } }),
        React.createElement('span', null, basics.location)
      )
    );
  }
  if (basics.website) {
    items.push(
      React.createElement('div', { key: 'web', style: { display: 'flex', alignItems: 'center', gap: '0.3rem' } },
        React.createElement(Globe, { size: iconSize, style: { color: accent } }),
        React.createElement('span', null, basics.website.replace(/^https?:\/\//, ''))
      )
    );
  }
  if (basics.links) {
    basics.links.forEach(link => {
      items.push(
        React.createElement('div', { key: link.id, style: { display: 'flex', alignItems: 'center', gap: '0.3rem' } },
          React.createElement(ExternalLink, { size: iconSize, style: { color: accent } }),
          React.createElement('a', {
            href: link.url,
            target: '_blank',
            rel: 'noreferrer',
            style: { color: '#475569', textDecoration: 'none' }
          }, link.username || link.network)
        )
      );
    });
  }

  return React.createElement('div', {
    style: {
      display: 'flex',
      flexWrap: 'wrap' as const,
      gap: '0.55rem 1rem',
      fontSize: '0.82em',
      color: '#64748b',
      ...style,
    }
  }, ...items);
}

// ── Ordered Sections Helper ──────────────────────────────────────────────────

/**
 * Returns the section IDs that should be rendered, in order,
 * filtered to only sections that exist in sectionOrder and have content.
 */
export function getOrderedSections(cv: StructuredCV): SectionId[] {
  const order = cv.sectionOrder || ['summary', 'experience', 'education', 'skills', 'projects', 'certifications'];
  return order;
}
