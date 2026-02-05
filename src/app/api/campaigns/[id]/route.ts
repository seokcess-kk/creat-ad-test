import { getCampaignById } from '@/lib/db/queries';
import { withLogging, successResponse, errorResponse } from '@/lib/api-utils';

// GET /api/campaigns/:id - 캠페인 상세 조회
export const GET = withLogging(async (_request, { log, requestId, params }) => {
  try {
    const id = params?.id;
    if (!id) {
      return errorResponse('캠페인 ID가 필요합니다', requestId, 400);
    }

    log.info('Fetching campaign', { campaignId: id });
    const campaign = await getCampaignById(id);

    if (!campaign) {
      log.warning('Campaign not found', { campaignId: id });
      return errorResponse('캠페인을 찾을 수 없습니다', requestId, 404);
    }

    log.info('Campaign fetched', { campaignId: id, status: campaign.status });
    return successResponse({ success: true, data: campaign }, requestId);
  } catch (error) {
    log.error('Get campaign error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return errorResponse('캠페인을 가져오는데 실패했습니다', requestId, 500);
  }
});
