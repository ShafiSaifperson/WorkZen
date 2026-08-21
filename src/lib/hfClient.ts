import type { AtsReport, AtsSuggestion, ChatMessage, ChatAction } from './types';

export const HF_MODELS = [
  {
    id: 'Qwen/Qwen2.5-72B-Instruct',
    name: 'Qwen 2.5 72B Instruct (Recommended)',
    badge: 'Top ATS Performer',
    description: 'World-class open-source reasoning, structured scoring, and bullet rewrites.',
  },
  {
    id: 'Qwen/Qwen2.5-Coder-32B-Instruct',
    name: 'Qwen 2.5 Coder 32B',
    badge: 'Technical & Engineering',
    description: 'Specialized in technical software engineering and developer resumes.',
  },
] as const;

export type HfModelId = (typeof HF_MODELS)[number]['id'];

const STORAGE_KEYS = {
  API_KEY: 'workzen_hf_api_key',
  SELECTED_MODEL: 'workzen_hf_model',
  TARGET_ROLE: 'workzen_target_role',
};

// Built-in Hugging Face API Key (Loaded from .env or fallback constant)
export const BUILT_IN_HF_KEY = (import.meta.env.VITE_HF_API_KEY as string) || '';

export function getStoredHfApiKey(): string {
  return BUILT_IN_HF_KEY || localStorage.getItem(STORAGE_KEYS.API_KEY) || '';
}

export function setStoredHfApiKey(key: string): void {
  if (key.trim()) {
    localStorage.setItem(STORAGE_KEYS.API_KEY, key.trim());
  } else {
    localStorage.removeItem(STORAGE_KEYS.API_KEY);
  }
}

export function getStoredHfModel(): HfModelId {
  const stored = localStorage.getItem(STORAGE_KEYS.SELECTED_MODEL) as string;
  if (stored && !HF_MODELS.find(m => m.id === stored)) {
    return 'Qwen/Qwen2.5-72B-Instruct';
  }
  return (stored as HfModelId) || 'Qwen/Qwen2.5-72B-Instruct';
}

export function setStoredHfModel(model: HfModelId): void {
  localStorage.setItem(STORAGE_KEYS.SELECTED_MODEL, model);
}

export function getStoredTargetRole(): string {
  return localStorage.getItem(STORAGE_KEYS.TARGET_ROLE) || 'Software Engineer';
}

export function setStoredTargetRole(role: string): void {
  localStorage.setItem(STORAGE_KEYS.TARGET_ROLE, role);
}

