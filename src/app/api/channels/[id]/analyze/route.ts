/**
 * Channel Analysis API
 * POST /api/channels/:id/analyze
 *
 * 채널별 심층 분석 실행
 */

import { NextRequest } from 'next/server';
import { withLogging, successResponse, errorResponse } from '@/lib/api-utils';
import { runAnalysisPipeline } from '@/lib/services';
import { channelAnalysisCache } from '@/lib/cache/channel-analysis';
import { DEFAULT_SAMPLING_CONFIG } from '@/types/analysis';
import type { Platform } from '@/types/database';
import type { AnalyzeChannelRequest, ChannelAnalysisResult } from '@/types/analysis';

// 지원되는 플랫폼
const SUPPORTED_PLATFORMS: Platform[] = [
  'instagram_feed',
  'instagram_story',
  'tiktok',
  'threads',
  'youtube_shorts',
  'youtube_ads',
];

/**
 * POST /api/channels/:id/analyze
 * 채널 심층 분석 실행
 */
export const POST = withLogging(async (request: NextRequest, { log, requestId, params }) => {
  const channelId = params?.id as Platform;

  // 1. 채널 ID 검증
  if (!channelId) {
    return errorResponse('채널 ID가 필요합니다', requestId, 400);
  }

  if (!SUPPORTED_PLATFORMS.includes(channelId)) {
    return errorResponse(
      `지원하지 않는 채널입니다. 지원 채널: ${SUPPORTED_PLATFORMS.join(', ')}`,
      requestId,
      400
    );
  }

  // 2. 요청 본문 파싱
  let body: AnalyzeChannelRequest;
  try {
    body = await request.json();
  } catch {
    return errorResponse('잘못된 요청 형식입니다', requestId, 400);
  }

  const { industry, target_audience, campaign_goal, force_refresh } = body;

  // 3. 필수 필드 검증
  if (!industry) {
    return errorResponse('업종(industry) 정보가 필요합니다', requestId, 400);
  }

  log.info('Starting channel analysis', {
    channel: channelId,
    industry,
    force_refresh,
  });

  try {
    // 4. 캐시 확인 (force_refresh가 아닌 경우)
    if (!force_refresh) {
      const cached = await channelAnalysisCache.get(channelId, industry);

      if (cached && !channelAnalysisCache.isExpired(cached)) {
        log.info('Returning cached analysis', {
          channel: channelId,
          industry,
          cached_at: cached.cached_at,
        });

        return successResponse({
          success: true,
          data: cached.data,
          cached: true,
          cached_at: cached.cached_at,
        }, requestId);
      }
    }

    // 5. 분석 파이프라인 실행
    log.info('Running analysis pipeline', { channel: channelId, industry });

    const analysisResult: ChannelAnalysisResult = await runAnalysisPipeline({
      platform: channelId,
      industry,
      sampling: DEFAULT_SAMPLING_CONFIG,
      time_distribution: DEFAULT_SAMPLING_CONFIG.time_distribution,
      performance_distribution: DEFAULT_SAMPLING_CONFIG.performance_distribution,
    });

    // 6. 캐시 저장
    await channelAnalysisCache.set(channelId, industry, analysisResult);

    log.info('Channel analysis completed', {
      channel: channelId,
      industry,
      sample_size: analysisResult.analysis_metadata.sample_size,
      insights_count: analysisResult.validated_insights.length,
      quality_score: analysisResult.analysis_metadata.analysis_quality_score,
    });

    // 7. 응답 반환
    return successResponse({
      success: true,
      data: analysisResult,
      cached: false,
    }, requestId);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    log.error('Channel analysis failed', {
      channel: channelId,
      industry,
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });

    return errorResponse(
      `채널 분석에 실패했습니다: ${errorMessage}`,
      requestId,
      500
    );
  }
});

/**
 * GET /api/channels/:id/analyze
 * 캐시된 분석 결과 조회 (있는 경우)
 */
export const GET = withLogging(async (request: NextRequest, { log, requestId, params }) => {
  const channelId = params?.id as Platform;

  if (!channelId || !SUPPORTED_PLATFORMS.includes(channelId)) {
    return errorResponse('유효하지 않은 채널 ID입니다', requestId, 400);
  }

  const url = new URL(request.url);
  const industry = url.searchParams.get('industry');

  if (!industry) {
    return errorResponse('업종(industry) 파라미터가 필요합니다', requestId, 400);
  }

  try {
    const cached = await channelAnalysisCache.get(channelId, industry);

    if (cached && !channelAnalysisCache.isExpired(cached)) {
      log.info('Returning cached analysis (GET)', { channel: channelId, industry });

      return successResponse({
        success: true,
        data: cached.data,
        cached: true,
        cached_at: cached.cached_at,
        expires_at: cached.expires_at,
      }, requestId);
    }

    return successResponse({
      success: false,
      message: '캐시된 분석 결과가 없습니다. POST 요청으로 분석을 실행하세요.',
      cached: false,
    }, requestId);

  } catch (error) {
    log.error('Failed to get cached analysis', { error: String(error) });
    return errorResponse('캐시 조회 실패', requestId, 500);
  }
});
