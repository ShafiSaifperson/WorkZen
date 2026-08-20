import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Calendar,
  Clock,
  MapPin,
  Briefcase,
  DollarSign,
  Globe,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Video,
  Phone,
  ArrowRight,
  Sparkles,
  FileCheck2,
  UserCheck,
} from 'lucide-react';
import { fetchApplicationById } from '@/lib/data';
import { useAuth } from '@/lib/auth';
import type { ApplicationDetail, AppStatus } from '@/lib/types';

const statusConfig: Record<
  AppStatus,
  {
    label: string;
    icon: typeof CheckCircle2;
    color: string;
    bg: string;
    border: string;
  }
> = {
  accepted: {
    label: 'Accepted',
    icon: CheckCircle2,
    color: 'text-accent-700',
    bg: 'bg-accent-50',
    border: 'border-accent-200',
  },
  pending: {
    label: 'Under Review',
    icon: Clock,
    color: 'text-brand-700',
    bg: 'bg-brand-50',
    border: 'border-brand-200',
  },
  rejected: {
    label: 'Rejected',
    icon: XCircle,
    color: 'text-rose-700',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
  },
};

const formatIcons = {
  'Video call': Video,
  'On-site': MapPin,
  'Phone screen': Phone,
} as const;

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function ApplicationDetailPage() {
  const { applicationId } = useParams<{ applicationId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appDetail, setAppDetail] = useState<ApplicationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !applicationId) return;

    fetchApplicationById(user.id, applicationId)
      .then((data) => {
        setAppDetail(data);
        if (!data) {
          setError('This application could not be found.');
        }
      })
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, [applicationId, user]);

  if (loading) {
    return (
      <div className="grid place-items-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  if (error || !appDetail) {
    return (
      <div className="mx-auto max-w-3xl py-20 text-center animate-fade-in">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-rose-50 border border-rose-200">
          <AlertCircle className="h-8 w-8 text-rose-500" />
        </div>
        <h1 className="mt-4 font-display text-2xl font-bold text-ink-900">
          Application Not Found
        </h1>
        <p className="mt-2 text-sm text-ink-500 max-w-md mx-auto">
          {error ?? 'This application could not be found or may have been removed.'}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Link
            to="/app/applications"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-700"
          >
            <ArrowLeft className="h-4 w-4" /> Back to applications
          </Link>
          <Link
            to="/app/dashboard"
            className="inline-flex items-center gap-2 rounded-xl border border-ink-200 bg-white px-5 py-2.5 text-sm font-semibold text-ink-700 transition hover:bg-ink-50"
          >
            Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const { job, status, appliedDaysAgo, createdAt, updatedAt, interview } = appDetail;
  const cfg = statusConfig[status];
  const FormatIcon = interview ? formatIcons[interview.format] ?? Video : Video;

  return (
    <div className="mx-auto max-w-4xl animate-fade-in space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 transition hover:text-ink-900"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      {/* Header Card */}
      <div className="rounded-2xl border border-ink-200 bg-white p-6 shadow-card sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-ink-900 text-lg font-bold text-white shadow-sm">
            {job.logo}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h1 className="font-display text-2xl font-bold text-ink-900 sm:text-3xl">
                  {job.title}
                </h1>
                <p className="mt-1 flex items-center gap-1.5 text-base text-ink-500">
                  <Building2 className="h-4 w-4" />
                  {job.company}
                </p>
              </div>

              <span
                className={`inline-flex self-start items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold border ${cfg.bg} ${cfg.color} ${cfg.border}`}
              >
                <cfg.icon className="h-4 w-4" />
                {cfg.label}
              </span>
            </div>

            {/* Quick Metadata Chips */}
            <div className="mt-4 flex flex-wrap gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-ink-100 px-3 py-1.5 text-xs font-medium text-ink-600">
                <MapPin className="h-3.5 w-3.5" /> {job.location}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-ink-100 px-3 py-1.5 text-xs font-medium text-ink-600">
                <Briefcase className="h-3.5 w-3.5" /> {job.type}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-ink-100 px-3 py-1.5 text-xs font-medium text-ink-600">
                <DollarSign className="h-3.5 w-3.5" /> ${job.salaryMin}k–${job.salaryMax}k/yr
              </span>
              {job.remote && (
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-accent-50 px-3 py-1.5 text-xs font-medium text-accent-700">
                  <Globe className="h-3.5 w-3.5" /> Remote
                </span>
              )}
            </div>

            {/* Tags */}
            {job.tags && job.tags.length > 0 && (
              <div className="mt-3.5 flex flex-wrap gap-1.5">
                {job.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Status Timeline */}
        <div className="mt-8 border-t border-ink-100 pt-6">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-400">
            Application Progress
          </h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {/* Step 1: Submitted */}
            <div className="relative flex items-start gap-3 rounded-xl bg-ink-50 p-3.5 border border-ink-100">
              <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-accent-500 text-white">
                <FileCheck2 className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-ink-900">1. Submitted</p>
                <p className="text-xs text-ink-500">
                  {appliedDaysAgo === 0 ? 'Today' : `${appliedDaysAgo}d ago`}
                </p>
              </div>
            </div>

            {/* Step 2: Under Review */}
            <div
              className={`relative flex items-start gap-3 rounded-xl p-3.5 border ${
                status === 'pending'
                  ? 'bg-brand-50/70 border-brand-200'
                  : 'bg-ink-50 border-ink-100'
              }`}
            >
              <div
                className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${
                  status === 'pending'
                    ? 'bg-brand-600 text-white'
                    : 'bg-accent-500 text-white'
                }`}
              >
                <UserCheck className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-ink-900">2. Review</p>
                <p className="text-xs text-ink-500">
                  {status === 'pending' ? 'In progress' : 'Completed'}
                </p>
              </div>
            </div>

            {/* Step 3: Decision / Next Steps */}
            <div
              className={`relative flex items-start gap-3 rounded-xl p-3.5 border ${
                status === 'accepted'
                  ? 'bg-accent-50 border-accent-200'
                  : status === 'rejected'
                  ? 'bg-rose-50 border-rose-200'
                  : 'bg-ink-50 border-ink-100 opacity-60'
              }`}
            >
              <div
                className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${
                  status === 'accepted'
                    ? 'bg-accent-600 text-white'
                    : status === 'rejected'
                    ? 'bg-rose-600 text-white'
                    : 'bg-ink-300 text-white'
                }`}
              >
                {status === 'accepted' ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : status === 'rejected' ? (
                  <XCircle className="h-4 w-4" />
                ) : (
                  <Clock className="h-4 w-4" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-ink-900">3. Decision</p>
                <p className="text-xs text-ink-500">
                  {status === 'accepted'
                    ? 'Accepted 🎉'
                    : status === 'rejected'
                    ? 'Closed'
                    : 'Awaiting decision'}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between text-xs text-ink-400 gap-2">
            <span>Applied date: {formatDate(createdAt)}</span>
            {updatedAt && <span>Last updated: {formatDate(updatedAt)}</span>}
          </div>
        </div>
      </div>

      {/* Contextual Status Banners */}
      {status === 'accepted' && (
        <section className="rounded-2xl border border-accent-200 bg-gradient-to-br from-accent-50/80 via-white to-accent-50/40 p-6 shadow-card sm:p-7">
          <div className="flex items-start gap-3.5">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent-600 text-white shadow-soft">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h2 className="font-display text-lg font-bold text-ink-900">
                Congratulations! Your Application Was Accepted
              </h2>
              <p className="mt-1 text-sm text-ink-600">
                {job.company} was impressed with your background and moved your application forward.
              </p>

              {/* Linked Interview Card */}
              {interview ? (
                <div className="mt-5 rounded-xl border border-accent-200 bg-white p-5 shadow-soft">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-brand-50 px-2.5 py-1 text-xs font-bold text-brand-700">
                        <Calendar className="h-3.5 w-3.5" /> Upcoming Interview
                      </span>
                      <h3 className="mt-2 font-display text-base font-bold text-ink-900">
                        {interview.date} at {interview.time}
                      </h3>
                      <p className="mt-1 flex items-center gap-2 text-xs text-ink-500">
                        <FormatIcon className="h-3.5 w-3.5 text-brand-500" />
                        <span>{interview.format}</span>
                        <span>·</span>
                        <span>with {interview.withName} ({interview.withRole})</span>
                      </p>
                    </div>

                    <Link
                      to={`/app/interviews/${interview.id}`}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-700 self-start sm:self-center"
                    >
                      View Interview Details
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-xs text-ink-500">
                  The hiring team will reach out with interview details soon.
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      {status === 'pending' && (
        <section className="rounded-2xl border border-brand-200 bg-brand-50/50 p-6 shadow-card">
          <div className="flex items-start gap-3.5">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-600 text-white shadow-soft">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-ink-900">
                Application is Under Active Review
              </h2>
              <p className="mt-1 text-sm text-ink-600 leading-relaxed">
                The hiring team at <span className="font-semibold">{job.company}</span> is reviewing your application for the <span className="font-semibold">{job.title}</span> role. You will receive an instant notification when the status changes.
              </p>
            </div>
          </div>
        </section>
      )}

      {status === 'rejected' && (
        <section className="rounded-2xl border border-rose-200 bg-rose-50/50 p-6 shadow-card">
          <div className="flex items-start gap-3.5">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-rose-600 text-white shadow-soft">
              <XCircle className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <h2 className="font-display text-base font-bold text-ink-900">
                Application Status Update
              </h2>
              <p className="mt-1 text-sm text-ink-600 leading-relaxed">
                Thank you for applying to <span className="font-semibold">{job.company}</span>. After reviewing applications, the hiring team has decided to move forward with other candidates for this specific opening.
              </p>
              <div className="mt-4">
                <Link
                  to="/app/jobs"
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700"
                >
                  Browse other matching job opportunities <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Job Description & Company Info */}
      <div className="rounded-2xl border border-ink-200 bg-white p-6 shadow-card sm:p-8">
        <h2 className="font-display text-lg font-bold text-ink-900">About the Role</h2>
        <p className="mt-3 text-sm leading-relaxed text-ink-600">{job.description}</p>

        {job.tags && job.tags.length > 0 && (
          <>
            <h3 className="mt-6 font-display text-base font-bold text-ink-900">
              Role Requirements & Skills
            </h3>
            <ul className="mt-3 space-y-2">
              {job.tags.map((t) => (
                <li key={t} className="flex items-center gap-2 text-sm text-ink-600">
                  <CheckCircle2 className="h-4 w-4 text-accent-500 shrink-0" />
                  Experience with {t}
                </li>
              ))}
            </ul>
          </>
        )}

        <h3 className="mt-6 font-display text-base font-bold text-ink-900">
          About {job.company}
        </h3>
        <div className="mt-3 flex items-start gap-3">
          <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-ink-400" />
          <p className="text-sm leading-relaxed text-ink-600">
            {job.company} is actively expanding its team. They value craft, clear communication, and a bias for action.
          </p>
        </div>

        <div className="mt-6 border-t border-ink-100 pt-5 flex items-center justify-between">
          <span className="text-xs text-ink-400">Application ID: {appDetail.id}</span>
          <Link
            to={`/app/jobs/${job.id}`}
            className="text-xs font-semibold text-brand-600 hover:text-brand-700"
          >
            View original job posting →
          </Link>
        </div>
      </div>
    </div>
  );
}