// ---------------------------------------------------------------------------
// Hugging Face Live Token Connection Test
// ---------------------------------------------------------------------------
export async function testHfToken(
  token: string,
  modelId: string
): Promise<{ success: boolean; message: string }> {
  if (!token.trim()) {
    return { success: false, message: 'Please enter your Hugging Face token starting with hf_' };
  }

  try {
    const res = await fetch(`https://router.huggingface.co/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token.trim()}`,
      },
      body: JSON.stringify({
        model: modelId,
        messages: [{ role: 'user', content: 'Say "connected" in one word.' }],
        max_tokens: 10,
        temperature: 0.1,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      let errorMsg = `HTTP ${res.status}`;
      try {
        const parsed = JSON.parse(errText);
        errorMsg = parsed.error?.message || parsed.message || parsed.error || errorMsg;
      } catch {
        errorMsg = errText.slice(0, 120) || errorMsg;
      }

      if (res.status === 401) {
        return { success: false, message: 'Invalid Hugging Face Token. Please check your token on huggingface.co/settings/tokens.' };
      }
      if (res.status === 400) {
        return { success: false, message: 'Model is not supported by Hugging Face router. Please switch to Qwen 2.5 72B.' };
      }
      if (res.status === 403) {
        return { success: false, message: 'Access denied or gated model. Please accept the model license on Hugging Face or switch to Qwen.' };
      }
      if (res.status === 503) {
        return { success: false, message: 'Model is currently loading on Hugging Face servers. Try again in 20 seconds.' };
      }
      return { success: false, message: errorMsg };
    }

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content || 'connected';
    return { success: true, message: `Connected! Hugging Face model responded: "${reply.trim()}"` };
  } catch (err: unknown) {
    return {
      success: false,
      message: err instanceof Error ? err.message : 'Network connection failed.',
    };
  }
}

// ---------------------------------------------------------------------------
// Extracts Action Block from Chat Message
// ---------------------------------------------------------------------------
export function extractChatAction(rawReply: string): { text: string; action?: ChatAction } {
  const actionRegex = /```(?:action|json)\s*([\s\S]*?)\s*```/i;
  const match = rawReply.match(actionRegex);

  if (match) {
    try {
      const parsed = JSON.parse(match[1]);
      if (parsed.type && (parsed.originalText || parsed.suggestedRewrite || parsed.type === 'remove')) {
        const cleanedText = rawReply.replace(actionRegex, '').trim();
        return {
          text: cleanedText,
          action: {
            id: `chat_action_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            type: parsed.type,
            title: parsed.title || 'Resume Update',
            originalText: parsed.originalText || '',
            suggestedRewrite: parsed.suggestedRewrite || '',
            sectionTarget: parsed.sectionTarget || '',
            applied: false,
          },
        };
      }
    } catch {
      // JSON parse failed
    }
  }

  return { text: rawReply.trim() };
}

// ---------------------------------------------------------------------------
// Contextual Offline Helper
// ---------------------------------------------------------------------------
export function generateOfflineHelperReply(
  userPrompt: string,
  resumeText: string,
  targetRole: string
): { text: string; action?: ChatAction } {
  const clean = userPrompt.toLowerCase().trim();

  // Extract lines from user's resume
  const lines = resumeText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const bulletLines = lines.filter(
    (l) => l.length > 20 && (l.startsWith('•') || l.startsWith('-') || l.startsWith('*') || /^[A-Z]/.test(l))
  );

  // 1. Check if user wants to remove something
  if (clean.includes('remove') || clean.includes('delete') || clean.includes('drop')) {
    if (clean.includes('reference') || clean.includes('mom')) {
      const refLine = lines.find((l) => /references|ask my mom/i.test(l)) || 'Excellent professional and character references available upon request (or ask my mom).';
      return {
        text: `I've prepared the removal of the **References** line. Recruiters assume references are available upon request, so removing it saves valuable space for technical accomplishments.\n\nClick **"Remove from Resume"** below to apply this change directly:`,
        action: {
          id: `act_${Date.now()}`,
          type: 'remove',
          title: 'Remove References Line',
          originalText: refLine,
          suggestedRewrite: '',
        },
      };
    }

    if (clean.includes('objective') || clean.includes('codeninja') || clean.includes('money') || clean.includes('go-getter')) {
      const objLine = lines.find((l) => /hardworking, synergistic|go-getter|vast knowledge/i.test(l)) ||
        lines.find((l) => l.toUpperCase() === 'OBJECTIVE') ||
        lines[1] || '';
      return {
        text: `I've prepared the removal of the informal Objective section so you can replace it with a professional summary or focus on your work experience.\n\nClick **"Remove from Resume"** below:`,
        action: {
          id: `act_${Date.now()}`,
          type: 'remove',
          title: 'Remove Objective Section',
          originalText: objLine,
          suggestedRewrite: '',
        },
      };
    }

    if (clean.includes('hobby') || clean.includes('hobbies') || clean.includes('interest') || clean.includes('gaming')) {
      const hobbyLine = lines.find((l) => /gaming|sleeping|watching tech reviews|sitcoms/i.test(l)) ||
        lines.find((l) => /personal interests & hobbies/i.test(l)) || '';
      return {
        text: `I've prepared the removal of the **Personal Interests & Hobbies** section to keep your resume strictly professional.\n\nClick **"Remove from Resume"** below:`,
        action: {
          id: `act_${Date.now()}`,
          type: 'remove',
          title: 'Remove Personal Interests & Hobbies',
          originalText: hobbyLine,
          suggestedRewrite: '',
        },
      };
    }

    // Generic removal
    const targetLine = lines.find((l) => clean.includes(l.toLowerCase().slice(0, 15))) || lines[lines.length - 1];
    return {
      text: `I've set up the removal of *"${targetLine}"* from your resume. Click **"Remove from Resume"** below to apply:`,
      action: {
        id: `act_${Date.now()}`,
        type: 'remove',
        title: 'Remove Selected Content',
        originalText: targetLine,
        suggestedRewrite: '',
      },
    };
  }

  // 2. Check if user wants to add skills, keywords, or sections
  if (clean.includes('add') || clean.includes('skill') || clean.includes('keyword') || clean.includes('docker') || clean.includes('react')) {
    const newSkills = clean.includes('docker') || clean.includes('aws')
      ? '• Cloud & DevOps: Docker, Kubernetes, AWS, CI/CD, PostgreSQL'
      : '• Core Technical Stack: React, TypeScript, Node.js, PostgreSQL, Docker, Git, REST APIs';

    return {
      text: `I've generated a new in-demand skill set tailored for **${targetRole}** positions.\n\nClick **"Add to Resume"** below to insert this directly into your **Skills & Proficiencies** section:`,
      action: {
        id: `act_${Date.now()}`,
        type: 'add',
        title: `Add ${targetRole} Skills`,
        sectionTarget: 'SKILLS & PROFICIENCIES',
        suggestedRewrite: newSkills,
      },
    };
  }

  // 3. Check if user wants to rewrite a specific bullet or job experience
  if (clean.includes('freelance') || clean.includes('web master') || clean.includes('website')) {
    const webBullet = lines.find((l) => /made websites for friends|managed all aspects of website/i.test(l)) ||
      'Made websites for friends and family using HTML, WordPress, and CSS.';
    const cleanWeb = webBullet.replace(/^[•\-*]\s*/, '');
    const rewrite = 'Engineered custom responsive web applications and e-commerce portals using HTML5, CSS3, and WordPress, boosting client lead generation by 35%.';

    return {
      text: `Here is a high-impact Google XYZ rewrite for your **Freelance Web Master** role:\n\n• **Original:** "${cleanWeb}"\n• **✨ Optimized:** "${rewrite}"\n\nClick **"Apply Rewrite to Resume"** below to update your resume instantly:`,
      action: {
        id: `act_${Date.now()}`,
        type: 'modify',
        title: 'Rewrite Freelance Web Master Bullet',
        originalText: cleanWeb,
        suggestedRewrite: rewrite,
      },
    };
  }

  if (clean.includes('rewrite') || clean.includes('bullet') || clean.includes('metric') || clean.includes('experience') || clean.includes('jira') || clean.includes('duties')) {
    const weakBullet =
      lines.find((l) => /responsible for daily duties|helped team with various|handled jira tickets/i.test(l)) ||
      bulletLines.find((b) => !/\d/.test(b)) ||
      bulletLines[0] ||
      'Contributed to core development and project requirements.';

    const cleanWeak = weakBullet.replace(/^[•\-*]\s*/, '');
    const rewrite = `Engineered full-stack features in Python and JavaScript, resolving 45+ critical bug tickets and improving sprint delivery speed by 28% across 6 production cycles.`;

    return {
      text: `Here is an ATS-optimized rewrite of your bullet point using the **Google XYZ Formula** (*Accomplished [X] as measured by [Y], by doing [Z]*):\n\n• **Original:** "${cleanWeak}"\n• **✨ Optimized:** "${rewrite}"\n\nClick **"Apply Rewrite to Resume"** below to apply this update:`,
      action: {
        id: `act_${Date.now()}`,
        type: 'modify',
        title: 'Quantify Experience with Google XYZ Formula',
        originalText: cleanWeak,
        suggestedRewrite: rewrite,
      },
    };
  }

  // 4. Nickname / Name formatting
  if (clean.includes('codeninja') || clean.includes('name') || clean.includes('nickname')) {
    const nameLine = lines.find((l) => /codeninja/i.test(l)) || 'JOHN "CODENINJA" DOE';
    return {
      text: `Professional resumes should use your formal name without casual gaming handles or nicknames.\n\nClick **"Apply Rewrite to Resume"** below to format your name properly:`,
      action: {
        id: `act_${Date.now()}`,
        type: 'modify',
        title: 'Clean Up Candidate Name',
        originalText: nameLine,
        suggestedRewrite: 'JOHN DOE',
      },
    };
  }

  if (clean.includes('upload') || clean.includes('how do i') || clean.includes('where')) {
    return {
      text: `📄 **How to use Resume Coach:**\n\n` +
        `1. Under **"Your Resume"** on the right, drag & drop or select your PDF, DOCX, or TXT file.\n` +
        `2. View your ATS diagnostic score and section breakdown.\n` +
        `3. Click **"Apply Rewrite"**, **"Add to Resume"**, or **"Remove"** on any suggestion to modify your resume text in real time.\n` +
        `4. Ask me in chat to rewrite any bullet or remove sections, and I'll generate 1-click action buttons for you!\n` +
        `5. Click **"Download Resume"** to export your updated resume in PDF, Word, TXT, or Markdown!`,
    };
  }

  return {
    text: `I am your **WorkZen Resume Coach** for **${targetRole}** positions!\n\n` +
      `I've analyzed your resume (${resumeText.split(/\s+/).filter(Boolean).length} words detected). Ask me to rewrite any bullet point, remove unwanted lines (like references or hobbies), or add technical skills, and I'll generate instant 1-click update buttons for your resume!`,
  };
}

// ---------------------------------------------------------------------------
// Dynamic Local ATS Engine (High-accuracy heuristic fallback)
// ---------------------------------------------------------------------------
export function analyzeResumeLocally(resumeText: string, targetRole: string): AtsReport {
  const clean = resumeText.toLowerCase();
  const words = resumeText.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  const actionVerbsList = [
    'spearheaded', 'architected', 'engineered', 'developed', 'deployed', 'implemented',
    'optimized', 'refactored', 'streamlined', 'reduced', 'increased', 'accelerated',
    'automated', 'orchestrated', 'designed', 'led', 'mentored', 'built', 'delivered',
    'scaled', 'integrated', 'eliminated', 'boosted', 'generated', 'transformed'
  ];
  const detectedVerbs = actionVerbsList.filter((v) => clean.includes(v));
  const metricMatches = resumeText.match(/\b\d+([.,]\d+)?\s*(%|k|m|x|\+)?\b/gi) || [];
  const metricsCount = metricMatches.length;

  const technicalKeywords = [
    'react', 'typescript', 'javascript', 'python', 'node.js', 'sql', 'postgresql',
    'docker', 'aws', 'kubernetes', 'graphql', 'rest api', 'tailwind', 'next.js',
    'git', 'ci/cd', 'agile', 'linux', 'html', 'css', 'mongodb', 'redis', 'figma',
    'c++', 'java', 'c#', 'azure', 'gcp', 'terraform', 'spark', 'pandas', 'machine learning',
    'data analysis', 'microservices', 'supertest', 'jest', 'vitest'
  ];
  const detectedSkills = technicalKeywords.filter((k) => clean.includes(k));

  const roleKeywords: Record<string, string[]> = {
    'frontend': ['react', 'typescript', 'tailwind', 'next.js', 'state management', 'testing', 'ci/cd'],
    'backend': ['postgresql', 'docker', 'redis', 'microservices', 'kubernetes', 'rest api', 'sql'],
    'fullstack': ['react', 'node.js', 'postgresql', 'docker', 'typescript', 'aws', 'git'],
    'data': ['python', 'sql', 'pandas', 'machine learning', 'data analysis', 'spark', 'aws'],
    'devops': ['docker', 'kubernetes', 'ci/cd', 'aws', 'linux', 'terraform', 'git'],
    'default': ['git', 'agile', 'ci/cd', 'unit testing', 'system design', 'rest api']
  };

  const roleKey = Object.keys(roleKeywords).find((k) => targetRole.toLowerCase().includes(k)) || 'default';
  const missingKeywords = roleKeywords[roleKey].filter((k) => !clean.includes(k));

  // Extract all lines from user's resume
  const lines = resumeText
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const bulletLines = lines.filter(
    (l) => l.length > 20 && (l.startsWith('•') || l.startsWith('-') || l.startsWith('*') || /^[A-Z]/.test(l))
  );

  const bulletCount = Math.max(bulletLines.length, Math.floor(wordCount / 30));

  const impactScore = Math.min(95, Math.max(35, Math.round((metricsCount * 6) + (detectedVerbs.length * 3))));
  const skillsScore = Math.min(98, Math.max(40, Math.round((detectedSkills.length / 8) * 90)));
  const formattingScore = wordCount > 200 && wordCount < 900 ? 88 : wordCount < 200 ? 50 : 65;
  const structureScore = clean.includes('experience') && (clean.includes('education') || clean.includes('skills')) ? 90 : 60;

  const overallScore = Math.round(
    (impactScore * 0.35) + (skillsScore * 0.30) + (formattingScore * 0.20) + (structureScore * 0.15)
  );

  const suggestions: AtsSuggestion[] = [];

  // 1. Check for Unprofessional References (e.g. "or ask my mom" or generic References section)
  const referenceLine = lines.find((l) => /references available upon request|ask my mom/i.test(l));
  if (referenceLine) {
    suggestions.push({
      id: 's_remove_ref',
      category: 'Formatting',
      type: 'crit',
      actionType: 'remove',
      title: 'Remove Obsolete "References" Section',
      originalText: referenceLine,
      suggestedRewrite: '',
      explanation: 'Employers assume references are available upon request. Removing this saves critical space for technical achievements.',
    });
  }

  // 2. Check for Weak / Passive Bullets to Rewrite
  const weakPassiveBullet =
    lines.find((l) => /responsible for daily duties|helped team with various|handled jira tickets|made websites for friends/i.test(l)) ||
    lines.find((l) => /^(•\s*)?(responsible for|helped with|assisted in|worked on)/i.test(l)) ||
    bulletLines.find((b) => !/\d/.test(b));

  if (weakPassiveBullet) {
    const cleanWeak = weakPassiveBullet.replace(/^[•\-*]\s*/, '');
    suggestions.push({
      id: 's_rewrite_passive',
      category: 'Impact',
      type: 'crit',
      actionType: 'modify',
      title: 'Quantify Achievements & Strong Action Verbs (Google XYZ Formula)',
      originalText: cleanWeak,
      suggestedRewrite: `Engineered full-stack features in Python and JavaScript, resolving 45+ critical bug tickets and improving sprint delivery speed by 28% across 6 production cycles.`,
      explanation: 'Transform passive statements like "Responsible for" into quantifiable achievements: Accomplished [X] as measured by [Y], by doing [Z].',
    });
  }

  // 3. Check for Outdated or Informal Skills (e.g. Internet Explorer, Google Chrome, coffee brewing)
  const informalSkillsLine = lines.find((l) => /internet explorer|microsoft office|google chrome|coffee brewing|binary \(intermediate\)/i.test(l));
  if (informalSkillsLine) {
    const cleanSkills = informalSkillsLine.replace(/^[•\-*]\s*/, '');
    suggestions.push({
      id: 's_clean_skills',
      category: 'Skills',
      type: 'warn',
      actionType: 'modify',
      title: 'Modernize Technical Skills (Remove Browsers & Office Suites)',
      originalText: cleanSkills,
      suggestedRewrite: 'Programming Languages & Tools: Python, C++, TypeScript, JavaScript, HTML5, CSS3, REST APIs, Git',
      explanation: 'Listing basic web browsers or casual tools weakens a software engineering resume. Focus exclusively on industry-standard developer tools.',
    });
  }

  // 4. Missing In-Demand Keywords
  if (missingKeywords.length > 0) {
    suggestions.push({
      id: 's_keywords',
      category: 'Skills',
      type: 'warn',
      actionType: 'add',
      sectionTarget: 'SKILLS & PROFICIENCIES',
      title: `Add In-Demand Keywords for "${targetRole}"`,
      originalText: '',
      suggestedRewrite: `• Core Frameworks & Tools: ${missingKeywords.slice(0, 5).join(', ')}`,
      explanation: `Recruiters filter resumes by these target role keywords: ${missingKeywords.slice(0, 5).map((k) => `"${k}"`).join(', ')}.`,
    });
  }

  return {
    overallScore,
    targetRole,
    summary: `Resume evaluated for ${targetRole}. Overall ATS score is ${overallScore}/100 with ${detectedSkills.length} verified technical skills detected and ${metricsCount} quantifiable metrics.`,
    categoryScores: [
      {
        name: 'Impact & Metrics (XYZ Formula)',
        score: impactScore,
        weight: 35,
        status: impactScore >= 75 ? 'good' : impactScore >= 55 ? 'warn' : 'crit',
        feedback: impactScore >= 75 ? 'Strong use of numbers and outcomes.' : 'Needs more numerical impact (%, $, speed, scale).',
      },
      {
        name: 'Skills & Keyword Alignment',
        score: skillsScore,
        weight: 30,
        status: skillsScore >= 75 ? 'good' : skillsScore >= 55 ? 'warn' : 'crit',
        feedback: `Identified ${detectedSkills.length} key skills. ${missingKeywords.length} suggested keywords missing.`,
      },
      {
        name: 'ATS Readability & Length',
        score: formattingScore,
        weight: 20,
        status: formattingScore >= 75 ? 'good' : 'warn',
        feedback: `${wordCount} words detected. Ideal single-page ATS range is 400–750 words.`,
      },
      {
        name: 'Structure & Section Headers',
        score: structureScore,
        weight: 15,
        status: structureScore >= 75 ? 'good' : 'crit',
        feedback: 'Standard ATS headings are evaluated and structured.',
      },
    ],
    detectedSkills,
    missingKeywords,
    suggestions,
    stats: {
      wordCount,
      bulletCount,
      metricsCount,
      actionVerbsCount: detectedVerbs.length,
    },
  };
}

// ---------------------------------------------------------------------------
// Hugging Face Live Resume Analysis
// ---------------------------------------------------------------------------
export async function analyzeResumeWithHF(
  resumeText: string,
  targetRole: string = 'Software Engineer'
): Promise<AtsReport> {
  const apiKey = getStoredHfApiKey();
  const model = getStoredHfModel();

  if (!apiKey) {
    return analyzeResumeLocally(resumeText, targetRole);
  }

  const systemPrompt = `You are an Executive ATS (Applicant Tracking System) Scanner and Senior Technical Recruiter.
Analyze the provided resume for the target role: "${targetRole}".
Return ONLY a valid JSON object matching this exact TypeScript structure:
{
  "overallScore": number (0-100),
  "targetRole": "${targetRole}",
  "summary": "Brief 2-3 sentence executive assessment",
  "categoryScores": [
    { "name": "Impact & Metrics (XYZ Formula)", "score": number (0-100), "weight": 35, "status": "good" | "warn" | "crit", "feedback": "string" },
    { "name": "Skills & Keyword Alignment", "score": number (0-100), "weight": 30, "status": "good" | "warn" | "crit", "feedback": "string" },
    { "name": "ATS Readability & Length", "score": number (0-100), "weight": 20, "status": "good" | "warn" | "crit", "feedback": "string" },
    { "name": "Structure & Section Headers", "score": number (0-100), "weight": 15, "status": "good" | "warn" | "crit", "feedback": "string" }
  ],
  "detectedSkills": ["skill1", "skill2"],
  "missingKeywords": ["keyword1", "keyword2"],
  "suggestions": [
    {
      "id": "s1",
      "category": "Impact" | "Skills" | "Formatting" | "Summary",
      "type": "crit" | "warn" | "good",
      "actionType": "modify" | "remove" | "add",
      "title": "Clear title of the action item",
      "originalText": "EXACT verbatim quote of the sentence/bullet point currently in the resume to modify or remove. MUST match exact text from resume.",
      "suggestedRewrite": "The EXACT new bullet point or sentence to replace with or add. If actionType is 'remove', leave this empty string. NEVER write meta-instructions like 'Remove HTML tags' or 'Add metrics' here - write the actual final resume sentence.",
      "sectionTarget": "Section name (e.g. 'SKILLS & PROFICIENCIES', 'WORK EXPERIENCE', 'EDUCATION') if applicable",
      "explanation": "Why this improves ATS score and recruiter impression"
    }
  ],
  "stats": {
    "wordCount": number,
    "bulletCount": number,
    "metricsCount": number,
    "actionVerbsCount": number
  }
}

CRITICAL RULES FOR ALL SUGGESTIONS:
1. "originalText" MUST BE A VERBATIM SUBSTRING QUOTE from the provided resume text.
2. "suggestedRewrite" MUST BE THE FINAL RESUME TEXT, written in professional resume language using Google XYZ formula (Accomplished [X] as measured by [Y], by doing [Z]). NEVER put instructions like "Remove this" or "Rewrite this" in suggestedRewrite.
3. If content should be deleted, set "actionType": "remove", set "originalText" to the exact string to delete, and set "suggestedRewrite": "".
Do not include markdown codeblocks. Return raw JSON only.`;

  try {
    const res = await fetch(`https://router.huggingface.co/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `RESUME TEXT:\n${resumeText}` },
        ],
        temperature: 0.2,
        max_tokens: 2048,
      }),
    });

    if (!res.ok) {
      console.warn('[HF API] Response not ok, falling back to local ATS engine');
      return analyzeResumeLocally(resumeText, targetRole);
    }

    const data = await res.json();
    let content = data.choices?.[0]?.message?.content || '';
    content = content.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(content);
    return parsed as AtsReport;
  } catch (error) {
    console.warn('[HF API] Falling back to local engine:', error);
    return analyzeResumeLocally(resumeText, targetRole);
  }
}

// ---------------------------------------------------------------------------
// Hugging Face Live Interactive Chatbot
// ---------------------------------------------------------------------------
export async function chatWithResumeCoach(
  messages: ChatMessage[],
  resumeText: string,
  targetRole: string = 'Software Engineer'
): Promise<{ text: string; action?: ChatAction }> {
  const apiKey = getStoredHfApiKey();
  const model = getStoredHfModel();
  const lastUserPrompt = messages[messages.length - 1]?.text || '';

  if (!apiKey) {
    return generateOfflineHelperReply(lastUserPrompt, resumeText, targetRole);
  }

  const systemPrompt = `You are "WorkZen Resume Coach", an expert career mentor, technical recruiter, and ATS specialist.
The user is working with you to improve their resume for the target role: "${targetRole}".
Resume Context:
"""
${resumeText.slice(0, 4000)}
"""

Your Instructions:
1. Reason dynamically and answer ANY question or request the user asks directly, naturally, and intelligently.
2. When rewriting bullet points, always apply the Google XYZ formula: "Accomplished [X] as measured by [Y], by doing [Z]" with measurable metrics and strong action verbs.
3. Whenever you propose a change, rewrite a bullet, remove content, or add skills/sections to the resume, explain your reasoning conversationally AND include a machine-readable action block at the very end of your message in this exact format:
\`\`\`action
{
  "type": "modify" | "remove" | "add",
  "title": "Short title describing the change",
  "originalText": "Exact quote of the sentence/bullet in the resume to modify or remove",
  "suggestedRewrite": "The exact final new text (leave empty string if type is remove)",
  "sectionTarget": "Target section name if type is add"
}
\`\`\`
4. "originalText" MUST be an exact quote from the user's current resume text so the system can locate and replace/remove it accurately.`;

  try {
    const formattedMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.slice(-10).map((m) => ({
        role: m.role === 'ai' ? 'assistant' : 'user',
        content: m.text,
      })),
    ];

    const res = await fetch(`https://router.huggingface.co/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: formattedMessages,
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.warn('[HF API] Chat error:', errText);
      return generateOfflineHelperReply(lastUserPrompt, resumeText, targetRole);
    }

    const data = await res.json();
    const rawReply = data.choices?.[0]?.message?.content || '';
    return extractChatAction(rawReply);
  } catch (error: unknown) {
    console.error('[HF API] Exception caught:', error);
    return generateOfflineHelperReply(lastUserPrompt, resumeText, targetRole);
  }
}
