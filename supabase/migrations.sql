-- ============================================
-- WhatsApp Web Integration - Database Schema
-- ============================================
-- Created: 2025-01-12
-- Description: Initial schema for WhatsApp Web Integration MVP
-- Tables: sessions, messages
-- Security: Row Level Security (RLS) enabled

-- ============================================
-- Create Sessions Table
-- ============================================
-- Stores WhatsApp session information for each user
CREATE TABLE IF NOT EXISTS public.sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(50),
    auth_data TEXT, -- Encrypted WhatsApp authentication data
    status VARCHAR(50) DEFAULT 'disconnected' CHECK (status IN ('connecting', 'connected', 'disconnected', 'failed')),
    qr_code TEXT, -- Base64 QR code for scanning
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_connected_at TIMESTAMP WITH TIME ZONE,

    CONSTRAINT unique_user_session_name UNIQUE(user_id, name)
);

-- Create index for faster queries
CREATE INDEX idx_sessions_user_id ON public.sessions(user_id);
CREATE INDEX idx_sessions_status ON public.sessions(status);

-- ============================================
-- Create Messages Table
-- ============================================
-- Stores WhatsApp messages (incoming and outgoing)
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
    message_id VARCHAR(255), -- WhatsApp message ID
    from_number VARCHAR(50) NOT NULL,
    to_number VARCHAR(50) NOT NULL,
    chat_id VARCHAR(255) NOT NULL,
    type VARCHAR(50) DEFAULT 'text' CHECK (type IN ('text', 'image', 'video', 'audio', 'document', 'sticker', 'location', 'contact')),
    content TEXT, -- Message text or file path
    media_url TEXT, -- Supabase Storage URL for media files
    media_mime_type VARCHAR(100),
    timestamp BIGINT NOT NULL, -- WhatsApp timestamp
    is_from_me BOOLEAN DEFAULT false,
    is_forwarded BOOLEAN DEFAULT false,
    has_media BOOLEAN DEFAULT false,
    ack_status INTEGER DEFAULT 0, -- 0: pending, 1: server, 2: device, 3: read, 4: played
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

    CONSTRAINT unique_message_id UNIQUE(session_id, message_id)
);

-- Create indexes for faster queries
CREATE INDEX idx_messages_session_id ON public.messages(session_id);
CREATE INDEX idx_messages_chat_id ON public.messages(chat_id);
CREATE INDEX idx_messages_timestamp ON public.messages(timestamp DESC);
CREATE INDEX idx_messages_created_at ON public.messages(created_at DESC);

-- ============================================
-- Create Media Storage Bucket
-- ============================================
-- Note: Run this in Supabase Storage UI or via API
-- Bucket name: whatsapp-media
-- Public: false
-- Allowed MIME types: image/*, video/*, audio/*, application/*

-- ============================================
-- Enable Row Level Security (RLS)
-- ============================================
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS Policies for Sessions Table
-- ============================================

-- Users can only view their own sessions
CREATE POLICY "Users can view their own sessions"
ON public.sessions
FOR SELECT
USING (auth.uid() = user_id);

-- Users can only insert their own sessions
CREATE POLICY "Users can create their own sessions"
ON public.sessions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can only update their own sessions
CREATE POLICY "Users can update their own sessions"
ON public.sessions
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own sessions
CREATE POLICY "Users can delete their own sessions"
ON public.sessions
FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- RLS Policies for Messages Table
-- ============================================

-- Users can only view messages from their own sessions
CREATE POLICY "Users can view messages from their sessions"
ON public.messages
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.sessions
        WHERE sessions.id = messages.session_id
        AND sessions.user_id = auth.uid()
    )
);

-- Users can only insert messages to their own sessions
CREATE POLICY "Users can create messages in their sessions"
ON public.messages
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.sessions
        WHERE sessions.id = messages.session_id
        AND sessions.user_id = auth.uid()
    )
);

-- Users can only update messages in their own sessions
CREATE POLICY "Users can update messages in their sessions"
ON public.messages
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.sessions
        WHERE sessions.id = messages.session_id
        AND sessions.user_id = auth.uid()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.sessions
        WHERE sessions.id = messages.session_id
        AND sessions.user_id = auth.uid()
    )
);

-- Users can only delete messages from their own sessions
CREATE POLICY "Users can delete messages from their sessions"
ON public.messages
FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.sessions
        WHERE sessions.id = messages.session_id
        AND sessions.user_id = auth.uid()
    )
);

-- ============================================
-- Create Updated_at Trigger Function
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to sessions table
CREATE TRIGGER set_sessions_updated_at
    BEFORE UPDATE ON public.sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- Create Realtime Publication (Optional)
-- ============================================
-- Enable realtime for messages table
-- This allows clients to subscribe to real-time updates
-- Note: You may need to enable this in Supabase Dashboard under Database > Replication

-- ============================================
-- Helper Functions
-- ============================================

-- Function to get user sessions with message count
CREATE OR REPLACE FUNCTION public.get_user_sessions_with_stats(user_uuid UUID)
RETURNS TABLE (
    id UUID,
    name VARCHAR,
    phone_number VARCHAR,
    status VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    last_connected_at TIMESTAMP WITH TIME ZONE,
    total_messages BIGINT,
    unread_messages BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.id,
        s.name,
        s.phone_number,
        s.status,
        s.created_at,
        s.updated_at,
        s.last_connected_at,
        COUNT(m.id) as total_messages,
        COUNT(CASE WHEN NOT m.is_from_me AND m.ack_status < 3 THEN 1 END) as unread_messages
    FROM public.sessions s
    LEFT JOIN public.messages m ON s.id = m.session_id
    WHERE s.user_id = user_uuid
    GROUP BY s.id, s.name, s.phone_number, s.status, s.created_at, s.updated_at, s.last_connected_at
    ORDER BY s.updated_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Sample Data (Optional - For Testing)
-- ============================================
-- Uncomment to insert sample data for testing

-- INSERT INTO public.sessions (user_id, name, status)
-- VALUES
-- ('your-user-id-here', 'My WhatsApp', 'disconnected');

-- ============================================
-- Migration Complete
-- ============================================
-- Next steps:
-- 1. Create storage bucket 'whatsapp-media' in Supabase Dashboard
-- 2. Set bucket policies to allow authenticated users to upload/download
-- 3. Enable Realtime for messages table in Database > Replication
-- ============================================
