import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Briefcase,
  DollarSign,
  Clock,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Building2,
  Globe,
} from 'lucide-react';
import { fetchJobById, fetchAppliedJobIds } from '@/lib/data';
import { useAuth } from '@/lib/auth';
import type { Job } from '@/lib/types';
import { ApplyNextStepsModal } from '@/components/ApplyNextStepsModal';

export function JobDetailPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState(false);
  const [showApplyNextSteps, setShowApplyNextSteps] = useState(false);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId || !user) return;
    Promise.all([fetchJobById(jobId), fetchAppliedJobIds(user.id)])
      .then(([j, ids]) => {
        setJob(j);
        setApplied(ids.includes(jobId));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [jobId, user]);

  function openApplicationOptions() {
  if (!jobId) return;

  setSelectedJobId(jobId);
  setShowApplyNextSteps(true);
}

  if (loading) {
    return (
      <div className="grid place-items-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="mx-auto max-w-3xl py-20 text-center">
        <AlertCircle className="mx-auto h-10 w-10 text-rose-500" />
        <p className="mt-4 text-sm text-ink-500">
          {error ?? 'This job posting could not be found.'}
        </p>
        <Link
          to="/app/jobs"
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back to jobs
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl animate-fade-in">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 transition hover:text-ink-900"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      {/* Header card */}
      <div className="rounded-2xl border border-ink-200 bg-white p-6 shadow-card sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-ink-900 text-lg font-bold text-white">
            {job.logo}
          </div>
          <div className="flex-1">
            <h1 className="font-display text-2xl font-bold text-ink-900 sm:text-3xl">
              {job.title}
            </h1>
            <p className="mt-1 text-base text-ink-500">{job.company}</p>

            <div className="mt-4 flex flex-wrap gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-ink-100 px-3 py-1.5 text-xs font-medium text-ink-600">
                <MapPin className="h-3.5 w-3.5" /> {job.location}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-ink-100 px-3 py-1.5 text-xs font-medium text-ink-600">
                <Briefcase className="h-3.5 w-3.5" /> {job.type}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-ink-100 px-3 py-1.5 text-xs font-medium text-ink-600">
                <DollarSign className="h-3.5 w-3.5" /> ${job.salaryMin}k–${job.salaryMax}k
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-ink-100 px-3 py-1.5 text-xs font-medium text-ink-600">
                <Clock className="h-3.5 w-3.5" /> Posted {job.postedDaysAgo}d ago
              </span>
              {job.remote && (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-accent-50 px-3 py-1.5 text-xs font-medium text-accent-700">
                  <Globe className="h-3.5 w-3.5" /> Remote
                </span>
              )}
            </div>

            <div className="mt-4 flex flex-wrap gap-1.5">
              {job.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-md bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 border-t border-ink-100 pt-6">
          {applied ? (
            <div className="flex items-center justify-between rounded-xl bg-accent-50 px-5 py-4">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="h-5 w-5 text-accent-600" />
                <span className="text-sm font-semibold text-accent-700">
                  You&apos;ve applied to this role
                </span>
              </div>
              <Link
                to="/app/applications"
                className="text-sm font-semibold text-accent-700 hover:text-accent-800"
              >
                View applications
              </Link>
            </div>
          ) : (
            <button
              onClick={openApplicationOptions}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3.5 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-700 sm:w-auto"
>
  <Briefcase className="h-4 w-4" /> Apply now
            </button>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="mt-6 rounded-2xl border border-ink-200 bg-white p-6 shadow-card sm:p-8">
        <h2 className="font-display text-lg font-bold text-ink-900">About the role</h2>
        <p className="mt-3 text-sm leading-relaxed text-ink-600">{job.description}</p>

        <h3 className="mt-6 font-display text-base font-bold text-ink-900">What we&apos;re looking for</h3>
        <ul className="mt-3 space-y-2">
          {job.tags.map((t) => (
            <li key={t} className="flex items-center gap-2 text-sm text-ink-600">
              <CheckCircle2 className="h-4 w-4 text-accent-500" />
              Experience with {t}
            </li>
          ))}
        </ul>

        <h3 className="mt-6 font-display text-base font-bold text-ink-900">About {job.company}</h3>
        <div className="mt-3 flex items-start gap-3">
          <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-ink-400" />
          <p className="text-sm leading-relaxed text-ink-600">
            {job.company} is building the future of their industry. They value
            ownership, craft, and a bias for action — and offer a high-impact
            role with clear room to grow.
          </p>
        </div>
      </div>
            <ApplyNextStepsModal
  isOpen={showApplyNextSteps}
  jobId={selectedJobId}
  onClose={() => setShowApplyNextSteps(false)}
/>
    </div>
  );
}
