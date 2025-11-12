/**
 * GET /api/session/:id/status
 * Get session status
 */

import { supabaseAdmin, getUserFromRequest } from '../../../../src/lib/supabase';
import whatsappConnector from '../../../../src/utils/whatsapp/connector';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;

    // Get authenticated user
    const user = await getUserFromRequest(req);

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get session from database
    const { data: session, error: dbError } = await supabaseAdmin
      .from('sessions')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (dbError || !session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Get live status from connector
    const liveStatus = await whatsappConnector.getSessionStatus(id);

    // Combine database and live status
    const status = {
      id: session.id,
      name: session.name,
      status: session.status,
      phoneNumber: session.phone_number,
      createdAt: session.created_at,
      updatedAt: session.updated_at,
      lastConnectedAt: session.last_connected_at,
      live: liveStatus,
    };

    return res.status(200).json(status);

  } catch (error) {
    console.error('Error getting session status:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message,
    });
  }
}
