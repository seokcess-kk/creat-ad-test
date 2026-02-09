// GET /api/export/batch - 일괄 내보내기
// Feature: export-api (P1)

import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  exportService,
  formatService,
  authenticateExportRequest,
  createAuthErrorResponse,
} from '@/lib/export';
import type { ExportBatchQuery, ExportBatchResponse } from '@/types/export';

// 쿼리 파라미터 스키마
const QuerySchema = z.object({
  from: z.string().datetime({ message: 'from must be a valid ISO 8601 datetime' }),
  to: z.string().datetime({ message: 'to must be a valid ISO 8601 datetime' }),
  format: z.enum(['json', 'csv']).default('json'),
  campaigns: z
    .string()
    .optional()
    .transform((s) => (s ? s.split(',').filter(Boolean) : undefined)),
});

export async function GET(request: NextRequest) {
  const requestId = `exp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

  try {
    // 1. 인증 (API Key only for batch exports)
    const authResult = await authenticateExportRequest(request);
    if (!authResult.success) {
      return createAuthErrorResponse(authResult.error, authResult.code, requestId);
    }

    // Batch export는 API Key만 허용 (보안 강화)
    if (authResult.authType !== 'apikey') {
      return Response.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Batch export requires API Key authentication',
            details: {
              hint: 'Use X-API-Key header for batch operations',
            },
          },
          requestId,
        },
        { status: 403 }
      );
    }

    // 2. 쿼리 파라미터 파싱
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const parseResult = QuerySchema.safeParse(searchParams);

    if (!parseResult.success) {
      return Response.json(
        {
          success: false,
          error: {
            code: 'INVALID_PARAMS',
            message: 'Invalid query parameters',
            details: parseResult.error.flatten().fieldErrors,
          },
          requestId,
        },
        { status: 400 }
      );
    }

    const query: ExportBatchQuery = {
      from: parseResult.data.from,
      to: parseResult.data.to,
      format: parseResult.data.format,
      campaigns: parseResult.data.campaigns,
    };

    // 3. 날짜 범위 검증 (최대 90일)
    const fromDate = new Date(query.from);
    const toDate = new Date(query.to);
    const daysDiff = (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24);

    if (daysDiff > 90) {
      return Response.json(
        {
          success: false,
          error: {
            code: 'INVALID_PARAMS',
            message: 'Date range cannot exceed 90 days',
            details: {
              from: query.from,
              to: query.to,
              days: Math.ceil(daysDiff),
              max_days: 90,
            },
          },
          requestId,
        },
        { status: 400 }
      );
    }

    if (fromDate > toDate) {
      return Response.json(
        {
          success: false,
          error: {
            code: 'INVALID_PARAMS',
            message: 'from date must be before to date',
          },
          requestId,
        },
        { status: 400 }
      );
    }

    // 4. 데이터 조회
    const result = await exportService.getBatchExport(authResult.userId, query);

    // 5. 응답 생성
    const exportInfo = {
      exported_at: new Date().toISOString(),
      format: query.format || 'json',
      filters_applied: {
        from: query.from,
        to: query.to,
        ...(query.campaigns && { campaigns: query.campaigns }),
      },
      total_count: result.creatives_count,
    };

    // CSV 포맷 (모든 소재를 플랫한 형태로)
    if (query.format === 'csv') {
      const allCreatives = result.campaigns.flatMap((c) => c.creatives);
      const csv = formatService.toCSV(allCreatives);

      return new Response(csv, {
        status: 200,
        headers: {
          'Content-Type': formatService.getContentType('csv'),
          'Content-Disposition': formatService.getContentDisposition('batch_export', 'csv'),
          'X-Request-ID': requestId,
          'X-Total-Campaigns': result.campaigns_count.toString(),
          'X-Total-Creatives': result.creatives_count.toString(),
        },
      });
    }

    // JSON 포맷 (기본)
    const response: ExportBatchResponse = {
      success: true,
      data: {
        campaigns_count: result.campaigns_count,
        creatives_count: result.creatives_count,
        campaigns: result.campaigns,
      },
      export_info: exportInfo,
    };

    return Response.json(response, {
      status: 200,
      headers: {
        'X-Request-ID': requestId,
        'X-Total-Campaigns': result.campaigns_count.toString(),
        'X-Total-Creatives': result.creatives_count.toString(),
      },
    });
  } catch (error) {
    console.error('Batch export error:', error);

    return Response.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Internal server error',
        },
        requestId,
      },
      { status: 500 }
    );
  }
}
