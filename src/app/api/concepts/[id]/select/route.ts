import { selectConcept } from '@/lib/db/queries';
import { withLogging, successResponse, errorResponse } from '@/lib/api-utils';

// PUT /api/concepts/:id/select - 컨셉 선택
export const PUT = withLogging(async (_request, { log, requestId, params }) => {
  try {
    const id = params?.id;
    if (!id) {
      return errorResponse('컨셉 ID가 필요합니다', requestId, 400);
    }

    log.info('Selecting concept', { conceptId: id });
    const concept = await selectConcept(id);
    log.info('Concept selected', { conceptId: id, campaignId: concept.campaign_id });

    return successResponse({ success: true, data: concept }, requestId);
  } catch (error) {
    log.error('Select concept error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return errorResponse('컨셉 선택에 실패했습니다', requestId, 500);
  }
});
