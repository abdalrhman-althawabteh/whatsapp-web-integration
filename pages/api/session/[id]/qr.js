/**
 * GET /api/session/:id/qr
 * Get QR code for a session
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

    // Get QR code from connector
    const qrCode = whatsappConnector.getQRCode(id);

    if (!qrCode && session.qr_code) {
      // Return QR from database if available
      return res.status(200).json({
        qr: session.qr_code,
        status: session.status,
      });
    }

    if (!qrCode) {
      return res.status(200).json({
        qr: null,
        status: session.status,
        message: session.status === 'connected'
          ? 'Session already connected'
          : 'QR code not yet generated. Please wait...',
      });
    }

    return res.status(200).json({
      qr: qrCode,
      status: 'connecting',
    });

  } catch (error) {
    console.error('Error getting QR code:', error);
    return res.status(500).json({
      error: 'Internal server error',
      details: error.message,
    });
  }
}
