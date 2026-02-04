import { NextRequest, NextResponse } from 'next/server';
import { getCampaignById } from '@/lib/db/queries';

// GET /api/campaigns/:id - 캠페인 상세 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const campaign = await getCampaignById(id);

    if (!campaign) {
      return NextResponse.json(
        {
          success: false,
          error: '캠페인을 찾을 수 없습니다',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: campaign,
    });
  } catch (error) {
    console.error('Get campaign error:', error);
    return NextResponse.json(
      {
        success: false,
        error: '캠페인을 가져오는데 실패했습니다',
      },
      { status: 500 }
    );
  }
}
