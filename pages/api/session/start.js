/**
 * POST /api/session/start
 * Start a new WhatsApp session
 */

import { supabaseAdmin, getUserFromRequest } from '../../../src/lib/supabase';
import whatsappConnector from '../../../src/utils/whatsapp/connector';
import { rateLimitMiddleware, apiRateLimiter } from '../../../src/utils/rate-limiter';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Apply rate limiting
  const rateLimitResult = apiRateLimiter.checkLimit(
    req.headers['x-forwarded-for'] || req.connection.remoteAddress
  );

  if (!rateLimitResult.allowed) {
    return res.status(429).json({
      error: 'Too many requests',
      resetAt: new Date(rateLimitResult.resetAt).toISOString(),
    });
  }

  try {
    // Get authenticated user
    const user = await getUserFromRequest(req);

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Session name is required' });
    }

    // Create session in database
    const { data: session, error: dbError } = await supabaseAdmin
      .from('sessions')
      .insert({
        user_id: user.id,
        name,
        status: 'connecting',
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return res.status(500).json({ error: 'Failed to create session' });
    }

    // Start WhatsApp session
    try {
      await whatsappConnector.startSession(session.id, user.id);

      return res.status(200).json({
        success: true,
        session: {
          id: session.id,
          name: session.name,
          status: 'connecting',
          message: 'Session started. Scan QR code to connect.',
        },
      });

    } catch (whatsappError) {
      console.error('WhatsApp connector error:', whatsappError);

      // Delete session from database if WhatsApp initialization fails
      await supabaseAdmin
        .from('sessions')
        .delete()
        .eq('id', session.id);

      return res.status(500).json({
        error: 'Failed to initialize WhatsApp session',
        details: whatsappError.message,
      });
    }

  } catch (error) {
    console.error('Error starting session:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message,
    });
  }
}
