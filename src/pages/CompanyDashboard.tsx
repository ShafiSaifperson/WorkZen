import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase,
  DollarSign,
  MapPin,
  Pencil,
  Plus,
  Tag,
  Trash2,
  Users,
  Calendar,
  Clock,
  Video,
  Phone,
  CalendarClock,
  XCircle,
  CheckCircle2,
  ExternalLink,
  MoreVertical,
  Building2,
  Sparkles,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { useAuth } from '@/lib/auth';
import {
  createCompanyJob,
  deleteCompanyJob,
  fetchCompanyApplications,
  fetchCompanyJobs,
  updateCompanyApplicationStatus,
  updateCompanyJob,
  cancelCompanyInterview,
} from '@/lib/data';
import type { CompanyApplication, Job, JobInput } from '@/lib/types';

function emptyForm(company = ''): JobInput {
  return {
    title: '',
    company,
    logo: 'WZ',
    location: '',
    description: '',
    remote: true,
    type: 'Full-time',
    salaryMin: 0,
    salaryMax: 0,
    tags: [],
  };
}

function demoFitScore(application: CompanyApplication) {
  return Math.min(
    96,
    62 + application.job.tags.length * 5 + (application.candidateName.length % 12)
  );
}

// Distinct card gradient identities for job listing cards
const jobCardGradients = [
  'bg-gradient-to-br from-[#181530]/95 via-[#13152A]/90 to-[#101223]/90 border-violet-500/30 border-l-violet-500 shadow-[0_8px_25px_rgba(139,92,246,0.12)]',
  'bg-gradient-to-br from-[#121E36]/95 via-[#10192F]/90 to-[#0F1424]/90 border-blue-500/30 border-l-blue-500 shadow-[0_8px_25px_rgba(59,130,246,0.12)]',
  'bg-gradient-to-br from-[#0F2826]/95 via-[#0E2024]/90 to-[#0D1620]/90 border-teal-500/30 border-l-teal-500 shadow-[0_8px_25px_rgba(20,184,166,0.12)]',
  'bg-gradient-to-br from-[#2D1620]/95 via-[#23121C]/90 to-[#180E17]/90 border-rose-500/30 border-l-rose-500 shadow-[0_8px_25px_rgba(244,63,94,0.12)]',
];

