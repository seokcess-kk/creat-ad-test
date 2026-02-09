// GET /api/export/creatives/:id - 개별 소재 상세 조회
// Feature: export-api (P1)

import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  exportService,
  formatService,
  authenticateExportRequest,
  createAuthErrorResponse,
} from '@/lib/export';
import type { ExportCreativeDetailResponse } from '@/types/export';

// 쿼리 파라미터 스키마
const QuerySchema = z.object({
  format: z.enum(['json', 'csv']).default('json'),
  include_metadata: z
    .string()
    .optional()
    .transform((v) => v !== 'false'),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = `exp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

  try {
    // 1. 소재 ID 추출
    const { id: creativeId } = await params;

    if (!creativeId) {
      return Response.json(
        {
          success: false,
          error: {
            code: 'INVALID_PARAMS',
            message: 'Creative ID is required',
          },
          requestId,
        },
        { status: 400 }
      );
    }

    // 2. 인증
    const authResult = await authenticateExportRequest(request);
    if (!authResult.success) {
      return createAuthErrorResponse(authResult.error, authResult.code, requestId);
    }

    // 3. 쿼리 파라미터 파싱
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

    const query = {
      format: parseResult.data.format,
      include_metadata: parseResult.data.include_metadata,
    };

    // 4. 데이터 조회
    const creative = await exportService.getCreativeById(
      authResult.userId,
      creativeId,
      query
    );

    // 5. 응답 생성
    const exportInfo = {
      exported_at: new Date().toISOString(),
      format: query.format || 'json',
      filters_applied: {
        creative_id: creativeId,
        include_metadata: query.include_metadata,
      },
    };

    // CSV 포맷
    if (query.format === 'csv') {
      const csv = formatService.toCSV([creative]);
      return new Response(csv, {
        status: 200,
        headers: {
          'Content-Type': formatService.getContentType('csv'),
          'Content-Disposition': formatService.getContentDisposition(
            `creative_${creativeId.slice(0, 8)}`,
            'csv'
          ),
          'X-Request-ID': requestId,
        },
      });
    }

    // JSON 포맷 (기본)
    const response: ExportCreativeDetailResponse = {
      success: true,
      data: creative,
      export_info: exportInfo,
    };

    return Response.json(response, {
      status: 200,
      headers: {
        'X-Request-ID': requestId,
      },
    });
  } catch (error) {
    console.error('Export creative detail error:', error);

    const message = error instanceof Error ? error.message : 'Internal server error';
    const status = message.includes('not found') ? 404 : message.includes('Unauthorized') ? 403 : 500;

    return Response.json(
      {
        success: false,
        error: {
          code: status === 404 ? 'NOT_FOUND' : status === 403 ? 'FORBIDDEN' : 'INTERNAL_ERROR',
          message,
        },
        requestId,
      },
      { status }
    );
  }
}
