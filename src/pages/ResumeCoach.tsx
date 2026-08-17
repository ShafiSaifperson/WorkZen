import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';import {
  Upload,
  FileText,
  Send,
  Loader2,
  Settings,
  RefreshCw,
  Bot,
  User,
  FileUp,
} from 'lucide-react';
import type { ChatMessage, AtsReport, ResumeData } from '@/lib/types';
import {
  analyzeResumeWithHF,
  chatWithResumeCoach,
  getStoredTargetRole,
  getStoredHfModel,
  getStoredHfApiKey,
} from '@/lib/hfClient';
import { extractTextFromFile, SAMPLE_RESUMES } from '@/lib/resumeParser';
import { ResumeReportCard } from '@/components/ResumeReportCard';
import { HfSettingsModal } from '@/components/HfSettingsModal';
import { useAuth } from '@/lib/auth';
import { applyToJob, fetchAppliedJobIds, fetchJobById } from '@/lib/data';
import type { Job } from '@/lib/types';

const QUICK_PROMPTS = [
  '✨ Rewrite my weakest bullet with metrics',
  '🎯 Check missing keywords for my target role',
  '✍️ Craft an ATS-friendly summary',
  '📊 How do I improve my impact score?',
];

export function ResumeCoachPage() {
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [report, setReport] = useState<AtsReport | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm0',
      role: 'ai',
      text: "👋 Welcome! I'm your **AI Resume Coach**. Upload your resume or load a sample on the right, and I'll generate a complete **ATS diagnostic report** and help you refine each bullet point!",
    },
  ]);
  const [input, setInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [targetRole, setTargetRole] = useState(getStoredTargetRole());
  const [activeTab, setActiveTab] = useState<'report' | 'text'>('report');
    const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [selectedJobLoading, setSelectedJobLoading] = useState(true);
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [applyingForSelectedJob, setApplyingForSelectedJob] = useState(false);
  const [applicationMessage, setApplicationMessage] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, analyzing, chatLoading]);
    useEffect(() => {
    const jobId = searchParams.get('jobId');

    if (!jobId || !user) {
      setSelectedJobLoading(false);
      return;
    }

    Promise.all([fetchJobById(jobId), fetchAppliedJobIds(user.id)])
      .then(([job, appliedJobIds]) => {
        setSelectedJob(job);
        setAlreadyApplied(appliedJobIds.includes(jobId));
      })
      .catch(() => {
        setApplicationMessage('The selected job could not be loaded.');
      })
      .finally(() => setSelectedJobLoading(false));
  }, [searchParams, user]);

  async function applyForSelectedJob() {
    if (!user || !selectedJob || alreadyApplied) return;

    setApplyingForSelectedJob(true);
    setApplicationMessage(null);

    try {
      await applyToJob(user.id, selectedJob.id);
      setAlreadyApplied(true);
      setApplicationMessage(`You successfully applied for ${selectedJob.title}.`);
    } catch (error) {
      setApplicationMessage((error as Error).message);
    } finally {
      setApplyingForSelectedJob(false);
    }
  }

  // Handle Resume Upload & Analysis
  async function processResume(rawText: string, fileName: string, fileSize: string) {
    setResumeData({
      rawText,
      fileName,
      fileSize,
      uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });

    setAnalyzing(true);
    try {
      const generatedReport = await analyzeResumeWithHF(rawText, targetRole);
      setReport(generatedReport);

      const aiMsg: ChatMessage = {
        id: `a_${Date.now()}`,
        role: 'ai',
        text: `🎯 **ATS Analysis Completed for ${targetRole}!**\n\n` +
          `• **Overall Match Score:** **${generatedReport.overallScore}/100**\n` +
          `• **Quantified Metrics Found:** ${generatedReport.stats.metricsCount}\n` +
          `• **Identified Skills:** ${generatedReport.detectedSkills.slice(0, 5).join(', ')}${generatedReport.detectedSkills.length > 5 ? '…' : ''}\n\n` +
          `Check out the report on the right! Ask me any questions or click a quick prompt below to begin optimizing your bullets.`,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error('Error analyzing resume:', err);
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await extractTextFromFile(file);
    const sizeStr = `${(file.size / 1024).toFixed(0)} KB`;
    await processResume(text, file.name, sizeStr);
  }

  async function handleLoadSample(index: number) {
    const sample = SAMPLE_RESUMES[index];
    setTargetRole(sample.role);
    await processResume(sample.text, sample.fileName, '240 KB');
  }

  async function handleSendMessage(customPrompt?: string) {
    const promptToSend = (customPrompt || input).trim();
    if (!promptToSend || chatLoading) return;

    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      role: 'user',
      text: promptToSend,
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setChatLoading(true);

    try {
      const resumeText = resumeData?.rawText || SAMPLE_RESUMES[0].text;
      const reply = await chatWithResumeCoach(newMessages, resumeText, targetRole);

      const aiReply: ChatMessage = {
        id: `a_${Date.now()}`,
        role: 'ai',
        text: reply,
      };
      setMessages((prev) => [...prev, aiReply]);
    } catch (err) {
      console.error('Chat error:', err);
    } finally {
      setChatLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl animate-fade-in pb-8">
      {/* Page Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-900 sm:text-3xl">
            AI Resume Coach
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            ATS scoring, section-by-section diagnostics, and real-time interactive AI coaching.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSettingsOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-ink-200 bg-white px-3.5 py-2 text-xs font-semibold text-ink-700 shadow-card transition hover:border-brand-400 hover:bg-brand-50/40"
          >
            <Settings className="h-4 w-4 text-brand-600" />
            <span>AI Model & Settings</span>
          </button>
        </div>
      </div>
            {!selectedJobLoading && selectedJob && (
        <div className="mb-6 rounded-2xl border border-brand-200 bg-brand-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
            Selected job
          </p>

          <h2 className="mt-1 font-display text-lg font-bold text-ink-900">
            {selectedJob.title}
          </h2>

          <p className="mt-1 text-sm text-ink-600">
            {selectedJob.company}
          </p>

          <button
            onClick={applyForSelectedJob}
            disabled={alreadyApplied || applyingForSelectedJob}
            className="mt-4 inline-flex items-center rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {applyingForSelectedJob
              ? 'Applying...'
              : alreadyApplied
                ? 'Already Applied'
                : 'Apply'}
          </button>

          {applicationMessage && (
            <p className="mt-3 text-sm font-medium text-ink-700">
              {applicationMessage}
            </p>
          )}
        </div>
      )}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Interactive Chatbot */}
        <div className="lg:col-span-7 flex flex-col">
          <div className="flex h-[720px] flex-col overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-card">
            {/* Chat header */}
            <div className="flex items-center justify-between border-b border-ink-100 px-5 py-3.5 bg-ink-50/50">
              <div className="flex items-center gap-3">
                <div className="relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-soft">
                  <Bot className="h-5 w-5" />
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white ${
                      getStoredHfApiKey() ? 'bg-accent-500' : 'bg-amber-500'
                    }`}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-ink-900">Coach Chat</p>
                    <button
                      onClick={() => setSettingsOpen(true)}
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold transition border ${
                        getStoredHfApiKey()
                          ? 'bg-accent-50 text-accent-700 border-accent-200 hover:bg-accent-100'
                          : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                      }`}
                    >
                      {getStoredHfApiKey()
                        ? `🟢 Live: ${getStoredHfModel().split('/')[1] || 'Qwen 2.5'}`
                        : '⚡ Connect HF Token'}
                    </button>
                  </div>
                  <p className="text-xs text-ink-400">Targeting: {targetRole}</p>
                </div>
              </div>

              {resumeData && (
                <button
                  onClick={() => processResume(resumeData.rawText, resumeData.fileName, resumeData.fileSize)}
                  disabled={analyzing}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 disabled:opacity-50"
                  title="Re-run ATS scan"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${analyzing ? 'animate-spin' : ''}`} />
                  Re-scan
                </button>
              )}
            </div>

            {/* Messages Thread */}
            <div
              ref={scrollRef}
              className="flex-1 space-y-4 overflow-y-auto scrollbar-thin bg-gradient-to-b from-ink-50/40 to-white px-5 py-5"
            >
              {messages.map((m) => {
                const isUser = m.role === 'user';
                return (
                  <div
                    key={m.id}
                    className={`flex items-start gap-2.5 ${isUser ? 'justify-end' : 'justify-start'} animate-slide-in`}
                  >
                    {!isUser && (
                      <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-brand-600 text-white shadow-soft">
                        <Bot className="h-4 w-4" />
                      </div>
                    )}
                    <div
                      className={`max-w-[84%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${isUser
                          ? 'rounded-tr-sm bg-brand-600 text-white shadow-soft'
                          : 'rounded-tl-sm border border-ink-200/80 bg-white text-ink-800 shadow-soft'
                        }`}
                    >
                      <div className="whitespace-pre-line prose-sm">{m.text}</div>
                    </div>
                    {isUser && (
                      <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-ink-800 text-white shadow-soft">
                        <User className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Typing / Analyzing state */}
              {(analyzing || chatLoading) && (
                <div className="flex items-center gap-2 text-xs font-medium text-ink-500 animate-fade-in pl-9">
                  <Loader2 className="h-4 w-4 animate-spin text-brand-600" />
                  <span>{analyzing ? 'Evaluating ATS score & section breakdown…' : 'Coach is thinking…'}</span>
                </div>
              )}
            </div>

            {/* Quick Prompt Pills */}
            <div className="border-t border-ink-100 bg-ink-50/60 px-4 py-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink-400 mb-1.5">
                Quick Actions
              </p>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleSendMessage(prompt)}
                    disabled={chatLoading || analyzing}
                    className="rounded-lg border border-ink-200 bg-white px-2.5 py-1 text-xs font-medium text-ink-700 transition hover:border-brand-400 hover:bg-brand-50 disabled:opacity-50"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Bar */}
            <div className="border-t border-ink-100 p-3 bg-white">
              <div className="flex items-center gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder={
                    resumeData
                      ? 'Ask coach to rewrite a bullet, add keywords, or evaluate a section…'
                      : 'Upload a resume or ask any resume coaching question…'
                  }
                  className="h-11 flex-1 rounded-xl border border-ink-200 bg-ink-50 px-4 text-sm outline-none transition focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={!input.trim() || chatLoading}
                  className="grid h-11 w-11 place-items-center rounded-xl bg-brand-600 text-white shadow-soft transition hover:bg-brand-700 disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Resume Upload & ATS Report Card */}
        <div className="lg:col-span-5 space-y-5">
          {/* Upload / Resume Status Box */}
          <div className="rounded-2xl border border-ink-200 bg-white p-5 shadow-card">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-bold text-ink-900">Your Resume</h3>
              {resumeData && (
                <div className="flex items-center gap-1 rounded-lg bg-ink-100 p-0.5 text-xs">
                  <button
                    onClick={() => setActiveTab('report')}
                    className={`rounded-md px-2.5 py-1 font-semibold transition ${activeTab === 'report' ? 'bg-white text-ink-900 shadow-soft' : 'text-ink-500'
                      }`}
                  >
                    Report
                  </button>
                  <button
                    onClick={() => setActiveTab('text')}
                    className={`rounded-md px-2.5 py-1 font-semibold transition ${activeTab === 'text' ? 'bg-white text-ink-900 shadow-soft' : 'text-ink-500'
                      }`}
                  >
                    Raw Text
                  </button>
                </div>
              )}
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".pdf,.txt,.docx,.md"
              className="hidden"
            />

            {!resumeData ? (
              <div className="mt-3">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full flex-col items-center justify-center gap-2.5 rounded-xl border-2 border-dashed border-ink-200 px-4 py-8 text-center transition hover:border-brand-400 hover:bg-brand-50/40"
                >
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-brand-50 text-brand-600">
                    <Upload className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-ink-800">Click to upload your resume</p>
                    <p className="text-[11px] text-ink-400">PDF, DOCX, TXT, or Markdown</p>
                  </div>
                </button>

                {/* Instant Sample Resumes */}
                <div className="mt-4 border-t border-ink-100 pt-3">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-ink-400">
                    Or try a sample resume:
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {SAMPLE_RESUMES.map((sample, idx) => (
                      <button
                        key={sample.name}
                        onClick={() => handleLoadSample(idx)}
                        className="flex items-center gap-2 rounded-xl border border-ink-200 bg-ink-50/80 p-2 text-left transition hover:border-brand-400 hover:bg-brand-50"
                      >
                        <FileText className="h-4 w-4 shrink-0 text-brand-600" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold text-ink-800">{sample.name}</p>
                          <p className="truncate text-[10px] text-ink-400">{sample.role}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-3 space-y-3">
                <div className="flex items-center justify-between rounded-xl border border-ink-200 bg-ink-50 p-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand-600 text-white">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-ink-900">{resumeData.fileName}</p>
                      <p className="text-[10px] text-ink-400">{resumeData.fileSize} · {resumeData.uploadedAt}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1 rounded-lg border border-ink-200 bg-white px-2.5 py-1 text-xs font-semibold text-ink-700 hover:bg-ink-50"
                  >
                    <FileUp className="h-3.5 w-3.5" />
                    Replace
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Report Display or Raw Text Display */}
          {resumeData && activeTab === 'text' && (
            <div className="rounded-2xl border border-ink-200 bg-white p-5 shadow-card animate-fade-in">
              <h4 className="font-display text-sm font-bold text-ink-900">Extracted Resume Content</h4>
              <pre className="mt-3 max-h-[500px] overflow-y-auto rounded-xl bg-ink-50 p-3 text-xs leading-relaxed text-ink-800 whitespace-pre-wrap font-mono scrollbar-thin">
                {resumeData.rawText}
              </pre>
            </div>
          )}

          {report && activeTab === 'report' && (
            <ResumeReportCard
              report={report}
              onAskCoach={(customPrompt) => handleSendMessage(customPrompt)}
            />
          )}
        </div>
      </div>

      {/* Hugging Face Settings Modal */}
      <HfSettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSaved={() => {
          setTargetRole(getStoredTargetRole());
          if (resumeData) {
            processResume(resumeData.rawText, resumeData.fileName, resumeData.fileSize);
          }
        }}
      />
    </div>
  );
}
