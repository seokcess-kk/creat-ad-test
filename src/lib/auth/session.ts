import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { isDevMode } from '@/lib/db/supabase';

/**
 * Get authenticated user from server-side session
 * Used in API routes and server components
 */
export async function getServerSession() {
  // 개발 모드에서는 null 반환 (demo-user 사용)
  if (isDevMode) {
    return null;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return null;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const cookieStore = await cookies();
  const accessToken = cookieStore.get('sb-access-token')?.value;

  if (!accessToken) {
    return null;
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(accessToken);

  if (error || !user) {
    return null;
  }

  return user;
}

/**
 * Get user ID from session or return demo user ID for development
 */
export async function getUserIdOrDemo(): Promise<string> {
  const user = await getServerSession();
  return user?.id || 'demo-user';
}
