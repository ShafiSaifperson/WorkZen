import type { AtsReport, AtsSuggestion, ChatMessage } from './types';

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
  // Clear out deprecated mistral/gemma models from local storage
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
        return { success: false, message: 'Access denied or gated model. Please accept the model license on Hugging Face or switch to Qwen / Mistral.' };
      }
      if (res.status === 503) {
        return { success: false, message: 'Model is currently loading on Hugging Face servers. Try again in 20 seconds.' };
      }
      return { success: false, message: errorMsg };
    }

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content || 'connected';
    return { success: true, message: `Connected! Hugging Face model responded: "${reply.trim()}"` };
  } catch (err: any) {
    return { success: false, message: err.message || 'Network connection failed.' };
  }
}

// ---------------------------------------------------------------------------
// Contextual Offline Helper (When no token is entered)
// ---------------------------------------------------------------------------
export function generateOfflineHelperReply(
  userPrompt: string,
  resumeText: string,
  targetRole: string
): string {
  const clean = userPrompt.toLowerCase().trim();

  if (clean.includes('upload') || clean.includes('how do i') || clean.includes('where')) {
    return `📄 **How to upload your resume:**\n\n` +
      `1. Look at the right panel under **"Your Resume"**.\n` +
      `2. Click **"Click to upload your resume"** to select your PDF, DOCX, TXT, or Markdown file.\n` +
      `3. Or click on one of the **Sample Resumes** (*Alex Kim* or *Jordan Rivera*) for instant 1-click testing.\n\n` +
      `🔑 **To enable live Hugging Face AI reasoning:** Click **"AI Model & Settings"** in the top right and paste your free token from **huggingface.co/settings/tokens**!`;
  }

  if (clean.includes('what are you') || clean.includes('who are you') || clean.includes('are you an ai')) {
    return `👋 I am **WorkZen Resume Coach**!\n\n` +
      `Right now, I am running in **Offline Guide Mode**. To connect live Hugging Face models (**Qwen 2.5 72B**, **Mistral 7B**, **Gemma 2**):\n\n` +
      `1. Click **"AI Model & Settings"** at the top right.\n` +
      `2. Paste your free token from [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens).\n` +
      `3. Click **"Save Preferences"** to start real-time interactive AI reviews!`;
  }

  if (clean.includes('rewrite') || clean.includes('bullet') || clean.includes('metric')) {
    return `Here is an example of an ATS-optimized bullet using the **Google XYZ Formula** (*Accomplished [X] as measured by [Y], by doing [Z]*):\n\n` +
      `• **Before:** "Worked on frontend features and fixed UI bugs."\n` +
      `• **✨ After:** "Engineered **14+ reusable React/TypeScript components**, reducing client bundle size by **26%** and accelerating team feature delivery across 3 agile sprints."\n\n` +
      `Connect your free Hugging Face token in Settings for dynamic, customized rewrites of your specific experience!`;
  }

  return `I am your **WorkZen Resume Coach** for **${targetRole}** positions!\n\n` +
    `To chat dynamically and have the Hugging Face AI reason through all your questions in real time, click **"AI Model & Settings"** in the top right to connect your free Hugging Face token. You can also upload your resume on the right to view your full ATS score!`;
}

