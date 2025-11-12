/**
 * GET /api/session/:id/messages
 * Get messages for a session/chat
 */

import { supabaseAdmin, getUserFromRequest } from '../../../../src/lib/supabase';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    const { chat_id, limit = 50, offset = 0 } = req.query;

    // Get authenticated user
    const user = await getUserFromRequest(req);

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify session belongs to user
    const { data: session, error: sessionError } = await supabaseAdmin
      .from('sessions')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (sessionError || !session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Build query
    let query = supabaseAdmin
      .from('messages')
      .select('*')
      .eq('session_id', id)
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter by chat if specified
    if (chat_id) {
      query = query.eq('chat_id', chat_id);
    }

    const { data: messages, error: messagesError } = await query;

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      return res.status(500).json({ error: 'Failed to fetch messages' });
    }

    return res.status(200).json({
      messages: messages.reverse(), // Return in chronological order
      total: messages.length,
      offset,
      limit,
    });

  } catch (error) {
    console.error('Error getting messages:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message,
    });
  }
}
