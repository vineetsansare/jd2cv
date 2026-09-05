// Client-side PDF Parser & Layout Detector using PDF.js

export interface PdfParseResult {
  text: string;
  photoUrl?: string;
  detectedTemplate: 'modern-timeline' | 'classic-ats' | 'split-sidebar-right';
  hasLeftRailDates: boolean;
  hasBoxedSkills: boolean;
  hasDarkRightSidebar?: boolean;
  sidebarColor?: string;
  headingCasing: 'title-case' | 'uppercase';
}

export async function parsePdf(fileBuffer: ArrayBuffer): Promise<PdfParseResult> {
  try {
    const pdfjsLib = await import('pdfjs-dist');
    
    // Set up the worker URL using a CDN for convenience in client-only apps
    if (typeof window !== 'undefined') {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
    }
    
    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(fileBuffer) });
    const pdf = await loadingTask.promise;
    let fullText = '';
    
    let leftRailDateCount = 0;
    let rightRailDateCount = 0;
    let hasTitleCaseHeadings = false;
    let hasBoxedSkills = false;
    let hasDarkRightSidebar = false;
    let detectedSidebarColor: string | undefined;
    let photoUrl: string | undefined;

    const datePattern = /(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|\d{4})\s*[-–—]\s*(?:Present|\d{4}|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i;
    const headingPattern = /^(?:Executive Profile|Profile Summary|Professional Experience|Work Experience|Technical Skills|Education|Awards|Core Impact)/i;
    const sidebarSectionKeywords = /^(?:EDUCATION|AWARDS|LANGUAGES|ARCHITECTURE|FRAMEWORKS|VERSIONING|CICD|CI\/CD|MINDMAPPING|EXPERTISE|EXPLORING|HOBBIES)$/i;
    let sidebarHeadingCount = 0;

    // Helper to collapse wide-letter-spaced words like "P R O F I L E" -> "PROFILE"
    const collapseSpacedLetters = (text: string): string => {
      return text.replace(/\b([A-Za-z]\s)+[A-Za-z]\b/g, (match) => match.replace(/\s+/g, ''));
    };

    interface PageItem {
      str: string;
      x: number;
      y: number;
    }
    const pageItemsList: { pageNum: number; items: PageItem[] }[] = [];

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      const pageItems: PageItem[] = [];

      for (const item of textContent.items as any[]) {
        const str = (item.str || '').trim();
        if (!str) continue;
        const x = item.transform ? item.transform[4] : 0;
        const y = item.transform ? item.transform[5] : 0;
        pageItems.push({ str, x, y });

        // Analyze coordinate layout
        if (datePattern.test(str)) {
          if (x < 135) {
            leftRailDateCount++;
          } else if (x > 320) {
            rightRailDateCount++;
          }
        }

        // Check for sidebar section headings on right-hand side (x > 380 in 595pt standard page)
        const strippedUpper = str.replace(/\s+/g, '').toUpperCase();
        if (x > 380 && sidebarSectionKeywords.test(strippedUpper)) {
          sidebarHeadingCount++;
        }

        if (headingPattern.test(str)) {
          if (/[a-z]/.test(str)) {
            hasTitleCaseHeadings = true;
          }
        }

        if (str.includes('—') && (str.toLowerCase().includes('management') || str.toLowerCase().includes('architecture') || str.toLowerCase().includes('stack') || str.toLowerCase().includes('tools'))) {
          hasBoxedSkills = true;
        }
      }

      pageItemsList.push({ pageNum, items: pageItems });

      // Attempt visual canvas inspection and photo extraction from Page 1
      if (pageNum === 1 && typeof document !== 'undefined') {
        try {
          const viewport = page.getViewport({ scale: 1.5 });
          const canvas = document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          const ctx = canvas.getContext('2d');

          if (ctx) {
            await page.render({ canvasContext: ctx, viewport }).promise;

            // 1. Detect Dark Right Sidebar by sampling background pixels in right ~25%
            try {
              const sampleX = Math.floor(viewport.width * 0.82);
              const sampleYStart = Math.floor(viewport.height * 0.35);
              const sampleHeight = Math.floor(viewport.height * 0.40);
              const sidebarImageData = ctx.getImageData(sampleX - 10, sampleYStart, 20, sampleHeight);
              
              let darkPixels = 0;
              let totalR = 0, totalG = 0, totalB = 0;
              const totalSamples = sidebarImageData.data.length / 4;

              for (let p = 0; p < sidebarImageData.data.length; p += 4) {
                const r = sidebarImageData.data[p];
                const g = sidebarImageData.data[p + 1];
                const b = sidebarImageData.data[p + 2];
                // Check if pixel is dark navy / charcoal
                if (r < 75 && g < 85 && b < 105) {
                  darkPixels++;
                  totalR += r;
                  totalG += g;
                  totalB += b;
                }
              }

              if (darkPixels > totalSamples * 0.50) {
                hasDarkRightSidebar = true;
                const avgR = Math.round(totalR / darkPixels);
                const avgG = Math.round(totalG / darkPixels);
                const avgB = Math.round(totalB / darkPixels);
                detectedSidebarColor = `rgb(${avgR}, ${avgG}, ${avgB})`;
              }
            } catch (colorSampleErr) {
              console.warn('Sidebar color sampling error:', colorSampleErr);
            }

            // 2. Locate and Crop Candidate Photo (Top Left OR Top Right)
            const ops = await page.getOperatorList();
            let foundBox: { x: number; y: number; w: number; h: number } | null = null;
            let lastTransform = [1, 0, 0, 1, 0, 0];

            for (let i = 0; i < ops.fnArray.length; i++) {
              const fn = ops.fnArray[i];
              const args = ops.argsArray[i];
              if (fn === pdfjsLib.OPS.transform) {
                lastTransform = args;
              } else if (fn === pdfjsLib.OPS.paintImageXObject || fn === pdfjsLib.OPS.paintInlineImageXObject) {
                const pdfW = viewport.width / 1.5;
                const pdfH = viewport.height / 1.5;
                const imgX = lastTransform[4];
                const imgY = lastTransform[5];
                const imgW = lastTransform[0];
                const imgH = lastTransform[3];

                // Check if image is in top header area (either Left OR Right, top 40%)
                const isTopHeader = imgY > pdfH * 0.55 && imgW > 35 && imgH > 35;
                const isTopLeft = imgX < pdfW * 0.45 && isTopHeader;
                const isTopRight = imgX > pdfW * 0.55 && isTopHeader;

                if (isTopLeft || isTopRight) {
                  const scale = 1.5;
                  const cX = Math.max(0, imgX * scale);
                  const cY = Math.max(0, (pdfH - imgY - imgH) * scale);
                  const cW = imgW * scale;
                  const cH = imgH * scale;
                  foundBox = { x: cX, y: cY, w: cW, h: cH };
                  break;
                }
              }
            }

            // Fallback: If no operator box matched but we have a photo area on top left or top right
            if (!foundBox) {
              const testRegions = [
                { x: viewport.width * 0.72, y: viewport.height * 0.02, w: viewport.width * 0.24, h: viewport.height * 0.18 },
                { x: viewport.width * 0.06, y: viewport.height * 0.04, w: viewport.width * 0.20, h: viewport.height * 0.16 }
              ];

              for (const reg of testRegions) {
                const imgData = ctx.getImageData(reg.x, reg.y, reg.w, reg.h);
                let variedPixels = 0;
                for (let p = 0; p < imgData.data.length; p += 4) {
                  const r = imgData.data[p];
                  const g = imgData.data[p + 1];
                  const b = imgData.data[p + 2];
                  if ((r < 240 || g < 240 || b < 240) && !(r < 30 && g < 30 && b < 30)) {
                    variedPixels++;
                  }
                }
                if (variedPixels > (imgData.data.length / 4) * 0.25) {
                  foundBox = reg;
                  break;
                }
              }
            }

            if (foundBox && foundBox.w > 30 && foundBox.h > 30) {
              const cropCanvas = document.createElement('canvas');
              cropCanvas.width = foundBox.w;
              cropCanvas.height = foundBox.h;
              const cropCtx = cropCanvas.getContext('2d');
              if (cropCtx) {
                cropCtx.drawImage(
                  canvas,
                  foundBox.x, foundBox.y, foundBox.w, foundBox.h,
                  0, 0, foundBox.w, foundBox.h
                );
                photoUrl = cropCanvas.toDataURL('image/jpeg', 0.9);
              }
            }
          }
        } catch (photoErr) {
          console.warn('Visual canvas analysis non-critical error:', photoErr);
        }
      }
    }

    // ── Template Archetype Decision ──────────────────────────────────────
    let detectedTemplate: 'modern-timeline' | 'classic-ats' | 'split-sidebar-right';

    if (hasDarkRightSidebar || sidebarHeadingCount >= 2) {
      detectedTemplate = 'split-sidebar-right';
    } else if (leftRailDateCount > 0 && leftRailDateCount >= rightRailDateCount) {
      detectedTemplate = 'modern-timeline';
    } else if (hasBoxedSkills) {
      detectedTemplate = 'modern-timeline';
    } else {
      detectedTemplate = 'classic-ats';
    }

    // ── Column-Aware Text Extraction ─────────────────────────────────────
    if (detectedTemplate === 'split-sidebar-right') {
      let mainText = '';
      let sidebarText = '';

      for (const p of pageItemsList) {
        const leftItems = p.items.filter(it => it.x < 370);
        const rightItems = p.items.filter(it => it.x >= 370);

        // Sort top to bottom (y descending)
        leftItems.sort((a, b) => Math.abs(b.y - a.y) > 3 ? b.y - a.y : a.x - b.x);
        rightItems.sort((a, b) => Math.abs(b.y - a.y) > 3 ? b.y - a.y : a.x - b.x);

        const pageMain = leftItems.map(it => collapseSpacedLetters(it.str)).join(' ');
        const pageSidebar = rightItems.map(it => collapseSpacedLetters(it.str)).join(' ');

        if (pageMain) mainText += pageMain + '\n\n';
        if (pageSidebar) sidebarText += pageSidebar + '\n\n';
      }

      fullText = mainText.trim() + '\n\n' + sidebarText.trim();
    } else {
      for (const p of pageItemsList) {
        // Standard sort by y descending, then x ascending
        const items = [...p.items].sort((a, b) => Math.abs(b.y - a.y) > 3 ? b.y - a.y : a.x - b.x);
        fullText += items.map(it => it.str).join(' ') + '\n\n';
      }
    }

    return {
      text: fullText.trim(),
      photoUrl,
      detectedTemplate,
      hasLeftRailDates: leftRailDateCount > 0 && leftRailDateCount >= rightRailDateCount,
      hasBoxedSkills,
      hasDarkRightSidebar,
      sidebarColor: detectedSidebarColor,
      headingCasing: hasTitleCaseHeadings ? 'title-case' : 'uppercase'
    };
  } catch (error) {
    console.error('Error parsing PDF:', error);
    throw new Error('Failed to parse PDF file. Make sure it is a valid PDF containing text.');
  }
}
