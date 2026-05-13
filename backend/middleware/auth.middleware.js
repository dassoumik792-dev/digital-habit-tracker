/**
 * Auth Middleware — Supabase JWT verification
 *
 * The frontend sends the Supabase access_token in the Authorization header.
 * We verify it using the Supabase admin client and attach the user to req.
 */

const supabase = require('../config/supabase');

const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  console.log('[Auth] Middleware - Request headers:', {
    authorization: authHeader ? 'Bearer [TOKEN]' : 'None',
    path: req.path,
    method: req.method
  });

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('[Auth] No valid Bearer token found');
    return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  console.log('[Auth] Token extracted, length:', token.length);

  try {
    // Verify Supabase JWT and get user
    console.log('[Auth] Verifying Supabase JWT...');
    const { data: { user }, error } = await supabase.auth.getUser(token);

    console.log('[Auth] Supabase auth result:', {
      userId: user?.id,
      email: user?.email,
      error: error?.message
    });

    if (error || !user) {
      console.log('[Auth] Invalid or expired token:', error?.message);
      return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
    }

    // Fetch user's profile from our public.users table
    console.log('[Auth] Fetching user profile for ID:', user.id);
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    console.log('[Auth] Profile query result:', {
      profile: profile ? { id: profile.id, name: profile.name, email: profile.email } : null,
      error: profileError?.message,
      isActive: profile?.is_active
    });

    if (profileError) {
      if (profileError.message?.includes("Could not find the table 'public.users'")) {
        console.error('[Auth] Missing users table in Supabase schema:', profileError.message);
        return res.status(500).json({ success: false, message: 'Server configuration error. User profile table is not available.' });
      }
      console.log('[Auth] User profile query failed:', profileError.message);
      return res.status(500).json({ success: false, message: 'Unable to read user profile.' });
    }

    let resolvedProfile = profile;
    if (!resolvedProfile) {
      console.log('[Auth] No profile row found, creating fallback profile for ID:', user.id);
      const defaultName = user.user_metadata?.name || user.email?.split('@')[0] || 'User';
      const { data: createdProfile, error: createError } = await supabase
        .from('users')
        .insert({ id: user.id, email: user.email, name: defaultName })
        .select('*')
        .single();

      if (createError || !createdProfile) {
        console.error('[Auth] Failed to create fallback profile:', createError?.message);
        return res.status(500).json({ success: false, message: 'Unable to create user profile.' });
      }
      resolvedProfile = createdProfile;
    }

    if (!resolvedProfile.is_active) {
      console.log('[Auth] Account deactivated for user:', resolvedProfile.id);
      return res.status(401).json({ success: false, message: 'Account has been deactivated.' });
    }

    // Attach to request for use in controllers
    req.user = { ...resolvedProfile, auth_id: user.id };
    console.log('[Auth] User attached to request:', {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role
    });
    next();
  } catch (err) {
    console.error('[Auth] Token verification exception:', err.message);
    return res.status(401).json({ success: false, message: 'Token verification failed.' });
  }
};

// Role-based access control
const authorize = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: `Role '${req.user.role}' is not authorized for this route.`,
    });
  }
  next();
};

module.exports = { protect, authorize };
