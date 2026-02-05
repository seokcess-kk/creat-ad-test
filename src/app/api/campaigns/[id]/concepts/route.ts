import {
  getCampaignById,
  getAnalysisByCampaignId,
  getConceptsByCampaignId,
  createConcepts,
} from '@/lib/db/queries';
import { claude } from '@/lib/ai/claude';
import { withLogging, successResponse, errorResponse } from '@/lib/api-utils';
import type { Platform } from '@/types/database';
import type { DeepAnalysis } from '@/types/ai-advanced';

// GET /api/campaigns/:id/concepts - 컨셉 목록 조회
export const GET = withLogging(async (_request, { log, requestId, params }) => {
  try {
    const id = params?.id;
    if (!id) {
      return errorResponse('캠페인 ID가 필요합니다', requestId, 400);
    }

    log.info('Fetching concepts', { campaignId: id });
    const concepts = await getConceptsByCampaignId(id);
    log.info('Concepts fetched', { campaignId: id, count: concepts.length });

    return successResponse({ success: true, data: concepts }, requestId);
  } catch (error) {
    log.error('Get concepts error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return errorResponse('컨셉 목록을 가져오는데 실패했습니다', requestId, 500);
  }
});

// POST /api/campaigns/:id/concepts - 컨셉 생성
// Query params:
//   - enhanced=true: 플랫폼별 최적화가 포함된 고도화 컨셉 생성
export const POST = withLogging(async (request, { log, requestId, params }) => {
  try {
    const id = params?.id;
    if (!id) {
      return errorResponse('캠페인 ID가 필요합니다', requestId, 400);
    }

    // Query params 파싱
    const url = new URL(request.url);
    const useEnhanced = url.searchParams.get('enhanced') === 'true';

    log.info('Starting concept generation', { campaignId: id, enhanced: useEnhanced });

    // 캠페인 조회
    const campaign = await getCampaignById(id);
    if (!campaign) {
      log.warning('Campaign not found', { campaignId: id });
      return errorResponse('캠페인을 찾을 수 없습니다', requestId, 404);
    }

    // 분석 결과 조회
    const analysis = await getAnalysisByCampaignId(id);
    if (!analysis) {
      log.warning('Analysis not found', { campaignId: id });
      return errorResponse('먼저 분석을 실행해주세요', requestId, 400);
    }

    // 이미 컨셉이 있는지 확인 (고도화 요청 시 기존 컨셉 무시)
    if (!useEnhanced) {
      const existingConcepts = await getConceptsByCampaignId(id);
      if (existingConcepts.length > 0) {
        log.info('Returning existing concepts', { campaignId: id, count: existingConcepts.length });
        return successResponse({
          success: true,
          data: existingConcepts,
          message: '기존 컨셉을 반환합니다',
        }, requestId);
      }
    }

    // Claude API로 컨셉 생성
    let conceptsData;

    if (useEnhanced) {
      // 고도화된 컨셉 생성 (플랫폼별 최적화 포함)
      // 심층 분석 데이터가 있는지 확인 (unknown을 통한 안전한 타입 캐스팅)
      const analysisData = analysis as unknown as Record<string, unknown>;
      const hasDeepAnalysis = !!analysisData.industry_analysis;

      if (hasDeepAnalysis) {
        log.info('Calling Claude API for ENHANCED concepts', { campaignId: id });
        conceptsData = await claude.generateEnhancedConcepts(
          analysis as unknown as DeepAnalysis,
          campaign,
          campaign.platforms as Platform[]
        );
        log.info('Claude enhanced concepts generated', {
          campaignId: id,
          count: conceptsData.length,
          hasPlatformAdaptations: conceptsData[0]?.platform_adaptations?.length > 0,
        });
      } else {
        // 심층 분석이 없으면 기본 컨셉 생성
        log.info('Deep analysis not found, falling back to basic concepts', { campaignId: id });
        conceptsData = await claude.generateConcepts(analysis, campaign);
        log.info('Claude basic concepts generated', { campaignId: id, count: conceptsData.length });
      }
    } else {
      // 기본 컨셉 생성
      log.info('Calling Claude API for basic concepts', { campaignId: id });
      conceptsData = await claude.generateConcepts(analysis, campaign);
      log.info('Claude basic concepts generated', { campaignId: id, count: conceptsData.length });
    }

    // 컨셉 저장
    const concepts = await createConcepts(id, conceptsData);
    log.info('Concepts saved', {
      campaignId: id,
      conceptIds: concepts.map(c => c.id),
      conceptType: useEnhanced ? 'enhanced' : 'basic',
    });

    return successResponse({
      success: true,
      data: concepts,
      conceptType: useEnhanced ? 'enhanced' : 'basic',
    }, requestId);
  } catch (error) {
    log.error('Generate concepts error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return errorResponse(
      `컨셉 생성에 실패했습니다: ${error instanceof Error ? error.message : 'Unknown error'}`,
      requestId,
      500
    );
  }
});
