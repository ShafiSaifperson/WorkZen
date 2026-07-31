import { useState, useEffect } from 'react';
import {
  PenLine,
  Sparkles,
  Loader2,
  Copy,
  Check,
  FileDown,
  Briefcase,
  Building2,
} from 'lucide-react';
import { fetchJobs } from '@/lib/data';
import type { Job } from '@/lib/types';

export function CoverLetterPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>('');
  const [tone, setTone] = useState<'professional' | 'enthusiastic' | 'concise'>('professional');
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchJobs().then((j) => {
      setJobs(j);
      if (j.length > 0) setSelectedJobId(j[0].id);
    });
  }, []);

  const selectedJob = jobs.find((j) => j.id === selectedJobId) ?? jobs[0];

  if (!selectedJob) {
    return (
      <div className="mx-auto max-w-5xl animate-fade-in">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold text-ink-900 sm:text-3xl">Cover Letter Generator</h1>
          <p className="mt-1 text-sm text-ink-500">
            Pick a job and let AI craft a tailored cover letter in seconds.
          </p>
        </div>
        <div className="grid place-items-center rounded-2xl border border-ink-200 bg-white p-12 shadow-card">
          <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
          <p className="mt-3 text-sm text-ink-500">Loading jobs…</p>
        </div>
      </div>
    );
  }

  const sampleLetter = `Dear Hiring Manager,

I am writing to express my strong interest in the ${selectedJob.title} position at ${selectedJob.company}. With a background in building user-facing applications and a passion for clean, maintainable code, I am excited about the opportunity to contribute to your team.

In my most recent project, I led the development of a React + TypeScript dashboard that serves over 4,000 active users, reducing page load time by 38% through code-splitting and memoization. This experience deepened my expertise in ${selectedJob.tags.slice(0, 2).join(' and ')}, which I see are central to this role.

What draws me to ${selectedJob.company} is your commitment to building thoughtful, high-impact product experiences. I thrive in environments that value ownership and craft, and I am eager to bring that same bias for action to your team.

Thank you for considering my application. I would welcome the opportunity to discuss how my skills and enthusiasm align with ${selectedJob.company}'s goals.

Warm regards,
Alex Kim`;

  function generate() {
    setGenerating(true);
    setGenerated(false);
    setTimeout(() => {
      setGenerating(false);
      setGenerated(true);
    }, 1800);
  }

  function copy() {
    navigator.clipboard?.writeText(sampleLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const tones = [
    { id: 'professional', label: 'Professional' },
    { id: 'enthusiastic', label: 'Enthusiastic' },
    { id: 'concise', label: 'Concise' },
  ] as const;

  return (
    <div className="mx-auto max-w-5xl animate-fade-in">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-ink-900 sm:text-3xl">Cover Letter Generator</h1>
        <p className="mt-1 text-sm text-ink-500">
          Pick a job and let AI craft a tailored cover letter in seconds.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Config */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-ink-200 bg-white p-6 shadow-card">
            <h3 className="font-display text-base font-bold text-ink-900">1. Choose a job</h3>
            <div className="mt-3 max-h-72 space-y-2 overflow-y-auto scrollbar-thin pr-1">
              {jobs.map((j) => (
                <button
                  key={j.id}
                  onClick={() => {
                    setSelectedJobId(j.id);
                    setGenerated(false);
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
                    selectedJobId === j.id
                      ? 'border-brand-400 bg-brand-50'
                      : 'border-ink-200 hover:bg-ink-50'
                  }`}
                >
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-ink-900 text-xs font-bold text-white">
                    {j.logo}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-semibold text-ink-900">{j.title}</p>
                    <p className="truncate text-xs text-ink-400">{j.company}</p>
                  </div>
                  {selectedJobId === j.id && (
                    <Check className="h-4 w-4 shrink-0 text-brand-600" />
                  )}
                </button>
              ))}
            </div>

            <h3 className="mt-6 font-display text-base font-bold text-ink-900">2. Pick a tone</h3>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {tones.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setTone(t.id);
                    setGenerated(false);
                  }}
                  className={`rounded-xl border px-3 py-2.5 text-xs font-medium transition ${
                    tone === t.id
                      ? 'border-brand-400 bg-brand-50 text-brand-700'
                      : 'border-ink-200 text-ink-600 hover:bg-ink-50'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <button
              onClick={generate}
              disabled={generating}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 px-5 py-3.5 text-sm font-semibold text-white shadow-soft transition hover:from-brand-700 hover:to-brand-800 disabled:opacity-60"
            >
              {generating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {generating ? 'Generating…' : 'Generate cover letter'}
            </button>
          </div>
        </div>

        {/* Preview */}
        <div className="lg:col-span-3">
          <div className="rounded-2xl border border-ink-200 bg-white shadow-card">
            {/* Preview header */}
            <div className="flex items-center justify-between border-b border-ink-100 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-ink-900 text-white">
                  <PenLine className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink-900">Preview</p>
                  <div className="flex items-center gap-2 text-xs text-ink-400">
                    <Briefcase className="h-3 w-3" /> {selectedJob.title}
                    <span className="text-ink-300">·</span>
                    <Building2 className="h-3 w-3" /> {selectedJob.company}
                  </div>
                </div>
              </div>
              {generated && (
                <div className="flex gap-2">
                  <button
                    onClick={copy}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 px-3 py-1.5 text-xs font-medium text-ink-600 transition hover:bg-ink-50"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-accent-600" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                  <button className="inline-flex items-center gap-1.5 rounded-lg border border-ink-200 px-3 py-1.5 text-xs font-medium text-ink-600 transition hover:bg-ink-50">
                    <FileDown className="h-3.5 w-3.5" /> Download
                  </button>
                </div>
              )}
            </div>

            {/* Letter body */}
            <div className="min-h-[420px] p-6 sm:p-8">
              {!generated && !generating && (
                <div className="flex h-[380px] flex-col items-center justify-center text-center">
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-50 text-brand-600">
                    <Sparkles className="h-7 w-7" />
                  </div>
                  <p className="mt-4 text-sm font-medium text-ink-700">
                    Your cover letter will appear here
                  </p>
                  <p className="mt-1 max-w-xs text-xs text-ink-400">
                    Select a job, choose a tone, and hit generate to see a tailored draft.
                  </p>
                </div>
              )}

              {generating && (
                <div className="flex h-[380px] flex-col items-center justify-center text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
                  <p className="mt-4 text-sm font-medium text-ink-700">
                    Crafting your cover letter…
                  </p>
                  <p className="mt-1 text-xs text-ink-400">
                    Tailoring to {selectedJob.company} · {tone} tone
                  </p>
                </div>
              )}

              {generated && (
                <div className="animate-fade-in whitespace-pre-line text-sm leading-relaxed text-ink-700">
                  {sampleLetter}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
