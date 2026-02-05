/**
 * Zero Script QA - Structured JSON Logger
 *
 * Usage:
 *   import { logger, createRequestLogger } from '@/lib/logger';
 *
 *   // Basic logging
 *   logger.info('User logged in', { userId: '123' });
 *
 *   // With Request ID
 *   const log = createRequestLogger('req_abc123');
 *   log.info('Processing request');
 */

type LogLevel = 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR';

interface LogData {
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  service: string;
  request_id: string;
  message: string;
  data?: LogData;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  DEBUG: 0,
  INFO: 1,
  WARNING: 2,
  ERROR: 3,
};

// 환경별 최소 로그 레벨
const MIN_LEVEL: LogLevel = process.env.NODE_ENV === 'production' ? 'INFO' : 'DEBUG';
const SERVICE_NAME = process.env.SERVICE_NAME || 'web';

/**
 * Request ID 생성
 */
export function generateRequestId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `req_${timestamp}_${random}`;
}

/**
 * 구조화된 JSON 로그 출력
 */
function log(level: LogLevel, message: string, data?: LogData, requestId?: string): void {
  if (LOG_LEVELS[level] < LOG_LEVELS[MIN_LEVEL]) return;

  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    service: SERVICE_NAME,
    request_id: requestId || 'N/A',
    message,
  };

  if (data && Object.keys(data).length > 0) {
    entry.data = data;
  }

  // JSON 형식으로 출력
  const jsonLog = JSON.stringify(entry);

  switch (level) {
    case 'ERROR':
      console.error(jsonLog);
      break;
    case 'WARNING':
      console.warn(jsonLog);
      break;
    default:
      console.log(jsonLog);
  }
}

/**
 * 기본 로거
 */
export const logger = {
  debug: (message: string, data?: LogData) => log('DEBUG', message, data),
  info: (message: string, data?: LogData) => log('INFO', message, data),
  warning: (message: string, data?: LogData) => log('WARNING', message, data),
  error: (message: string, data?: LogData) => log('ERROR', message, data),
};

/**
 * Request ID가 포함된 로거 생성
 */
export function createRequestLogger(requestId: string) {
  return {
    debug: (message: string, data?: LogData) => log('DEBUG', message, data, requestId),
    info: (message: string, data?: LogData) => log('INFO', message, data, requestId),
    warning: (message: string, data?: LogData) => log('WARNING', message, data, requestId),
    error: (message: string, data?: LogData) => log('ERROR', message, data, requestId),
  };
}

/**
 * API 요청/응답 로깅 헬퍼
 */
export function logApiRequest(
  requestId: string,
  method: string,
  path: string,
  params?: Record<string, unknown>
): void {
  log('INFO', 'API Request started', {
    method,
    path,
    ...(params && { params }),
  }, requestId);
}

export function logApiResponse(
  requestId: string,
  status: number,
  durationMs: number,
  error?: string
): void {
  const level: LogLevel = status >= 500 ? 'ERROR' : status >= 400 ? 'WARNING' : 'INFO';
  log(level, 'API Request completed', {
    status,
    duration_ms: Math.round(durationMs),
    ...(error && { error }),
  }, requestId);
}

/**
 * 비즈니스 로직 로깅 헬퍼
 */
export function logBusinessEvent(
  requestId: string,
  event: string,
  data?: LogData
): void {
  log('INFO', event, data, requestId);
}

export function logBusinessError(
  requestId: string,
  error: Error | string,
  context?: LogData
): void {
  const errorMessage = error instanceof Error ? error.message : error;
  const errorStack = error instanceof Error ? error.stack : undefined;

  log('ERROR', 'Business error occurred', {
    error: errorMessage,
    ...(errorStack && { stack: errorStack }),
    ...context,
  }, requestId);
}
