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

const companyNav = [
  { to: '/company/dashboard', label: 'Hiring Dashboard', icon: Building2 },
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

  const [profileImage, setProfileImage] = useState<string | null>(() => {
    return localStorage.getItem(`workzen-profile-image-${user.id}`);
  });

  const profileImageInputRef = useRef<HTMLInputElement>(null);
  const nav = user.role === 'company' ? companyNav : candidateNav;

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
    <div className="min-h-screen bg-matcha-50">
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
            <div className="flex items-center gap-1.5">
              <Link
                to="/app/notifications"
                aria-label={`Notifications (${unreadCount} unread)`}
                className="relative rounded-lg p-2 text-ink-500 hover:bg-ink-100 hover:text-ink-900"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </Link>
              <button
                onClick={onSignOut}
                aria-label="Sign out"
                className="rounded-lg p-2 text-ink-500 hover:bg-ink-100"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
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
          <form onSubmit={submitSearch} className="relative w-72">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search jobs, companies…"
              aria-label="Search jobs and companies"
              className="h-10 w-full rounded-xl border border-ink-200 bg-ink-50 pl-11 pr-4 text-sm outline-none transition focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
            />
          </form>
          <div className="flex items-center gap-3">
            <Link
              to="/app/notifications"
              aria-label={`Notifications (${unreadCount} unread)`}
              className="relative rounded-xl p-2.5 text-ink-500 transition hover:bg-ink-100 hover:text-ink-900"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[11px] font-bold text-white shadow-sm ring-2 ring-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Link>
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
    className="flex items-center gap-2.5 rounded-xl py-1.5 pl-1.5 pr-3 transition hover:bg-ink-100"
  >
    {profileImage ? (
      <img
        src={profileImage}
        alt={`${fullName || 'User'} profile`}
        className="h-8 w-8 rounded-full object-cover"
      />
    ) : (
      <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-xs font-bold text-white">
        {initials}
      </div>
    )}

    <div className="text-left">
      <p className="text-sm font-semibold leading-tight text-ink-900">
        {fullName || 'User'}
      </p>
      <p className="text-xs leading-tight text-ink-400">{email}</p>
    </div>

    <ChevronDown
      className={`h-4 w-4 text-ink-400 transition-transform ${
        profileMenuOpen ? 'rotate-180' : ''
      }`}
    />
  </button>

  {profileMenuOpen && (
    <div
      role="menu"
      className="absolute right-0 top-full z-50 mt-2 w-52 rounded-xl border border-ink-200 bg-white p-1.5 shadow-card"
    >
      <button
        type="button"
        role="menuitem"
        onClick={() => profileImageInputRef.current?.click()}
        className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-ink-700 transition hover:bg-ink-100 hover:text-ink-900"
      >
        Add profile image
      </button>
    </div>
  )}
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
