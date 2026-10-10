import { parseMarkdownToHtml } from './mdParser';
import type { CVThemeConfig } from '../components/CVThemeSelector';

function buildModularPrintHtml(
  customHtml: string, 
  filenameTitle: string, 
  themeConfig: CVThemeConfig
): string {
  const isSidebar = themeConfig?.themeName === 'split-sidebar' || 
                    themeConfig?.template === 'split-sidebar' ||
                    customHtml.includes('split-sidebar-template');

  const sidebarBg = 'linear-gradient(to right, #f8fafc 0px, #f8fafc 240px, #e2e8f0 240px, #e2e8f0 241px, #ffffff 241px, #ffffff 100%)';

  const selectedFont = themeConfig?.fontFamily || 'Plus Jakarta Sans';
  const fontFamilyValue = `'${selectedFont}', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=794, initial-scale=1.0" />
  <title>${filenameTitle}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&family=Merriweather:ital,wght@0,300;0,400;0,700;1,300;1,400&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A4 portrait;
      margin: 10mm 0mm;
    }
    *, *:before, *:after {
      box-sizing: border-box !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      background: ${isSidebar ? sidebarBg : '#ffffff'} !important;
      background-color: ${isSidebar ? '#f8fafc' : '#ffffff'} !important;
      color: #1e293b !important;
      font-family: ${fontFamilyValue} !important;
      width: 100% !important;
      min-width: 794px !important;
      height: auto !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .cv-print-root, .resume-preview-sheet {
      width: 100%;
      max-width: 794px;
      min-width: 794px;
      margin: 0 auto;
      padding: 0;
      background: transparent !important;
      font-family: ${fontFamilyValue} !important;
    }
    .cv-print-root, .resume-preview-sheet,
    .resume-preview-sheet h1, .resume-preview-sheet h2, .resume-preview-sheet h3,
    .resume-preview-sheet p, .resume-preview-sheet span, .resume-preview-sheet div,
    .resume-preview-sheet li, .resume-preview-sheet a, .resume-preview-sheet strong, .resume-preview-sheet em {
      font-family: ${fontFamilyValue} !important;
    }
    .cv-a4-document {
      width: 100% !important;
      max-width: 794px !important;
      min-width: 794px !important;
      margin: 0 auto !important;
      box-shadow: none !important;
      border: none !important;
      padding-top: 0 !important;
      padding-bottom: 0 !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    @media print {
      body {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      /* Natural flow: resume sections MUST flow across pages without forced page skips */
      section {
        break-inside: auto !important;
        page-break-inside: auto !important;
      }
      /* Prevent headings from being orphaned alone at the bottom of a page */
      h1, h2, h3, .template-section-heading, [data-heading="true"] {
        break-after: avoid !important;
        page-break-after: avoid !important;
      }
      /* Role header row stays with its first bullet point */
      .role-header-avoid-break {
        break-inside: avoid !important;
        page-break-inside: avoid !important;
        break-after: avoid !important;
        page-break-after: avoid !important;
      }
      /* Ensure bullet points do not get horizontally cut in half */
      li {
        break-inside: avoid !important;
        page-break-inside: avoid !important;
      }
      /* Experience entries allow natural flow between bullet points to prevent large empty voids */
      .experience-entry {
        break-inside: auto !important;
        page-break-inside: auto !important;
      }
      /* Compact leaf entries like education and certifications stay cohesive */
      .entry-avoid-break, .compact-leaf-avoid-break {
        break-inside: avoid !important;
        page-break-inside: avoid !important;
      }
      /* Hide any interactive preview guides or tooltips */
      .page-break-guide, .no-print {
        display: none !important;
      }
    }

    /* Resilient Component Styles for All CV Templates */
    .resume-preview-sheet {
      font-size: 9.5pt;
      line-height: 1.35;
      box-sizing: border-box;
      --cv-accent-color: ${themeConfig?.accentColor || '#475569'};
    }
    .resume-preview-sheet.compact-1page {
      font-size: 9pt !important;
      line-height: 1.28 !important;
    }
    h1 {
      font-size: 22pt;
      text-align: center;
      margin: 0 0 0.15rem 0;
      letter-spacing: -0.02em;
      font-weight: 700;
      color: ${themeConfig?.accentColor || '#475569'};
    }
    .subtitle {
      font-size: 11.5pt;
      font-style: italic;
      text-align: center;
      color: #374151;
      margin: 0 0 0.35rem 0;
      font-weight: 600;
    }
    .contact-row {
      display: flex !important;
      justify-content: center !important;
      align-items: center !important;
      flex-wrap: wrap !important;
      row-gap: 0.25rem !important;
      column-gap: 1rem !important;
      font-size: 9.5pt;
      color: #374151;
      margin: 0 0 0.75rem 0;
      padding-bottom: 0.2rem;
    }
    .contact-item {
      display: inline-flex !important;
      align-items: center !important;
      gap: 0.35rem !important;
      white-space: nowrap !important;
    }
    .contact-item a, .contact-item span {
      color: #374151;
      text-decoration: none;
      white-space: nowrap !important;
    }
    .contact-item svg {
      color: ${themeConfig?.accentColor || '#475569'} !important;
      vertical-align: middle;
    }

    /* Headings */
    h2 {
      font-size: 10.5pt;
      text-transform: uppercase !important;
      letter-spacing: 0.06em;
      font-weight: 700;
      break-after: avoid !important;
      page-break-after: avoid !important;
      display: block !important;
    }
    h2.classic-heading-double-line,
    h2:not(.classic-heading-single-line):not(.classic-heading-filled-pill):not(.modern-section-title):not(.split-section-title) {
      border-top: 1.5px solid ${themeConfig?.accentColor || '#475569'} !important;
      border-bottom: 1.5px solid ${themeConfig?.accentColor || '#475569'} !important;
      border-left: none !important;
      border-right: none !important;
      background: transparent !important;
      color: ${themeConfig?.accentColor || '#475569'} !important;
      padding: 3px 0 !important;
      margin-top: 1rem !important;
      margin-bottom: 0.5rem !important;
      text-align: center;
      border-radius: 0 !important;
    }
    h2.classic-heading-single-line {
      border-top: none !important;
      border-left: none !important;
      border-right: none !important;
      border-bottom: 1.5px solid ${themeConfig?.accentColor || '#475569'} !important;
      background: transparent !important;
      color: ${themeConfig?.accentColor || '#475569'} !important;
      padding: 0 0 3px 0 !important;
      margin-top: 1rem !important;
      margin-bottom: 0.5rem !important;
      text-align: left !important;
      border-radius: 0 !important;
    }
    h2.classic-heading-filled-pill {
      border: none !important;
      background: ${themeConfig?.accentColor || '#475569'} !important;
      color: #ffffff !important;
      padding: 4px 10px !important;
      margin-top: 1rem !important;
      margin-bottom: 0.5rem !important;
      text-align: left !important;
      border-radius: 6px !important;
    }

    /* Role & Company Rows */
    .role-row, .company-row, .school-row {
      display: flex !important;
      justify-content: space-between !important;
      align-items: baseline !important;
      width: 100% !important;
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }
    .role-row { margin-top: 0.6rem; margin-bottom: 0.15rem; }
    .role-title { font-weight: 700; font-size: 10.5pt; color: #111827; }
    .role-dates { font-size: 9.5pt; color: #111827; text-align: right; }
    .company-row { margin-bottom: 0.45rem; }
    .company-name { font-style: italic; font-size: 10pt; color: #374151; }
    .company-location { font-size: 9.5pt; color: #374151; text-align: right; }

    /* Skills */
    .skills-list {
      display: grid !important;
      grid-template-columns: 1fr 1fr !important;
      column-gap: 2rem !important;
      row-gap: 0.5rem !important;
      list-style-type: none !important;
      padding-left: 0 !important;
      margin-bottom: 0.75rem !important;
    }
    .skills-list li { margin-bottom: 0; font-size: 9.5pt; line-height: 1.35; }
    .skills-list strong.skill-category { color: ${themeConfig?.accentColor || '#475569'}; }

    /* Avatar Headshot in Classic ATS */
    .cv-header-photo-wrapper {
      display: flex !important;
      align-items: center !important;
      gap: 1.6rem !important;
      margin-bottom: 0.6rem !important;
    }
    .cv-avatar-headshot {
      width: 125px !important;
      height: 125px !important;
      aspect-ratio: 1 / 1 !important;
      border-radius: 50% !important;
      object-fit: cover !important;
      border: 3px solid ${themeConfig?.accentColor || '#475569'};
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      flex-shrink: 0 !important;
    }
    .cv-header-photo-info { flex-grow: 1; }
    .cv-header-photo-info h1 { text-align: left !important; }
    .cv-header-photo-info .subtitle { text-align: left !important; }
    .cv-header-photo-info .contact-row { justify-content: flex-start !important; margin-bottom: 0 !important; }

    /* Modern Timeline elements */
    .modern-header {
      display: flex !important;
      align-items: flex-start !important;
      gap: 1.5rem !important;
      margin-bottom: 1rem !important;
      padding-bottom: 0.25rem !important;
    }
    .modern-avatar-col { flex-shrink: 0 !important; }
    .modern-avatar-headshot {
      width: 120px !important;
      height: 120px !important;
      aspect-ratio: 1 / 1 !important;
      border-radius: 50% !important;
      object-fit: cover !important;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08) !important;
      flex-shrink: 0 !important;
    }
    .modern-header-col { flex: 1 !important; display: flex !important; flex-direction: column !important; }
    .modern-header-col h1 { font-size: 22pt !important; font-weight: 700 !important; text-align: left !important; margin: 0 0 0.15rem 0 !important; color: #111827 !important; }
    .modern-contact-grid { display: flex !important; flex-wrap: wrap !important; gap: 0.35rem 0.9rem !important; font-size: 9pt !important; color: #374151 !important; }
    .modern-section-title { font-size: 13pt !important; font-weight: 700 !important; color: ${themeConfig?.accentColor || '#2563eb'} !important; text-transform: uppercase !important; letter-spacing: 0.04em !important; margin: 1rem 0 0.2rem 0 !important; }
    .zigzag-divider { height: 2px !important; background: linear-gradient(90deg, ${themeConfig?.accentColor || '#2563eb'} 0%, rgba(37,99,235,0.2) 100%) !important; margin-bottom: 0.75rem !important; }
    .modern-timeline-entry { display: flex !important; margin-bottom: 0.85rem !important; gap: 1.5rem !important; }
    .modern-timeline-left { width: 140px !important; flex-shrink: 0 !important; text-align: right !important; }
    .modern-timeline-right { flex: 1 !important; }
    .timeline-date { font-weight: 600 !important; font-size: 9.5pt !important; color: #111827 !important; }
    .timeline-location { font-size: 8.5pt !important; color: #6b7280 !important; }
    .timeline-company-row { margin-bottom: 0.1rem !important; }
    .timeline-company { font-weight: 700 !important; font-size: 10.5pt !important; color: #111827 !important; }
    .timeline-role { font-size: 9.5pt !important; color: ${themeConfig?.accentColor || '#2563eb'} !important; font-weight: 600 !important; margin-bottom: 0.35rem !important; }
    .modern-skills-container { display: grid !important; grid-template-columns: 1fr 1fr !important; gap: 0.5rem !important; margin-bottom: 0.75rem !important; }
    .modern-skill-card { background: #f8fafc !important; border: 1px solid #e2e8f0 !important; border-radius: 8px !important; padding: 0.5rem 0.75rem !important; font-size: 8.8pt !important; line-height: 1.35 !important; }
  </style>
</head>
<body>
  <div class="cv-print-root">
    ${customHtml}
  </div>
</body>
</html>`;
}

