/**
 * Auth Controller — Supabase Auth
 * Registration, login, logout, password reset all handled via Supabase Auth.
 * The backend acts as a proxy so the frontend doesn't need the service role key.
 */

const supabase = require('../config/supabase');
const { asyncHandler, AppError } = require('../middleware/error.middleware');

// ── POST /api/auth/register ───────────────────────────────────────────────────
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,          // auto-confirm for dev; remove in prod
    user_metadata: { name },
  });

  if (error) throw new AppError(error.message, 400);

  // The handle_new_user trigger creates the public.users row automatically.
  console.log('[Auth] User created in auth, checking profile creation...');
  
  // Verify or create the user profile row in public.users
  let { data: profileCheck, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('id', data.user.id)
    .maybeSingle();

  if (!profileCheck && !profileError) {
    const defaultName = data.user.user_metadata?.name || data.user.email.split('@')[0] || 'User';
    const createResult = await supabase
      .from('users')
      .insert({ id: data.user.id, email: data.user.email, name: defaultName })
      .select('*')
      .single();

    profileCheck = createResult.data;
    profileError = createResult.error;
  }

  console.log('[Auth] Profile creation verification:', {
    userId: data.user.id,
    profileFound: !!profileCheck,
    profileError: profileError?.message,
    profile: profileCheck ? { id: profileCheck.id, name: profileCheck.name, email: profileCheck.email } : null
  });

  // Seed a welcome notification
  console.log('[Auth] Creating welcome notification...');
  const { data: notifResult, error: notifError } = await supabase.from('notifications').insert({
    user_id: data.user.id,
    type: 'motivation',
    title: 'Welcome to FocusPulse AI! 🎉',
    message: `Hi ${name}! Start tracking your digital habits and unlock your productivity potential.`,
    icon: '🚀',
    priority: 'high',
  }).select().single();
  
  console.log('[Auth] Welcome notification result:', {
    success: !notifError,
    notificationId: notifResult?.id,
    error: notifError?.message
  });

  // Sign in immediately to return a session
  const { data: session, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
  if (signInError) throw new AppError(signInError.message, 400);

  res.status(201).json({
    success: true,
    message: 'Account created successfully',
    token: session.session.access_token,
    refresh_token: session.session.refresh_token,
    user: {
      id: data.user.id,
      name,
      email,
      role: 'user',
    },
  });
});

// ── POST /api/auth/login ──────────────────────────────────────────────────────
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new AppError('Invalid email or password', 401);

  // Update last_login
  await supabase.from('users').update({ last_login: new Date().toISOString() }).eq('id', data.user.id);

  // Fetch or create profile
  let { data: profile, error: profileError } = await supabase.from('users').select('*').eq('id', data.user.id).maybeSingle();
  if (!profile && !profileError) {
    const defaultName = data.user.user_metadata?.name || data.user.email.split('@')[0] || 'User';
    const createResult = await supabase
      .from('users')
      .insert({ id: data.user.id, email: data.user.email, name: defaultName })
      .select('*')
      .single();
    profile = createResult.data;
    profileError = createResult.error;
  }

  if (profileError) {
    throw new AppError(profileError.message || 'Unable to fetch user profile', 500);
  }

  res.json({
    success: true,
    message: 'Login successful',
    token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    user: profile,
  });
});

// ── POST /api/auth/logout ─────────────────────────────────────────────────────
exports.logout = asyncHandler(async (req, res) => {
  // Supabase logout is handled client-side by calling supabase.auth.signOut()
  // The backend just confirms the action
  res.json({ success: true, message: 'Logged out successfully' });
});

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
exports.getMe = asyncHandler(async (req, res) => {
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', req.user.id)
    .single();

  res.json({ success: true, user: profile });
});

// ── POST /api/auth/forgot-password ───────────────────────────────────────────
exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  // Supabase sends the reset email automatically
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.FRONTEND_URL}/reset-password`,
  });

  // Always return success to avoid email enumeration
  res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
});

// ── POST /api/auth/refresh-token ─────────────────────────────────────────────
exports.refreshToken = asyncHandler(async (req, res) => {
  const { refresh_token } = req.body;
  if (!refresh_token) throw new AppError('Refresh token required', 400);

  const { data, error } = await supabase.auth.refreshSession({ refresh_token });
  if (error) throw new AppError('Invalid refresh token', 401);

  res.json({
    success: true,
    token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  });
});
