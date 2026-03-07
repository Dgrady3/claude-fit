import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.15 } },
};

const features = [
  {
    title: 'AI-Powered Insights',
    description: 'Claude analyzes your training, sleep, and nutrition to find what\'s holding you back.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
  },
  {
    title: 'Oura Ring Integration',
    description: 'Sleep scores, HRV, readiness — all synced automatically and cross-referenced with your training.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
      </svg>
    ),
  },
  {
    title: '12 Analytics Charts',
    description: 'Lift progression, sleep stages, macro tracking, anomaly detection — every metric visualized.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12h4l3-9 4 18 3-9h4" />
      </svg>
    ),
  },
  {
    title: 'Body Comp Simulator',
    description: 'Project your physique changes with adjustable deficit, protein, and training variables.',
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-dark-900 text-gray-100 overflow-hidden">
      {/* Subtle gradient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-cyan-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-emerald-500/3 rounded-full blur-[100px]" />
      </div>

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-cyan-500/20 flex items-center justify-center">
            <span className="text-cyan-400 font-bold text-sm">GF</span>
          </div>
          <span className="text-lg font-bold text-gray-100">GrokFit</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm text-gray-400 hover:text-gray-200 transition-colors px-3 py-2">
            Sign In
          </Link>
          <Link to="/demo" className="text-sm font-medium text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 px-4 py-2 rounded-lg transition-all">
            Try Demo
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <motion.section
        initial="hidden"
        animate="visible"
        variants={stagger}
        className="relative z-10 max-w-4xl mx-auto text-center px-6 pt-20 pb-24"
      >
        <motion.div variants={fadeUp} className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-4 py-1.5 mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-xs text-cyan-400 font-medium">AI-Powered Fitness Intelligence</span>
        </motion.div>

        <motion.h1 variants={fadeUp} className="text-5xl sm:text-6xl font-bold leading-tight mb-6">
          Train smarter with
          <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">data-driven insights</span>
        </motion.h1>

        <motion.p variants={fadeUp} className="text-lg text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          GrokFit cross-references your training, Oura recovery data, and nutrition to show you exactly what's working — and what's holding you back.
        </motion.p>

        <motion.div variants={fadeUp} className="flex items-center justify-center gap-4">
          <Link to="/signup" className="px-8 py-3.5 bg-cyan-500 hover:bg-cyan-400 text-dark-900 font-semibold rounded-xl transition-all shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40">
            Get Started
          </Link>
          <Link to="/demo" className="px-8 py-3.5 bg-dark-800 hover:bg-dark-700 text-gray-200 font-medium rounded-xl border border-dark-600/40 hover:border-cyan-500/30 transition-all">
            View Demo
          </Link>
        </motion.div>
      </motion.section>

      {/* Features Grid */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        variants={stagger}
        className="relative z-10 max-w-5xl mx-auto px-6 pb-24"
      >
        <motion.h2 variants={fadeUp} className="text-sm font-semibold text-gray-500 uppercase tracking-wider text-center mb-10">
          Everything you need
        </motion.h2>
        <div className="grid sm:grid-cols-2 gap-5">
          {features.map((f, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              className="bg-dark-800/60 border border-dark-600/40 rounded-2xl p-6 hover:border-cyan-500/20 transition-colors group"
            >
              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400 mb-4 group-hover:bg-cyan-500/20 transition-colors">
                {f.icon}
              </div>
              <h3 className="text-base font-semibold text-gray-100 mb-2">{f.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{f.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Stats bar */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={stagger}
        className="relative z-10 max-w-4xl mx-auto px-6 pb-24"
      >
        <div className="bg-dark-800/60 border border-dark-600/40 rounded-2xl p-8 flex items-center justify-around">
          {[
            { value: '12', label: 'Analytics Charts' },
            { value: '4', label: 'Data Sources' },
            { value: '24/7', label: 'AI Analysis' },
            { value: 'PWA', label: 'Offline Ready' },
          ].map((s, i) => (
            <motion.div key={i} variants={fadeUp} className="text-center">
              <p className="text-2xl font-bold text-cyan-400 font-mono">{s.value}</p>
              <p className="text-xs text-gray-500 mt-1">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* CTA */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={stagger}
        className="relative z-10 max-w-4xl mx-auto px-6 pb-24 text-center"
      >
        <motion.h2 variants={fadeUp} className="text-3xl font-bold mb-4">
          Ready to optimize your training?
        </motion.h2>
        <motion.p variants={fadeUp} className="text-gray-400 mb-8">
          Start tracking for free. No credit card required.
        </motion.p>
        <motion.div variants={fadeUp}>
          <Link to="/signup" className="px-8 py-3.5 bg-cyan-500 hover:bg-cyan-400 text-dark-900 font-semibold rounded-xl transition-all shadow-lg shadow-cyan-500/25 inline-block">
            Create Free Account
          </Link>
        </motion.div>
      </motion.section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-dark-600/40 py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-cyan-500/20 flex items-center justify-center">
              <span className="text-cyan-400 font-bold text-[10px]">GF</span>
            </div>
            <span className="text-xs text-gray-600">GrokFit</span>
          </div>
          <span className="text-xs text-gray-600">Built with Claude AI</span>
        </div>
      </footer>
    </div>
  );
}
