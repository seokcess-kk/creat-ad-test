import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/db/supabase';
import { createCreatives, getCampaignById } from '@/lib/db/queries';
import { nanoBanana } from '@/lib/ai/nano-banana';
import { claude } from '@/lib/ai/claude';
import type { Platform, Creative } from '@/types/database';

const generateSchema = z.object({
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
    .min(1),
  include_copy: z.boolean().default(true),
  resolution: z.enum(['2k', '4k']).default('2k'),
  variations: z.number().min(1).max(4).default(2),
});

// POST /api/concepts/:id/generate - 소재 생성
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conceptId } = await params;
    const body = await request.json();
    const { platforms, include_copy, resolution, variations } =
      generateSchema.parse(body);

    // 컨셉 조회
    const supabase = createSupabaseServerClient();
    const { data: concept, error: conceptError } = await supabase
      .from('concepts')
      .select('*, campaigns(*)')
      .eq('id', conceptId)
      .single();

    if (conceptError || !concept) {
      return NextResponse.json(
        { success: false, error: '컨셉을 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    const campaign = concept.campaigns;
    const creatives: Omit<Creative, 'id' | 'concept_id' | 'created_at'>[] = [];

    // 각 플랫폼별로 소재 생성
    for (const platform of platforms as Platform[]) {
      // 이미지 생성 프롬프트 구성
      const imagePrompt = `${concept.visual_direction}.
Brand: ${campaign.brand_name}.
Product: ${campaign.product_description}.
Mood: ${concept.mood_keywords.join(', ')}.
Color palette inspiration: ${concept.color_palette.join(', ')}.`;

      // 이미지 생성 (variations 수만큼)
      for (let i = 0; i < variations; i++) {
        try {
          const image = await nanoBanana.generateForPlatform(
            imagePrompt,
            platform,
            resolution
          );

          creatives.push({
            type: 'image',
            platform,
            content_url: image.url,
            copy_text: null,
            resolution: image.resolution,
            metadata: {
              prompt: image.prompt,
              model: 'gemini-3-pro-image-preview',
              variation: i + 1,
            },
          });
        } catch (imageError) {
          console.error(`Image generation failed for ${platform}:`, imageError);
          // 이미지 생성 실패 시 계속 진행
        }
      }

      // 카피 생성
      if (include_copy) {
        try {
          const copyText = await claude.generateCopy({
            concept,
            platform,
            brandName: campaign.brand_name,
          });

          creatives.push({
            type: 'copy',
            platform,
            content_url: null,
            copy_text: copyText,
            resolution: null,
            metadata: {
              model: 'claude-sonnet-4-20250514',
            },
          });
        } catch (copyError) {
          console.error(`Copy generation failed for ${platform}:`, copyError);
        }
      }
    }

    if (creatives.length === 0) {
      return NextResponse.json(
        { success: false, error: '소재 생성에 실패했습니다' },
        { status: 500 }
      );
    }

    // DB에 저장
    const savedCreatives = await createCreatives(conceptId, creatives);

    // 캠페인 상태 업데이트
    await supabase
      .from('campaigns')
      .update({ status: 'completed', updated_at: new Date().toISOString() })
      .eq('id', campaign.id);

    return NextResponse.json({
      success: true,
      data: savedCreatives,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error('Generate creatives error:', error);
    return NextResponse.json(
      {
        success: false,
        error: `소재 생성에 실패했습니다: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
      { status: 500 }
    );
  }
}
