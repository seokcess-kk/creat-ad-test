/**
 * Zero Script QA - API Route Utilities
 *
 * Usage:
 *   import { withLogging } from '@/lib/api-utils';
 *
 *   export const POST = withLogging(async (req, { log, requestId }) => {
 *     log.info('Processing...');
 *     return Response.json({ success: true });
 *   });
 */

import { NextRequest, NextResponse } from 'next/server';
import { createRequestLogger, generateRequestId, logApiRequest, logApiResponse } from './logger';

type RequestLogger = ReturnType<typeof createRequestLogger>;

interface HandlerContext {
  log: RequestLogger;
  requestId: string;
  params?: Record<string, string>;
}

type ApiHandler = (
  request: NextRequest,
  context: HandlerContext
) => Promise<Response>;

/**
 * 로깅이 포함된 API 핸들러 래퍼
 */
export function withLogging(handler: ApiHandler) {
  return async (
    request: NextRequest,
    routeContext?: { params?: Promise<Record<string, string>> }
  ): Promise<Response> => {
    const requestId = request.headers.get('X-Request-ID') || generateRequestId();
    const log = createRequestLogger(requestId);
    const startTime = Date.now();
    const path = request.nextUrl.pathname;
    const method = request.method;

    // 요청 파라미터 추출
    let params: Record<string, string> | undefined;
    try {
      params = routeContext?.params ? await routeContext.params : undefined;
    } catch {
      params = undefined;
    }

    // 요청 로깅
    logApiRequest(requestId, method, path, params);

    try {
      const response = await handler(request, { log, requestId, params });
      const duration = Date.now() - startTime;

      // 응답 로깅
      logApiResponse(requestId, response.status, duration);

      // 응답에 Request ID 헤더 추가
      const newResponse = new Response(response.body, response);
      newResponse.headers.set('X-Request-ID', requestId);

      return newResponse;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // 에러 로깅
      log.error('Unhandled error', {
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
      });
      logApiResponse(requestId, 500, duration, errorMessage);

      return NextResponse.json(
        { error: 'Internal server error', requestId },
        {
          status: 500,
          headers: { 'X-Request-ID': requestId },
        }
      );
    }
  };
}

/**
 * 성공 응답 헬퍼
 */
export function successResponse<T>(data: T, requestId: string, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { 'X-Request-ID': requestId },
  });
}

/**
 * 에러 응답 헬퍼
 */
export function errorResponse(
  message: string,
  requestId: string,
  status = 400
) {
  return NextResponse.json(
    { error: message, requestId },
    {
      status,
      headers: { 'X-Request-ID': requestId },
    }
  );
}
