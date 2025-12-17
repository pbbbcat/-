
import { createClient } from '@supabase/supabase-js';

// Helper to safely get env vars without crashing if 'process' is undefined
const getEnv = (key: string, viteKey: string, fallback: string) => {
  try {
    if (typeof process !== 'undefined' && process.env) {
      return process.env[key] || process.env[viteKey] || fallback;
    }
  } catch (e) {
    // Ignore error
  }
  
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      return import.meta.env[key] || import.meta.env[viteKey] || fallback;
    }
  } catch (e) {
     // Ignore error
  }

  return fallback;
};

// Configuration obtained from environment variables or hardcoded fallbacks
// NOTE: You are using the Service Role Key here as requested. 
// In a production environment, you should use the Anon Key for the frontend and keep the Service Role Key for backend scripts only.
const supabaseUrl = getEnv('SUPABASE_URL', 'VITE_SUPABASE_URL', 'https://jgotbqvymecdxnqlgouo.supabase.co');
const supabaseKey = getEnv('SUPABASE_KEY', 'VITE_SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impnb3RicXZ5bWVjZHhucWxnb3VvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDA1Mzg0NSwiZXhwIjoyMDc5NjI5ODQ1fQ.YSS2vtyMbwYt2bCHnlKhGGmqud0vH_Ma1ZbYk2X1I2I');

if (!supabaseUrl || !supabaseKey) {
  console.error("Supabase URL or Key is strictly required.");
}

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Get the public URL for a file in a storage bucket (Works only for Public buckets)
 */
export const getPublicFileUrl = (bucket: string, path: string): string => {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
};

/**
 * Get a signed URL for a file (Works for Private and Public buckets)
 * Valid for 60 seconds (download trigger)
 */
export const getSignedFileUrl = async (bucket: string, path: string): Promise<string | null> => {
    try {
        const { data, error } = await supabase
            .storage
            .from(bucket)
            .createSignedUrl(path, 60); // URL valid for 60 seconds

        if (error) {
            console.error("Error creating signed URL:", error);
            return null;
        }
        return data.signedUrl;
    } catch (e) {
        console.error("Exception getting signed URL:", e);
        return null;
    }
};
