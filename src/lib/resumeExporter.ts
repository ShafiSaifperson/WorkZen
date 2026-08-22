/* eslint-disable no-useless-escape */

/**
 * Resume Exporter & Formatter Utility
 * Provides professional ATS-standard export formatting for PDF, DOCX (Word), TXT, and Markdown.
 */

function cleanFileName(originalName: string, extension: string): string {
  const base = originalName.replace(/\.[^/.]+$/, '').trim() || 'Resume';
  return `${base}_ATS_Optimized.${extension}`;
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export const SECTION_HEADERS = [
  'OBJECTIVE',
  'CAREER OBJECTIVE',
  'SUMMARY',
  'PROFESSIONAL SUMMARY',
  'EXECUTIVE SUMMARY',
  'ABOUT ME',
  'WORK EXPERIENCE',
  'PROFESSIONAL EXPERIENCE',
  'EXPERIENCE',
  'EMPLOYMENT HISTORY',
  'EDUCATION',
  'ACADEMIC BACKGROUND',
  'SKILLS & PROFICIENCIES',
  'TECHNICAL SKILLS',
  'SKILLS',
  'CORE COMPETENCIES',
  'PROJECTS',
  'PERSONAL PROJECTS',
  'KEY PROJECTS',
  'CERTIFICATIONS',
  'LICENSES & CERTIFICATIONS',
  'PUBLICATIONS',
  'AWARDS',
  'HONORS & AWARDS',
  'PERSONAL INTERESTS & HOBBIES',
  'INTERESTS & HOBBIES',
  'INTERESTS',
  'HOBBIES',
  'REFERENCES',
  'VOLUNTEER EXPERIENCE',
  'LANGUAGES',
];

export interface GhostAdditionOption {
  text: string;
  sectionTarget?: string;
}

export interface FormatResumeHtmlOptions {
  targetText?: string | null;
  appliedTexts?: string[];
  ghostAddition?: GhostAdditionOption | null;
}

/**
 * Checks if a given line is a recognized resume section header,
 * and optionally whether it matches a target section name.
 */
export function isMatchingSectionHeader(line: string, targetSection?: string): boolean {
  if (!line || typeof line !== 'string') return false;
  const cleanLine = line.trim();
  if (!cleanLine || cleanLine.length > 60 || cleanLine.includes('@')) {
    return false;
  }

  // Strip leading numbers/bullets like "1. SKILLS" or "• SKILLS"
  const stripped = cleanLine.replace(/^[0-9•\-\*▪◦\u2022.\s]+/, '').trim();
  const upperClean = stripped.replace(/[^A-Z\s&]/gi, '').trim().toUpperCase();
  const rawUpper = stripped.toUpperCase();

  const isHeader =
    SECTION_HEADERS.includes(upperClean) ||
    SECTION_HEADERS.includes(rawUpper) ||
    SECTION_HEADERS.some((sh) => upperClean === sh || upperClean.startsWith(sh + ' ') || rawUpper.startsWith(sh + ' ') || upperClean.endsWith(' ' + sh));

  if (!isHeader) return false;
  if (!targetSection) return true;

  const target = targetSection.toUpperCase().trim();
  const tClean = target.replace(/[^A-Z]/g, '');
  const hClean = upperClean.replace(/[^A-Z]/g, '');

  if (hClean && tClean && (hClean.includes(tClean) || tClean.includes(hClean))) {
    return true;
  }

  // Word-based match (e.g. target "SKILLS & PROFICIENCIES" matches header "TECHNICAL SKILLS" or "SKILLS")
  const hWords = upperClean.split(/[^A-Z]+/).filter((w) => w.length > 2);
  const tWords = target.split(/[^A-Z]+/).filter((w) => w.length > 2);

  if (hWords.length > 0 && tWords.length > 0) {
    if (hWords.some((hw) => tWords.some((tw) => hw === tw || hw.includes(tw) || tw.includes(hw)))) {
      return true;
    }
  }

  return false;
}

/**
 * Parses resume plain text into structured HTML elements (headers, contacts, sections, bullet lists)
 * with dynamic highlighting support for target/applied suggestions and in-place ghost additions.
 */
export function formatResumeToHtml(text: string, options?: FormatResumeHtmlOptions): string {
  const lines = text.split('\n').map((l) => l.trim());
  const htmlParts: string[] = [];
  let inBulletList = false;
  let isFirstLine = true;

  const escapeHtml = (str: string) =>
    str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

  const cleanTarget = options?.targetText?.trim().replace(/^[•\-\*▪◦\u2022]\s*/, '').trim();
  const cleanAppliedList = (options?.appliedTexts || [])
    .map((t) => t.trim().replace(/^[•\-\*▪◦\u2022]\s*/, '').trim())
    .filter(Boolean);

  const ghostAddition = options?.ghostAddition;
  let ghostInserted = false;

  function renderGhostAdditionHtml(): string {
    if (!ghostAddition || !ghostAddition.text) return '';
    const cleanText = ghostAddition.text.trim();
    const ghostBullets = cleanText
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .map((l) => l.replace(/^[•\-\*▪◦\u2022\u25CF\u25E6\u25AA\u2013\u2014\uF0B7]\s*/, ''));

    return `
<div id="resume-ghost-preview" class="not-prose resume-ghost-preview my-3.5 rounded-xl p-3.5 transition-all animate-pulse" style="border: 2px dashed #34d399 !important; background-color: rgba(6, 78, 59, 0.6) !important; color: #a7f3d0 !important; box-shadow: 0 0 25px rgba(16, 185, 129, 0.35) !important;">
  <div class="flex items-center justify-between gap-2 border-b pb-1.5 mb-2 text-[10px] font-bold uppercase tracking-wider" style="border-bottom: 1px solid rgba(16, 185, 129, 0.4) !important; color: #6ee7b7 !important;">
    <span class="flex items-center gap-1.5 font-bold" style="color: #6ee7b7 !important;">
      <span class="inline-block h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping"></span>
      ✨ Suggested Addition (Ghost Preview)
    </span>
    <span style="color: #6ee7b7 !important; background-color: rgba(16, 185, 129, 0.2) !important; border: 1px solid rgba(16, 185, 129, 0.4) !important;" class="text-[9px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded">Pending Confirmation</span>
  </div>
  <ul style="list-style-type: disc !important; padding-left: 1.25rem !important; margin: 0.5rem 0 !important; color: #ecfdf5 !important;">
    ${ghostBullets.map((b) => `<li style="color: #ecfdf5 !important; font-size: 11px !important; line-height: 1.5 !important; margin: 4px 0 !important; font-weight: 600 !important;">${escapeHtml(b)}</li>`).join('')}
  </ul>
</div>`;
  }

  function highlightLine(lineContent: string): string {
    const cleanLine = lineContent.trim();
    if (!cleanLine) return escapeHtml(lineContent);

    // Normalize text for comparison: remove all punctuation, extra whitespace, bullets
    const normalize = (s: string) =>
      s
        .toLowerCase()
        .replace(/^[0-9•\-\*▪◦\u2022\u25CF\u25E6\u25AA\u2013\u2014\uF0B7"'\s]+/, '')
        .replace(/["'.,;:!?()]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

    // 1. Target match (Active selected tile preview highlight - amber/gold glow)
    if (cleanTarget && cleanTarget.length > 3) {
      const normLine = normalize(cleanLine);
      const normTarget = normalize(cleanTarget);

      if (normLine && normTarget) {
        // Direct substring check on raw lowercased text
        const rawLowerLine = cleanLine.toLowerCase();
        const rawLowerTarget = cleanTarget.toLowerCase();

        if (rawLowerLine.includes(rawLowerTarget)) {
          const idx = rawLowerLine.indexOf(rawLowerTarget);
          const before = escapeHtml(cleanLine.slice(0, idx));
          const match = escapeHtml(cleanLine.slice(idx, idx + cleanTarget.length));
          const after = escapeHtml(cleanLine.slice(idx + cleanTarget.length));
          return `${before}<mark id="resume-active-highlight" class="resume-target-highlight rounded bg-amber-500/30 text-amber-100 border border-amber-400/60 px-1.5 py-0.5 shadow-[0_0_15px_rgba(245,158,11,0.4)] ring-1 ring-amber-400/50 font-medium">${match}</mark>${after}`;
        }

        // Normalized line contains target
        if (normLine.includes(normTarget)) {
          return `<mark id="resume-active-highlight" class="resume-target-highlight rounded bg-amber-500/30 text-amber-100 border border-amber-400/60 px-1.5 py-0.5 shadow-[0_0_15px_rgba(245,158,11,0.4)] ring-1 ring-amber-400/50 font-medium">${escapeHtml(cleanLine)}</mark>`;
        }

        // Target contains line (for short section headers or trimmed lines)
        if (normTarget.includes(normLine) && normLine.length >= 8) {
          return `<mark id="resume-active-highlight" class="resume-target-highlight rounded bg-amber-500/30 text-amber-100 border border-amber-400/60 px-1.5 py-0.5 shadow-[0_0_15px_rgba(245,158,11,0.4)] ring-1 ring-amber-400/50 font-medium">${escapeHtml(cleanLine)}</mark>`;
        }

        // Strict Word-overlap fuzzy match: requires high similarity (at least 75% of target words, min 3 words)
        const targetWords = normTarget.split(' ').filter((w) => w.length > 3);
        if (targetWords.length >= 3) {
          const matchedWords = targetWords.filter((w) => normLine.includes(w));
          if (matchedWords.length / targetWords.length >= 0.75 && matchedWords.length >= 3) {
            return `<mark id="resume-active-highlight" class="resume-target-highlight rounded bg-amber-500/30 text-amber-100 border border-amber-400/60 px-1.5 py-0.5 shadow-[0_0_15px_rgba(245,158,11,0.4)] ring-1 ring-amber-400/50 font-medium">${escapeHtml(cleanLine)}</mark>`;
          }
        }
      }
    }

    // 2. Applied matches (Applied highlight - emerald/green glow)
    for (const applied of cleanAppliedList) {
      if (applied && applied.length > 2 && applied !== '(Deleted)') {
        const normLine = normalize(cleanLine);
        const normApplied = normalize(applied);

        if (normLine && normApplied) {
          const rawLowerLine = cleanLine.toLowerCase();
          const rawLowerApplied = applied.toLowerCase();

          if (rawLowerLine.includes(rawLowerApplied)) {
            const idx = rawLowerLine.indexOf(rawLowerApplied);
            const before = escapeHtml(cleanLine.slice(0, idx));
            const match = escapeHtml(cleanLine.slice(idx, idx + applied.length));
            const after = escapeHtml(cleanLine.slice(idx + applied.length));
            return `${before}<mark id="resume-applied-highlight" class="resume-applied-highlight rounded bg-emerald-500/30 text-emerald-100 border border-emerald-400/60 px-1.5 py-0.5 shadow-[0_0_15px_rgba(16,185,129,0.4)] ring-1 ring-emerald-400/50 font-medium">${match}</mark>${after}`;
          }

          if (normLine.includes(normApplied) || normApplied.includes(normLine)) {
            return `<mark id="resume-applied-highlight" class="resume-applied-highlight rounded bg-emerald-500/30 text-emerald-100 border border-emerald-400/60 px-1.5 py-0.5 shadow-[0_0_15px_rgba(16,185,129,0.4)] ring-1 ring-emerald-400/50 font-medium">${escapeHtml(cleanLine)}</mark>`;
          }
        }
      }
    }

    return escapeHtml(lineContent);
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (!line) {
      if (inBulletList) {
        htmlParts.push('</ul>');
        inBulletList = false;
      }
      continue;
    }

    // 1. Candidate Name (First non-empty line)
    if (isFirstLine && line.length < 50 && !line.includes('@') && !line.includes('|')) {
      htmlParts.push(`<h1 class="resume-name">${highlightLine(line)}</h1>`);
      isFirstLine = false;
      continue;
    }
    isFirstLine = false;

    // 2. Contact details line (contains @, phone, linkedin, github, or |)
    if (
      (line.includes('@') || line.includes('|') || line.includes('linkedin.com') || line.includes('github.com')) &&
      line.length < 180
    ) {
      if (inBulletList) {
        htmlParts.push('</ul>');
        inBulletList = false;
      }
      htmlParts.push(`<div class="resume-contact">${highlightLine(line)}</div>`);
      continue;
    }

    // 3. Section Header (Matches KNOWN_SECTIONS or standard header)
    if (isMatchingSectionHeader(line)) {
      const isGhostTarget =
        Boolean(ghostAddition) &&
        !ghostInserted &&
        isMatchingSectionHeader(line, ghostAddition?.sectionTarget || 'SKILLS');

      // Check if there is any content under this section
      let hasSectionContent = false;
      for (let j = i + 1; j < lines.length; j++) {
        const nextL = lines[j].trim();
        if (!nextL) continue;
        if (isMatchingSectionHeader(nextL)) break;
        hasSectionContent = true;
        break;
      }

      if (!hasSectionContent && !isGhostTarget) {
        // Skip empty header that has no content and no ghost addition
        continue;
      }

      if (inBulletList) {
        htmlParts.push('</ul>');
        inBulletList = false;
      }
      htmlParts.push(`<h2 class="resume-section-header">${highlightLine(line.toUpperCase())}</h2>`);

      // If this section header matches the ghost target section, insert ghost preview directly below this header!
      if (isGhostTarget) {
        htmlParts.push(renderGhostAdditionHtml());
        ghostInserted = true;
      }
      continue;
    }

    // 4. Bullet list items
    if (/^[•\-\*▪◦\u2022\u25CF\u25E6\u25AA\u2013\u2014\uF0B7]\s*/.test(line)) {
      if (!inBulletList) {
        htmlParts.push('<ul class="resume-bullets">');
        inBulletList = true;
      }
      const bulletContent = line.replace(/^[•\-\*▪◦\u2022\u25CF\u25E6\u25AA\u2013\u2014\uF0B7]\s*/, '');
      htmlParts.push(`<li>${highlightLine(bulletContent)}</li>`);
      continue;
    }

    // 5. Job title / Company / Date entry (e.g. "Software Guy / Intern 2023 - Recently")
    if (inBulletList) {
      htmlParts.push('</ul>');
      inBulletList = false;
    }

    if (line.includes('|') || /\b(20\d\d|19\d\d|present|recently|sometime)\b/i.test(line)) {
      htmlParts.push(`<div class="resume-job-header">${highlightLine(line)}</div>`);
    } else {
      htmlParts.push(`<p class="resume-paragraph">${highlightLine(line)}</p>`);
    }
  }

  // Fallback: If ghostAddition exists but no matching section was found, render it before closing
  if (ghostAddition && !ghostInserted) {
    if (inBulletList) {
      htmlParts.push('</ul>');
      inBulletList = false;
    }
    htmlParts.push(renderGhostAdditionHtml());
    ghostInserted = true;
  }

  if (inBulletList) {
    htmlParts.push('</ul>');
  }

  return htmlParts.join('\n');
}

/**
 * Downloads resume as formatted plain text (.txt)
 */
export function exportAsTxt(text: string, originalFileName: string = 'Resume.pdf') {
  const filename = cleanFileName(originalFileName, 'txt');
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  triggerDownload(blob, filename);
}

/**
 * Downloads resume as clean Markdown (.md)
 */
export function exportAsMarkdown(text: string, originalFileName: string = 'Resume.pdf') {
  const filename = cleanFileName(originalFileName, 'md');

  // Convert plain text into formatted markdown
  const lines = text.split('\n');
  const mdLines: string[] = [];
  let isFirst = true;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      mdLines.push('');
      continue;
    }

    if (isFirst && trimmed.length < 50 && !trimmed.includes('@')) {
      mdLines.push(`# ${trimmed}`);
      isFirst = false;
      continue;
    }
    isFirst = false;

    const upper = trimmed.replace(/[^A-Z\s&]/g, '').trim();
    if (SECTION_HEADERS.includes(upper) && trimmed.length < 40) {
      mdLines.push(`\n## ${trimmed.toUpperCase()}`);
      continue;
    }

    if (trimmed.startsWith('•') || trimmed.startsWith('-')) {
      mdLines.push(`- ${trimmed.replace(/^[•\-]\s*/, '')}`);
    } else {
      mdLines.push(trimmed);
    }
  }

  const blob = new Blob([mdLines.join('\n')], { type: 'text/markdown;charset=utf-8' });
  triggerDownload(blob, filename);
}

/**
 * Downloads resume as Word-compatible document (.doc) with native styling
 */
export function exportAsWordDoc(text: string, originalFileName: string = 'Resume.pdf') {
  const filename = cleanFileName(originalFileName, 'doc');
  const structuredHtml = formatResumeToHtml(text);

  const wordDocumentHtml = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
    <head>
      <meta charset="utf-8">
      <title>${cleanFileName(originalFileName, 'doc')}</title>
      <style>
        body {
          font-family: 'Calibri', 'Arial', sans-serif;
          font-size: 11pt;
          line-height: 1.45;
          color: #111827;
          margin: 1in;
        }
        h1.resume-name {
          font-size: 20pt;
          font-weight: bold;
          color: #0f172a;
          margin-bottom: 3pt;
          text-align: center;
        }
        div.resume-contact {
          font-size: 10pt;
          color: #4b5563;
          text-align: center;
          margin-bottom: 14pt;
        }
        h2.resume-section-header {
          font-size: 12.5pt;
          font-weight: bold;
          color: #0284c7;
          border-bottom: 1.5pt solid #0284c7;
          padding-bottom: 2pt;
          margin-top: 14pt;
          margin-bottom: 6pt;
          text-transform: uppercase;
        }
        div.resume-job-header {
          font-size: 11pt;
          font-weight: bold;
          color: #1e293b;
          margin-top: 6pt;
          margin-bottom: 2pt;
        }
        ul.resume-bullets {
          margin-top: 2pt;
          margin-bottom: 6pt;
          padding-left: 20pt;
        }
        li {
          margin-bottom: 2.5pt;
          line-height: 1.4;
        }
        p.resume-paragraph {
          margin-top: 2pt;
          margin-bottom: 4pt;
        }
      </style>
    </head>
    <body>
      <div class="document-container">
        ${structuredHtml}
      </div>
    </body>
    </html>
  `;

  const blob = new Blob(['\ufeff' + wordDocumentHtml], { type: 'application/msword' });
  triggerDownload(blob, filename);
}

/**
 * Opens a print view formatted for clean ATS single/multi-page PDF export
 */
export function exportAsPdf(text: string, originalFileName: string = 'Resume.pdf') {
  const title = originalFileName.replace(/\.[^/.]+$/, '').trim() || 'Resume';
  const structuredHtml = formatResumeToHtml(text);

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Pop-up blocked! Please allow pop-ups for this website to generate the PDF.');
    return;
  }

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>${title} - ATS Optimized Resume</title>
        <style>
          @page {
            margin: 0.65in;
            size: letter;
          }
          * {
            box-sizing: border-box;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: #0f172a;
            background: #ffffff;
            margin: 0;
            padding: 36px 48px;
            font-size: 10pt;
            line-height: 1.5;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .resume-container {
            max-width: 820px;
            margin: 0 auto;
          }
          h1.resume-name {
            font-size: 22pt;
            font-weight: 800;
            color: #0f172a;
            margin: 0 0 4px 0;
            text-align: center;
            letter-spacing: -0.02em;
          }
          div.resume-contact {
            font-size: 9.5pt;
            color: #475569;
            text-align: center;
            margin-bottom: 16px;
            padding-bottom: 8px;
            border-bottom: 1px solid #e2e8f0;
          }
          h2.resume-section-header {
            font-size: 11.5pt;
            font-weight: 700;
            color: #0369a1;
            border-bottom: 1.5px solid #0284c7;
            padding-bottom: 2px;
            margin-top: 14px;
            margin-bottom: 6px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            page-break-after: avoid;
          }
          div.resume-job-header {
            font-size: 10.5pt;
            font-weight: 600;
            color: #1e293b;
            margin-top: 8px;
            margin-bottom: 2px;
            page-break-after: avoid;
          }
          ul.resume-bullets {
            margin: 3px 0 8px 0;
            padding-left: 18px;
          }
          li {
            margin-bottom: 3px;
            line-height: 1.45;
            color: #1e293b;
          }
          p.resume-paragraph {
            margin: 3px 0 6px 0;
            color: #334155;
          }
          @media print {
            body {
              padding: 0;
            }
            .no-print {
              display: none !important;
            }
            li, div.resume-job-header {
              page-break-inside: avoid;
            }
          }
          .no-print-banner {
            background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
            color: white;
            padding: 12px 24px;
            margin: -36px -48px 24px -48px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            font-size: 13px;
            font-weight: 500;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          .btn-print {
            background: white;
            color: #0284c7;
            border: none;
            padding: 7px 16px;
            border-radius: 8px;
            font-weight: 700;
            cursor: pointer;
            font-size: 12px;
            transition: all 0.2s;
          }
          .btn-print:hover {
            background: #f0f9ff;
          }
        </style>
      </head>
      <body>
        <div class="no-print no-print-banner">
          <span>📄 WorkZen ATS Formatted Resume — Click <strong>"Print / Save as PDF"</strong></span>
          <button class="btn-print" onclick="window.print()">Print / Save as PDF</button>
        </div>
        <div class="resume-container">
          ${structuredHtml}
        </div>
        <script>
          window.onload = () => {
            setTimeout(() => {
              window.print();
            }, 300);
          };
        </script>
      </body>
    </html>
  `);

  printWindow.document.close();
}
