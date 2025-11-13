/**
 * Dashboard Page
 * Shows user's WhatsApp sessions
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth, withAuth } from '../src/hooks/useAuth';
import { useRealtimeSessions } from '../src/hooks/useRealtime';
import supabase from '../src/lib/supabase';
import SessionCard from '../src/components/SessionCard';

function Dashboard() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newSessionName, setNewSessionName] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Fetch sessions
  const fetchSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      setSessions(data || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchSessions();
    }
  }, [user]);

  // Real-time updates
  useRealtimeSessions((payload) => {
    console.log('Session update:', payload);
    fetchSessions();
  });

  // Create new session
  const handleCreateSession = async (e) => {
    e.preventDefault();

    if (!newSessionName.trim()) {
      alert('Please enter a session name');
      return;
    }

    setCreating(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session.access_token;

      const response = await fetch('/api/session/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newSessionName }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Show detailed error message
        const errorMsg = result.details
          ? `${result.error}\n\nDetails: ${result.details}`
          : result.error || 'Failed to create session';
        throw new Error(errorMsg);
      }

      // Show warning if WhatsApp connector is not available
      if (result.warning) {
        alert(`⚠️ Warning:\n\n${result.warning}\n\nSession created but WhatsApp features will not work on Vercel.`);
      }

      setShowCreateModal(false);
      setNewSessionName('');

      // Refresh sessions list
      await fetchSessions();

      // Navigate to chat page
      router.push(`/chat/${result.session.id}`);

    } catch (error) {
      alert(`❌ Error creating session:\n\n${error.message}`);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-whatsapp"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-whatsapp text-white shadow-lg">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">WhatsApp Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm opacity-90">{user?.email}</span>
            <button
              onClick={signOut}
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Vercel Warning Banner */}
      {process.env.NEXT_PUBLIC_VERCEL_ENV && (
        <div className="bg-yellow-50 border-b border-yellow-200">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-start gap-3">
              <span className="text-2xl">⚠️</span>
              <div className="flex-1">
                <h3 className="font-semibold text-yellow-900 mb-1">
                  WhatsApp Connector Not Available on Vercel
                </h3>
                <p className="text-sm text-yellow-800">
                  You're running on Vercel's serverless platform. WhatsApp Web requires a persistent server environment
                  to maintain sessions and WebSocket connections. For full functionality, please deploy to:
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <a
                    href="https://railway.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs bg-yellow-200 hover:bg-yellow-300 text-yellow-900 px-3 py-1 rounded transition-colors"
                  >
                    Railway (Recommended)
                  </a>
                  <span className="text-xs bg-yellow-200 text-yellow-900 px-3 py-1 rounded">
                    DigitalOcean
                  </span>
                  <span className="text-xs bg-yellow-200 text-yellow-900 px-3 py-1 rounded">
                    Docker on VPS
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Your Sessions</h2>
            <p className="text-gray-600 mt-1">Manage your WhatsApp connections</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <span className="text-xl">+</span>
            New Session
          </button>
        </div>

        {/* Sessions Grid */}
        {sessions.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📱</div>
            <h3 className="text-2xl font-semibold text-gray-700 mb-2">
              No sessions yet
            </h3>
            <p className="text-gray-500 mb-6">
              Create your first WhatsApp session to get started
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn-primary"
            >
              Create Session
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onClick={() => router.push(`/chat/${session.id}`)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Create Session Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-2xl font-bold mb-4">Create New Session</h3>
            <form onSubmit={handleCreateSession}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Session Name
                </label>
                <input
                  type="text"
                  value={newSessionName}
                  onChange={(e) => setNewSessionName(e.target.value)}
                  className="input-field"
                  placeholder="My WhatsApp"
                  required
                  autoFocus
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewSessionName('');
                  }}
                  className="btn-secondary flex-1"
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary flex-1"
                  disabled={creating}
                >
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default withAuth(Dashboard);
