/**
 * ChatWindow Component
 * Main chat interface for sending and receiving messages
 */

import { useState, useEffect, useRef } from 'react';
import supabase from '../lib/supabase';
import MessageBubble from './MessageBubble';

export default function ChatWindow({ sessionId, messages, onMessagesUpdate }) {
  const [messageText, setMessageText] = useState('');
  const [recipientNumber, setRecipientNumber] = useState('');
  const [sending, setSending] = useState(false);
  const [showRecipientInput, setShowRecipientInput] = useState(true);

  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Extract unique chat contacts
  const contacts = [...new Set(messages.map(m => m.is_from_me ? m.to_number : m.from_number))];

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!messageText.trim() || !recipientNumber.trim()) {
      alert('Please enter both recipient number and message');
      return;
    }

    setSending(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session.access_token;

      // Clean phone number (remove spaces, dashes, etc.)
      const cleanNumber = recipientNumber.replace(/\D/g, '');

      const response = await fetch(`/api/session/${sessionId}/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          to: cleanNumber,
          message: messageText,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send message');
      }

      // Clear input
      setMessageText('');

      // Refresh messages
      if (onMessagesUpdate) {
        onMessagesUpdate();
      }

    } catch (error) {
      console.error('Error sending message:', error);
      alert(error.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-180px)]">
      {/* Sidebar - Recent Contacts */}
      <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
        <div className="p-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Chats</h3>
        </div>

        {contacts.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {contacts.map((contact, idx) => (
              <div
                key={idx}
                onClick={() => {
                  setRecipientNumber(contact.replace('@c.us', ''));
                  setShowRecipientInput(false);
                }}
                className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-whatsapp text-white flex items-center justify-center font-semibold">
                    {contact.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      +{contact.replace('@c.us', '')}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500 text-sm">
            <p>No conversations yet</p>
            <p className="mt-1">Send a message to start</p>
          </div>
        )}
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {/* Chat Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              {recipientNumber ? (
                <>
                  <h3 className="font-semibold text-gray-900">+{recipientNumber}</h3>
                  <button
                    onClick={() => setShowRecipientInput(true)}
                    className="text-xs text-whatsapp hover:underline"
                  >
                    Change recipient
                  </button>
                </>
              ) : (
                <h3 className="font-semibold text-gray-900">Select a chat or enter number</h3>
              )}
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 chat-container">
          {messages.length > 0 ? (
            messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <p className="text-lg mb-2">💬</p>
                <p>No messages yet</p>
                <p className="text-sm mt-1">Send a message to start the conversation</p>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="bg-white border-t border-gray-200 p-4">
          <form onSubmit={handleSendMessage} className="space-y-3">
            {showRecipientInput && (
              <div className="flex gap-2">
                <input
                  type="tel"
                  value={recipientNumber}
                  onChange={(e) => setRecipientNumber(e.target.value)}
                  placeholder="Recipient number (e.g., 1234567890)"
                  className="input-field flex-1"
                />
                <button
                  type="button"
                  onClick={() => setShowRecipientInput(false)}
                  className="btn-secondary"
                >
                  ✓
                </button>
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Type a message..."
                className="input-field flex-1"
                disabled={sending || !recipientNumber}
              />
              <button
                type="submit"
                disabled={sending || !messageText.trim() || !recipientNumber}
                className="btn-primary px-6 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? '⏳' : '📤'} Send
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
