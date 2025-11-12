/**
 * Health Check Endpoint
 * Used by Docker healthcheck
 */

export default function handler(req, res) {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'whatsapp-web-integration',
  });
}
