import { getCampaignById, updateCampaignStatus, createAnalysis, getAnalysisByCampaignId } from '@/lib/db/queries';
import { claude } from '@/lib/ai/claude';
import { withLogging, successResponse, errorResponse } from '@/lib/api-utils';

// POST /api/campaigns/:id/analyze - 캠페인 분석 실행
export const POST = withLogging(async (_request, { log, requestId, params }) => {
  try {
    const id = params?.id;
    if (!id) {
      return errorResponse('캠페인 ID가 필요합니다', requestId, 400);
    }

    log.info('Starting campaign analysis', { campaignId: id });

    // 캠페인 조회
    const campaign = await getCampaignById(id);
    if (!campaign) {
      log.warning('Campaign not found', { campaignId: id });
      return errorResponse('캠페인을 찾을 수 없습니다', requestId, 404);
    }

    // 이미 분석이 있는지 확인
    const existingAnalysis = await getAnalysisByCampaignId(id);
    if (existingAnalysis) {
      log.info('Returning existing analysis', { campaignId: id, analysisId: existingAnalysis.id });
      return successResponse({
        success: true,
        data: existingAnalysis,
        message: '기존 분석 결과를 반환합니다',
      }, requestId);
    }

    // 상태 업데이트
    await updateCampaignStatus(id, 'analyzing');
    log.info('Campaign status updated', { campaignId: id, status: 'analyzing' });

    // Claude API로 분석 실행
    log.info('Calling Claude API for analysis', { campaignId: id });
    const analysisResult = await claude.analyzeMarket({
      brandName: campaign.brand_name,
      productDescription: campaign.product_description,
      campaignGoal: campaign.campaign_goal,
      targetAudience: campaign.target_audience,
      platforms: campaign.platforms,
    });
    log.info('Claude analysis completed', { campaignId: id });

    // 분석 결과 저장
    const analysis = await createAnalysis(id, analysisResult);
    log.info('Analysis saved', { campaignId: id, analysisId: analysis.id });

    // 상태 업데이트
    await updateCampaignStatus(id, 'planning');
    log.info('Campaign status updated', { campaignId: id, status: 'planning' });

    return successResponse({ success: true, data: analysis }, requestId);
  } catch (error) {
    log.error('Analyze campaign error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return errorResponse(
      `분석 실행에 실패했습니다: ${error instanceof Error ? error.message : 'Unknown error'}`,
      requestId,
      500
    );
  }
});
