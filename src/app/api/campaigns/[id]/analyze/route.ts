import { getCampaignById, updateCampaignStatus, createAnalysis, getAnalysisByCampaignId } from '@/lib/db/queries';
import { claude } from '@/lib/ai/claude';
import { withLogging, successResponse, errorResponse } from '@/lib/api-utils';
import type { Platform } from '@/types/database';

// POST /api/campaigns/:id/analyze - 캠페인 분석 실행
// Query params:
//   - deep=true: 심층 분석 (산업/경쟁사/소비자여정/심리트리거/문화맥락 포함)
//   - industry: 산업 분야 (심층 분석 시)
//   - competitors: 경쟁사 목록 (쉼표 구분)
export const POST = withLogging(async (request, { log, requestId, params }) => {
  try {
    const id = params?.id;
    if (!id) {
      return errorResponse('캠페인 ID가 필요합니다', requestId, 400);
    }

    // Query params 파싱
    const url = new URL(request.url);
    const useDeepAnalysis = url.searchParams.get('deep') === 'true';
    const industry = url.searchParams.get('industry') || undefined;
    const competitorsParam = url.searchParams.get('competitors');
    const competitors = competitorsParam ? competitorsParam.split(',').map(c => c.trim()) : undefined;

    log.info('Starting campaign analysis', {
      campaignId: id,
      deepAnalysis: useDeepAnalysis,
      industry,
      competitors,
    });

    // 캠페인 조회
    const campaign = await getCampaignById(id);
    if (!campaign) {
      log.warning('Campaign not found', { campaignId: id });
      return errorResponse('캠페인을 찾을 수 없습니다', requestId, 404);
    }

    // 이미 분석이 있는지 확인 (심층 분석 요청 시에는 기존 분석 무시)
    if (!useDeepAnalysis) {
      const existingAnalysis = await getAnalysisByCampaignId(id);
      if (existingAnalysis) {
        log.info('Returning existing analysis', { campaignId: id, analysisId: existingAnalysis.id });
        return successResponse({
          success: true,
          data: existingAnalysis,
          message: '기존 분석 결과를 반환합니다',
        }, requestId);
      }
    }

    // 상태 업데이트
    await updateCampaignStatus(id, 'analyzing');
    log.info('Campaign status updated', { campaignId: id, status: 'analyzing' });

    // Claude API로 분석 실행
    let analysisResult;

    if (useDeepAnalysis) {
      // 고도화된 심층 분석
      log.info('Calling Claude API for DEEP analysis', { campaignId: id });
      analysisResult = await claude.analyzeMarketDeep({
        brandName: campaign.brand_name,
        productDescription: campaign.product_description,
        campaignGoal: campaign.campaign_goal,
        targetAudience: campaign.target_audience,
        platforms: campaign.platforms,
        industry,
        competitors,
      });
      log.info('Claude DEEP analysis completed', {
        campaignId: id,
        hasIndustryAnalysis: !!analysisResult.industry_analysis,
        hasCompetitorAnalysis: !!analysisResult.competitor_analysis,
        psychologicalTriggersCount: analysisResult.psychological_triggers?.length || 0,
      });
    } else {
      // 기본 분석
      log.info('Calling Claude API for basic analysis', { campaignId: id });
      analysisResult = await claude.analyzeMarket({
        brandName: campaign.brand_name,
        productDescription: campaign.product_description,
        campaignGoal: campaign.campaign_goal,
        targetAudience: campaign.target_audience,
        platforms: campaign.platforms,
      });
      log.info('Claude basic analysis completed', { campaignId: id });
    }

    // 분석 결과 저장 (기본 필드만 DB에 저장, 심층 분석 데이터는 응답에만 포함)
    const basicFields = {
      target_persona: analysisResult.target_persona,
      platform_guidelines: analysisResult.platform_guidelines,
      trend_insights: analysisResult.trend_insights,
    };
    const analysis = await createAnalysis(id, basicFields);

    // 심층 분석 데이터를 응답용 객체에 병합
    const fullAnalysisResult = useDeepAnalysis
      ? { ...analysis, ...analysisResult }
      : analysis;

    log.info('Analysis saved', {
      campaignId: id,
      analysisId: analysis.id,
      analysisType: useDeepAnalysis ? 'deep' : 'basic',
      hasDeepData: useDeepAnalysis,
    });

    // 상태 업데이트
    await updateCampaignStatus(id, 'planning');
    log.info('Campaign status updated', { campaignId: id, status: 'planning' });

    return successResponse({
      success: true,
      data: fullAnalysisResult,
      analysisType: useDeepAnalysis ? 'deep' : 'basic',
    }, requestId);
  } catch (error) {
    // 에러 메시지 추출 (Supabase 에러, 일반 에러, 문자열 등 처리)
    let errorMessage = 'Unknown error';
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (error && typeof error === 'object') {
      // Supabase PostgrestError 등
      errorMessage = (error as { message?: string; details?: string }).message
        || (error as { details?: string }).details
        || JSON.stringify(error);
    } else if (typeof error === 'string') {
      errorMessage = error;
    }

    log.error('Analyze campaign error', {
      error: errorMessage,
      errorType: error?.constructor?.name,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return errorResponse(
      `분석 실행에 실패했습니다: ${errorMessage}`,
      requestId,
      500
    );
  }
});
