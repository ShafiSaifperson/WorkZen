import { useState, useRef, useEffect, useCallback } from 'react';
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
  Target,
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
  analyzeResumeLocally,
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
  isMatchingSectionHeader,
  SECTION_HEADERS,
  type GhostAdditionOption,
} from '@/lib/resumeExporter';
import { ResumeReportCard, PriorityActionItems } from '@/components/ResumeReportCard';
import { HfSettingsModal } from '@/components/HfSettingsModal';
import { useAuth } from '@/lib/auth';
import { applyToJob, fetchAppliedJobIds, fetchJobById } from '@/lib/data';
import {
  getSavedResume,
  getResumeCoachSession,
  saveResumeCoachSession,
  clearResumeCoachSession,
} from '@/lib/savedResume';

const QUICK_PROMPTS = [
  '✨ Rewrite my weakest bullet with metrics',
  '🎯 Check missing keywords for my target role',
  '✍️ Craft an ATS-friendly summary',
  '📊 How do I improve my impact score?',
];

const DEFAULT_WELCOME_MESSAGE: ChatMessage = {
  id: 'm0',
  role: 'ai',
  text: "👋 Welcome! I'm your **AI Resume Coach**. Upload your resume or load a sample on the right, and I'll generate a complete **ATS diagnostic report**, suggest key improvements in chat with 1-click update buttons, and **highlight targeted and updated text directly in your formatted resume**!",
};

