import { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Lightbulb,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Target,
  Copy,
  Check,
  CheckCheck,
  Undo2,
  Trash2,
  PlusCircle,
} from 'lucide-react';
import type { AtsReport, AtsSuggestion } from '@/lib/types';

interface PriorityActionItemsProps {
  suggestions: AtsSuggestion[];
  appliedSuggestionIds?: string[];
  activeHighlightId?: string | null;
  onAskCoach: (prompt: string) => void;
  onApplySuggestion?: (suggestion: AtsSuggestion) => void;
  onRevertSuggestion?: (suggestionId: string) => void;
  onInspectSuggestion?: (suggestion: AtsSuggestion) => void;
}

export function PriorityActionItems({
  suggestions,
  appliedSuggestionIds = [],
  activeHighlightId,
  onAskCoach,
  onApplySuggestion,
  onRevertSuggestion,
  onInspectSuggestion,
}: PriorityActionItemsProps) {
  const [expandedSuggestion, setExpandedSuggestion] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  function copyText(id: string, text: string) {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="rounded-2xl border border-[#2B3558] bg-[#181A2F]/90 backdrop-blur-md p-4 shadow-xl space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-violet-400" />
          <h4 className="font-display text-sm font-bold text-white">Suggested Improvements</h4>
        </div>
        <span className="text-[11px] text-slate-400 font-medium">{suggestions.length} items</span>
      </div>

      <div className="space-y-2.5">
        {suggestions.map((item) => {
          const isExpanded = expandedSuggestion === item.id;
          const isApplied = appliedSuggestionIds.includes(item.id);
          const isHighlighted = activeHighlightId === item.id;
          const isRemoval = item.actionType === 'remove' || (!item.suggestedRewrite && Boolean(item.originalText));
          const isAddition = !isRemoval && (item.actionType === 'add' || (!item.originalText && Boolean(item.suggestedRewrite)));

          const Icon =
            item.type === 'good'
              ? CheckCircle2
              : item.type === 'crit'
                ? AlertCircle
                : Lightbulb;

          const iconColor =
            item.type === 'good'
              ? 'text-emerald-400'
              : item.type === 'crit'
                ? 'text-rose-400'
                : 'text-amber-400';

          const style = isHighlighted
            ? 'border-amber-400/80 bg-[#161936] text-slate-100 shadow-[0_0_15px_rgba(245,158,11,0.2)] ring-1 ring-amber-400/60'
            : isApplied
              ? 'border-emerald-500/40 bg-emerald-950/30 text-slate-100 shadow-[0_0_15px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/30'
              : item.type === 'good'
                ? 'border-emerald-500/30 bg-[#111427]/80 text-slate-200 hover:border-emerald-500/50'
                : item.type === 'crit'
                  ? 'border-rose-500/30 bg-[#111427]/80 text-slate-200 hover:border-rose-500/50'
                  : 'border-amber-500/30 bg-[#111427]/80 text-slate-200 hover:border-amber-500/50';

          const hasActionableChange = Boolean(item.originalText || item.suggestedRewrite);

          return (
            <div
              key={item.id}
              onClick={() => onInspectSuggestion?.(item)}
              className={`rounded-xl border p-3.5 transition cursor-pointer ${style}`}
            >
              <div
                className="flex items-start justify-between gap-2"
                onClick={(e) => {
                  e.stopPropagation();
                  setExpandedSuggestion(isExpanded ? null : item.id);
                  onInspectSuggestion?.(item);
                }}
              >
                <div className="flex items-start gap-2.5">
                  <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${iconColor}`} />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold leading-tight text-white">{item.title}</p>
                      {isApplied && (
                        <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/40 px-1.5 py-0.5 text-[9px] font-bold text-emerald-300 uppercase tracking-wider">
                          ✓ Applied
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-[11px] leading-relaxed text-slate-300 opacity-90">{item.explanation}</p>
                  </div>
                </div>
                {hasActionableChange && (
                  <button className="shrink-0 text-slate-400 hover:text-white transition">
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                )}
              </div>

              {/* Expanded Action details */}
              {isExpanded && hasActionableChange && (
                <div className="mt-3 space-y-2.5 border-t border-[#242E49] pt-2.5 animate-fade-in text-xs">
                  {/* Removal scenario */}
                  {isRemoval && item.originalText && (
                    <div>
                      <span className="font-semibold text-rose-400">Target content to remove:</span>
                      <p className="mt-0.5 rounded-lg border border-rose-500/30 bg-rose-950/40 p-2 text-rose-300 line-through">
                        {item.originalText}
                      </p>
                    </div>
                  )}

                  {/* Modification scenario */}
                  {!isRemoval && !isAddition && (
                    <>
                      {item.originalText && (
                        <div>
                          <span className="font-semibold text-slate-400">Original in Resume:</span>
                          <p className="mt-0.5 rounded-lg bg-[#0B0D1B] border border-[#242E49] p-2 text-slate-400 line-through opacity-80">
                            {item.originalText}
                          </p>
                        </div>
                      )}
                      {item.suggestedRewrite && (
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-violet-400">✨ Suggested ATS Rewrite:</span>
                            <button
                              onClick={() => copyText(item.id, item.suggestedRewrite!)}
                              className="inline-flex items-center gap-1 text-[11px] font-medium text-violet-400 hover:text-violet-300 transition"
                            >
                              {copiedId === item.id ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                              {copiedId === item.id ? 'Copied' : 'Copy'}
                            </button>
                          </div>
                          <p className="mt-1 rounded-lg border border-violet-500/40 bg-[#0B0D1B] p-2.5 font-medium text-slate-100 shadow-sm">
                            {item.suggestedRewrite}
                          </p>
                        </div>
                      )}
                    </>
                  )}

                  {/* Addition scenario */}
                  {isAddition && item.suggestedRewrite && (
                    <div>
                      <span className="font-semibold text-emerald-400">➕ Content to add under {item.sectionTarget || 'relevant section'}:</span>
                      <p className="mt-1 rounded-lg border border-emerald-500/40 bg-[#0B0D1B] p-2.5 font-medium text-emerald-200 shadow-sm">
                        {item.suggestedRewrite}
                      </p>
                    </div>
                  )}

                  {/* Actions: Apply Directly to Resume or Revert */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <button
                      onClick={() => onInspectSuggestion?.(item)}
                      className="inline-flex items-center justify-center gap-1 rounded-xl border border-violet-500/40 bg-violet-500/10 px-3 py-2 text-xs font-semibold text-violet-300 hover:bg-violet-500/20 hover:text-white transition shadow-sm"
                      title="Locate and highlight this block in your Formatted Resume View"
                    >
                      <Target className="h-3.5 w-3.5" />
                      Highlight in Resume
                    </button>

                    {isApplied ? (
                      <button
                        onClick={() => onRevertSuggestion?.(item.id)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-amber-500/40 bg-amber-500/15 px-3 py-2 text-xs font-bold text-amber-300 transition hover:bg-amber-500/25 shadow-sm"
                      >
                        <Undo2 className="h-3.5 w-3.5" />
                        Revert from Resume
                      </button>
                    ) : (
                      <button
                        onClick={() => onApplySuggestion?.(item)}
                        className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-white shadow-soft transition ${
                          isRemoval
                            ? 'bg-rose-600 hover:bg-rose-700'
                            : isAddition
                              ? 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500'
                              : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500'
                        }`}
                      >
                        {isRemoval ? (
                          <>
                            <Trash2 className="h-3.5 w-3.5" />
                            Remove from Resume
                          </>
                        ) : isAddition ? (
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

                    <button
                      onClick={() =>
                        onAskCoach(
                          isRemoval
                            ? `Why should I remove "${item.originalText}" from my resume?`
                            : `Can you help me refine this change for my resume: "${item.suggestedRewrite || item.title}"?`
                        )
                      }
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#2B3558] bg-[#181A2F] px-3 py-2 text-xs font-semibold text-slate-200 hover:border-violet-500/40 hover:bg-[#242E49] hover:text-white shadow-sm transition"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-violet-400" />
                      Ask Coach
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Suggest More Changes Button */}
      <div className="mt-4 flex justify-center">
        <button
          onClick={() => onAskCoach("suggest more changes")}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-violet-500/30 bg-violet-500/10 px-5 py-2.5 text-sm font-semibold text-violet-300 hover:bg-violet-500/20 hover:text-white transition shadow-sm w-full sm:w-auto"
        >
          <Sparkles className="h-4 w-4" />
          Generate More Suggestions
        </button>
      </div>
    </div>
  );
}

interface ResumeReportCardProps {
  report: AtsReport;
  onAskCoach: (prompt: string) => void;
  appliedSuggestionIds?: string[];
  onApplySuggestion?: (suggestion: AtsSuggestion) => void;
  onRevertSuggestion?: (suggestionId: string) => void;
  onInspectSuggestion?: (suggestion: AtsSuggestion) => void;
}

export function ResumeReportCard({
  report,
  onAskCoach,
  appliedSuggestionIds = [],
  onApplySuggestion,
  onRevertSuggestion,
  onInspectSuggestion,
}: ResumeReportCardProps) {
  const scoreColor =
    report.overallScore >= 80
      ? 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.15)]'
      : report.overallScore >= 60
        ? 'text-violet-300 bg-violet-500/15 border-violet-500/30 shadow-[0_0_20px_rgba(139,92,246,0.15)]'
        : 'text-rose-300 bg-rose-500/15 border-rose-500/30 shadow-[0_0_20px_rgba(244,63,94,0.15)]';

  const scoreBarGrad =
    report.overallScore >= 80
      ? 'from-violet-500 to-emerald-400'
      : report.overallScore >= 60
        ? 'from-violet-600 to-indigo-400'
        : 'from-amber-500 to-rose-400';

  return (
    <div className="space-y-5 animate-fade-in">
      {/* ATS Score Header */}
      <div className="rounded-2xl border border-[#2B3558] bg-[#181A2F]/80 backdrop-blur-md p-5 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-0.5 text-xs font-semibold text-violet-300">
                <Target className="h-3.5 w-3.5 text-violet-400" /> {report.targetRole}
              </span>
              {appliedSuggestionIds.length > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                  <CheckCheck className="h-3 w-3" /> {appliedSuggestionIds.length} Applied
                </span>
              )}
            </div>
            <h3 className="mt-2 font-display text-lg font-bold text-white">ATS Match Score</h3>
            <p className="text-xs text-slate-400">Applicant Tracking System evaluation</p>
          </div>

          <div className={`flex flex-col items-center justify-center rounded-2xl border px-4 py-3 text-center ${scoreColor}`}>
            <span className="font-display text-3xl font-extrabold leading-none">{report.overallScore}</span>
            <span className="mt-0.5 text-[10px] font-bold uppercase tracking-wider opacity-80">/ 100</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#111427] border border-[#242E49]">
            <div
              className={`h-full rounded-full bg-gradient-to-r transition-all duration-700 ${scoreBarGrad}`}
              style={{ width: `${report.overallScore}%` }}
            />
          </div>
          <p className="mt-2 text-xs leading-relaxed text-slate-300">{report.summary}</p>
        </div>

        {/* Quick Stats Grid */}
        <div className="mt-4 grid grid-cols-4 gap-2 border-t border-[#242E49] pt-3 text-center">
          <div className="rounded-xl border border-[#242E49] bg-[#111427]/80 p-2.5 transition hover:border-violet-500/30">
            <p className="text-[10px] uppercase font-semibold text-slate-400">Words</p>
            <p className="text-sm font-bold text-white mt-0.5">{report.stats.wordCount}</p>
          </div>
          <div className="rounded-xl border border-[#242E49] bg-[#111427]/80 p-2.5 transition hover:border-violet-500/30">
            <p className="text-[10px] uppercase font-semibold text-slate-400">Bullets</p>
            <p className="text-sm font-bold text-white mt-0.5">{report.stats.bulletCount}</p>
          </div>
          <div className="rounded-xl border border-[#242E49] bg-[#111427]/80 p-2.5 transition hover:border-violet-500/30">
            <p className="text-[10px] uppercase font-semibold text-slate-400">Metrics</p>
            <p className="text-sm font-bold text-violet-400 mt-0.5">{report.stats.metricsCount}</p>
          </div>
          <div className="rounded-xl border border-[#242E49] bg-[#111427]/80 p-2.5 transition hover:border-violet-500/30">
            <p className="text-[10px] uppercase font-semibold text-slate-400">Skills</p>
            <p className="text-sm font-bold text-emerald-400 mt-0.5">{report.detectedSkills.length}</p>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="rounded-2xl border border-[#2B3558] bg-[#181A2F]/80 backdrop-blur-md p-5 shadow-xl">
        <h4 className="font-display text-sm font-bold text-white">Evaluation Categories</h4>
        <div className="mt-3 space-y-3">
          {report.categoryScores.map((cat) => (
            <div key={cat.name} className="rounded-xl border border-[#242E49] bg-[#111427]/70 p-3">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-200">{cat.name}</span>
                <span
                  className={
                    cat.score >= 75
                      ? 'text-emerald-400 font-bold'
                      : cat.score >= 55
                        ? 'text-violet-400 font-bold'
                        : 'text-rose-400 font-bold'
                  }
                >
                  {cat.score}%
                </span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[#0B0D1B] border border-[#242E49]/40">
                <div
                  className={`h-full rounded-full ${
                    cat.score >= 75
                      ? 'bg-emerald-500'
                      : cat.score >= 55
                        ? 'bg-violet-500'
                        : 'bg-rose-500'
                  }`}
                  style={{ width: `${cat.score}%` }}
                />
              </div>
              <p className="mt-1 text-[11px] text-slate-400">{cat.feedback}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Skills & Keywords Detected */}
      <div className="rounded-2xl border border-[#2B3558] bg-[#181A2F]/80 backdrop-blur-md p-5 shadow-xl">
        <h4 className="font-display text-sm font-bold text-white">Keywords & Skills</h4>

        <div className="mt-2.5">
          <p className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
            <Check className="h-3.5 w-3.5" /> Detected in your resume:
          </p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {report.detectedSkills.map((s) => (
              <span
                key={s}
                className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-300"
              >
                {s}
              </span>
            ))}
          </div>
        </div>

        {report.missingKeywords && report.missingKeywords.length > 0 && (
          <div className="mt-3.5 border-t border-[#242E49] pt-3">
            <p className="text-[11px] font-semibold text-amber-400 flex items-center gap-1">
              <AlertCircle className="h-3.5 w-3.5" /> Recommended keywords to add:
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {report.missingKeywords.map((k) => (
                <button
                  key={k}
                  onClick={() =>
                    onAskCoach(`How should I incorporate the keyword "${k}" into my resume experience?`)
                  }
                  className="group inline-flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-300 transition hover:bg-amber-500/20 hover:border-amber-400/50"
                >
                  +{k}
                  <Sparkles className="h-3 w-3 opacity-60 group-hover:opacity-100 text-amber-300" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
