import { useEffect, useState, type FormEvent } from 'react';
import { Briefcase, Pencil, Plus, Trash2, Users } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import {
  createCompanyJob,
  deleteCompanyJob,
  fetchCompanyApplications,
  fetchCompanyJobs,
  updateCompanyApplicationStatus,
  updateCompanyJob,
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
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<CompanyApplication[]>([]);
  const [form, setForm] = useState<JobInput>(() => emptyForm());
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
  }, [user?.id]);

  function resetForm() {
    setEditingJob(null);
    setForm(emptyForm(user?.full_name || 'My Company'));
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

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function submitJob(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;

    setSaving(true);
    setError(null);

    try {
      if (editingJob) {
        await updateCompanyJob(user.id, editingJob.id, form);
      } else {
        await createCompanyJob(user.id, form);
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

      <section className="mb-8 rounded-2xl border border-ink-200 bg-white p-5 shadow-card">
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
              className="text-sm font-semibold text-brand-600"
            >
              Cancel editing
            </button>
          )}
        </div>

        <form onSubmit={submitJob} className="grid gap-4 md:grid-cols-2">
          <input
            required
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Job title"
            className="h-11 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-400"
          />
          <input
            required
            value={form.company}
            onChange={(e) => setForm({ ...form, company: e.target.value })}
            placeholder="Company name"
            className="h-11 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-400"
          />
          <input
            required
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            placeholder="Location"
            className="h-11 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-400"
          />
          <select
            value={form.type}
            onChange={(e) =>
              setForm({ ...form, type: e.target.value as Job['type'] })
            }
            className="h-11 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-400"
          >
            <option>Full-time</option>
            <option>Part-time</option>
            <option>Internship</option>
            <option>Contract</option>
          </select>
          <input
            type="number"
            min="0"
            value={form.salaryMin}
            onChange={(e) => setForm({ ...form, salaryMin: Number(e.target.value) })}
            placeholder="Minimum salary (thousands)"
            className="h-11 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-400"
          />
          <input
            type="number"
            min="0"
            value={form.salaryMax}
            onChange={(e) => setForm({ ...form, salaryMax: Number(e.target.value) })}
            placeholder="Maximum salary (thousands)"
            className="h-11 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-400"
          />
          <input
            value={form.tags.join(', ')}
            onChange={(e) =>
              setForm({
                ...form,
                tags: e.target.value
                  .split(',')
                  .map((tag) => tag.trim())
                  .filter(Boolean),
              })
            }
            placeholder="Skills, separated by commas"
            className="h-11 rounded-xl border border-ink-200 px-3 text-sm outline-none focus:border-brand-400 md:col-span-2"
          />
          <textarea
            required
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Job requirements and description"
            className="min-h-28 rounded-xl border border-ink-200 px-3 py-3 text-sm outline-none focus:border-brand-400 md:col-span-2"
          />
          <label className="flex items-center gap-2 text-sm text-ink-700">
            <input
              type="checkbox"
              checked={form.remote}
              onChange={(e) => setForm({ ...form, remote: e.target.checked })}
            />
            Remote role
          </label>
          <button
            disabled={saving}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            <Plus className="h-4 w-4" />
            {saving ? 'Saving…' : editingJob ? 'Update listing' : 'Post job'}
          </button>
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

        <div className="space-y-3">
          {applications.map((application) => (
            <article key={application.id} className="rounded-2xl border border-ink-200 bg-white p-5 shadow-card">
              <div className="flex flex-col justify-between gap-4 sm:flex-row">
                <div>
                  <h3 className="font-semibold text-ink-900">{application.candidateName}</h3>
                  <p className="text-sm text-ink-500">{application.candidateEmail}</p>
                  <p className="mt-2 text-sm text-ink-700">
                    Applied for <span className="font-semibold">{application.job.title}</span>
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-brand-50 px-3 py-1.5 text-sm font-bold text-brand-700">
                    Demo AI fit: {demoFitScore(application)}%
                  </span>
                  <span className="rounded-full bg-ink-100 px-3 py-1.5 text-sm font-semibold text-ink-700">
                    {application.status}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => void reviewApplication(application.id, 'accepted')}
                  className="rounded-xl bg-accent-600 px-4 py-2 text-sm font-semibold text-white"
                >
                  Accept
                </button>
                <button
                  onClick={() => void reviewApplication(application.id, 'rejected')}
                  className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white"
                >
                  Reject
                </button>
              </div>
            </article>
          ))}

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