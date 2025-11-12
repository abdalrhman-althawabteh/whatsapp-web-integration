/**
 * Landing Page
 */

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../src/hooks/useAuth';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-whatsapp"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-whatsapp to-whatsapp-dark">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center text-white">
          {/* Hero Section */}
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            WhatsApp Web Integration
          </h1>
          <p className="text-xl md:text-2xl mb-8 opacity-90">
            Connect your personal WhatsApp to the web with QR scanning
          </p>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 my-12">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <div className="text-4xl mb-4">📱</div>
              <h3 className="text-xl font-semibold mb-2">Easy Connection</h3>
              <p className="opacity-80">Scan QR code to link your WhatsApp account</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <div className="text-4xl mb-4">💬</div>
              <h3 className="text-xl font-semibold mb-2">Real-time Chat</h3>
              <p className="opacity-80">Send and receive messages instantly</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <div className="text-4xl mb-4">🔒</div>
              <h3 className="text-xl font-semibold mb-2">Secure & Private</h3>
              <p className="opacity-80">Encrypted sessions with Supabase</p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <button className="bg-white text-whatsapp hover:bg-gray-100 font-bold py-3 px-8 rounded-lg text-lg transition-colors duration-200">
                Get Started
              </button>
            </Link>
            <Link href="/login">
              <button className="bg-transparent border-2 border-white text-white hover:bg-white/10 font-bold py-3 px-8 rounded-lg text-lg transition-colors duration-200">
                Sign In
              </button>
            </Link>
          </div>

          {/* Legal Warning */}
          <div className="mt-16 bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-6 text-left">
            <h3 className="font-bold text-lg mb-2">⚠️ Important Legal Notice</h3>
            <ul className="space-y-2 text-sm opacity-90">
              <li>• This is a <strong>Proof-of-Concept</strong> project for educational purposes only</li>
              <li>• For commercial use, please use the official <strong>WhatsApp Business API</strong></li>
              <li>• Always obtain user consent before accessing their data</li>
              <li>• Use responsibly and comply with WhatsApp's Terms of Service</li>
              <li>• The developers are not responsible for misuse of this software</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
