/**
 * QRScanner Component
 * Displays QR code for WhatsApp connection
 */

import { useState, useEffect } from 'react';
import supabase from '../lib/supabase';

export default function QRScanner({ sessionId }) {
  const [qrCode, setQrCode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchQRCode = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session.access_token;

      const response = await fetch(`/api/session/${sessionId}/qr`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (response.ok) {
        if (result.qr) {
          setQrCode(result.qr);
        } else if (result.status === 'connected') {
          // Session already connected
          setError('Session already connected!');
        }
      } else {
        setError(result.error || 'Failed to fetch QR code');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!sessionId) return;

    // Fetch initially
    fetchQRCode();

    // Poll for QR code updates every 3 seconds
    const interval = setInterval(fetchQRCode, 3000);

    return () => clearInterval(interval);
  }, [sessionId]);

  if (loading && !qrCode) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-whatsapp mb-4"></div>
        <p className="text-gray-600">Initializing WhatsApp connection...</p>
      </div>
    );
  }

  if (error && !qrCode) {
    return (
      <div className="max-w-md mx-auto text-center py-16">
        <div className="text-6xl mb-4">⚠️</div>
        <h3 className="text-xl font-semibold text-gray-700 mb-2">Error</h3>
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Scan QR Code to Connect
        </h2>

        {qrCode ? (
          <div className="mb-6">
            <div className="bg-white p-4 rounded-lg inline-block shadow-md">
              <img
                src={qrCode}
                alt="WhatsApp QR Code"
                className="w-64 h-64"
              />
            </div>
          </div>
        ) : (
          <div className="mb-6 flex justify-center">
            <div className="w-64 h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-whatsapp mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Generating QR code...</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-left">
          <h3 className="font-semibold text-blue-900 mb-3">How to connect:</h3>
          <ol className="space-y-2 text-sm text-blue-800">
            <li className="flex items-start">
              <span className="font-bold mr-2">1.</span>
              <span>Open WhatsApp on your phone</span>
            </li>
            <li className="flex items-start">
              <span className="font-bold mr-2">2.</span>
              <span>Go to Settings → Linked Devices</span>
            </li>
            <li className="flex items-start">
              <span className="font-bold mr-2">3.</span>
              <span>Tap "Link a Device"</span>
            </li>
            <li className="flex items-start">
              <span className="font-bold mr-2">4.</span>
              <span>Scan this QR code with your phone</span>
            </li>
          </ol>
        </div>

        {qrCode && (
          <div className="mt-4 text-sm text-gray-500">
            <p>⏳ Waiting for scan... QR code refreshes automatically</p>
          </div>
        )}
      </div>
    </div>
  );
}
