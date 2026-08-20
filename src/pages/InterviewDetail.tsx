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
  ExternalLink,
  Copy,
  Check,
  FileText,
  Globe,
  Sparkles,
} from 'lucide-react';
import { fetchInterviewById, rescheduleInterview } from '@/lib/data';
import { useAuth } from '@/lib/auth';
import type { Interview, InterviewType } from '@/lib/types';

const formatIcons: Record<string, typeof Video> = {
  'Google Meet': Video,
  'Zoom': Video,
  'Video call': Video,
  'In Office': MapPin,
  'On-site': MapPin,
  'Phone Call': Phone,
  'Phone screen': Phone,
  'Other': Globe,
};

function DetailRow({
  icon: Icon,
  label,
  value,
  action,
}: {
  icon: typeof Calendar;
  label: string;
  value: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-ink-50 p-4 border border-ink-100">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-600">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-ink-400">
          {label}
        </p>
        <p className="mt-0.5 text-sm font-semibold text-ink-900 break-words">
          {value}
        </p>
      </div>
      {action && <div className="shrink-0 self-center">{action}</div>}
    </div>
  );
}

export function InterviewDetailPage() {
  const { interviewId } = useParams<{ interviewId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [interview, setInterview] = useState<Interview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Reschedule state
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newFormat, setNewFormat] = useState<string>('Google Meet');
  const [savingReschedule, setSavingReschedule] = useState(false);
  const [rescheduleSuccess, setRescheduleSuccess] = useState(false);

  useEffect(() => {
    if (!user || !interviewId) return;

    fetchInterviewById(user.id, interviewId)
      .then((data) => {
        setInterview(data);
        if (data) {
          setNewDate(data.date);
          setNewTime(data.time || data.startTime || '10:00 AM');
          setNewFormat(data.type || data.format || 'Google Meet');
        }
      })
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, [interviewId, user]);

  function copyMeetingLink(url: string) {
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  }

  async function handleRescheduleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user || !interview) return;

    setSavingReschedule(true);
    setError(null);

    try {
      await rescheduleInterview(user.id, interview.id, {
        date: newDate,
        time: newTime,
        format: newFormat as any,
        inDays: Math.max(1, interview.inDays),
      });

      setInterview((prev) =>
        prev
          ? {
              ...prev,
              date: newDate,
              time: newTime,
              startTime: newTime,
              format: newFormat as any,
              type: newFormat,
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
      <div className="mx-auto max-w-3xl py-20 text-center animate-fade-in">
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

  const interviewType = interview.type || interview.format || 'Google Meet';
  const FormatIcon = formatIcons[interviewType] ?? Video;
  const isOnline =
    interviewType === 'Google Meet' ||
    interviewType === 'Zoom' ||
    interviewType === 'Video call' ||
    Boolean(interview.meetingLink);

  const isOffice = interviewType === 'In Office' || interviewType === 'On-site';
  const isPhone = interviewType === 'Phone Call' || interviewType === 'Phone screen';

  const timeDisplay = interview.startTime || interview.time;
  const fullTime = interview.endTime
    ? `${timeDisplay} – ${interview.endTime} (${interview.duration || '45 mins'})`
    : `${timeDisplay} (${interview.duration || '45 mins'})`;

  return (
    <div className="mx-auto max-w-3xl animate-fade-in space-y-6 pb-12">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink-900 transition"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      {rescheduleSuccess && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-accent-200 bg-accent-50 px-4 py-3.5 text-sm font-medium text-accent-800 animate-fade-in shadow-soft">
          <CheckCircle2 className="h-5 w-5 text-accent-600 shrink-0" />
          Interview rescheduled successfully! Notification updated.
        </div>
      )}

      {/* Main Header Card */}
      <div className="rounded-2xl border border-ink-200 bg-white p-6 shadow-card sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700 border border-brand-200">
                <FormatIcon className="h-3.5 w-3.5" />
                {interviewType}
              </span>
              <span className="inline-flex items-center rounded-full bg-accent-50 px-3 py-1 text-xs font-bold text-accent-700 border border-accent-200">
                {interview.status === 'cancelled' ? 'Cancelled' : 'Scheduled'}
              </span>
            </div>
            <h1 className="mt-2 font-display text-2xl font-bold text-ink-900 sm:text-3xl">
              {interview.jobTitle}
            </h1>
            <p className="mt-1 flex items-center gap-1.5 text-base text-ink-500">
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

        {/* Prominent Online Meeting Action Banner */}
        {isOnline && interview.meetingLink && (
          <div className="mt-6 rounded-xl border border-accent-200 bg-gradient-to-r from-accent-50/80 to-white p-4 sm:p-5 shadow-soft">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent-600 text-white shadow-soft">
                  <Video className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-ink-900">
                    Online Video Meeting Ready
                  </h2>
                  <p className="text-xs text-ink-500 font-mono truncate max-w-xs sm:max-w-md">
                    {interview.meetingLink}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyMeetingLink(interview.meetingLink!)}
                  title="Copy link"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-ink-700 hover:bg-ink-50 transition"
                >
                  {copiedLink ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-accent-600" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 text-ink-500" /> Copy Link
                    </>
                  )}
                </button>
                <a
                  href={interview.meetingLink}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-accent-600 px-5 py-2.5 text-sm font-bold text-white shadow-soft transition hover:bg-accent-700"
                >
                  <Video className="h-4 w-4" />
                  Join Meeting
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Office Location Card */}
        {isOffice && interview.location && (
          <div className="mt-6 rounded-xl border border-ink-200 bg-ink-50/80 p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-600 text-white shadow-soft">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-ink-900">
                  On-site Interview Location
                </h2>
                <p className="mt-1 text-sm text-ink-700 font-medium">
                  {interview.location}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Phone Contact Card */}
        {isPhone && interview.location && (
          <div className="mt-6 rounded-xl border border-ink-200 bg-ink-50/80 p-4 sm:p-5">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-600 text-white shadow-soft">
                <Phone className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-ink-900">
                  Phone Screening Contact
                </h2>
                <p className="mt-1 text-sm text-ink-700 font-mono font-medium">
                  {interview.location}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Grid Details */}
        <div className="mt-7 grid gap-4 sm:grid-cols-2">
          <DetailRow icon={Calendar} label="Date" value={interview.date} />
          <DetailRow icon={Clock} label="Time & Duration" value={fullTime} />
          <DetailRow
            icon={FormatIcon}
            label="Platform / Format"
            value={interviewType}
          />
          <DetailRow
            icon={UserRound}
            label="Interviewer"
            value={`${interview.withName || interview.interviewerName} · ${interview.withRole || interview.interviewerRole}`}
          />
        </div>

        {/* Additional Instructions / Notes */}
        {interview.notes && (
          <div className="mt-6 rounded-xl border border-ink-100 bg-ink-50/60 p-4 sm:p-5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink-400 mb-2">
              <FileText className="h-4 w-4 text-brand-600" />
              Employer Notes & Instructions
            </div>
            <p className="text-sm leading-relaxed text-ink-700 whitespace-pre-wrap">
              {interview.notes}
            </p>
          </div>
        )}

        {/* Bottom Actions */}
        <div className="mt-7 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t border-ink-100 pt-6">
          <p className="text-sm text-ink-500">
            {interview.inDays === 0
              ? 'Scheduled for today'
              : interview.inDays === 1
              ? 'Scheduled for tomorrow'
              : `Scheduled in ${interview.inDays} days`}
          </p>

          <div className="flex items-center gap-3">
            <Link
              to={`/app/applications`}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-ink-200 bg-white px-4 py-2.5 text-sm font-semibold text-ink-700 hover:bg-ink-50 transition"
            >
              My Applications
            </Link>
            <Link
              to={`/app/jobs/${interview.jobId}`}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 shadow-soft"
            >
              View job posting
            </Link>
          </div>
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
                  Interview Type
                </label>
                <select
                  value={newFormat}
                  onChange={(e) => setNewFormat(e.target.value)}
                  className="h-11 w-full rounded-xl border border-ink-200 bg-white px-3.5 text-sm text-ink-900 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                >
                  <option value="Google Meet">Google Meet</option>
                  <option value="Zoom">Zoom</option>
                  <option value="In Office">In Office (On-site)</option>
                  <option value="Phone Call">Phone Call</option>
                  <option value="Other">Other Platform</option>
                </select>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRescheduling(false)}
                  className="rounded-xl px-4 py-2 text-sm font-semibold text-ink-600 hover:bg-ink-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingReschedule}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-700 disabled:opacity-50"
                >
                  {savingReschedule ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Confirm reschedule'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}