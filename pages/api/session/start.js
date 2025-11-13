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

    // Check if supabaseAdmin is available
    if (!supabaseAdmin) {
      console.error('Supabase admin client not initialized - missing SUPABASE_SERVICE_ROLE_KEY');
      return res.status(500).json({
        error: 'Server configuration error',
        details: 'Supabase admin client not configured. Please add SUPABASE_SERVICE_ROLE_KEY environment variable.'
      });
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
      return res.status(500).json({
        error: 'Failed to create session',
        details: dbError.message
      });
    }

    // Check if we're on Vercel (serverless environment)
    const isVercel = process.env.VERCEL === '1';

    if (isVercel) {
      // On Vercel, we can't run Puppeteer/WhatsApp connector
      // Just create the session record and show a warning
      console.warn('Running on Vercel - WhatsApp connector not available in serverless environment');

      return res.status(200).json({
        success: true,
        session: {
          id: session.id,
          name: session.name,
          status: 'pending',
          message: 'Session created, but WhatsApp connector is not available on Vercel.',
        },
        warning: 'WhatsApp Web requires a persistent server environment. Vercel serverless functions cannot maintain WhatsApp sessions. Please deploy to Railway, DigitalOcean, or use Docker for full functionality.'
      });
    }

    // Start WhatsApp session (only on non-serverless environments)
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

      // Update session status to failed instead of deleting
      await supabaseAdmin
        .from('sessions')
        .update({ status: 'failed' })
        .eq('id', session.id);

      return res.status(500).json({
        error: 'Failed to initialize WhatsApp session',
        details: whatsappError.message,
        hint: 'This may happen on serverless platforms. Consider deploying to Railway or using Docker.'
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