export function printCvDocument(
  markdown: string, 
  themeConfig: CVThemeConfig = { accentColor: '#475569', themeName: 'Slate Charcoal', showPhoto: false },
  filenameTitle: string = 'Resume',
  customHtml?: string
) {
  if (!markdown && !customHtml) return;

  const originalTitle = document.title;
  document.title = filenameTitle;

  const isModularTemplate = Boolean(
    customHtml && (
      customHtml.includes('cv-a4-document') || 
      customHtml.includes('classic-ats-template') ||
      customHtml.includes('modern-timeline-template') ||
      customHtml.includes('split-sidebar-template') ||
      customHtml.includes('compact-executive-template') ||
      customHtml.includes('swiss-minimalist-template')
    )
  );

  // Create isolated hidden iframe
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = 'none';
  iframe.style.zIndex = '-9999';
  iframe.setAttribute('aria-hidden', 'true');
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document || iframe.contentDocument;
  if (!doc) {
    window.print();
    return;
  }

  if (isModularTemplate && customHtml) {
    const modularContent = buildModularPrintHtml(customHtml, filenameTitle, themeConfig);
    doc.open();
    doc.write(modularContent);
    doc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch (e) {
        console.warn('Iframe print error, falling back to window.print():', e);
        window.print();
      } finally {
        document.title = originalTitle;
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 1000);
      }
    }, 250);
    return;
  }

  // Legacy Markdown path below
  const parsedHtml = customHtml || parseMarkdownToHtml(markdown, themeConfig);
  const accentColor = themeConfig?.accentColor || (themeConfig?.template === 'classic-ats' ? '#475569' : '#2563eb');
  const isCompact = themeConfig?.layoutDensity === 'compact';
  const selectedFont = themeConfig?.fontFamily || 'Plus Jakarta Sans';
  const fontFamilyValue = `'${selectedFont}', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`;

  const iframeContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=794, initial-scale=1.0" />
  <title>${filenameTitle}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&family=Merriweather:ital,wght@0,300;0,400;0,700;1,300;1,400&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A4 portrait;
      margin: ${themeConfig?.template === 'split-sidebar-right' ? '0' : '10mm 10mm'};
    }
    *, *:before, *:after {
      box-sizing: border-box !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      background: ${themeConfig?.template === 'split-sidebar-right' 
        ? `linear-gradient(to right, ${themeConfig?.accentColor || '#1c2d42'} 0, ${themeConfig?.accentColor || '#1c2d42'} 265px, #ffffff 265px, #ffffff 100%)` 
        : '#ffffff'} !important;
      background-color: #ffffff !important;
      color: #111827 !important;
      font-family: ${fontFamilyValue} !important;
      width: 100% !important;
      min-width: 794px !important;
      height: auto !important;
    }
    
    .cv-print-root, .resume-preview-sheet {
      width: 100%;
      min-width: 794px;
      background: #ffffff !important;
      color: #111827 !important;
      padding: 0;
      margin: 0 auto;
      font-family: ${fontFamilyValue} !important;
    }
    .cv-print-root, .resume-preview-sheet,
    .resume-preview-sheet h1, .resume-preview-sheet h2, .resume-preview-sheet h3,
    .resume-preview-sheet p, .resume-preview-sheet span, .resume-preview-sheet div,
    .resume-preview-sheet li, .resume-preview-sheet a, .resume-preview-sheet strong, .resume-preview-sheet em {
      font-family: ${fontFamilyValue} !important;
    }

    .cv-a4-document {
      width: 100% !important;
      min-width: 794px !important;
      background-color: #ffffff !important;
      box-shadow: none !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    @media print {
      body {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      section {
        break-inside: auto !important;
        page-break-inside: auto !important;
      }
      h2, h3 {
        break-after: avoid !important;
        page-break-after: avoid !important;
      }
      li, .role-row, .company-row {
        break-inside: avoid !important;
        page-break-inside: avoid !important;
      }
    }

    .resume-preview-sheet {
      width: 100% !important;
      min-width: 794px !important;
      background: #ffffff !important;
      color: #111827 !important;
      font-size: 9.5pt;
      line-height: 1.35;
      box-sizing: border-box;
    }
    .resume-preview-sheet.compact-1page {
      font-size: 9pt !important;
      line-height: 1.28 !important;
    }

    h1 {
      font-size: 22pt;
      text-align: center;
      margin: 0 0 0.15rem 0;
      letter-spacing: -0.02em;
      font-weight: 700;
      color: ${accentColor};
    }
    .compact-1page h1 {
      font-size: 20pt !important;
    }

    .subtitle {
      font-size: 11.5pt;
      font-style: italic;
      text-align: center;
      color: #374151;
      margin: 0 0 0.35rem 0;
      font-weight: 600;
    }

    .contact-row {
      display: flex;
      justify-content: center;
      align-items: center;
      flex-wrap: wrap;
      row-gap: 0.25rem !important;
      column-gap: 1rem !important;
      font-size: 9.5pt;
      color: #374151;
      margin: 0 0 0.75rem 0;
      padding-bottom: 0.2rem;
    }
    .contact-item {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
    }
    .contact-item a, .contact-item span {
      color: #374151;
      text-decoration: none;
      letter-spacing: normal !important;
      word-spacing: normal !important;
      white-space: nowrap !important;
    }
    .contact-item svg {
      color: ${accentColor} !important;
      vertical-align: middle;
    }

    h2 {
      font-size: 10.5pt;
      text-transform: uppercase !important;
      letter-spacing: 0.06em;
      font-weight: 700;
      break-after: avoid !important;
      page-break-after: avoid !important;
      display: block !important;
    }
    h2.classic-heading-double-line,
    h2:not(.classic-heading-single-line):not(.classic-heading-filled-pill):not(.modern-section-title):not(.split-section-title) {
      border-top: 1.5px solid ${accentColor} !important;
      border-bottom: 1.5px solid ${accentColor} !important;
      border-left: none !important;
      border-right: none !important;
      background: transparent !important;
      color: ${accentColor} !important;
      padding: 3px 0 !important;
      margin-top: 1rem !important;
      margin-bottom: 0.5rem !important;
      text-align: center;
      border-radius: 0 !important;
    }
    h2.classic-heading-single-line {
      border-top: none !important;
      border-left: none !important;
      border-right: none !important;
      border-bottom: 1.5px solid ${accentColor} !important;
      background: transparent !important;
      color: ${accentColor} !important;
      padding: 0 0 3px 0 !important;
      margin-top: 1rem !important;
      margin-bottom: 0.5rem !important;
      text-align: left !important;
      border-radius: 0 !important;
    }
    h2.classic-heading-filled-pill {
      border: none !important;
      background: ${accentColor} !important;
      color: #ffffff !important;
      padding: 4px 10px !important;
      margin-top: 1rem !important;
      margin-bottom: 0.5rem !important;
      text-align: left !important;
      border-radius: 6px !important;
    }
    .compact-1page h2.classic-heading-double-line {
      padding: 1.5px 0 !important;
      margin-top: 0.65rem !important;
      margin-bottom: 0.35rem !important;
      font-size: 9.8pt !important;
    }
    .compact-1page h2.classic-heading-single-line {
      padding: 0 0 2px 0 !important;
      margin-top: 0.65rem !important;
      margin-bottom: 0.35rem !important;
      font-size: 9.8pt !important;
    }
    .compact-1page h2.classic-heading-filled-pill {
      padding: 2.5px 8px !important;
      margin-top: 0.65rem !important;
      margin-bottom: 0.35rem !important;
      font-size: 9.8pt !important;
    }
    h2:first-of-type {
      margin-top: 0.3rem !important;
    }

    .role-row, .company-row, .school-row {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      width: 100%;
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }
    .role-row {
      margin-top: 0.6rem;
      margin-bottom: 0.15rem;
    }
    .compact-1page .role-row {
      margin-top: 0.4rem !important;
      margin-bottom: 0.1rem !important;
    }
    .role-title {
      font-weight: 700;
      font-size: 10.5pt;
      color: #111827;
    }
    .role-dates {
      font-size: 9.5pt;
      color: #111827;
      text-align: right;
    }

    .company-row {
      margin-bottom: 0.45rem;
    }
    .compact-1page .company-row {
      margin-bottom: 0.3rem !important;
    }
    .company-name {
      font-style: italic;
      font-size: 10pt;
      color: #374151;
    }
    .company-location {
      font-size: 9.5pt;
      color: #374151;
      text-align: right;
    }

    p, li {
      text-align: justify;
      font-size: 9.5pt;
      color: #1f2937;
      line-height: 1.35;
      margin: 0 0 0.35rem 0;
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }
    .compact-1page p {
      margin-bottom: 0.25rem !important;
    }
    ul {
      margin: 0 0 0.5rem 0;
      padding-left: 1.25rem;
    }
    .compact-1page ul {
      margin-bottom: 0.35rem !important;
      padding-left: 1.1rem !important;
    }
    li {
      margin-bottom: 0.2rem;
    }
    .compact-1page li {
      margin-bottom: 0.12rem !important;
    }

    .skills-list {
      display: grid !important;
      grid-template-columns: 1fr 1fr !important;
      column-gap: 2rem !important;
      row-gap: 0.5rem !important;
      list-style-type: none !important;
      padding-left: 0 !important;
      margin-bottom: 0.75rem !important;
    }
    .compact-1page .skills-list {
      row-gap: 0.3rem !important;
      column-gap: 1.5rem !important;
      margin-bottom: 0.4rem !important;
    }
    .skills-list li {
      margin-bottom: 0;
      text-align: justify;
      font-size: 9.5pt;
      line-height: 1.35;
    }
    .skills-list strong.skill-category {
      color: ${accentColor};
    }

    /* Candidate Photo Avatar Header */
    .cv-header-photo-wrapper {
      display: flex;
      align-items: center;
      gap: 1.6rem;
      margin-bottom: 0.6rem;
    }
    .cv-avatar-headshot {
      width: 125px;
      height: 125px;
      aspect-ratio: 1 / 1;
      border-radius: 50%;
      object-fit: cover;
      border: 3px solid ${accentColor};
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      flex-shrink: 0;
    }
    .compact-1page .cv-header-photo-wrapper {
      margin-bottom: 0.35rem !important;
      gap: 1.25rem !important;
    }
    .compact-1page .cv-avatar-headshot {
      width: 104px !important;
      height: 104px !important;
      aspect-ratio: 1 / 1 !important;
    }
    .compact-1page .modern-avatar-headshot {
      width: 100px !important;
      height: 100px !important;
      aspect-ratio: 1 / 1 !important;
    }
    /* Candidate Photo Shape Variants */
    .cv-avatar-headshot[data-shape="circle"], .modern-avatar-headshot[data-shape="circle"], .sidebar-avatar-img[data-shape="circle"] { border-radius: 50% !important; }
    .cv-avatar-headshot[data-shape="rounded"], .modern-avatar-headshot[data-shape="rounded"], .sidebar-avatar-img[data-shape="rounded"] { border-radius: 12px !important; }
    .cv-avatar-headshot[data-shape="square"], .modern-avatar-headshot[data-shape="square"], .sidebar-avatar-img[data-shape="square"] { border-radius: 4px !important; }
    .cv-avatar-headshot[data-shape="squircle"], .modern-avatar-headshot[data-shape="squircle"], .sidebar-avatar-img[data-shape="squircle"] { border-radius: 22% !important; }

    /* Candidate Photo Border Variants */
    .cv-avatar-headshot[data-border="accent"], .modern-avatar-headshot[data-border="accent"], .sidebar-avatar-img[data-border="accent"] { border: 3px solid ${accentColor}; }
    .cv-avatar-headshot[data-border="subtle"], .modern-avatar-headshot[data-border="subtle"], .sidebar-avatar-img[data-border="subtle"] { border: 2px solid #cbd5e1; }
    .cv-avatar-headshot[data-border="none"], .modern-avatar-headshot[data-border="none"], .sidebar-avatar-img[data-border="none"],
    .cv-avatar-headshot[data-border-width="0"], .modern-avatar-headshot[data-border-width="0"], .sidebar-avatar-img[data-border-width="0"] { border: none !important; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08) !important; }

    .cv-header-photo-info {
      flex-grow: 1;
    }
    .cv-header-photo-info h1 {
      text-align: left;
    }
    .cv-header-photo-info .subtitle {
      text-align: left;
    }
    .cv-header-photo-info .contact-row {
      justify-content: flex-start;
      margin-bottom: 0;
    }

    /* ==========================================================================
       Modern Timeline Layout Styles (Vineet / Executive Style)
       ========================================================================== */
    .modern-timeline-wrapper {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #111827;
      line-height: 1.35;
    }

    /* Modern Header */
    .modern-header {
      display: flex !important;
      align-items: flex-start !important;
      gap: 1.5rem !important;
      margin-bottom: 1rem !important;
      padding-bottom: 0.25rem !important;
    }
    .modern-avatar-col {
      flex-shrink: 0 !important;
    }
    .modern-avatar-headshot {
      width: 120px !important;
      height: 120px !important;
      aspect-ratio: 1 / 1 !important;
      border-radius: 50% !important;
      object-fit: cover !important;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08) !important;
      flex-shrink: 0 !important;
    }
    .modern-header-col {
      flex: 1 !important;
      display: flex !important;
      flex-direction: column !important;
    }
    .modern-header-col h1 {
      font-size: 22pt !important;
      font-weight: 700 !important;
      text-align: left !important;
      color: #111827 !important;
      margin: 0 0 0.15rem 0 !important;
      letter-spacing: -0.02em !important;
    }
    .modern-subtitle {
      font-size: 11.5pt !important;
      font-weight: 500 !important;
      color: #374151 !important;
      text-align: left !important;
      margin: 0 0 0.5rem 0 !important;
    }
    .modern-contact-grid {
      display: flex !important;
      flex-wrap: wrap !important;
      gap: 0.4rem 1.25rem !important;
      font-size: 9pt !important;
      color: #374151 !important;
    }
    .modern-contact-item {
      display: inline-flex !important;
      align-items: center !important;
      gap: 0.35rem !important;
    }
    .modern-contact-item a {
      color: #374151 !important;
      text-decoration: none !important;
    }
    .modern-contact-item svg {
      color: #4b5563 !important;
      vertical-align: middle !important;
    }

    /* Modern Section Heading */
    .modern-section-title {
      font-size: 12pt !important;
      font-weight: 700 !important;
      text-align: left !important;
      text-transform: none !important;
      border: none !important;
      border-top: none !important;
      border-bottom: none !important;
      color: ${accentColor} !important;
      margin-top: 1.15rem !important;
      margin-bottom: 0.5rem !important;
      letter-spacing: -0.01em !important;
      display: block !important;
      break-after: avoid !important;
      page-break-after: avoid !important;
    }

    /* Timeline Two-Column (Left Rail) */
    .modern-timeline-entry {
      display: flex !important;
      margin-bottom: 0.75rem !important;
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }
    .modern-timeline-left {
      width: 145px !important;
      min-width: 145px !important;
      flex-shrink: 0 !important;
      padding-right: 1rem !important;
    }
    .timeline-date {
      font-size: 9pt !important;
      font-weight: 500 !important;
      color: #111827 !important;
      line-height: 1.3 !important;
    }
    .timeline-location {
      font-size: 8.5pt !important;
      color: #4b5563 !important;
      line-height: 1.3 !important;
      margin-top: 2px !important;
    }
    .modern-timeline-right {
      flex: 1 !important;
      min-width: 0 !important;
    }
    .timeline-company-row {
      display: flex !important;
      align-items: center !important;
      gap: 0.35rem !important;
    }
    .timeline-company {
      font-size: 9.8pt !important;
      font-weight: 600 !important;
      color: #111827 !important;
    }
    .timeline-role {
      font-size: 9.2pt !important;
      font-weight: 600 !important;
      color: #374151 !important;
      margin-bottom: 0.2rem !important;
    }
    .timeline-degree {
      font-size: 9.5pt !important;
      font-weight: 600 !important;
      color: #111827 !important;
    }
    .timeline-school {
      font-size: 9pt !important;
      font-weight: 600 !important;
      color: #111827 !important;
    }
    .zigzag-divider {
      width: 100% !important;
      height: 5px !important;
      margin-top: 3px !important;
      margin-bottom: 8px !important;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='5' viewBox='0 0 10 5'%3E%3Cpath d='M0 3.5 L 2.5 1 L 5 3.5 L 7.5 1 L 10 3.5' fill='none' stroke='%23cbd5e1' stroke-width='1.2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") !important;
      background-repeat: repeat-x !important;
      background-size: 10px 5px !important;
      break-after: avoid !important;
      page-break-after: avoid !important;
    }
    .timeline-award-title {
      font-size: 9.5pt !important;
      font-weight: 600 !important;
      color: #111827 !important;
    }
    .timeline-award-org {
      font-size: 9pt !important;
      color: #374151 !important;
    }
    .timeline-bullets {
      margin: 0.15rem 0 0 0 !important;
      padding-left: 1.1rem !important;
    }
    .timeline-bullets li {
      font-size: 9pt !important;
      line-height: 1.35 !important;
      margin-bottom: 0.2rem !important;
      text-align: justify !important;
    }

    /* Boxed Skill Cards */
    .modern-skills-container {
      display: flex !important;
      flex-direction: column !important;
      gap: 0.4rem !important;
      margin-bottom: 0.75rem !important;
    }
    .modern-skill-card {
      border: 1px solid #111827 !important;
      border-radius: 6px !important;
      padding: 6px 12px !important;
      font-size: 8.8pt !important;
      line-height: 1.35 !important;
      text-align: justify !important;
      background: #ffffff !important;
      color: #1f2937 !important;
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }
    .modern-skill-card strong.skill-category {
      color: #111827 !important;
      font-weight: 700 !important;
    }

    /* ==========================================================================
       Dark Sidebar Layout Print Styles (Matching Pixel-Perfect Reference)
       ========================================================================== */
    .split-sidebar-wrapper {
      display: grid !important;
      grid-template-columns: 265px 1fr !important;
      width: 794px !important;
      min-height: 1122px !important;
      margin: 0 auto !important;
      padding: 0 !important;
      background: #ffffff !important;
      font-family: ${fontFamilyValue} !important;
      color: #111827 !important;
      line-height: 1.35 !important;
      box-sizing: border-box !important;
    }

    /* Left Dark Sidebar Column */
    .split-sidebar-col {
      background: ${themeConfig?.accentColor || '#1c2d42'} !important;
      color: #ffffff !important;
      padding: ${isCompact ? '8mm 6mm' : '12mm 8mm'} !important;
      display: flex !important;
      flex-direction: column !important;
      box-sizing: border-box !important;
      min-height: 100% !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    .sidebar-header {
      margin-bottom: 1.15rem !important;
      break-inside: avoid !important;
    }

    .split-name {
      font-size: 21pt !important;
      font-weight: 800 !important;
      letter-spacing: -0.01em !important;
      color: #ffffff !important;
      margin: 0 0 0.35rem 0 !important;
      line-height: 1.15 !important;
      text-align: left !important;
    }

    .split-subtitle {
      font-size: 11pt !important;
      font-weight: 400 !important;
      color: rgba(255, 255, 255, 0.92) !important;
      line-height: 1.3 !important;
      margin-bottom: 0.5rem !important;
      text-align: left !important;
    }

    .sidebar-avatar-wrapper {
      display: flex !important;
      justify-content: center !important;
      margin-bottom: 1.25rem !important;
      break-inside: avoid !important;
    }

    .sidebar-avatar-img {
      width: 105px !important;
      height: 105px !important;
      border-radius: 50% !important;
      object-fit: cover !important;
      border: 3px solid rgba(255, 255, 255, 0.45) !important;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25) !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    .sidebar-contact-list {
      display: flex !important;
      flex-direction: column !important;
      gap: 0.55rem !important;
      margin-bottom: 1.45rem !important;
      break-inside: avoid !important;
    }

    .sidebar-contact-list .split-contact-item {
      display: flex !important;
      align-items: flex-start !important;
      gap: 0.5rem !important;
      font-size: 8.8pt !important;
      color: rgba(255, 255, 255, 0.95) !important;
      line-height: 1.35 !important;
      word-break: break-word !important;
    }

    .sidebar-contact-list .split-contact-item a {
      color: #ffffff !important;
      text-decoration: none !important;
    }

    .sidebar-contact-list .split-contact-item svg {
      width: 12px !important;
      height: 12px !important;
      stroke: #ffffff !important;
      margin-top: 2px !important;
      flex-shrink: 0 !important;
    }

    /* Sidebar Section */
    .sidebar-section {
      margin-bottom: 1.35rem !important;
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }

    .sidebar-section-pill {
      background: rgba(255, 255, 255, 0.12) !important;
      border: 1px solid rgba(255, 255, 255, 0.12) !important;
      border-radius: 6px !important;
      padding: 5px 12px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 0.45rem !important;
      margin-bottom: 0.75rem !important;
      break-after: avoid !important;
      page-break-after: avoid !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    .sidebar-section-title {
      font-size: 9.5pt !important;
      font-weight: 700 !important;
      letter-spacing: 0.12em !important;
      text-transform: uppercase !important;
      color: #ffffff !important;
      margin: 0 !important;
      border: none !important;
      padding: 0 !important;
    }

    .sidebar-profile-text {
      font-size: 8.8pt !important;
      line-height: 1.45 !important;
      color: rgba(255, 255, 255, 0.9) !important;
      margin: 0 0 0.65rem 0 !important;
      text-align: left !important;
    }

    .sidebar-profile-text strong {
      color: #ffffff !important;
      font-weight: 700 !important;
    }

    /* Languages */
    .sidebar-language-item {
      display: flex !important;
      justify-content: space-between !important;
      align-items: center !important;
      margin-bottom: 0.5rem !important;
      font-size: 8.8pt !important;
      color: #ffffff !important;
      font-weight: 500 !important;
      break-inside: avoid !important;
    }

    .sidebar-language-dots {
      display: flex !important;
      align-items: center !important;
      gap: 5px !important;
    }

    .sidebar-dot {
      width: 7px !important;
      height: 7px !important;
      border-radius: 50% !important;
      display: inline-block !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    .sidebar-dot.filled {
      background: #f8fafc !important;
    }

    .sidebar-dot.empty {
      background: rgba(255, 255, 255, 0.25) !important;
    }

    /* Awards */
    .sidebar-award-item {
      margin-bottom: 0.65rem !important;
      break-inside: avoid !important;
    }

    .sidebar-award-title {
      font-size: 9pt !important;
      font-weight: 700 !important;
      color: #ffffff !important;
      line-height: 1.3 !important;
    }

    .sidebar-award-org {
      font-size: 8.2pt !important;
      color: rgba(255, 255, 255, 0.78) !important;
      margin-top: 0.15rem !important;
    }

    .sidebar-bullet-item {
      font-size: 8.5pt !important;
      color: #e2e8f0 !important;
      margin-bottom: 0.35rem !important;
      line-height: 1.35 !important;
    }

    /* Right Main Column */
    .split-main-col {
      padding: ${isCompact ? '8mm 8mm 8mm 8mm' : '12mm 12mm 12mm 10mm'} !important;
      background: #ffffff !important;
      display: flex !important;
      flex-direction: column !important;
      box-sizing: border-box !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    .split-section {
      margin-bottom: 1.25rem !important;
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }

    .main-section-pill {
      background: #f1f5f9 !important;
      border-radius: 6px !important;
      padding: 5px 14px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 0.5rem !important;
      margin-top: 0.45rem !important;
      margin-bottom: 0.85rem !important;
      break-after: avoid !important;
      page-break-after: avoid !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    .split-section-title {
      font-size: 10.5pt !important;
      font-weight: 800 !important;
      letter-spacing: 0.08em !important;
      text-transform: uppercase !important;
      color: #1e293b !important;
      margin: 0 !important;
      border: none !important;
      padding: 0 !important;
    }

    /* Work Experience Entries */
    .split-role-entry {
      margin-bottom: 0.95rem !important;
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }

    .split-company-name {
      font-size: 10.5pt !important;
      font-weight: 800 !important;
      color: #111827 !important;
      margin-bottom: 1px !important;
    }

    .split-role-title {
      font-size: 9.5pt !important;
      font-weight: 500 !important;
      color: #374151 !important;
      margin-bottom: 1px !important;
    }

    .split-role-dates {
      font-size: 8.8pt !important;
      font-weight: 500 !important;
      color: #64748b !important;
      margin-bottom: 0.35rem !important;
    }

    .split-bullets {
      margin: 0 0 0.5rem 0 !important;
      padding-left: 1.15rem !important;
      list-style-type: disc !important;
    }

    .split-bullets li {
      font-size: 8.8pt !important;
      line-height: 1.42 !important;
      color: #334155 !important;
      margin-bottom: 0.25rem !important;
      text-align: left !important;
    }

    .split-bullets li strong {
      color: #0f172a !important;
      font-weight: 700 !important;
    }

    /* Education Entries */
    .split-edu-entry {
      margin-bottom: 0.85rem !important;
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }

    .split-degree-name {
      font-size: 10pt !important;
      font-weight: 800 !important;
      color: #111827 !important;
      margin-bottom: 1px !important;
    }

    .split-school-name {
      font-size: 9.5pt !important;
      font-weight: 500 !important;
      color: #374151 !important;
      margin-bottom: 1px !important;
    }

    .split-edu-dates {
      font-size: 8.8pt !important;
      font-weight: 500 !important;
      color: #64748b !important;
      margin-bottom: 0.25rem !important;
    }

    /* Skills List */
    .split-skills-list {
      margin: 0 0 0.5rem 0 !important;
      padding-left: 1.15rem !important;
      list-style-type: disc !important;
    }

    .split-skills-list li {
      font-size: 8.8pt !important;
      line-height: 1.42 !important;
      color: #334155 !important;
      margin-bottom: 0.25rem !important;
    }
  </style>
</head>
<body>
  <div class="cv-print-root">
    ${parsedHtml.includes('resume-preview-sheet') 
      ? parsedHtml 
      : `<div class="resume-preview-sheet ${isCompact ? 'compact-1page' : ''} ${themeConfig?.template === 'split-sidebar-right' ? 'has-split-sidebar-right' : ''}">${parsedHtml}</div>`}
  </div>
</body>
</html>`;

  doc.open();
  doc.write(iframeContent);
  doc.close();

  // Wait for all resources (images/fonts) inside the iframe to load before invoking print
  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (e) {
      console.warn('Iframe print error, falling back to window.print():', e);
      window.print();
    } finally {
      document.title = originalTitle;
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 1000);
    }
  }, 250);
}