export function ResumeCoachPage() {
  const { user } = useAuth();
  const userId = user?.id || 'guest';

  const [resumeData, setResumeData] = useState<ResumeData | null>(() => {
    const saved = getResumeCoachSession(userId);
    return saved?.resumeData || null;
  });
  const [report, setReport] = useState<AtsReport | null>(() => {
    const saved = getResumeCoachSession(userId);
    return saved?.report || null;
  });
  const [analyzing, setAnalyzing] = useState(false);
  const [appliedChanges, setAppliedChanges] = useState<ResumeAppliedChange[]>(() => {
    const saved = getResumeCoachSession(userId);
    return saved?.appliedChanges || [];
  });
  const [, setHistoryStack] = useState<string[]>([]);
  const [isEditingManually, setIsEditingManually] = useState(false);
  const [manualEditText, setManualEditText] = useState(() => {
    const saved = getResumeCoachSession(userId);
    return saved?.manualEditText || saved?.resumeData?.rawText || '';
  });
  const [downloadDropdownOpen, setDownloadDropdownOpen] = useState(false);
  const [previewSubTab, setPreviewSubTab] = useState<'visual' | 'raw'>(() => {
    const saved = getResumeCoachSession(userId);
    return saved?.previewSubTab || 'visual';
  });

  const [activeHighlightText, setActiveHighlightText] = useState<string | null>(null);
  const [activeHighlightId, setActiveHighlightId] = useState<string | null>(null);
  const [ghostAddition, setGhostAddition] = useState<GhostAdditionOption | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = getResumeCoachSession(userId);
    return saved?.messages && saved.messages.length > 0 ? saved.messages : [DEFAULT_WELCOME_MESSAGE];
  });
  const [input, setInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [targetRole, setTargetRole] = useState(getStoredTargetRole());
  const [activeTab, setActiveTab] = useState<'report' | 'text'>(() => {
    const saved = getResumeCoachSession(userId);
    return saved?.activeTab || 'report';
  });
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
  const formattedViewScrollRef = useRef<HTMLDivElement>(null);

  // Sync state if user changes
  useEffect(() => {
    const saved = getResumeCoachSession(userId);
    if (saved) {
      if (saved.resumeData) setResumeData(saved.resumeData);
      if (saved.report) setReport(saved.report);
      if (saved.appliedChanges) setAppliedChanges(saved.appliedChanges);
      if (saved.manualEditText) setManualEditText(saved.manualEditText);
      if (saved.messages && saved.messages.length > 0) setMessages(saved.messages);
      if (saved.activeTab) setActiveTab(saved.activeTab);
      if (saved.previewSubTab) setPreviewSubTab(saved.previewSubTab);
    }
  }, [userId]);

  // Persist session to localStorage
  useEffect(() => {
    if (resumeData || report || appliedChanges.length > 0 || messages.length > 1) {
      saveResumeCoachSession(userId, {
        resumeData,
        report,
        appliedChanges,
        messages,
        manualEditText,
        activeTab,
        previewSubTab,
        targetRole,
      });
    }
  }, [userId, resumeData, report, appliedChanges, messages, manualEditText, activeTab, previewSubTab, targetRole]);

  function handleResetSession() {
    clearResumeCoachSession(userId);
    setResumeData(null);
    setReport(null);
    setAppliedChanges([]);
    setHistoryStack([]);
    setManualEditText('');
    setIsEditingManually(false);
    setActiveHighlightText(null);
    setActiveHighlightId(null);
    setGhostAddition(null);
    setMessages([DEFAULT_WELCOME_MESSAGE]);
    setActiveTab('report');
    setPreviewSubTab('visual');
    setResetModalOpen(false);
  }

  const processResume = useCallback(async (rawText: string, fileName: string, fileSize: string) => {
    const cleanText = sanitizeAndCleanText(rawText);

    // 1. Set resume data immediately
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
    setActiveHighlightText(null);
    setActiveHighlightId(null);
    setGhostAddition(null);

    // 2. Clear previous report & enter evaluation state
    setReport(null);
    setAnalyzing(true);

    try {
      // 3. Asynchronously run AI deep evaluation
      const generatedReport = await analyzeResumeWithHF(cleanText, targetRole);
      setReport(generatedReport);

      const aiMsg: ChatMessage = {
        id: `a_${Date.now()}`,
        role: 'ai',
        text: `🎯 **ATS Evaluation Ready for ${targetRole}!**\n\n` +
          `• **Overall Match Score:** **${generatedReport.overallScore}/100**\n` +
          `• **Quantified Metrics Found:** ${generatedReport.stats.metricsCount}\n` +
          `• **Identified Skills:** ${generatedReport.detectedSkills.slice(0, 5).join(', ')}${generatedReport.detectedSkills.length > 5 ? '…' : ''}\n\n` +
          `Below are your recommended improvements. Click any tile to locate and highlight that block in your resume, or click **"Apply"** to update your resume instantly!`,
        suggestions: generatedReport.suggestions,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error('Error analyzing resume:', err);
    } finally {
      setAnalyzing(false);
    }
  }, [targetRole]);

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

  // Automatically scroll to the highlighted block or ghost addition in the Formatted View
  useEffect(() => {
    if (activeTab === 'text' && previewSubTab === 'visual') {
      const performScroll = () => {
        const container = formattedViewScrollRef.current;
        if (!container) return false;

        const targetElement = container.querySelector(
          '#resume-active-highlight, #resume-applied-highlight, #resume-ghost-preview, .resume-target-highlight, .resume-applied-highlight, .resume-ghost-preview, mark'
        ) as HTMLElement | null;

        if (targetElement) {
          targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'nearest',
          });
          return true;
        }
        return false;
      };

      // Perform immediate check and scheduled retries across render passes
      performScroll();
      const t1 = setTimeout(performScroll, 50);
      const t2 = setTimeout(performScroll, 150);
      const t3 = setTimeout(performScroll, 350);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }
  }, [activeTab, previewSubTab, activeHighlightText, activeHighlightId, ghostAddition]);

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
  }, [searchParams, user, processResume]);

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
  // Interactive Inspection & Highlighting in Formatted View
  // ---------------------------------------------------------------------------
  function handleInspectSuggestion(suggestion: AtsSuggestion) {
    setActiveTab('text');
    setPreviewSubTab('visual');
    setActiveHighlightId(suggestion.id);

    const isRemoval =
      suggestion.actionType === 'remove' || (!suggestion.suggestedRewrite && Boolean(suggestion.originalText));
    const isAddition =
      !isRemoval && (suggestion.actionType === 'add' || (!suggestion.originalText && Boolean(suggestion.suggestedRewrite)));

    if (isAddition && suggestion.suggestedRewrite) {
      setGhostAddition({
        text: suggestion.suggestedRewrite,
        sectionTarget: suggestion.sectionTarget || 'SKILLS & PROFICIENCIES',
      });
      setActiveHighlightText(null);
    } else {
      setGhostAddition(null);
      const target = suggestion.originalText || suggestion.suggestedRewrite || null;
      setActiveHighlightText(target);
    }
  }

  function handleInspectChatAction(action: ChatAction) {
    setActiveTab('text');
    setPreviewSubTab('visual');
    setActiveHighlightId(action.id);

    const isRemoval = action.type === 'remove' || (!action.suggestedRewrite && Boolean(action.originalText));
    const isAddition = !isRemoval && (action.type === 'add' || (!action.originalText && Boolean(action.suggestedRewrite)));

    if (isAddition && action.suggestedRewrite) {
      setGhostAddition({
        text: action.suggestedRewrite,
        sectionTarget: action.sectionTarget || 'SKILLS & PROFICIENCIES',
      });
      setActiveHighlightText(null);
    } else {
      setGhostAddition(null);
      const target = action.originalText || action.suggestedRewrite || null;
      setActiveHighlightText(target);
    }
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

    let precedingLine = '';
    let followingLine = '';
    let exactAddedText = '';
    let originalLineIndex: number | undefined = undefined;
    let finalOriginalText = target;

    let removedHeading: string | undefined = undefined;
    let headingLineIndex: number | undefined = undefined;

    if (actionType === 'remove' || (!rewrite && target)) {
      // 1. REMOVAL: Delete specific line while capturing its exact neighbors for positional restoration
      const lines = currentText.split('\n');
      let targetIdx = lines.findIndex((l) => l.trim() === target || l.includes(target));

      // Fuzzy word-match search if exact match fails
      if (targetIdx === -1) {
        const targetWords = target.split(/\s+/).filter((w) => w.length > 3);
        targetIdx = lines.findIndex((l) => {
          const count = targetWords.filter((w) => l.toLowerCase().includes(w.toLowerCase())).length;
          return count >= Math.min(3, targetWords.length);
        });
      }

      if (targetIdx !== -1) {
        finalOriginalText = lines[targetIdx]; // preserve exact original line formatting with bullets
        originalLineIndex = targetIdx;
        
        let pIdx = targetIdx - 1;
        while (pIdx >= 0 && !lines[pIdx].trim()) pIdx--;
        if (pIdx >= 0) precedingLine = lines[pIdx];

        let fIdx = targetIdx + 1;
        while (fIdx < lines.length && !lines[fIdx].trim()) fIdx++;
        if (fIdx < lines.length) followingLine = lines[fIdx];

        lines.splice(targetIdx, 1);

        // Check if the section header above targetIdx is now completely empty
        if (pIdx >= 0 && isMatchingSectionHeader(lines[pIdx])) {
          let hasRemainingContent = false;
          for (let k = pIdx + 1; k < lines.length; k++) {
            const nextL = lines[k].trim();
            if (!nextL) continue;
            if (isMatchingSectionHeader(nextL)) break;
            hasRemainingContent = true;
            break;
          }

          if (!hasRemainingContent) {
            removedHeading = lines[pIdx];
            headingLineIndex = pIdx;
            lines.splice(pIdx, 1);
          }
        }

        updatedText = lines.join('\n');
      }
    } else if (actionType === 'modify') {
      // 2. MODIFICATION: Replace target sentence/bullet with suggested rewrite while strictly preserving bullet structure
      const lines = currentText.split('\n');
      const cleanRewrite = rewrite.replace(/^[•\-\*▪◦\u2022\u25CF\u25E6\u25AA\u2013\u2014\uF0B7\s]+/, '').trim();
      const targetClean = target.replace(/^[•\-\*▪◦\u2022\u25CF\u25E6\u25AA\u2013\u2014\uF0B7\s]+/, '').trim();

      let matchIndex = lines.findIndex((l) => {
        const lClean = l.replace(/^[•\-\*▪◦\u2022\u25CF\u25E6\u25AA\u2013\u2014\uF0B7\s]+/, '').trim();
        return lClean === targetClean || l.trim() === target || (targetClean.length > 10 && lClean.includes(targetClean));
      });

      if (matchIndex === -1 && targetClean) {
        const targetWords = targetClean.split(/\s+/).filter((w) => w.length > 3);
        matchIndex = lines.findIndex((l) => {
          const count = targetWords.filter((w) => l.toLowerCase().includes(w.toLowerCase())).length;
          return count >= Math.min(3, targetWords.length);
        });
      }

      if (matchIndex !== -1) {
        const originalLine = lines[matchIndex];
        finalOriginalText = originalLine;
        originalLineIndex = matchIndex;

        // Determine whether original line had a bullet prefix
        const hasBullet = /^[•\-\*▪◦\u2022\u25CF\u25E6\u25AA\u2013\u2014\uF0B7]/.test(originalLine.trim());
        const formattedReplacement = hasBullet ? `• ${cleanRewrite}` : cleanRewrite;
        lines[matchIndex] = formattedReplacement;
        exactAddedText = formattedReplacement;
        updatedText = lines.join('\n');
      } else {
        // Fallback: direct replace if substring found in raw text
        if (target && currentText.includes(target)) {
          const hasBulletInTarget = /^[•\-\*▪◦\u2022\u25CF\u25E6\u25AA\u2013\u2014\uF0B7]/.test(target);
          const replacement = hasBulletInTarget ? `• ${cleanRewrite}` : cleanRewrite;
          updatedText = currentText.replace(target, replacement);
        } else {
          updatedText = `${currentText}\n• ${cleanRewrite}`;
        }
      }
    } else if (actionType === 'add') {
      // 3. ADDITION: Add new line under specified section
      const lines = currentText.split('\n');
      
      let secIndex = -1;
      for (let i = 0; i < lines.length; i++) {
        if (isMatchingSectionHeader(lines[i], sectionTarget || 'SKILLS')) {
          secIndex = i;
          break;
        }
      }

      // Fallback: match any section header if specific target section header not found
      if (secIndex === -1) {
         secIndex = lines.findIndex((l) => isMatchingSectionHeader(l));
      }

      const formattedAdd = rewrite.startsWith('•') ? rewrite : `• ${rewrite}`;
      exactAddedText = formattedAdd;

      if (secIndex !== -1) {
        lines.splice(secIndex + 1, 0, formattedAdd);
        updatedText = lines.join('\n');
      } else {
        updatedText = `${currentText}\n${formattedAdd}`;
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
      actionType,
      originalText: finalOriginalText,
      appliedText: actionType === 'remove' ? '(Deleted)' : rewrite,
      appliedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      precedingLine,
      followingLine,
      exactAddedText,
      originalLineIndex,
      removedHeading,
      headingLineIndex,
    };

    setAppliedChanges((prev) => [...prev.filter((c) => c.suggestionId !== changeId), newChange]);

    // Clear ghost addition and preview highlight so the green applied highlight renders
    setGhostAddition(null);
    setActiveTab('text');
    setPreviewSubTab('visual');
    setActiveHighlightId(changeId);
    setActiveHighlightText(null);
  }

  // ---------------------------------------------------------------------------
  // Core Revert: Undo Specific Change with Exact Positional Order Restoration
  // ---------------------------------------------------------------------------
  function revertChangeFromResume(suggestionId: string) {
    if (!resumeData) return;

    const change = appliedChanges.find((c) => c.suggestionId === suggestionId);
    if (!change) return;

    const currentText = resumeData.rawText;
    let revertedText = currentText;
    const lines = currentText.split('\n');

    if (change.actionType === 'add' || change.exactAddedText || (!change.originalText && change.appliedText)) {
      // 1. REVERT ADDITION: Cleanly filter out the exact added line(s)
      const cleanAdded = (change.exactAddedText || change.appliedText).trim();
      const normAdded = cleanAdded.replace(/^[•\-*]\s*/, '').trim().toLowerCase();

      const filtered = lines.filter((l) => {
        const lineTrim = l.trim();
        if (lineTrim === cleanAdded) return false;
        const lineNorm = lineTrim.replace(/^[•\-*]\s*/, '').trim().toLowerCase();
        if (normAdded && lineNorm === normAdded) return false;
        if (normAdded && lineNorm.includes(normAdded) && lineNorm.length < normAdded.length + 8) return false;
        return true;
      });

      revertedText = filtered.join('\n');
    } else if (change.actionType === 'remove' || change.appliedText === '(Deleted)') {
      // 2. REVERT REMOVAL: Restore original text (and section heading if also removed) back into its EXACT position
      const restoreLine = change.originalText.startsWith('•') || change.originalText.startsWith('-') || change.originalText.startsWith('#') || change.originalText.includes(':') || /^[A-Z\s]{4,}$/.test(change.originalText)
        ? change.originalText
        : `• ${change.originalText.replace(/^[•\-*]\s*/, '')}`;

      const fullRestoreBlock = change.removedHeading
        ? `${change.removedHeading}\n${restoreLine}`
        : restoreLine;

      let restored = false;

      // Try anchor 1: Preceding line neighbor
      if (change.precedingLine && change.precedingLine.trim()) {
        const pIdx = lines.findIndex((l) => l.trim() === change.precedingLine!.trim());
        if (pIdx !== -1) {
          lines.splice(pIdx + 1, 0, fullRestoreBlock);
          revertedText = lines.join('\n');
          restored = true;
        }
      }

      // Try anchor 2: Following line neighbor
      if (!restored && change.followingLine && change.followingLine.trim()) {
        const fIdx = lines.findIndex((l) => l.trim() === change.followingLine!.trim());
        if (fIdx !== -1) {
          lines.splice(fIdx, 0, fullRestoreBlock);
          revertedText = lines.join('\n');
          restored = true;
        }
      }

      // Try anchor 3: Fallback to original index if available
      const targetIndex = change.headingLineIndex !== undefined ? change.headingLineIndex : change.originalLineIndex;
      if (!restored && targetIndex !== undefined && targetIndex >= 0 && targetIndex <= lines.length) {
        lines.splice(targetIndex, 0, fullRestoreBlock);
        revertedText = lines.join('\n');
        restored = true;
      }

      // Fallback: append if all anchors fail
      if (!restored) {
        revertedText = `${currentText}\n${fullRestoreBlock}`;
      }
    } else {
      // 3. REVERT MODIFICATION: Restore original bullet text
      const cleanApplied = change.appliedText.trim().replace(/^[•\-*]\s*/, '');
      const cleanOriginal = change.originalText.trim().replace(/^[•\-*]\s*/, '');

      if (currentText.includes(change.appliedText)) {
        revertedText = currentText.replace(change.appliedText, change.originalText);
      } else if (cleanApplied && currentText.includes(cleanApplied)) {
        revertedText = currentText.replace(cleanApplied, cleanOriginal);
      } else {
        const matchIdx = lines.findIndex((l) => l.toLowerCase().includes(cleanApplied.slice(0, 20).toLowerCase()));
        if (matchIdx !== -1) {
          const prefix = lines[matchIdx].match(/^(\s*[•\-*]\s*)/)?.[0] || '• ';
          lines[matchIdx] = `${prefix}${cleanOriginal}`;
          revertedText = lines.join('\n');
        }
      }
    }

    revertedText = normalizeResumeText(revertedText);

    setHistoryStack((prev) => [...prev, currentText]);
    setResumeData((prev) => (prev ? { ...prev, rawText: revertedText } : null));
    setManualEditText(revertedText);
    setAppliedChanges((prev) => prev.filter((c) => c.suggestionId !== suggestionId));

    // Reset applied state in chat messages
    setMessages((prev) =>
      prev.map((m) =>
        m.action && m.action.id === suggestionId ? { ...m, action: { ...m.action, applied: false } } : m
      )
    );

    // Clear ghost preview and switch to Formatted View with highlight on restored content
    setGhostAddition(null);
    setActiveTab('text');
    setPreviewSubTab('visual');
    setActiveHighlightId(suggestionId);
    setActiveHighlightText(change.originalText || null);
  }

  // ---------------------------------------------------------------------------
  // Apply / Revert from Report Card & Chat Suggestion Tiles
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
        ? `🗑️ **Applied to Resume:** Removed targeted content for *"${suggestion.title}"*!`
        : `✅ **Applied to Resume:** Updated *"${suggestion.title}"*!\n\n` +
          `• **New Content:** "${suggestion.suggestedRewrite}"\n\n` +
          `The updated section is now highlighted in green in your **Formatted View**!`,
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
    setGhostAddition(null);
    setActiveHighlightText(null);
    setActiveHighlightId(null);

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

      // Check if user specifically asks for more general suggestions
      if (resumeData && (promptToSend.toLowerCase().includes('suggest more changes') || promptToSend.toLowerCase().includes('more suggestions'))) {
        const prevSuggestions = (report?.suggestions.map((s) => s.originalText).filter(Boolean) as string[]) || [];
        const newReport = await analyzeResumeWithHF(resumeText, targetRole, prevSuggestions);
        
        const aiReply: ChatMessage = {
          id: `a_${Date.now()}`,
          role: 'ai',
          text: `Here are some additional AI-generated suggestions to further improve your resume for the **${targetRole}** role. You can apply them directly below!`,
          suggestions: newReport.suggestions,
        };
        setMessages((prev) => [...prev, aiReply]);
        setReport((prev) => prev ? { ...prev, suggestions: [...prev.suggestions, ...newReport.suggestions] } : newReport);
        return;
      }

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
          <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">
            AI Resume Coach
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            ATS scoring, conversational modifications, 1-click bullet point updates, and instant download.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {resumeData && (
            <div className="relative" ref={downloadMenuRef}>
              <button
                onClick={() => setDownloadDropdownOpen(!downloadDropdownOpen)}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-glow transition hover:from-violet-500 hover:to-indigo-500 hover:scale-[1.02] active:scale-[0.98]"
              >
                <Download className="h-4 w-4" />
                <span>Download Resume</span>
                <ChevronDown className="h-3.5 w-3.5 opacity-80" />
              </button>

              {downloadDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-[#2B3558] bg-[#181A2F]/95 p-2 shadow-2xl z-30 backdrop-blur-xl animate-scale-in">
                  <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Export ATS-Formatted Resume
                  </div>
                  <button
                    onClick={() => handleDownload('pdf')}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-violet-500/15 hover:text-white"
                  >
                    <Printer className="h-4 w-4 text-violet-400 shrink-0" />
                    <div className="text-left">
                      <p className="font-bold text-white">Print / Save as PDF</p>
                      <p className="text-[10px] font-normal text-slate-400">ATS formatted single-page print</p>
                    </div>
                  </button>
                  <button
                    onClick={() => handleDownload('doc')}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-emerald-500/15 hover:text-white"
                  >
                    <FileType className="h-4 w-4 text-emerald-400 shrink-0" />
                    <div className="text-left">
                      <p className="font-bold text-white">Word Document (.doc)</p>
                      <p className="text-[10px] font-normal text-slate-400">Editable Word with typography</p>
                    </div>
                  </button>
                  <button
                    onClick={() => handleDownload('txt')}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-violet-500/15 hover:text-white"
                  >
                    <FileText className="h-4 w-4 text-slate-300 shrink-0" />
                    <div className="text-left">
                      <p className="font-bold text-white">Plain Text (.txt)</p>
                      <p className="text-[10px] font-normal text-slate-400">Standard clean text format</p>
                    </div>
                  </button>
                  <button
                    onClick={() => handleDownload('md')}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-fuchsia-500/15 hover:text-white"
                  >
                    <FileCode className="h-4 w-4 text-fuchsia-400 shrink-0" />
                    <div className="text-left">
                      <p className="font-bold text-white">Markdown (.md)</p>
                      <p className="text-[10px] font-normal text-slate-400">Developer formatted markdown</p>
                    </div>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Reset Session button */}
          {(resumeData || messages.length > 1 || report) && (
            <button
              onClick={() => setResetModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#2B3558] bg-[#181A2F]/80 backdrop-blur-md px-3.5 py-2 text-xs font-semibold text-slate-300 shadow-card transition hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-300"
              title="Reset Coach session and start fresh"
            >
              <RotateCcw className="h-4 w-4 text-rose-400" />
              <span>Reset Session</span>
            </button>
          )}

          <button
            onClick={() => setSettingsOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-[#2B3558] bg-[#181A2F]/80 backdrop-blur-md px-3.5 py-2 text-xs font-semibold text-slate-200 shadow-card transition hover:border-violet-500/40 hover:bg-[#242E49] hover:text-white"
          >
            <Settings className="h-4 w-4 text-violet-400" />
            <span>AI Model & Settings</span>
          </button>
        </div>
      </div>

      {!selectedJobLoading && selectedJob && (
        <div className="mb-6 rounded-2xl border border-violet-500/30 bg-gradient-to-r from-violet-950/40 via-[#181A2F]/80 to-[#181A2F]/80 backdrop-blur-md p-5 shadow-xl">
          <p className="text-xs font-semibold uppercase tracking-wide text-violet-300">
            Selected job
          </p>

          <h2 className="mt-1 font-display text-lg font-bold text-white">
            {selectedJob.title}
          </h2>

          <p className="mt-1 text-sm text-slate-300">
            {selectedJob.company}
          </p>

          <button
            onClick={applyForSelectedJob}
            disabled={alreadyApplied || applyingForSelectedJob}
            className="mt-4 inline-flex items-center rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:from-violet-500 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {applyingForSelectedJob
              ? 'Applying...'
              : alreadyApplied
                ? 'Already Applied'
                : 'Apply'}
          </button>

          {applicationMessage && (
            <p className="mt-3 text-sm font-medium text-slate-300">
              {applicationMessage}
            </p>
          )}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column: Interactive Chatbot with Action Cards */}
        <div className="lg:col-span-7 flex flex-col" ref={chatContainerRef}>
          <div className="flex h-[740px] flex-col overflow-hidden rounded-2xl border border-[#2B3558] bg-[#181A2F]/80 backdrop-blur-md shadow-xl">
            {/* Chat header */}
            <div className="flex items-center justify-between border-b border-[#242E49] px-5 py-3.5 bg-[#111427]/70">
              <div className="flex items-center gap-3">
                <div className="relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-glow">
                  <Bot className="h-5 w-5" />
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#111427] ${
                      getStoredHfApiKey() ? 'bg-emerald-400' : 'bg-amber-400'
                    }`}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-white">Coach Chat</p>
                    <button
                      onClick={() => setSettingsOpen(true)}
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold transition border ${
                        getStoredHfApiKey()
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/25'
                          : 'bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25'
                      }`}
                    >
                      {getStoredHfApiKey()
                        ? `🟢 Live: ${getStoredHfModel().split('/')[1] || 'Qwen 2.5'}`
                        : '⚡ Connect HF Token'}
                    </button>
                  </div>
                  <p className="text-xs text-slate-400">Targeting: {targetRole}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {resumeData && (
                  <button
                    onClick={() => processResume(resumeData.rawText, resumeData.fileName, resumeData.fileSize)}
                    disabled={analyzing}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-400 hover:text-violet-300 disabled:opacity-50 transition"
                    title="Re-run ATS scan"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${analyzing ? 'animate-spin' : ''}`} />
                    Re-scan ATS
                  </button>
                )}
                {(resumeData || messages.length > 1) && (
                  <button
                    onClick={() => setResetModalOpen(true)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-rose-400 transition"
                    title="Reset Coach session"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* Messages Thread */}
            <div
              ref={scrollRef}
              className="flex-1 space-y-4 overflow-y-auto scrollbar-thin bg-gradient-to-b from-[#0E1020]/90 via-[#111427]/70 to-[#181A2F]/50 px-5 py-5"
            >
              {messages.map((m) => {
                const isUser = m.role === 'user';
                return (
                  <div
                    key={m.id}
                    className={`flex items-start gap-2.5 ${isUser ? 'justify-end' : 'justify-start'} animate-slide-in`}
                  >
                    {!isUser && (
                      <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-soft">
                        <Bot className="h-4 w-4" />
                      </div>
                    )}
                    <div
                      className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        isUser
                          ? 'rounded-tr-sm bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-glow'
                          : 'rounded-tl-sm border border-[#242E49] bg-[#111427]/95 text-slate-200 shadow-md'
                      }`}
                    >
                      <div className="whitespace-pre-line prose-sm text-slate-200 [&_strong]:text-white [&_p]:text-slate-200 [&_li]:text-slate-300">
                        {m.text}
                      </div>

                      {/* Embedded Suggestion Tiles inside AI Chat Bubble */}
                      {!isUser && m.suggestions && m.suggestions.length > 0 && (
                        <div className="mt-3">
                          <PriorityActionItems
                            suggestions={m.suggestions}
                            appliedSuggestionIds={appliedChanges.map((c) => c.suggestionId)}
                            activeHighlightId={activeHighlightId}
                            onAskCoach={handleAskCoach}
                            onApplySuggestion={handleApplySuggestion}
                            onRevertSuggestion={handleRevertSuggestion}
                            onInspectSuggestion={handleInspectSuggestion}
                          />
                        </div>
                      )}

                      {/* Interactive Action Card inside AI Chat Bubble */}
                      {!isUser && m.action && (
                        <div
                          onClick={() => handleInspectChatAction(m.action!)}
                          className="mt-3 rounded-xl border border-violet-500/30 bg-[#161936]/90 p-3 text-xs space-y-2 shadow-inner cursor-pointer hover:border-violet-500/60 transition"
                        >
                          <div className="flex items-center justify-between font-bold text-violet-300">
                            <span className="flex items-center gap-1.5">
                              <Sparkles className="h-3.5 w-3.5 text-violet-400" />
                              {m.action.title}
                            </span>
                            {m.action.applied && (
                              <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/40 px-1.5 py-0.5 text-[9px] font-bold text-emerald-300 uppercase tracking-wider">
                                ✓ Applied
                              </span>
                            )}
                          </div>

                          {m.action.type === 'remove' && m.action.originalText && (
                            <div className="rounded-lg border border-rose-500/30 bg-rose-950/40 p-2 text-rose-300 line-through">
                              <span className="text-[10px] font-bold uppercase block text-rose-400 not-line-through">Target to remove:</span>
                              {m.action.originalText}
                            </div>
                          )}

                          {m.action.type === 'modify' && (
                            <div className="space-y-1.5">
                              {m.action.originalText && (
                                <div className="rounded-lg bg-[#0B0D1B]/80 border border-[#242E49] p-2 text-[11px] text-slate-400 line-through">
                                  <span className="text-[9px] font-bold uppercase block text-slate-500 not-line-through">Original:</span>
                                  {m.action.originalText}
                                </div>
                              )}
                              {m.action.suggestedRewrite && (
                                <div className="rounded-lg border border-violet-500/40 bg-[#0B0D1B]/90 p-2 font-medium text-slate-100 shadow-sm">
                                  <span className="text-[9px] font-bold uppercase block text-violet-400">✨ New Content:</span>
                                  {m.action.suggestedRewrite}
                                </div>
                              )}
                            </div>
                          )}

                          {m.action.type === 'add' && m.action.suggestedRewrite && (
                            <div className="rounded-lg border border-emerald-500/40 bg-[#0B0D1B]/90 p-2 font-medium text-emerald-200 shadow-sm">
                              <span className="text-[9px] font-bold uppercase block text-emerald-400">➕ Add under {m.action.sectionTarget || 'section'}:</span>
                              {m.action.suggestedRewrite}
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            <button
                              onClick={() => handleInspectChatAction(m.action!)}
                              className="inline-flex items-center justify-center gap-1 rounded-lg border border-violet-500/40 bg-violet-500/10 px-2.5 py-1.5 text-xs font-semibold text-violet-300 hover:bg-violet-500/20 hover:text-white transition shadow-sm"
                              title="Locate and highlight this block in your Formatted Resume View"
                            >
                              <Target className="h-3.5 w-3.5" />
                              Highlight in Resume
                            </button>

                            {m.action.applied ? (
                              <button
                                onClick={() => handleRevertChatAction(m.id, m.action!)}
                                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/15 py-1.5 text-xs font-bold text-amber-300 hover:bg-amber-500/25 transition shadow-sm"
                              >
                                <Undo2 className="h-3.5 w-3.5" />
                                Revert from Resume
                              </button>
                            ) : (
                              <button
                                onClick={() => handleApplyChatAction(m.id, m.action!)}
                                className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg py-1.5 text-xs font-bold text-white shadow-soft transition hover:shadow ${
                                  m.action.type === 'remove'
                                    ? 'bg-rose-600 hover:bg-rose-700'
                                    : m.action.type === 'add'
                                      ? 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500'
                                      : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500'
                                }`}
                              >
                                {m.action.type === 'remove' ? (
                                  <>
                                    <Trash2 className="h-3.5 w-3.5" />
                                    Remove
                                  </>
                                ) : m.action.type === 'add' ? (
                                  <>
                                    <PlusCircle className="h-3.5 w-3.5" />
                                    Add
                                  </>
                                ) : (
                                  <>
                                    <CheckCheck className="h-3.5 w-3.5" />
                                    Apply
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    {isUser && (
                      <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[#242E49] border border-white/10 text-white shadow-soft">
                        <User className="h-4 w-4" />
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Typing / Analyzing state */}
              {(analyzing || chatLoading) && (
                <div className="flex items-center gap-2 text-xs font-medium text-slate-400 animate-fade-in pl-9">
                  <Loader2 className="h-4 w-4 animate-spin text-violet-400" />
                  <span>{analyzing ? 'Evaluating ATS score & section breakdown…' : 'Coach is thinking…'}</span>
                </div>
              )}
            </div>

            {/* Quick Prompt Pills */}
            <div className="border-t border-[#242E49] bg-[#111427]/80 px-4 py-2.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Quick Actions
              </p>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => handleSendMessage(prompt)}
                    disabled={chatLoading || analyzing}
                    className="rounded-lg border border-[#2B3558] bg-[#181A2F]/90 px-2.5 py-1 text-xs font-medium text-slate-300 transition hover:border-violet-500/40 hover:bg-[#242E49] hover:text-white"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            {/* Chat Input Bar */}
            <div className="border-t border-[#242E49] bg-[#111427]/90 p-4">
              <div className="flex gap-2">
                <input
                  ref={chatInputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  placeholder={
                    resumeData
                      ? "Ask me anything (e.g. 'Rewrite my summary', 'Add Docker skills', 'Remove references')..."
                      : 'Upload a resume first to start coaching…'
                  }
                  disabled={!resumeData || chatLoading || analyzing}
                  className="flex-1 rounded-xl border border-[#2B3558] bg-[#0B0D1B] px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 disabled:opacity-50"
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={!resumeData || !input.trim() || chatLoading || analyzing}
                  className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 font-semibold text-white shadow-soft transition hover:from-violet-500 hover:to-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed"
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
            className={`relative overflow-hidden rounded-2xl border bg-[#181A2F]/80 backdrop-blur-md p-5 shadow-xl transition-all ${
              isDragging
                ? 'border-violet-500 bg-violet-950/40 ring-2 ring-violet-400 scale-[1.01]'
                : 'border-[#2B3558]'
            }`}
          >
            {/* Drag & Drop Hover Overlay */}
            {isDragging && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-2xl bg-[#111427]/95 backdrop-blur-[2px] border-2 border-dashed border-violet-500 animate-fade-in p-4 text-center">
                <div className="grid h-12 w-12 place-items-center rounded-full bg-violet-600 text-white shadow-glow animate-bounce">
                  <Upload className="h-6 w-6" />
                </div>
                <p className="mt-2 text-sm font-bold text-white">Drop your resume here</p>
                <p className="text-xs text-violet-300">Supports PDF, DOCX, TXT, or Markdown</p>
              </div>
            )}

            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-bold text-white">Your Resume</h3>
              {resumeData && (
                <div className="flex items-center gap-1 rounded-xl bg-[#111427] border border-[#242E49] p-1 text-xs">
                  <button
                    onClick={() => setActiveTab('report')}
                    className={`rounded-lg px-2.5 py-1 font-semibold transition ${
                      activeTab === 'report' ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-soft' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    ATS Report
                  </button>
                  <button
                    onClick={() => setActiveTab('text')}
                    className={`relative rounded-lg px-2.5 py-1 font-semibold transition ${
                      activeTab === 'text' ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-soft' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Resume View & Edit
                    {appliedChanges.length > 0 && (
                      <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-emerald-400" />
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
                  className="flex w-full flex-col items-center justify-center gap-2.5 rounded-xl border-2 border-dashed border-[#2B3558] bg-[#111427]/50 px-4 py-8 text-center transition hover:border-violet-500/60 hover:bg-violet-500/5"
                >
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-violet-500/20 border border-violet-500/30 text-violet-300">
                    <Upload className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-200">Click or drag & drop your resume</p>
                    <p className="text-[11px] text-slate-400">PDF, DOCX, TXT, or Markdown</p>
                  </div>
                </button>

                {/* Instant Sample Resumes */}
                <div className="mt-4 border-t border-[#242E49] pt-3">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Or try a sample resume:
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {SAMPLE_RESUMES.map((sample, idx) => (
                      <button
                        key={sample.name}
                        onClick={() => handleLoadSample(idx)}
                        className="flex items-center gap-2 rounded-xl border border-[#2B3558] bg-[#111427]/70 p-2 text-left transition hover:border-violet-500/40 hover:bg-[#111427]"
                      >
                        <FileText className="h-4 w-4 shrink-0 text-violet-400" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold text-slate-200">{sample.name}</p>
                          <p className="truncate text-[10px] text-slate-400">{sample.role}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-3 space-y-3">
                <div className="flex items-center justify-between rounded-xl border border-[#242E49] bg-[#111427]/80 p-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="grid h-8 w-8 place-items-center rounded-lg bg-violet-500/20 border border-violet-500/30 text-violet-300">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-white">{resumeData.fileName}</p>
                      <p className="text-[10px] text-slate-400">
                        {resumeData.fileSize} · {resumeData.uploadedAt}
                        {appliedChanges.length > 0 && ` · ${appliedChanges.length} applied`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1 rounded-lg border border-[#2B3558] bg-[#181A2F] px-2.5 py-1 text-xs font-semibold text-slate-200 hover:bg-[#242E49] hover:text-white transition"
                    >
                      <FileUp className="h-3.5 w-3.5" />
                      Replace
                    </button>
                    <button
                      onClick={() => setResetModalOpen(true)}
                      className="inline-flex items-center gap-1 rounded-lg border border-rose-500/30 bg-rose-500/10 px-2.5 py-1 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition"
                      title="Clear resume evaluation"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Reset
                    </button>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 text-center">Drag and drop a new file here to replace</p>
              </div>
            )}
          </div>

          {/* Resume View & Live Editor Tab */}
          {resumeData && activeTab === 'text' && (
            <div className="space-y-5 animate-fade-in">
              <div className="rounded-2xl border border-[#2B3558] bg-[#181A2F]/80 backdrop-blur-md p-5 shadow-xl space-y-4">
                {/* Header & Controls Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#242E49] pb-3">
                  <div className="flex items-center gap-1 rounded-lg bg-[#111427] border border-[#242E49] p-0.5 text-xs">
                    <button
                      onClick={() => setPreviewSubTab('visual')}
                      className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 font-semibold transition ${
                        previewSubTab === 'visual'
                          ? 'bg-violet-600 text-white shadow-soft'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Eye className="h-3.5 w-3.5 text-violet-300" />
                      Formatted View
                    </button>
                    <button
                      onClick={() => setPreviewSubTab('raw')}
                      className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 font-semibold transition ${
                        previewSubTab === 'raw'
                          ? 'bg-violet-600 text-white shadow-soft'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Code2 className="h-3.5 w-3.5 text-emerald-400" />
                      Raw / Edit Text
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={handleCleanAllTags}
                      className="inline-flex items-center gap-1 rounded-lg border border-[#2B3558] bg-[#111427] px-2.5 py-1 text-xs font-semibold text-slate-300 hover:bg-[#242E49] hover:text-white transition"
                      title="Sanitize text, strip any XML/HTML tags and format lines"
                    >
                      <Wand2 className="h-3 w-3 text-violet-400" />
                      Clean Formatting
                    </button>

                    {appliedChanges.length > 0 && (
                      <button
                        onClick={handleRevertAll}
                        className="inline-flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 transition"
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
                          className="inline-flex items-center gap-1 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-2.5 py-1 text-xs font-semibold text-white hover:from-violet-500 hover:to-indigo-500 transition"
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
                          className="inline-flex items-center gap-1 rounded-lg border border-[#2B3558] bg-[#111427] px-2.5 py-1 text-xs font-semibold text-slate-300 hover:bg-[#242E49] hover:text-white transition"
                        >
                          <Edit3 className="h-3 w-3 text-violet-400" />
                          Edit Text
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Applied Changes Mini Feed */}
                {appliedChanges.length > 0 && (
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-3 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-bold text-emerald-300">
                      <span className="flex items-center gap-1.5">
                        <CheckCheck className="h-3.5 w-3.5 text-emerald-400" /> {appliedChanges.length} Modification(s) Applied
                      </span>
                      <span className="text-[10px] text-emerald-400 font-normal">
                        Click undo to revert specific lines
                      </span>
                    </div>
                    <div className="space-y-1.5 max-h-32 overflow-y-auto scrollbar-thin pr-1">
                      {appliedChanges.map((change) => (
                        <div
                          key={change.id}
                          className="flex items-center justify-between gap-2 rounded-lg bg-[#111427]/90 p-2 text-xs border border-[#242E49] shadow-xs"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-white truncate">{change.title}</p>
                            <p className="text-[10px] text-slate-400 truncate">{change.appliedText}</p>
                          </div>
                          <button
                            onClick={() => handleRevertSuggestion(change.suggestionId)}
                            className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-400 hover:text-amber-300 hover:underline shrink-0"
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
                      ref={formattedViewScrollRef}
                      className="max-h-[480px] overflow-y-auto rounded-xl border border-[#242E49] bg-[#0B0D1B]/95 p-5 text-slate-100 shadow-inner scrollbar-thin text-xs leading-relaxed"
                      style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}
                    >
                      <div
                        className="prose prose-invert prose-sm max-w-none [&_h1]:text-lg [&_h1]:font-extrabold [&_h1]:text-center [&_h1]:text-white [&_h1]:mb-1 [&_div.resume-contact]:text-center [&_div.resume-contact]:text-[11px] [&_div.resume-contact]:text-slate-400 [&_div.resume-contact]:mb-4 [&_div.resume-contact]:border-b [&_div.resume-contact]:border-[#242E49] [&_div.resume-contact]:pb-2 [&_h2]:text-xs [&_h2]:font-bold [&_h2]:text-violet-400 [&_h2]:border-b [&_h2]:border-violet-500/30 [&_h2]:pb-0.5 [&_h2]:mt-3.5 [&_h2]:mb-1.5 [&_h2]:uppercase [&_h2]:tracking-wider [&_div.resume-job-header]:font-semibold [&_div.resume-job-header]:text-slate-200 [&_div.resume-job-header]:mt-2 [&_ul]:list-disc [&_ul]:pl-4 [&_ul]:my-1.5 [&_li]:text-[11px] [&_li]:text-slate-300 [&_li]:my-0.5 [&_p]:text-[11px] [&_p]:text-slate-300 [&_p]:my-1"
                        dangerouslySetInnerHTML={{
                          __html: formatResumeToHtml(resumeData.rawText, {
                            targetText: activeHighlightText,
                            appliedTexts: appliedChanges.map((c) => c.appliedText),
                            ghostAddition,
                          }),
                        }}
                      />
                    </div>
                    <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400">
                      <span>{resumeData.rawText.split(/\s+/).filter(Boolean).length} words detected</span>
                      <button
                        onClick={() => processResume(resumeData.rawText, resumeData.fileName, resumeData.fileSize)}
                        disabled={analyzing}
                        className="inline-flex items-center gap-1 font-semibold text-violet-400 hover:text-violet-300 transition"
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
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        Manual Resume Editor
                      </label>
                      <textarea
                        value={manualEditText}
                        onChange={(e) => setManualEditText(e.target.value)}
                        rows={16}
                        className="w-full rounded-xl border border-[#2B3558] bg-[#0B0D1B] p-3 font-mono text-xs leading-relaxed text-slate-100 outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 scrollbar-thin"
                      />
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-[11px] text-slate-400">
                          {manualEditText.split(/\s+/).filter(Boolean).length} words
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setIsEditingManually(false)}
                            className="rounded-lg border border-[#2B3558] bg-[#111427] px-3 py-1 text-xs font-semibold text-slate-300 hover:bg-[#242E49] transition"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleSaveManualEdit}
                            className="rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-3 py-1 text-xs font-semibold text-white hover:from-violet-500 hover:to-indigo-500 transition"
                          >
                            Save & Apply
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <pre className="max-h-[480px] overflow-y-auto rounded-xl bg-[#0B0D1B] p-3.5 text-xs leading-relaxed text-slate-200 whitespace-pre-wrap font-mono scrollbar-thin border border-[#242E49]">
                        {resumeData.rawText}
                      </pre>
                      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                        <span>{resumeData.rawText.split(/\s+/).filter(Boolean).length} words detected</span>
                        <button
                          onClick={() => processResume(resumeData.rawText, resumeData.fileName, resumeData.fileSize)}
                          disabled={analyzing}
                          className="inline-flex items-center gap-1 font-semibold text-violet-400 hover:text-violet-300 transition"
                        >
                          <RefreshCw className={`h-3 w-3 ${analyzing ? 'animate-spin' : ''}`} />
                          Re-scan ATS score
                        </button>
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {/* Report Card Tab */}
          {activeTab === 'report' && (
            analyzing ? (
              <div className="rounded-2xl border border-violet-500/30 bg-[#181A2F]/80 backdrop-blur-md p-8 shadow-xl text-center space-y-5 animate-fade-in">
                <div className="relative mx-auto h-20 w-20">
                  <div className="absolute inset-0 rounded-full border-4 border-violet-500/20 border-t-violet-500 animate-spin" />
                  <div className="absolute inset-2 rounded-full border-4 border-emerald-500/20 border-b-emerald-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
                  <div className="grid h-full w-full place-items-center">
                    <Sparkles className="h-7 w-7 text-violet-400 animate-pulse" />
                  </div>
                </div>
                <div>
                  <h3 className="font-display text-lg font-bold text-white">
                    Evaluating Resume for ATS Match
                  </h3>
                  <p className="mt-1 text-xs text-slate-400 max-w-sm mx-auto">
                    Scanning keywords, quantifiable XYZ metrics, section structures, and relevancy for <span className="font-semibold text-violet-300">{targetRole}</span>...
                  </p>
                </div>
                <div className="space-y-2 pt-2 max-w-xs mx-auto text-left">
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <span className="inline-block h-2 w-2 rounded-full bg-violet-400 animate-ping" />
                    <span>Analyzing impact & Google XYZ formulas</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <span className="inline-block h-2 w-2 rounded-full bg-indigo-400 animate-ping" style={{ animationDelay: '0.2s' }} />
                    <span>Checking technical keyword alignment</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-ping" style={{ animationDelay: '0.4s' }} />
                    <span>Verifying ATS formatting & section tags</span>
                  </div>
                </div>
              </div>
            ) : report ? (
              <ResumeReportCard
                report={report}
                onAskCoach={handleAskCoach}
                appliedSuggestionIds={appliedChanges.map((c) => c.suggestionId)}
                onApplySuggestion={handleApplySuggestion}
                onRevertSuggestion={handleRevertSuggestion}
                onInspectSuggestion={handleInspectSuggestion}
              />
            ) : (
              <div className="rounded-2xl border border-[#2B3558] bg-[#181A2F]/80 p-8 text-center text-slate-400">
                <p className="text-sm">Upload or select a resume to view the ATS Report.</p>
              </div>
            )
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

      {/* Reset Confirmation Modal */}
      {resetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md rounded-2xl border border-[#2B3558] bg-[#181A2F] p-6 shadow-2xl animate-scale-in text-slate-100">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-400">
                <RotateCcw className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-display text-base font-bold text-white">Reset Resume Coach Session?</h3>
                <p className="mt-1 text-xs text-slate-400 leading-relaxed">
                  This will clear your evaluated resume, ATS report, and current chat conversation so you can start a completely fresh evaluation.
                </p>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 border-t border-[#242E49] pt-4">
              <button
                onClick={() => setResetModalOpen(false)}
                className="rounded-xl border border-[#2B3558] bg-[#111427] px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-[#242E49] hover:text-white transition"
              >
                Cancel
              </button>
              <button
                onClick={handleResetSession}
                className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-soft transition hover:bg-rose-700"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Reset Everything
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
