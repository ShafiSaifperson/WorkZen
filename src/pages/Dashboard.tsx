import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Briefcase,
  FileText,
  PenLine,
  Sparkles,
  Calendar,
  Video,
  MapPin,
  Phone,
  ArrowRight,
  CheckCircle2,
  Clock,
  XCircle,
  TrendingUp,
  Loader2,
  Bell,
} from 'lucide-react';
import { fetchApplications, fetchInterviews } from '@/lib/data';
import { useAuth } from '@/lib/auth';
import type { Application, Interview } from '@/lib/types';

function StatusWheel({ apps }: { apps: Application[] }) {
  const total = apps.length;
  const accepted = apps.filter((a) => a.status === 'accepted').length;
  const pending = apps.filter((a) => a.status === 'pending').length;
  const rejected = apps.filter((a) => a.status === 'rejected').length;

  const accPct = total > 0 ? (accepted / total) * 100 : 0;
  const pendPct = total > 0 ? (pending / total) * 100 : 0;
  const rejPct = total > 0 ? (rejected / total) * 100 : 0;

  const radius = 70;
  const circ = 2 * Math.PI * radius;
  const gap = 4;

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-10">
      <div className="relative h-44 w-44 shrink-0">
        <svg viewBox="0 0 180 180" className="h-full w-full -rotate-90">
          <circle cx="90" cy="90" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="14" />
          {total > 0 && (
            <>
              <circle
                cx="90" cy="90" r={radius} fill="none" stroke="#10b981" strokeWidth="14"
                strokeDasharray={`${(accPct / 100) * circ - gap} ${circ}`}
                strokeDashoffset={0}
                strokeLinecap="round"
              />
              <circle
                cx="90" cy="90" r={radius} fill="none" stroke="#3366ff" strokeWidth="14"
                strokeDasharray={`${(pendPct / 100) * circ - gap} ${circ}`}
                strokeDashoffset={-((accPct / 100) * circ) - gap}
                strokeLinecap="round"
              />
              <circle
                cx="90" cy="90" r={radius} fill="none" stroke="#f43f5e" strokeWidth="14"
                strokeDasharray={`${(rejPct / 100) * circ - gap} ${circ}`}
                strokeDashoffset={-((accPct / 100) * circ) - ((pendPct / 100) * circ) - gap * 2}
                strokeLinecap="round"
              />
            </>
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-3xl font-extrabold text-ink-900">{total}</span>
          <span className="text-xs font-medium text-ink-400">applications</span>
        </div>
      </div>
      <div className="grid w-full grid-cols-3 gap-3 sm:max-w-xs">
        <Legend color="bg-accent-500" label="Accepted" value={accepted} />
        <Legend color="bg-brand-500" label="Pending" value={pending} />
        <Legend color="bg-rose-500" label="Rejected" value={rejected} />
      </div>
    </div>
  );
}

function Legend({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div className="rounded-xl border border-ink-200 bg-white p-3 text-center">
      <div className={`mx-auto mb-1.5 h-2.5 w-2.5 rounded-full ${color}`} />
      <p className="font-display text-xl font-bold text-ink-900">{value}</p>
      <p className="text-xs text-ink-400">{label}</p>
    </div>
  );
}

const quickAccess = [
  { to: '/app/jobs', label: 'Find Jobs', desc: 'Search & apply', icon: Briefcase, tint: 'from-brand-500 to-brand-700' },
  { to: '/app/resume-coach', label: 'Resume Coach', desc: 'AI feedback', icon: FileText, tint: 'from-accent-500 to-accent-700' },
  { to: '/app/cover-letter', label: 'Cover Letter', desc: 'Generate with AI', icon: PenLine, tint: 'from-amber-500 to-orange-600' },
];

const statusMap = {
  accepted: { icon: CheckCircle2, color: 'text-accent-600 bg-accent-50', label: 'Accepted' },
  pending: { icon: Clock, color: 'text-brand-600 bg-brand-50', label: 'Pending' },
  rejected: { icon: XCircle, color: 'text-rose-600 bg-rose-50', label: 'Rejected' },
} as const;

const formatIcons: Record<string, typeof Video> = {
  'Video call': Video,
  'On-site': MapPin,
  'Phone screen': Phone,
};

export function DashboardPage() {
  const { user } = useAuth();
  const [apps, setApps] = useState<Application[]>([]);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([fetchApplications(user.id), fetchInterviews(user.id)])
      .then(([a, i]) => {
        setApps(a);
        setInterviews(i);
      })
      .catch(() => {
        setApps([]);
        setInterviews([]);
      })
      .finally(() => setLoading(false));
  }, [user]);

  const pendingCount = useMemo(() => apps.filter((a) => a.status === 'pending').length, [apps]);
  const firstName = useMemo(() => {
    const full = user?.full_name || '';
    return full.split(' ')[0] || 'there';
  }, [user]);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  return (
    <div className="mx-auto max-w-6xl animate-fade-in space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="font-display text-2xl font-bold text-ink-900 sm:text-3xl">
          {greeting}, {firstName}
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          You have {pendingCount} application{pendingCount === 1 ? '' : 's'} awaiting a response.
        </p>
      </div>

      {/* Stats + Quick access */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Application overview — now links to applications page */}
        <Link
          to="/app/applications"
          className="group rounded-2xl border border-ink-200 bg-white p-6 shadow-card transition hover:border-brand-300 hover:shadow-glow lg:col-span-2"
        >
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-bold text-ink-900">Application overview</h2>
              <p className="text-xs text-ink-400">All-time breakdown · click to view details</p>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-accent-500" />
              <ArrowRight className="h-4 w-4 text-ink-300 transition group-hover:translate-x-0.5 group-hover:text-brand-500" />
            </div>
          </div>
          {loading ? (
            <div className="grid place-items-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
            </div>
          ) : (
            <StatusWheel apps={apps} />
          )}
        </Link>

        <div className="rounded-2xl border border-ink-200 bg-white p-6 shadow-card">
          <h2 className="mb-4 font-display text-lg font-bold text-ink-900">Quick access</h2>
          <div className="space-y-2.5">
            {quickAccess.map((q) => (
              <Link
                key={q.to}
                to={q.to}
                className="group flex items-center gap-3 rounded-xl border border-ink-200 p-3 transition hover:border-brand-300 hover:bg-brand-50/50"
              >
                <div className={`grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${q.tint} text-white shadow-soft`}>
                  <q.icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-ink-900">{q.label}</p>
                  <p className="text-xs text-ink-400">{q.desc}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-ink-300 transition group-hover:translate-x-0.5 group-hover:text-brand-500" />
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Upcoming interviews reminder */}
      {!loading && interviews.length > 0 && (
        <div className="rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-50 to-white p-6 shadow-card">
          <div className="mb-4 flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-brand-600 text-white shadow-soft">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-ink-900">Upcoming interviews</h2>
              <p className="text-xs text-ink-400">
                {interviews.length} scheduled · next in {interviews[0].inDays} day{interviews[0].inDays === 1 ? '' : 's'}
              </p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {interviews.map((iv) => {
              const FormatIcon = formatIcons[iv.format] ?? Video;
              return (
                <div
                  key={iv.id}
                  className="group rounded-xl border border-ink-200 bg-white p-4 transition hover:border-brand-300 hover:shadow-soft"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-ink-900">{iv.jobTitle}</p>
                      <p className="truncate text-xs text-ink-400">{iv.company}</p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${
                        iv.inDays <= 3
                          ? 'bg-rose-50 text-rose-600'
                          : iv.inDays <= 5
                            ? 'bg-amber-50 text-amber-600'
                            : 'bg-brand-50 text-brand-600'
                      }`}
                    >
                      {iv.inDays === 0 ? 'Today' : iv.inDays === 1 ? 'Tomorrow' : `${iv.inDays}d`}
                    </span>
                  </div>
                  <div className="mt-3 space-y-1.5 text-xs text-ink-500">
                    <p className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-brand-500" />
                      {iv.date} · {iv.time}
                    </p>
                    <p className="flex items-center gap-1.5">
                      <FormatIcon className="h-3.5 w-3.5 text-brand-500" />
                      {iv.format}
                    </p>
                    <p className="truncate text-ink-400">
                      with {iv.withName} · {iv.withRole}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent applications */}
      <div className="rounded-2xl border border-ink-200 bg-white p-6 shadow-card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-ink-900">Recent applications</h2>
          <Link to="/app/applications" className="text-sm font-semibold text-brand-600 hover:text-brand-700">
            View all
          </Link>
        </div>
        {loading ? (
          <div className="grid place-items-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
          </div>
        ) : apps.length === 0 ? (
          <div className="rounded-xl border border-dashed border-ink-200 py-10 text-center">
            <p className="text-sm text-ink-500">No applications yet.</p>
            <Link
              to="/app/jobs"
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700"
            >
              <Briefcase className="h-4 w-4" /> Start applying
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {apps.slice(0, 5).map((a) => {
              const cfg = statusMap[a.status];
              return (
                <Link
                  key={a.id}
                  to={`/app/jobs/${a.job.id}`}
                  className="flex items-center gap-4 rounded-xl border border-ink-100 p-3 transition hover:border-ink-200 hover:bg-ink-50"
                >
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-ink-900 text-xs font-bold text-white">
                    {a.job.logo}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-ink-900">{a.job.title}</p>
                    <p className="text-xs text-ink-400">{a.job.company} · {a.appliedDaysAgo}d ago</p>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${cfg.color}`}>
                    <cfg.icon className="h-3.5 w-3.5" />
                    {cfg.label}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* AI banner */}
      <div className="relative overflow-hidden rounded-2xl bg-ink-950 p-6 sm:p-8">
        <div
          className="absolute inset-0 opacity-50"
          style={{
            backgroundImage:
              'radial-gradient(40% 60% at 80% 20%, rgba(51,102,255,0.4) 0%, transparent 60%), radial-gradient(40% 60% at 10% 90%, rgba(16,185,129,0.3) 0%, transparent 60%)',
          }}
        />
        <div className="relative flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white">
              <Sparkles className="h-3.5 w-3.5" /> AI assistant
            </div>
            <h3 className="mt-3 font-display text-xl font-bold text-white sm:text-2xl">
              Let AI match you to the perfect role
            </h3>
            <p className="mt-1 max-w-md text-sm text-ink-300">
              We&apos;ll analyze your resume and surface the jobs where you&apos;re most likely to hear back.
            </p>
          </div>
          <Link
            to="/app/jobs"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-ink-900 transition hover:bg-ink-100"
          >
            <Sparkles className="h-4 w-4 text-brand-600" />
            Find my matches
          </Link>
        </div>
      </div>
    </div>
  );
}
