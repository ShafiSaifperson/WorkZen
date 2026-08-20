import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Calendar,
  Clock,
  MapPin,
  Phone,
  UserRound,
  Video,
  Loader2,
  AlertCircle,
  CalendarClock,
  X,
  CheckCircle2,
} from 'lucide-react';
import { fetchInterviewById, rescheduleInterview } from '@/lib/data';
import { useAuth } from '@/lib/auth';
import type { Interview } from '@/lib/types';

const formatIcons = {
  'Video call': Video,
  'On-site': MapPin,
  'Phone screen': Phone,
} as const;

export function InterviewDetailPage() {
  const { interviewId } = useParams<{ interviewId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [interview, setInterview] = useState<Interview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Reschedule state
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newFormat, setNewFormat] = useState<'Video call' | 'On-site' | 'Phone screen'>('Video call');
  const [savingReschedule, setSavingReschedule] = useState(false);
  const [rescheduleSuccess, setRescheduleSuccess] = useState(false);

  useEffect(() => {
    if (!user || !interviewId) return;

    fetchInterviewById(user.id, interviewId)
      .then((data) => {
        setInterview(data);
        if (data) {
          setNewDate(data.date);
          setNewTime(data.time);
          setNewFormat(data.format);
        }
      })
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, [interviewId, user]);

  async function handleRescheduleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user || !interview) return;

    setSavingReschedule(true);
    setError(null);

    try {
      await rescheduleInterview(user.id, interview.id, {
        date: newDate,
        time: newTime,
        format: newFormat,
        inDays: Math.max(1, interview.inDays),
      });

      setInterview((prev) =>
        prev
          ? {
              ...prev,
              date: newDate,
              time: newTime,
              format: newFormat,
            }
          : null
      );

      setIsRescheduling(false);
      setRescheduleSuccess(true);
      setTimeout(() => setRescheduleSuccess(false), 4000);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSavingReschedule(false);
    }
  }

  if (loading) {
    return (
      <div className="grid place-items-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  if (error && !interview) {
    return (
      <div className="mx-auto max-w-3xl py-20 text-center">
        <AlertCircle className="mx-auto h-10 w-10 text-rose-500" />
        <p className="mt-4 text-sm text-ink-500">
          {error ?? 'This interview could not be found.'}
        </p>
        <Link
          to="/app/dashboard"
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700"
        >
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>
      </div>
    );
  }

  if (!interview) return null;

  const FormatIcon = formatIcons[interview.format] ?? Video;

  return (
    <div className="mx-auto max-w-3xl animate-fade-in">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink-900"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      {rescheduleSuccess && (
        <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-accent-200 bg-accent-50 px-4 py-3 text-sm font-medium text-accent-800 animate-fade-in">
          <CheckCircle2 className="h-5 w-5 text-accent-600 shrink-0" />
          Interview rescheduled successfully! A notification has been generated.
        </div>
      )}

      <div className="rounded-2xl border border-ink-200 bg-white p-6 shadow-card sm:p-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-brand-600">Upcoming interview</p>
            <h1 className="mt-1 font-display text-2xl font-bold text-ink-900 sm:text-3xl">
              {interview.jobTitle}
            </h1>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-500">
              <Building2 className="h-4 w-4" />
              {interview.company}
            </p>
          </div>

          <button
            onClick={() => setIsRescheduling(true)}
            className="inline-flex items-center gap-2 self-start rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm font-semibold text-ink-700 shadow-soft transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
          >
            <CalendarClock className="h-4 w-4 text-brand-600" />
            Reschedule
          </button>
        </div>

        <div className="mt-7 grid gap-4 sm:grid-cols-2">
          <DetailRow icon={Calendar} label="Date" value={interview.date} />
          <DetailRow icon={Clock} label="Time" value={interview.time} />
          <DetailRow icon={FormatIcon} label="Interview format" value={interview.format} />
          <DetailRow
            icon={UserRound}
            label="Interviewer"
            value={`${interview.withName} · ${interview.withRole}`}
          />
        </div>

        <div className="mt-7 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t border-ink-100 pt-6">
          <p className="text-sm text-ink-500">
            Scheduled in {interview.inDays} day{interview.inDays === 1 ? '' : 's'}.
          </p>

          <Link
            to={`/app/jobs/${interview.jobId}`}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 shadow-soft"
          >
            View job posting
          </Link>
        </div>
      </div>

      {/* Reschedule Modal */}
      {isRescheduling && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-ink-950/40 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl animate-scale-in">
            <button
              onClick={() => setIsRescheduling(false)}
              aria-label="Close"
              className="absolute right-4 top-4 rounded-lg p-2 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="pr-8">
              <p className="text-sm font-semibold text-brand-600">Interview Scheduling</p>
              <h2 className="mt-1 font-display text-xl font-bold text-ink-900">
                Reschedule Interview
              </h2>
              <p className="mt-1 text-sm text-ink-500">
                Update the date, time, or format for your interview with {interview.company}.
              </p>
            </div>

            <form onSubmit={handleRescheduleSubmit} className="mt-5 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-ink-500">
                  New Date
                </label>
                <input
                  required
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  placeholder="e.g. Aug 10, 2026"
                  className="h-11 w-full rounded-xl border border-ink-200 bg-white px-3.5 text-sm text-ink-900 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-ink-500">
                  New Time
                </label>
                <input
                  required
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  placeholder="e.g. 2:30 PM"
                  className="h-11 w-full rounded-xl border border-ink-200 bg-white px-3.5 text-sm text-ink-900 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-ink-500">
                  Format
                </label>
                <select
                  value={newFormat}
                  onChange={(e) =>
                    setNewFormat(e.target.value as 'Video call' | 'On-site' | 'Phone screen')
                  }
                  className="h-11 w-full rounded-xl border border-ink-200 bg-white px-3.5 text-sm text-ink-900 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                >
                  <option value="Video call">Video call</option>
                  <option value="On-site">On-site</option>
                  <option value="Phone screen">Phone screen</option>
                </select>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRescheduling(false)}
                  className="rounded-xl px-4 py-2.5 text-sm font-semibold text-ink-600 hover:bg-ink-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingReschedule}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-700 disabled:opacity-50"
                >
                  {savingReschedule ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  Save and Reschedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Calendar;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-ink-50 p-4">
      <Icon className="h-5 w-5 text-brand-600" />
      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-ink-400">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-ink-900">{value}</p>
    </div>
  );
}