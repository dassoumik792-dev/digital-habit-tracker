/**
 * FocusPulse AI — Auth Store (Supabase)
 *
 * KEY FIXES:
 * 1. isLoading is NEVER persisted — prevents stuck spinner on page reload
 * 2. Every async function has try/catch/finally — isLoading always resets
 * 3. register() has a 15s fetch timeout — no silent hangs if backend is down
 * 4. login() uses Supabase directly — no backend dependency
 * 5. All errors surface immediately with clear messages
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// ── Fetch with timeout (prevents silent hangs) ────────────────────────────────
async function fetchWithTimeout(url, options = {}, timeoutMs = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Request timed out. Is the backend server running on port 5000?');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// ── Translate raw errors into user-friendly messages ──────────────────────────
function friendlyError(message = '') {
  const m = message.toLowerCase();
  if (m.includes('user already registered') || m.includes('already been registered'))
    return 'An account with this email already exists. Please log in instead.';
  if (m.includes('email not confirmed'))
    return 'Email not verified. Please check your inbox or contact support.';
  if (m.includes('invalid login credentials') || m.includes('invalid credentials'))
    return 'Incorrect email or password. Please try again.';
  if (m.includes('user not found') || m.includes('no user found'))
    return 'No account found with this email. Please sign up first.';
  if (m.includes('password should be at least') || m.includes('password must be'))
    return 'Password must be at least 6 characters.';
  if (m.includes('unable to validate email') || m.includes('invalid email'))
    return 'Please enter a valid email address.';
  if (m.includes('timed out') || m.includes('aborted'))
    return 'Request timed out. Make sure the backend is running on port 5000.';
  if (m.includes('failed to fetch') || m.includes('networkerror') || m.includes('fetch'))
    return 'Cannot connect to server. Make sure the backend is running on port 5000.';
  if (m.includes('rate limit'))
    return 'Too many attempts. Please wait a moment and try again.';
  return message || 'Something went wrong. Please try again.';
}

const useAuthStore = create(
  persist(
    (set, get) => ({
      user:            null,
      session:         null,
      isAuthenticated: false,
      isLoading:       false,   // ← never persisted (see partialize below)

      // ── SIGN UP ─────────────────────────────────────────────────────────────
      // Calls backend which uses supabase.auth.admin.createUser({ email_confirm: true })
      // This bypasses email verification entirely — user is logged in immediately.
      register: async (name, email, password) => {
        set({ isLoading: true });
        try {
          console.log('[Auth] Starting registration for:', email);

          // Call backend with timeout — won't hang forever if server is down
          const res = await fetchWithTimeout(
            `${API_URL}/auth/register`,
            {
              method:  'POST',
              headers: { 'Content-Type': 'application/json' },
              body:    JSON.stringify({ name, email, password }),
            },
            15000
          );

          const data = await res.json();
          console.log('[Auth] Backend register response:', res.status, data.success);

          if (!res.ok) {
            throw new Error(data.message || 'Registration failed');
          }

          // Inject the session returned by the backend into the Supabase client
          console.log('[Auth] Setting Supabase session...');
          const { data: sessionData, error: sessionError } =
            await supabase.auth.setSession({
              access_token:  data.token,
              refresh_token: data.refresh_token,
            });

          if (sessionError) {
            console.error('[Auth] setSession error:', sessionError.message);
            throw new Error(sessionError.message);
          }

          console.log('[Auth] Session set. Fetching profile...');

          // Fetch profile (created by DB trigger on signup)
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.user.id)
            .single();

          console.log('[Auth] Profile fetched:', profile ? 'ok' : 'not found (using fallback)');

          set({
            user:            profile || data.user,
            session:         sessionData.session,
            isAuthenticated: true,
          });

          toast.success(`Welcome to FocusPulse AI, ${name.split(' ')[0]}! 🚀`);
          return { success: true };

        } catch (err) {
          console.error('[Auth] Registration error:', err.message);
          const msg = friendlyError(err.message);
          toast.error(msg);
          return { success: false, error: msg };
        } finally {
          // ALWAYS reset loading — even if an error occurs mid-flow
          set({ isLoading: false });
        }
      },

      // ── LOG IN ──────────────────────────────────────────────────────────────
      // Uses Supabase directly — no backend call needed.
      login: async (email, password) => {
        set({ isLoading: true });
        try {
          console.log('[Auth] Starting login for:', email);

          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          console.log('[Auth] signInWithPassword result:', error ? error.message : 'success');

          if (error) throw new Error(error.message);

          // Fetch profile from public.users table
          const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.user.id)
            .single();

          if (profileError) {
            console.warn('[Auth] Profile fetch warning:', profileError.message);
          }

          // Fall back to auth user data if profile row doesn't exist yet
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
          });

          toast.success(`Welcome back, ${userProfile.name?.split(' ')[0] || 'there'}! 👋`);
          return { success: true };

        } catch (err) {
          console.error('[Auth] Login error:', err.message);
          const msg = friendlyError(err.message);
          toast.error(msg);
          return { success: false, error: msg };
        } finally {
          // ALWAYS reset loading
          set({ isLoading: false });
        }
      },

      // ── GOOGLE OAUTH ────────────────────────────────────────────────────────
      loginWithGoogle: async () => {
        try {
          const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options:  { redirectTo: `${window.location.origin}/dashboard` },
          });
          if (error) throw new Error(error.message);
        } catch (err) {
          toast.error(friendlyError(err.message));
        }
      },

      // ── LOG OUT ─────────────────────────────────────────────────────────────
      logout: async () => {
        set({ isLoading: true });
        try {
          console.log('[Auth] Starting logout process...');
          
          // Sign out from Supabase
          const { error } = await supabase.auth.signOut();
          
          if (error) {
            console.error('[Auth] Supabase logout error:', error);
            // Continue with local cleanup even if Supabase logout fails
          }
          
          // Clear all local state
          set({ 
            user: null, 
            session: null, 
            isAuthenticated: false, 
            isLoading: false 
          });
          
          // Clear any stored tokens or session data
          try {
            localStorage.removeItem('focuspulse-auth');
            sessionStorage.clear();
          } catch (_) {}
          
          console.log('[Auth] Logout completed successfully');
          toast.success('Logged out successfully');
          return { success: true };
          
        } catch (err) {
          console.error('[Auth] Logout error:', err);
          // Force logout even if there's an error
          set({ 
            user: null, 
            session: null, 
            isAuthenticated: false, 
            isLoading: false 
          });
          toast.error('Logout completed with warnings');
          return { success: true }; // Still consider it successful
        }
      },

      // ── REFRESH SESSION (called on app load) ─────────────────────────────────
      // Restores session silently — never sets isLoading (would block the UI)
      refreshSession: async () => {
        try {
          const { data: { session }, error } = await supabase.auth.getSession();

          if (error) {
            console.warn('[Auth] getSession error:', error.message);
            set({ user: null, session: null, isAuthenticated: false });
            return;
          }

          if (session) {
            // Fetch profile in background — don't block if it fails
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
        } catch (err) {
          console.warn('[Auth] refreshSession error:', err.message);
          set({ user: null, session: null, isAuthenticated: false });
        }
      },

      // ── FORGOT PASSWORD ─────────────────────────────────────────────────────
      forgotPassword: async (email) => {
        try {
          await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
          });
        } catch (_) {}
        return { success: true };
      },

      // ── UPDATE LOCAL USER ───────────────────────────────────────────────────
      updateUser: (updates) => {
        set((state) => ({ user: { ...state.user, ...updates } }));
      },

      // ── GET TOKEN ───────────────────────────────────────────────────────────
      getToken: () => get().session?.access_token || null,
    }),
    {
      name: 'focuspulse-auth',
      // ⚠️  CRITICAL: isLoading is intentionally excluded from persistence.
      // If it were persisted and a crash happened mid-login, the button would
      // appear stuck on every page reload until localStorage is cleared.
      partialize: (state) => ({
        user:            state.user,
        session:         state.session,
        isAuthenticated: state.isAuthenticated,
        // isLoading is NOT here — always starts as false on page load
      }),
    }
  )
);

export default useAuthStore;
