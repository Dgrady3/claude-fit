import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Eager-load the landing/auth pages (first paint)
import Login from './pages/Login';
import Signup from './pages/Signup';
import Landing from './pages/Landing';
import DemoEntry from './pages/DemoEntry';
import Dashboard from './pages/Dashboard';

// Lazy-load everything else
const Programs = lazy(() => import('./pages/Programs'));
const ProgramDetail = lazy(() => import('./pages/ProgramDetail'));
const WorkoutLogger = lazy(() => import('./pages/WorkoutLogger'));
const WorkoutHistory = lazy(() => import('./pages/WorkoutHistory'));
const Nutrition = lazy(() => import('./pages/Nutrition'));
const Reports = lazy(() => import('./pages/Reports'));
const ReportDetail = lazy(() => import('./pages/ReportDetail'));
const Settings = lazy(() => import('./pages/Settings'));
const Metrics = lazy(() => import('./pages/Metrics'));
const AthleteCard = lazy(() => import('./pages/AthleteCard'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function PageSpinner() {
  return (
    <div className="flex justify-center py-20">
      <div className="animate-spin w-6 h-6 border-2 border-cyan-400 border-t-transparent rounded-full" />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ErrorBoundary>
        <BrowserRouter>
          <Suspense fallback={<PageSpinner />}>
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
          </Suspense>
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
