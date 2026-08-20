import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Phone,
  Video,
  Building2,
  Mail,
  User,
  CheckCircle2,
  AlertCircle,
  Loader2,
  CalendarCheck,
  Globe,
  Sparkles,
  FileText,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { fetchApplicationForCompany, scheduleCompanyInterview } from '@/lib/data';
import type { CompanyApplication, InterviewType } from '@/lib/types';

const interviewTypes: {
  type: InterviewType;
  label: string;
  icon: typeof Video;
  description: string;
}[] = [
  {
    type: 'Google Meet',
    label: 'Google Meet',
    icon: Video,
    description: 'Online video meeting via Google Meet',
  },
  {
    type: 'Zoom',
    label: 'Zoom',
    icon: Video,
    description: 'Online video meeting via Zoom',
  },
  {
    type: 'In Office',
    label: 'In Office',
    icon: MapPin,
    description: 'On-site interview at your company office',
  },
  {
    type: 'Phone Call',
    label: 'Phone Call',
    icon: Phone,
    description: 'Direct phone screening or dial-in call',
  },
  {
    type: 'Other',
    label: 'Other Platform',
    icon: Globe,
    description: 'Custom video platform or external service',
  },
];

const durationOptions = [
  '15 mins',
  '30 mins',
  '45 mins',
  '60 mins',
  '90 mins',
  '2 hours',
];

