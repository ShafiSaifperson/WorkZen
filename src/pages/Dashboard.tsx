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

function MetricCard({
  label,
  value,
  sub,
  icon: Icon,
  tint,
}: {
  label: string;
  value: number | string;
  sub: string;
  icon: typeof Briefcase;
  tint: string;
}) {
  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-5 shadow-card">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-ink-400">{label}</span>
        <div className={`grid h-8 w-8 place-items-center rounded-lg ${tint}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-3 font-display text-2xl font-bold text-ink-900">{value}</p>
      <p className="mt-0.5 text-xs text-ink-400">{sub}</p>
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
  'Google Meet': Video,
  'Zoom': Video,
  'Video call': Video,
  'In Office': MapPin,
  'On-site': MapPin,
  'Phone Call': Phone,
  'Phone screen': Phone,
  'Other': Video,
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

  const totalApps = apps.length;
  const activeInterviews = interviews.length;
  const acceptedApps = useMemo(() => apps.filter((a) => a.status === 'accepted').length, [apps]);
  const responseRate = useMemo(
    () => (totalApps > 0 ? Math.round(((acceptedApps + apps.filter((a) => a.status === 'rejected').length) / totalApps) * 100) : 0),
    [totalApps, acceptedApps, apps]
  );

  return (
    <div className="mx-auto max-w-5xl animate-fade-in space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink-900 sm:text-3xl">
            Welcome back, {user?.full_name.split(' ')[0] || 'there'} 👋
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            Here's what's happening with your job search today.
          </p>
        </div>
        <Link
          to="/app/jobs"
          className="inline-flex items-center gap-2 self-start rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:bg-brand-700 sm:self-auto"
        >
          <Briefcase className="h-4 w-4" /> Browse open jobs
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {loading ? (
          <div className="col-span-full grid place-items-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
          </div>
        ) : (
          <>
            <MetricCard label="Total Applications" value={totalApps} sub="All time" icon={Briefcase} tint="text-brand-600 bg-brand-50" />
            <MetricCard label="Upcoming Interviews" value={activeInterviews} sub={activeInterviews > 0 ? `Next in ${interviews[0]?.inDays}d` : 'None scheduled'} icon={Calendar} tint="text-accent-600 bg-accent-50" />
            <MetricCard label="Offers / Accepted" value={acceptedApps} sub="Keep it up!" icon={CheckCircle2} tint="text-emerald-600 bg-emerald-50" />
            <MetricCard label="Response Rate" value={`${responseRate}%`} sub="Across all apps" icon={TrendingUp} tint="text-indigo-600 bg-indigo-50" />
          </>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-ink-200 bg-white p-6 shadow-card lg:col-span-2">
          <h2 className="mb-4 font-display text-lg font-bold text-ink-900">Application funnel</h2>
          {loading ? (
            <div className="grid h-48 place-items-center">
              <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
            </div>
          ) : (
            <StatusWheel apps={apps} />
          )}
        </div>

        <div className="flex flex-col justify-between gap-3">
          {quickAccess.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="group flex flex-1 items-center gap-4 rounded-2xl border border-ink-200 bg-white p-4 shadow-card transition hover:border-brand-200 hover:shadow-soft"
            >
              <div className={`grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br ${item.tint} text-white shadow-soft`}>
                <item.icon className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-ink-900 group-hover:text-brand-600">{item.label}</p>
                <p className="text-xs text-ink-400">{item.desc}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-ink-300 transition group-hover:translate-x-0.5 group-hover:text-brand-600" />
            </Link>
          ))}
        </div>
      </div>

      {!loading && interviews.length > 0 && (
        <div className="rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-50 to-white p-6 shadow-card">
          <div className="mb-6 flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-600 text-white shadow-soft">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-ink-900">Upcoming interviews</h2>
              <p className="text-sm text-ink-500">You have {interviews.length} interview{interviews.length === 1 ? '' : 's'} coming up.</p>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {interviews.map((iv) => {
              const FormatIcon = formatIcons[iv.type || iv.format] ?? Video;
              const typeLabel = iv.type || iv.format || 'Google Meet';
              const timeDisplay = iv.startTime || iv.time;
              const timeRange = iv.endTime ? `${timeDisplay} – ${iv.endTime}` : timeDisplay;
              const interviewerDisplay = iv.withName || iv.interviewerName;
              const roleDisplay = iv.withRole || iv.interviewerRole;

              return (
                <div key={iv.id} className="group flex flex-col justify-between rounded-xl border border-ink-200 bg-white p-4 transition hover:border-brand-300 hover:shadow-soft">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-ink-900">{iv.jobTitle}</p>
                        <p className="truncate text-xs font-medium text-ink-500">{iv.company}</p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${iv.inDays <= 3 ? 'bg-rose-50 text-rose-600' : iv.inDays <= 5 ? 'bg-amber-50 text-amber-600' : 'bg-brand-50 text-brand-600'}`}>
                        {iv.inDays === 0 ? 'Today' : iv.inDays === 1 ? 'Tomorrow' : `${iv.inDays}d`}
                      </span>
                    </div>
                    <div className="mt-3 space-y-1.5 text-xs text-ink-600">
                      <p className="flex items-center gap-1.5 font-medium">
                        <Calendar className="h-3.5 w-3.5 text-brand-500 shrink-0" />
                        {iv.date}
                      </p>
                      <p className="flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5 text-brand-500 shrink-0" />
                        {timeRange}
                      </p>
                      <p className="flex items-center gap-1.5">
                        <FormatIcon className="h-3.5 w-3.5 text-brand-500 shrink-0" />
                        <span>{typeLabel}</span>
                      </p>
                      {interviewerDisplay && (
                        <p className="truncate text-ink-500 pt-0.5">
                          👤 {interviewerDisplay}{roleDisplay ? ` — ${roleDisplay}` : ''}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 pt-3 border-t border-ink-100 flex items-center justify-between">
                    <Link to={`/app/interviews/${iv.id}`} className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-3 py-2 text-xs font-semibold text-white shadow-soft transition hover:bg-brand-700">
                      View Interview
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
                  to={`/app/applications/${a.id}`}
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
