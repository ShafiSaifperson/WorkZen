import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  XCircle,
  Briefcase,
  Loader2,
  AlertCircle,
  Inbox,
} from 'lucide-react';
import { fetchApplications } from '@/lib/data';
import { useAuth } from '@/lib/auth';
import type { Application, AppStatus } from '@/lib/types';

const statusConfig: Record<
  AppStatus,
  { label: string; icon: typeof CheckCircle2; color: string; bg: string; border: string }
> = {
  accepted: {
    label: 'Accepted',
    icon: CheckCircle2,
    color: 'text-accent-700',
    bg: 'bg-accent-50',
    border: 'border-accent-200',
  },
  pending: {
    label: 'Pending',
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

function ApplicationCard({ app }: { app: Application }) {
  const cfg = statusConfig[app.status];
  return (
    <Link
      to={`/app/applications/${app.id}`}
      className="group flex items-center gap-4 rounded-xl border border-ink-100 bg-white p-4 transition hover:border-ink-200 hover:shadow-soft"
    >
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-ink-900 text-xs font-bold text-white">
        {app.job.logo}
      </div>
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-semibold text-ink-900">{app.job.title}</p>
        <p className="truncate text-xs text-ink-400">
          {app.job.company} · Applied {app.appliedDaysAgo}d ago
        </p>
      </div>
      <span
        className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${cfg.bg} ${cfg.color}`}
      >
        <cfg.icon className="h-3.5 w-3.5" />
        {cfg.label}
      </span>
    </Link>
  );
}

function StatusSection({
  status,
  apps,
}: {
  status: AppStatus;
  apps: Application[];
}) {
  if (apps.length === 0) return null;
  const cfg = statusConfig[status];
  return (
    <section>
      <div className="mb-3 flex items-center gap-2.5">
        <div className={`grid h-8 w-8 place-items-center rounded-lg ${cfg.bg} ${cfg.color}`}>
          <cfg.icon className="h-4 w-4" />
        </div>
        <h2 className="font-display text-lg font-bold text-ink-900">{cfg.label}</h2>
        <span className="rounded-full bg-ink-100 px-2.5 py-0.5 text-xs font-semibold text-ink-600">
          {apps.length}
        </span>
      </div>
      <div className="space-y-2.5">
        {apps.map((a) => (
          <ApplicationCard key={a.id} app={a} />
        ))}
      </div>
    </section>
  );
}

export function ApplicationsPage() {
  const { user } = useAuth();
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    fetchApplications(user.id)
      .then(setApps)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [user]);

  const grouped = useMemo(() => {
    return {
      accepted: apps.filter((a) => a.status === 'accepted'),
      pending: apps.filter((a) => a.status === 'pending'),
      rejected: apps.filter((a) => a.status === 'rejected'),
    };
  }, [apps]);

  return (
    <div className="mx-auto max-w-4xl animate-fade-in">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-ink-900 sm:text-3xl">
          My Applications
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          Track the status of every role you&apos;ve applied to.
        </p>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="grid place-items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
        </div>
      ) : apps.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-300 bg-white py-16 text-center">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-ink-100">
            <Inbox className="h-7 w-7 text-ink-400" />
          </div>
          <p className="mt-4 text-sm font-medium text-ink-700">No applications yet</p>
          <p className="mt-1 text-xs text-ink-400">
            Browse jobs and apply to get started.
          </p>
          <Link
            to="/app/jobs"
            className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700"
          >
            <Briefcase className="h-4 w-4" /> Find jobs
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          <StatusSection status="accepted" apps={grouped.accepted} />
          <StatusSection status="pending" apps={grouped.pending} />
          <StatusSection status="rejected" apps={grouped.rejected} />
        </div>
      )}
    </div>
  );
}
