/**
 * Zero Script QA - API Client with Logging
 *
 * Usage:
 *   import { apiClient } from '@/lib/api-client';
 *
 *   const data = await apiClient('/campaigns', {
 *     method: 'POST',
 *     body: JSON.stringify({ name: 'Test' }),
 *   });
 */

import { generateRequestId, logApiRequest, logApiResponse } from './logger';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public requestId: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface ApiClientOptions extends RequestInit {
  timeout?: number;
}

/**
 * 로깅이 통합된 API 클라이언트
 */
export async function apiClient<T = unknown>(
  endpoint: string,
  options: ApiClientOptions = {}
): Promise<{ data: T; requestId: string }> {
  const requestId = generateRequestId();
  const startTime = Date.now();
  const method = options.method || 'GET';
  const { timeout = 30000, ...fetchOptions } = options;

  // 요청 로깅
  logApiRequest(requestId, method, endpoint);

  // AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(endpoint, {
      ...fetchOptions,
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': requestId,
        ...fetchOptions.headers,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const duration = Date.now() - startTime;

    // 응답 파싱
    let data: T;
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      data = await response.json();
    } else {
      data = (await response.text()) as unknown as T;
    }

    // 응답 로깅 (200 OK도 포함!)
    logApiResponse(requestId, response.status, duration);

    if (!response.ok) {
      const errorMessage = typeof data === 'object' && data !== null && 'error' in data
        ? String((data as { error: unknown }).error)
        : `HTTP ${response.status}`;

      logApiResponse(requestId, response.status, duration, errorMessage);
      throw new ApiError(errorMessage, response.status, requestId);
    }

    return { data, requestId };
  } catch (error) {
    clearTimeout(timeoutId);
    const duration = Date.now() - startTime;

    if (error instanceof ApiError) {
      throw error;
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logApiResponse(requestId, 0, duration, errorMessage);

    throw new ApiError(errorMessage, 0, requestId);
  }
}

/**
 * GET 요청 헬퍼
 */
export function apiGet<T = unknown>(endpoint: string, options?: ApiClientOptions) {
  return apiClient<T>(endpoint, { ...options, method: 'GET' });
}

/**
 * POST 요청 헬퍼
 */
export function apiPost<T = unknown>(
  endpoint: string,
  body: unknown,
  options?: ApiClientOptions
) {
  return apiClient<T>(endpoint, {
    ...options,
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/**
 * PUT 요청 헬퍼
 */
export function apiPut<T = unknown>(
  endpoint: string,
  body: unknown,
  options?: ApiClientOptions
) {
  return apiClient<T>(endpoint, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

/**
 * DELETE 요청 헬퍼
 */
export function apiDelete<T = unknown>(endpoint: string, options?: ApiClientOptions) {
  return apiClient<T>(endpoint, { ...options, method: 'DELETE' });
}
