/**
 * Meta Ad Library API Service
 * Facebook/Instagram 광고 라이브러리에서 광고 데이터 수집
 *
 * API 문서: https://www.facebook.com/ads/library/api/
 * 필요한 권한: ads_read
 *
 * 주의사항:
 * - Meta Business API 토큰 필요 (Meta Developer Console에서 발급)
 * - 정치/이슈 광고는 별도 제한 있음
 * - Rate Limit: 200 calls/hour (앱당)
 */

import type { MetaAdResult, CollectedAd, PerformanceTier } from '@/types/analysis';

// ============================================================================
// Configuration
// ============================================================================

interface MetaAdLibraryConfig {
  accessToken: string;
  apiVersion: string;
}

const DEFAULT_CONFIG: MetaAdLibraryConfig = {
  accessToken: process.env.META_AD_LIBRARY_ACCESS_TOKEN || '',
  apiVersion: 'v19.0',
};

// API 키 확인
const isDevMode = !process.env.META_AD_LIBRARY_ACCESS_TOKEN;

// ============================================================================
// Types
// ============================================================================

interface MetaAdSearchParams {
  /** 검색어 */
  search_terms?: string;
  /** 검색 대상 국가 */
  ad_reached_countries: string[];
  /** 광고 활성 상태 */
  ad_active_status: 'ACTIVE' | 'INACTIVE' | 'ALL';
  /** 광고 유형 */
  ad_type: 'POLITICAL_AND_ISSUE_ADS' | 'ALL';
  /** 퍼블리셔 플랫폼 */
  publisher_platforms?: ('facebook' | 'instagram' | 'audience_network' | 'messenger')[];
  /** 특정 페이지 ID로 필터링 */
  search_page_ids?: string[];
  /** 광고주명 검색 */
  bylines?: string[];
  /** 결과 수 제한 */
  limit: number;
  /** 페이징 커서 */
  after?: string;
}

interface MetaApiResponse {
  data: MetaAdResult[];
  paging?: {
    cursors: {
      before: string;
      after: string;
    };
    next?: string;
  };
}

// ============================================================================
// Meta Ad Library Service
// ============================================================================

class MetaAdLibraryService {
  private config: MetaAdLibraryConfig;
  private baseUrl: string;

  constructor(config: MetaAdLibraryConfig = DEFAULT_CONFIG) {
    this.config = config;
    this.baseUrl = `https://graph.facebook.com/${config.apiVersion}`;
  }