export function CompanyDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<CompanyApplication[]>([]);
  const [form, setForm] = useState<JobInput>(() => emptyForm());
  const [tagsInput, setTagsInput] = useState('');
  const [salaryMinInput, setSalaryMinInput] = useState('');
  const [salaryMaxInput, setSalaryMaxInput] = useState('');
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadDashboard() {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const [companyJobs, companyApplications] = await Promise.all([
        fetchCompanyJobs(user.id),
        fetchCompanyApplications(user.id),
      ]);

      setJobs(companyJobs);
      setApplications(companyApplications);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDashboard();
  }, [user]);

  function resetForm() {
    setForm(emptyForm(user?.full_name || 'My Company'));
    setTagsInput('');
    setSalaryMinInput('');
    setSalaryMaxInput('');
    setEditingJob(null);
  }

  function startEdit(job: Job) {
    setEditingJob(job);
    setForm({
      title: job.title,
      company: job.company,
      logo: job.logo,
      location: job.location,
      description: job.description,
      remote: job.remote,
      type: job.type,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      tags: job.tags,
    });
    setTagsInput(job.tags ? job.tags.join(', ') : '');
    setSalaryMinInput(job.salaryMin ? String(job.salaryMin) : '');
    setSalaryMaxInput(job.salaryMax ? String(job.salaryMax) : '');

    const el = document.getElementById('post-job-form');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }

  async function submitJob(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;

    setSaving(true);
    setError(null);

    const parsedTags = tagsInput
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);

    const salaryMin = parseFloat(salaryMinInput) || 0;
    const salaryMax = parseFloat(salaryMaxInput) || 0;

    const jobPayload: JobInput = {
      ...form,
      tags: parsedTags,
      salaryMin,
      salaryMax,
    };

    try {
      if (editingJob) {
        await updateCompanyJob(user.id, editingJob.id, jobPayload);
      } else {
        await createCompanyJob(user.id, jobPayload);
      }

      resetForm();
      await loadDashboard();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  async function removeJob(jobId: string) {
    if (!user || !window.confirm('Delete this job listing?')) return;

    try {
      await deleteCompanyJob(user.id, jobId);
      await loadDashboard();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function reviewApplication(
    applicationId: string,
    status: 'accepted' | 'rejected'
  ) {
    if (!user) return;

    try {
      await updateCompanyApplicationStatus(user.id, applicationId, status);
      await loadDashboard();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function handleCancelInterview(interviewId: string) {
    if (
      !user ||
      !window.confirm('Are you sure you want to cancel this interview? The candidate will be notified.')
    )
      return;

    try {
      await cancelCompanyInterview(user.id, interviewId, 'Cancelled by company hiring team.');
      await loadDashboard();
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 animate-fade-in pb-16">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-violet-400">
            Company workspace
          </p>
          <h1 className="mt-1 font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Hiring dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Create job listings and review incoming applications.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            resetForm();
            const el = document.getElementById('post-job-form');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
          className="inline-flex items-center gap-2 self-start sm:self-auto rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 px-5 py-2.5 text-sm font-semibold text-white shadow-[0_0_20px_rgba(168,85,247,0.3)] hover:brightness-110 transition active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          <span>Post a new job</span>
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300 backdrop-blur-md">
          {error}
        </div>
      )}

      {/* Section 1: Post / Edit Job Form */}
      <section
        id="post-job-form"
        className="relative overflow-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-b from-[#181A2F]/90 via-[#14172B]/90 to-[#101223]/90 backdrop-blur-xl p-6 sm:p-7 shadow-[0_8px_30px_rgba(0,0,0,0.35)]"
      >
        {/* Subtle radial corner glow */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-violet-600/10 blur-3xl" />

        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-violet-500/20 text-violet-300 border border-violet-500/30 shadow-inner">
              <Briefcase className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-lg sm:text-xl font-bold text-white">
                {editingJob ? 'Edit job listing' : 'Post a new job'}
              </h2>
              <p className="text-xs text-slate-400">
                This job will belong only to your company account.
              </p>
            </div>
          </div>

          {editingJob && (
            <button
              type="button"
              onClick={resetForm}
              className="text-xs font-semibold text-violet-400 hover:text-violet-300 transition"
            >
              Cancel editing
            </button>
          )}
        </div>

        <form onSubmit={submitJob} className="grid gap-5 md:grid-cols-2">
          {/* Job Title */}
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Job Title
            </label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Senior Frontend Engineer"
              className="h-11 w-full rounded-xl border border-[#2B3558] bg-[#101223]/90 px-3.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-violet-500 focus:bg-[#13162C] focus:ring-2 focus:ring-violet-500/20"
            />
          </div>

          {/* Company Name */}
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Company Name
            </label>
            <input
              required
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
              placeholder="e.g. Acme Corp"
              className="h-11 w-full rounded-xl border border-[#2B3558] bg-[#101223]/90 px-3.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-violet-500 focus:bg-[#13162C] focus:ring-2 focus:ring-violet-500/20"
            />
          </div>

          {/* Location */}
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Location
            </label>
            <input
              required
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="e.g. San Francisco, CA or Remote"
              className="h-11 w-full rounded-xl border border-[#2B3558] bg-[#101223]/90 px-3.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-violet-500 focus:bg-[#13162C] focus:ring-2 focus:ring-violet-500/20"
            />
          </div>

          {/* Employment Type */}
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Employment Type
            </label>
            <select
              value={form.type}
              onChange={(e) =>
                setForm({ ...form, type: e.target.value as Job['type'] })
              }
              className="h-11 w-full rounded-xl border border-[#2B3558] bg-[#101223] px-3.5 text-sm text-slate-100 outline-none transition focus:border-violet-500 focus:bg-[#13162C] focus:ring-2 focus:ring-violet-500/20"
            >
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
              <option value="Internship">Internship</option>
              <option value="Contract">Contract</option>
            </select>
          </div>

          {/* Salary Range Section */}
          <div className="md:col-span-2">
            <div className="mb-1.5 flex flex-wrap items-center justify-between gap-1">
              <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <DollarSign className="h-3.5 w-3.5 text-violet-400" />
                Salary Range (Annual in $k USD)
              </label>
              <span className="text-[11px] text-slate-500">
                Type numbers/decimals (e.g. 90 to 135 = $90k – $135k/year)
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                  $
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={salaryMinInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '' || /^[0-9]*\.?[0-9]*$/.test(val)) {
                      setSalaryMinInput(val);
                    }
                  }}
                  placeholder="Min (e.g. 80)"
                  className="h-11 w-full rounded-xl border border-[#2B3558] bg-[#101223]/90 pl-8 pr-12 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-violet-500 focus:bg-[#13162C] focus:ring-2 focus:ring-violet-500/20"
                />
                <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                  k/yr
                </span>
              </div>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                  $
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={salaryMaxInput}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '' || /^[0-9]*\.?[0-9]*$/.test(val)) {
                      setSalaryMaxInput(val);
                    }
                  }}
                  placeholder="Max (e.g. 120)"
                  className="h-11 w-full rounded-xl border border-[#2B3558] bg-[#101223]/90 pl-8 pr-12 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-violet-500 focus:bg-[#13162C] focus:ring-2 focus:ring-violet-500/20"
                />
                <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-slate-400">
                  k/yr
                </span>
              </div>
            </div>
          </div>

          {/* Required Skills & Technologies */}
          <div className="md:col-span-2">
            <label className="mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <Tag className="h-3.5 w-3.5 text-violet-400" />
              Required Skills & Technologies
            </label>
            <input
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g. React, TypeScript, Node.js, PostgreSQL"
              className="h-11 w-full rounded-xl border border-[#2B3558] bg-[#101223]/90 px-3.5 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-violet-500 focus:bg-[#13162C] focus:ring-2 focus:ring-violet-500/20"
            />
            <p className="mt-1 text-[11px] text-slate-500">
              Separate skills with commas (e.g., React, TypeScript, Tailwind CSS, Python)
            </p>
          </div>

          {/* Job Description & Requirements */}
          <div className="md:col-span-2">
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Job Description & Requirements
            </label>
            <textarea
              required
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Detail the role responsibilities, ideal experience, and benefits..."
              className="min-h-28 w-full rounded-xl border border-[#2B3558] bg-[#101223]/90 px-3.5 py-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition focus:border-violet-500 focus:bg-[#13162C] focus:ring-2 focus:ring-violet-500/20"
            />
          </div>

          {/* Bottom Controls */}
          <div className="flex flex-wrap items-center justify-between gap-4 md:col-span-2 pt-1">
            <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium text-slate-300">
              <input
                type="checkbox"
                checked={form.remote}
                onChange={(e) => setForm({ ...form, remote: e.target.checked })}
                className="h-4 w-4 rounded border-[#2B3558] bg-[#101223] text-violet-600 focus:ring-violet-500/30"
              />
              <span>Remote role available</span>
            </label>

            <button
              disabled={saving}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 px-6 text-sm font-semibold text-white shadow-[0_0_20px_rgba(168,85,247,0.25)] hover:brightness-110 active:scale-[0.98] disabled:opacity-60 transition"
            >
              <Plus className="h-4 w-4" />
              <span>{saving ? 'Saving…' : editingJob ? 'Update listing' : 'Post job'}</span>
            </button>
          </div>
        </form>
      </section>

      {/* Section 2: Your Job Listings */}
      <section id="jobs" className="space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="grid h-8 w-8 place-items-center rounded-xl bg-violet-500/20 text-violet-300 border border-violet-500/30 shadow-inner">
            <Briefcase className="h-4 w-4" />
          </div>
          <h2 className="font-display text-xl font-bold text-white">
            Your job listings ({jobs.length})
          </h2>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {jobs.map((job, idx) => {
            const cardGradient = jobCardGradients[idx % jobCardGradients.length];

            return (
              <article
                key={job.id}
                className={`relative flex flex-col justify-between rounded-2xl border border-l-4 p-5 backdrop-blur-md transition hover:translate-y-[-2px] ${cardGradient}`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-display text-lg font-bold text-white">
                        {job.title}
                      </h3>
                      <p className="text-xs font-medium text-slate-400 mt-0.5">
                        {job.company} • {job.location}
                      </p>
                    </div>

                    <button
                      type="button"
                      className="rounded-lg p-1 text-slate-400 hover:bg-white/5 hover:text-white transition"
                      aria-label="More options"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </div>

                  <p className="mt-3 text-xs text-slate-300 leading-relaxed line-clamp-3">
                    {job.description}
                  </p>

                  {(job.tags?.length > 0 || (job.salaryMin > 0 && job.salaryMax > 0)) && (
                    <div className="mt-3.5 flex flex-wrap gap-1.5">
                      {job.salaryMin > 0 && job.salaryMax > 0 && (
                        <span className="rounded-md bg-white/5 border border-white/10 px-2 py-0.5 text-[11px] font-semibold text-slate-300">
                          ${job.salaryMin}k–${job.salaryMax}k
                        </span>
                      )}
                      <span className="rounded-md bg-white/5 border border-white/10 px-2 py-0.5 text-[11px] font-semibold text-slate-300">
                        {job.type}
                      </span>
                      {job.tags?.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-md bg-white/5 border border-white/10 px-2 py-0.5 text-[11px] text-slate-300"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-5 flex items-center gap-4 border-t border-white/10 pt-3.5">
                  <button
                    onClick={() => startEdit(job)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-400 hover:text-violet-300 transition"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => void removeJob(job.id)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-400 hover:text-rose-300 transition"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
              </article>
            );
          })}

          {!loading && jobs.length === 0 && (
            <div className="md:col-span-2 rounded-2xl border border-dashed border-[#242E49] bg-[#121528]/70 p-8 text-center text-sm text-slate-400">
              No listings yet. Use the form above to post your first job.
            </div>
          )}
        </div>
      </section>

      {/* Section 3: Applications & Interview Pipeline */}
      <section id="applications" className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30 shadow-inner">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-display text-xl font-bold text-white">
                Applications ({applications.length})
              </h2>
              <p className="text-xs text-slate-400">
                AI-style fit score is a demo score based on job skills and profile details.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {applications.map((application) => {
            const iv = application.interview;
            const isAccepted = application.status === 'accepted';
            const isRejected = application.status === 'rejected';
            const isPending = application.status === 'pending';

            return (
              <article
                key={application.id}
                className="rounded-2xl border border-[#242E49] bg-[#121528]/90 backdrop-blur-md p-5 sm:p-6 shadow-card"
              >
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h3 className="font-display font-bold text-white text-lg">
                        {application.candidateName}
                      </h3>
                      <span className="rounded-full bg-violet-500/20 px-2.5 py-0.5 text-xs font-bold text-violet-300 border border-violet-500/30">
                        Demo AI fit: {demoFitScore(application)}%
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {application.candidateEmail}
                    </p>
                    <p className="mt-2 text-xs text-slate-300">
                      Applied for <span className="font-semibold text-white">{application.job.title}</span> · {application.appliedDaysAgo}d ago
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        isAccepted
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : isRejected
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {isAccepted ? 'Accepted' : isRejected ? 'Rejected' : 'Under Review'}
                    </span>
                  </div>
                </div>

                {/* Scheduled Interview Details Card */}
                {isAccepted && iv && (
                  <div
                    id="interviews"
                    className="mt-4 rounded-xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/40 via-teal-950/30 to-[#101828] p-4 backdrop-blur-md"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/20 px-2 py-0.5 text-xs font-bold text-emerald-300 border border-emerald-500/30">
                            <Calendar className="h-3.5 w-3.5 text-emerald-400" />
                            Interview Scheduled
                          </span>
                          <span className="text-xs font-semibold text-slate-300">
                            {iv.type || iv.format}
                          </span>
                        </div>
                        <p className="mt-2 font-display text-sm font-bold text-white">
                          {iv.date} at {iv.time || iv.startTime} ({iv.duration || '45 mins'})
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          with {iv.withName || iv.interviewerName} ({iv.withRole || iv.interviewerRole})
                        </p>
                        {iv.meetingLink && (
                          <p className="mt-1 flex items-center gap-1 text-xs text-violet-400">
                            <Video className="h-3 w-3" />
                            <a
                              href={iv.meetingLink}
                              target="_blank"
                              rel="noreferrer"
                              className="font-mono underline hover:text-violet-300 truncate max-w-sm"
                            >
                              {iv.meetingLink}
                            </a>
                          </p>
                        )}
                        {iv.location && (
                          <p className="mt-1 flex items-center gap-1 text-xs text-slate-300">
                            <MapPin className="h-3 w-3 text-slate-400" />
                            <span>{iv.location}</span>
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-center">
                        <button
                          onClick={() => navigate(`/company/applications/${application.id}/schedule-interview`)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-[#2B3558] bg-white/5 px-3 py-1.5 text-xs font-semibold text-slate-200 shadow-sm transition hover:border-violet-500/50 hover:bg-white/10 hover:text-white"
                        >
                          <CalendarClock className="h-3.5 w-3.5 text-violet-400" />
                          Reschedule
                        </button>
                        <button
                          onClick={() => void handleCancelInterview(iv.id)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300 shadow-sm transition hover:bg-rose-500/20"
                        >
                          <XCircle className="h-3.5 w-3.5 text-rose-400" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions for Pending application */}
                {isPending && (
                  <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-white/10 pt-3">
                    <button
                      onClick={() => navigate(`/company/applications/${application.id}/schedule-interview`)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-xs font-semibold text-white shadow-soft transition hover:brightness-110"
                    >
                      <Calendar className="h-4 w-4" />
                      Accept & Schedule Interview
                    </button>
                    <button
                      onClick={() => void reviewApplication(application.id, 'rejected')}
                      className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition"
                    >
                      Reject
                    </button>
                  </div>
                )}

                {/* Action for accepted application without interview */}
                {isAccepted && !iv && (
                  <div className="mt-4 flex items-center gap-3 border-t border-white/10 pt-3">
                    <button
                      onClick={() => navigate(`/company/applications/${application.id}/schedule-interview`)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-soft transition hover:brightness-110"
                    >
                      <Calendar className="h-4 w-4" />
                      Schedule Interview
                    </button>
                  </div>
                )}
              </article>
            );
          })}

          {!loading && applications.length === 0 && (
            <p className="rounded-2xl border border-dashed border-[#242E49] bg-[#121528]/70 p-8 text-center text-sm text-slate-400">
              Applications to jobs you post will appear here.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}