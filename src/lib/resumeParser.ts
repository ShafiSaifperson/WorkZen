/* eslint-disable no-useless-escape */

export interface SampleResume {
  name: string;
  role: string;
  fileName: string;
  text: string;
}

interface PdfTextItem {
  str: string;
  transform: number[];
  width: number;
  height: number;
}

interface PdfJsLibrary {
  GlobalWorkerOptions: { workerSrc: string };
  getDocument: (source: { data: Uint8Array }) => {
    promise: Promise<{
      numPages: number;
      getPage: (pageNumber: number) => Promise<{
        getTextContent: () => Promise<{ items: PdfTextItem[] }>;
      }>;
    }>;
  };
}

interface MammothLibrary {
  extractRawText: (input: { arrayBuffer: ArrayBuffer }) => Promise<{ value?: string }>;
}

export const SAMPLE_RESUMES: SampleResume[] = [
  {
    name: 'Alex Kim (Frontend Developer)',
    role: 'Frontend Engineer',
    fileName: 'Alex_Kim_Resume.pdf',
    text: `Alex Kim
San Francisco, CA | alex.kim@example.com | (555) 234-5678 | github.com/alexkim | linkedin.com/in/alexkim

PROFESSIONAL SUMMARY
Passionate and detail-oriented Frontend Developer with 3+ years of experience building modern, responsive web applications using React, TypeScript, and modern CSS frameworks. Adept at collaborating with cross-functional teams to deliver accessible, high-performance user interfaces.

TECHNICAL SKILLS
• Languages & Frameworks: JavaScript (ES6+), TypeScript, React, Next.js, HTML5, CSS3, Tailwind CSS
• Tools & Platforms: Git, GitHub, Vite, Webpack, Figma, Jest, React Testing Library, REST APIs, Vercel
• Databases & State: PostgreSQL basics, Redux Toolkit, Zustand, React Query

PROFESSIONAL EXPERIENCE
Frontend Software Engineer | Northwind Labs, San Francisco, CA (2024 - Present)
• Spearheaded the development of a real-time analytics dashboard in React & TypeScript, improving page load speed by 38% for 4,500+ active users.
• Collaborated with product designers to implement a scalable design system using Tailwind CSS, standardizing UI across 12 product modules.
• Integrated RESTful APIs and optimized state management with React Query, decreasing redundant network requests by 45%.
• Automated unit and integration testing pipelines with Vitest and GitHub Actions, achieving 88% test coverage.

Junior Web Developer | Lumen Studio, New York, NY (2022 - 2024)
• Developed responsive client landing pages and customer portals using React, HTML5, and Tailwind CSS.
• Refactored legacy JavaScript codebases into modern TypeScript, cutting runtime client errors by 24%.
• Partnered with UX researchers to conduct usability testing, implementing accessibility improvements that achieved WCAG 2.1 AA compliance.
• Assisted senior engineers in migrating frontend deployments to Vercel with automated previews.

EDUCATION
Bachelor of Science in Computer Science | University of California, Berkeley (2018 - 2022)
GPA: 3.8/4.0 | Dean's Honor List`,
  },
  {
    name: 'Jordan Rivera (Full-Stack Engineer)',
    role: 'Full-Stack Engineer',
    fileName: 'Jordan_Rivera_Resume.pdf',
    text: `Jordan Rivera
Austin, TX | jordan.rivera@example.com | (555) 987-6543 | github.com/jrivera | linkedin.com/in/jrivera

SUMMARY
Versatile Full-Stack Engineer with 4 years of experience architecting end-to-end web applications, distributed backend services, and scalable cloud solutions with Node.js, React, and PostgreSQL.

SKILLS
• Languages: TypeScript, JavaScript, Python, SQL, Go
• Backend: Node.js, Express, PostgreSQL, Redis, Docker, REST APIs, GraphQL
• Frontend: React, Next.js, Tailwind CSS, Redux
• Cloud/DevOps: AWS (S3, EC2, Lambda), Docker, CI/CD, Git

EXPERIENCE
Full-Stack Engineer | Orbital Inc, Austin, TX (2023 - Present)
• Architected and deployed microservices backend using Node.js and PostgreSQL, supporting 25,000+ daily active transactions.
• Built high-throughput caching layer with Redis, reducing database query latency by 52%.
• Engineered responsive web client in React and TypeScript, boosting customer conversion by 18%.
• Configured automated CI/CD deployment pipelines on AWS with Docker and GitHub Actions.

Software Developer | Stratos Cloud, Seattle, WA (2021 - 2023)
• Maintained and enhanced core REST APIs in Express and PostgreSQL.
• Wrote automated test suites with Jest and Supertest, ensuring 90%+ code coverage.
• Resolved customer-reported bugs and optimized SQL indexes for faster reporting queries.

EDUCATION
B.S. in Software Engineering | University of Texas at Austin (2017 - 2021)`,
  },
];

