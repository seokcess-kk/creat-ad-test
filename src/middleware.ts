/**
 * Zero Script QA - Next.js Middleware
 * Request ID 생성 및 전파
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function generateRequestId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `req_${timestamp}_${random}`;
}

export function middleware(request: NextRequest) {
  // 기존 Request ID 사용 또는 새로 생성
  const requestId = request.headers.get('X-Request-ID') || generateRequestId();

  // 요청 헤더에 Request ID 추가
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('X-Request-ID', requestId);

  // 응답에도 Request ID 포함
  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  response.headers.set('X-Request-ID', requestId);

  return response;
}

// API 라우트에만 적용
export const config = {
  matcher: '/api/:path*',
};
