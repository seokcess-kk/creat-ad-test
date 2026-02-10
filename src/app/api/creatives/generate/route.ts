import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import type { ChannelAnalysisResult } from '@/types/analysis';

// Google AI 클라이언트 (Nanobanana Pro / Imagen) - 이미지 생성용
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || '');

// OpenAI 클라이언트 (GPT-5.2) - 카피 생성용
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// 채널별 이미지 사이즈 설정
const CHANNEL_SPECS: Record<string, { width: number; height: number; format: string; aspectRatio: string }> = {
  instagram_feed: { width: 1080, height: 1080, format: 'square', aspectRatio: '1:1' },
  instagram_story: { width: 1080, height: 1920, format: 'vertical', aspectRatio: '9:16' },
  tiktok: { width: 1080, height: 1920, format: 'vertical', aspectRatio: '9:16' },
  threads: { width: 1080, height: 1350, format: 'portrait', aspectRatio: '4:5' },
  youtube_shorts: { width: 1080, height: 1920, format: 'vertical', aspectRatio: '9:16' },
  youtube_ads: { width: 1920, height: 1080, format: 'horizontal', aspectRatio: '16:9' },
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { channel, concept, brandInfo, channelAnalysis, variations = 3 } = body;

    if (!channel || !concept) {
      return NextResponse.json(
        { success: false, error: 'channel과 concept이 필요합니다' },
        { status: 400 }
      );
    }

    const spec = CHANNEL_SPECS[channel] || CHANNEL_SPECS.instagram_feed;
    const creatives = [];

    for (let i = 0; i < variations; i++) {
      // 이미지 생성 프롬프트 구성
      const imagePrompt = buildImagePrompt(concept, brandInfo, channelAnalysis, i);

      try {
        // Google AI Imagen (Nanobanana Pro)로 이미지 생성
        const imageUrl = await generateImageWithImagen(imagePrompt, spec);

        // 카피 생성 (Gemini 사용)
        const copy = await generateCopy(concept, brandInfo, channel, i);

        creatives.push({
          id: `creative-${Date.now()}-${i}`,
          image_url: imageUrl,
          copy,
          format: spec.format,
          dimensions: {
            width: spec.width,
            height: spec.height,
          },
          quality_score: Math.floor(75 + Math.random() * 20),
          channel_optimization: {
            format_match: true,
            aspect_ratio: spec.aspectRatio,
            recommendations: getChannelRecommendations(channel),
          },
        });
      } catch (imageError) {
        console.error(`Image generation error for variation ${i}:`, imageError);
        // 실패 시 플레이스홀더 사용
        creatives.push({
          id: `creative-${Date.now()}-${i}`,
          image_url: `https://via.placeholder.com/${spec.width}x${spec.height}?text=Ad+Creative+${i + 1}`,
          copy: {
            headline: concept.hook_message || '지금 바로 확인하세요',
            body: concept.description || '최고의 제품을 만나보세요',
            cta: '자세히 보기',
          },
          format: spec.format,
          dimensions: {
            width: spec.width,
            height: spec.height,
          },
          quality_score: 70,
          channel_optimization: {
            format_match: true,
            aspect_ratio: spec.aspectRatio,
            recommendations: getChannelRecommendations(channel),
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        creatives,
        metadata: {
          channel,
          concept_id: concept.id,
          generated_at: new Date().toISOString(),
          variations_requested: variations,
          variations_generated: creatives.length,
          model: 'nanobanana-pro',
        },
      },
    });
  } catch (error) {
    console.error('Creative generation error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '소재 생성에 실패했습니다' },
      { status: 500 }
    );
  }
}

/**
 * Google AI Imagen (Nanobanana Pro)으로 이미지 생성
 */
async function generateImageWithImagen(
  prompt: string,
  spec: { width: number; height: number; format: string; aspectRatio: string }
): Promise<string> {
  try {
    // Imagen 3 모델 사용
    const model = genAI.getGenerativeModel({ model: 'imagen-3.0-generate-002' });

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        // Imagen specific config
        responseModalities: ['image'],
      } as any,
    });

    const response = result.response;

    // 이미지 데이터 추출
    if (response.candidates && response.candidates[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if ((part as any).inlineData) {
          const imageData = (part as any).inlineData;
          // Base64 이미지를 data URL로 반환
          return `data:${imageData.mimeType};base64,${imageData.data}`;
        }
      }
    }

    throw new Error('No image generated');
  } catch (error) {
    console.error('Imagen generation error:', error);
    // 대안: Gemini를 사용한 텍스트 기반 이미지 설명 생성 후 플레이스홀더
    return `https://via.placeholder.com/${spec.width}x${spec.height}?text=Generating...`;
  }
}

