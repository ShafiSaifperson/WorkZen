import { useState, useRef, useEffect } from 'react';
import { Upload, FileText, Sparkles, Send, Loader2, CheckCircle2, AlertCircle, Lightbulb } from 'lucide-react';
import type { ChatMessage } from '@/lib/types';

const initialMessages: ChatMessage[] = [
  {
    id: 'm0',
    role: 'ai',
    text: "Hi Alex! I'm your AI resume coach. Upload your resume and I'll evaluate it — scoring each section and suggesting concrete improvements you can make right away.",
  },
];

const sampleSuggestions = [
  {
    icon: AlertCircle,
    title: 'Summary is too vague',
    body: 'Replace generic phrases like "passionate team player" with a quantified achievement, e.g. "Built a React dashboard used by 4,000+ students".',
    tone: 'warn',
  },
  {
    icon: Lightbulb,
    title: 'Add measurable impact',
    body: 'Your experience bullets describe tasks, not outcomes. Add 1–2 metrics per role (e.g. "cut load time by 38%").',
    tone: 'tip',
  },
  {
    icon: CheckCircle2,
    title: 'Skills section is strong',
    body: 'Your React, TypeScript, and PostgreSQL tags align well with the roles you\'re targeting. Keep these front and center.',
    tone: 'good',
  },
];

const toneStyles: Record<string, string> = {
  warn: 'border-amber-200 bg-amber-50 text-amber-700',
  tip: 'border-brand-200 bg-brand-50 text-brand-700',
  good: 'border-accent-200 bg-accent-50 text-accent-700',
};

const followUpFlow: ChatMessage[] = [
  {
    id: 'm1',
    role: 'ai',
    text: "Great — I've reviewed your resume. Here's my overall assessment along with three priority suggestions:",
  },
  {
    id: 'm2',
    role: 'ai',
    text: 'Overall score: 72 / 100. Your layout and skills are solid, but your experience bullets and summary need work to stand out for mid-level engineering roles.',
  },
];

export function ResumeCoachPage() {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState('');
  const [uploaded, setUploaded] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, showSuggestions]);

  function handleUpload() {
    setUploaded(true);
    setAnalyzing(true);
    setTimeout(() => {
      setAnalyzing(false);
      setShowSuggestions(true);
      setMessages((prev) => [...prev, ...followUpFlow]);
    }, 2000);
  }

  function send() {
    if (!input.trim()) return;
    const userMsg: ChatMessage = { id: `u${Date.now()}`, role: 'user', text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setTimeout(() => {
      const aiMsg: ChatMessage = {
        id: `a${Date.now()}`,
        role: 'ai',
        text: "Good question. For your specific situation, I'd recommend leading each bullet with a strong action verb and a quantified result. For example: \"Reduced API response time by 42% by introducing query caching.\" Want me to rewrite a specific bullet for you?",
      };
      setMessages((prev) => [...prev, aiMsg]);
    }, 900);
  }

  return (
    <div className="mx-auto max-w-4xl animate-fade-in">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-ink-900 sm:text-3xl">Resume Coach</h1>
        <p className="mt-1 text-sm text-ink-500">
          Upload your resume and chat with AI to get tailored, actionable feedback.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Chat */}
        <div className="lg:col-span-3">
          <div className="flex h-[600px] flex-col overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-card">
            {/* Chat header */}
            <div className="flex items-center gap-3 border-b border-ink-100 px-5 py-4">
              <div className="relative grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white">
                <Sparkles className="h-5 w-5" />
                <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white bg-accent-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink-900">AI Resume Coach</p>
                <p className="text-xs text-accent-600">Online</p>
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto scrollbar-thin bg-ink-50 px-5 py-5">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-in`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      m.role === 'user'
                        ? 'rounded-br-md bg-brand-600 text-white'
                        : 'rounded-bl-md bg-white text-ink-700 shadow-soft'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              {analyzing && (
                <div className="flex justify-start animate-slide-in">
                  <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md bg-white px-4 py-3 shadow-soft">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="h-2 w-2 rounded-full bg-ink-300"
                        style={{ animation: `pulse 1s ${i * 0.15}s infinite` }}
                      />
                    ))}
                  </div>
                </div>
              )}
              {showSuggestions && (
                <div className="space-y-2.5 animate-fade-in">
                  {sampleSuggestions.map((s) => (
                    <div
                      key={s.title}
                      className={`flex items-start gap-3 rounded-xl border p-3.5 ${toneStyles[s.tone]}`}
                    >
                      <s.icon className="mt-0.5 h-4 w-4 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold">{s.title}</p>
                        <p className="mt-0.5 text-xs leading-relaxed opacity-90">{s.body}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Input */}
            <div className="border-t border-ink-100 p-4">
              <div className="flex items-center gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && send()}
                  placeholder="Ask a question about your resume…"
                  className="h-11 flex-1 rounded-xl border border-ink-200 bg-ink-50 px-4 text-sm outline-none transition focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
                />
                <button
                  onClick={send}
                  className="grid h-11 w-11 place-items-center rounded-xl bg-brand-600 text-white transition hover:bg-brand-700"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Upload panel */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-ink-200 bg-white p-6 shadow-card">
            <h3 className="font-display text-base font-bold text-ink-900">Your resume</h3>
            <p className="mt-1 text-xs text-ink-400">PDF or DOCX, up to 5MB</p>

            {!uploaded ? (
              <button
                onClick={handleUpload}
                className="mt-4 flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-ink-200 px-6 py-10 text-center transition hover:border-brand-400 hover:bg-brand-50/40"
              >
                <div className="grid h-12 w-12 place-items-center rounded-full bg-brand-50 text-brand-600">
                  <Upload className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink-700">Click to upload</p>
                  <p className="text-xs text-ink-400">or drag and drop your file</p>
                </div>
              </button>
            ) : (
              <div className="mt-4 animate-scale-in space-y-4">
                <div className="flex items-center gap-3 rounded-xl border border-ink-200 bg-ink-50 p-3.5">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-brand-600 text-white">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-semibold text-ink-900">Alex_Kim_Resume.pdf</p>
                    <p className="text-xs text-ink-400">214 KB</p>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-accent-500" />
                </div>

                {analyzing ? (
                  <div className="rounded-xl border border-brand-200 bg-brand-50 p-4 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-brand-600" />
                    <p className="mt-2 text-sm font-medium text-brand-700">Analyzing your resume…</p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-ink-200 bg-ink-50 p-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-ink-700">Overall score</p>
                      <p className="font-display text-2xl font-extrabold text-brand-600">72</p>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-ink-200">
                      <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-accent-500" style={{ width: '72%' }} />
                    </div>
                    <p className="mt-2 text-xs text-ink-400">Good foundation — a few tweaks will make it stand out.</p>
                  </div>
                )}
              </div>
            )}

            <div className="mt-6 rounded-xl bg-ink-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-500">Tips</p>
              <ul className="mt-2 space-y-1.5 text-xs text-ink-500">
                <li>• Use a single column, ATS-friendly layout</li>
                <li>• Quantify every achievement you can</li>
                <li>• Mirror keywords from the job posting</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
