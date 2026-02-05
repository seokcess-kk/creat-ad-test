// Export Auth Middleware
// Feature: export-api

import { NextRequest } from 'next/server';
import { createSupabaseServerClient } from '@/lib/db/supabase';

export type AuthType = 'bearer' | 'apikey';

export type AuthResult =
  | { success: true; userId: string; authType: AuthType }
  | { success: false; error: string; code: number };

/**
 * Export API 요청 인증
 *
 * 지원 인증 방식:
 * 1. Bearer Token (Authorization: Bearer {token}) - Supabase Auth
 * 2. API Key (X-API-Key: {key}) - 시스템 연동용 (Phase 2)
 */
export async function authenticateExportRequest(
  request: NextRequest
): Promise<AuthResult> {
  // 1. API Key 확인 (X-API-Key 헤더)
  const apiKey = request.headers.get('X-API-Key');
  if (apiKey) {
    const result = await validateApiKey(apiKey);
    if (result.valid && result.userId) {
      return { success: true, userId: result.userId, authType: 'apikey' };
    }
  }

  // 2. Bearer Token 확인 (Authorization 헤더)
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    try {
      const supabase = createSupabaseServerClient();
      if (!supabase) {
        // 개발 모드 - Supabase 없음
        return { success: true, userId: 'demo-user', authType: 'bearer' };
      }
      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (user && !error) {
        return { success: true, userId: user.id, authType: 'bearer' };
      }
    } catch {
      // Token validation failed
    }
  }

  // 3. 개발 모드 데모 사용자 (인증 없이 접근 허용)
  if (process.env.IS_DEV_MODE === 'true') {
    return { success: true, userId: 'demo-user', authType: 'bearer' };
  }

  // 4. 인증 실패
  return {
    success: false,
    error: 'Unauthorized. Provide Bearer token or API key.',
    code: 401,
  };
}

/**
 * API Key 검증
 * Phase 2에서 데이터베이스 기반으로 확장 가능
 */
async function validateApiKey(
  apiKey: string
): Promise<{ valid: boolean; userId?: string }> {
  // 환경 변수로 단일 키 검증 (MVP)
  const systemApiKey = process.env.EXPORT_API_KEY;

  if (systemApiKey && apiKey === systemApiKey) {
    // 시스템 API Key - 모든 데이터 접근 가능
    return { valid: true, userId: 'system' };
  }

  return { valid: false };
}

/**
 * 에러 응답 생성
 */
export function createAuthErrorResponse(
  error: string,
  code: number,
  requestId: string
) {
  return Response.json(
    {
      success: false,
      error: {
        code: code === 401 ? 'UNAUTHORIZED' : 'FORBIDDEN',
        message: error,
      },
      requestId,
    },
    {
      status: code,
      headers: {
        'X-Request-ID': requestId,
      },
    }
  );
}
