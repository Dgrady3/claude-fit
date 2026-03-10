import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

const LANDING_CSS = `
@font-face {
  font-family: 'General Sans';
  src: url('https://fonts.googleapis.com/css2?family=General+Sans:wght@400;500;600;700&display=swap');
}

.landing-page *, .landing-page *::before, .landing-page *::after { margin: 0; padding: 0; box-sizing: border-box; }

.landing-page {
  --bg: #08080c;
  --surface: #0e0e14;
  --surface-2: #14141c;
  --cyan: #06b6d4;
  --emerald: #10b981;
  --amber: #f59e0b;
  --red: #ef4444;
  --purple: #a78bfa;
  --text-1: #f0f0f2;
  --text-2: rgba(240,240,242,0.55);
  --text-3: rgba(240,240,242,0.3);
  --border: rgba(240,240,242,0.06);
  --border-2: rgba(240,240,242,0.1);
  --font-display: 'General Sans', -apple-system, sans-serif;
  --font-mono: 'IBM Plex Mono', 'SF Mono', monospace;
  --ease: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-out: cubic-bezier(0.33, 1, 0.68, 1);

  background: var(--bg);
  color: var(--text-1);
  font-family: var(--font-display);
  font-weight: 400;
  font-size: 16px;
  line-height: 1.6;
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  min-height: 100vh;
  position: relative;
}

/* ── Grain ── */
.landing-page::after {
  content: '';
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 9999;
  opacity: 0.035;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  background-repeat: repeat;
  background-size: 256px;
}

.landing-page .container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 24px;
  position: relative;
  z-index: 1;
}

/* NAV */
.landing-page .nav {
  position: fixed;
  top: 0; left: 0; right: 0;
  z-index: 100;
  padding: 0;
  height: 64px;
  display: flex;
  align-items: center;
  transition: all 0.5s var(--ease);
}
.landing-page .nav.scrolled {
  background: rgba(8,8,12,0.75);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--border);
}
.landing-page .nav .container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}
.landing-page .nav-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  text-decoration: none;
}
.landing-page .nav-mark {
  width: 34px; height: 34px;
  border-radius: 9px;
  background: linear-gradient(135deg, var(--cyan), #0891b2);
  display: flex; align-items: center; justify-content: center;
  font-family: var(--font-mono);
  position: relative;
  overflow: hidden;
  box-shadow: 0 0 12px rgba(6,182,212,0.3), inset 0 1px 0 rgba(255,255,255,0.15);
  font-weight: 600;
  font-size: 11px;
  color: var(--bg);
  letter-spacing: -0.02em;
}
.landing-page .nav-wordmark {
  font-weight: 600;
  font-size: 17px;
  color: var(--text-1);
  letter-spacing: -0.03em;
}
.landing-page .nav-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

/* BUTTONS */
.landing-page .btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 9px 18px;
  border-radius: 8px;
  font-family: var(--font-display);
  font-weight: 500;
  font-size: 14px;
  text-decoration: none;
  cursor: pointer;
  border: none;
  white-space: nowrap;
  transition: all 0.2s ease;
}
.landing-page .btn--ghost {
  background: transparent;
  color: var(--text-2);
}
.landing-page .btn--ghost:hover {
  color: var(--text-1);
  background: rgba(255,255,255,0.04);
}
.landing-page .btn--primary {
  background: var(--text-1);
  color: var(--bg);
  font-weight: 600;
}
.landing-page .btn--primary:hover {
  background: #fff;
  transform: translateY(-1px);
  box-shadow: 0 4px 20px rgba(240,240,242,0.15);
}
.landing-page .btn--large {
  padding: 13px 28px;
  font-size: 15px;
  border-radius: 10px;
}
.landing-page .btn--cyan {
  background: var(--cyan);
  color: var(--bg);
  font-weight: 600;
}
.landing-page .btn--cyan:hover {
  filter: brightness(1.1);
  transform: translateY(-1px);
  box-shadow: 0 4px 24px rgba(6,182,212,0.25);
}

/* HERO */
.landing-page .hero {
  padding: 140px 0 0;
  position: relative;
  overflow: hidden;
  min-height: 100vh;
}
.landing-page .hero-glow {
  position: absolute;
  width: 900px;
  height: 500px;
  top: 5%;
  left: 50%;
  transform: translateX(-50%);
  background: radial-gradient(ellipse, rgba(6,182,212,0.06), transparent 65%);
  pointer-events: none;
  z-index: 0;
}
.landing-page .hero-top {
  text-align: center;
  max-width: 700px;
  margin: 0 auto 72px;
  position: relative;
  z-index: 1;
}
.landing-page .hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 5px 14px 5px 10px;
  border-radius: 100px;
  border: 1px solid var(--border-2);
  background: rgba(255,255,255,0.02);
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 500;
  color: var(--text-2);
  margin-bottom: 28px;
  letter-spacing: 0.02em;
}
.landing-page .hero-badge-dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: var(--cyan);
  box-shadow: 0 0 10px rgba(6,182,212,0.6);
  animation: lp-dotPulse 2.5s ease-in-out infinite;
}
@keyframes lp-dotPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
.landing-page .hero-title {
  font-weight: 700;
  font-size: clamp(38px, 5vw, 60px);
  line-height: 1.1;
  letter-spacing: -0.035em;
  margin-bottom: 20px;
  color: var(--text-1);
}
.landing-page .hero-title-fade {
  display: block;
  background: linear-gradient(to bottom, var(--text-1) 30%, rgba(240,240,242,0.4));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.landing-page .hero-sub {
  font-size: 17px;
  color: var(--text-2);
  max-width: 480px;
  margin: 0 auto 32px;
  line-height: 1.65;
  font-weight: 400;
}
.landing-page .hero-ctas {
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
}

/* BENTO HERO GRID */
.landing-page .bento-hero {
  display: grid;
  grid-template-columns: 1fr 1fr 1.2fr 0.8fr;
  grid-template-rows: 200px 180px;
  gap: 8px;
  padding: 0 24px;
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}
.landing-page .bento-card {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 14px;
  padding: 22px;
  position: relative;
  overflow: hidden;
  transition: border-color 0.3s ease, background 0.3s ease;
}
.landing-page .bento-card:hover {
  border-color: var(--border-2);
  background: var(--surface-2);
}
.landing-page .bento-label {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--text-3);
  margin-bottom: 14px;
}

/* Card 1: Recovery Score Ring */
.landing-page .card-recovery {
  grid-column: 1;
  grid-row: 1 / 3;
  display: flex;
  flex-direction: column;
}
.landing-page .recovery-ring-wrap {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}
.landing-page .recovery-ring {
  width: 140px;
  height: 140px;
  position: relative;
}
.landing-page .recovery-ring svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}
.landing-page .recovery-ring circle {
  fill: none;
  stroke-width: 6;
}
.landing-page .ring-bg { stroke: rgba(255,255,255,0.04); }
.landing-page .ring-value {
  stroke: var(--emerald);
  stroke-linecap: round;
  stroke-dasharray: 408;
  stroke-dashoffset: 408;
  filter: drop-shadow(0 0 8px rgba(16,185,129,0.3));
  transition: stroke-dashoffset 1.5s var(--ease);
}
.landing-page .recovery-number {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.landing-page .recovery-number .big {
  font-family: var(--font-mono);
  font-weight: 600;
  font-size: 42px;
  letter-spacing: -0.04em;
  color: var(--emerald);
  line-height: 1;
}
.landing-page .recovery-number .unit {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-3);
  margin-top: 4px;
}
.landing-page .recovery-status {
  text-align: center;
  margin-top: 12px;
  font-size: 13px;
  font-weight: 500;
  color: var(--emerald);
}

/* Card 2: Weekly Strain */
.landing-page .card-strain {
  grid-column: 2;
  grid-row: 1;
}
.landing-page .strain-bars {
  display: flex;
  align-items: flex-end;
  gap: 6px;
  height: 110px;
  margin-top: 8px;
}
.landing-page .strain-bar {
  flex: 1;
  border-radius: 4px 4px 2px 2px;
  position: relative;
  min-height: 8px;
  transition: height 1s var(--ease);
}
.landing-page .strain-bar::after {
  content: attr(data-day);
  position: absolute;
  bottom: -20px;
  left: 50%;
  transform: translateX(-50%);
  font-family: var(--font-mono);
  font-size: 9px;
  color: var(--text-3);
  letter-spacing: 0.02em;
}
.landing-page .strain-bar.today {
  border: 1px solid rgba(6,182,212,0.3);
  box-shadow: 0 0 12px rgba(6,182,212,0.15);
}

/* Card 3: AI Insight */
.landing-page .card-insight {
  grid-column: 2;
  grid-row: 2;
}
.landing-page .insight-content {
  margin-top: 6px;
}
.landing-page .insight-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 7px;
  background: rgba(6,182,212,0.1);
  margin-bottom: 12px;
}
.landing-page .insight-icon svg {
  width: 14px; height: 14px;
  stroke: var(--cyan);
  fill: none;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}
.landing-page .insight-text {
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 1.6;
  color: var(--text-2);
}
.landing-page .insight-text .highlight {
  color: var(--cyan);
}
.landing-page .insight-cursor {
  display: inline-block;
  width: 2px;
  height: 15px;
  background: var(--cyan);
  margin-left: 2px;
  vertical-align: text-bottom;
  animation: lp-blink 1s step-end infinite;
}
@keyframes lp-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

/* Card 4: Sleep Stages */
.landing-page .card-sleep {
  grid-column: 3;
  grid-row: 1 / 3;
  display: flex;
  flex-direction: column;
}
.landing-page .sleep-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 4px;
}
.landing-page .sleep-score {
  font-family: var(--font-mono);
  font-weight: 600;
  font-size: 24px;
  color: var(--purple);
  letter-spacing: -0.03em;
}
.landing-page .sleep-chart-wrap {
  flex: 1;
  position: relative;
  margin-top: 8px;
}
.landing-page .sleep-chart-wrap svg {
  width: 100%;
  height: 100%;
}
.landing-page .sleep-legend {
  display: flex;
  gap: 16px;
  margin-top: 8px;
}
.landing-page .sleep-legend-item {
  display: flex;
  align-items: center;
  gap: 5px;
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--text-3);
}
.landing-page .sleep-legend-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

/* Card 5: HRV + Resting HR */
.landing-page .card-hrv {
  grid-column: 4;
  grid-row: 1;
}
.landing-page .hrv-metrics {
  margin-top: 12px;
}
.landing-page .hrv-metric {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  padding: 10px 0;
  border-bottom: 1px solid var(--border);
}
.landing-page .hrv-metric:last-child { border: none; }
.landing-page .hrv-metric-name {
  font-size: 13px;
  color: var(--text-2);
}
.landing-page .hrv-metric-val {
  font-family: var(--font-mono);
  font-weight: 600;
  font-size: 20px;
  letter-spacing: -0.03em;
}
.landing-page .hrv-metric-unit {
  font-weight: 400;
  font-size: 12px;
  color: var(--text-3);
  margin-left: 2px;
}
.landing-page .hrv-delta {
  font-family: var(--font-mono);
  font-size: 11px;
  margin-top: 2px;
}
.landing-page .hrv-delta.up { color: var(--emerald); }
.landing-page .hrv-delta.down { color: var(--red); }

/* Card 6: Macros */
.landing-page .card-macros {
  grid-column: 4;
  grid-row: 2;
}
.landing-page .macro-bars {
  margin-top: 12px;
}
.landing-page .macro-row {
  margin-bottom: 12px;
}
.landing-page .macro-row:last-child { margin-bottom: 0; }
.landing-page .macro-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 5px;
}
.landing-page .macro-name {
  font-size: 12px;
  color: var(--text-2);
}
.landing-page .macro-val {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 500;
  color: var(--text-2);
}
.landing-page .macro-track {
  height: 6px;
  background: rgba(255,255,255,0.04);
  border-radius: 3px;
  overflow: hidden;
}
.landing-page .macro-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 1.2s var(--ease);
}

/* FEATURES SECTION */
.landing-page .features-section {
  padding: 140px 0 120px;
}
.landing-page .features-header {
  max-width: 560px;
  margin-bottom: 64px;
}
.landing-page .section-tag {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--cyan);
  margin-bottom: 16px;
}
.landing-page .section-title {
  font-weight: 700;
  font-size: clamp(28px, 3.5vw, 44px);
  letter-spacing: -0.03em;
  line-height: 1.1;
  margin-bottom: 16px;
  color: var(--text-1);
}
.landing-page .section-desc {
  color: var(--text-2);
  font-size: 16px;
  line-height: 1.65;
  max-width: 440px;
}
.landing-page .features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1px;
  background: var(--border);
  border: 1px solid var(--border);
  border-radius: 16px;
  overflow: hidden;
}
.landing-page .feature-cell {
  background: var(--surface);
  padding: 36px 32px;
  transition: background 0.3s ease;
}
.landing-page .feature-cell:hover {
  background: var(--surface-2);
}
.landing-page .feature-icon {
  width: 36px; height: 36px;
  border-radius: 9px;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 18px;
}
.landing-page .feature-icon svg {
  width: 18px; height: 18px;
  stroke-width: 1.5;
  stroke-linecap: round;
  stroke-linejoin: round;
  fill: none;
}
.landing-page .feature-cell h3 {
  font-weight: 600;
  font-size: 15px;
  letter-spacing: -0.02em;
  margin-bottom: 8px;
  color: var(--text-1);
}
.landing-page .feature-cell p {
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-3);
}

/* HOW IT WORKS */
.landing-page .how-section {
  padding: 120px 0;
  border-top: 1px solid var(--border);
}
.landing-page .how-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 48px;
  margin-top: 72px;
  position: relative;
}
.landing-page .how-grid::before {
  content: '';
  position: absolute;
  top: 22px;
  left: calc(16.66%);
  right: calc(16.66%);
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--border-2) 20%, var(--border-2) 80%, transparent);
}
.landing-page .how-step {
  text-align: center;
}
.landing-page .how-num {
  width: 44px; height: 44px;
  border-radius: 50%;
  border: 1px solid var(--border-2);
  background: var(--surface);
  display: inline-flex; align-items: center; justify-content: center;
  font-family: var(--font-mono);
  font-weight: 600;
  font-size: 14px;
  color: var(--cyan);
  margin-bottom: 24px;
  position: relative;
  z-index: 1;
}
.landing-page .how-step h3 {
  font-weight: 600;
  font-size: 16px;
  letter-spacing: -0.02em;
  margin-bottom: 8px;
  color: var(--text-1);
}
.landing-page .how-step p {
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-3);
  max-width: 260px;
  margin: 0 auto;
}

/* STATS BAR */
.landing-page .stats-bar {
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  padding: 56px 0;
}
.landing-page .stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 32px;
  text-align: center;
}
.landing-page .stat-num {
  font-family: var(--font-mono);
  font-weight: 600;
  font-size: clamp(28px, 3.5vw, 40px);
  letter-spacing: -0.04em;
  color: var(--cyan);
  margin-bottom: 4px;
}
.landing-page .stat-desc {
  font-size: 13px;
  color: var(--text-3);
  font-weight: 400;
}

/* CTA */
.landing-page .cta-section {
  padding: 160px 0;
  text-align: center;
  position: relative;
}
.landing-page .cta-section::before {
  content: '';
  position: absolute;
  width: 600px; height: 300px;
  top: 40%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: radial-gradient(ellipse, rgba(6,182,212,0.04), transparent 70%);
  pointer-events: none;
}
.landing-page .cta-title {
  font-weight: 700;
  font-size: clamp(32px, 4vw, 52px);
  letter-spacing: -0.03em;
  margin-bottom: 12px;
  color: var(--text-1);
}
.landing-page .cta-sub {
  color: var(--text-2);
  font-size: 16px;
  margin-bottom: 36px;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
}

/* FOOTER */
.landing-page .footer {
  border-top: 1px solid var(--border);
  padding: 32px 0;
}
.landing-page .footer .container {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.landing-page .footer-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  text-decoration: none;
}
.landing-page .footer-mark {
  width: 22px; height: 22px;
  border-radius: 5px;
  background: linear-gradient(135deg, var(--cyan), #0891b2);
  display: flex; align-items: center; justify-content: center;
  font-family: var(--font-mono);
  box-shadow: 0 0 8px rgba(6,182,212,0.2);
  font-weight: 600;
  font-size: 8px;
  color: var(--bg);
}
.landing-page .footer-name {
  font-weight: 500;
  font-size: 13px;
  color: var(--text-2);
}
.landing-page .footer-meta {
  font-size: 12px;
  color: var(--text-3);
}

/* ANIMATIONS */
.landing-page .reveal {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.8s var(--ease), transform 0.8s var(--ease);
}
.landing-page .reveal.visible {
  opacity: 1;
  transform: none;
}
.landing-page .hero-top { opacity: 0; transform: translateY(20px); animation: lp-fadeUp 0.8s var(--ease) 0.1s forwards; }
.landing-page .bento-hero { opacity: 0; transform: translateY(30px); animation: lp-fadeUp 0.9s var(--ease) 0.35s forwards; }

@keyframes lp-fadeUp {
  to { opacity: 1; transform: none; }
}

@media (prefers-reduced-motion: reduce) {
  .landing-page *, .landing-page *::before, .landing-page *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
  .landing-page .reveal, .landing-page .hero-top, .landing-page .bento-hero { opacity: 1; transform: none; animation: none; }
}

/* RESPONSIVE */
@media (max-width: 1024px) {
  .landing-page .bento-hero {
    grid-template-columns: 1fr 1fr;
    grid-template-rows: auto auto auto;
  }
  .landing-page .card-recovery { grid-column: 1; grid-row: 1; }
  .landing-page .card-strain { grid-column: 2; grid-row: 1; }
  .landing-page .card-insight { grid-column: 1; grid-row: 2; }
  .landing-page .card-sleep { grid-column: 2; grid-row: 2 / 4; }
  .landing-page .card-hrv { grid-column: 1; grid-row: 3; }
  .landing-page .card-macros { display: none; }
  .landing-page .features-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 768px) {
  .landing-page .nav-actions .btn--ghost { display: none; }
  .landing-page .bento-hero {
    grid-template-columns: 1fr;
    grid-template-rows: auto;
  }
  .landing-page .card-recovery, .landing-page .card-strain, .landing-page .card-insight, .landing-page .card-sleep, .landing-page .card-hrv {
    grid-column: 1;
    grid-row: auto;
  }
  .landing-page .features-grid { grid-template-columns: 1fr; }
  .landing-page .how-grid {
    grid-template-columns: 1fr;
    gap: 40px;
  }
  .landing-page .how-grid::before { display: none; }
  .landing-page .stats-grid { grid-template-columns: 1fr 1fr; gap: 24px; }
  .landing-page .hero { padding-top: 110px; }
  .landing-page .hero-top { margin-bottom: 48px; }
  .landing-page .footer .container { flex-direction: column; gap: 12px; text-align: center; }
}
`;

