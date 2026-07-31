import { NavLink, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  PenLine,
  LogOut,
  Search,
  Bell,
  ChevronDown,
} from 'lucide-react';
import type { AuthUser } from '@/lib/auth';
import { Logo } from '@/components/ui/Logo';

interface AppShellProps {
  user: AuthUser;
  onSignOut: () => void;
}

const nav = [
  { to: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/app/jobs', label: 'Find Jobs', icon: Briefcase },
  { to: '/app/resume-coach', label: 'Resume Coach', icon: FileText },
  { to: '/app/cover-letter', label: 'Cover Letter', icon: PenLine },
];

function getInitials(name: string, email: string) {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    return (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '');
  }
  return email.slice(0, 2).toUpperCase();
}

export function AppShell({ user, onSignOut }: AppShellProps) {
  const fullName = user.full_name || '';
  const email = user.email ?? '';
  const initials = getInitials(fullName, email);

  return (
    <div className="min-h-screen bg-ink-50">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-ink-200 bg-white lg:flex">
        <div className="px-5 py-6">
          <Logo />
        </div>
        <nav className="flex-1 space-y-1 px-3">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  isActive
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    className={`h-[18px] w-[18px] ${isActive ? 'text-brand-600' : 'text-ink-400 group-hover:text-ink-600'}`}
                  />
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="px-3 pb-5">
          <button
            onClick={onSignOut}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-600 transition hover:bg-red-50 hover:text-red-600"
          >
            <LogOut className="h-[18px] w-[18px] text-ink-400" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Mobile top nav */}
      <div className="lg:hidden">
        <div className="sticky top-0 z-40 border-b border-ink-200 bg-white/90 px-4 py-3 backdrop-blur">
          <div className="flex items-center justify-between">
            <Logo />
            <button
              onClick={onSignOut}
              className="rounded-lg p-2 text-ink-500 hover:bg-ink-100"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
          <nav className="mt-3 flex gap-1 overflow-x-auto scrollbar-thin">
            {nav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition ${
                    isActive
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-ink-500 hover:bg-ink-100'
                  }`
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </div>

      {/* Main */}
      <div className="lg:pl-64">
        {/* Desktop top bar */}
        <header className="sticky top-0 z-30 hidden items-center justify-between border-b border-ink-200 bg-white/80 px-8 py-4 backdrop-blur lg:flex">
          <div className="relative w-72">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input
              placeholder="Search jobs, companies…"
              className="h-10 w-full rounded-xl border border-ink-200 bg-ink-50 pl-11 pr-4 text-sm outline-none transition focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <div className="flex items-center gap-3">
            <button className="relative rounded-xl p-2.5 text-ink-500 transition hover:bg-ink-100">
              <Bell className="h-5 w-5" />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-accent-500 ring-2 ring-white" />
            </button>
            <div className="flex items-center gap-2.5 rounded-xl py-1.5 pl-1.5 pr-3 transition hover:bg-ink-100">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-xs font-bold text-white">
                {initials}
              </div>
              <div className="text-left">
                <p className="text-sm font-semibold leading-tight text-ink-900">
                  {fullName || 'User'}
                </p>
                <p className="text-xs leading-tight text-ink-400">{email}</p>
              </div>
              <ChevronDown className="h-4 w-4 text-ink-400" />
            </div>
          </div>
        </header>
        <main className="px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
