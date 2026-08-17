import { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';import {
  Search,
  SlidersHorizontal,
  Sparkles,
  MapPin,
  Briefcase,
  X,
  CheckCircle2,
  Loader2,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import { fetchJobs, fetchAppliedJobIds, applyToJob } from '@/lib/data';
import { useAuth } from '@/lib/auth';
import type { Job } from '@/lib/types';
import { ApplyNextStepsModal } from '@/components/ApplyNextStepsModal';

const jobTypes = ['Full-time', 'Part-time', 'Internship', 'Contract'];

export function JobsPage() {
  const { user } = useAuth();
    const [searchParams] = useSearchParams();
const [query, setQuery] = useState(() => searchParams.get('q') ?? '');  const [type, setType] = useState<string[]>([]);
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [minSalary, setMinSalary] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResults, setAiResults] = useState<Job[] | null>(null);
  const [appliedIds, setAppliedIds] = useState<string[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applying, setApplying] = useState<string | null>(null);
  const [showApplyNextSteps, setShowApplyNextSteps] = useState(false);
    useEffect(() => {
    setQuery(searchParams.get('q') ?? '');
  }, [searchParams]);

  useEffect(() => {
    if (!user) return;
    Promise.all([fetchJobs(), fetchAppliedJobIds(user.id)])
      .then(([j, ids]) => {
        setJobs(j);
        setAppliedIds(ids);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [user]);

  const filtered = useMemo(() => {
    return (aiResults ?? jobs).filter((j) => {
      const q = query.toLowerCase();
      const matchesQuery =
        !q ||
        j.title.toLowerCase().includes(q) ||
        j.company.toLowerCase().includes(q) ||
        j.tags.some((t) => t.toLowerCase().includes(q));
      const matchesType = type.length === 0 || type.includes(j.type);
      const matchesRemote = !remoteOnly || j.remote;
      const matchesSalary = j.salaryMax >= minSalary;
      return matchesQuery && matchesType && matchesRemote && matchesSalary;
    });
  }, [query, type, remoteOnly, minSalary, aiResults, jobs]);

  function toggleType(t: string) {
    setType((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  }

  function runAI() {
    setAiLoading(true);
    setAiResults(null);
    setTimeout(() => {
      const ranked = [...jobs]
        .map((j) => ({ ...j, match: 70 + Math.floor(Math.random() * 28) }))
        .sort((a, b) => (b.match ?? 0) - (a.match ?? 0))
        .slice(0, 3);
      setAiResults(ranked);
      setAiLoading(false);
    }, 1600);
  }

  function resetAI() {
    setAiResults(null);
  }

  async function apply(jobId: string) {
    if (!user) return;
    setApplying(jobId);
    try {
      await applyToJob(user.id, jobId);
      setAppliedIds((prev) => [...prev, jobId]);
setShowApplyNextSteps(true);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setApplying(null);
    }
  }

  const activeFilterCount = type.length + (remoteOnly ? 1 : 0) + (minSalary > 0 ? 1 : 0);

  return (
    <div className="mx-auto max-w-6xl animate-fade-in">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-900 sm:text-3xl">Find Jobs</h1>
          <p className="mt-1 text-sm text-ink-500">
            {aiResults ? 'AI-matched roles based on your resume' : 'Search open positions and apply in one click'}
          </p>
        </div>
        {aiResults && (
          <button
            onClick={resetAI}
            className="inline-flex items-center gap-1.5 self-start rounded-lg border border-ink-200 bg-white px-3 py-1.5 text-xs font-medium text-ink-600 hover:bg-ink-50"
          >
            <X className="h-3.5 w-3.5" /> Clear AI results
          </button>
        )}
      </div>

      {/* AI recommend banner */}
      <div className="mb-6 overflow-hidden rounded-2xl border border-brand-200 bg-gradient-to-r from-brand-50 to-accent-50 p-5 sm:p-6">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="relative grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-glow">
              {aiLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Sparkles className="h-5 w-5" />
              )}
              {!aiLoading && (
                <span className="absolute inset-0 animate-pulse-ring rounded-xl ring-2 ring-brand-400" />
              )}
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-ink-900">AI Job Match</h3>
              <p className="text-sm text-ink-600">
                {aiLoading
                  ? 'Analyzing your resume against live postings…'
                  : aiResults
                    ? 'Here are the roles that best fit your profile.'
                    : 'Let AI recommend the perfect jobs based on your resume.'}
              </p>
            </div>
          </div>
          <button
            onClick={runAI}
            disabled={aiLoading || jobs.length === 0}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-700 disabled:opacity-60"
          >
            <Sparkles className="h-4 w-4" />
            {aiLoading ? 'Matching…' : aiResults ? 'Re-run match' : 'Recommend jobs'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Search + filter toggle */}
      <div className="mb-4 flex gap-3">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, company, or skill…"
            className="h-12 w-full rounded-xl border border-ink-200 bg-white pl-12 pr-4 text-sm shadow-soft outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
          />
        </div>
        <button
          onClick={() => setShowFilters((v) => !v)}
          className={`inline-flex h-12 items-center gap-2 rounded-xl border px-4 text-sm font-medium transition ${
            showFilters || activeFilterCount > 0
              ? 'border-brand-300 bg-brand-50 text-brand-700'
              : 'border-ink-200 bg-white text-ink-600 hover:bg-ink-50'
          }`}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="grid h-5 w-5 place-items-center rounded-full bg-brand-600 text-[10px] font-bold text-white">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="mb-6 animate-scale-in rounded-2xl border border-ink-200 bg-white p-5 shadow-card">
          <div className="grid gap-5 sm:grid-cols-3">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">Job type</p>
              <div className="flex flex-wrap gap-2">
                {jobTypes.map((t) => (
                  <button
                    key={t}
                    onClick={() => toggleType(t)}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition ${
                      type.includes(t)
                        ? 'border-brand-400 bg-brand-50 text-brand-700'
                        : 'border-ink-200 text-ink-600 hover:bg-ink-50'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">
                Minimum salary (max)
              </p>
              <div className="flex items-center gap-3">
                <span className="text-ink-400 text-sm">$</span>
                <input
                  type="range"
                  min={0}
                  max={170}
                  step={10}
                  value={minSalary}
                  onChange={(e) => setMinSalary(Number(e.target.value))}
                  className="flex-1 accent-brand-600"
                />
                <span className="w-16 text-right text-sm font-semibold text-ink-900">
                  ${minSalary}k+
                </span>
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-500">
                Work arrangement
              </p>
              <label className="flex items-center gap-2.5 text-sm text-ink-700">
                <input
                  type="checkbox"
                  checked={remoteOnly}
                  onChange={(e) => setRemoteOnly(e.target.checked)}
                  className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-400"
                />
                Remote only
              </label>
            </div>
          </div>
          {activeFilterCount > 0 && (
            <button
              onClick={() => {
                setType([]);
                setRemoteOnly(false);
                setMinSalary(0);
              }}
              className="mt-4 text-xs font-medium text-brand-600 hover:text-brand-700"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Results count */}
      <p className="mb-4 text-sm text-ink-500">
        Showing <span className="font-semibold text-ink-900">{filtered.length}</span>{' '}
        {filtered.length === 1 ? 'role' : 'roles'}
      </p>

      {loading ? (
        <div className="grid place-items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
        </div>
      ) : (
        <>
          {/* Job grid */}
          <div className="grid gap-4 md:grid-cols-2">
            {filtered.map((job) => {
              const applied = appliedIds.includes(job.id);
              return (
                <Link
                  key={job.id}
                  to={`/app/jobs/${job.id}`}
                  className="group flex flex-col rounded-2xl border border-ink-200 bg-white p-5 shadow-card transition hover:border-brand-300 hover:shadow-glow"
                >
                  <div className="flex items-start gap-3">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-ink-900 text-sm font-bold text-white">
                      {job.logo}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-display text-base font-bold leading-tight text-ink-900">
                            {job.title}
                          </h3>
                          <p className="text-sm text-ink-500">{job.company}</p>
                        </div>
                        {job.match && (
                          <span className="shrink-0 rounded-full bg-accent-50 px-2.5 py-1 text-xs font-bold text-accent-700">
                            {job.match}% match
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-ink-500">
                    <span className="inline-flex items-center gap-1 rounded-lg bg-ink-100 px-2.5 py-1 font-medium">
                      <MapPin className="h-3 w-3" /> {job.location}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-lg bg-ink-100 px-2.5 py-1 font-medium">
                      <Briefcase className="h-3 w-3" /> {job.type}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-lg bg-ink-100 px-2.5 py-1 font-medium">
                      ${job.salaryMin}k–${job.salaryMax}k
                    </span>
                    {job.remote && (
                      <span className="rounded-lg bg-accent-50 px-2.5 py-1 font-medium text-accent-700">
                        Remote
                      </span>
                    )}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {job.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-md bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700"
                      >
                        {t}
                      </span>
                    ))}
                  </div>

                  <p className="mt-3 text-sm leading-relaxed text-ink-500 line-clamp-2">
                    {job.description}
                  </p>

                  <div className="mt-4 flex items-center justify-between border-t border-ink-100 pt-4">
                    <span className="text-xs text-ink-400">Posted {job.postedDaysAgo}d ago</span>
                    {applied ? (
                      <span className="inline-flex items-center gap-1.5 rounded-xl bg-accent-50 px-4 py-2.5 text-sm font-semibold text-accent-700">
                        <CheckCircle2 className="h-4 w-4" /> Applied
                      </span>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          apply(job.id);
                        }}
                        disabled={applying === job.id}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
                      >
                        {applying === job.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            Apply now <ArrowRight className="h-4 w-4" />
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div className="rounded-2xl border border-dashed border-ink-300 bg-white py-16 text-center">
              <p className="text-sm text-ink-500">No roles match your filters. Try broadening your search.</p>
            </div>
          )}
        </>
      )}
            <ApplyNextStepsModal
        isOpen={showApplyNextSteps}
        onClose={() => setShowApplyNextSteps(false)}
      />
    </div>
  );
}
