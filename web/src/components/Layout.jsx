import { useState, useRef, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import AnomalyDrawer, { useAnomalyCount } from './AnomalyDrawer';

// ─── Icons (inline SVG, 24x24, stroke-based) ────────────────────────────────

const HomeIcon = (props) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z" />
  </svg>
);

const DumbbellIcon = (props) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6.5 6.5a2 2 0 00-2 2v7a2 2 0 002 2M17.5 6.5a2 2 0 012 2v7a2 2 0 01-2 2M3.5 9.5v5M20.5 9.5v5M6.5 12h11" />
  </svg>
);

const AppleIcon = (props) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 2c1 0 2.5 1 2.5 1S13 5 12 5s-2.5-2-2.5-2S11 2 12 2z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8c2 1 3 4 3 6.5 0 3-2 6.5-5 7.5-1 .33-1.5-.5-3-.5s-2 .83-3 .5c-3-1-5-4.5-5-7.5 0-2.5 1-5.5 3-6.5 1.5-.75 3 .5 5 .5s3.5-1.25 5-.5z" />
  </svg>
);

const ChartIcon = (props) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const GearIcon = (props) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const LogoutIcon = (props) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

const PlusIcon = (props) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
  </svg>
);

const BellIcon = (props) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const PlayIcon = (props) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ForkKnifeIcon = (props) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v18m-5-6l5-5 5 5M7 6c0 1.5.5 3 2 4m7-4c0 1.5-.5 3-2 4" />
  </svg>
);

const DocumentIcon = (props) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const PulseIcon = (props) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12h4l3-9 4 18 3-9h4" />
  </svg>
);

// ─── Nav Data ────────────────────────────────────────────────────────────────

const navItems = [
  { to: '/', Icon: HomeIcon },
  { to: '/programs', Icon: DumbbellIcon },
  // FAB placeholder (index 2) — handled separately
  { to: '/nutrition', Icon: AppleIcon },
  { to: '/metrics', Icon: PulseIcon },
  { to: '/reports', Icon: ChartIcon },
];

const quickActions = [
  { label: 'Start Workout', Icon: PlayIcon, path: '/programs' },
  { label: 'Log Food', Icon: ForkKnifeIcon, path: '/nutrition' },
  { label: 'Generate Report', Icon: DocumentIcon, path: '/reports' },
];

// ─── Helper: user initials ──────────────────────────────────────────────────

