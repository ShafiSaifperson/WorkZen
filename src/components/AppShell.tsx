import {
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  PenLine,
  LogOut,
  Search,
  Bell,
  ChevronDown,
  Building2,
  Award,
  Menu,
  X,
  Users,
  Calendar,
  UserCheck,
  BarChart3,
  Settings,
} from 'lucide-react';
import type { AuthUser } from '@/lib/auth';
import { useNotifications } from '@/lib/notifications';
import { Logo } from '@/components/ui/Logo';

interface AppShellProps {
  user: AuthUser;
  onSignOut: () => void;
}

const candidateNav = [
  { to: '/app/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/app/jobs', label: 'Find Jobs', icon: Briefcase },
  { to: '/app/resume-coach', label: 'Resume Coach', icon: FileText },
  { to: '/app/cover-letter', label: 'Cover Letter', icon: PenLine },
];

const companyNav: { to: string; label: string; icon: typeof Building2; hash?: string; hiddenOnLg?: boolean }[] = [
  { to: '/company/dashboard', label: 'Hiring Dashboard', icon: Building2 },
  { to: '/company/dashboard#jobs', label: 'Jobs', icon: Briefcase, hash: 'jobs' },
  { to: '/company/dashboard#applications', label: 'Applications', icon: Users, hash: 'applications' },
  { to: '/company/dashboard#interviews', label: 'Interviews', icon: Calendar, hash: 'interviews' },
  { to: '/company/dashboard#candidates', label: 'Candidates', icon: UserCheck, hash: 'applications', hiddenOnLg: true },
  { to: '/company/dashboard#reports', label: 'Reports', icon: BarChart3, hash: 'reports', hiddenOnLg: true },
  { to: '/company/dashboard#settings', label: 'Settings', icon: Settings, hash: 'settings', hiddenOnLg: true },
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
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();
  const [searchQuery, setSearchQuery] = useState('');
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [profileImage, setProfileImage] = useState<string | null>(() => {
    return localStorage.getItem(`workzen-profile-image-${user.id}`);
  });

  const profileImageInputRef = useRef<HTMLInputElement>(null);
  const nav = (user.role === 'company' || user.role === 'admin') ? companyNav : candidateNav;

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedQuery = searchQuery.trim();

    navigate(
      trimmedQuery
        ? `/app/jobs?q=${encodeURIComponent(trimmedQuery)}`
        : '/app/jobs'
    );
  }

  function handleProfileImageChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) return;

    if (!selectedFile.type.startsWith('image/')) {
      window.alert('Please choose an image file.');
      return;
    }

    if (selectedFile.size > 2 * 1024 * 1024) {
      window.alert('Please choose an image smaller than 2 MB.');
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const imageData = String(reader.result);

      try {
        localStorage.setItem(`workzen-profile-image-${user.id}`, imageData);
        setProfileImage(imageData);
        setProfileMenuOpen(false);
      } catch {
        window.alert('The image could not be saved. Please choose a smaller image.');
      }
    };

    reader.readAsDataURL(selectedFile);

    // Lets the user select the same image again later if wanted.
    event.target.value = '';
  }

  return (
    <div className="min-h-screen bg-[#0B0D1B] text-slate-100 antialiased selection:bg-brand-500 selection:text-white relative overflow-x-hidden">
      {/* Background ambient lighting */}
      <div className="fixed inset-0 pointer-events-none opacity-40 z-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-600/15 rounded-full blur-3xl" />
        <div className="absolute top-40 right-1/4 w-[30rem] h-[30rem] bg-indigo-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 left-1/3 w-80 h-80 bg-emerald-600/10 rounded-full blur-3xl" />
      </div>

      {/* Horizontal Top Navigation Bar */}
      <header className="sticky top-0 z-40 border-b border-[#242E49] bg-[#111427]/90 backdrop-blur-xl transition w-full">
        <div className="w-full max-w-[1550px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-2 sm:gap-4">
            {/* Left section: Logo & Nav Links */}
            <div className="flex items-center gap-3 lg:gap-6 shrink-0 min-w-0">
              <Logo light showWordmark className="shrink-0" />

              <nav className="hidden md:flex items-center space-x-1 shrink-0">
                {nav.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/app/dashboard' || item.to === '/company/dashboard'}
                    onClick={() => {
                      if (item.hash) {
                        const el = document.getElementById(item.hash);
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                    className={({ isActive }) =>
                      `${'hiddenOnLg' in item && item.hiddenOnLg ? 'hidden 2xl:flex' : 'flex'} group items-center gap-1.5 lg:gap-2 rounded-xl px-2.5 lg:px-3 py-1.5 lg:py-2 text-xs lg:text-sm font-medium whitespace-nowrap shrink-0 transition ${
                        isActive
                          ? 'bg-violet-500/20 text-white border border-violet-500/30 shadow-[0_0_15px_rgba(139,92,246,0.2)]'
                          : 'text-slate-300 hover:text-white hover:bg-white/5 border border-transparent'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <item.icon
                          className={`h-4 w-4 shrink-0 transition ${
                            isActive ? 'text-violet-400' : 'text-slate-400 group-hover:text-slate-200'
                          }`}
                        />
                        <span className="whitespace-nowrap">{item.label}</span>
                      </>
                    )}
                  </NavLink>
                ))}
              </nav>
            </div>

            {/* Right section: Search, Notifications, Profile */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <form onSubmit={submitSearch} className="relative hidden xl:block w-36 lg:w-48 xl:w-56 shrink">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search jobs, companies…"
                  aria-label="Search jobs and companies"
                  className="h-10 w-full rounded-xl border border-[#2B3558] bg-[#181A2F]/90 pl-10 pr-4 text-xs lg:text-sm text-slate-100 placeholder-slate-400 outline-none transition focus:border-violet-500 focus:bg-[#181A2F] focus:ring-2 focus:ring-violet-500/20"
                />
              </form>

              <Link
                to="/app/notifications"
                aria-label={`Notifications (${unreadCount} unread)`}
                className="relative rounded-xl p-2.5 text-slate-300 transition hover:bg-white/5 hover:text-white border border-transparent hover:border-[#2B3558]"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-[#111427]">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>

              {/* User Profile & Dropdown */}
              <div className="relative">
                <input
                  ref={profileImageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleProfileImageChange}
                />

                <button
                  type="button"
                  onClick={() => setProfileMenuOpen((isOpen) => !isOpen)}
                  aria-expanded={profileMenuOpen}
                  aria-haspopup="menu"
                  className="flex items-center gap-2 rounded-xl py-1.5 pl-1.5 pr-2 transition hover:bg-white/5 border border-transparent hover:border-[#2B3558] shrink-0"
                >
                  {profileImage ? (
                    <img
                      src={profileImage}
                      alt={`${fullName || 'User'} profile`}
                      className="h-8 w-8 rounded-full object-cover ring-2 ring-violet-500/30"
                    />
                  ) : (
                    <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-xs font-bold text-white shadow-glow">
                      {initials}
                    </div>
                  )}

                  <div className="hidden lg:block text-left whitespace-nowrap">
                    <p className="text-sm font-semibold leading-tight text-white whitespace-nowrap">
                      {fullName || 'User'}
                    </p>
                    <p className="text-xs leading-tight text-slate-400 truncate max-w-[120px]">{email}</p>
                  </div>

                  <ChevronDown
                    className={`h-4 w-4 text-slate-400 transition-transform ${
                      profileMenuOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {profileMenuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 top-full z-50 mt-2 w-56 max-w-[calc(100vw-1.5rem)] rounded-2xl border border-[#2B3558] bg-[#181A2F]/98 backdrop-blur-xl p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.6)] animate-scale-in"
                  >
                    <div className="px-3 py-2 border-b border-[#242E49] mb-1">
                      <p className="text-xs font-semibold text-white truncate">{fullName || 'User'}</p>
                      <p className="text-[11px] text-slate-400 truncate">{email}</p>
                    </div>

                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setProfileMenuOpen(false);
                        profileImageInputRef.current?.click();
                      }}
                      className="w-full rounded-xl px-3 py-2 text-left text-xs font-medium text-slate-200 transition hover:bg-white/10 hover:text-white"
                    >
                      Add profile image
                    </button>

                    {user.role === 'candidate' && (
                      <Link
                        to="/app/your-resume"
                        role="menuitem"
                        onClick={() => setProfileMenuOpen(false)}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-medium text-slate-200 transition hover:bg-white/10 hover:text-white"
                      >
                        <FileText className="h-4 w-4 text-violet-400" />
                        Your Resume
                      </Link>
                    )}

                    {user.role === 'candidate' && (
                      <Link
                        to="/app/certifications"
                        role="menuitem"
                        onClick={() => setProfileMenuOpen(false)}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-medium text-slate-200 transition hover:bg-white/10 hover:text-white"
                      >
                        <Award className="h-4 w-4 text-teal-400" />
                        Add Certifications
                      </Link>
                    )}

                    <div className="my-1 border-t border-[#242E49]" />

                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setProfileMenuOpen(false);
                        onSignOut();
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-medium text-rose-400 transition hover:bg-rose-500/10 hover:text-rose-300"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>

              {/* Mobile menu toggle */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen((v) => !v)}
                className="md:hidden rounded-xl p-2 text-slate-400 hover:bg-white/5 hover:text-white"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#242E49] bg-[#111427]/98 px-4 py-4 space-y-3 animate-fade-in">
            <form onSubmit={submitSearch} className="relative w-full">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search jobs, companies…"
                className="h-10 w-full rounded-xl border border-[#2B3558] bg-[#181A2F] pl-10 pr-4 text-sm text-white placeholder-slate-400 outline-none"
              />
            </form>
            <nav className="space-y-1">
              {nav.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${
                      isActive
                        ? 'bg-violet-500/20 text-white border border-violet-500/30'
                        : 'text-slate-300 hover:bg-white/5 hover:text-white'
                    }`
                  }
                >
                  <item.icon className="h-4 w-4 text-violet-400" />
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        )}
      </header>

      {/* Main page content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-10">
        <Outlet />
      </main>
    </div>
  );
}
