import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { LandingPage } from './components/landing-page';
import { Dashboard } from './components/dashboard';
import { DocumentHistory } from './components/document-history';
import { Login } from './components/login';
import { SignUp } from './components/signup';
import { VersionCompare } from './components/version-compare';
import { AuthProvider, useAuth } from './AuthContext';
import type { AuthResponse, Document } from './services/api';
import { PreferencesProvider } from './PreferencesContext';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PreferencesProvider>
          <AppRoutes />
        </PreferencesProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPageRoute />} />
      <Route path="/dashboard" element={<DashboardRoute />} />
      <Route path="/history" element={<DocumentHistoryRoute />} />
      <Route path="/login" element={<LoginRoute />} />
      <Route path="/signup" element={<SignUpRoute />} />
      <Route path="/compare" element={<VersionCompareRoute />} />
      <Route path="/documents/:documentId" element={<DocumentViewPage />} />
    </Routes>
  );
}

function LandingPageRoute() {
  const navigate = useNavigate();
  return (
    <LandingPage
      onGetStarted={() => navigate('/dashboard')}
      onLogin={() => navigate('/login')}
      onSignUp={() => navigate('/signup')}
    />
  );
}

function DashboardRoute() {
  const navigate = useNavigate();
  return (
    <Dashboard
      onBackToLanding={() => navigate('/')}
      onNavigateToHistory={() => navigate('/history')}
      onNavigateToCompare={() => navigate('/compare')}
    />
  );
}

function DocumentHistoryRoute() {
  const navigate = useNavigate();
  return (
    <DocumentHistory
      onBack={() => navigate(-1)}
      onViewDocument={(doc: Document) => navigate(`/documents/${doc.id}`)}
      onNewAnalysis={() => navigate('/dashboard')}
    />
  );
}

function LoginRoute() {
  const navigate = useNavigate();
  const { login } = useAuth();
  return (
    <Login
      onBack={() => navigate('/')}
      onSignUp={() => navigate('/signup')}
      onLoginSuccess={(response: AuthResponse) => {
        login(response.user);
        navigate('/dashboard');
      }}
    />
  );
}

function SignUpRoute() {
  const navigate = useNavigate();
  const { login } = useAuth();
  return (
    <SignUp
      onBack={() => navigate('/')}
      onLogin={() => navigate('/login')}
      onSignUpSuccess={(response: AuthResponse) => {
        login(response.user);
        navigate('/dashboard');
      }}
    />
  );
}

function VersionCompareRoute() {
  const navigate = useNavigate();
  return <VersionCompare onBack={() => navigate(-1)} />;
}

function DocumentViewPage() {
  return (
    <div style={{ padding: '2rem' }}>
      <h1>Viewing a Single Document</h1>
      <p>This page will show the full analysis report for a specific document from your history.</p>
    </div>
  );
}

export default App;
