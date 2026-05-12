/**
 * Dashboard Layout
 * Main app shell with sidebar navigation and top bar
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RiDashboardLine, RiBarChartLine, RiBrainLine, RiTimerLine,
  RiFocusLine, RiBellLine, RiSettingsLine, RiUserLine,
  RiAdminLine, RiMenuLine, RiCloseLine, RiLogoutBoxLine,
  RiFlashlightLine,
} from 'react-icons/ri';
import useAuthStore from '../../store/authStore';
import { notificationAPI } from '../../lib/api';
import LogoutButton from '../auth/LogoutButton';

const navItems = [
  { href: '/dashboard',     icon: RiDashboardLine, label: 'Dashboard' },
  { href: '/analytics',     icon: RiBarChartLine,  label: 'Analytics' },
  { href: '/ai-insights',   icon: RiBrainLine,     label: 'AI Insights' },
  { href: '/focus',         icon: RiTimerLine,     label: 'Focus Mode' },
  { href: '/goals',         icon: RiFocusLine,     label: 'Habit Goals' },
  { href: '/notifications', icon: RiBellLine,      label: 'Notifications', badge: true },
  { href: '/profile',       icon: RiUserLine,      label: 'Profile' },
  { href: '/settings',      icon: RiSettingsLine,  label: 'Settings' },
];

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const { user, logout, isLoading } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const { data } = await notificationAPI.getAll({ unreadOnly: true, limit: 1 });
      setUnreadCount(data.unreadCount || 0);
    } catch (_) {}
  };

  const handleLogout = async () => {
    const confirmed = window.confirm('Are you sure you want to sign out?');
    if (!confirmed) return;
    
    setIsLoggingOut(true);
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Still redirect even if there's an error
      router.push('/login');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const isActive = (href) => router.pathname === href || router.pathname.startsWith(href + '/');

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#0d0d1a' }}>
      {/* ── Mobile overlay ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <motion.aside
        initial={false}
        animate={{ x: sidebarOpen ? 0 : '-100%' }}
        className="fixed inset-y-0 left-0 z-30 w-64 lg:relative lg:translate-x-0 lg:flex flex-col"
        style={{
          background: 'rgba(13, 13, 26, 0.95)',
          borderRight: '1px solid rgba(255,255,255,0.06)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-white/5">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}>
            <RiFlashlightLine className="text-white text-lg" />
          </div>
          <div>
            <h1 className="font-bold text-white text-sm">FocusPulse</h1>
            <p className="text-xs text-primary-400">AI Wellness</p>
          </div>
          <button
            className="ml-auto lg:hidden text-gray-400 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <RiCloseLine size={20} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto no-scrollbar">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <div className={`nav-item ${isActive(item.href) ? 'active' : ''}`}>
                <item.icon size={18} />
                <span className="text-sm font-medium">{item.label}</span>
                {item.badge && unreadCount > 0 && (
                  <span className="ml-auto text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)', color: 'white' }}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </div>
            </Link>
          ))}

          {/* Admin link */}
          {user?.role === 'admin' && (
            <Link href="/admin">
              <div className={`nav-item ${isActive('/admin') ? 'active' : ''}`}>
                <RiAdminLine size={18} />
                <span className="text-sm font-medium">Admin Panel</span>
                <span className="ml-auto badge-warning text-xs px-1.5 py-0.5 rounded">Admin</span>
              </div>
            </Link>
          )}
        </nav>

        {/* User section */}
        <div className="px-3 py-4 border-t border-white/5">
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl"
            style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}>
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white text-sm font-bold">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.name || 'User'}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
            <LogoutButton 
              variant="compact" 
              showText={false}
              className="w-8 h-8"
            />
          </div>
        </div>
      </motion.aside>

      {/* ── Main content ─────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex items-center gap-4 px-6 py-4 border-b border-white/5"
          style={{ background: 'rgba(13,13,26,0.8)', backdropFilter: 'blur(20px)' }}>
          <button
            className="lg:hidden text-gray-400 hover:text-white transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <RiMenuLine size={22} />
          </button>

          {/* Page title */}
          <div className="flex-1">
            <h2 className="text-white font-semibold capitalize">
              {router.pathname.split('/')[1]?.replace('-', ' ') || 'Dashboard'}
            </h2>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            {/* Streak badge */}
            {user?.streak?.current > 0 && (
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm"
                style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.2)', color: '#f59e0b' }}>
                🔥 {user.streak.current} day streak
              </div>
            )}

            {/* Notifications bell */}
            <Link href="/notifications">
              <div className="relative p-2 rounded-xl text-gray-400 hover:text-white transition-colors cursor-pointer"
                style={{ background: 'rgba(255,255,255,0.05)' }}>
                <RiBellLine size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-xs flex items-center justify-center font-bold"
                    style={{ background: '#6366f1', color: 'white' }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
            </Link>

            {/* Logout button - prominent in top bar */}
            <LogoutButton 
              variant="default" 
              className="hidden sm:flex" 
            />

            {/* Avatar */}
            <Link href="/profile">
              <div className="w-8 h-8 rounded-full overflow-hidden cursor-pointer ring-2 ring-primary-500/30 hover:ring-primary-500/60 transition-all"
                style={{ background: 'linear-gradient(135deg, #6366f1, #a855f7)' }}>
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white text-sm font-bold">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                )}
              </div>
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}

// HOC to wrap pages with dashboard layout
export function withDashboardLayout(Component) {
  Component.getLayout = (page) => <DashboardLayout>{page}</DashboardLayout>;
  return Component;
}
