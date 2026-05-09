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
  const { refreshSession, logout } = useAuthStore();

  useEffect(() => {
    // Restore session on page load
    refreshSession();

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        await refreshSession();
      }
      if (event === 'SIGNED_OUT') {
        logout();
      }
    });

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
