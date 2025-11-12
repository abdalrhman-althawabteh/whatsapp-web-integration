/**
 * Chat Page
 * Main chat interface with QR scanning and messaging
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth, withAuth } from '../../src/hooks/useAuth';
import { useRealtimeMessages, useRealtimeSession } from '../../src/hooks/useRealtime';
import supabase from '../../src/lib/supabase';
import QRScanner from '../../src/components/QRScanner';
import ChatWindow from '../../src/components/ChatWindow';

function ChatPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);

  // Fetch session data
  const fetchSession = async () => {
    if (!id || !user) return;

    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      setSession(data);
    } catch (error) {
      console.error('Error fetching session:', error);
      alert('Session not found');
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  // Fetch messages
  const fetchMessages = async (chatId = null) => {
    if (!id) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session.access_token;

      const url = chatId
        ? `/api/session/${id}/messages?chat_id=${chatId}`
        : `/api/session/${id}/messages`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (response.ok) {
        setMessages(result.messages || []);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  useEffect(() => {
    fetchSession();
  }, [id, user]);

  useEffect(() => {
    if (session?.status === 'connected') {
      fetchMessages(selectedChat);
    }
  }, [session, selectedChat]);

  // Real-time updates
  useRealtimeSession(id, (updatedSession) => {
    setSession(updatedSession);
  });

  useRealtimeMessages(id, (newMessage) => {
    setMessages((prev) => [...prev, newMessage]);
  });

  // Close session
  const handleCloseSession = async () => {
    if (!confirm('Are you sure you want to disconnect this session?')) {
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session.access_token;

      const response = await fetch(`/api/session/${id}/close`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error closing session:', error);
      alert('Failed to close session');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-whatsapp"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-whatsapp text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <button className="hover:bg-white/20 p-2 rounded transition-colors">
                  ← Back
                </button>
              </Link>
              <div>
                <h1 className="text-xl font-bold">{session.name}</h1>
                {session.phone_number && (
                  <p className="text-sm opacity-90">+{session.phone_number}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                session.status === 'connected' ? 'bg-green-500' :
                session.status === 'connecting' ? 'bg-yellow-500' :
                'bg-gray-500'
              }`}>
                {session.status}
              </span>

              <button
                onClick={handleCloseSession}
                className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg text-sm transition-colors"
              >
                Disconnect
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6">
        {session.status === 'connecting' || !session.phone_number ? (
          <QRScanner sessionId={id} />
        ) : session.status === 'connected' ? (
          <ChatWindow
            sessionId={id}
            messages={messages}
            onMessagesUpdate={fetchMessages}
          />
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">❌</div>
            <h3 className="text-2xl font-semibold text-gray-700 mb-2">
              Session Disconnected
            </h3>
            <p className="text-gray-500 mb-6">
              Your WhatsApp session has been disconnected
            </p>
            <Link href="/dashboard">
              <button className="btn-primary">
                Back to Dashboard
              </button>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}

export default withAuth(ChatPage);
