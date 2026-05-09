/**
 * Auth Middleware — Supabase JWT verification
 *
 * The frontend sends the Supabase access_token in the Authorization header.
 * We verify it using the Supabase admin client and attach the user to req.
 */

const supabase = require('../config/supabase');

const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Verify the Supabase JWT and get the user
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
    }

    // Fetch the user's profile from our public.users table
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return res.status(401).json({ success: false, message: 'User profile not found.' });
    }

    if (!profile.is_active) {
      return res.status(401).json({ success: false, message: 'Account has been deactivated.' });
    }

    // Attach to request for use in controllers
    req.user = { ...profile, auth_id: user.id };
    next();
  } catch (err) {
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
