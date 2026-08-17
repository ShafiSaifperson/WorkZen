import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '@/components/AppShell';
import { LoginPage, SignupPage } from '@/pages/Auth';
import { DashboardPage } from '@/pages/Dashboard';
import { JobsPage } from '@/pages/Jobs';
import { JobDetailPage } from '@/pages/JobDetail';
import { ApplicationsPage } from '@/pages/Applications';
import { ResumeCoachPage } from '@/pages/ResumeCoach';
import { CoverLetterPage } from '@/pages/CoverLetter';
import { InterviewDetailPage } from '@/pages/InterviewDetail';
import { CompanyDashboardPage } from '@/pages/CompanyDashboard';
import { AuthProvider, useAuth } from '@/lib/auth';

function CandidateRoutes() {
  const { user, signOut } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/app" element={<AppShell user={user} onSignOut={signOut} />}>
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="jobs" element={<JobsPage />} />
          <Route path="jobs/:jobId" element={<JobDetailPage />} />
          <Route path="applications" element={<ApplicationsPage />} />
          <Route path="interviews/:interviewId" element={<InterviewDetailPage />} />
          <Route path="resume-coach" element={<ResumeCoachPage />} />
          <Route path="cover-letter" element={<CoverLetterPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

function CompanyRoutes() {
  const { user, signOut } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/company" element={<AppShell user={user} onSignOut={signOut} />}>
          <Route path="dashboard" element={<CompanyDashboardPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/company/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

function PublicRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-ink-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink-200 border-t-brand-600" />
      </div>
    );
  }

  if (!user) return <PublicRoutes />;
  return user.role === 'company' ? <CompanyRoutes /> : <CandidateRoutes />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}