const KNOWN_SECTIONS = [
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
 * Strips HTML/XML tags, styles, scripts, decodes HTML entities, and removes binary control characters.
 */
export function sanitizeAndCleanText(raw: string): string {
  if (!raw) return '';

  let cleaned = raw;

  // 1. If content contains HTML tags or document wrappers, clean them systematically
  if (/<[a-z][\s\S]*>/i.test(cleaned)) {
    // Strip <head>...</head>, <style>...</style>, <script>...</script>
    cleaned = cleaned
      .replace(/<head[\s\S]*?<\/head>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<script[\s\S]*?<\/script>/gi, '');

    // Convert block-level elements into line breaks
    cleaned = cleaned
      .replace(/<(?:div|p|h[1-6]|li|tr|br|hr)[\s\S]*?>/gi, '\n')
      .replace(/<\/li>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<\/div>/gi, '\n');

    // Strip all remaining HTML/XML tags
    cleaned = cleaned.replace(/<[^>]+>/g, ' ');
  }

  // 2. Decode HTML entities (&quot;, &amp;, &#39;, &lt;, &gt;, &nbsp;, etc.)
  cleaned = cleaned
    .replace(/&quot;/g, '"')
    .replace(/&#34;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&#38;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&#60;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#62;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#160;/g, ' ')
    .replace(/&bull;/g, '•')
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—');

  // 3. Remove non-printable control characters (except newline, carriage return, and tab)
  cleaned = [...cleaned]
    .filter((character) => {
      const code = character.charCodeAt(0);
      return code === 9 || code === 10 || code === 13 || (code >= 32 && (code < 127 || code > 159));
    })
    .join('');

  return normalizeResumeText(cleaned);
}

/**
 * Robust client-side text extractor for PDF, DOCX, TXT, HTML, and Markdown files.
 * Preserves structural formatting, section headers, line breaks, and bullet points.
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const fileName = file.name.toLowerCase();
  const fileType = file.type.toLowerCase();

  // 1. Plain Text, HTML, or Markdown files
  if (fileType.includes('text') || fileType.includes('html') || fileName.endsWith('.txt') || fileName.endsWith('.md') || fileName.endsWith('.html') || fileName.endsWith('.htm')) {
    const text = await file.text();
    if (text.trim().length > 0) return sanitizeAndCleanText(text);
  }

  // 2. PDF Files (Using PDF.js with Spatial Layout Reconstruction)
  if (fileType.includes('pdf') || fileName.endsWith('.pdf')) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const extractedText = await extractTextFromPdfWithLayout(arrayBuffer);
      if (extractedText && extractedText.trim().length > 20) {
        return sanitizeAndCleanText(extractedText);
      }
    } catch (err) {
      console.warn('PDF.js spatial extraction failed, attempting fallback text parsing:', err);
    }
  }

  // 3. DOCX / Word Files (Using Mammoth library for clean, tag-free DOCX parsing)
  if (fileName.endsWith('.docx') || fileName.endsWith('.doc') || fileType.includes('wordprocessingml') || fileType.includes('msword')) {
    try {
      const buffer = await file.arrayBuffer();
      const text = await extractTextFromDocxWithMammoth(buffer);
      if (text && text.trim().length > 20) {
        return sanitizeAndCleanText(text);
      }
    } catch (err) {
      console.warn('Mammoth DOCX extraction failed:', err);
    }
  }

  // Fallback: Read as raw text with sanitizer
  try {
    const fallbackText = await file.text();
    const cleaned = sanitizeAndCleanText(fallbackText);
    if (cleaned.length > 50) return cleaned;
  } catch {
    // ignore
  }

  throw new Error(
    `Unable to extract readable text from "${file.name}". Please ensure it is a text-based PDF, DOCX, or TXT file.`
  );
}

/**
 * Loads PDF.js and reconstructs spatial layout by grouping text items by their X/Y coordinates.
 * Preserves multi-column headers, section titles, lines, and bullet lists accurately.
 */
async function extractTextFromPdfWithLayout(buffer: ArrayBuffer): Promise<string> {
  const win = window as Window & { pdfjsLib?: PdfJsLibrary };
  if (!win.pdfjsLib) {
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.onload = () => {
        const pdfjs = win.pdfjsLib;
        if (!pdfjs) {
          reject(new Error('PDF parser library failed to load.'));
          return;
        }
        pdfjs.GlobalWorkerOptions.workerSrc =
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        resolve();
      };
      script.onerror = () => reject(new Error('Failed to load PDF parser library.'));
      document.head.appendChild(script);
    });
  }

  const pdfjs = win.pdfjsLib;
  if (!pdfjs) throw new Error('PDF parser library failed to load.');
  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(buffer) });
  const pdf = await loadingTask.promise;
  const pageSections: string[] = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const items = textContent.items;

    if (!items || items.length === 0) continue;

    // Filter out empty items and extract spatial coordinates
    const validItems = items
      .filter((it) => it.str !== undefined && it.str !== null)
      .map((it) => ({
        str: it.str,
        x: it.transform[4],
        y: it.transform[5], // In PDF coordinate system, Y increases upwards
        width: it.width,
        height: it.height || 10,
      }));

    if (validItems.length === 0) continue;

    // Group items into lines based on Y coordinate (within ~3.5pt tolerance)
    const lineGroups: Array<{ y: number; items: typeof validItems }> = [];

    for (const item of validItems) {
      if (!item.str.trim() && item.str.length === 0) continue;

      let foundGroup = lineGroups.find((g) => Math.abs(g.y - item.y) <= 3.5);
      if (!foundGroup) {
        foundGroup = { y: item.y, items: [] };
        lineGroups.push(foundGroup);
      }
      foundGroup.items.push(item);
    }

    // Sort lines from top of page to bottom (descending Y)
    lineGroups.sort((a, b) => b.y - a.y);

    const reconstructedLines: string[] = [];
    let prevY: number | null = null;

    for (const group of lineGroups) {
      // Sort items on the same line from left to right (ascending X)
      group.items.sort((a, b) => a.x - b.x);

      let lineStr = '';
      let lastX = -1;
      let lastWidth = 0;

      for (const it of group.items) {
        if (!it.str) continue;

        if (lastX !== -1) {
          const gap = it.x - (lastX + lastWidth);
          // If there is horizontal gap between items and no space yet, insert space
          if (gap > 2 && !lineStr.endsWith(' ') && !it.str.startsWith(' ')) {
            lineStr += ' ';
          }
        }
        lineStr += it.str;
        lastX = it.x;
        lastWidth = it.width;
      }

      lineStr = lineStr.trim();
      if (!lineStr) continue;

      // Check vertical gap between lines to detect section headers / paragraphs
      if (prevY !== null) {
        const verticalGap = prevY - group.y;
        if (verticalGap > 18) {
          reconstructedLines.push('');
        }
      }

      reconstructedLines.push(lineStr);
      prevY = group.y;
    }

    pageSections.push(reconstructedLines.join('\n'));
  }

  return pageSections.join('\n\n');
}

