import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, AlertCircle, Building2, User, Briefcase } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Logo } from '@/components/ui/Logo';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/auth';
import { signInWithFacebook, signInWithGoogle } from '@/lib/socialAuth';

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
  onPrimary: (e: React.FormEvent) => void;
  primaryLabel: string;
  submitting: boolean;
}

function AuthShell({ title, subtitle, children, footer, onPrimary, primaryLabel, submitting }: AuthShellProps) {
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2">
      {/* Left — brand panel */}
      <div className="relative hidden overflow-hidden bg-ink-950 lg:flex lg:flex-col lg:justify-between p-12">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'radial-gradient(60% 50% at 20% 10%, rgba(51,102,255,0.45) 0%, transparent 60%), radial-gradient(50% 50% at 90% 90%, rgba(16,185,129,0.25) 0%, transparent 60%)',
          }}
        />
        <div className="relative">
          <Logo light />
        </div>
        <div className="relative max-w-md">
          <h2 className="font-display text-4xl font-extrabold leading-tight text-white text-balance">
            Every application, one step closer to the offer.
          </h2>
          <p className="mt-4 text-ink-300 leading-relaxed">
            Track roles, polish your resume with AI, generate tailored cover
            letters, and never miss an interview — all in one place.
          </p>
          <div className="mt-8 flex items-center gap-3">
            <div className="flex -space-x-2">
              {['AK', 'RM', 'JL', 'SP'].map((i) => (
                <div
                  key={i}
                  className="grid h-9 w-9 place-items-center rounded-full border-2 border-ink-950 bg-gradient-to-br from-brand-400 to-brand-600 text-xs font-bold text-white"
                >
                  {i}
                </div>
              ))}
            </div>
            <p className="text-sm text-ink-300">
              <span className="font-semibold text-white">12,000+</span> applicants
              this month
            </p>
          </div>
        </div>
        <div className="relative text-xs text-ink-400">© 2026 WorkZen</div>
      </div>

      {/* Right — form */}
<div className="flex min-h-screen items-center justify-center bg-matcha-50 px-6 py-12 sm:px-12">        <div className="w-full max-w-sm animate-fade-in">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <h1 className="font-display text-2xl font-bold text-ink-900">{title}</h1>
          <p className="mt-1.5 text-sm text-ink-500">{subtitle}</p>
          <form className="mt-8 space-y-5" onSubmit={onPrimary}>
            {children}
            <Button type="submit" size="lg" className="w-full" disabled={submitting}>
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  {primaryLabel}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>
          <div className="mt-6 text-center text-sm text-ink-500">{footer}</div>
        </div>
      </div>
    </div>
  );
}

