import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Upload,
  FileText,
  Send,
  Loader2,
  Settings,
  RefreshCw,
  Bot,
  User,
  FileUp,
  Download,
  Undo2,
  RotateCcw,
  CheckCheck,
  ChevronDown,
  Sparkles,
  Printer,
  FileCode,
  FileType,
  Edit3,
  Check,
  Eye,
  Code2,
  Wand2,
  Trash2,
  PlusCircle,
} from 'lucide-react';
import type {
  ChatMessage,
  AtsReport,
  ResumeData,
  AtsSuggestion,
  ResumeAppliedChange,
  Job,
  ChatAction,
} from '@/lib/types';
import {
  analyzeResumeWithHF,
  chatWithResumeCoach,
  getStoredTargetRole,
  getStoredHfModel,
  getStoredHfApiKey,
} from '@/lib/hfClient';
import { extractTextFromFile, SAMPLE_RESUMES, sanitizeAndCleanText, normalizeResumeText } from '@/lib/resumeParser';
import {
  exportAsPdf,
  exportAsWordDoc,
  exportAsTxt,
  exportAsMarkdown,
  formatResumeToHtml,
} from '@/lib/resumeExporter';
import { ResumeReportCard, PriorityActionItems } from '@/components/ResumeReportCard';
import { HfSettingsModal } from '@/components/HfSettingsModal';
import { useAuth } from '@/lib/auth';
import { applyToJob, fetchAppliedJobIds, fetchJobById } from '@/lib/data';
import { getSavedResume } from '@/lib/savedResume';
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
  const [appliedChanges, setAppliedChanges] = useState<ResumeAppliedChange[]>([]);
  const [, setHistoryStack] = useState<string[]>([]);
  const [isEditingManually, setIsEditingManually] = useState(false);
  const [manualEditText, setManualEditText] = useState('');
  const [downloadDropdownOpen, setDownloadDropdownOpen] = useState(false);
  const [previewSubTab, setPreviewSubTab] = useState<'visual' | 'raw'>('visual');

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm0',
      role: 'ai',
      text: "👋 Welcome! I'm your **AI Resume Coach**. Upload your resume or load a sample on the right, and I'll generate a complete **ATS diagnostic report**, help you brainstorm improvements in chat, and **apply changes directly to your resume with instant undo and download**!",
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

  const [isDragging, setIsDragging] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const downloadMenuRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

  // Prevent browser from opening dragged files in a new tab
  useEffect(() => {
    const preventDefault = (e: DragEvent) => {
      e.preventDefault();
    };
    window.addEventListener('dragover', preventDefault);
    window.addEventListener('drop', preventDefault);
    return () => {
      window.removeEventListener('dragover', preventDefault);
      window.removeEventListener('drop', preventDefault);
    };
  }, []);

  // Close download dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (downloadMenuRef.current && !downloadMenuRef.current.contains(e.target as Node)) {
        setDownloadDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    useEffect(() => {
    if (!user || searchParams.get('loadSavedResume') !== 'true') return;

    const savedResume = getSavedResume(user.id);

    if (!savedResume) {
      window.alert('You have not saved a resume yet. Please upload one first.');
      return;
    }

    processResume(
      savedResume.rawText,
      savedResume.fileName,
      savedResume.fileSize
    );
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
    const cleanText = sanitizeAndCleanText(rawText);

    setResumeData({
      rawText: cleanText,
      originalRawText: cleanText,
      fileName,
      fileSize,
      uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });
    setAppliedChanges([]);
    setHistoryStack([]);
    setManualEditText(cleanText);
    setIsEditingManually(false);

    setAnalyzing(true);
    try {
      const generatedReport = await analyzeResumeWithHF(cleanText, targetRole);
      setReport(generatedReport);

      const aiMsg: ChatMessage = {
        id: `a_${Date.now()}`,
        role: 'ai',
        text: `🎯 **ATS Analysis Completed for ${targetRole}!**\n\n` +
          `• **Overall Match Score:** **${generatedReport.overallScore}/100**\n` +
          `• **Quantified Metrics Found:** ${generatedReport.stats.metricsCount}\n` +
          `• **Identified Skills:** ${generatedReport.detectedSkills.slice(0, 5).join(', ')}${generatedReport.detectedSkills.length > 5 ? '…' : ''}\n\n` +
          `You can click **"Apply"** on any suggestion in the report, or chat with me to make custom rewrites and additions!`,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error('Error analyzing resume:', err);
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleFile(file: File) {
    if (!file) return;

    setAnalyzing(true);
    try {
      const text = await extractTextFromFile(file);
      if (!text || text.trim().length < 30) {
        alert('Could not extract readable text from this file. Please ensure it is not a scanned image/photo PDF.');
        return;
      }
      const sizeStr = `${(file.size / 1024).toFixed(0)} KB`;
      await processResume(text, file.name, sizeStr);
    } catch (err: any) {
      console.error('File extraction error:', err);
      alert(err.message || 'Failed to read the uploaded resume file.');
    } finally {
      setAnalyzing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFile(file);
    }
  }

  async function handleLoadSample(index: number) {
    const sample = SAMPLE_RESUMES[index];
    setTargetRole(sample.role);
    await processResume(sample.text, sample.fileName, '240 KB');
  }

  // ---------------------------------------------------------------------------
  // Focus / Navigate to Chat Immediately on "Ask Coach"
  // ---------------------------------------------------------------------------
  function handleAskCoach(prompt: string) {
    handleSendMessage(prompt);
    // Smooth scroll to chat container & focus input immediately
    chatContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    setTimeout(() => {
      chatInputRef.current?.focus();
    }, 150);
  }

  // ---------------------------------------------------------------------------
  // Core Mutation: In-Place Modify / Remove / Add
  // ---------------------------------------------------------------------------
  function applyChangeToResume(
    changeId: string,
    title: string,
    actionType: 'modify' | 'remove' | 'add',
    originalText: string,
    suggestedRewrite: string,
    sectionTarget?: string
  ) {
    if (!resumeData) return;

    const currentText = resumeData.rawText;
    let updatedText = currentText;
    const target = originalText.trim();
    const rewrite = suggestedRewrite.trim();

    if (actionType === 'remove' || (!rewrite && target)) {
      // 1. REMOVAL: Delete specific line or matching sentence
      if (currentText.includes(target)) {
        const lines = currentText.split('\n');
        const filtered = lines.filter((l) => !l.includes(target) && l.trim() !== target);
        updatedText = filtered.join('\n');
      } else {
        const targetWords = target.split(/\s+/).filter((w) => w.length > 3);
        const lines = currentText.split('\n');
        const matchIndex = lines.findIndex((l) => {
          const count = targetWords.filter((w) => l.toLowerCase().includes(w.toLowerCase())).length;
          return count >= Math.min(3, targetWords.length);
        });
        if (matchIndex !== -1) {
          lines.splice(matchIndex, 1);
          updatedText = lines.join('\n');
        }
      }
    } else if (actionType === 'modify') {
      // 2. MODIFICATION: Replace target sentence/bullet with suggested rewrite
      if (target && currentText.includes(target)) {
        updatedText = currentText.replace(target, rewrite);
      } else if (target) {
        const targetWords = target.split(/\s+/).filter((w) => w.length > 3);
        const lines = currentText.split('\n');
        const matchIndex = lines.findIndex((l) => {
          const count = targetWords.filter((w) => l.toLowerCase().includes(w.toLowerCase())).length;
          return count >= Math.min(3, targetWords.length);
        });

        if (matchIndex !== -1) {
          const originalLine = lines[matchIndex];
          const prefix = originalLine.match(/^(\s*[•\-*]\s*)/)?.[0] || '• ';
          lines[matchIndex] = `${prefix}${rewrite.replace(/^[•\-*]\s*/, '')}`;
          updatedText = lines.join('\n');
        } else {
          updatedText = `${currentText}\n• ${rewrite.replace(/^[•\-*]\s*/, '')}`;
        }
      } else {
        updatedText = `${currentText}\n• ${rewrite.replace(/^[•\-*]\s*/, '')}`;
      }
    } else if (actionType === 'add') {
      // 3. ADDITION: Add new line under specified section
      const section = (sectionTarget || 'SKILLS').toUpperCase();
      const lines = currentText.split('\n');
      const secIndex = lines.findIndex((l) => l.toUpperCase().includes(section));

      if (secIndex !== -1) {
        lines.splice(secIndex + 1, 0, rewrite.startsWith('•') ? rewrite : `• ${rewrite}`);
        updatedText = lines.join('\n');
      } else {
        updatedText = `${currentText}\n• ${rewrite.replace(/^[•\-*]\s*/, '')}`;
      }
    }

    updatedText = normalizeResumeText(updatedText);

    setHistoryStack((prev) => [...prev, currentText]);
    setResumeData((prev) => (prev ? { ...prev, rawText: updatedText } : null));
    setManualEditText(updatedText);

    const newChange: ResumeAppliedChange = {
      id: `change_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      suggestionId: changeId,
      title,
      originalText: target,
      appliedText: actionType === 'remove' ? '(Deleted)' : rewrite,
      appliedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setAppliedChanges((prev) => [...prev, newChange]);

    // Automatically navigate to Resume View & Edit tab so the user sees the live changes
    setActiveTab('text');
  }

  // ---------------------------------------------------------------------------
  // Core Revert: Undo Specific Change
  // ---------------------------------------------------------------------------
  function revertChangeFromResume(suggestionId: string) {
    if (!resumeData) return;

    const change = appliedChanges.find((c) => c.suggestionId === suggestionId);
    if (!change) return;

    const currentText = resumeData.rawText;
    let revertedText = currentText;

    if (change.appliedText === '(Deleted)' && change.originalText) {
      revertedText = `${currentText}\n• ${change.originalText.replace(/^[•\-*]\s*/, '')}`;
    } else if (currentText.includes(change.appliedText) && change.originalText) {
      revertedText = currentText.replace(change.appliedText, change.originalText);
    } else if (change.originalText) {
      const lines = currentText.split('\n');
      const matchIndex = lines.findIndex((l) => l.includes(change.appliedText.slice(0, 25)));
      if (matchIndex !== -1) {
        const prefix = lines[matchIndex].match(/^(\s*[•\-*]\s*)/)?.[0] || '• ';
        lines[matchIndex] = `${prefix}${change.originalText.replace(/^[•\-*]\s*/, '')}`;
        revertedText = lines.join('\n');
      }
    }

    revertedText = normalizeResumeText(revertedText);

    setHistoryStack((prev) => [...prev, currentText]);
    setResumeData((prev) => (prev ? { ...prev, rawText: revertedText } : null));
    setManualEditText(revertedText);
    setAppliedChanges((prev) => prev.filter((c) => c.suggestionId !== suggestionId));
  }

  // ---------------------------------------------------------------------------
  // Apply / Revert from Report Card
  // ---------------------------------------------------------------------------
  function handleApplySuggestion(suggestion: AtsSuggestion) {
    applyChangeToResume(
      suggestion.id,
      suggestion.title,
      suggestion.actionType || (suggestion.suggestedRewrite ? 'modify' : 'remove'),
      suggestion.originalText || '',
      suggestion.suggestedRewrite || '',
      suggestion.sectionTarget
    );

    const actionType = suggestion.actionType || (suggestion.suggestedRewrite ? 'modify' : 'remove');
    const aiMsg: ChatMessage = {
      id: `a_${Date.now()}`,
      role: 'ai',
      text: actionType === 'remove'
        ? `🗑️ **Applied to Resume:** Removed the targeted content for *"${suggestion.title}"* from your resume!`
        : `✅ **Applied to Resume:** Updated *"${suggestion.title}"*!\n\n` +
          `• **New Content:** "${suggestion.suggestedRewrite}"\n\n` +
          `You can view the formatted update on the right or click **"Download Resume"** to export.`,
    };
    setMessages((prev) => [...prev, aiMsg]);
  }

  function handleRevertSuggestion(suggestionId: string) {
    const change = appliedChanges.find((c) => c.suggestionId === suggestionId);
    revertChangeFromResume(suggestionId);

    const aiMsg: ChatMessage = {
      id: `a_${Date.now()}`,
      role: 'ai',
      text: `↩️ **Reverted Improvement:** Restored original content for *"${change?.title || 'Resume Change'}"*.`,
    };
    setMessages((prev) => [...prev, aiMsg]);
  }

  // ---------------------------------------------------------------------------
  // Apply / Revert from Chat Action Cards
  // ---------------------------------------------------------------------------
  function handleApplyChatAction(messageId: string, action: ChatAction) {
    if (!resumeData) return;

    applyChangeToResume(
      action.id,
      action.title,
      action.type,
      action.originalText || '',
      action.suggestedRewrite || '',
      action.sectionTarget
    );

    // Mark message action as applied
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, action: { ...action, applied: true } } : m))
    );
  }

  function handleRevertChatAction(messageId: string, action: ChatAction) {
    if (!resumeData) return;

    revertChangeFromResume(action.id);

    // Mark message action as not applied
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, action: { ...action, applied: false } } : m))
    );
  }

  // ---------------------------------------------------------------------------
  // Clean All HTML Tags and Binary Artifacts
  // ---------------------------------------------------------------------------
  function handleCleanAllTags() {
    if (!resumeData) return;
    const cleaned = sanitizeAndCleanText(resumeData.rawText);
    setResumeData((prev) => (prev ? { ...prev, rawText: cleaned } : null));
    setManualEditText(cleaned);

    const aiMsg: ChatMessage = {
      id: `a_${Date.now()}`,
      role: 'ai',
      text: `🧹 **Cleaned Resume:** Successfully stripped all HTML/XML tags and formatted your resume cleanly!`,
    };
    setMessages((prev) => [...prev, aiMsg]);
  }

  // ---------------------------------------------------------------------------
  // Revert All Changes to Original Resume
  // ---------------------------------------------------------------------------
  function handleRevertAll() {
    if (!resumeData || !resumeData.originalRawText) return;

    setHistoryStack((prev) => [...prev, resumeData.rawText]);
    setResumeData((prev) => (prev ? { ...prev, rawText: prev.originalRawText! } : null));
    setManualEditText(resumeData.originalRawText);
    setAppliedChanges([]);
    setIsEditingManually(false);

    // Reset applied state in chat messages
    setMessages((prev) =>
      prev.map((m) => (m.action ? { ...m, action: { ...m.action, applied: false } } : m))
    );

    const aiMsg: ChatMessage = {
      id: `a_${Date.now()}`,
      role: 'ai',
      text: `↩️ **All Changes Reverted:** Your resume has been reset to its original uploaded version.`,
    };
    setMessages((prev) => [...prev, aiMsg]);
  }

  // ---------------------------------------------------------------------------
  // Save Manual Edits
  // ---------------------------------------------------------------------------
  function handleSaveManualEdit() {
    if (!resumeData) return;
    const cleaned = sanitizeAndCleanText(manualEditText);
    setHistoryStack((prev) => [...prev, resumeData.rawText]);
    setResumeData((prev) => (prev ? { ...prev, rawText: cleaned } : null));
    setIsEditingManually(false);
  }

  // ---------------------------------------------------------------------------
  // Download Formats
  // ---------------------------------------------------------------------------
  function handleDownload(format: 'pdf' | 'doc' | 'txt' | 'md') {
    if (!resumeData) return;
    setDownloadDropdownOpen(false);

    const text = resumeData.rawText;
    const name = resumeData.fileName;

    switch (format) {
      case 'pdf':
        exportAsPdf(text, name);
        break;
      case 'doc':
        exportAsWordDoc(text, name);
        break;
      case 'txt':
        exportAsTxt(text, name);
        break;
      case 'md':
        exportAsMarkdown(text, name);
        break;
    }
  }

  async function handleSendMessage(customPrompt?: string) {
    const promptToSend = (customPrompt || input).trim();
    if (!promptToSend || chatLoading) return;

    // Check if user specifically asks to clean HTML tags or remove tags
    if (resumeData && (promptToSend.toLowerCase().includes('remove html') || promptToSend.toLowerCase().includes('clean tags') || promptToSend.toLowerCase().includes('fix html'))) {
      handleCleanAllTags();
    }

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
      const resumeText = resumeData?.rawText || '';
      const reply = await chatWithResumeCoach(newMessages, resumeText, targetRole);

      const aiReply: ChatMessage = {
        id: `a_${Date.now()}`,
        role: 'ai',
        text: reply.text,
        action: reply.action,
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
            ATS scoring, conversational modifications, 1-click bullet point updates, and instant download.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {resumeData && (
            <div className="relative" ref={downloadMenuRef}>
              <button
                onClick={() => setDownloadDropdownOpen(!downloadDropdownOpen)}
                className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-4 py-2 text-xs font-semibold text-white shadow-soft transition hover:bg-brand-700"
              >
                <Download className="h-4 w-4" />
                <span>Download Resume</span>
                <ChevronDown className="h-3.5 w-3.5 opacity-80" />
              </button>

              {downloadDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-60 rounded-2xl border border-ink-200 bg-white p-2 shadow-xl z-30 animate-scale-in">
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-ink-400">
                    Export ATS-Formatted Resume
                  </div>
                  <button
                    onClick={() => handleDownload('pdf')}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-ink-800 transition hover:bg-brand-50 hover:text-brand-700"
                  >
                    <Printer className="h-4 w-4 text-brand-600 shrink-0" />
                    <div className="text-left">
                      <p className="font-bold">Print / Save as PDF</p>
                      <p className="text-[10px] font-normal text-ink-400">ATS formatted single-page print</p>
                    </div>
                  </button>
                  <button
                    onClick={() => handleDownload('doc')}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-ink-800 transition hover:bg-brand-50 hover:text-brand-700"
                  >
                    <FileType className="h-4 w-4 text-accent-600 shrink-0" />
                    <div className="text-left">
                      <p className="font-bold">Word Document (.doc)</p>
                      <p className="text-[10px] font-normal text-ink-400">Editable Word with typography</p>
                    </div>
                  </button>
                  <button
                    onClick={() => handleDownload('txt')}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-ink-800 transition hover:bg-brand-50 hover:text-brand-700"
                  >
                    <FileText className="h-4 w-4 text-ink-600 shrink-0" />
                    <div className="text-left">
                      <p className="font-bold">Plain Text (.txt)</p>
                      <p className="text-[10px] font-normal text-ink-400">Standard clean text format</p>
                    </div>
                  </button>
                  <button
                    onClick={() => handleDownload('md')}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-ink-800 transition hover:bg-brand-50 hover:text-brand-700"
                  >
                    <FileCode className="h-4 w-4 text-purple-600 shrink-0" />
                    <div className="text-left">
                      <p className="font-bold">Markdown (.md)</p>
                      <p className="text-[10px] font-normal text-ink-400">Developer formatted markdown</p>
                    </div>
                  </button>
                </div>
              )}
            </div>
          )}

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
        {/* Left Column: Interactive Chatbot with Action Cards */}
        <div className="lg:col-span-7 flex flex-col" ref={chatContainerRef}>
          <div className="flex h-[740px] flex-col overflow-hidden rounded-2xl border border-ink-200 bg-white shadow-card">
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
                  Re-scan ATS
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
                      className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        isUser
                          ? 'rounded-tr-sm bg-brand-600 text-white shadow-soft'
                          : 'rounded-tl-sm border border-ink-200/80 bg-white text-ink-800 shadow-soft'
                      }`}
                    >
                      <div className="whitespace-pre-line prose-sm">{m.text}</div>

                      {/* Interactive Action Card inside AI Chat Bubble */}
                      {!isUser && m.action && (
                        <div className="mt-3 rounded-xl border border-brand-200 bg-brand-50/50 p-3 text-xs space-y-2">
                          <div className="flex items-center justify-between font-bold text-brand-900">
                            <span className="flex items-center gap-1">
                              <Sparkles className="h-3.5 w-3.5 text-brand-600" />
                              {m.action.title}
                            </span>
                            {m.action.applied && (
                              <span className="inline-flex items-center gap-0.5 rounded-md bg-accent-600 px-1.5 py-0.5 text-[9px] font-bold text-white uppercase tracking-wider">
                                ✓ Applied
                              </span>
                            )}
                          </div>

                          {m.action.type === 'remove' && m.action.originalText && (
                            <div className="rounded-lg border border-rose-200 bg-rose-50/70 p-2 text-rose-800 line-through">
                              <span className="text-[10px] font-bold uppercase block text-rose-600 not-line-through">Target to remove:</span>
                              {m.action.originalText}
                            </div>
                          )}

                          {m.action.type === 'modify' && (
                            <div className="space-y-1.5">
                              {m.action.originalText && (
                                <div className="rounded-lg bg-ink-100/70 p-1.5 text-[11px] text-ink-600 line-through">
                                  <span className="text-[9px] font-bold uppercase block text-ink-400 not-line-through">Original:</span>
                                  {m.action.originalText}
                                </div>
                              )}
                              {m.action.suggestedRewrite && (
                                <div className="rounded-lg border border-brand-200 bg-white p-2 font-medium text-brand-900 shadow-xs">
                                  <span className="text-[9px] font-bold uppercase block text-brand-600">✨ New Content:</span>
                                  {m.action.suggestedRewrite}
                                </div>
                              )}
                            </div>
                          )}

                          {m.action.type === 'add' && m.action.suggestedRewrite && (
                            <div className="rounded-lg border border-accent-200 bg-white p-2 font-medium text-accent-900 shadow-xs">
                              <span className="text-[9px] font-bold uppercase block text-accent-600">➕ Add under {m.action.sectionTarget || 'section'}:</span>
                              {m.action.suggestedRewrite}
                            </div>
                          )}

                          {/* Action Button */}
                          <div className="pt-1">
                            {m.action.applied ? (
                              <button
                                onClick={() => handleRevertChatAction(m.id, m.action!)}
                                className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 py-1.5 text-xs font-bold text-amber-800 hover:bg-amber-100 transition shadow-xs"
                              >
                                <Undo2 className="h-3.5 w-3.5" />
                                Revert from Resume
                              </button>
                            ) : (
                              <button
                                onClick={() => handleApplyChatAction(m.id, m.action!)}
                                className={`inline-flex w-full items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-bold text-white shadow-soft transition hover:shadow ${
                                  m.action.type === 'remove'
                                    ? 'bg-rose-600 hover:bg-rose-700'
                                    : m.action.type === 'add'
                                      ? 'bg-brand-600 hover:bg-brand-700'
                                      : 'bg-accent-600 hover:bg-accent-700'
                                }`}
                              >
                                {m.action.type === 'remove' ? (
                                  <>
                                    <Trash2 className="h-3.5 w-3.5" />
                                    Remove from Resume
                                  </>
                                ) : m.action.type === 'add' ? (
                                  <>
                                    <PlusCircle className="h-3.5 w-3.5" />
                                    Add to Resume
                                  </>
                                ) : (
                                  <>
                                    <CheckCheck className="h-3.5 w-3.5" />
                                    Apply Rewrite to Resume
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      )}
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
                  ref={chatInputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder={
                    resumeData
                      ? 'Ask coach to rewrite a bullet, remove a sentence, add keywords…'
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

        {/* Right Column: Resume Upload, Report Card & Live Editor */}
        <div className="lg:col-span-5 space-y-5">
          {/* Upload / Resume Status Box */}
          <div
            onDragOver={handleDragOver}
            onDragEnter={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative overflow-hidden rounded-2xl border bg-white p-5 shadow-card transition-all ${
              isDragging
                ? 'border-brand-500 bg-brand-50/70 ring-2 ring-brand-400 ring-offset-2 scale-[1.01]'
                : 'border-ink-200'
            }`}
          >
            {/* Drag & Drop Hover Overlay */}
            {isDragging && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-2xl bg-brand-50/95 backdrop-blur-[2px] border-2 border-dashed border-brand-500 animate-fade-in p-4 text-center">
                <div className="grid h-12 w-12 place-items-center rounded-full bg-brand-600 text-white shadow-soft animate-bounce">
                  <Upload className="h-6 w-6" />
                </div>
                <p className="mt-2 text-sm font-bold text-brand-900">Drop your resume here</p>
                <p className="text-xs text-brand-600">Supports PDF, DOCX, TXT, or Markdown</p>
              </div>
            )}

            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-bold text-ink-900">Your Resume</h3>
              {resumeData && (
                <div className="flex items-center gap-1 rounded-lg bg-ink-100 p-0.5 text-xs">
                  <button
                    onClick={() => setActiveTab('report')}
                    className={`rounded-md px-2.5 py-1 font-semibold transition ${
                      activeTab === 'report' ? 'bg-white text-ink-900 shadow-soft' : 'text-ink-500'
                    }`}
                  >
                    ATS Report
                  </button>
                  <button
                    onClick={() => setActiveTab('text')}
                    className={`relative rounded-md px-2.5 py-1 font-semibold transition ${
                      activeTab === 'text' ? 'bg-white text-ink-900 shadow-soft' : 'text-ink-500'
                    }`}
                  >
                    Resume View & Edit
                    {appliedChanges.length > 0 && (
                      <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-accent-500" />
                    )}
                  </button>
                </div>
              )}
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".pdf,.txt,.docx,.md,.doc,.html"
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
                    <p className="text-xs font-semibold text-ink-800">Click or drag & drop your resume</p>
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
                      <p className="text-[10px] text-ink-400">
                        {resumeData.fileSize} · {resumeData.uploadedAt}
                        {appliedChanges.length > 0 && ` · ${appliedChanges.length} applied`}
                      </p>
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
                <p className="text-[11px] text-ink-400 text-center">Drag and drop a new file here to replace</p>
              </div>
            )}
          </div>

          {/* Resume View & Live Editor Tab */}
          {resumeData && activeTab === 'text' && (
            <div className="space-y-5 animate-fade-in">
              <div className="rounded-2xl border border-ink-200 bg-white p-5 shadow-card space-y-4">
                {/* Header & Controls Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-100 pb-3">
                  <div className="flex items-center gap-1.5 rounded-lg bg-ink-100 p-0.5 text-xs">
                    <button
                      onClick={() => setPreviewSubTab('visual')}
                      className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 font-semibold transition ${
                        previewSubTab === 'visual'
                          ? 'bg-white text-ink-900 shadow-soft'
                          : 'text-ink-600 hover:text-ink-900'
                      }`}
                    >
                      <Eye className="h-3.5 w-3.5 text-brand-600" />
                      Formatted View
                    </button>
                    <button
                      onClick={() => setPreviewSubTab('raw')}
                      className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 font-semibold transition ${
                        previewSubTab === 'raw'
                          ? 'bg-white text-ink-900 shadow-soft'
                          : 'text-ink-600 hover:text-ink-900'
                      }`}
                    >
                      <Code2 className="h-3.5 w-3.5 text-accent-600" />
                      Raw / Edit Text
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handleCleanAllTags}
                      className="inline-flex items-center gap-1 rounded-lg border border-ink-200 bg-ink-50 px-2.5 py-1 text-xs font-semibold text-ink-700 hover:bg-ink-100 transition"
                      title="Sanitize text, strip any XML/HTML tags and format lines"
                    >
                      <Wand2 className="h-3 w-3 text-brand-600" />
                      Clean Formatting
                    </button>

                    {appliedChanges.length > 0 && (
                      <button
                        onClick={handleRevertAll}
                        className="inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800 hover:bg-amber-100 transition"
                        title="Revert all applied improvements to original text"
                      >
                        <RotateCcw className="h-3 w-3" />
                        Revert All
                      </button>
                    )}

                    {previewSubTab === 'raw' && (
                      isEditingManually ? (
                        <button
                          onClick={handleSaveManualEdit}
                          className="inline-flex items-center gap-1 rounded-lg bg-brand-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-brand-700 transition"
                        >
                          <Check className="h-3 w-3" />
                          Save
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setManualEditText(resumeData.rawText);
                            setIsEditingManually(true);
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-ink-200 bg-white px-2.5 py-1 text-xs font-semibold text-ink-700 hover:bg-ink-50 transition"
                        >
                          <Edit3 className="h-3 w-3 text-brand-600" />
                          Edit Text
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Applied Changes Mini Feed */}
                {appliedChanges.length > 0 && (
                  <div className="rounded-xl border border-accent-200 bg-accent-50/60 p-3 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-accent-900">
                      <span className="flex items-center gap-1">
                        <CheckCheck className="h-3.5 w-3.5 text-accent-600" /> {appliedChanges.length} Modification(s) Applied
                      </span>
                      <span className="text-[10px] text-accent-700 font-normal">
                        Click undo to revert specific lines
                      </span>
                    </div>
                    <div className="space-y-1.5 max-h-32 overflow-y-auto scrollbar-thin pr-1">
                      {appliedChanges.map((change) => (
                        <div
                          key={change.id}
                          className="flex items-center justify-between gap-2 rounded-lg bg-white p-2 text-xs border border-accent-100 shadow-xs"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-ink-900 truncate">{change.title}</p>
                            <p className="text-[10px] text-ink-500 truncate">{change.appliedText}</p>
                          </div>
                          <button
                            onClick={() => handleRevertSuggestion(change.suggestionId)}
                            className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 hover:text-amber-900 hover:underline shrink-0"
                          >
                            <Undo2 className="h-3 w-3" />
                            Undo
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Formatted Visual Document View */}
                {previewSubTab === 'visual' ? (
                  <div>
                    <div
                      className="max-h-[480px] overflow-y-auto rounded-xl border border-ink-200 bg-white p-5 text-ink-900 shadow-inner scrollbar-thin text-xs leading-relaxed"
                      style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}
                    >
                      <div
                        className="prose prose-sm max-w-none [&_h1]:text-lg [&_h1]:font-extrabold [&_h1]:text-center [&_h1]:text-ink-900 [&_h1]:mb-1 [&_div.resume-contact]:text-center [&_div.resume-contact]:text-[11px] [&_div.resume-contact]:text-ink-500 [&_div.resume-contact]:mb-4 [&_div.resume-contact]:border-b [&_div.resume-contact]:border-ink-100 [&_div.resume-contact]:pb-2 [&_h2]:text-xs [&_h2]:font-bold [&_h2]:text-brand-700 [&_h2]:border-b [&_h2]:border-brand-200 [&_h2]:pb-0.5 [&_h2]:mt-3.5 [&_h2]:mb-1.5 [&_h2]:uppercase [&_h2]:tracking-wider [&_div.resume-job-header]:font-semibold [&_div.resume-job-header]:text-ink-800 [&_div.resume-job-header]:mt-2 [&_ul]:list-disc [&_ul]:pl-4 [&_ul]:my-1.5 [&_li]:text-[11px] [&_li]:text-ink-700 [&_li]:my-0.5 [&_p]:text-[11px] [&_p]:text-ink-700 [&_p]:my-1"
                        dangerouslySetInnerHTML={{
                          __html: formatResumeToHtml(resumeData.rawText),
                        }}
                      />
                    </div>
                    <div className="mt-2.5 flex items-center justify-between text-[11px] text-ink-400">
                      <span>{resumeData.rawText.split(/\s+/).filter(Boolean).length} words detected</span>
                      <button
                        onClick={() => processResume(resumeData.rawText, resumeData.fileName, resumeData.fileSize)}
                        disabled={analyzing}
                        className="inline-flex items-center gap-1 font-semibold text-brand-600 hover:text-brand-700"
                      >
                        <RefreshCw className={`h-3 w-3 ${analyzing ? 'animate-spin' : ''}`} />
                        Re-scan ATS score
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Raw Monospace Text / Manual Editor */
                  isEditingManually ? (
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-ink-400 mb-1">
                        Manual Resume Editor
                      </label>
                      <textarea
                        value={manualEditText}
                        onChange={(e) => setManualEditText(e.target.value)}
                        rows={16}
                        className="w-full rounded-xl border border-brand-300 bg-white p-3 font-mono text-xs leading-relaxed text-ink-900 outline-none ring-2 ring-brand-100 scrollbar-thin"
                      />
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-[11px] text-ink-400">
                          {manualEditText.split(/\s+/).filter(Boolean).length} words
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setIsEditingManually(false)}
                            className="rounded-lg border border-ink-200 px-3 py-1 text-xs font-semibold text-ink-600 hover:bg-ink-50"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleSaveManualEdit}
                            className="rounded-lg bg-brand-600 px-3 py-1 text-xs font-semibold text-white hover:bg-brand-700"
                          >
                            Save & Apply
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <pre className="max-h-[480px] overflow-y-auto rounded-xl bg-ink-50 p-3.5 text-xs leading-relaxed text-ink-800 whitespace-pre-wrap font-mono scrollbar-thin border border-ink-100">
                        {resumeData.rawText}
                      </pre>
                      <div className="mt-2 flex items-center justify-between text-[11px] text-ink-400">
                        <span>{resumeData.rawText.split(/\s+/).filter(Boolean).length} words detected</span>
                        <button
                          onClick={() => processResume(resumeData.rawText, resumeData.fileName, resumeData.fileSize)}
                          disabled={analyzing}
                          className="inline-flex items-center gap-1 font-semibold text-brand-600 hover:text-brand-700"
                        >
                          <RefreshCw className={`h-3 w-3 ${analyzing ? 'animate-spin' : ''}`} />
                          Re-scan ATS score
                        </button>
                      </div>
                    </div>
                  )
                )}
              </div>

              {/* Priority Action Items remain accessible in the Resume View & Edit tab */}
              {report && report.suggestions && report.suggestions.length > 0 && (
                <PriorityActionItems
                  suggestions={report.suggestions}
                  appliedSuggestionIds={appliedChanges.map((c) => c.suggestionId)}
                  onAskCoach={handleAskCoach}
                  onApplySuggestion={handleApplySuggestion}
                  onRevertSuggestion={handleRevertSuggestion}
                />
              )}
            </div>
          )}

          {/* Report Card Tab */}
          {report && activeTab === 'report' && (
            <ResumeReportCard
              report={report}
              onAskCoach={handleAskCoach}
              appliedSuggestionIds={appliedChanges.map((c) => c.suggestionId)}
              onApplySuggestion={handleApplySuggestion}
              onRevertSuggestion={handleRevertSuggestion}
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
