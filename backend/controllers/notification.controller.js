/**
 * Notification Controller — Supabase
 */

const supabase = require('../config/supabase');
const { asyncHandler } = require('../middleware/error.middleware');

exports.getNotifications = asyncHandler(async (req, res) => {
  const { unreadOnly, limit = 20, page = 1 } = req.query;
  const from = (parseInt(page) - 1) * parseInt(limit);
  const to = from + parseInt(limit) - 1;

  let query = supabase.from('notifications').select('*', { count: 'exact' })
    .eq('user_id', req.user.id).order('created_at', { ascending: false }).range(from, to);
  if (unreadOnly === 'true') query = query.eq('is_read', false);

  const { data, error, count } = await query;
  const { count: unreadCount } = await supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', req.user.id).eq('is_read', false);

  res.json({ success: true, count: data?.length || 0, total: count, unreadCount: unreadCount || 0, data: data || [] });
});

exports.markAsRead = asyncHandler(async (req, res) => {
  await supabase.from('notifications').update({ is_read: true, read_at: new Date().toISOString() }).eq('id', req.params.id).eq('user_id', req.user.id);
  res.json({ success: true, message: 'Marked as read' });
});

exports.markAllAsRead = asyncHandler(async (req, res) => {
  await supabase.from('notifications').update({ is_read: true, read_at: new Date().toISOString() }).eq('user_id', req.user.id).eq('is_read', false);
  res.json({ success: true, message: 'All notifications marked as read' });
});

exports.deleteNotification = asyncHandler(async (req, res) => {
  await supabase.from('notifications').delete().eq('id', req.params.id).eq('user_id', req.user.id);
  res.json({ success: true, message: 'Notification deleted' });
});

exports.clearAll = asyncHandler(async (req, res) => {
  await supabase.from('notifications').delete().eq('user_id', req.user.id);
  res.json({ success: true, message: 'All notifications cleared' });
});
