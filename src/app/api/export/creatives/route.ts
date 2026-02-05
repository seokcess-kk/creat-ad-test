// GET /api/export/creatives - 소재 목록 내보내기
// Feature: export-api

import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  exportService,
  formatService,
  authenticateExportRequest,
  createAuthErrorResponse,
} from '@/lib/export';
import type { ExportCreativesQuery, ExportCreativesResponse } from '@/types/export';

// 쿼리 파라미터 스키마
const QuerySchema = z.object({
  format: z.enum(['json', 'csv']).default('json'),
  platform: z
    .enum([
      'instagram_feed',
      'instagram_story',
      'tiktok',
      'threads',
      'youtube_shorts',
      'youtube_ads',
    ])
    .optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  limit: z.coerce.number().min(1).max(1000).default(100),
  offset: z.coerce.number().min(0).default(0),
  include_metadata: z
    .string()
    .optional()
    .transform((v) => v !== 'false'),
});

export async function GET(request: NextRequest) {
  const requestId = `exp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

  try {
    // 1. 인증
    const authResult = await authenticateExportRequest(request);
    if (!authResult.success) {
      return createAuthErrorResponse(authResult.error, authResult.code, requestId);
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

    const query: ExportCreativesQuery = {
      format: parseResult.data.format,
      platform: parseResult.data.platform,
      from: parseResult.data.from,
      to: parseResult.data.to,
      limit: parseResult.data.limit,
      offset: parseResult.data.offset,
      include_metadata: parseResult.data.include_metadata,
    };

    // 3. 데이터 조회
    const { creatives, total } = await exportService.getCreatives(
      authResult.userId,
      query
    );

    // 4. 응답 생성
    const exportInfo = {
      exported_at: new Date().toISOString(),
      format: query.format || 'json',
      filters_applied: {
        ...(query.platform && { platform: query.platform }),
        ...(query.from && { from: query.from }),
        ...(query.to && { to: query.to }),
      },
      total_count: total,
    };

    // CSV 포맷
    if (query.format === 'csv') {
      const csv = formatService.toCSV(creatives);
      return new Response(csv, {
        status: 200,
        headers: {
          'Content-Type': formatService.getContentType('csv'),
          'Content-Disposition': formatService.getContentDisposition('creatives', 'csv'),
          'X-Request-ID': requestId,
          'X-Total-Count': total.toString(),
        },
      });
    }

    // JSON 포맷 (기본)
    const response: ExportCreativesResponse = {
      success: true,
      data: {
        total,
        limit: query.limit || 100,
        offset: query.offset || 0,
        creatives,
      },
      export_info: exportInfo,
    };

    return Response.json(response, {
      status: 200,
      headers: {
        'X-Request-ID': requestId,
        'X-Total-Count': total.toString(),
      },
    });
  } catch (error) {
    console.error('Export creatives error:', error);

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
