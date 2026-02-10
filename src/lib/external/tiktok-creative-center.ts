/**
 * TikTok Creative Center API Service
 * TikTok Top Ads 및 트렌드 데이터 수집
 *
 * 참고:
 * - TikTok Creative Center: https://ads.tiktok.com/business/creativecenter
 * - TikTok Marketing API: https://ads.tiktok.com/marketing_api/docs
 *
 * 주의사항:
 * - 공식 API 접근이 제한적이므로 웹 스크래핑 병행 가능
 * - Rate Limit 준수 필요
 * - 지역별 데이터 접근 제한 있을 수 있음
 */

import type { TikTokTopAdResult, CollectedAd, PerformanceTier } from '@/types/analysis';

// ============================================================================
// Configuration
// ============================================================================

interface TikTokCreativeCenterConfig {
  apiKey?: string;
  baseUrl: string;
}

const DEFAULT_CONFIG: TikTokCreativeCenterConfig = {
  apiKey: process.env.TIKTOK_CREATIVE_CENTER_API_KEY || '',
  baseUrl: 'https://ads.tiktok.com/creative_radar_api/v1/top_ads',
};

// API 키 확인
const isDevMode = !process.env.TIKTOK_CREATIVE_CENTER_API_KEY;

// ============================================================================
// Types
// ============================================================================

interface TikTokTopAdsParams {
  /** 지역 코드 */
  region: string;
  /** 조회 기간 (일) */
  period: 7 | 30 | 120;
  /** 업종 ID */
  industry_id?: string;
  /** 광고 목표 */
  objective?: 'REACH' | 'TRAFFIC' | 'VIDEO_VIEWS' | 'CONVERSIONS' | 'APP_INSTALL';
  /** 광고 포맷 */
  ad_format?: 'SINGLE_VIDEO' | 'SPARK_AD' | 'COLLECTION' | 'CAROUSEL';
  /** 정렬 기준 */
  order_by: 'engagement_rate' | 'like_count' | 'share_count' | 'ctr';
  /** 페이지 번호 */
  page: number;
  /** 페이지 크기 */
  page_size: number;
}

interface TikTokApiResponse {
  code: number;
  message: string;
  data: {
    materials: TikTokTopAdResult[];
    page_info: {
      page: number;
      page_size: number;
      total_count: number;
      total_page: number;
    };
  };
}

// 업종 ID 매핑 (TikTok Creative Center 기준)
const INDUSTRY_ID_MAP: Record<string, string> = {
  cosmetics: '1001',
  fashion: '1002',
  food: '1003',
  tech: '1004',
  fitness: '1005',
  finance: '1006',
  education: '1007',
  travel: '1008',
  automotive: '1009',
  gaming: '1010',
  entertainment: '1011',
  ecommerce: '1012',
};

// ============================================================================
// TikTok Creative Center Service
// ============================================================================

class TikTokCreativeCenterService {
  private config: TikTokCreativeCenterConfig;

  constructor(config: TikTokCreativeCenterConfig = DEFAULT_CONFIG) {
    this.config = config;
  }