  /**
   * 광고 검색
   */
  async searchAds(params: MetaAdSearchParams): Promise<MetaAdResult[]> {
    if (isDevMode) {
      console.log('📢 Meta Ad Library: Mock 데이터 반환');
      return this.getMockAds(params.limit);
    }

    try {
      const url = new URL(`${this.baseUrl}/ads_archive`);

      // 필수 파라미터
      url.searchParams.append('access_token', this.config.accessToken);
      url.searchParams.append('ad_reached_countries', JSON.stringify(params.ad_reached_countries));
      url.searchParams.append('ad_active_status', params.ad_active_status);
      url.searchParams.append('ad_type', params.ad_type);
      url.searchParams.append('limit', params.limit.toString());

      // 선택적 파라미터
      if (params.search_terms) {
        url.searchParams.append('search_terms', params.search_terms);
      }

      if (params.publisher_platforms?.length) {
        url.searchParams.append('publisher_platforms', JSON.stringify(params.publisher_platforms));
      }

      if (params.search_page_ids?.length) {
        url.searchParams.append('search_page_ids', JSON.stringify(params.search_page_ids));
      }

      if (params.bylines?.length) {
        url.searchParams.append('bylines', JSON.stringify(params.bylines));
      }

      if (params.after) {
        url.searchParams.append('after', params.after);
      }

      // 반환할 필드 지정
      const fields = [
        'id',
        'ad_creation_time',
        'ad_creative_bodies',
        'ad_creative_link_captions',
        'ad_creative_link_titles',
        'ad_delivery_start_time',
        'ad_delivery_stop_time',
        'ad_snapshot_url',
        'page_id',
        'page_name',
        'publisher_platforms',
        'impressions',
        'spend',
      ].join(',');
      url.searchParams.append('fields', fields);

      console.log('🔍 Meta Ad Library API 호출:', url.toString().substring(0, 100) + '...');

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Meta API 에러: ${errorData.error?.message || response.statusText}`);
      }

      const data: MetaApiResponse = await response.json();
      console.log(`✅ Meta Ad Library: ${data.data.length}개 광고 조회 완료`);

      return data.data;
    } catch (error) {
      console.error('❌ Meta Ad Library API 에러:', error);
      // 에러 시 Mock 데이터 반환
      return this.getMockAds(params.limit);
    }
  }

  /**
   * 업종별 광고 검색 (헬퍼 메서드)
   */
  async searchByIndustry(
    industry: string,
    options: {
      country?: string;
      limit?: number;
      platforms?: ('facebook' | 'instagram')[];
    } = {}
  ): Promise<MetaAdResult[]> {
    const { country = 'KR', limit = 50, platforms = ['instagram'] } = options;

    // 업종별 검색어 매핑
    const industryKeywords = this.getIndustryKeywords(industry);

    return this.searchAds({
      search_terms: industryKeywords.join(' OR '),
      ad_reached_countries: [country],
      ad_active_status: 'ACTIVE',
      ad_type: 'ALL',
      publisher_platforms: platforms,
      limit,
    });
  }

  /**
   * 광고 스냅샷에서 이미지 URL 추출
   * (실제 구현 시 Puppeteer 등 헤드리스 브라우저 필요)
   */
  async extractImageFromSnapshot(snapshotUrl: string): Promise<string | null> {
    if (isDevMode) {
      // Mock: 플레이스홀더 이미지 반환
      return 'https://via.placeholder.com/1080x1080?text=Ad+Image';
    }

    try {
      // 참고: 실제 구현 시 Puppeteer 또는 Playwright 사용 필요
      // Meta Ad Library 스냅샷 페이지에서 이미지 추출
      console.log('⚠️ 스냅샷 이미지 추출: 실제 구현 필요', snapshotUrl);

      // 현재는 스냅샷 URL 자체 반환
      return snapshotUrl;
    } catch (error) {
      console.error('스냅샷 이미지 추출 실패:', error);
      return null;
    }
  }

  /**
   * 성공 광고 판별 (14일 이상 집행)
   */
  isSuccessfulAd(ad: MetaAdResult): boolean {
    const deliveryDays = this.calculateDeliveryDays(ad);
    return deliveryDays >= 14;
  }

  /**
   * 집행 일수 계산
   */
  calculateDeliveryDays(ad: MetaAdResult): number {
    const start = new Date(ad.ad_delivery_start_time);
    const end = ad.ad_delivery_stop_time
      ? new Date(ad.ad_delivery_stop_time)
      : new Date();

    const diffMs = end.getTime() - start.getTime();
    return Math.floor(diffMs / (1000 * 60 * 60 * 24));
  }

  /**
   * Meta API 결과를 CollectedAd 형식으로 변환
   */
  async convertToCollectedAd(ad: MetaAdResult): Promise<CollectedAd> {
    const deliveryDays = this.calculateDeliveryDays(ad);

    // 이미지 URL 추출 시도
    const imageUrl = await this.extractImageFromSnapshot(ad.ad_snapshot_url);

    // 성과 등급 판별
    let performanceTier: PerformanceTier = 'average';
    if (deliveryDays >= 14) {
      performanceTier = 'success';
    } else if (deliveryDays < 7) {
      performanceTier = 'failure';
    }

    return {
      id: `meta_${ad.id}`,
      source: 'meta',
      external_id: ad.id,
      image_url: imageUrl || ad.ad_snapshot_url,
      thumbnail_url: imageUrl || ad.ad_snapshot_url,
      advertiser: ad.page_name,
      advertiser_id: ad.page_id,
      delivery_start: new Date(ad.ad_delivery_start_time),
      delivery_end: ad.ad_delivery_stop_time ? new Date(ad.ad_delivery_stop_time) : undefined,
      delivery_days: deliveryDays,
      performance_tier: performanceTier,
      metrics: {
        impressions_range: ad.impressions
          ? [parseInt(ad.impressions.lower_bound), parseInt(ad.impressions.upper_bound)]
          : undefined,
        spend_range: ad.spend
          ? [parseFloat(ad.spend.lower_bound), parseFloat(ad.spend.upper_bound)]
          : undefined,
      },
      ad_metadata: {
        ad_text: ad.ad_creative_bodies?.[0],
        cta_text: ad.ad_creative_link_captions?.[0],
      },
    };
  }

  /**
   * 업종별 검색 키워드 매핑
   */
  private getIndustryKeywords(industry: string): string[] {
    const keywordMap: Record<string, string[]> = {
      cosmetics: ['화장품', '뷰티', '스킨케어', '메이크업', '코스메틱'],
      fashion: ['패션', '옷', '의류', '스타일', '쇼핑몰'],
      food: ['음식', '식품', '배달', '맛집', '푸드'],
      tech: ['테크', '전자', '가전', '스마트', '디지털'],
      fitness: ['피트니스', '운동', '헬스', '다이어트', '건강'],
      finance: ['금융', '투자', '보험', '은행', '자산'],
      education: ['교육', '학습', '강의', '인강', '자격증'],
      travel: ['여행', '호텔', '항공', '여행사', '관광'],
      automotive: ['자동차', '차량', '카', '드라이브', '중고차'],
      gaming: ['게임', '모바일게임', '온라인게임', '겜', '플레이'],
    };

    return keywordMap[industry.toLowerCase()] || [industry];
  }

  /**
   * Mock 광고 데이터 생성
   */
  private getMockAds(count: number): MetaAdResult[] {
    const mockAds: MetaAdResult[] = [];

    for (let i = 0; i < count; i++) {
      const daysActive = Math.floor(Math.random() * 60) + 1;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysActive);

      mockAds.push({
        id: `mock_meta_${i + 1}`,
        ad_creation_time: startDate.toISOString(),
        ad_creative_bodies: [`이것은 샘플 광고 문구입니다 #${i + 1}`],
        ad_creative_link_captions: ['지금 바로 확인하세요'],
        ad_creative_link_titles: [`샘플 광고 ${i + 1}`],
        ad_delivery_start_time: startDate.toISOString(),
        ad_delivery_stop_time: daysActive < 30 ? undefined : new Date().toISOString(),
        ad_snapshot_url: `https://via.placeholder.com/1080x1080?text=Ad+${i + 1}`,
        page_id: `page_${i + 1}`,
        page_name: `샘플 브랜드 ${i + 1}`,
        publisher_platforms: ['instagram'],
        impressions: {
          lower_bound: String(10000 * (i + 1)),
          upper_bound: String(50000 * (i + 1)),
        },
        spend: {
          lower_bound: String(100000 * (i + 1)),
          upper_bound: String(500000 * (i + 1)),
          currency: 'KRW',
        },
      });
    }

    return mockAds;
  }
}

// ============================================================================
// Export
// ============================================================================

export const metaAdLibrary = new MetaAdLibraryService();

export { MetaAdLibraryService };
export type { MetaAdLibraryConfig, MetaAdSearchParams };
