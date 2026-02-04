import { NextRequest, NextResponse } from 'next/server';
import {
  getCampaignById,
  getAnalysisByCampaignId,
  getConceptsByCampaignId,
  createConcepts,
} from '@/lib/db/queries';
import { claude } from '@/lib/ai/claude';

// GET /api/campaigns/:id/concepts - 컨셉 목록 조회
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const concepts = await getConceptsByCampaignId(id);

    return NextResponse.json({
      success: true,
      data: concepts,
    });
  } catch (error) {
    console.error('Get concepts error:', error);
    return NextResponse.json(
      { success: false, error: '컨셉 목록을 가져오는데 실패했습니다' },
      { status: 500 }
    );
  }
}

// POST /api/campaigns/:id/concepts - 컨셉 생성
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

    // 분석 결과 조회
    const analysis = await getAnalysisByCampaignId(id);
    if (!analysis) {
      return NextResponse.json(
        { success: false, error: '먼저 분석을 실행해주세요' },
        { status: 400 }
      );
    }

    // 이미 컨셉이 있는지 확인
    const existingConcepts = await getConceptsByCampaignId(id);
    if (existingConcepts.length > 0) {
      return NextResponse.json({
        success: true,
        data: existingConcepts,
        message: '기존 컨셉을 반환합니다',
      });
    }

    // Claude API로 컨셉 생성
    const conceptsData = await claude.generateConcepts(analysis, campaign);

    // 컨셉 저장
    const concepts = await createConcepts(id, conceptsData);

    return NextResponse.json({
      success: true,
      data: concepts,
    });
  } catch (error) {
    console.error('Generate concepts error:', error);
    return NextResponse.json(
      {
        success: false,
        error: `컨셉 생성에 실패했습니다: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
      { status: 500 }
    );
  }
}