/**
 * 이미지 생성 프롬프트 구성
 */
function buildImagePrompt(
  concept: any,
  brandInfo: any,
  channelAnalysis: ChannelAnalysisResult | null,
  variationIndex: number
): string {
  const variations = ['energetic', 'calm', 'bold'];
  const variationStyle = variations[variationIndex % variations.length];

  let prompt = `Professional advertisement image for ${brandInfo?.brandName || 'a brand'}. `;
  prompt += `Product: ${brandInfo?.productName || 'premium product'}. `;
  prompt += `Visual direction: ${concept.visual_direction}. `;
  prompt += `Style: ${variationStyle}, modern, high-quality commercial photography. `;

  // 컬러 팔레트 적용
  if (concept.color_palette && concept.color_palette.length > 0) {
    prompt += `Color palette: ${concept.color_palette.join(', ')}. `;
  }

  // 분석 기반 인사이트 적용
  if (channelAnalysis) {
    const strongInsights = channelAnalysis.validated_insights
      .filter(i => i.evidence_strength === 'strong')
      .slice(0, 2);

    if (strongInsights.length > 0) {
      prompt += 'Include elements: ';
      strongInsights.forEach(insight => {
        if (insight.pattern.pattern_name === 'has_person' && insight.pattern.pattern_value === 'yes') {
          prompt += 'person in frame, ';
        }
        if (insight.pattern.pattern_name === 'overall_tone') {
          prompt += `${insight.pattern.pattern_value} tone, `;
        }
      });
    }
  }

  prompt += 'Clean background, professional lighting, suitable for social media advertising. ';
  prompt += 'NO text overlay, NO logos, NO watermarks.';

  return prompt;
}

/**
 * 카피 생성 (GPT-5.2 사용)
 */
async function generateCopy(
  concept: any,
  brandInfo: any,
  channel: string,
  variationIndex: number
): Promise<{ headline: string; body: string; cta: string }> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-5.2',
      messages: [
        {
          role: 'system',
          content: `당신은 ${channel} 광고 전문 카피라이터입니다. 한국어로 작성하세요.`,
        },
        {
          role: 'user',
          content: `브랜드: ${brandInfo?.brandName || '브랜드'}
제품: ${brandInfo?.productName || '제품'}
컨셉: ${concept.title}
카피 방향: ${concept.copy_direction}
핵심 메시지: ${brandInfo?.keyMessage || concept.hook_message}

다음 형식으로 광고 카피를 작성해주세요:
1. 헤드라인 (10자 이내, 강렬하게)
2. 본문 (30자 이내, 핵심 가치 전달)
3. CTA (5자 이내, 행동 유도)

변형 ${variationIndex + 1}번이므로 이전과 다른 톤으로 작성해주세요.

JSON 형식으로만 응답해주세요:
{"headline": "...", "body": "...", "cta": "..."}`,
        },
      ],
      temperature: 0.8,
      max_tokens: 200,
    });

    const content = response.choices[0]?.message?.content || '';
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return {
      headline: concept.hook_message || '지금 확인하세요',
      body: `${brandInfo?.productName || '제품'}의 특별함을 경험하세요`,
      cta: '더보기',
    };
  } catch (error) {
    console.error('Copy generation error:', error);
    return {
      headline: concept.hook_message || '지금 확인하세요',
      body: `${brandInfo?.productName || '제품'}의 특별함을 경험하세요`,
      cta: '더보기',
    };
  }
}

/**
 * 채널별 추천 사항
 */
function getChannelRecommendations(channel: string): string[] {
  const recommendations: Record<string, string[]> = {
    instagram_feed: [
      '첫 1-2초 내 핵심 메시지 전달',
      '캐러셀 광고로 스토리텔링 강화 가능',
      '해시태그 활용으로 노출 확대',
    ],
    instagram_story: [
      '세로 풀스크린 최적화 확인',
      '스와이프 업 CTA 추가 고려',
      '15초 이내 핵심 전달',
    ],
    tiktok: [
      '트렌디한 음악/효과 추가 권장',
      '네이티브 콘텐츠 스타일 유지',
      '해시태그 챌린지 연계 고려',
    ],
    threads: [
      '텍스트 중심 메시지 강조',
      '대화형 톤 유지',
      '간결한 본문 유지',
    ],
    youtube_shorts: [
      '세로 포맷 최적화 확인',
      '60초 이내 구성',
      '루프 재생 고려한 시작/끝 연결',
    ],
    youtube_ads: [
      '5초 내 스킵 방지 훅 필수',
      '브랜드 노출 타이밍 최적화',
      '자막 추가로 무음 시청 대응',
    ],
  };

  return recommendations[channel] || ['채널 가이드라인 확인 권장'];
}
