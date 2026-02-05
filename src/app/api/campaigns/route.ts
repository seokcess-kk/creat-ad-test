import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getCampaigns, createCampaign } from '@/lib/db/queries';
import { getUserIdOrDemo } from '@/lib/auth/session';
import { withLogging, successResponse, errorResponse } from '@/lib/api-utils';

const createCampaignSchema = z.object({
  brand_name: z.string().min(1, '브랜드명을 입력해주세요'),
  product_description: z.string().min(10, '제품 설명을 10자 이상 입력해주세요'),
  campaign_goal: z.enum(['awareness', 'conversion', 'engagement', 'traffic']),
  target_audience: z.string().min(1, '타겟 오디언스를 입력해주세요'),
  platforms: z
    .array(
      z.enum([
        'instagram_feed',
        'instagram_story',
        'tiktok',
        'threads',
        'youtube_shorts',
        'youtube_ads',
      ])
    )
    .min(1, '최소 1개의 플랫폼을 선택해주세요'),
});

// GET /api/campaigns - 캠페인 목록 조회
export const GET = withLogging(async (_request, { log, requestId }) => {
  try {
    const userId = await getUserIdOrDemo();
    log.info('Fetching campaigns', { userId });

    const campaigns = await getCampaigns(userId);
    log.info('Campaigns fetched', { count: campaigns.length });

    return successResponse({ success: true, data: campaigns }, requestId);
  } catch (error) {
    log.error('Get campaigns error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return errorResponse('캠페인 목록을 가져오는데 실패했습니다', requestId, 500);
  }
});

// POST /api/campaigns - 캠페인 생성
export const POST = withLogging(async (request: NextRequest, { log, requestId }) => {
  try {
    const body = await request.json();
    log.info('Creating campaign', { brand_name: body.brand_name });

    const validatedData = createCampaignSchema.parse(body);

    const userId = await getUserIdOrDemo();
    log.info('User authenticated', { userId });

    const campaign = await createCampaign(userId, validatedData);
    log.info('Campaign created', { campaignId: campaign.id });

    return successResponse({ success: true, data: campaign }, requestId);
  } catch (error) {
    if (error instanceof z.ZodError) {
      log.warning('Validation error', { issues: error.issues });
      return errorResponse(error.issues[0].message, requestId, 400);
    }

    log.error('Create campaign error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return errorResponse('캠페인 생성에 실패했습니다', requestId, 500);
  }
});
