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
  onAskCoach: (prompt: string) => void;
  onApplySuggestion?: (suggestion: AtsSuggestion) => void;
  onRevertSuggestion?: (suggestionId: string) => void;
}

export function PriorityActionItems({
  suggestions,
  appliedSuggestionIds = [],
  onAskCoach,
  onApplySuggestion,
  onRevertSuggestion,
}: PriorityActionItemsProps) {
  const [expandedSuggestion, setExpandedSuggestion] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  function copyText(id: string, text: string) {
    navigator.clipboard?.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-5 shadow-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-brand-600" />
          <h4 className="font-display text-sm font-bold text-ink-900">Priority Action Items</h4>
        </div>
        <span className="text-xs text-ink-400">{suggestions.length} items</span>
      </div>

      <div className="mt-3 space-y-2.5">
        {suggestions.map((item) => {
          const isExpanded = expandedSuggestion === item.id;
          const isApplied = appliedSuggestionIds.includes(item.id);
          const isRemoval = item.actionType === 'remove' || (!item.suggestedRewrite && Boolean(item.originalText));
          const isAddition = item.actionType === 'add';

          const Icon =
            item.type === 'good'
              ? CheckCircle2
              : item.type === 'crit'
                ? AlertCircle
                : Lightbulb;

          const style = isApplied
            ? 'border-accent-300 bg-accent-50/80 text-accent-950 ring-1 ring-accent-400'
            : item.type === 'good'
              ? 'border-accent-200 bg-accent-50/60 text-accent-900'
              : item.type === 'crit'
                ? 'border-rose-200 bg-rose-50/60 text-rose-900'
                : 'border-amber-200 bg-amber-50/60 text-amber-900';

          const hasActionableChange = Boolean(item.originalText || item.suggestedRewrite);

          return (
            <div key={item.id} className={`rounded-xl border p-3.5 transition ${style}`}>
              <div
                className="flex cursor-pointer items-start justify-between gap-2"
                onClick={() => setExpandedSuggestion(isExpanded ? null : item.id)}
              >
                <div className="flex items-start gap-2.5">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold leading-tight">{item.title}</p>
                      {isApplied && (
                        <span className="inline-flex items-center gap-0.5 rounded-md bg-accent-600 px-1.5 py-0.2 text-[9px] font-bold text-white uppercase tracking-wider">
                          ✓ Applied
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-[11px] leading-relaxed opacity-90">{item.explanation}</p>
                  </div>
                </div>
                {hasActionableChange && (
                  <button className="shrink-0 text-ink-400 hover:text-ink-600">
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                )}
              </div>

              {/* Expanded Action details */}
              {isExpanded && hasActionableChange && (
                <div className="mt-3 space-y-2.5 border-t border-ink-200/40 pt-2.5 animate-fade-in text-xs">
                  {/* Removal scenario */}
                  {isRemoval && item.originalText && (
                    <div>
                      <span className="font-semibold text-rose-700">Target content to remove:</span>
                      <p className="mt-0.5 rounded-lg border border-rose-200 bg-rose-50/70 p-2 text-rose-800 line-through">
                        {item.originalText}
                      </p>
                    </div>
                  )}

                  {/* Modification scenario */}
                  {!isRemoval && !isAddition && (
                    <>
                      {item.originalText && (
                        <div>
                          <span className="font-semibold text-ink-500">Original in Resume:</span>
                          <p className="mt-0.5 rounded-lg bg-white/80 p-2 text-ink-700 line-through opacity-80">
                            {item.originalText}
                          </p>
                        </div>
                      )}
                      {item.suggestedRewrite && (
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-brand-700">✨ Suggested ATS Rewrite:</span>
                            <button
                              onClick={() => copyText(item.id, item.suggestedRewrite!)}
                              className="inline-flex items-center gap-1 text-[11px] font-medium text-brand-600 hover:text-brand-800"
                            >
                              {copiedId === item.id ? <Check className="h-3 w-3 text-accent-600" /> : <Copy className="h-3 w-3" />}
                              {copiedId === item.id ? 'Copied' : 'Copy'}
                            </button>
                          </div>
                          <p className="mt-1 rounded-lg border border-brand-200 bg-white p-2 font-medium text-brand-900 shadow-soft">
                            {item.suggestedRewrite}
                          </p>
                        </div>
                      )}
                    </>
                  )}

                  {/* Addition scenario */}
                  {isAddition && item.suggestedRewrite && (
                    <div>
                      <span className="font-semibold text-accent-700">➕ Content to add under {item.sectionTarget || 'relevant section'}:</span>
                      <p className="mt-1 rounded-lg border border-accent-200 bg-white p-2 font-medium text-accent-900 shadow-soft">
                        {item.suggestedRewrite}
                      </p>
                    </div>
                  )}

                  {/* Actions: Apply Directly to Resume or Revert */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {isApplied ? (
                      <button
                        onClick={() => onRevertSuggestion?.(item.id)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-xs font-bold text-amber-800 transition hover:bg-amber-100 shadow-sm"
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
                              ? 'bg-brand-600 hover:bg-brand-700'
                              : 'bg-accent-600 hover:bg-accent-700'
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
                      className="inline-flex items-center justify-center gap-1 rounded-xl border border-ink-200 bg-white px-3 py-2 text-xs font-semibold text-ink-700 hover:bg-ink-50 shadow-sm"
                    >
                      <Sparkles className="h-3.5 w-3.5 text-brand-600" />
                      Ask Coach
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
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
}

export function ResumeReportCard({
  report,
  onAskCoach,
  appliedSuggestionIds = [],
  onApplySuggestion,
  onRevertSuggestion,
}: ResumeReportCardProps) {
  const scoreColor =
    report.overallScore >= 80
      ? 'text-accent-600 bg-accent-50 border-accent-200'
      : report.overallScore >= 60
        ? 'text-brand-600 bg-brand-50 border-brand-200'
        : 'text-amber-600 bg-amber-50 border-amber-200';

  const scoreBarGrad =
    report.overallScore >= 80
      ? 'from-accent-500 to-emerald-400'
      : report.overallScore >= 60
        ? 'from-brand-500 to-accent-500'
        : 'from-amber-500 to-rose-400';

  return (
    <div className="space-y-5 animate-fade-in">
      {/* ATS Score Header */}
      <div className="rounded-2xl border border-ink-200 bg-white p-5 shadow-card">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full border border-ink-200 bg-ink-50 px-2.5 py-0.5 text-xs font-semibold text-ink-600">
                <Target className="h-3.5 w-3.5 text-brand-600" /> {report.targetRole}
              </span>
              {appliedSuggestionIds.length > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full border border-accent-200 bg-accent-50 px-2 py-0.5 text-[10px] font-bold text-accent-700">
                  <CheckCheck className="h-3 w-3" /> {appliedSuggestionIds.length} Applied
                </span>
              )}
            </div>
            <h3 className="mt-2 font-display text-lg font-bold text-ink-900">ATS Match Score</h3>
            <p className="text-xs text-ink-500">Applicant Tracking System evaluation</p>
          </div>

          <div className={`flex flex-col items-center justify-center rounded-2xl border px-4 py-3 text-center ${scoreColor}`}>
            <span className="font-display text-3xl font-extrabold leading-none">{report.overallScore}</span>
            <span className="mt-0.5 text-[10px] font-bold uppercase tracking-wider">/ 100</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-ink-100">
            <div
              className={`h-full rounded-full bg-gradient-to-r transition-all duration-700 ${scoreBarGrad}`}
              style={{ width: `${report.overallScore}%` }}
            />
          </div>
          <p className="mt-2 text-xs leading-relaxed text-ink-600">{report.summary}</p>
        </div>

        {/* Quick Stats Grid */}
        <div className="mt-4 grid grid-cols-4 gap-2 border-t border-ink-100 pt-3 text-center">
          <div className="rounded-xl bg-ink-50 p-2">
            <p className="text-[10px] uppercase font-semibold text-ink-400">Words</p>
            <p className="text-sm font-bold text-ink-800">{report.stats.wordCount}</p>
          </div>
          <div className="rounded-xl bg-ink-50 p-2">
            <p className="text-[10px] uppercase font-semibold text-ink-400">Bullets</p>
            <p className="text-sm font-bold text-ink-800">{report.stats.bulletCount}</p>
          </div>
          <div className="rounded-xl bg-ink-50 p-2">
            <p className="text-[10px] uppercase font-semibold text-ink-400">Metrics</p>
            <p className="text-sm font-bold text-brand-600">{report.stats.metricsCount}</p>
          </div>
          <div className="rounded-xl bg-ink-50 p-2">
            <p className="text-[10px] uppercase font-semibold text-ink-400">Skills</p>
            <p className="text-sm font-bold text-accent-600">{report.detectedSkills.length}</p>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="rounded-2xl border border-ink-200 bg-white p-5 shadow-card">
        <h4 className="font-display text-sm font-bold text-ink-900">Evaluation Categories</h4>
        <div className="mt-3 space-y-3">
          {report.categoryScores.map((cat) => (
            <div key={cat.name} className="rounded-xl border border-ink-100 bg-ink-50/70 p-3">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-ink-800">{cat.name}</span>
                <span
                  className={
                    cat.score >= 75
                      ? 'text-accent-600 font-bold'
                      : cat.score >= 55
                        ? 'text-brand-600 font-bold'
                        : 'text-amber-600 font-bold'
                  }
                >
                  {cat.score}%
                </span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink-200">
                <div
                  className={`h-full rounded-full ${
                    cat.score >= 75
                      ? 'bg-accent-500'
                      : cat.score >= 55
                        ? 'bg-brand-500'
                        : 'bg-amber-500'
                  }`}
                  style={{ width: `${cat.score}%` }}
                />
              </div>
              <p className="mt-1 text-[11px] text-ink-500">{cat.feedback}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Skills & Keywords Detected */}
      <div className="rounded-2xl border border-ink-200 bg-white p-5 shadow-card">
        <h4 className="font-display text-sm font-bold text-ink-900">Keywords & Skills</h4>

        <div className="mt-2.5">
          <p className="text-[11px] font-semibold text-accent-700">✓ Detected in your resume:</p>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {report.detectedSkills.map((s) => (
              <span
                key={s}
                className="rounded-lg border border-accent-200 bg-accent-50 px-2 py-0.5 text-xs font-medium text-accent-800"
              >
                {s}
              </span>
            ))}
          </div>
        </div>

        {report.missingKeywords && report.missingKeywords.length > 0 && (
          <div className="mt-3.5 border-t border-ink-100 pt-3">
            <p className="text-[11px] font-semibold text-amber-700">⚠ Recommended keywords to add:</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {report.missingKeywords.map((k) => (
                <button
                  key={k}
                  onClick={() =>
                    onAskCoach(`How should I incorporate the keyword "${k}" into my resume experience?`)
                  }
                  className="group inline-flex items-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 transition hover:bg-amber-100"
                >
                  +{k}
                  <Sparkles className="h-3 w-3 opacity-60 group-hover:opacity-100" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Priority Suggestions & Actionable Items */}
      <PriorityActionItems
        suggestions={report.suggestions}
        appliedSuggestionIds={appliedSuggestionIds}
        onAskCoach={onAskCoach}
        onApplySuggestion={onApplySuggestion}
        onRevertSuggestion={onRevertSuggestion}
      />
    </div>
  );
}