/**
 * Extracts clean, unpolluted text from DOCX binary using Mammoth library.
 */
async function extractTextFromDocxWithMammoth(buffer: ArrayBuffer): Promise<string> {
  const win = window as Window & { mammoth?: MammothLibrary };
  if (!win.mammoth) {
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js';
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Word document reader.'));
      document.head.appendChild(script);
    });
  }

  const mammoth = win.mammoth;
  if (!mammoth) throw new Error('DOCX parser library failed to load.');
  const result = await mammoth.extractRawText({ arrayBuffer: buffer });
  return result.value || '';
}

/**
 * Normalizes resume text layout:
 * - Ensures section headers are isolated with line breaks
 * - Standardizes bullet markers to uniform '• '
 * - Eliminates duplicate blank lines
 */
export function normalizeResumeText(raw: string): string {
  if (!raw) return '';

  const lines = raw
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((l) => l.trim());

  const formattedLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    if (!line) {
      if (formattedLines.length > 0 && formattedLines[formattedLines.length - 1] !== '') {
        formattedLines.push('');
      }
      continue;
    }

    // Standardize bullet points
    if (/^[•\-\*▪◦\u2022\u25CF\u25E6\u25AA\u2013\u2014\uF0B7]\s*/.test(line)) {
      const bulletText = line.replace(/^[•\-\*▪◦\u2022\u25CF\u25E6\u25AA\u2013\u2014\uF0B7]\s*/, '').trim();
      if (bulletText) {
        line = `• ${bulletText}`;
      } else {
        continue;
      }
    }

    // Detect Section Header
    const upperClean = line.replace(/[^A-Z\s&]/g, '').trim();
    const isHeader =
      (KNOWN_SECTIONS.includes(upperClean) || KNOWN_SECTIONS.includes(line.toUpperCase())) &&
      line.length < 40 &&
      !line.includes('.') &&
      !line.includes('@');

    if (isHeader) {
      if (formattedLines.length > 0 && formattedLines[formattedLines.length - 1] !== '') {
        formattedLines.push('');
      }
      formattedLines.push(line.toUpperCase());
      continue;
    }

    formattedLines.push(line);
  }

  // Second pass: Remove empty/orphan section headers (headers followed by another header or EOF with no items)
  const cleaned: string[] = [];
  for (let i = 0; i < formattedLines.length; i++) {
    const line = formattedLines[i];
    const upperClean = line.replace(/[^A-Z\s&]/g, '').trim();
    const isHeader =
      (KNOWN_SECTIONS.includes(upperClean) || KNOWN_SECTIONS.includes(line.toUpperCase())) &&
      line.length < 40 &&
      !line.includes('.') &&
      !line.includes('@');

    if (isHeader) {
      let hasContent = false;
      for (let j = i + 1; j < formattedLines.length; j++) {
        const nextLine = formattedLines[j].trim();
        if (!nextLine) continue;
        const nextUpper = nextLine.replace(/[^A-Z\s&]/g, '').trim();
        const nextIsHeader =
          (KNOWN_SECTIONS.includes(nextUpper) || KNOWN_SECTIONS.includes(nextLine.toUpperCase())) &&
          nextLine.length < 40 &&
          !nextLine.includes('.') &&
          !nextLine.includes('@');
        if (!nextIsHeader) {
          hasContent = true;
        }
        break;
      }

      if (!hasContent) {
        continue;
      }
    }

    cleaned.push(line);
  }

  return cleaned.join('\n').trim();
}
