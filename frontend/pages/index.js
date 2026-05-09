/**
 * Landing Page
 * Hero, features, and CTA sections
 */

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  RiFlashlightLine, RiBrainLine, RiBarChartLine, RiTimerLine,
  RiArrowRightLine, RiCheckLine, RiStarLine, RiAlertLine,
} from 'react-icons/ri';
import useAuthStore from '../store/authStore';

const features = [
  { icon: RiBarChartLine, title: 'Advanced Analytics', desc: 'Deep insights into your screen time, productivity trends, and behavioral patterns with beautiful visualizations.', color: '#6366f1' },
  { icon: RiBrainLine, title: 'AI-Powered Insights', desc: 'GPT-4 analyzes your habits and generates personalized recommendations to improve your digital wellness.', color: '#a855f7' },
  { icon: RiTimerLine, title: 'Focus Mode', desc: 'Pomodoro timer with deep work tracking, session analytics, and distraction monitoring.', color: '#06b6d4' },
  { icon: RiAlertLine, title: 'Addiction Risk Score', desc: 'AI-computed digital addiction risk assessment with actionable steps to improve your score.', color: '#10b981' },
  { icon: RiFlashlightLine, title: 'Streak Tracking', desc: 'Gamified habit building with streaks, badges, achievements, and a productivity leaderboard.', color: '#f59e0b' },
  { icon: RiStarLine, title: 'Weekly AI Reports', desc: 'Comprehensive weekly reports with trend analysis, predictions, and personalized action plans.', color: '#ec4899' },
];

const stats = [
  { value: '10K+', label: 'Active Users' },
  { value: '2.4M', label: 'Hours Tracked' },
  { value: '94%', label: 'Improvement Rate' },
  { value: '4.9★', label: 'User Rating' },
];

export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) router.push('/dashboard');
  }, [isAuthenticated]);

  return (
    <div className="min-h-screen" style={{ background: '#0d0d1a' }}>
      {/* ── Navbar ──────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4"
        style={{ background: 'rgba(13,13,26,0.8)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}>
            <RiFlashlightLine className="text-white" />
          </div>
          <span className="font-bold text-white">FocusPulse AI</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <button className="px-4 py-2 text-sm text-gray-300 hover:text-white transition-colors">Sign In</button>
          </Link>
          <Link href="/register">
            <button className="btn-primary text-sm px-5 py-2">Get Started Free</button>
          </Link>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full opacity-20"
            style={{ background: 'radial-gradient(ellipse, #6366f1 0%, transparent 70%)', filter: 'blur(60px)' }} />
        </div>

        <div className="max-w-5xl mx-auto text-center relative">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm mb-6"
              style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#a5b4fc' }}>
              <RiBrainLine size={14} />
              AI-Powered Digital Wellness Platform
            </div>

            <h1 className="text-5xl md:text-7xl font-black text-white mb-6 leading-tight">
              Master Your{' '}
              <span className="gradient-text">Digital Habits</span>
              <br />with AI Intelligence
            </h1>

            <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
              Track screen time, analyze behavioral patterns, and get AI-powered insights to transform your digital life. Built for the modern productivity-focused individual.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="btn-primary flex items-center gap-2 text-base px-8 py-4"
                >
                  Start Free Today
                  <RiArrowRightLine />
                </motion.button>
              </Link>
              <Link href="/login">
                <button className="btn-secondary flex items-center gap-2 text-base px-8 py-4">
                  Sign In
                </button>
              </Link>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20"
          >
            {stats.map((stat) => (
              <div key={stat.label} className="glass-card p-5 text-center">
                <div className="text-3xl font-black gradient-text mb-1">{stat.value}</div>
                <div className="text-sm text-gray-400">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Features ────────────────────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-black text-white mb-4">
              Everything You Need to{' '}
              <span className="gradient-text">Thrive Digitally</span>
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              A complete digital wellness ecosystem powered by cutting-edge AI
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-card-hover p-6"
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: `${feature.color}20`, border: `1px solid ${feature.color}30` }}>
                  <feature.icon size={22} style={{ color: feature.color }} />
                </div>
                <h3 className="text-white font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI Insights Preview ──────────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-card p-8 text-center"
            style={{ border: '1px solid rgba(99,102,241,0.2)' }}
          >
            <RiBrainLine className="text-5xl mx-auto mb-4" style={{ color: '#6366f1' }} />
            <h2 className="text-3xl font-black text-white mb-4">AI Insights Examples</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 text-left">
              {[
                { icon: '📈', text: '"Your productivity increases when screen time after 10 PM decreases."' },
                { icon: '📱', text: '"Instagram usage spikes during your study hours — 3x more than average."' },
                { icon: '🎯', text: '"You improved focus by 22% this week. Keep up the momentum!"' },
                { icon: '🌙', text: '"Late-night scrolling is affecting your productivity score by -15 points."' },
              ].map((insight, i) => (
                <div key={i} className="flex items-start gap-3 p-4 rounded-xl"
                  style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}>
                  <span className="text-2xl">{insight.icon}</span>
                  <p className="text-gray-300 text-sm italic">{insight.text}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="glass-card p-12"
            style={{ border: '1px solid rgba(99,102,241,0.2)' }}
          >
            <h2 className="text-4xl font-black text-white mb-4">
              Ready to Transform Your{' '}
              <span className="gradient-text">Digital Life?</span>
            </h2>
            <p className="text-gray-400 mb-8">Join thousands of users who have improved their focus and productivity with FocusPulse AI.</p>
            <Link href="/register">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="btn-primary text-lg px-10 py-4 flex items-center gap-2 mx-auto"
              >
                Get Started — It's Free
                <RiArrowRightLine />
              </motion.button>
            </Link>
            <p className="text-gray-500 text-sm mt-4">No credit card required • Free forever plan</p>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="py-8 px-6 border-t border-white/5 text-center text-gray-500 text-sm">
        <p>© 2024 FocusPulse AI. Built with ❤️ for digital wellness.</p>
      </footer>
    </div>
  );
}
