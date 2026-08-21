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
  Award,
  ChevronRight,
  FolderKanban,
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

  const radius = 72;
  const circ = 2 * Math.PI * radius;
  const gap = 5;

  return (
    <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-8 justify-around">
      <div className="relative h-48 w-48 shrink-0">
        <svg viewBox="0 0 180 180" className="h-full w-full -rotate-90">
          <circle cx="90" cy="90" r={radius} fill="none" stroke="#242E49" strokeWidth="14" />
          {total > 0 && (
            <>
              <circle
                cx="90"
                cy="90"
                r={radius}
                fill="none"
                stroke="#10b981"
                strokeWidth="14"
                strokeDasharray={`${(accPct / 100) * circ - gap} ${circ}`}
                strokeDashoffset={0}
                strokeLinecap="round"
                className="filter drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]"
              />
              <circle
                cx="90"
                cy="90"
                r={radius}
                fill="none"
                stroke="#6366f1"
                strokeWidth="14"
                strokeDasharray={`${(pendPct / 100) * circ - gap} ${circ}`}
                strokeDashoffset={-((accPct / 100) * circ) - gap}
                strokeLinecap="round"
                className="filter drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]"
              />
              <circle
                cx="90"
                cy="90"
                r={radius}
                fill="none"
                stroke="#f43f5e"
                strokeWidth="14"
                strokeDasharray={`${(rejPct / 100) * circ - gap} ${circ}`}
                strokeDashoffset={-((accPct / 100) * circ) - ((pendPct / 100) * circ) - gap * 2}
                strokeLinecap="round"
                className="filter drop-shadow-[0_0_8px_rgba(244,63,94,0.5)]"
              />
            </>
          )}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-4xl font-extrabold text-white tracking-tight">{total}</span>
          <span className="text-xs font-medium text-slate-400 mt-0.5">applications</span>
        </div>
      </div>

      <div className="grid w-full grid-cols-3 gap-3 sm:max-w-xs">
        <Legend
          indicatorColor="bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]"
          label="Accepted"
          value={accepted}
          borderColor="border-emerald-500/20"
          bgColor="bg-emerald-500/10"
        />
        <Legend
          indicatorColor="bg-indigo-400 shadow-[0_0_10px_rgba(129,140,248,0.8)]"
          label="Pending"
          value={pending}
          borderColor="border-indigo-500/20"
          bgColor="bg-indigo-500/10"
        />
        <Legend
          indicatorColor="bg-rose-400 shadow-[0_0_10px_rgba(251,113,133,0.8)]"
          label="Rejected"
          value={rejected}
          borderColor="border-rose-500/20"
          bgColor="bg-rose-500/10"
        />
      </div>
    </div>
  );
}

function Legend({
  indicatorColor,
  label,
  value,
  borderColor,
  bgColor,
}: {
  indicatorColor: string;
  label: string;
  value: number;
  borderColor: string;
  bgColor: string;
}) {
  return (
    <div className={`rounded-2xl border ${borderColor} ${bgColor} backdrop-blur-sm p-3.5 text-center transition hover:scale-[1.02]`}>
      <div className={`mx-auto mb-2 h-2.5 w-2.5 rounded-full ${indicatorColor}`} />
      <p className="font-display text-2xl font-bold text-white tracking-tight">{value}</p>
      <p className="text-xs text-slate-400 mt-0.5 font-medium">{label}</p>
    </div>
  );
}

