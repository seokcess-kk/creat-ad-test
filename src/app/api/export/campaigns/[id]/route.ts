// GET /api/export/campaigns/:id - 캠페인별 내보내기
// Feature: export-api

import { NextRequest } from 'next/server';
import { z } from 'zod';
import {
  exportService,
  formatService,
  authenticateExportRequest,
  createAuthErrorResponse,
} from '@/lib/export';
import type { ExportCampaignQuery, ExportCampaignResponse } from '@/types/export';

// 쿼리 파라미터 스키마
const QuerySchema = z.object({
  format: z.enum(['json', 'csv']).default('json'),
  include_analysis: z
    .string()
    .optional()
    .transform((v) => v === 'true'),
  include_concepts: z
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
    // 1. 캠페인 ID 추출
    const { id: campaignId } = await params;

    if (!campaignId) {
      return Response.json(
        {
          success: false,
          error: {
            code: 'INVALID_PARAMS',
            message: 'Campaign ID is required',
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

    const query: ExportCampaignQuery = {
      format: parseResult.data.format,
      include_analysis: parseResult.data.include_analysis,
      include_concepts: parseResult.data.include_concepts,
    };

    // 4. 데이터 조회
    const result = await exportService.getCampaignExport(
      authResult.userId,
      campaignId,
      query
    );

    // 5. 응답 생성
    const exportInfo = {
      exported_at: new Date().toISOString(),
      format: query.format || 'json',
      filters_applied: {
        campaign_id: campaignId,
        include_analysis: query.include_analysis,
        include_concepts: query.include_concepts,
      },
      total_count: result.summary.total_creatives,
    };

    // CSV 포맷 (소재만 내보내기)
    if (query.format === 'csv') {
      const csv = formatService.toCSV(result.creatives);
      return new Response(csv, {
        status: 200,
        headers: {
          'Content-Type': formatService.getContentType('csv'),
          'Content-Disposition': formatService.getContentDisposition(
            `campaign_${campaignId.slice(0, 8)}`,
            'csv'
          ),
          'X-Request-ID': requestId,
          'X-Total-Count': result.summary.total_creatives.toString(),
        },
      });
    }

    // JSON 포맷 (기본)
    const response: ExportCampaignResponse = {
      success: true,
      data: {
        campaign: result.campaign,
        ...(query.include_analysis && { analysis: result.analysis }),
        ...(query.include_concepts && { concepts: result.concepts }),
        creatives: result.creatives,
        summary: result.summary,
      },
      export_info: exportInfo,
    };

    return Response.json(response, {
      status: 200,
      headers: {
        'X-Request-ID': requestId,
        'X-Total-Count': result.summary.total_creatives.toString(),
      },
    });
  } catch (error) {
    console.error('Export campaign error:', error);

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
