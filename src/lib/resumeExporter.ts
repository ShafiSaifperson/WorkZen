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

const SECTION_HEADERS = [
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

/**
 * Parses resume plain text into structured HTML elements (headers, contacts, sections, bullet lists).
 */
export function formatResumeToHtml(text: string): string {
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
      htmlParts.push(`<h1 class="resume-name">${escapeHtml(line)}</h1>`);
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
      htmlParts.push(`<div class="resume-contact">${escapeHtml(line)}</div>`);
      continue;
    }

    // 3. Section Header (Matches KNOWN_SECTIONS or all uppercase header)
    const upperClean = line.replace(/[^A-Z\s&]/g, '').trim();
    const isSectionHeader =
      (SECTION_HEADERS.includes(upperClean) || SECTION_HEADERS.includes(line.toUpperCase())) &&
      line.length < 40 &&
      !line.includes('.') &&
      !line.includes('@');

    if (isSectionHeader) {
      if (inBulletList) {
        htmlParts.push('</ul>');
        inBulletList = false;
      }
      htmlParts.push(`<h2 class="resume-section-header">${escapeHtml(line.toUpperCase())}</h2>`);
      continue;
    }

    // 4. Bullet list items
    if (/^[•\-\*▪◦\u2022\u25CF\u25E6\u25AA\u2013\u2014\uF0B7]\s*/.test(line)) {
      if (!inBulletList) {
        htmlParts.push('<ul class="resume-bullets">');
        inBulletList = true;
      }
      const bulletContent = line.replace(/^[•\-\*▪◦\u2022\u25CF\u25E6\u25AA\u2013\u2014\uF0B7]\s*/, '');
      htmlParts.push(`<li>${escapeHtml(bulletContent)}</li>`);
      continue;
    }

    // 5. Job title / Company / Date entry (e.g. "Software Guy / Intern 2023 - Recently")
    if (inBulletList) {
      htmlParts.push('</ul>');
      inBulletList = false;
    }

    if (line.includes('|') || /\b(20\d\d|19\d\d|present|recently|sometime)\b/i.test(line)) {
      htmlParts.push(`<div class="resume-job-header">${escapeHtml(line)}</div>`);
    } else {
      htmlParts.push(`<p class="resume-paragraph">${escapeHtml(line)}</p>`);
    }
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