function ErrorBanner({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">
      <AlertCircle className="h-4 w-4 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

export function LoginPage() {
  const navigate = useNavigate();
  const { signIn, signInWithOAuthProfile } = useAuth();
  const [showPw, setShowPw] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleGoogleSignIn() {
    setError(null);
    setSubmitting(true);

    try {
      const user = await signInWithOAuthProfile(await signInWithGoogle());
      if (user.role === 'company') {
        navigate('/company/dashboard');
      } else {
        navigate('/app/dashboard');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleFacebookSignIn() {
    setError(null);
    setSubmitting(true);

    try {
      const user = await signInWithOAuthProfile(await signInWithFacebook());
      if (user.role === 'company') {
        navigate('/company/dashboard');
      } else {
        navigate('/app/dashboard');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const user = await signIn(email, password);
      if (user.role === 'company') {
        navigate('/company/dashboard');
      } else {
        navigate('/app/dashboard');
      }
    } catch (err) {
      const msg = (err as Error).message;
      setError(msg === 'Invalid login credentials'
        ? 'Incorrect email or password. Please try again.'
        : msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to keep your applications moving."
      primaryLabel="Sign in"
      onPrimary={handleSubmit}
      submitting={submitting}
      footer={
        <>
          Don&apos;t have an account?{' '}
          <Link to="/signup" className="font-semibold text-brand-600 hover:text-brand-700">
            Create one
          </Link>
        </>
      }
    >
      <ErrorBanner message={error} />
      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={submitting}
          onClick={handleGoogleSignIn}
        >
          Google
        </Button>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={submitting}
          onClick={handleFacebookSignIn}
        >
          Facebook
        </Button>
      </div>

      <div className="flex items-center gap-3 text-xs text-ink-400">
        <span className="h-px flex-1 bg-ink-200" />
        or continue with email
        <span className="h-px flex-1 bg-ink-200" />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink-700">Email</label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 w-full rounded-xl border border-ink-200 bg-white pl-11 pr-4 text-sm text-ink-900 shadow-soft outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            placeholder="you@example.com"
          />
        </div>
      </div>
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label className="block text-sm font-medium text-ink-700">Password</label>
          <button type="button" className="text-xs font-medium text-brand-600 hover:text-brand-700">
            Forgot?
          </button>
        </div>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            type={showPw ? 'text' : 'password'}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12 w-full rounded-xl border border-ink-200 bg-white pl-11 pr-11 text-sm text-ink-900 shadow-soft outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600"
          >
            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </AuthShell>
  );
}

export function SignupPage() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [accountType, setAccountType] = useState<'candidate' | 'company'>('candidate');
  const [showPw, setShowPw] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setSubmitting(true);
    try {
      if (accountType === 'company') {
        if (!companyName.trim()) {
          setError('Please provide a valid company name.');
          setSubmitting(false);
          return;
        }
        await signUp(email, password, companyName.trim(), 'company');
        navigate('/company/dashboard');
      } else {
        await signUp(email, password, `${firstName} ${lastName}`.trim(), 'candidate');
        navigate('/app/dashboard');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      title={accountType === 'company' ? 'Register your company' : 'Create your account'}
      subtitle={
        accountType === 'company'
          ? 'Post jobs, review applicants, and hire talent.'
          : 'Start tracking applications in under a minute.'
      }
      primaryLabel={accountType === 'company' ? 'Create company account' : 'Create account'}
      onPrimary={handleSubmit}
      submitting={submitting}
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">
            Sign in
          </Link>
        </>
      }
    >
      <ErrorBanner message={error} />

      {/* Account Type Selector */}
      <div className="grid grid-cols-2 rounded-xl bg-ink-100 p-1">
        <button
          type="button"
          onClick={() => {
            setAccountType('candidate');
            setError(null);
          }}
          className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition ${accountType === 'candidate'
              ? 'bg-white text-ink-900 shadow-soft'
              : 'text-ink-500 hover:text-ink-700'
            }`}
        >
          <User className="h-4 w-4" />
          Individual
        </button>
        <button
          type="button"
          onClick={() => {
            setAccountType('company');
            setError(null);
          }}
          className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition ${accountType === 'company'
              ? 'bg-white text-brand-700 shadow-soft'
              : 'text-ink-500 hover:text-ink-700'
            }`}
        >
          <Building2 className="h-4 w-4" />
          Company Owner
        </button>
      </div>

      {accountType === 'candidate' ? (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-700">First name</label>
            <input
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="h-12 w-full rounded-xl border border-ink-200 bg-white px-4 text-sm text-ink-900 shadow-soft outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              placeholder="Alex"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-700">Last name</label>
            <input
              required
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="h-12 w-full rounded-xl border border-ink-200 bg-white px-4 text-sm text-ink-900 shadow-soft outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              placeholder="Kim"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-700">Company name</label>
            <div className="relative">
              <Building2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <input
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="h-12 w-full rounded-xl border border-ink-200 bg-white pl-11 pr-4 text-sm text-ink-900 shadow-soft outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                placeholder="Acme Corp"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink-700">Owner / Contact name</label>
            <div className="relative">
              <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <input
                required
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="h-12 w-full rounded-xl border border-ink-200 bg-white pl-11 pr-4 text-sm text-ink-900 shadow-soft outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                placeholder="Sarah Chen"
              />
            </div>
          </div>
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink-700">
          {accountType === 'company' ? 'Work Email' : 'Email'}
        </label>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 w-full rounded-xl border border-ink-200 bg-white pl-11 pr-4 text-sm text-ink-900 shadow-soft outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            placeholder={accountType === 'company' ? 'hiring@acme.com' : 'you@example.com'}
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-ink-700">Password</label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            type={showPw ? 'text' : 'password'}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12 w-full rounded-xl border border-ink-200 bg-white pl-11 pr-11 text-sm text-ink-900 shadow-soft outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            placeholder="At least 8 characters"
          />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600"
          >
            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </AuthShell>
  );
}
