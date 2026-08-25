import { parseMarkdownToHtml } from './mdParser';
import type { CVThemeConfig } from '../components/CVThemeSelector';

export function printCvDocument(
  markdown: string, 
  themeConfig?: CVThemeConfig, 
  filenameTitle: string = 'CV_Optimized'
): void {
  if (!markdown) return;

  const originalTitle = document.title;
  document.title = filenameTitle;

  const parsedHtml = parseMarkdownToHtml(markdown, themeConfig);
  const accentColor = themeConfig?.accentColor || '#475569';
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
      margin: 10mm 10mm 10mm 10mm;
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
