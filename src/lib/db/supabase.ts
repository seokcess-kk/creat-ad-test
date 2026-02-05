import { createBrowserClient } from '@supabase/ssr';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// 환경 변수 확인
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// 개발 모드 여부 (환경 변수가 없으면 개발 모드)
export const isDevMode = !supabaseUrl || !supabaseAnonKey;

// Browser client (클라이언트 컴포넌트용)
export function createSupabaseBrowserClient(): SupabaseClient | null {
  if (isDevMode) return null;
  return createBrowserClient(supabaseUrl!, supabaseAnonKey!);
}

// Server client (서버 컴포넌트/API Route용)
export function createSupabaseServerClient(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseServiceKey) return null;
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// 기본 export (브라우저용) - 개발 모드에서는 null
export const supabase: SupabaseClient | null = isDevMode
  ? null
  : createBrowserClient(supabaseUrl!, supabaseAnonKey!);
