import { NextRequest, NextResponse } from 'next/server';
import { getCampaignById, updateCampaignStatus, createAnalysis, getAnalysisByCampaignId } from '@/lib/db/queries';
import { claude } from '@/lib/ai/claude';

// POST /api/campaigns/:id/analyze - 캠페인 분석 실행
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 캠페인 조회
    const campaign = await getCampaignById(id);
    if (!campaign) {
      return NextResponse.json(
        { success: false, error: '캠페인을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 이미 분석이 있는지 확인
    const existingAnalysis = await getAnalysisByCampaignId(id);
    if (existingAnalysis) {
      return NextResponse.json({
        success: true,
        data: existingAnalysis,
        message: '기존 분석 결과를 반환합니다',
      });
    }

    // 상태 업데이트
    await updateCampaignStatus(id, 'analyzing');

    // Claude API로 분석 실행
    const analysisResult = await claude.analyzeMarket({
      brandName: campaign.brand_name,
      productDescription: campaign.product_description,
      campaignGoal: campaign.campaign_goal,
      targetAudience: campaign.target_audience,
      platforms: campaign.platforms,
    });

    // 분석 결과 저장
    const analysis = await createAnalysis(id, analysisResult);

    // 상태 업데이트
    await updateCampaignStatus(id, 'planning');

    return NextResponse.json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    console.error('Analyze campaign error:', error);
    return NextResponse.json(
      {
        success: false,
        error: `분석 실행에 실패했습니다: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
      { status: 500 }
    );
  }
}
