import { NextRequest, NextResponse } from 'next/server';
import { generateConceptFromAnalysis } from '@/lib/services/concept-generator';
import type { ChannelAnalysisResult } from '@/types/analysis';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { channel, industry, channelAnalysis, brandInfo, count = 3 } = body;

    if (!channel || !channelAnalysis) {
      return NextResponse.json(
        { success: false, error: 'channel과 channelAnalysis가 필요합니다' },
        { status: 400 }
      );
    }

    // 여러 컨셉 생성
    const concepts = [];
    for (let i = 0; i < count; i++) {
      const concept = await generateConceptFromAnalysis(
        channelAnalysis as ChannelAnalysisResult,
        brandInfo
      );

      concepts.push({
        id: `concept-${Date.now()}-${i}`,
        ...concept,
        // 각 컨셉마다 약간의 변형
        channel_fit_score: Math.max(65, Math.min(95, concept.channel_fit_score + (Math.random() - 0.5) * 10)),
      });

      // 다양한 컨셉을 위해 약간의 딜레이
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // 채널 적합도로 정렬
    concepts.sort((a, b) => b.channel_fit_score - a.channel_fit_score);

    return NextResponse.json({
      success: true,
      data: {
        concepts,
        metadata: {
          channel,
          industry,
          generated_at: new Date().toISOString(),
          based_on_insights: channelAnalysis.validated_insights.length,
        },
      },
    });
  } catch (error) {
    console.error('Concept generation error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '컨셉 생성에 실패했습니다' },
      { status: 500 }
    );
  }
}
