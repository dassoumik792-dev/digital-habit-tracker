/**
 * FocusPulse AI — Auth Store
 *
 * SIGNUP  → calls backend /api/auth/register (uses Supabase admin API,
 *           auto-confirms email, returns a live session immediately)
 * LOGIN   → calls supabase.auth.signInWithPassword() directly
 * SESSION → persisted by Supabase + Zustand persist middleware
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// ─── Helper: translate Supabase error messages into user-friendly text ─────────
function friendlyError(message = '') {
  if (message.includes('User already registered'))
    return 'An account with this email already exists. Please log in instead.';
  if (message.includes('Email not confirmed'))
    return 'Your email is not verified. Please check your inbox or contact support.';
  if (message.includes('Invalid login credentials'))
    return 'Incorrect email or password. Please try again.';
  if (message.includes('Email not found') || message.includes('user not found'))
    return 'No account found with this email. Please sign up first.';
  if (message.includes('Password should be at least'))
    return 'Password must be at least 6 characters.';
  if (message.includes('Unable to validate email address'))
    return 'Please enter a valid email address.';
  if (message.includes('fetch') || message.includes('NetworkError') || message.includes('Failed to fetch'))
    return 'Cannot connect to server. Make sure the backend is running on port 5000.';
  return message || 'Something went wrong. Please try again.';
}

const useAuthStore = create(
  persist(
    (set, get) => ({
      user:            null,
      session:         null,
      isAuthenticated: false,
      isLoading:       false,

      // ── SIGN UP ─────────────────────────────────────────────────────────────
      // Goes through the backend which uses supabase.auth.admin.createUser()
      // with email_confirm: true — so no verification email is needed.
      register: async (name, email, password) => {
        set({ isLoading: true });
        try {
          const res = await fetch(`${API_URL}/auth/register`, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ name, email, password }),
          });

          const data = await res.json();

          if (!res.ok) {
            throw new Error(data.message || 'Registration failed');
          }

          // Backend returns access_token + refresh_token.
          // Inject them into the Supabase client so all .from() calls work.
          const { data: sessionData, error: sessionError } =
            await supabase.auth.setSession({
              access_token:  data.token,
              refresh_token: data.refresh_token,
            });

          if (sessionError) throw new Error(sessionError.message);

          // Fetch the full profile row created by the DB trigger
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.user.id)
            .single();

          set({
            user:            profile || data.user,
            session:         sessionData.session,
            isAuthenticated: true,
            isLoading:       false,
          });

          toast.success(`Welcome to FocusPulse AI, ${name.split(' ')[0]}! 🚀`);
          return { success: true };

        } catch (err) {
          set({ isLoading: false });
          const msg = friendlyError(err.message);
          toast.error(msg);
          return { success: false, error: msg };
        }
      },

      // ── LOG IN ──────────────────────────────────────────────────────────────
      // Uses Supabase directly — no backend needed for login.
      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) throw new Error(error.message);

          // Fetch the user's profile from our public.users table
          const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.user.id)
            .single();

          // Profile might not exist yet if the DB trigger hasn't run —
          // fall back to basic info from the auth user
          const userProfile = profile || {
            id:    data.user.id,
            name:  data.user.user_metadata?.name || email.split('@')[0],
            email: data.user.email,
            role:  'user',
          };

          set({
            user:            userProfile,
            session:         data.session,
            isAuthenticated: true,
            isLoading:       false,
          });

          toast.success(`Welcome back, ${userProfile.name?.split(' ')[0] || 'there'}! 👋`);
          return { success: true };

        } catch (err) {
          set({ isLoading: false });
          const msg = friendlyError(err.message);
          toast.error(msg);
          return { success: false, error: msg };
        }
      },

      // ── GOOGLE OAUTH ────────────────────────────────────────────────────────
      loginWithGoogle: async () => {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options:  { redirectTo: `${window.location.origin}/dashboard` },
        });
        if (error) toast.error(friendlyError(error.message));
      },

      // ── LOG OUT ─────────────────────────────────────────────────────────────
      logout: async () => {
        await supabase.auth.signOut();
        set({ user: null, session: null, isAuthenticated: false });
        toast.success('Logged out successfully');
      },

      // ── REFRESH SESSION (called on app load) ─────────────────────────────────
      // Restores the session from Supabase's local storage if it still exists.
      refreshSession: async () => {
        try {
          const { data: { session } } = await supabase.auth.getSession();

          if (session) {
            const { data: profile } = await supabase
              .from('users')
              .select('*')
              .eq('id', session.user.id)
              .single();

            set({
              user:            profile || { id: session.user.id, email: session.user.email },
              session,
              isAuthenticated: true,
            });
          } else {
            set({ user: null, session: null, isAuthenticated: false });
          }
        } catch (_) {
          set({ user: null, session: null, isAuthenticated: false });
        }
      },

      // ── FORGOT PASSWORD ─────────────────────────────────────────────────────
      forgotPassword: async (email) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        // Don't reveal whether the email exists
        return { success: true };
      },

      // ── UPDATE LOCAL USER ───────────────────────────────────────────────────
      updateUser: (updates) => {
        set((state) => ({ user: { ...state.user, ...updates } }));
      },

      // ── GET TOKEN (for backend API calls) ───────────────────────────────────
      getToken: () => get().session?.access_token || null,
    }),
    {
      name: 'focuspulse-auth',
      // Only persist these fields — never persist isLoading
      partialize: (state) => ({
        user:            state.user,
        session:         state.session,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export default useAuthStore;
