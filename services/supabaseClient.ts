
import { createClient } from '@supabase/supabase-js';

const getEnv = (key: string, viteKey: string, vercelKey: string, fallback: string) => {
  // 1. 尝试 Vite 特有的环境变量访问方式
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      const val = import.meta.env[key] || import.meta.env[viteKey] || import.meta.env[vercelKey];
      if (val) return val;
    }
  } catch (e) {}

  // 2. 尝试传统的 process.env 访问方式
  try {
    if (typeof process !== 'undefined' && process.env) {
      const val = process.env[key] || process.env[viteKey] || process.env[vercelKey];
      if (val) return val;
    }
  } catch (e) {}

  return fallback;
};

const supabaseUrl = getEnv('SUPABASE_URL', 'VITE_SUPABASE_URL', 'SUPABASE_URL', 'https://jgotbqvymecdxnqlgouo.supabase.co');
// 增加对 SUPABASE_ANON_KEY 的支持
const supabaseKey = getEnv('SUPABASE_KEY', 'VITE_SUPABASE_ANON_KEY', 'SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impnb3RicXZ5bWVjZHhucWxnb3VvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDA1Mzg0NSwiZXhwIjoyMDc5NjI5ODQ1fQ.YSS2vtyMbwYt2bCHnlKhGGmqud0vH_Ma1ZbYk2X1I2I');

export const supabase = createClient(supabaseUrl, supabaseKey);

export const getPublicFileUrl = (bucket: string, path: string): string => {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
};

export const getSignedFileUrl = async (bucket: string, path: string): Promise<string | null> => {
    try {
        const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 60);
        if (error) return null;
        return data.signedUrl;
    } catch (e) {
        return null;
    }
};

export const uploadFile = async (bucket: string, path: string, file: File) => {
    const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
        upsert: true
    });
    if (error) throw error;
    return data;
};
