import { parseMarkdownToHtml } from './mdParser';
import type { CVThemeConfig } from '../components/CVThemeSelector';

export function printCvDocument(
  markdown: string, 
  themeConfig: CVThemeConfig = { accentColor: '#475569', themeName: 'Slate Charcoal', showPhoto: false },
  filenameTitle: string = 'Resume',
  customHtml?: string
) {
  if (!markdown && !customHtml) return;

  const originalTitle = document.title;
  document.title = filenameTitle;

  const parsedHtml = customHtml || parseMarkdownToHtml(markdown, themeConfig);
  const accentColor = themeConfig?.accentColor || (themeConfig?.template === 'classic-ats' ? '#475569' : '#2563eb');
  const isCompact = themeConfig?.layoutDensity === 'compact';

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

  const iframeContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=794, initial-scale=1.0" />
  <title>${filenameTitle}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: ${themeConfig?.template === 'split-sidebar-right' ? '0' : '10mm 10mm 10mm 10mm'};
    }
    *, *:before, *:after {
      box-sizing: border-box !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      background: #ffffff !important;
      background-color: #ffffff !important;
      color: #111827 !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      width: 100% !important;
      min-width: 794px !important;
      height: auto !important;
    }
    
    .cv-print-root {
      width: 100%;
      min-width: 794px;
      background: #ffffff !important;
      color: #111827 !important;
      padding: 0;
      margin: 0 auto;
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
      gap: 1.25rem;
      font-size: 9.5pt;
      color: #374151;
      margin: 0 0 0.85rem 0;
      padding-bottom: 0.2rem;
    }
    .contact-item {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
    }
    .contact-item a {
      color: #374151;
      text-decoration: none;
    }
    .contact-item svg {
      color: ${accentColor} !important;
      vertical-align: middle;
    }

    h2 {
      font-size: 10.5pt;
      border-top: 1.5px solid ${accentColor} !important;
      border-bottom: 1.5px solid ${accentColor} !important;
      color: ${accentColor} !important;
      padding: 3px 0 !important;
      margin-top: 1rem !important;
      margin-bottom: 0.5rem !important;
      text-transform: uppercase !important;
      letter-spacing: 0.06em;
      text-align: center;
      font-weight: 700;
      break-after: avoid !important;
      page-break-after: avoid !important;
      display: block !important;
    }
    .compact-1page h2 {
      padding: 1.5px 0 !important;
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
      gap: 1.5rem;
      margin-bottom: 0.5rem;
    }
    .cv-avatar-headshot {
      width: 90px;
      height: 90px;
      border-radius: 50%;
      object-fit: cover;
      border: 3px solid ${accentColor};
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      flex-shrink: 0;
    }
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
      width: 100px !important;
      height: 115px !important;
      border-radius: 12px !important;
      object-fit: cover !important;
      border: 1px solid #e5e7eb !important;
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.08) !important;
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
      color: #111827 !important;
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
      color: ${accentColor} !important;
    }
    .timeline-link-icon {
      display: inline-block !important;
      font-size: 8pt !important;
      color: ${accentColor} !important;
      margin-left: 4px !important;
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
      color: ${accentColor} !important;
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
       Split-Sidebar-Right Layout Print Styles
       ========================================================================== */
    .split-sidebar-wrapper {
      display: grid !important;
      grid-template-columns: 1fr 240px !important;
      min-height: 100% !important;
      background: #ffffff !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
      color: #111827 !important;
      line-height: 1.35 !important;
      box-sizing: border-box !important;
    }

    .split-main-col {
      padding: ${themeConfig?.template === 'split-sidebar-right' ? '12mm 10mm 12mm 14mm' : '1.75rem 1.5rem 1.75rem 1.75rem'} !important;
      background: #ffffff !important;
      display: flex !important;
      flex-direction: column !important;
    }

    .split-header {
      margin-bottom: 1.15rem !important;
    }

    .split-name {
      font-size: 19pt !important;
      font-weight: 800 !important;
      letter-spacing: 0.20em !important;
      text-transform: uppercase !important;
      color: #1c202d !important;
      margin: 0 0 0.25rem 0 !important;
      line-height: 1.15 !important;
      text-align: left !important;
    }

    .split-subtitle {
      font-size: 9.8pt !important;
      font-weight: 600 !important;
      letter-spacing: 0.15em !important;
      text-transform: uppercase !important;
      color: #64748b !important;
      margin-bottom: 0.55rem !important;
      text-align: left !important;
    }

    .split-contact-row {
      display: flex !important;
      flex-wrap: wrap !important;
      align-items: center !important;
      gap: 0.45rem 0.85rem !important;
      font-size: 8.5pt !important;
      color: #475569 !important;
      justify-content: flex-start !important;
    }

    .split-contact-item {
      display: inline-flex !important;
      align-items: center !important;
      gap: 0.25rem !important;
    }

    .split-contact-item a {
      color: #475569 !important;
      text-decoration: none !important;
    }

    .split-contact-sep {
      color: #cbd5e1 !important;
      font-size: 8pt !important;
    }

    .split-section {
      margin-bottom: 1.15rem !important;
    }

    .split-section-header {
      display: flex !important;
      align-items: center !important;
      gap: 0.75rem !important;
      margin-top: 0.5rem !important;
      margin-bottom: 0.65rem !important;
      break-after: avoid !important;
      page-break-after: avoid !important;
    }

    .split-section-title {
      font-size: 11pt !important;
      font-weight: 800 !important;
      letter-spacing: 0.18em !important;
      text-transform: uppercase !important;
      color: #1c202d !important;
      margin: 0 !important;
      white-space: nowrap !important;
      border: none !important;
      padding: 0 !important;
      text-align: left !important;
    }

    .split-section-rule {
      flex: 1 !important;
      height: 1px !important;
      background: #cbd5e1 !important;
    }

    .split-paragraph {
      font-size: 9pt !important;
      line-height: 1.42 !important;
      color: #334155 !important;
      margin: 0 0 0.5rem 0 !important;
      text-align: justify !important;
    }

    .split-paragraph strong {
      color: #0f172a !important;
      font-weight: 700 !important;
    }

    .split-role-entry {
      margin-bottom: 0.85rem !important;
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }

    .split-role-header {
      display: flex !important;
      justify-content: space-between !important;
      align-items: baseline !important;
      margin-bottom: 0.15rem !important;
    }

    .split-role-title {
      font-size: 9.8pt !important;
      font-weight: 700 !important;
      color: #0f172a !important;
    }

    .split-role-dates {
      font-size: 8.8pt !important;
      font-weight: 600 !important;
      color: #64748b !important;
      white-space: nowrap !important;
    }

    .split-role-company {
      font-size: 9pt !important;
      font-weight: 500 !important;
      color: #475569 !important;
      margin-bottom: 0.35rem !important;
      display: flex !important;
      align-items: center !important;
      flex-wrap: wrap !important;
      gap: 0.25rem !important;
    }

    .split-company-name {
      font-weight: 600 !important;
      color: #334155 !important;
    }

    .split-company-loc {
      color: #64748b !important;
    }

    .split-bullets {
      margin: 0 0 0.5rem 0 !important;
      padding-left: 1.15rem !important;
    }

    .split-bullets li {
      font-size: 8.8pt !important;
      line-height: 1.4 !important;
      color: #334155 !important;
      margin-bottom: 0.25rem !important;
      text-align: justify !important;
    }

    .split-bullets li strong {
      color: #0f172a !important;
      font-weight: 700 !important;
    }

    .split-sidebar-col {
      background: #1c202d !important;
      color: #ffffff !important;
      padding: ${themeConfig?.template === 'split-sidebar-right' ? '12mm 8mm' : '1.75rem 1.15rem'} !important;
      display: flex !important;
      flex-direction: column !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    .sidebar-avatar-wrapper {
      display: flex !important;
      justify-content: center !important;
      margin-bottom: 1rem !important;
    }

    .sidebar-avatar-img {
      width: 96px !important;
      height: 96px !important;
      border-radius: 50% !important;
      object-fit: cover !important;
      border: 3px solid rgba(255, 255, 255, 0.4) !important;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25) !important;
    }

    .sidebar-linkedin-wrapper {
      display: flex !important;
      justify-content: center !important;
      margin-bottom: 1.25rem !important;
    }

    .sidebar-linkedin-btn {
      display: inline-flex !important;
      align-items: center !important;
      background: rgba(255, 255, 255, 0.12) !important;
      border: 1px solid rgba(255, 255, 255, 0.25) !important;
      border-radius: 6px !important;
      padding: 0.3rem 0.65rem !important;
      font-size: 8pt !important;
      font-weight: 600 !important;
      color: #ffffff !important;
      text-decoration: none !important;
      -webkit-print-color-adjust: exact !important;
    }

    .sidebar-section {
      margin-bottom: 1.25rem !important;
      break-inside: avoid !important;
      page-break-inside: avoid !important;
    }

    .sidebar-section-header {
      margin-bottom: 0.65rem !important;
    }

    .sidebar-section-title {
      font-size: 9.5pt !important;
      font-weight: 800 !important;
      letter-spacing: 0.18em !important;
      text-transform: uppercase !important;
      color: #ffffff !important;
      margin-bottom: 0.35rem !important;
      text-align: left !important;
      border: none !important;
      padding: 0 !important;
    }

    .sidebar-section-rule {
      height: 1px !important;
      background: rgba(255, 255, 255, 0.2) !important;
    }

    .sidebar-entry {
      margin-bottom: 0.75rem !important;
    }

    .sidebar-entry-dates {
      font-size: 8pt !important;
      font-weight: 600 !important;
      color: #94a3b8 !important;
      margin-bottom: 0.15rem !important;
    }

    .sidebar-entry-title {
      font-size: 9pt !important;
      font-weight: 700 !important;
      color: #ffffff !important;
      line-height: 1.3 !important;
    }

    .sidebar-entry-subtitle {
      font-size: 8.2pt !important;
      color: #cbd5e1 !important;
      margin-top: 0.1rem !important;
    }

    .sidebar-bullet-item {
      font-size: 8.5pt !important;
      color: #e2e8f0 !important;
      margin-bottom: 0.35rem !important;
      line-height: 1.35 !important;
    }

    .sidebar-category-group {
      margin-bottom: 0.75rem !important;
      break-inside: avoid !important;
    }

    .sidebar-category-name {
      font-size: 8pt !important;
      font-weight: 700 !important;
      text-transform: uppercase !important;
      letter-spacing: 0.08em !important;
      color: #94a3b8 !important;
      margin-bottom: 0.35rem !important;
    }

    .sidebar-pill-cluster {
      display: flex !important;
      flex-wrap: wrap !important;
      gap: 0.3rem 0.4rem !important;
      margin-bottom: 0.35rem !important;
    }

    .sidebar-pill-badge {
      display: inline-flex !important;
      align-items: center !important;
      font-size: 8pt !important;
      font-weight: 500 !important;
      color: #ffffff !important;
      background: rgba(255, 255, 255, 0.10) !important;
      border: 1px solid rgba(255, 255, 255, 0.35) !important;
      border-radius: 9999px !important;
      padding: 0.18rem 0.55rem !important;
      letter-spacing: 0.02em !important;
      -webkit-print-color-adjust: exact !important;
    }
  </style>
</head>
<body>
  <div class="cv-print-root">
    <div class="resume-preview-sheet ${isCompact ? 'compact-1page' : ''}">
      ${parsedHtml}
    </div>
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