function getInitials(name) {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// ─── Profile Dropdown (mobile top-left) ─────────────────────────────────────

function ProfileDropdown({ isOpen, onClose, onNavigate, onLogout, demoMode }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={ref}
          className="absolute top-full left-0 mt-1 w-44 bg-dark-800 border border-dark-600/40 rounded-xl shadow-xl overflow-hidden z-50"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15 }}
        >
          {!demoMode && (
            <>
              <button
                onClick={() => { onNavigate('/settings'); onClose(); }}
                className="flex items-center gap-2.5 w-full px-4 py-3 text-sm text-gray-400 hover:text-gray-200 hover:bg-dark-700 transition-colors"
              >
                <GearIcon className="w-4 h-4" />
                Settings
              </button>
              <div className="border-t border-dark-600/40" />
              <button
                onClick={() => { onLogout(); onClose(); }}
                className="flex items-center gap-2.5 w-full px-4 py-3 text-sm text-gray-500 hover:text-red-400 hover:bg-dark-700 transition-colors"
              >
                <LogoutIcon className="w-4 h-4" />
                Logout
              </button>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Quick Action Bottom Sheet ──────────────────────────────────────────────

function QuickActionSheet({ isOpen, onClose }) {
  const navigate = useNavigate();

  function handleAction(path) {
    onClose();
    navigate(path);
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed bottom-0 inset-x-0 z-50 bg-dark-800 rounded-t-2xl border-t border-dark-600/40 px-6 pt-6 safe-area-pb"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          >
            <div className="flex justify-center mb-5">
              <div className="w-10 h-1 rounded-full bg-dark-600" />
            </div>
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
              Quick Actions
            </h3>
            <div className="flex flex-col gap-2 pb-6">
              {quickActions.map(({ label, Icon, path }) => (
                <button
                  key={label}
                  onClick={() => handleAction(path)}
                  className="flex items-center gap-4 w-full px-4 py-3.5 rounded-xl bg-dark-700/60 hover:bg-dark-700 active:scale-[0.98] transition-all text-left"
                >
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                    <Icon className="w-5 h-5 text-cyan-400" />
                  </div>
                  <span className="text-sm font-medium text-gray-200">{label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Desktop Sidebar Nav Item (icon-only, narrow) ───────────────────────────

function SidebarIcon({ to, Icon }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        `relative flex items-center justify-center w-full h-12 transition-colors ${
          isActive ? 'text-cyan-400' : 'text-gray-500 hover:text-gray-300'
        }`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <div className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r bg-cyan-400" />
          )}
          <Icon className="w-6 h-6" />
        </>
      )}
    </NavLink>
  );
}

// ─── Layout ─────────────────────────────────────────────────────────────────

export default function Layout() {
  const { user, logout, demoMode } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [anomalyOpen, setAnomalyOpen] = useState(false);
  const anomalyCount = useAnomalyCount();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = getInitials(user?.name);

  // Close profile dropdown on route change
  useEffect(() => {
    setProfileOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-dark-900 flex">
      {/* ── Desktop Sidebar (lg+) ─── narrow, icon-only ──────────────── */}
      <aside className="hidden lg:flex flex-col items-center w-16 bg-dark-800 border-r border-dark-600/40 fixed inset-y-0 left-0 z-30 py-4">
        {/* Brand */}
        <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-6" style={{background: 'linear-gradient(135deg, #06b6d4, #0891b2)', boxShadow: '0 0 12px rgba(6,182,212,0.3), inset 0 1px 0 rgba(255,255,255,0.15)'}}>
          <svg width="20" height="18" viewBox="0 0 20 18" fill="none">
            <path d="M8.5 2C5.5 2 3 4.5 3 7.5V10.5C3 13.5 5.5 16 8.5 16" stroke="#08080c" strokeWidth="2.5" strokeLinecap="round"/>
            <path d="M12 2V16M12 2H17M12 9H16" stroke="#08080c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        {/* Primary nav icons */}
        <nav className="flex flex-col w-full flex-1">
          {navItems.map((item) => (
            <SidebarIcon key={item.to} {...item} />
          ))}
        </nav>

        {/* Footer: settings + logout (hidden in demo mode) */}
        {!demoMode && (
          <div className="flex flex-col items-center gap-1 w-full border-t border-dark-600/40 pt-3">
            <NavLink
              to="/settings"
              className={({ isActive }) =>
                `relative flex items-center justify-center w-full h-12 transition-colors ${
                  isActive ? 'text-cyan-400' : 'text-gray-500 hover:text-gray-300'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <div className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r bg-cyan-400" />
                  )}
                  <GearIcon className="w-6 h-6" />
                </>
              )}
            </NavLink>
            <button
              onClick={handleLogout}
              className="flex items-center justify-center w-full h-12 text-gray-500 hover:text-red-400 transition-colors"
              aria-label="Log out"
            >
              <LogoutIcon className="w-6 h-6" />
            </button>
          </div>
        )}
      </aside>

      {/* ── Main Content Area ────────────────────────────────────────── */}
      <div className="flex-1 lg:ml-16">
        {/* ── Top Header Bar (fixed, h-14) ───────────────────────────── */}
        <header className="fixed top-0 left-0 right-0 lg:left-16 z-40 h-14 bg-dark-800 border-b border-dark-600/40 flex items-center px-4">
          {/* Left: Avatar (mobile profile trigger) / desktop shows avatar too */}
          <div className="relative">
            <button
              onClick={() => setProfileOpen((v) => !v)}
              className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
              aria-label="Profile menu"
            >
              {initials}
            </button>
            {/* Mobile profile dropdown */}
            <div className="lg:hidden">
              <ProfileDropdown
                isOpen={profileOpen}
                onClose={() => setProfileOpen(false)}
                onNavigate={navigate}
                onLogout={handleLogout}
                demoMode={demoMode}
              />
            </div>
            {/* Desktop profile dropdown */}
            <div className="hidden lg:block">
              <ProfileDropdown
                isOpen={profileOpen}
                onClose={() => setProfileOpen(false)}
                onNavigate={navigate}
                onLogout={handleLogout}
                demoMode={demoMode}
              />
            </div>
          </div>

          {/* Center: Brand */}
          <span className="absolute left-1/2 -translate-x-1/2 text-base font-bold text-gray-100">
            Claude-Fit
          </span>

          {/* Right: Bell icon */}
          <div className="ml-auto">
            <button
              onClick={() => setAnomalyOpen(true)}
              className="p-1.5 text-gray-500 hover:text-gray-300 relative"
              aria-label="Notifications"
            >
              <BellIcon className="w-6 h-6" />
              {anomalyCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[9px] font-bold text-white">
                  {anomalyCount > 9 ? '9+' : anomalyCount}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* ── Demo Banner ───────────────────────────────────────────── */}
        {demoMode && (
          <div className="fixed top-14 left-0 right-0 lg:left-16 z-30 bg-cyan-500/10 border-b border-cyan-500/20 px-4 py-2 flex items-center justify-center gap-2">
            <span className="text-xs font-medium text-cyan-400">Demo Mode</span>
            <span className="text-xs text-gray-400">— Read only</span>
          </div>
        )}

        {/* ── Scrollable Content ─────────────────────────────────────── */}
        <main className={`${demoMode ? 'pt-24' : 'pt-14'} pb-24 lg:pb-6 p-5 lg:p-6 ${demoMode ? 'lg:pt-28' : 'lg:pt-20'} max-w-5xl mx-auto`}>
          <Outlet />
        </main>

        {/* ── Mobile Bottom Nav (icon-only, 5 tabs) ──────────────────── */}
        <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-dark-800/95 backdrop-blur-lg border-t border-dark-600/40">
          <div className="flex items-end justify-around px-2 safe-area-pb" style={{ minHeight: 60 }}>
            {/* Home */}
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `flex items-center justify-center w-12 h-12 transition-colors ${
                  isActive ? 'text-cyan-400' : 'text-gray-500'
                }`
              }
            >
              <HomeIcon className="w-6 h-6" />
            </NavLink>

            {/* Workouts */}
            <NavLink
              to="/programs"
              className={({ isActive }) =>
                `flex items-center justify-center w-12 h-12 transition-colors ${
                  isActive ? 'text-cyan-400' : 'text-gray-500'
                }`
              }
            >
              <DumbbellIcon className="w-6 h-6" />
            </NavLink>

            {/* Center FAB (elevated) — hidden in demo mode */}
            {!demoMode && (
              <div className="flex items-center justify-center -mt-5">
                <button
                  onClick={() => setSheetOpen(true)}
                  className="w-14 h-14 rounded-full bg-cyan-500 hover:bg-cyan-400 active:scale-95 flex items-center justify-center shadow-lg shadow-cyan-500/30 transition-all"
                  aria-label="Quick actions"
                >
                  <PlusIcon className="w-7 h-7 text-white" />
                </button>
              </div>
            )}

            {/* Nutrition */}
            <NavLink
              to="/nutrition"
              className={({ isActive }) =>
                `flex items-center justify-center w-12 h-12 transition-colors ${
                  isActive ? 'text-cyan-400' : 'text-gray-500'
                }`
              }
            >
              <AppleIcon className="w-6 h-6" />
            </NavLink>

            {/* Metrics */}
            <NavLink
              to="/metrics"
              className={({ isActive }) =>
                `flex items-center justify-center w-12 h-12 transition-colors ${
                  isActive ? 'text-cyan-400' : 'text-gray-500'
                }`
              }
            >
              <PulseIcon className="w-6 h-6" />
            </NavLink>
          </div>
        </nav>
      </div>

      {/* ── Quick Action Bottom Sheet ────────────────────────────────── */}
      <QuickActionSheet isOpen={sheetOpen} onClose={() => setSheetOpen(false)} />
      <AnomalyDrawer isOpen={anomalyOpen} onClose={() => setAnomalyOpen(false)} />
    </div>
  );
}