export default function Landing() {
  const navRef = useRef(null);
  const recoveryRingRef = useRef(null);
  const recoveryNumRef = useRef(null);
  const strainBarsRef = useRef(null);
  const insightTextRef = useRef(null);
  const sleepChartRef = useRef(null);
  const macroPRef = useRef(null);
  const macroCRef = useRef(null);
  const macroFRef = useRef(null);

  // Inject CSS and Google Fonts link tags
  useEffect(() => {
    // Style tag
    const style = document.createElement('style');
    style.setAttribute('data-landing-page', 'true');
    style.textContent = LANDING_CSS;
    document.head.appendChild(style);

    // Google Fonts
    const preconnect1 = document.createElement('link');
    preconnect1.rel = 'preconnect';
    preconnect1.href = 'https://fonts.googleapis.com';
    preconnect1.setAttribute('data-landing-page', 'true');
    document.head.appendChild(preconnect1);

    const preconnect2 = document.createElement('link');
    preconnect2.rel = 'preconnect';
    preconnect2.href = 'https://fonts.gstatic.com';
    preconnect2.crossOrigin = 'true';
    preconnect2.setAttribute('data-landing-page', 'true');
    document.head.appendChild(preconnect2);

    const fontLink = document.createElement('link');
    fontLink.rel = 'stylesheet';
    fontLink.href = 'https://fonts.googleapis.com/css2?family=General+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap';
    fontLink.setAttribute('data-landing-page', 'true');
    document.head.appendChild(fontLink);

    // Set body background to match landing page while mounted
    const prevBg = document.body.style.background;
    document.body.style.background = '#08080c';

    return () => {
      document.head.querySelectorAll('[data-landing-page]').forEach(el => el.remove());
      document.body.style.background = prevBg;
    };
  }, []);

  // Nav scroll glass effect
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const handleScroll = () => {
      nav.classList.toggle('scrolled', window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // IntersectionObserver reveal animations
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.querySelectorAll('.landing-page .reveal').forEach(el => el.classList.add('visible'));
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.classList.add('visible');
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );
    document.querySelectorAll('.landing-page .reveal').forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  // Recovery ring animation
  useEffect(() => {
    const score = 87;
    const circumference = 2 * Math.PI * 65; // ~408
    const offset = circumference - (score / 100) * circumference;
    const ring = recoveryRingRef.current;
    const num = recoveryNumRef.current;
    if (!ring || !num) return;

    const timer = setTimeout(() => {
      ring.style.strokeDashoffset = offset;
      const duration = 1200;
      let startTime = null;
      function tick(ts) {
        if (!startTime) startTime = ts;
        const progress = Math.min((ts - startTime) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        num.textContent = Math.round(eased * score);
        if (progress < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }, 600);

    return () => clearTimeout(timer);
  }, []);

  // Strain bars animation
  useEffect(() => {
    const container = strainBarsRef.current;
    if (!container) return;

    const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
    const values = [72, 85, 60, 90, 78, 45, 30];
    const colors = [
      'var(--cyan)', 'var(--cyan)', 'rgba(6,182,212,0.5)',
      'var(--cyan)', 'var(--cyan)', 'rgba(6,182,212,0.3)', 'rgba(6,182,212,0.2)',
    ];
    const timers = [];

    values.forEach((v, i) => {
      const bar = document.createElement('div');
      bar.className = 'strain-bar' + (i === 4 ? ' today' : '');
      bar.setAttribute('data-day', days[i]);
      bar.style.height = '0%';
      bar.style.background = colors[i];
      container.appendChild(bar);
      const t = setTimeout(() => {
        bar.style.height = v + '%';
      }, 700 + i * 80);
      timers.push(t);
    });

    return () => {
      timers.forEach(clearTimeout);
      container.innerHTML = '';
    };
  }, []);

  // AI Insight typewriter
  useEffect(() => {
    const el = insightTextRef.current;
    if (!el) return;

    const text = 'HRV dropped <span class="highlight">12% below baseline</span> after back-to-back heavy sessions. Consider a deload \u2014 your recovery debt is compounding.';
    const cursor = '<span class="insight-cursor"></span>';
    const plain = text.replace(/<[^>]*>/g, '');
    let i = 0;
    let cancelled = false;

    function getHtmlUpTo(charIndex) {
      let result = '';
      let plainIndex = 0;
      let inTag = false;
      for (let j = 0; j < text.length && plainIndex <= charIndex; j++) {
        if (text[j] === '<') { inTag = true; result += text[j]; continue; }
        if (text[j] === '>') { inTag = false; result += text[j]; continue; }
        if (inTag) { result += text[j]; continue; }
        if (plainIndex < charIndex) { result += text[j]; }
        plainIndex++;
      }
      return result;
    }

    const initialDelay = setTimeout(function type() {
      if (cancelled) return;
      if (i <= plain.length) {
        el.innerHTML = getHtmlUpTo(i) + cursor;
        i++;
        setTimeout(type, 22 + Math.random() * 18);
      } else {
        el.innerHTML = text + cursor;
      }
    }, 800);

    return () => {
      cancelled = true;
      clearTimeout(initialDelay);
    };
  }, []);

  // Sleep chart SVG
  useEffect(() => {
    const wrap = sleepChartRef.current;
    if (!wrap) return;

    const w = 320, h = 200;
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    svg.style.width = '100%';
    svg.style.height = '100%';

    const deep =  [20, 55, 70, 60, 30, 15, 10, 5,  8, 40, 55, 45, 20, 10, 5, 3];
    const rem =   [5,  10, 15, 25, 45, 55, 50, 40, 35, 20, 15, 25, 40, 50, 45, 35];
    const light = [75, 35, 15, 15, 25, 30, 40, 55, 57, 40, 30, 30, 40, 40, 50, 62];

    function makePath(data, yOffset, color, opacity) {
      const step = w / (data.length - 1);
      const scale = h * 0.28;
      let pathD = 'M0,' + yOffset;
      data.forEach((v, i) => {
        const x = i * step;
        const y = yOffset - (v / 100) * scale;
        if (i === 0) {
          pathD += ' L' + x + ',' + y;
        } else {
          const px = (i - 1) * step;
          const py = yOffset - (data[i - 1] / 100) * scale;
          const cx1 = px + step * 0.4;
          const cx2 = x - step * 0.4;
          pathD += ' C' + cx1 + ',' + py + ' ' + cx2 + ',' + y + ' ' + x + ',' + y;
        }
      });
      pathD += ' L' + w + ',' + yOffset + ' Z';

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', pathD);
      path.setAttribute('fill', color);
      path.setAttribute('opacity', opacity);
      return path;
    }

    svg.appendChild(makePath(light, h * 0.85, '#a78bfa', '0.12'));
    svg.appendChild(makePath(rem, h * 0.85, '#a78bfa', '0.3'));
    svg.appendChild(makePath(deep, h * 0.85, '#818cf8', '0.5'));

    const times = ['11pm', '1am', '3am', '5am', '7am'];
    times.forEach((t, i) => {
      const txt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      txt.setAttribute('x', String(i * (w / 4)));
      txt.setAttribute('y', String(h - 4));
      txt.setAttribute('fill', 'rgba(240,240,242,0.2)');
      txt.setAttribute('font-size', '10');
      txt.setAttribute('font-family', 'IBM Plex Mono, monospace');
      txt.textContent = t;
      svg.appendChild(txt);
    });

    wrap.appendChild(svg);

    return () => {
      wrap.innerHTML = '';
    };
  }, []);

  // Macro bar fills
  useEffect(() => {
    const timer = setTimeout(() => {
      if (macroPRef.current) macroPRef.current.style.width = '91%';
      if (macroCRef.current) macroCRef.current.style.width = '75%';
      if (macroFRef.current) macroFRef.current.style.width = '85%';
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="landing-page">
      {/* NAV */}
      <nav className="nav" ref={navRef}>
        <div className="container">
          <Link to="/landing" className="nav-logo">
            <div className="nav-mark">
              <svg width="20" height="18" viewBox="0 0 20 18" fill="none">
                <path d="M8.5 2C5.5 2 3 4.5 3 7.5V10.5C3 13.5 5.5 16 8.5 16" stroke="#08080c" strokeWidth="2.5" strokeLinecap="round"/>
                <path d="M12 2V16M12 2H17M12 9H16" stroke="#08080c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="nav-wordmark">Claude-Fit</span>
          </Link>
          <div className="nav-actions">
            <Link to="/login" className="btn btn--ghost">Sign In</Link>
            <Link to="/demo" className="btn btn--primary">Try Demo</Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-glow"></div>

        <div className="hero-top">
          <div className="hero-badge">
            <span className="hero-badge-dot"></span>
            AI-Powered Fitness Intelligence
          </div>
          <h1 className="hero-title">
            Your data tells a story.<br />
            <span className="hero-title-fade">Claude-Fit reads it.</span>
          </h1>
          <p className="hero-sub">
            AI that cross-references your training, sleep, and nutrition to help you build lean muscle and cut fat — faster.
          </p>
          <div className="hero-ctas">
            <Link to="/demo" className="btn btn--cyan btn--large">Try the Demo</Link>
            <Link to="/login" className="btn btn--ghost btn--large">Get Started</Link>
          </div>
        </div>

        {/* BENTO GRID */}
        <div className="bento-hero" id="bentoGrid">

          {/* 1: Recovery Score Ring */}
          <div className="bento-card card-recovery">
            <div className="bento-label">Recovery Score</div>
            <div className="recovery-ring-wrap">
              <div className="recovery-ring">
                <svg viewBox="0 0 140 140">
                  <circle className="ring-bg" cx="70" cy="70" r="65" />
                  <circle className="ring-value" ref={recoveryRingRef} cx="70" cy="70" r="65" />
                </svg>
                <div className="recovery-number">
                  <span className="big" ref={recoveryNumRef}>0</span>
                  <span className="unit">/ 100</span>
                </div>
              </div>
            </div>
            <div className="recovery-status">Ready to train</div>
          </div>

          {/* 2: Weekly Strain */}
          <div className="bento-card card-strain">
            <div className="bento-label">Weekly Strain</div>
            <div className="strain-bars" ref={strainBarsRef}></div>
          </div>

          {/* 3: AI Insight */}
          <div className="bento-card card-insight">
            <div className="bento-label">AI Insight</div>
            <div className="insight-content">
              <div className="insight-icon">
                <svg viewBox="0 0 24 24"><path d="M12 2a4 4 0 0 1 4 4c0 1.95-1.4 3.58-3.25 3.93" /><circle cx="12" cy="10" r="1" /><path d="M12 14v3" /><path d="M9 21h6" /><path d="M8.56 13.44A7 7 0 0 0 5 19h14a7 7 0 0 0-3.56-5.56" /></svg>
              </div>
              <div className="insight-text" ref={insightTextRef}></div>
            </div>
          </div>

          {/* 4: Sleep Stages */}
          <div className="bento-card card-sleep">
            <div className="sleep-header">
              <div className="bento-label" style={{ margin: 0 }}>Sleep Quality</div>
              <div className="sleep-score">91</div>
            </div>
            <div className="sleep-chart-wrap" ref={sleepChartRef}></div>
            <div className="sleep-legend">
              <div className="sleep-legend-item"><span className="sleep-legend-dot" style={{ background: '#818cf8' }}></span>Deep</div>
              <div className="sleep-legend-item"><span className="sleep-legend-dot" style={{ background: '#a78bfa' }}></span>REM</div>
              <div className="sleep-legend-item"><span className="sleep-legend-dot" style={{ background: 'rgba(167,139,250,0.3)' }}></span>Light</div>
            </div>
          </div>

          {/* 5: HRV + Resting HR */}
          <div className="bento-card card-hrv">
            <div className="bento-label">Vitals</div>
            <div className="hrv-metrics">
              <div className="hrv-metric">
                <div>
                  <div className="hrv-metric-name">HRV</div>
                  <div className="hrv-delta up">+8% vs 30d avg</div>
                </div>
                <div className="hrv-metric-val">62<span className="hrv-metric-unit">ms</span></div>
              </div>
              <div className="hrv-metric">
                <div>
                  <div className="hrv-metric-name">Resting HR</div>
                  <div className="hrv-delta down">-2 bpm this week</div>
                </div>
                <div className="hrv-metric-val">54<span className="hrv-metric-unit">bpm</span></div>
              </div>
            </div>
          </div>

          {/* 6: Macros */}
          <div className="bento-card card-macros">
            <div className="bento-label">Today's Macros</div>
            <div className="macro-bars">
              <div className="macro-row">
                <div className="macro-header">
                  <span className="macro-name">Protein</span>
                  <span className="macro-val">168 / 185g</span>
                </div>
                <div className="macro-track">
                  <div className="macro-fill" ref={macroPRef} style={{ width: 0, background: 'var(--cyan)' }}></div>
                </div>
              </div>
              <div className="macro-row">
                <div className="macro-header">
                  <span className="macro-name">Carbs</span>
                  <span className="macro-val">210 / 280g</span>
                </div>
                <div className="macro-track">
                  <div className="macro-fill" ref={macroCRef} style={{ width: 0, background: 'var(--amber)' }}></div>
                </div>
              </div>
              <div className="macro-row">
                <div className="macro-header">
                  <span className="macro-name">Fat</span>
                  <span className="macro-val">72 / 85g</span>
                </div>
                <div className="macro-track">
                  <div className="macro-fill" ref={macroFRef} style={{ width: 0, background: 'var(--emerald)' }}></div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* FEATURES */}
      <section className="features-section">
        <div className="container">
          <div className="features-header reveal">
            <div className="section-tag">Capabilities</div>
            <h2 className="section-title">Build muscle. Lose fat.<br />Never plateau again.</h2>
            <p className="section-desc">Six integrated systems that tell you exactly what to eat, how to train, and when to recover — backed by your own data.</p>
          </div>
          <div className="features-grid reveal">
            <div className="feature-cell">
              <div className="feature-icon" style={{ background: 'rgba(6,182,212,0.08)' }}>
                <svg viewBox="0 0 24 24" stroke="var(--cyan)"><path d="M12 2a4 4 0 0 1 4 4c0 1.95-1.4 3.58-3.25 3.93" /><circle cx="12" cy="10" r="1" /><path d="M12 14v3" /><path d="M9 21h6" /><path d="M8.56 13.44A7 7 0 0 0 5 19h14a7 7 0 0 0-3.56-5.56" /></svg>
              </div>
              <h3>AI Root Cause Analysis</h3>
              <p>Claude finds why your lifts stalled or your cut plateaued — actual reasoning across training, sleep, and diet.</p>
            </div>
            <div className="feature-cell">
              <div className="feature-icon" style={{ background: 'rgba(16,185,129,0.08)' }}>
                <svg viewBox="0 0 24 24" stroke="var(--emerald)"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
              </div>
              <h3>Oura Ring Integration</h3>
              <p>Sleep stages, HRV, readiness, and activity pull in automatically. Your ring logs recovery while you sleep.</p>
            </div>
            <div className="feature-cell">
              <div className="feature-icon" style={{ background: 'rgba(167,139,250,0.08)' }}>
                <svg viewBox="0 0 24 24" stroke="var(--purple)"><path d="M3 3v18h18" /><path d="M7 16l4-8 4 4 4-6" /></svg>
              </div>
              <h3>12 Analytics Charts</h3>
              <p>Lift progression, sleep architecture, macro adherence, volume load — every metric that matters for body recomposition.</p>
            </div>
            <div className="feature-cell">
              <div className="feature-icon" style={{ background: 'rgba(245,158,11,0.08)' }}>
                <svg viewBox="0 0 24 24" stroke="var(--amber)"><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8" /><path d="M12 17v4" /><path d="M7 12l3-3 2 2 5-5" /></svg>
              </div>
              <h3>Body Comp Simulator</h3>
              <p>Drag sliders to see how deficit, protein, and training frequency shift your lean mass vs fat over weeks.</p>
            </div>
            <div className="feature-cell">
              <div className="feature-icon" style={{ background: 'rgba(239,68,68,0.08)' }}>
                <svg viewBox="0 0 24 24" stroke="var(--red)"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
              </div>
              <h3>Anomaly Detection</h3>
              <p>Z-score analysis catches unusual dips in sleep, HRV, or output before they derail your progress.</p>
            </div>
            <div className="feature-cell">
              <div className="feature-icon" style={{ background: 'rgba(240,240,242,0.05)' }}>
                <svg viewBox="0 0 24 24" stroke="var(--text-2)"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M3 9h18" /><path d="M12 18v-6" /><path d="M8 18v-2" /><path d="M16 18v-4" /></svg>
              </div>
              <h3>PWA &amp; Offline</h3>
              <p>Install on your phone like a native app. Log sets at the gym with zero signal — syncs when you're back.</p>
            </div>
          </div>
        </div>
      </section>

      {/* STATS BAR */}
      <section className="stats-bar">
        <div className="container">
          <div className="stats-grid reveal">
            <div>
              <div className="stat-num">12</div>
              <div className="stat-desc">Purpose-Built Charts</div>
            </div>
            <div>
              <div className="stat-num">90+</div>
              <div className="stat-desc">Days of Demo Data</div>
            </div>
            <div>
              <div className="stat-num">4</div>
              <div className="stat-desc">Integrated Data Sources</div>
            </div>
            <div>
              <div className="stat-num">24/7</div>
              <div className="stat-desc">Offline-First PWA</div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="how-section">
        <div className="container">
          <div className="reveal" style={{ textAlign: 'center' }}>
            <div className="section-tag">How It Works</div>
            <h2 className="section-title">Three steps. Zero complexity.</h2>
          </div>
          <div className="how-grid reveal">
            <div className="how-step">
              <div className="how-num">1</div>
              <h3>Connect your ring</h3>
              <p>Link Oura in two minutes. Sleep, HRV, and readiness start syncing immediately.</p>
            </div>
            <div className="how-step">
              <div className="how-num">2</div>
              <h3>Train &amp; eat</h3>
              <p>Log your lifts, track your meals. The app handles progressive overload math and macro totals.</p>
            </div>
            <div className="how-step">
              <div className="how-num">3</div>
              <h3>Get smarter</h3>
              <p>AI connects the dots — why your squat jumped 10lbs, why your cut stalled, what to change next.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="container reveal">
          <h2 className="cta-title">Your next PR starts here.</h2>
          <p className="cta-sub">See how AI connects your training, sleep, and nutrition into one clear picture.</p>
          <Link to="/demo" className="btn btn--cyan btn--large">Try the Demo</Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="container">
          <Link to="/landing" className="footer-brand">
            <div className="footer-mark">
              <svg width="12" height="11" viewBox="0 0 20 18" fill="none">
                <path d="M8.5 2C5.5 2 3 4.5 3 7.5V10.5C3 13.5 5.5 16 8.5 16" stroke="#08080c" strokeWidth="2.5" strokeLinecap="round"/>
                <path d="M12 2V16M12 2H17M12 9H16" stroke="#08080c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="footer-name">Claude-Fit</span>
          </Link>
          <div className="footer-meta">Built with Claude AI &middot; &copy; 2026</div>
        </div>
      </footer>
    </div>
  );
}
