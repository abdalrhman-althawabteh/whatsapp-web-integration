/**
 * POST /api/session/:id/send
 * Send a message through WhatsApp
 */

import { supabaseAdmin, getUserFromRequest } from '../../../../src/lib/supabase';
import whatsappConnector from '../../../../src/utils/whatsapp/connector';
import { apiRateLimiter } from '../../../../src/utils/rate-limiter';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Apply rate limiting
  const identifier = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
  const rateLimitResult = apiRateLimiter.checkLimit(identifier);

  if (!rateLimitResult.allowed) {
    return res.status(429).json({
      error: 'Too many requests',
      resetAt: new Date(rateLimitResult.resetAt).toISOString(),
    });
  }

  try {
    const { id } = req.query;
    const { to, message, type = 'text' } = req.body;

    // Validate input
    if (!to || !message) {
      return res.status(400).json({ error: 'Phone number and message are required' });
    }

    // Get authenticated user
    const user = await getUserFromRequest(req);

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify session belongs to user and is connected
    const { data: session, error: dbError } = await supabaseAdmin
      .from('sessions')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (dbError || !session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.status !== 'connected') {
      return res.status(400).json({
        error: 'Session not connected',
        status: session.status,
      });
    }

    // Send message
    const result = await whatsappConnector.sendMessage(id, to, message);

    return res.status(200).json({
      success: true,
      message: 'Message sent successfully',
      data: result,
    });

  } catch (error) {
    console.error('Error sending message:', error);
    return res.status(500).json({
      error: 'Failed to send message',
      details: error.message,
    });
  }
}
