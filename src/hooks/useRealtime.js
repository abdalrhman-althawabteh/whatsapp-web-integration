/**
 * useRealtime Hook
 * Manages real-time subscriptions to Supabase tables
 *
 * Why Supabase Realtime:
 * - Direct integration with database
 * - Automatic authentication
 * - No need for separate Socket.IO server
 * - Built-in presence and broadcast features
 */

import { useEffect, useState } from 'react';
import supabase from '../lib/supabase';

/**
 * Subscribe to real-time updates for messages
 * @param {string} sessionId - Session ID to subscribe to
 * @param {Function} onMessage - Callback when new message arrives
 * @returns {Object} Subscription state
 */
export function useRealtimeMessages(sessionId, onMessage) {
  const [status, setStatus] = useState('disconnected');

  useEffect(() => {
    if (!sessionId) return;

    setStatus('connecting');

    const channel = supabase
      .channel(`messages:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          setStatus('connected');
          if (onMessage) {
            onMessage(payload.new);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          if (onMessage) {
            onMessage(payload.new, 'update');
          }
        }
      )
      .subscribe((status) => {
        setStatus(status);
      });

    return () => {
      channel.unsubscribe();
      setStatus('disconnected');
    };
  }, [sessionId, onMessage]);

  return { status };
}

/**
 * Subscribe to session status updates
 * @param {string} sessionId - Session ID to subscribe to
 * @param {Function} onStatusChange - Callback when status changes
 * @returns {Object} Subscription state
 */
export function useRealtimeSession(sessionId, onStatusChange) {
  const [status, setStatus] = useState('disconnected');

  useEffect(() => {
    if (!sessionId) return;

    setStatus('connecting');

    const channel = supabase
      .channel(`session:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'sessions',
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          setStatus('connected');
          if (onStatusChange) {
            onStatusChange(payload.new);
          }
        }
      )
      .subscribe((status) => {
        setStatus(status);
      });

    return () => {
      channel.unsubscribe();
      setStatus('disconnected');
    };
  }, [sessionId, onStatusChange]);

  return { status };
}

/**
 * Subscribe to all sessions for a user
 * @param {Function} onSessionChange - Callback when sessions change
 * @returns {Object} Subscription state
 */
export function useRealtimeSessions(onSessionChange) {
  const [status, setStatus] = useState('disconnected');

  useEffect(() => {
    setStatus('connecting');

    const channel = supabase
      .channel('sessions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sessions',
        },
        (payload) => {
          setStatus('connected');
          if (onSessionChange) {
            onSessionChange(payload);
          }
        }
      )
      .subscribe((status) => {
        setStatus(status);
      });

    return () => {
      channel.unsubscribe();
      setStatus('disconnected');
    };
  }, [onSessionChange]);

  return { status };
}
