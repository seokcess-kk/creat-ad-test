/**
 * External API Services Index
 * 외부 광고 라이브러리 API 통합 모듈
 */

// Meta Ad Library
export { metaAdLibrary, MetaAdLibraryService } from './meta-ad-library';
export type { MetaAdLibraryConfig, MetaAdSearchParams } from './meta-ad-library';

// TikTok Creative Center
export { tiktokCreativeCenter, TikTokCreativeCenterService, INDUSTRY_ID_MAP } from './tiktok-creative-center';
export type { TikTokCreativeCenterConfig, TikTokTopAdsParams } from './tiktok-creative-center';

// 플랫폼별 API 서비스 매핑
import { metaAdLibrary } from './meta-ad-library';
import { tiktokCreativeCenter } from './tiktok-creative-center';
import type { Platform } from '@/types/database';

/**
 * 플랫폼에 맞는 외부 API 서비스 반환
 */
export function getExternalApiForPlatform(platform: Platform) {
  switch (platform) {
    case 'instagram_feed':
    case 'instagram_story':
      return {
        service: metaAdLibrary,
        type: 'meta' as const,
      };

    case 'tiktok':
      return {
        service: tiktokCreativeCenter,
        type: 'tiktok' as const,
      };

    case 'youtube_shorts':
    case 'youtube_ads':
      // Google Ads Transparency API (추후 구현)
      return {
        service: null,
        type: 'google' as const,
      };

    case 'threads':
      // Threads는 Meta 계열이지만 별도 API 없음
      return {
        service: metaAdLibrary,
        type: 'meta' as const,
      };

    default:
      return {
        service: null,
        type: null,
      };
  }
}

/**
 * 지원되는 플랫폼인지 확인
 */
export function isPlatformSupported(platform: Platform): boolean {
  const { service } = getExternalApiForPlatform(platform);
  return service !== null;
}

/**
 * 모든 지원 플랫폼 목록
 */
export const SUPPORTED_PLATFORMS: Platform[] = [
  'instagram_feed',
  'instagram_story',
  'tiktok',
  'threads',
];
