import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Programs from './pages/Programs';
import ProgramDetail from './pages/ProgramDetail';
import WorkoutLogger from './pages/WorkoutLogger';
import WorkoutHistory from './pages/WorkoutHistory';
import Nutrition from './pages/Nutrition';
import Reports from './pages/Reports';
import ReportDetail from './pages/ReportDetail';
import Settings from './pages/Settings';
import Metrics from './pages/Metrics';
import DemoEntry from './pages/DemoEntry';
import Landing from './pages/Landing';
import AthleteCard from './pages/AthleteCard';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ErrorBoundary>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/demo" element={<DemoEntry />} />
            <Route path="/landing" element={<Landing />} />

            {/* Protected routes inside Layout */}
            <Route
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<Dashboard />} />
              <Route path="/programs" element={<Programs />} />
              <Route path="/programs/:id" element={<ProgramDetail />} />
              <Route path="/workout/history" element={<WorkoutHistory />} />
              <Route path="/workout/:programId" element={<WorkoutLogger />} />
              <Route path="/nutrition" element={<Nutrition />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/reports/:id" element={<ReportDetail />} />
              <Route path="/metrics" element={<Metrics />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/athlete-card" element={<AthleteCard />} />
            </Route>
          </Routes>
        </BrowserRouter>
        </ErrorBoundary>

        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#1a1a25',
              color: '#e5e7eb',
              border: '1px solid rgba(36, 36, 48, 0.5)',
              fontSize: '14px',
            },
            success: {
              iconTheme: { primary: '#34d399', secondary: '#0a0a0f' },
            },
            error: {
              iconTheme: { primary: '#f87171', secondary: '#0a0a0f' },
            },
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  );
}