export function CompanyScheduleInterviewPage() {
  const { applicationId } = useParams<{ applicationId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [application, setApplication] = useState<CompanyApplication | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form states
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('10:00 AM');
  const [duration, setDuration] = useState('45 mins');
  const [type, setType] = useState<InterviewType>('Google Meet');
  const [meetingLink, setMeetingLink] = useState('https://meet.google.com/wz-interview');
  const [location, setLocation] = useState('');
  const [interviewerName, setInterviewerName] = useState(user?.full_name || 'Hiring Lead');
  const [interviewerRole, setInterviewerRole] = useState('Hiring Manager');
  const [notes, setNotes] = useState('');

  // Default date to 3 days from now in YYYY-MM-DD
  useEffect(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    setDate(d.toISOString().split('T')[0]);
  }, []);

  useEffect(() => {
    if (!user || !applicationId) return;

    fetchApplicationForCompany(user.id, applicationId)
      .then((data) => {
        setApplication(data);
        if (data?.interview) {
          const iv = data.interview;
          if (iv.date) {
            // Try to parse existing date if in ISO or readable format
            try {
              const parsed = new Date(iv.date);
              if (!isNaN(parsed.getTime())) {
                setDate(parsed.toISOString().split('T')[0]);
              }
            } catch {
              // keep fallback
            }
          }
          if (iv.startTime || iv.time) setStartTime(iv.startTime || iv.time);
          if (iv.duration) setDuration(iv.duration);
          if (iv.type) setType(iv.type as InterviewType);
          if (iv.meetingLink) setMeetingLink(iv.meetingLink);
          if (iv.location) setLocation(iv.location);
          if (iv.interviewerName || iv.withName)
            setInterviewerName(iv.interviewerName || iv.withName);
          if (iv.interviewerRole || iv.withRole)
            setInterviewerRole(iv.interviewerRole || iv.withRole);
          if (iv.notes) setNotes(iv.notes);
        } else if (data?.job) {
          // Prepopulate location from job location if in-person
          if (data.job.location) {
            setLocation(data.job.location);
          }
        }
      })
      .catch((err) => setError((err as Error).message))
      .finally(() => setLoading(false));
  }, [applicationId, user]);

  function handleTypeChange(newType: InterviewType) {
    setType(newType);
    if (newType === 'Google Meet' && !meetingLink.includes('meet.google.com')) {
      setMeetingLink(`https://meet.google.com/${Math.random().toString(36).substring(2, 5)}-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 5)}`);
    } else if (newType === 'Zoom' && !meetingLink.includes('zoom.us')) {
      setMeetingLink(`https://zoom.us/j/${Math.floor(1000000000 + Math.random() * 9000000000)}`);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user || !applicationId) return;

    if (!date) {
      setError('Please select an interview date.');
      return;
    }
    if (!startTime.trim()) {
      setError('Please specify an interview start time.');
      return;
    }
    if (!interviewerName.trim()) {
      setError('Please provide the interviewer name.');
      return;
    }
    if ((type === 'Google Meet' || type === 'Zoom') && !meetingLink.trim()) {
      setError('Please enter a valid meeting link.');
      return;
    }
    if (type === 'In Office' && !location.trim()) {
      setError('Please enter the physical office address for the interview.');
      return;
    }
    if (type === 'Phone Call' && !location.trim()) {
      setError('Please enter the candidate phone number or dial-in contact.');
      return;
    }

    setSubmitting(true);
    setError(null);

    // Format readable date
    let formattedDate = date;
    try {
      const parts = date.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        formattedDate = d.toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
      }
    } catch {
      formattedDate = date;
    }

    try {
      await scheduleCompanyInterview(user.id, applicationId, {
        date: formattedDate,
        startTime: startTime.trim(),
        duration,
        type,
        meetingLink: type === 'Google Meet' || type === 'Zoom' || type === 'Other' ? meetingLink.trim() : undefined,
        location: type === 'In Office' || type === 'Phone Call' || type === 'Other' ? location.trim() : undefined,
        interviewerName: interviewerName.trim(),
        interviewerRole: interviewerRole.trim() || 'Hiring Manager',
        notes: notes.trim(),
      });

      setSuccessMessage('Application accepted and interview scheduled successfully.');
      setTimeout(() => {
        navigate('/company/dashboard');
      }, 1500);
    } catch (err) {
      setError((err as Error).message);
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="grid place-items-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  if (error && !application) {
    return (
      <div className="mx-auto max-w-3xl py-20 text-center animate-fade-in">
        <AlertCircle className="mx-auto h-12 w-12 text-rose-500" />
        <h1 className="mt-4 font-display text-2xl font-bold text-ink-900">
          Application Not Found
        </h1>
        <p className="mt-2 text-sm text-ink-500">
          {error ?? 'This candidate application could not be found.'}
        </p>
        <Link
          to="/company/dashboard"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-700"
        >
          <ArrowLeft className="h-4 w-4" /> Return to Hiring Dashboard
        </Link>
      </div>
    );
  }

  if (!application) return null;

  const isReschedule = Boolean(application.interview);

  return (
    <div className="mx-auto max-w-3xl animate-fade-in space-y-6 pb-12">
      {/* Top navigation */}
      <button
        onClick={() => navigate('/company/dashboard')}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 transition hover:text-ink-900"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Hiring Dashboard
      </button>

      {/* Page Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-600 text-white shadow-soft">
            <CalendarCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-ink-900 sm:text-3xl">
              {isReschedule ? 'Reschedule Interview' : 'Accept & Schedule Interview'}
            </h1>
            <p className="text-sm text-ink-500">
              Configure interview format, schedule time, and notify the candidate.
            </p>
          </div>
        </div>
      </div>

      {/* Success Banner */}
      {successMessage && (
        <div className="flex items-center gap-3 rounded-2xl border border-accent-200 bg-accent-50 p-4 text-sm font-medium text-accent-800 shadow-soft animate-fade-in">
          <CheckCircle2 className="h-5 w-5 text-accent-600 shrink-0" />
          <div>
            <p className="font-bold">{successMessage}</p>
            <p className="text-xs text-accent-600">Redirecting to hiring dashboard...</p>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 shadow-soft">
          <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Candidate & Application Summary Card */}
      <div className="rounded-2xl border border-ink-200 bg-white p-6 shadow-card">
        <h2 className="text-xs font-bold uppercase tracking-wider text-ink-400">
          Candidate & Application Details
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="flex items-start gap-3 rounded-xl bg-ink-50 p-3.5 border border-ink-100">
            <User className="h-5 w-5 text-brand-600 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-xs text-ink-400">Candidate</p>
              <p className="text-sm font-bold text-ink-900">{application.candidateName}</p>
              <p className="flex items-center gap-1 text-xs text-ink-500">
                <Mail className="h-3 w-3" /> {application.candidateEmail}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl bg-ink-50 p-3.5 border border-ink-100">
            <Building2 className="h-5 w-5 text-brand-600 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-xs text-ink-400">Role & Organization</p>
              <p className="text-sm font-bold text-ink-900">{application.job.title}</p>
              <p className="text-xs text-ink-500">{application.job.company} · Applied {application.appliedDaysAgo}d ago</p>
            </div>
          </div>
        </div>
      </div>

      {/* Interview Scheduling Form */}
      <form onSubmit={handleSubmit} className="rounded-2xl border border-ink-200 bg-white p-6 shadow-card sm:p-8 space-y-6">
        <h2 className="font-display text-lg font-bold text-ink-900">
          Interview Details
        </h2>

        {/* 1. Interview Type Selection */}
        <div>
          <label className="block text-sm font-semibold text-ink-800 mb-2">
            Interview Type & Platform <span className="text-rose-500">*</span>
          </label>
          <div className="grid gap-2.5 sm:grid-cols-3">
            {interviewTypes.map((t) => {
              const isSelected = type === t.type;
              const Icon = t.icon;
              return (
                <button
                  key={t.type}
                  type="button"
                  onClick={() => handleTypeChange(t.type)}
                  className={`flex flex-col items-start p-3.5 rounded-xl border text-left transition ${
                    isSelected
                      ? 'border-brand-500 bg-brand-50/70 text-brand-900 ring-2 ring-brand-500/20'
                      : 'border-ink-200 bg-white text-ink-700 hover:border-ink-300 hover:bg-ink-50'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <Icon className={`h-4 w-4 ${isSelected ? 'text-brand-600' : 'text-ink-400'}`} />
                    {t.label}
                  </div>
                  <span className="mt-1 text-xs text-ink-400 leading-snug">{t.description}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Date, Time & Duration */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-semibold text-ink-700 mb-1.5">
              Interview Date <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm font-medium text-ink-900 shadow-inner-soft focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-700 mb-1.5">
              Start Time <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="e.g. 10:00 AM"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm font-medium text-ink-900 shadow-inner-soft focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-700 mb-1.5">
              Duration
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm font-medium text-ink-900 shadow-inner-soft focus:border-brand-500 focus:outline-none"
            >
              {durationOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 3. Dynamic Platform / Location Specific Fields */}
        {(type === 'Google Meet' || type === 'Zoom') && (
          <div className="animate-fade-in rounded-xl border border-brand-200 bg-brand-50/50 p-4">
            <label className="block text-xs font-bold text-brand-900 mb-1.5">
              {type} Meeting URL <span className="text-rose-500">*</span>
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="url"
                  required
                  value={meetingLink}
                  onChange={(e) => setMeetingLink(e.target.value)}
                  placeholder={type === 'Google Meet' ? 'https://meet.google.com/...' : 'https://zoom.us/j/...'}
                  className="w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm font-mono text-ink-900 shadow-inner-soft focus:border-brand-500 focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={() => handleTypeChange(type)}
                className="shrink-0 rounded-xl border border-brand-300 bg-white px-3 py-2 text-xs font-bold text-brand-700 hover:bg-brand-50"
              >
                Generate Link
              </button>
            </div>
            <p className="mt-1.5 text-xs text-ink-500">
              The candidate will see a "Join Meeting" button on their dashboard and interview details page.
            </p>
          </div>
        )}

        {type === 'In Office' && (
          <div className="animate-fade-in rounded-xl border border-ink-200 bg-ink-50/60 p-4">
            <label className="block text-xs font-bold text-ink-900 mb-1.5">
              Office Location & Room Address <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. 100 Market St, Suite 400, Conference Room B, San Francisco, CA"
              className="w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 shadow-inner-soft focus:border-brand-500 focus:outline-none"
            />
            <p className="mt-1.5 text-xs text-ink-500">
              This physical address will be displayed prominently on the candidate's interview view.
            </p>
          </div>
        )}

        {type === 'Phone Call' && (
          <div className="animate-fade-in rounded-xl border border-ink-200 bg-ink-50/60 p-4">
            <label className="block text-xs font-bold text-ink-900 mb-1.5">
              Candidate Contact Phone or Dial-in Number <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. +1 (555) 234-5678 or Company Dial-in bridge #102"
              className="w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 shadow-inner-soft focus:border-brand-500 focus:outline-none"
            />
          </div>
        )}

        {type === 'Other' && (
          <div className="animate-fade-in rounded-xl border border-ink-200 bg-ink-50/60 p-4 space-y-3">
            <div>
              <label className="block text-xs font-bold text-ink-900 mb-1">
                Meeting URL (optional)
              </label>
              <input
                type="url"
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                placeholder="https://teams.microsoft.com/..."
                className="w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 shadow-inner-soft focus:border-brand-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-ink-900 mb-1">
                Location Details / Instructions
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Teams channel or external office"
                className="w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 shadow-inner-soft focus:border-brand-500 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* 4. Interviewer Information */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-ink-700 mb-1.5">
              Interviewer Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={interviewerName}
              onChange={(e) => setInterviewerName(e.target.value)}
              placeholder="e.g. Sarah Chen"
              className="w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 shadow-inner-soft focus:border-brand-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink-700 mb-1.5">
              Interviewer Role / Title
            </label>
            <input
              type="text"
              value={interviewerRole}
              onChange={(e) => setInterviewerRole(e.target.value)}
              placeholder="e.g. Engineering Manager"
              className="w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 shadow-inner-soft focus:border-brand-500 focus:outline-none"
            />
          </div>
        </div>

        {/* 5. Additional Notes / Candidate Instructions */}
        <div>
          <label className="block text-xs font-semibold text-ink-700 mb-1.5">
            Additional Instructions / Agenda for Candidate
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Please bring a copy of your recent project code or portfolio. We will spend the first 20 minutes discussing architecture..."
            className="w-full rounded-xl border border-ink-200 bg-white px-3.5 py-2.5 text-sm text-ink-900 shadow-inner-soft focus:border-brand-500 focus:outline-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="border-t border-ink-100 pt-5 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/company/dashboard')}
            className="rounded-xl border border-ink-200 bg-white px-5 py-2.5 text-sm font-semibold text-ink-700 hover:bg-ink-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-xl bg-accent-600 px-6 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-accent-700 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Scheduling...
              </>
            ) : (
              <>
                <CalendarCheck className="h-4 w-4" />
                {isReschedule ? 'Update & Reschedule Interview' : 'Schedule Interview'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
