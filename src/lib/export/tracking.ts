// Tracking Code Service
// Feature: export-api

import type { Platform } from '@/types/database';
import type { TrackingCodeParams } from '@/types/export';

/**
 * TrackingService - 소재 추적 코드 생성
 *
 * tracking_code 형식: crt_{campaign_short}_{platform_code}_v{version}
 * 예: crt_abc12345_ig_feed_v1
 */
class TrackingService {
  /**
   * tracking_code 생성
   */
  generate(params: TrackingCodeParams): string {
    const campaignShort = params.campaignId.substring(0, 8);
    const platformCode = this.getPlatformCode(params.platform);
    return `crt_${campaignShort}_${platformCode}_v${params.version}`;
  }

  /**
   * 플랫폼 코드 (짧은 형태)
   */
  private getPlatformCode(platform: Platform): string {
    const codes: Record<Platform, string> = {
      instagram_feed: 'ig_feed',
      instagram_story: 'ig_story',
      tiktok: 'tiktok',
      threads: 'threads',
      youtube_shorts: 'yt_short',
      youtube_ads: 'yt_ads',
    };
    return codes[platform] || platform;
  }

  /**
   * tracking_code에서 정보 추출
   */
  parse(trackingCode: string): {
    campaignShort: string;
    platformCode: string;
    version: number;
  } | null {
    const match = trackingCode.match(/^crt_([a-z0-9]+)_([a-z_]+)_v(\d+)$/i);
    if (!match) return null;

    return {
      campaignShort: match[1],
      platformCode: match[2],
      version: parseInt(match[3], 10),
    };
  }

  /**
   * 고유 external_id 생성 (외부 시스템 연동 시)
   * 형식: ext_{timestamp}_{random}
   */
  generateExternalId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `ext_${timestamp}_${random}`;
  }
}

export const trackingService = new TrackingService();