function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  gradientClass,
  iconBadgeClass,
}: {
  label: string;
  value: number | string;
  sub: string;
  icon: typeof Briefcase;
  gradientClass: string;
  iconBadgeClass: string;
}) {
  return (
    <div className={`group relative overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${gradientClass}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-300/90">{label}</span>
        <div className={`grid h-9 w-9 place-items-center rounded-xl transition group-hover:scale-110 ${iconBadgeClass}`}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <p className="mt-3 font-display text-3xl font-extrabold text-white tracking-tight">{value}</p>
      <p className="mt-1 text-xs text-slate-400 font-medium truncate">{sub}</p>
    </div>
  );
}

const quickAccess = [
  {
    to: '/app/jobs',
    label: 'Find Jobs',
    desc: 'Search & apply in 1 click',
    icon: Briefcase,
    gradient: 'from-[#581C87]/70 via-[#701A75]/40 to-[#181A2F]/90 border-fuchsia-500/25 hover:border-fuchsia-400/50 shadow-[0_4px_20px_-4px_rgba(217,70,239,0.2)]',
    badge: 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30',
  },
  {
    to: '/app/resume-coach',
    label: 'Resume Coach',
    desc: 'AI feedback & ATS score',
    icon: FileText,
    gradient: 'from-[#064E3B]/70 via-[#0D9488]/40 to-[#181A2F]/90 border-emerald-500/25 hover:border-emerald-400/50 shadow-[0_4px_20px_-4px_rgba(16,185,129,0.2)]',
    badge: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
  },
  {
    to: '/app/cover-letter',
    label: 'Cover Letter',
    desc: 'Generate tailored letters',
    icon: PenLine,
    gradient: 'from-[#7C2D12]/70 via-[#64182D]/50 to-[#181A2F]/90 border-orange-500/25 hover:border-orange-400/50 shadow-[0_4px_20px_-4px_rgba(249,115,22,0.2)]',
    badge: 'bg-orange-500/20 text-orange-300 border border-orange-500/30',
  },
];

const statusMap = {
  accepted: {
    icon: CheckCircle2,
    color: 'text-emerald-300 bg-emerald-500/15 border border-emerald-500/30',
    label: 'Accepted',
  },
  pending: {
    icon: Clock,
    color: 'text-blue-300 bg-blue-500/15 border border-blue-500/30',
    label: 'Pending',
  },
  rejected: {
    icon: XCircle,
    color: 'text-rose-300 bg-rose-500/15 border border-rose-500/30',
    label: 'Rejected',
  },
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

const interviewGradients = [
  'bg-gradient-to-br from-[#2E1065]/70 via-[#1E1B4B]/50 to-[#111427]/90 border-violet-500/30 hover:border-violet-400/60 shadow-[0_8px_25px_-6px_rgba(139,92,246,0.25)]',
  'bg-gradient-to-br from-[#1E3A8A]/70 via-[#172554]/50 to-[#111427]/90 border-blue-500/30 hover:border-blue-400/60 shadow-[0_8px_25px_-6px_rgba(59,130,246,0.25)]',
  'bg-gradient-to-br from-[#831843]/70 via-[#4C0519]/50 to-[#111427]/90 border-pink-500/30 hover:border-pink-400/60 shadow-[0_8px_25px_-6px_rgba(236,72,153,0.25)]',
];

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
    () =>
      totalApps > 0
        ? Math.round(
            ((acceptedApps + apps.filter((a) => a.status === 'rejected').length) / totalApps) * 100
          )
        : 0,
    [totalApps, acceptedApps, apps]
  );

  return (
    <div className="mx-auto max-w-7xl animate-fade-in space-y-10">
      {/* SECTION 1: HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#242E49]/60 pb-6">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Welcome back, {user?.full_name?.split(' ')[0] || 'Alex'} 👋
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Here&apos;s what&apos;s happening with your job search today.
          </p>
        </div>
        <Link
          to="/app/jobs"
          className="inline-flex items-center gap-2 self-start sm:self-auto rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-glow transition hover:from-violet-500 hover:to-indigo-500 hover:scale-[1.02] active:scale-[0.98]"
        >
          <Briefcase className="h-4 w-4" />
          Browse open jobs
        </Link>
      </div>

      {/* SECTION 2: 5 KPI CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {loading ? (
          <div className="col-span-full grid place-items-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-violet-400" />
          </div>
        ) : (
          <>
            {/* 1. Total Applications */}
            <KpiCard
              label="Total Applications"
              value={totalApps}
              sub="All time pipeline"
              icon={Briefcase}
              gradientClass="bg-gradient-to-br from-[#1E1B4B]/90 via-[#2E1065]/70 to-[#181A2F]/90 border border-violet-500/25 shadow-[0_8px_20px_-6px_rgba(139,92,246,0.25)] hover:border-violet-400/40"
              iconBadgeClass="bg-violet-500/20 text-violet-300 border border-violet-500/30"
            />

            {/* 2. Upcoming Interviews */}
            <KpiCard
              label="Upcoming Interviews"
              value={activeInterviews}
              sub={activeInterviews > 0 ? `Next in ${interviews[0]?.inDays}d` : 'None scheduled'}
              icon={Calendar}
              gradientClass="bg-gradient-to-br from-[#064E3B]/80 via-[#065F46]/60 to-[#181A2F]/90 border border-emerald-500/25 shadow-[0_8px_20px_-6px_rgba(16,185,129,0.25)] hover:border-emerald-400/40"
              iconBadgeClass="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
            />

            {/* 3. Offers / Accepted */}
            <KpiCard
              label="Offers / Accepted"
              value={acceptedApps}
              sub="High match rate"
              icon={CheckCircle2}
              gradientClass="bg-gradient-to-br from-[#7C2D12]/80 via-[#64182D]/70 to-[#181A2F]/90 border border-[#F0A481]/25 shadow-[0_8px_20px_-6px_rgba(240,164,129,0.25)] hover:border-[#F0A481]/40"
              iconBadgeClass="bg-[#F0A481]/20 text-[#F0A481] border border-[#F0A481]/30"
            />

            {/* 4. Response Rate */}
            <KpiCard
              label="Response Rate"
              value={`${responseRate}%`}
              sub="Across all submissions"
              icon={TrendingUp}
              gradientClass="bg-gradient-to-br from-[#172554]/80 via-[#1E3A8A]/60 to-[#181A2F]/90 border border-blue-500/25 shadow-[0_8px_20px_-6px_rgba(59,130,246,0.25)] hover:border-blue-400/40"
              iconBadgeClass="bg-blue-500/20 text-blue-300 border border-blue-500/30"
            />

            {/* 5. Total Projects */}
            <KpiCard
              label="Total Projects"
              value={24}
              sub="Portfolio & skills"
              icon={FolderKanban}
              gradientClass="bg-gradient-to-br from-[#134E4A]/80 via-[#115E59]/60 to-[#181A2F]/90 border border-teal-500/25 shadow-[0_8px_20px_-6px_rgba(20,184,166,0.25)] hover:border-teal-400/40"
              iconBadgeClass="bg-teal-500/20 text-teal-300 border border-teal-500/30"
            />
          </>
        )}
      </div>

      {/* SECTION 3: MAIN CONTENT AREA (Analytics & Quick Actions + Recent Apps) */}
      <div className="grid gap-8 lg:grid-cols-12 items-start">
        {/* Left / Center Column */}
        <div className="lg:col-span-7 space-y-6">
          {/* Application Funnel */}
          <div className="rounded-2xl border border-[#2B3558] bg-[#181A2F]/80 backdrop-blur-md p-6 sm:p-8 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg font-bold text-white">Application funnel</h2>
                <p className="text-xs text-slate-400 mt-0.5">Pipeline status breakdown</p>
              </div>
              <span className="rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs font-semibold text-violet-300">
                {totalApps} Total
              </span>
            </div>

            {loading ? (
              <div className="grid h-48 place-items-center">
                <Loader2 className="h-6 w-6 animate-spin text-violet-400" />
              </div>
            ) : (
              <StatusWheel apps={apps} />
            )}
          </div>

          {/* Quick Actions */}
          <div className="grid gap-3 sm:grid-cols-3">
            {quickAccess.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`group relative flex flex-col justify-between rounded-2xl border p-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg bg-gradient-to-r ${item.gradient}`}
              >
                <div>
                  <div className={`mb-3 grid h-10 w-10 place-items-center rounded-xl shadow-soft ${item.badge}`}>
                    <item.icon className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-bold text-white group-hover:text-white transition">
                    {item.label}
                  </p>
                  <p className="mt-1 text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
                <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-slate-300 group-hover:text-white">
                  <span>Open</span>
                  <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Right Column: Recent Applications */}
        <div className="lg:col-span-5">
          <div className="rounded-2xl border border-[#2B3558] bg-[#181A2F]/80 backdrop-blur-md p-6 shadow-xl">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg font-bold text-white">Recent applications</h2>
                <p className="text-xs text-slate-400 mt-0.5">Latest submitted roles</p>
              </div>
              <Link
                to="/app/applications"
                className="text-xs font-semibold text-violet-400 hover:text-violet-300 flex items-center gap-1 transition"
              >
                View all
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {loading ? (
              <div className="grid place-items-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-violet-400" />
              </div>
            ) : apps.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[#2B3558] py-10 text-center">
                <p className="text-sm text-slate-400">No applications yet.</p>
                <Link
                  to="/app/jobs"
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-violet-400 hover:text-violet-300"
                >
                  <Briefcase className="h-3.5 w-3.5" /> Start applying
                </Link>
              </div>
            ) : (
              <div className="space-y-2.5">
                {apps.slice(0, 5).map((a) => {
                  const cfg = statusMap[a.status];
                  return (
                    <Link
                      key={a.id}
                      to={`/app/applications/${a.id}`}
                      className="group flex items-center gap-3.5 rounded-xl border border-[#242E49] bg-[#111427]/70 p-3.5 transition hover:border-violet-500/40 hover:bg-[#111427]"
                    >
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#242E49] to-[#181A2F] border border-white/10 text-xs font-bold text-white shadow-inner">
                        {a.job.logo}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-semibold text-white group-hover:text-violet-300 transition">
                          {a.job.title}
                        </p>
                        <p className="truncate text-xs text-slate-400">
                          {a.job.company} · {a.appliedDaysAgo}d ago
                        </p>
                      </div>
                      <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${cfg.color}`}>
                        <cfg.icon className="h-3.5 w-3.5" />
                        {cfg.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 4: UPCOMING INTERVIEWS */}
      {!loading && interviews.length > 0 && (
        <div className="rounded-2xl border border-[#2B3558] bg-[#181A2F]/80 backdrop-blur-md p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-violet-500/20 text-violet-300 border border-violet-500/30 shadow-soft">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold text-white">Upcoming interviews</h2>
                <p className="text-xs sm:text-sm text-slate-400">
                  You have {interviews.length} interview{interviews.length === 1 ? '' : 's'} scheduled in your calendar.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {interviews.map((iv, idx) => {
              const FormatIcon = formatIcons[iv.type || iv.format] ?? Video;
              const typeLabel = iv.type || iv.format || 'Google Meet';
              const timeDisplay = iv.startTime || iv.time;
              const timeRange = iv.endTime ? `${timeDisplay} – ${iv.endTime}` : timeDisplay;
              const interviewerDisplay = iv.withName || iv.interviewerName;
              const roleDisplay = iv.withRole || iv.interviewerRole;
              const cardGradient = interviewGradients[idx % interviewGradients.length];

              return (
                <div
                  key={iv.id}
                  className={`group flex flex-col justify-between rounded-2xl border p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${cardGradient}`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-base font-bold text-white group-hover:text-white transition">
                          {iv.jobTitle}
                        </p>
                        <p className="truncate text-xs font-medium text-slate-400">{iv.company}</p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${
                          iv.inDays <= 3
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : iv.inDays <= 5
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                        }`}
                      >
                        {iv.inDays === 0 ? 'Today' : iv.inDays === 1 ? 'Tomorrow' : `In ${iv.inDays}d`}
                      </span>
                    </div>

                    <div className="mt-4 space-y-2 text-xs text-slate-300">
                      <p className="flex items-center gap-2 font-medium">
                        <Calendar className="h-3.5 w-3.5 text-violet-400 shrink-0" />
                        <span>{iv.date}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-violet-400 shrink-0" />
                        <span>{timeRange}</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <FormatIcon className="h-3.5 w-3.5 text-violet-400 shrink-0" />
                        <span>{typeLabel}</span>
                      </p>
                      {interviewerDisplay && (
                        <p className="truncate text-slate-400 pt-1 border-t border-white/5">
                          👤 {interviewerDisplay}
                          {roleDisplay ? ` — ${roleDisplay}` : ''}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-white/10">
                    <Link
                      to={`/app/interviews/${iv.id}`}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 px-3.5 py-2.5 text-xs font-semibold text-white shadow-soft transition duration-200"
                    >
                      <span>View Interview</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 5: AI ASSISTANT BANNER */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#181A2F] via-[#242E49] to-[#3B0764]/80 border border-violet-500/30 p-6 sm:p-8 shadow-2xl">
        <div
          className="absolute inset-0 opacity-40 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(40% 60% at 85% 20%, rgba(139,92,246,0.45) 0%, transparent 60%), radial-gradient(40% 60% at 10% 90%, rgba(16,185,129,0.25) 0%, transparent 60%)',
          }}
        />
        <div className="relative flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-violet-400/30 bg-violet-500/20 px-3 py-1 text-xs font-semibold text-violet-300">
              <Sparkles className="h-3.5 w-3.5 text-violet-300" /> AI assistant
            </div>
            <h3 className="mt-3 font-display text-2xl font-extrabold text-white sm:text-3xl tracking-tight">
              Let AI match you to the perfect role
            </h3>
            <p className="mt-1.5 max-w-md text-sm text-slate-300 leading-relaxed">
              We&apos;ll analyze your resume and surface the jobs where you&apos;re most likely to hear back.
            </p>
          </div>
          <Link
            to="/app/jobs"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-glow transition hover:from-violet-500 hover:to-indigo-500 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Sparkles className="h-4 w-4" />
            Find my matches
          </Link>
        </div>
      </div>
    </div>
  );
}
