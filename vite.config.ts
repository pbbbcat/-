
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // 加载环境变量（本地从 .env 加载，云端从系统变量加载）
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      // 这里的映射确保了代码中的 process.env.API_KEY 能被替换为真实的值
      'process.env.API_KEY': JSON.stringify(env.API_KEY || ""),
      'process.env.SUPABASE_URL': JSON.stringify(env.SUPABASE_URL || ""),
      'process.env.SUPABASE_KEY': JSON.stringify(env.SUPABASE_KEY || ""),
      'process.env.NODE_ENV': JSON.stringify(mode),
    },
    build: {
      outDir: 'dist',
      rollupOptions: {
        input: {
          main: './index.html'
        }
      }
    }
  };
});
