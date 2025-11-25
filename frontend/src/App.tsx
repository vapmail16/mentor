import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Pricing from './pages/Pricing';
import PaymentSuccess from './pages/PaymentSuccess';
import Sessions from './pages/Sessions';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminSessions from './pages/admin/AdminSessions';
import AdminLearningPaths from './pages/admin/AdminLearningPaths';
import AdminMentors from './pages/admin/AdminMentors';
import AdminSubscriptions from './pages/admin/AdminSubscriptions';
import AdminSettings from './pages/admin/AdminSettings';
import SessionDetail from './pages/SessionDetail';
import LearningPaths from './pages/LearningPaths';
import LearningPathDetail from './pages/LearningPathDetail';
import Mentors from './pages/Mentors';
import MentorDetail from './pages/MentorDetail';
import Search from './pages/Search';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route
        path="/login"
        element={user ? <Navigate to="/dashboard" replace /> : <Login />}
      />
      <Route
        path="/register"
        element={user ? <Navigate to="/dashboard" replace /> : <Register />}
      />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/payment/success" element={<PaymentSuccess />} />
      
      {/* Protected Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute>
            <AdminUsers />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/sessions"
        element={
          <ProtectedRoute>
            <AdminSessions />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/learning-paths"
        element={
          <ProtectedRoute>
            <AdminLearningPaths />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/mentors"
        element={
          <ProtectedRoute>
            <AdminMentors />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/subscriptions"
        element={
          <ProtectedRoute>
            <AdminSubscriptions />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/settings"
        element={
          <ProtectedRoute>
            <AdminSettings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/sessions"
        element={
          <ProtectedRoute>
            <Sessions />
          </ProtectedRoute>
        }
      />
      <Route
        path="/sessions/:id"
        element={
          <ProtectedRoute>
            <SessionDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/learning-paths"
        element={
          <ProtectedRoute>
            <LearningPaths />
          </ProtectedRoute>
        }
      />
      <Route
        path="/learning-paths/:id"
        element={
          <ProtectedRoute>
            <LearningPathDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/mentors"
        element={
          <ProtectedRoute>
            <Mentors />
          </ProtectedRoute>
        }
      />
      <Route
        path="/mentors/:id"
        element={
          <ProtectedRoute>
            <MentorDetail />
          </ProtectedRoute>
        }
      />
      <Route
        path="/search"
        element={
          <ProtectedRoute>
            <Search />
          </ProtectedRoute>
        }
      />
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster position="top-right" />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
