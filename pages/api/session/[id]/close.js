/**
 * POST /api/session/:id/close
 * Close and disconnect a WhatsApp session
 */

import { supabaseAdmin, getUserFromRequest } from '../../../../src/lib/supabase';
import whatsappConnector from '../../../../src/utils/whatsapp/connector';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    // Get authenticated user
    const user = await getUserFromRequest(req);

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify session belongs to user
    const { data: session, error: dbError } = await supabaseAdmin
      .from('sessions')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (dbError || !session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Close session
    await whatsappConnector.closeSession(id);

    return res.status(200).json({
      success: true,
      message: 'Session closed successfully',
    });

  } catch (error) {
    console.error('Error closing session:', error);
    return res.status(500).json({
      error: 'Failed to close session',
      details: error.message,
    });
  }
}