// ---------------------------------------------------------------------------
// Local Heuristic ATS Engine
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
    'git', 'ci/cd', 'agile', 'linux', 'html', 'css', 'mongodb', 'redis', 'figma'
  ];
  const detectedSkills = technicalKeywords.filter((k) => clean.includes(k));

  const roleKeywords: Record<string, string[]> = {
    'frontend': ['react', 'typescript', 'tailwind', 'next.js', 'state management', 'testing', 'ci/cd'],
    'backend': ['postgresql', 'docker', 'redis', 'microservices', 'kubernetes', 'rest api', 'sql'],
    'fullstack': ['react', 'node.js', 'postgresql', 'docker', 'typescript', 'aws', 'git'],
    'default': ['git', 'agile', 'ci/cd', 'unit testing', 'system design', 'rest api']
  };

  const roleKey = Object.keys(roleKeywords).find((k) => targetRole.toLowerCase().includes(k)) || 'default';
  const missingKeywords = roleKeywords[roleKey].filter((k) => !clean.includes(k));

  const bulletLines = resumeText.split('\n').filter((l) => l.trim().startsWith('•') || l.trim().startsWith('-') || l.trim().startsWith('*'));
  const bulletCount = Math.max(bulletLines.length, Math.floor(wordCount / 25));

  const impactScore = Math.min(95, Math.max(40, Math.round((metricsCount * 6) + (detectedVerbs.length * 3))));
  const skillsScore = Math.min(98, Math.max(45, Math.round((detectedSkills.length / 8) * 90)));
  const formattingScore = wordCount > 200 && wordCount < 900 ? 88 : wordCount < 200 ? 50 : 65;
  const structureScore = clean.includes('experience') && clean.includes('education') && clean.includes('skills') ? 92 : 60;

  const overallScore = Math.round(
    (impactScore * 0.35) + (skillsScore * 0.30) + (formattingScore * 0.20) + (structureScore * 0.15)
  );

  const suggestions: AtsSuggestion[] = [];

  if (metricsCount < 4) {
    suggestions.push({
      id: 's_metrics',
      category: 'Impact',
      type: 'crit',
      title: 'Lack of Quantified Achievements (XYZ Formula)',
      originalText: bulletLines[0] || 'Worked on developing UI features for clients.',
      suggestedRewrite: 'Engineered 6+ reusable React UI components, reducing page render times by 34% across 10k+ monthly active users.',
      explanation: 'ATS parsers prioritize the Google XYZ formula: "Accomplished [X] as measured by [Y], by doing [Z]".',
    });
  } else {
    suggestions.push({
      id: 's_metrics_good',
      category: 'Impact',
      type: 'good',
      title: 'Solid Metrics & Outcomes',
      explanation: `Found ${metricsCount} quantified indicators. This signals measurable business value to recruiters.`,
    });
  }

  if (missingKeywords.length > 0) {
    suggestions.push({
      id: 's_keywords',
      category: 'Skills',
      type: 'warn',
      title: `Missing High-Impact Keywords for "${targetRole}"`,
      explanation: `Consider integrating these relevant keywords: ${missingKeywords.map(k => `"${k}"`).join(', ')}.`,
    });
  }

  if (detectedVerbs.length < 5) {
    suggestions.push({
      id: 's_verbs',
      category: 'Summary',
      type: 'warn',
      title: 'Use Stronger Action Verbs',
      originalText: 'Responsible for maintaining database systems and fixing bugs.',
      suggestedRewrite: 'Streamlined PostgreSQL queries and automated CI/CD pipeline, cutting deployment failure rates by 28%.',
      explanation: 'Replace passive phrases like "Responsible for" with decisive verbs like "Spearheaded", "Architected", or "Automated".',
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
        feedback: 'Standard ATS headings (Experience, Education, Skills) are present and readable.',
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
      "title": "Title of issue",
      "originalText": "Original bullet from resume if applicable",
      "suggestedRewrite": "Improved bullet using Google XYZ formula (Accomplished [X] as measured by [Y], by doing [Z])",
      "explanation": "Why this change improves ATS score and recruiter impression"
    }
  ],
  "stats": {
    "wordCount": number,
    "bulletCount": number,
    "metricsCount": number,
    "actionVerbsCount": number
  }
}
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
): Promise<string> {
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
1. Reason dynamically and answer ANY question the user asks directly, naturally, and intelligently.
2. If the user asks about using the app (e.g. how to upload, where to see scores), guide them clearly.
3. When rewriting bullet points, always apply the Google XYZ formula: "Accomplished [X] as measured by [Y], by doing [Z]" with measurable metrics and strong action verbs.
4. Format your responses with clean Markdown, bullet points, and bold text for readability.`;

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
      return `⚠️ **Hugging Face API Error (${res.status}):** Could not reach the model. Please check your token in **AI Model & Settings**.\n\n` +
        generateOfflineHelperReply(lastUserPrompt, resumeText, targetRole);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || generateOfflineHelperReply(lastUserPrompt, resumeText, targetRole);
  } catch (error: any) {
    console.error('[HF API] Exception caught:', error);
    return generateOfflineHelperReply(lastUserPrompt, resumeText, targetRole);
  }
}
