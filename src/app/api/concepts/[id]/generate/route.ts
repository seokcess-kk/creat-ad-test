import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createCreatives, getConceptById, updateCampaignStatus } from '@/lib/db/queries';
import { nanoBanana } from '@/lib/ai/nano-banana';
import { claude } from '@/lib/ai/claude';
import { withLogging, successResponse, errorResponse } from '@/lib/api-utils';
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
export const POST = withLogging(async (request: NextRequest, { log, requestId, params }) => {
  try {
    const conceptId = params?.id;
    if (!conceptId) {
      return errorResponse('컨셉 ID가 필요합니다', requestId, 400);
    }

    const body = await request.json();
    const { platforms, include_copy, resolution, variations } = generateSchema.parse(body);

    log.info('Starting creative generation', {
      conceptId,
      platforms,
      resolution,
      variations,
      include_copy,
    });

    // 컨셉 조회
    const concept = await getConceptById(conceptId);
    if (!concept) {
      log.warning('Concept not found', { conceptId });
      return errorResponse('컨셉을 찾을 수 없습니다', requestId, 404);
    }

    const campaign = concept.campaign;
    if (!campaign) {
      log.warning('Campaign not found for concept', { conceptId });
      return errorResponse('캠페인을 찾을 수 없습니다', requestId, 404);
    }

    log.info('Concept and campaign found', {
      conceptId,
      campaignId: campaign.id,
      brandName: campaign.brand_name,
    });

    const creatives: Omit<Creative, 'id' | 'concept_id' | 'created_at'>[] = [];

    // 각 플랫폼별로 소재 생성
    for (const platform of platforms as Platform[]) {
      log.info('Generating for platform', { platform, conceptId });

      // 이미지 생성 프롬프트 구성
      const imagePrompt = `${concept.visual_direction}.
Brand: ${campaign.brand_name}.
Product: ${campaign.product_description}.
Mood: ${concept.mood_keywords.join(', ')}.
Color palette inspiration: ${concept.color_palette.join(', ')}.`;

      // 이미지 생성 (variations 수만큼)
      for (let i = 0; i < variations; i++) {
        try {
          log.info('Generating image', { platform, variation: i + 1, resolution });
          const image = await nanoBanana.generateForPlatform(
            imagePrompt,
            platform,
            resolution
          );
          log.info('Image generated', {
            platform,
            variation: i + 1,
            url: image.url.substring(0, 50) + '...',
          });

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
          log.error('Image generation failed', {
            platform,
            variation: i + 1,
            error: imageError instanceof Error ? imageError.message : 'Unknown error',
          });
        }
      }

      // 카피 생성
      if (include_copy) {
        try {
          log.info('Generating copy', { platform });
          const copyText = await claude.generateCopy({
            concept,
            platform,
            brandName: campaign.brand_name,
          });
          log.info('Copy generated', { platform, length: copyText.length });

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
          log.error('Copy generation failed', {
            platform,
            error: copyError instanceof Error ? copyError.message : 'Unknown error',
          });
        }
      }
    }

    if (creatives.length === 0) {
      log.error('No creatives generated', { conceptId, platforms });
      return errorResponse('소재 생성에 실패했습니다', requestId, 500);
    }

    // DB에 저장
    log.info('Saving creatives to database', { conceptId, count: creatives.length });
    const savedCreatives = await createCreatives(conceptId, creatives);
    log.info('Creatives saved', {
      conceptId,
      savedCount: savedCreatives.length,
      creativeIds: savedCreatives.map(c => c.id),
    });

    // 캠페인 상태 업데이트
    await updateCampaignStatus(campaign.id, 'completed');
    log.info('Campaign status updated', { campaignId: campaign.id, status: 'completed' });

    return successResponse({ success: true, data: savedCreatives }, requestId);
  } catch (error) {
    if (error instanceof z.ZodError) {
      log.warning('Validation error', { issues: error.issues });
      return errorResponse(error.issues[0].message, requestId, 400);
    }

    log.error('Generate creatives error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return errorResponse(
      `소재 생성에 실패했습니다: ${error instanceof Error ? error.message : 'Unknown error'}`,
      requestId,
      500
    );
  }
});
