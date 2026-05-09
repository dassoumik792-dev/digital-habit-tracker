/**
 * AI Insights Page
 * AI-powered analysis, weekly reports, and addiction score
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { RiBrainLine, RiRefreshLine, RiSendLine, RiFileTextLine, RiSparklingLine, RiAlertLine } from 'react-icons/ri';
import DashboardLayout from '../components/layout/DashboardLayout';
import { aiAPI } from '../lib/api';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

const insightTypeStyles = {
  positive: { bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)', color: '#10b981' },
  warning: { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)', color: '#f59e0b' },
  neutral: { bg: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.2)', color: '#6366f1' },
  achievement: { bg: 'rgba(168,85,247,0.1)', border: 'rgba(168,85,247,0.2)', color: '#a855f7' },
};

const riskLevelStyles = {
  low: { color: '#10b981', label: 'Low Risk', bg: 'rgba(16,185,129,0.1)' },
  moderate: { color: '#f59e0b', label: 'Moderate Risk', bg: 'rgba(245,158,11,0.1)' },
  high: { color: '#ef4444', label: 'High Risk', bg: 'rgba(239,68,68,0.1)' },
  critical: { color: '#dc2626', label: 'Critical Risk', bg: 'rgba(220,38,38,0.1)' },
};

export default function AIInsightsPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [insights, setInsights] = useState([]);
  const [report, setReport] = useState(null);
  const [addictionScore, setAddictionScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('insights');

  useEffect(() => {
    if (!isAuthenticated) { router.push('/login'); return; }
    fetchData();
  }, [isAuthenticated]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [insightsRes, scoreRes] = await Promise.all([
        aiAPI.getInsights(),
        aiAPI.getAddictionScore(),
      ]);
      setInsights(insightsRes.data.data.insights || []);
      setAddictionScore(scoreRes.data.data);
    } catch (err) {
      toast.error('Failed to load AI insights');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    setGeneratingReport(true);
    try {
      const { data } = await aiAPI.generateWeeklyReport();
      setReport(data.data);
      toast.success('Weekly AI report generated!');
    } catch (err) {
      toast.error('Failed to generate report');
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleChat = async (e) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;

    const userMsg = chatMessage;
    setChatMessage('');
    setChatHistory((prev) => [...prev, { role: 'user', content: userMsg }]);
    setChatLoading(true);

    try {
      const { data } = await aiAPI.chat(userMsg);
      setChatHistory((prev) => [...prev, { role: 'ai', content: data.data.reply }]);
    } catch (err) {
      setChatHistory((prev) => [...prev, { role: 'ai', content: 'Sorry, I\'m having trouble connecting right now. Please try again.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const riskStyle = addictionScore ? riskLevelStyles[addictionScore.level] : riskLevelStyles.low;

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <RiBrainLine className="text-primary-400" /> AI Insights
          </h1>
          <p className="text-gray-400 text-sm mt-1">Powered by GPT-4 — personalized digital wellness analysis</p>
        </div>
        <button onClick={fetchData} className="p-2 rounded-xl text-gray-400 hover:text-white transition-colors"
          style={{ background: 'rgba(255,255,255,0.05)' }}>
          <RiRefreshLine size={16} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {['insights', 'report', 'chat'].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ${activeTab === tab ? 'text-white' : 'text-gray-400 hover:text-white'}`}
            style={activeTab === tab ? { background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(168,85,247,0.1))', border: '1px solid rgba(99,102,241,0.3)' } : { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
            {tab === 'insights' ? '🧠 Insights' : tab === 'report' ? '📊 Weekly Report' : '💬 AI Chat'}
          </button>
        ))}
      </div>

      {/* ── Insights Tab ──────────────────────────────────────────────────── */}
      {activeTab === 'insights' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          {/* Addiction Risk Score */}
          {addictionScore && (
            <div className="glass-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <RiAlertLine size={20} style={{ color: riskStyle.color }} />
                <h3 className="text-white font-semibold">Digital Addiction Risk Score</h3>
              </div>
              <div className="flex items-center gap-6">
                <div className="relative w-24 h-24 flex-shrink-0">
                  <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
                    <circle cx="50" cy="50" r="40" fill="none" stroke={riskStyle.color} strokeWidth="8"
                      strokeDasharray={`${addictionScore.score * 2.51} 251`} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-black text-white">{addictionScore.score}</span>
                    <span className="text-xs text-gray-400">/100</span>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium mb-3"
                    style={{ background: riskStyle.bg, color: riskStyle.color, border: `1px solid ${riskStyle.color}30` }}>
                    {riskStyle.label}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(addictionScore.breakdown || {}).map(([key, val]) => (
                      <div key={key} className="text-xs">
                        <span className="text-gray-400 capitalize">{key.replace('Score', '')}: </span>
                        <span className="text-white font-medium">{Math.round(val)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* AI Insights */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loading ? (
              [1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-32 rounded-2xl" />)
            ) : insights.length > 0 ? (
              insights.map((insight, i) => {
                const style = insightTypeStyles[insight.type] || insightTypeStyles.neutral;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="p-5 rounded-2xl"
                    style={{ background: style.bg, border: `1px solid ${style.border}` }}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl">{insight.icon || '💡'}</span>
                      <div>
                        <h4 className="font-semibold text-white mb-1">{insight.title}</h4>
                        <p className="text-gray-300 text-sm leading-relaxed">{insight.description}</p>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="col-span-2 text-center py-12 text-gray-500">
                <RiBrainLine size={40} className="mx-auto mb-3 opacity-30" />
                <p>No insights yet. Seed demo data to see AI analysis.</p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* ── Report Tab ────────────────────────────────────────────────────── */}
      {activeTab === 'report' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <RiFileTextLine /> Weekly AI Report
              </h3>
              <button
                onClick={handleGenerateReport}
                disabled={generatingReport}
                className="btn-primary flex items-center gap-2 text-sm py-2 px-4"
              >
                {generatingReport ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <RiSparklingLine size={14} />
                )}
                {generatingReport ? 'Generating...' : 'Generate Report'}
              </button>
            </div>

            {report ? (
              <div className="space-y-6">
                {/* Summary */}
                <div className="p-4 rounded-xl" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}>
                  <p className="text-gray-200 leading-relaxed">{report.summary}</p>
                </div>

                {/* Scores */}
                {report.scores && (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {Object.entries(report.scores).map(([key, val]) => (
                      <div key={key} className="text-center p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)' }}>
                        <div className="text-2xl font-black gradient-text">{Math.round(val)}</div>
                        <div className="text-xs text-gray-400 mt-1 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Recommendations */}
                {report.recommendations?.length > 0 && (
                  <div>
                    <h4 className="text-white font-semibold mb-3">Recommendations</h4>
                    <div className="space-y-3">
                      {report.recommendations.map((rec, i) => (
                        <div key={i} className="p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                          <div className="flex items-center gap-2 mb-2">
                            <span className={`badge ${rec.priority === 'high' ? 'badge-danger' : rec.priority === 'medium' ? 'badge-warning' : 'badge-info'}`}>
                              {rec.priority}
                            </span>
                            <span className="text-white font-medium text-sm">{rec.title}</span>
                          </div>
                          <p className="text-gray-400 text-sm">{rec.description}</p>
                          {rec.actionItems?.length > 0 && (
                            <ul className="mt-2 space-y-1">
                              {rec.actionItems.map((item, j) => (
                                <li key={j} className="text-gray-400 text-xs flex items-center gap-2">
                                  <span className="w-1.5 h-1.5 rounded-full bg-primary-400 flex-shrink-0" />
                                  {item}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <RiSparklingLine size={40} className="mx-auto mb-3 opacity-30" />
                <p>Click "Generate Report" to get your AI-powered weekly analysis</p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* ── Chat Tab ──────────────────────────────────────────────────────── */}
      {activeTab === 'chat' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="glass-card p-6 flex flex-col" style={{ minHeight: '500px' }}>
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <RiBrainLine /> Chat with FocusPulse AI
            </h3>

            {/* Chat messages */}
            <div className="flex-1 space-y-4 overflow-y-auto mb-4 max-h-96 no-scrollbar">
              {chatHistory.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <RiBrainLine size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Ask me anything about your digital habits and productivity!</p>
                  <div className="flex flex-wrap gap-2 justify-center mt-4">
                    {['How can I improve my focus?', 'What are my worst habits?', 'Give me a productivity plan'].map((q) => (
                      <button key={q} onClick={() => setChatMessage(q)}
                        className="text-xs px-3 py-1.5 rounded-full text-primary-400 transition-colors"
                        style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {chatHistory.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs md:max-w-md px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'text-white rounded-br-sm'
                      : 'text-gray-200 rounded-bl-sm'
                  }`}
                    style={msg.role === 'user'
                      ? { background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }
                      : { background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    {msg.role === 'ai' && <span className="text-primary-400 font-medium text-xs block mb-1">FocusPulse AI</span>}
                    {msg.content}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="px-4 py-3 rounded-2xl rounded-bl-sm" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <div key={i} className="w-2 h-2 rounded-full bg-primary-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <form onSubmit={handleChat} className="flex gap-3">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Ask about your habits, productivity, or wellness..."
                className="input-field flex-1"
              />
              <button type="submit" disabled={chatLoading || !chatMessage.trim()}
                className="btn-primary px-4 py-3 flex items-center gap-2 disabled:opacity-50">
                <RiSendLine size={16} />
              </button>
            </form>
          </div>
        </motion.div>
      )}
    </div>
  );
}

AIInsightsPage.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;
