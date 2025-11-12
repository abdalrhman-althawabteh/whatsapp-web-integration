/**
 * Media Handler
 * Handles media upload to Supabase Storage
 */

import { supabaseAdmin } from '../lib/supabase';

const BUCKET_NAME = process.env.SUPABASE_MEDIA_BUCKET || 'whatsapp-media';

/**
 * Upload media file to Supabase Storage
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} fileName - File name
 * @param {string} mimeType - MIME type
 * @param {string} sessionId - Session ID
 * @returns {Promise<Object>} Upload result with public URL
 */
export async function uploadMedia(fileBuffer, fileName, mimeType, sessionId) {
  try {
    const timestamp = Date.now();
    const filePath = `${sessionId}/${timestamp}-${fileName}`;

    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .upload(filePath, fileBuffer, {
        contentType: mimeType,
        cacheControl: '3600',
      });

    if (error) {
      throw error;
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    return {
      success: true,
      path: data.path,
      publicUrl,
    };

  } catch (error) {
    console.error('Error uploading media:', error);
    throw new Error('Failed to upload media');
  }
}

/**
 * Download media from Supabase Storage
 * @param {string} filePath - File path in storage
 * @returns {Promise<Buffer>} File buffer
 */
export async function downloadMedia(filePath) {
  try {
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .download(filePath);

    if (error) {
      throw error;
    }

    return data;

  } catch (error) {
    console.error('Error downloading media:', error);
    throw new Error('Failed to download media');
  }
}

/**
 * Delete media from Supabase Storage
 * @param {string} filePath - File path in storage
 * @returns {Promise<boolean>} Success status
 */
export async function deleteMedia(filePath) {
  try {
    const { error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      throw error;
    }

    return true;

  } catch (error) {
    console.error('Error deleting media:', error);
    return false;
  }
}

/**
 * Create storage bucket if it doesn't exist
 * @returns {Promise<boolean>} Success status
 */
export async function ensureBucketExists() {
  try {
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();

    const bucketExists = buckets?.some(b => b.name === BUCKET_NAME);

    if (!bucketExists) {
      const { error } = await supabaseAdmin.storage.createBucket(BUCKET_NAME, {
        public: false,
        fileSizeLimit: 52428800, // 50MB
        allowedMimeTypes: [
          'image/*',
          'video/*',
          'audio/*',
          'application/pdf',
        ],
      });

      if (error) {
        throw error;
      }

      console.log(`Storage bucket "${BUCKET_NAME}" created successfully`);
    }

    return true;

  } catch (error) {
    console.error('Error ensuring bucket exists:', error);
    return false;
  }
}

export default {
  uploadMedia,
  downloadMedia,
  deleteMedia,
  ensureBucketExists,
};
