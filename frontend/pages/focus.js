/**
 * Focus Mode Page
 * Pomodoro timer, deep work tracking, session history
 */

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { RiTimerLine, RiPlayLine, RiPauseLine, RiStopLine, RiCheckLine, RiHistoryLine } from 'react-icons/ri';
import DashboardLayout from '../components/layout/DashboardLayout';
import { focusAPI } from '../lib/api';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

const TIMER_PRESETS = [
  { label: 'Pomodoro', duration: 25, type: 'pomodoro', color: '#6366f1' },
  { label: 'Short Break', duration: 5, type: 'short_break', color: '#10b981' },
  { label: 'Long Break', duration: 15, type: 'long_break', color: '#06b6d4' },
  { label: 'Deep Work', duration: 90, type: 'deep_work', color: '#a855f7' },
];

export default function FocusPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [selectedPreset, setSelectedPreset] = useState(TIMER_PRESETS[0]);
  const [timeLeft, setTimeLeft] = useState(TIMER_PRESETS[0].duration * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [activeSession, setActiveSession] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState(null);
  const [task, setTask] = useState('');
  const [showRating, setShowRating] = useState(false);
  const [rating, setRating] = useState(0);
  const [completedSessionId, setCompletedSessionId] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    fetchData();
  }, [isAuthenticated]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            setIsRunning(false);
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

  const fetchData = async () => {
    try {
      const [sessionsRes, statsRes, activeRes] = await Promise.all([
        focusAPI.getSessions({ limit: 10 }),
        focusAPI.getStats(),
        focusAPI.getActive(),
      ]);
      setSessions(sessionsRes.data.data || []);
      setStats(statsRes.data.data);
      if (activeRes.data.data) {
        setActiveSession(activeRes.data.data);
        setIsRunning(true);
        // Calculate remaining time
        const elapsed = Math.round((Date.now() - new Date(activeRes.data.data.startTime)) / 1000);
        const remaining = activeRes.data.data.plannedDuration * 60 - elapsed;
        setTimeLeft(Math.max(0, remaining));
      }
    } catch (_) {}
  };

  const handleStart = async () => {
    if (activeSession) { setIsRunning(true); return; }
    try {
      const { data } = await focusAPI.start({
        type: selectedPreset.type,
        plannedDuration: selectedPreset.duration,
        task,
      });
      setActiveSession(data.data);
      setIsRunning(true);
      toast.success(`${selectedPreset.label} session started! 🎯`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to start session');
    }
  };

  const handlePause = () => setIsRunning(false);

  const handleTimerComplete = () => {
    if (activeSession) {
      setCompletedSessionId(activeSession._id);
      setShowRating(true);
      toast.success('Session complete! Rate your focus quality 🎉', { duration: 5000 });
    }
  };

  const handleComplete = async () => {
    const sessionId = completedSessionId || activeSession?._id;
    if (!sessionId) return;
    try {
      await focusAPI.complete(sessionId, { focusQuality: rating || null });
      setActiveSession(null);
      setIsRunning(false);
      setTimeLeft(selectedPreset.duration * 60);
      setShowRating(false);
      setCompletedSessionId(null);
      setRating(0);
      await fetchData();
      toast.success('Session saved! Great work 💪');
    } catch (err) {
      toast.error('Failed to complete session');
    }
  };

  const handleAbandon = async () => {
    if (!activeSession) return;
    try {
      await focusAPI.abandon(activeSession._id);
      setActiveSession(null);
      setIsRunning(false);
      setTimeLeft(selectedPreset.duration * 60);
      await fetchData();
      toast('Session abandoned', { icon: '⚠️' });
    } catch (_) {}
  };

  const selectPreset = (preset) => {
    if (activeSession) return;
    setSelectedPreset(preset);
    setTimeLeft(preset.duration * 60);
    setIsRunning(false);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const progress = 1 - timeLeft / (selectedPreset.duration * 60);
  const circumference = 2 * Math.PI * 90;

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <RiTimerLine className="text-primary-400" /> Focus Mode
        </h1>
        <p className="text-gray-400 text-sm mt-1">Deep work sessions with Pomodoro technique</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Timer ─────────────────────────────────────────────────────────── */}
        <div className="lg:col-span-2 glass-card p-8 flex flex-col items-center">
          {/* Preset selector */}
          <div className="flex gap-2 mb-8 flex-wrap justify-center">
            {TIMER_PRESETS.map((preset) => (
              <button
                key={preset.type}
                onClick={() => selectPreset(preset)}
                disabled={!!activeSession}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${selectedPreset.type === preset.type ? 'text-white' : 'text-gray-400 hover:text-white'}`}
                style={selectedPreset.type === preset.type
                  ? { background: `${preset.color}20`, border: `1px solid ${preset.color}40`, color: preset.color }
                  : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Circular timer */}
          <div className="relative w-56 h-56 mb-8">
            <svg className="w-56 h-56 -rotate-90" viewBox="0 0 200 200">
              <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
              <circle
                cx="100" cy="100" r="90" fill="none"
                stroke={selectedPreset.color}
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={circumference * (1 - progress)}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 1s linear', filter: `drop-shadow(0 0 8px ${selectedPreset.color})` }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-black text-white font-mono">{formatTime(timeLeft)}</span>
              <span className="text-gray-400 text-sm mt-1">{selectedPreset.label}</span>
              {activeSession?.task && (
                <span className="text-xs text-gray-500 mt-1 max-w-32 text-center truncate">{activeSession.task}</span>
              )}
            </div>
          </div>

          {/* Task input */}
          {!activeSession && (
            <input
              type="text"
              value={task}
              onChange={(e) => setTask(e.target.value)}
              placeholder="What are you working on? (optional)"
              className="input-field w-full max-w-sm mb-6 text-center text-sm"
            />
          )}

          {/* Controls */}
          <div className="flex items-center gap-4">
            {!isRunning ? (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleStart}
                className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl"
                style={{ background: `linear-gradient(135deg, ${selectedPreset.color}, ${selectedPreset.color}99)`, boxShadow: `0 0 20px ${selectedPreset.color}40` }}
              >
                <RiPlayLine />
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handlePause}
                className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl"
                style={{ background: 'rgba(255,255,255,0.1)', border: '2px solid rgba(255,255,255,0.2)' }}
              >
                <RiPauseLine />
              </motion.button>
            )}

            {activeSession && (
              <>
                <button onClick={handleComplete}
                  className="w-12 h-12 rounded-full flex items-center justify-center text-green-400 transition-colors"
                  style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
                  <RiCheckLine size={18} />
                </button>
                <button onClick={handleAbandon}
                  className="w-12 h-12 rounded-full flex items-center justify-center text-red-400 transition-colors"
                  style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                  <RiStopLine size={18} />
                </button>
              </>
            )}
          </div>

          {/* Rating modal */}
          <AnimatePresence>
            {showRating && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-6 p-4 rounded-xl w-full max-w-sm text-center"
                style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}
              >
                <p className="text-white font-medium mb-3">Rate your focus quality</p>
                <div className="flex justify-center gap-2 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button key={star} onClick={() => setRating(star)}
                      className={`text-2xl transition-transform hover:scale-110 ${star <= rating ? 'text-yellow-400' : 'text-gray-600'}`}>
                      ⭐
                    </button>
                  ))}
                </div>
                <button onClick={handleComplete} className="btn-primary text-sm px-6 py-2">
                  Save Session
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Stats ─────────────────────────────────────────────────────────── */}
        <div className="space-y-4">
          {stats && (
            <>
              {[
                { label: 'Sessions (30d)', value: stats.completedSessions, icon: '✅' },
                { label: 'Total Focus Time', value: `${Math.round(stats.totalMinutes / 60)}h`, icon: '⏱️' },
                { label: 'Avg Duration', value: `${stats.avgDuration}m`, icon: '📊' },
                { label: 'Completion Rate', value: `${stats.completionRate}%`, icon: '🎯' },
              ].map((s) => (
                <div key={s.label} className="glass-card p-4 flex items-center gap-3">
                  <span className="text-2xl">{s.icon}</span>
                  <div>
                    <p className="text-gray-400 text-xs">{s.label}</p>
                    <p className="text-white font-bold text-lg">{s.value}</p>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      {/* ── Session History ──────────────────────────────────────────────────── */}
      <div className="glass-card p-6">
        <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
          <RiHistoryLine /> Recent Sessions
        </h3>
        <div className="space-y-2">
          {sessions.length > 0 ? sessions.map((session) => (
            <div key={session._id} className="flex items-center justify-between p-3 rounded-xl"
              style={{ background: 'rgba(255,255,255,0.03)' }}>
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${session.status === 'completed' ? 'bg-green-400' : 'bg-red-400'}`} />
                <div>
                  <p className="text-white text-sm font-medium capitalize">{session.type.replace('_', ' ')}</p>
                  {session.task && <p className="text-gray-500 text-xs">{session.task}</p>}
                </div>
              </div>
              <div className="text-right">
                <p className="text-gray-300 text-sm">{session.actualDuration}m</p>
                <p className="text-gray-500 text-xs">{new Date(session.startTime).toLocaleDateString()}</p>
              </div>
            </div>
          )) : (
            <p className="text-gray-500 text-center py-6 text-sm">No sessions yet. Start your first focus session!</p>
          )}
        </div>
      </div>
    </div>
  );
}

FocusPage.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;
