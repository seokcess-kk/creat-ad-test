import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getCampaigns, createCampaign } from '@/lib/db/queries';
import { getUserIdOrDemo } from '@/lib/auth/session';

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
export async function GET() {
  try {
    // Get authenticated user ID or demo user for development
    const userId = await getUserIdOrDemo();
    const campaigns = await getCampaigns(userId);

    return NextResponse.json({
      success: true,
      data: campaigns,
    });
  } catch (error) {
    console.error('Get campaigns error:', error);
    return NextResponse.json(
      {
        success: false,
        error: '캠페인 목록을 가져오는데 실패했습니다',
      },
      { status: 500 }
    );
  }
}

// POST /api/campaigns - 캠페인 생성
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = createCampaignSchema.parse(body);

    // Get authenticated user ID or demo user for development
    const userId = await getUserIdOrDemo();

    const campaign = await createCampaign(userId, validatedData);

    return NextResponse.json({
      success: true,
      data: campaign,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: error.issues[0].message,
        },
        { status: 400 }
      );
    }

    console.error('Create campaign error:', error);
    return NextResponse.json(
      {
        success: false,
        error: '캠페인 생성에 실패했습니다',
      },
      { status: 500 }
    );
  }
}
