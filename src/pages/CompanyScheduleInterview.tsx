import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
    async function loadData() {
      if (!user || !applicationId) return;
      setLoading(true);
      setError(null);

      try {
        const app = await fetchApplicationForCompany(user.id, applicationId);
        if (!app) {
          setError('Application not found or you do not have permission to view it.');
          return;
        }
        setApplication(app);

        // Pre-fill if already scheduled
        if (app.interview) {
          const iv = app.interview;
          if (iv.date) setDate(iv.date);
          if (iv.time || iv.startTime) setStartTime(iv.time || iv.startTime || '10:00 AM');
          if (iv.duration) setDuration(iv.duration);
          if (iv.type || iv.format) setType((iv.type || iv.format) as InterviewType);
          if (iv.meetingLink) setMeetingLink(iv.meetingLink);
          if (iv.location) setLocation(iv.location);
          if (iv.withName || iv.interviewerName) setInterviewerName(iv.withName || iv.interviewerName || '');
          if (iv.withRole || iv.interviewerRole) setInterviewerRole(iv.withRole || iv.interviewerRole || '');
          if (iv.notes) setNotes(iv.notes);
        }
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, [user, applicationId]);

  // Handle auto-generation of meeting link when changing types
  function handleTypeChange(newType: InterviewType) {
    setType(newType);
    if (newType === 'Google Meet') {
      const code = Math.random().toString(36).substring(2, 5) + '-' +
                   Math.random().toString(36).substring(2, 6) + '-' +
                   Math.random().toString(36).substring(2, 5);
      setMeetingLink(`https://meet.google.com/${code}`);
    } else if (newType === 'Zoom') {
      const randId = Math.floor(1000000000 + Math.random() * 9000000000);
      setMeetingLink(`https://zoom.us/j/${randId}`);
    } else if (newType === 'In Office') {
      setMeetingLink('');
      if (!location) setLocation(application?.job.location || 'Company Headquarters');
    } else if (newType === 'Phone Call') {
      setMeetingLink('');
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!user || !applicationId) return;

    setSubmitting(true);
    setError(null);

    try {
      await scheduleCompanyInterview(user.id, applicationId, {
        date,
        startTime,
        duration,
        type,
        meetingLink: (type === 'Google Meet' || type === 'Zoom' || type === 'Other') ? meetingLink : undefined,
        location: (type === 'In Office' || type === 'Phone Call' || type === 'Other') ? location : undefined,
        interviewerName,
        interviewerRole,
        notes: notes.trim() ? notes : undefined,
      });

      setSuccessMessage('Interview scheduled successfully! Candidate has been notified.');
      setTimeout(() => {
        navigate('/company/dashboard');
      }, 1400);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
          <p className="text-sm text-slate-400">Loading candidate details...</p>
        </div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="mx-auto max-w-2xl text-center py-12">
        <AlertCircle className="mx-auto h-12 w-12 text-rose-400" />
        <h1 className="mt-4 font-display text-2xl font-bold text-white">
          Application Not Found
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          {error || 'The requested application could not be loaded.'}
        </p>
        <button
          onClick={() => navigate('/company/dashboard')}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow-soft hover:bg-violet-500"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Dashboard
        </button>
      </div>
    );
  }

  const isReschedule = Boolean(application.interview);

  return (
    <div className="mx-auto max-w-3xl animate-fade-in space-y-6 pb-16">
      {/* Top navigation */}
      <button
        onClick={() => navigate('/company/dashboard')}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-400 transition hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Hiring Dashboard
      </button>

      {/* Page Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white shadow-glow">
            <CalendarCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">
              {isReschedule ? 'Reschedule Interview' : 'Accept & Schedule Interview'}
            </h1>
            <p className="text-sm text-slate-400">
              Configure interview format, schedule time, and notify the candidate.
            </p>
          </div>
        </div>
      </div>

      {/* Success Banner */}
      {successMessage && (
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-950/40 p-4 text-sm font-medium text-emerald-300 shadow-soft animate-fade-in">
          <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
          <div>
            <p className="font-bold">{successMessage}</p>
            <p className="text-xs text-emerald-400">Redirecting to hiring dashboard...</p>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-rose-500/30 bg-rose-950/40 p-4 text-sm text-rose-300 shadow-soft">
          <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Candidate & Application Summary Card */}
      <div className="rounded-2xl border border-violet-500/20 bg-gradient-to-b from-[#181A2F]/90 to-[#121424]/90 backdrop-blur-xl p-6 shadow-card">
        <h2 className="text-xs font-bold uppercase tracking-wider text-violet-400">
          Candidate & Application Details
        </h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="flex items-start gap-3 rounded-xl bg-[#101223]/90 p-3.5 border border-[#2B3558]">
            <User className="h-5 w-5 text-violet-400 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-xs text-slate-400">Candidate</p>
              <p className="text-sm font-bold text-white">{application.candidateName}</p>
              <p className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                <Mail className="h-3 w-3" /> {application.candidateEmail}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 rounded-xl bg-[#101223]/90 p-3.5 border border-[#2B3558]">
            <Building2 className="h-5 w-5 text-violet-400 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-xs text-slate-400">Role & Organization</p>
              <p className="text-sm font-bold text-white">{application.job.title}</p>
              <p className="text-xs text-slate-400 mt-0.5">{application.job.company} · Applied {application.appliedDaysAgo}d ago</p>
            </div>
          </div>
        </div>
      </div>

      {/* Interview Scheduling Form */}
      <form onSubmit={handleSubmit} className="rounded-2xl border border-violet-500/20 bg-gradient-to-b from-[#181A2F]/90 via-[#14172B]/90 to-[#101223]/90 backdrop-blur-xl p-6 shadow-card sm:p-8 space-y-6">
        <h2 className="font-display text-lg font-bold text-white">
          Interview Details
        </h2>

        {/* 1. Interview Type Selection */}
        <div>
          <label className="block text-sm font-semibold text-slate-200 mb-2">
            Interview Type & Platform <span className="text-rose-400">*</span>
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
                      ? 'border-violet-500 bg-violet-500/20 text-white ring-2 ring-violet-500/30'
                      : 'border-[#2B3558] bg-[#101223]/90 text-slate-300 hover:border-violet-500/40 hover:bg-[#13162C]'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <Icon className={`h-4 w-4 ${isSelected ? 'text-violet-400' : 'text-slate-400'}`} />
                    <span>{t.label}</span>
                  </div>
                  <span className="mt-1 text-xs text-slate-400 leading-snug">{t.description}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Date, Time & Duration */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              Interview Date <span className="text-rose-400">*</span>
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-[#2B3558] bg-[#101223]/90 px-3.5 py-2.5 text-sm font-medium text-slate-100 outline-none transition focus:border-violet-500 focus:bg-[#13162C] focus:ring-2 focus:ring-violet-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              Start Time <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 10:00 AM"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full rounded-xl border border-[#2B3558] bg-[#101223]/90 px-3.5 py-2.5 text-sm font-medium text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-violet-500 focus:bg-[#13162C] focus:ring-2 focus:ring-violet-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              Duration
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full rounded-xl border border-[#2B3558] bg-[#101223] px-3.5 py-2.5 text-sm font-medium text-slate-100 outline-none transition focus:border-violet-500 focus:bg-[#13162C] focus:ring-2 focus:ring-violet-500/20"
            >
              {durationOptions.map((opt) => (
                <option key={opt} value={opt} className="bg-[#101223] text-slate-100">
                  {opt}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 3. Dynamic Platform / Location Specific Fields */}
        {(type === 'Google Meet' || type === 'Zoom') && (
          <div className="animate-fade-in rounded-xl border border-violet-500/30 bg-violet-500/10 p-4">
            <label className="block text-xs font-bold text-violet-300 mb-1.5">
              {type} Meeting URL <span className="text-rose-400">*</span>
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="url"
                  required
                  value={meetingLink}
                  onChange={(e) => setMeetingLink(e.target.value)}
                  placeholder={type === 'Google Meet' ? 'https://meet.google.com/...' : 'https://zoom.us/j/...'}
                  className="w-full rounded-xl border border-[#2B3558] bg-[#101223]/90 px-3.5 py-2.5 text-sm font-mono text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-violet-500 focus:bg-[#13162C] focus:ring-2 focus:ring-violet-500/20"
                />
              </div>
              <button
                type="button"
                onClick={() => handleTypeChange(type)}
                className="shrink-0 rounded-xl border border-violet-500/40 bg-violet-500/20 px-3.5 py-2 text-xs font-bold text-violet-300 hover:bg-violet-500/30 transition"
              >
                Generate Link
              </button>
            </div>
            <p className="mt-1.5 text-xs text-slate-400">
              The candidate will see a "Join Meeting" button on their dashboard and interview details page.
            </p>
          </div>
        )}

        {type === 'In Office' && (
          <div className="animate-fade-in rounded-xl border border-[#2B3558] bg-[#101223]/80 p-4">
            <label className="block text-xs font-bold text-slate-200 mb-1.5">
              Office Location & Room Address <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. 100 Market St, Suite 400, Conference Room B, San Francisco, CA"
              className="w-full rounded-xl border border-[#2B3558] bg-[#101223]/90 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-violet-500 focus:bg-[#13162C] focus:ring-2 focus:ring-violet-500/20"
            />
            <p className="mt-1.5 text-xs text-slate-400">
              This physical address will be displayed prominently on the candidate's interview view.
            </p>
          </div>
        )}

        {type === 'Phone Call' && (
          <div className="animate-fade-in rounded-xl border border-[#2B3558] bg-[#101223]/80 p-4">
            <label className="block text-xs font-bold text-slate-200 mb-1.5">
              Candidate Contact Phone or Dial-in Number <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. +1 (555) 234-5678 or Company Dial-in bridge #102"
              className="w-full rounded-xl border border-[#2B3558] bg-[#101223]/90 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-violet-500 focus:bg-[#13162C] focus:ring-2 focus:ring-violet-500/20"
            />
          </div>
        )}

        {type === 'Other' && (
          <div className="animate-fade-in rounded-xl border border-[#2B3558] bg-[#101223]/80 p-4 space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1">
                Meeting URL (optional)
              </label>
              <input
                type="url"
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                placeholder="https://teams.microsoft.com/..."
                className="w-full rounded-xl border border-[#2B3558] bg-[#101223]/90 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-violet-500 focus:bg-[#13162C] focus:ring-2 focus:ring-violet-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1">
                Location Details / Instructions
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Teams channel or external office"
                className="w-full rounded-xl border border-[#2B3558] bg-[#101223]/90 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-violet-500 focus:bg-[#13162C] focus:ring-2 focus:ring-violet-500/20"
              />
            </div>
          </div>
        )}

        {/* 4. Interviewer Information */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              Interviewer Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={interviewerName}
              onChange={(e) => setInterviewerName(e.target.value)}
              placeholder="e.g. Sarah Chen"
              className="w-full rounded-xl border border-[#2B3558] bg-[#101223]/90 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-violet-500 focus:bg-[#13162C] focus:ring-2 focus:ring-violet-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">
              Interviewer Role / Title
            </label>
            <input
              type="text"
              value={interviewerRole}
              onChange={(e) => setInterviewerRole(e.target.value)}
              placeholder="e.g. Engineering Manager"
              className="w-full rounded-xl border border-[#2B3558] bg-[#101223]/90 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-violet-500 focus:bg-[#13162C] focus:ring-2 focus:ring-violet-500/20"
            />
          </div>
        </div>

        {/* 5. Additional Notes / Candidate Instructions */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 mb-1.5">
            Additional Instructions / Agenda for Candidate
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Please bring a copy of your recent project code or portfolio. We will spend the first 20 minutes discussing architecture..."
            className="w-full rounded-xl border border-[#2B3558] bg-[#101223]/90 px-3.5 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-violet-500 focus:bg-[#13162C] focus:ring-2 focus:ring-violet-500/20"
          />
        </div>

        {/* Action Buttons */}
        <div className="border-t border-white/10 pt-5 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/company/dashboard')}
            className="rounded-xl border border-[#2B3558] bg-[#101223]/80 px-5 py-2.5 text-sm font-semibold text-slate-300 hover:bg-[#151930] hover:text-white transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 px-6 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:brightness-110 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Scheduling...</span>
              </>
            ) : (
              <>
                <CalendarCheck className="h-4 w-4" />
                <span>{isReschedule ? 'Update & Reschedule Interview' : 'Schedule Interview'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
