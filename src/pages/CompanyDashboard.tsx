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

    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    <div className="mx-auto max-w-6xl animate-fade-in">
      <div className="mb-8">
        <p className="text-sm font-semibold text-brand-600">Company workspace</p>
        <h1 className="font-display text-3xl font-bold text-ink-900">
          Hiring dashboard
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          Create job listings and review incoming applications.
        </p>
      </div>

      {error && (
        <div className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error}
        </div>
      )}

      <section className="mb-8 rounded-2xl border border-ink-200 bg-white p-6 shadow-card">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="font-display text-xl font-bold text-ink-900">
              {editingJob ? 'Edit job listing' : 'Post a new job'}
            </h2>
            <p className="text-sm text-ink-500">
              This job will belong only to your company account.
            </p>
          </div>

          {editingJob && (
            <button
              type="button"
              onClick={resetForm}
              className="text-sm font-semibold text-brand-600 hover:text-brand-700"
            >
              Cancel editing
            </button>
          )}
        </div>

        <form onSubmit={submitJob} className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-500">
              Job Title
            </label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Senior Frontend Engineer"
              className="h-11 w-full rounded-xl border border-ink-200 bg-white px-3.5 text-sm text-ink-900 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-500">
              Company Name
            </label>
            <input
              required
              value={form.company}
              onChange={(e) => setForm({ ...form, company: e.target.value })}
              placeholder="e.g. Acme Corp"
              className="h-11 w-full rounded-xl border border-ink-200 bg-white px-3.5 text-sm text-ink-900 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-500">
              Location
            </label>
            <input
              required
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="e.g. San Francisco, CA or Remote"
              className="h-11 w-full rounded-xl border border-ink-200 bg-white px-3.5 text-sm text-ink-900 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-500">
              Employment Type
            </label>
            <select
              value={form.type}
              onChange={(e) =>
                setForm({ ...form, type: e.target.value as Job['type'] })
              }
              className="h-11 w-full rounded-xl border border-ink-200 bg-white px-3.5 text-sm text-ink-900 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            >
              <option>Full-time</option>
              <option>Part-time</option>
              <option>Internship</option>
              <option>Contract</option>
            </select>
          </div>

          {/* Salary Range Section */}
          <div className="md:col-span-2">
            <label className="mb-1.5 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-ink-500">
              <span className="flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5 text-brand-600" />
                Salary Range (Annual in $k USD)
              </span>
              <span className="text-xs font-normal normal-case text-ink-400">
                Type numbers/decimals (e.g. 90 to 135 = $90k – $135k/year)
              </span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-ink-400">
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
                  className="h-11 w-full rounded-xl border border-ink-200 bg-white pl-8 pr-12 text-sm text-ink-900 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                />
                <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-ink-400">
                  k/yr
                </span>
              </div>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-ink-400">
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
                  className="h-11 w-full rounded-xl border border-ink-200 bg-white pl-8 pr-12 text-sm text-ink-900 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                />
                <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-ink-400">
                  k/yr
                </span>
              </div>
            </div>
          </div>

          {/* Skills Section */}
          <div className="md:col-span-2">
            <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-ink-500">
              <Tag className="h-3.5 w-3.5 text-brand-600" />
              Required Skills & Technologies
            </label>
            <input
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g. React, TypeScript, Node.js, PostgreSQL"
              className="h-11 w-full rounded-xl border border-ink-200 bg-white px-3.5 text-sm text-ink-900 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
            <p className="mt-1 text-xs text-ink-400">
              Separate skills with commas (e.g., React, TypeScript, Tailwind CSS, Python)
            </p>
          </div>

          <div className="md:col-span-2">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-ink-500">
              Job Description & Requirements
            </label>
            <textarea
              required
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Detail the role responsibilities, ideal experience, and benefits..."
              className="min-h-28 w-full rounded-xl border border-ink-200 bg-white px-3.5 py-3 text-sm text-ink-900 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
          </div>

          <div className="flex items-center justify-between md:col-span-2">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-ink-700">
              <input
                type="checkbox"
                checked={form.remote}
                onChange={(e) => setForm({ ...form, remote: e.target.checked })}
                className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
              />
              Remote role available
            </label>

            <button
              disabled={saving}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 text-sm font-semibold text-white shadow-soft hover:bg-brand-700 disabled:opacity-60 transition"
            >
              <Plus className="h-4 w-4" />
              {saving ? 'Saving…' : editingJob ? 'Update listing' : 'Post job'}
            </button>
          </div>
        </form>
      </section>

      <section className="mb-8">
        <div className="mb-4 flex items-center gap-2">
          <Briefcase className="h-5 w-5 text-brand-600" />
          <h2 className="font-display text-xl font-bold text-ink-900">
            Your job listings ({jobs.length})
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {jobs.map((job) => (
            <article key={job.id} className="rounded-2xl border border-ink-200 bg-white p-5 shadow-card">
              <h3 className="font-display text-lg font-bold text-ink-900">{job.title}</h3>
              <p className="text-sm text-ink-500">{job.company} · {job.location}</p>
              <p className="mt-3 text-sm text-ink-600">{job.description}</p>

              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => startEdit(job)}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600"
                >
                  <Pencil className="h-4 w-4" /> Edit
                </button>
                <button
                  onClick={() => void removeJob(job.id)}
                  className="inline-flex items-center gap-1.5 text-sm font-semibold text-rose-600"
                >
                  <Trash2 className="h-4 w-4" /> Delete
                </button>
              </div>
            </article>
          ))}

          {!loading && jobs.length === 0 && (
            <p className="rounded-2xl border border-dashed border-ink-300 bg-white p-8 text-sm text-ink-500">
              No listings yet. Use the form above to post your first job.
            </p>
          )}
        </div>
      </section>

      <section>
        <div className="mb-2 flex items-center gap-2">
          <Users className="h-5 w-5 text-brand-600" />
          <h2 className="font-display text-xl font-bold text-ink-900">
            Applications ({applications.length})
          </h2>
        </div>
        <p className="mb-4 text-sm text-ink-500">
          AI-style fit score is a demo score based on job skills and profile details.
        </p>

        <div className="space-y-4">
          {applications.map((application) => {
            const iv = application.interview;
            const isAccepted = application.status === 'accepted';
            const isRejected = application.status === 'rejected';
            const isPending = application.status === 'pending';

            return (
              <article key={application.id} className="rounded-2xl border border-ink-200 bg-white p-5 shadow-card">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <h3 className="font-display font-bold text-ink-900 text-lg">{application.candidateName}</h3>
                      <span className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-bold text-brand-700 border border-brand-200">
                        Demo AI fit: {demoFitScore(application)}%
                      </span>
                    </div>
                    <p className="text-sm text-ink-500">{application.candidateEmail}</p>
                    <p className="mt-2 text-sm text-ink-700">
                      Applied for <span className="font-semibold">{application.job.title}</span> · {application.appliedDaysAgo}d ago
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-bold ${
                        isAccepted
                          ? 'bg-accent-50 text-accent-700 border border-accent-200'
                          : isRejected
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-brand-50 text-brand-700 border border-brand-200'
                      }`}
                    >
                      {isAccepted ? 'Accepted' : isRejected ? 'Rejected' : 'Under Review'}
                    </span>
                  </div>
                </div>

                {/* Scheduled Interview Details Card */}
                {isAccepted && iv && (
                  <div className="mt-4 rounded-xl border border-accent-200 bg-accent-50/40 p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 rounded-md bg-accent-100 px-2 py-0.5 text-xs font-bold text-accent-800">
                            <Calendar className="h-3.5 w-3.5 text-accent-600" />
                            Interview Scheduled
                          </span>
                          <span className="text-xs font-semibold text-ink-700">
                            {iv.type || iv.format}
                          </span>
                        </div>
                        <p className="mt-2 font-display text-sm font-bold text-ink-900">
                          {iv.date} at {iv.time || iv.startTime} ({iv.duration || '45 mins'})
                        </p>
                        <p className="text-xs text-ink-500 mt-0.5">
                          with {iv.withName || iv.interviewerName} ({iv.withRole || iv.interviewerRole})
                        </p>
                        {iv.meetingLink && (
                          <p className="mt-1 flex items-center gap-1 text-xs text-brand-600">
                            <Video className="h-3 w-3" />
                            <a
                              href={iv.meetingLink}
                              target="_blank"
                              rel="noreferrer"
                              className="font-mono underline hover:text-brand-700 truncate max-w-sm"
                            >
                              {iv.meetingLink}
                            </a>
                          </p>
                        )}
                        {iv.location && (
                          <p className="mt-1 flex items-center gap-1 text-xs text-ink-600">
                            <MapPin className="h-3 w-3 text-ink-400" />
                            <span>{iv.location}</span>
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-center">
                        <button
                          onClick={() => navigate(`/company/applications/${application.id}/schedule-interview`)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-ink-200 bg-white px-3 py-1.5 text-xs font-semibold text-ink-700 shadow-sm transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
                        >
                          <CalendarClock className="h-3.5 w-3.5 text-brand-600" />
                          Reschedule
                        </button>
                        <button
                          onClick={() => void handleCancelInterview(iv.id)}
                          className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 shadow-sm transition hover:bg-rose-50"
                        >
                          <XCircle className="h-3.5 w-3.5 text-rose-600" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions for Pending application */}
                {isPending && (
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => navigate(`/company/applications/${application.id}/schedule-interview`)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-accent-600 px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-accent-700"
                    >
                      <Calendar className="h-4 w-4" />
                      Accept & Schedule Interview
                    </button>
                    <button
                      onClick={() => void reviewApplication(application.id, 'rejected')}
                      className="rounded-xl border border-ink-200 bg-white px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition"
                    >
                      Reject
                    </button>
                  </div>
                )}

                {/* Action for accepted application without interview */}
                {isAccepted && !iv && (
                  <div className="mt-4 flex items-center gap-3">
                    <button
                      onClick={() => navigate(`/company/applications/${application.id}/schedule-interview`)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-700"
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
            <p className="rounded-2xl border border-dashed border-ink-300 bg-white p-8 text-sm text-ink-500">
              Applications to jobs you post will appear here.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}