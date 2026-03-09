import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function DemoEntry() {
  const { enterDemoMode } = useAuth();
  const navigate = useNavigate();
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    enterDemoMode().then(() => setEntered(true));
  }, [enterDemoMode]);

  useEffect(() => {
    if (!entered) return;
    const timer = setTimeout(() => navigate('/', { replace: true }), 1500);
    return () => clearTimeout(timer);
  }, [entered, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-900">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-cyan-500/20 flex items-center justify-center mx-auto">
          <span className="text-cyan-400 font-bold text-2xl">GF</span>
        </div>
        <div className="space-y-1">
          <h1 className="text-lg font-bold text-gray-100">GrokFit</h1>
          <p className="text-sm text-gray-400">Loading demo experience...</p>
        </div>
        <div className="animate-spin w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full mx-auto" />
      </div>
    </div>
  );
}