  /**
   * Top Ads 조회
   */
  async getTopAds(params: TikTokTopAdsParams): Promise<TikTokTopAdResult[]> {
    if (isDevMode) {
      console.log('🎵 TikTok Creative Center: Mock 데이터 반환');
      return this.getMockTopAds(params.page_size);
    }

    try {
      const url = new URL(this.config.baseUrl);

      // 파라미터 설정
      url.searchParams.append('region', params.region);
      url.searchParams.append('period', params.period.toString());
      url.searchParams.append('order_by', params.order_by);
      url.searchParams.append('page', params.page.toString());
      url.searchParams.append('page_size', params.page_size.toString());

      if (params.industry_id) {
        url.searchParams.append('industry_id', params.industry_id);
      }

      if (params.objective) {
        url.searchParams.append('objective', params.objective);
      }

      if (params.ad_format) {
        url.searchParams.append('ad_format', params.ad_format);
      }

      console.log('🔍 TikTok Creative Center API 호출:', url.toString().substring(0, 100) + '...');

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-API-Key': this.config.apiKey || '',
        },
      });

      if (!response.ok) {
        throw new Error(`TikTok API 에러: ${response.statusText}`);
      }

      const data: TikTokApiResponse = await response.json();

      if (data.code !== 0) {
        throw new Error(`TikTok API 에러: ${data.message}`);
      }

      console.log(`✅ TikTok Creative Center: ${data.data.materials.length}개 광고 조회 완료`);
      return data.data.materials;
    } catch (error) {
      console.error('❌ TikTok Creative Center API 에러:', error);
      return this.getMockTopAds(params.page_size);
    }
  }

  /**
   * 업종별 Top Ads 조회 (헬퍼 메서드)
   */
  async getTopAdsByIndustry(
    industry: string,
    options: {
      region?: string;
      period?: 7 | 30 | 120;
      limit?: number;
    } = {}
  ): Promise<TikTokTopAdResult[]> {
    const { region = 'KR', period = 30, limit = 50 } = options;

    const industryId = INDUSTRY_ID_MAP[industry.toLowerCase()];

    return this.getTopAds({
      region,
      period,
      industry_id: industryId,
      order_by: 'engagement_rate',
      page: 1,
      page_size: limit,
    });
  }

  /**
   * 트렌드 해시태그 조회
   */
  async getTrendingHashtags(region: string = 'KR'): Promise<string[]> {
    if (isDevMode) {
      return this.getMockTrendingHashtags();
    }

    try {
      // TikTok Trending API 호출
      // 참고: 실제 API 엔드포인트는 다를 수 있음
      const url = `https://ads.tiktok.com/creative_radar_api/v1/trending_hashtags?region=${region}`;

      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'X-API-Key': this.config.apiKey || '',
        },
      });

      if (!response.ok) {
        throw new Error('트렌딩 해시태그 조회 실패');
      }

      const data = await response.json();
      return data.data?.hashtags || this.getMockTrendingHashtags();
    } catch (error) {
      console.error('트렌딩 해시태그 조회 에러:', error);
      return this.getMockTrendingHashtags();
    }
  }

  /**
   * 성공 광고 판별 (상위 20% 참여율)
   */
  isSuccessfulAd(ad: TikTokTopAdResult, allAds: TikTokTopAdResult[]): boolean {
    if (allAds.length === 0) return false;

    const sortedByEngagement = [...allAds].sort(
      (a, b) => b.metrics.engagement_rate - a.metrics.engagement_rate
    );

    const top20Index = Math.floor(allAds.length * 0.2);
    const adIndex = sortedByEngagement.findIndex(a => a.ad_id === ad.ad_id);

    return adIndex < top20Index;
  }

  /**
   * 집행 기간 계산
   */
  calculateDeliveryDays(ad: TikTokTopAdResult): number {
    const firstSeen = new Date(ad.first_seen_date);
    const lastSeen = new Date(ad.last_seen_date);

    const diffMs = lastSeen.getTime() - firstSeen.getTime();
    return Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  }

  /**
   * TikTok 결과를 CollectedAd 형식으로 변환
   */
  convertToCollectedAd(
    ad: TikTokTopAdResult,
    allAds: TikTokTopAdResult[]
  ): CollectedAd {
    const deliveryDays = this.calculateDeliveryDays(ad);
    const isSuccess = this.isSuccessfulAd(ad, allAds);

    let performanceTier: PerformanceTier = 'average';
    if (isSuccess && deliveryDays >= 7) {
      performanceTier = 'success';
    } else if (!isSuccess && deliveryDays < 7) {
      performanceTier = 'failure';
    }

    return {
      id: `tiktok_${ad.ad_id}`,
      source: 'tiktok',
      external_id: ad.ad_id,
      image_url: ad.video_info.cover_image_url,
      thumbnail_url: ad.video_info.cover_image_url,
      video_url: ad.video_info.video_url,
      advertiser: ad.brand_name,
      delivery_start: new Date(ad.first_seen_date),
      delivery_end: new Date(ad.last_seen_date),
      delivery_days: deliveryDays,
      performance_tier: performanceTier,
      metrics: {
        engagement_rate: ad.metrics.engagement_rate,
        like_count: ad.metrics.like_count,
        share_count: ad.metrics.share_count,
        comment_count: ad.metrics.comment_count,
      },
      ad_metadata: {
        ad_text: ad.ad_text,
        industry: ad.industry,
        objective: ad.objective,
      },
    };
  }

  /**
   * Mock Top Ads 데이터 생성
   */
  private getMockTopAds(count: number): TikTokTopAdResult[] {
    const mockAds: TikTokTopAdResult[] = [];

    const industries = ['cosmetics', 'fashion', 'food', 'tech', 'fitness'];
    const objectives = ['REACH', 'CONVERSIONS', 'VIDEO_VIEWS', 'APP_INSTALL'];

    for (let i = 0; i < count; i++) {
      const daysActive = Math.floor(Math.random() * 30) + 1;
      const firstSeenDate = new Date();
      firstSeenDate.setDate(firstSeenDate.getDate() - daysActive);

      const engagementRate = Math.random() * 0.15 + 0.01; // 1% ~ 16%
      const playCount = Math.floor(Math.random() * 1000000) + 10000;

      mockAds.push({
        ad_id: `mock_tiktok_${i + 1}`,
        video_info: {
          video_url: `https://example.com/video_${i + 1}.mp4`,
          cover_image_url: `https://via.placeholder.com/720x1280?text=TikTok+Ad+${i + 1}`,
          duration: Math.floor(Math.random() * 45) + 15, // 15-60초
        },
        ad_text: `이것은 TikTok 샘플 광고 문구입니다 #${i + 1} #추천 #fyp`,
        brand_name: `TikTok 브랜드 ${i + 1}`,
        metrics: {
          play_count: playCount,
          like_count: Math.floor(playCount * engagementRate * 0.7),
          comment_count: Math.floor(playCount * engagementRate * 0.1),
          share_count: Math.floor(playCount * engagementRate * 0.2),
          engagement_rate: engagementRate,
        },
        industry: industries[i % industries.length],
        objective: objectives[i % objectives.length],
        country_code: 'KR',
        first_seen_date: firstSeenDate.toISOString(),
        last_seen_date: new Date().toISOString(),
      });
    }

    // 참여율 순으로 정렬
    return mockAds.sort((a, b) => b.metrics.engagement_rate - a.metrics.engagement_rate);
  }

  /**
   * Mock 트렌딩 해시태그
   */
  private getMockTrendingHashtags(): string[] {
    return [
      '#fyp',
      '#foryou',
      '#추천',
      '#viral',
      '#tiktok',
      '#korea',
      '#trending',
      '#광고',
      '#꿀팁',
      '#일상',
      '#챌린지',
      '#브이로그',
      '#먹방',
      '#패션',
      '#뷰티',
    ];
  }
}

// ============================================================================
// Export
// ============================================================================

export const tiktokCreativeCenter = new TikTokCreativeCenterService();

export { TikTokCreativeCenterService, INDUSTRY_ID_MAP };
export type { TikTokCreativeCenterConfig, TikTokTopAdsParams };
