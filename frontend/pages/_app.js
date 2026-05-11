/**
 * Next.js App Entry — Supabase Auth Provider
 */

import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import useAuthStore from '../store/authStore';
import '../styles/globals.css';

export default function App({ Component, pageProps, router }) {
  const { refreshSession, logout, isLoading } = useAuthStore();

  useEffect(() => {
    // ── Safety net: clear any stale isLoading=true from localStorage ──────────
    // This can happen if the browser crashed mid-login in a previous session.
    try {
      const stored = localStorage.getItem('focuspulse-auth');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.state?.isLoading === true) {
          parsed.state.isLoading = false;
          localStorage.setItem('focuspulse-auth', JSON.stringify(parsed));
          console.log('[App] Cleared stale isLoading from localStorage');
        }
      }
    } catch (_) {}

    // ── Restore session on page load ──────────────────────────────────────────
    refreshSession();

    // ── Listen for Supabase auth state changes ────────────────────────────────
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[Auth] State change:', event);
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          await refreshSession();
        }
        if (event === 'SIGNED_OUT') {
          logout();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const getLayout = Component.getLayout || ((page) => page);

  return (
    <>
      <AnimatePresence mode="wait" initial={false}>
        {getLayout(<Component {...pageProps} key={router.pathname} />)}
      </AnimatePresence>

      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'rgba(26, 26, 46, 0.95)',
            color: '#fff',
            border: '1px solid rgba(99, 102, 241, 0.3)',
            borderRadius: '12px',
            backdropFilter: 'blur(12px)',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
          error:   { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />
    </>
  );
}
