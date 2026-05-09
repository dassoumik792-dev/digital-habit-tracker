/**
 * Axios API Client — Supabase Edition
 *
 * Attaches the Supabase access_token to every backend request.
 * The backend verifies it using supabase.auth.getUser(token).
 */

import axios from 'axios';
import { supabase } from './supabase';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Attach Supabase token to every request ────────────────────────────────────
api.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// ── Handle 401 — refresh session ──────────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const { data: { session } } = await supabase.auth.refreshSession();
      if (session) {
        error.config.headers.Authorization = `Bearer ${session.access_token}`;
        return api(error.config);
      }
      // Session expired — redirect to login
      if (typeof window !== 'undefined') window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ── Auth API ──────────────────────────────────────────────────────────────────
// updatePassword is handled directly via supabase.auth.updateUser() on the frontend
// getById is removed — use getAll with date filter instead
export const authAPI = {
  getMe:          () => api.get('/auth/me'),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
};

// ── Habit API ─────────────────────────────────────────────────────────────────
export const habitAPI = {
  getToday:         () => api.get('/habits/today'),
  getAll:           (params) => api.get('/habits', { params }),
  create:           (data) => api.post('/habits', data),
  update:           (id, data) => api.put(`/habits/${id}`, data),
  delete:           (id) => api.delete(`/habits/${id}`),
  seedDemo:         () => api.post('/habits/seed-demo'),
  getWeeklySummary: () => api.get('/habits/weekly-summary'),
};

// ── Analytics API ─────────────────────────────────────────────────────────────
export const analyticsAPI = {
  getOverview:         () => api.get('/analytics/overview'),
  getWeekly:           (params) => api.get('/analytics/weekly', { params }),
  getMonthly:          (params) => api.get('/analytics/monthly', { params }),
  getHeatmap:          () => api.get('/analytics/heatmap'),
  getAppUsage:         (days) => api.get('/analytics/app-usage', { params: { days } }),
  getProductivityTrend: (days) => api.get('/analytics/productivity-trend', { params: { days } }),
  getHourlyPattern:    (days) => api.get('/analytics/hourly-pattern', { params: { days } }),
};

// ── AI API ────────────────────────────────────────────────────────────────────
export const aiAPI = {
  getInsights:         () => api.get('/ai/insights'),
  generateWeeklyReport: (force) => api.post('/ai/weekly-report', {}, { params: { force } }),
  getReports:          () => api.get('/ai/reports'),
  getAddictionScore:   () => api.get('/ai/addiction-score'),
  chat:                (message) => api.post('/ai/chat', { message }),
};

// ── Goal API ──────────────────────────────────────────────────────────────────
export const goalAPI = {
  getAll:          (params) => api.get('/goals', { params }),
  getById:         (id) => api.get(`/goals/${id}`),
  create:          (data) => api.post('/goals', data),
  update:          (id, data) => api.put(`/goals/${id}`, data),
  delete:          (id) => api.delete(`/goals/${id}`),
  checkProgress:   (id) => api.post(`/goals/${id}/check-progress`),
  getSummary:      () => api.get('/goals/summary'),
};

// ── Focus API ─────────────────────────────────────────────────────────────────
export const focusAPI = {
  getSessions:  (params) => api.get('/focus/sessions', { params }),
  getActive:    () => api.get('/focus/active'),
  getStats:     () => api.get('/focus/stats'),
  start:        (data) => api.post('/focus/start', data),
  complete:     (id, data) => api.put(`/focus/${id}/complete`, data),
  abandon:      (id) => api.put(`/focus/${id}/abandon`),
};

// ── Notification API ──────────────────────────────────────────────────────────
export const notificationAPI = {
  getAll:       (params) => api.get('/notifications', { params }),
  markRead:     (id) => api.put(`/notifications/${id}/read`),
  markAllRead:  () => api.put('/notifications/mark-all-read'),
  delete:       (id) => api.delete(`/notifications/${id}`),
  clearAll:     () => api.delete('/notifications/clear-all'),
};

// ── User API ──────────────────────────────────────────────────────────────────
export const userAPI = {
  getProfile:      () => api.get('/users/profile'),
  updateProfile:   (data) => api.put('/users/profile', data),
  updateSettings:  (data) => api.put('/users/settings', data),
  getStats:        () => api.get('/users/stats'),
  getLeaderboard:  () => api.get('/users/leaderboard'),
};

// ── Admin API ─────────────────────────────────────────────────────────────────
export const adminAPI = {
  getStats:          () => api.get('/admin/stats'),
  getUsers:          (params) => api.get('/admin/users', { params }),
  getUserGrowth:     (days) => api.get('/admin/user-growth', { params: { days } }),
  getActivityReport: (days) => api.get('/admin/activity-report', { params: { days } }),
  toggleUserStatus:  (id) => api.put(`/admin/users/${id}/toggle-status`),
};

// ── Report API ────────────────────────────────────────────────────────────────
export const reportAPI = {
  getFull: (params) => api.get('/reports/full', { params }),
};

export default api;
