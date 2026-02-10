/**
 * Ad Collector Service
 * 외부 광고 라이브러리에서 광고 수집 및 샘플링
 */

import { metaAdLibrary } from '@/lib/external/meta-ad-library';
import { tiktokCreativeCenter } from '@/lib/external/tiktok-creative-center';
import type {
  CollectedAd,
  AdCollectionRequest,
  AdSource,
  PerformanceTier,
  ADJACENT_INDUSTRIES,
} from '@/types/analysis';
import type { Platform } from '@/types/database';

// ============================================================================
// Ad Collector Service
// ============================================================================

class AdCollectorService {
  /**
   * 광고 수집 메인 메서드
   */
  async collect(request: AdCollectionRequest): Promise<CollectedAd[]> {
    const { platform, industry, sampling } = request;

    console.log(`📊 광고 수집 시작: ${platform}, ${industry} 업종`);
    console.log(`   목표: 총 ${sampling.total}개 (직접 ${sampling.industry_direct}, 인접 ${sampling.industry_adjacent}, 레퍼런스 ${sampling.industry_reference})`);

    // 플랫폼별 수집 전략 결정
    const collectedAds: CollectedAd[] = [];

    // 1. 직접 업종 광고 수집
    const directAds = await this.collectByIndustry(
      platform,
      industry,
      sampling.industry_direct
    );
    collectedAds.push(...directAds);
    console.log(`   ✓ 직접 업종: ${directAds.length}개 수집`);

    // 2. 인접 업종 광고 수집
    const adjacentIndustries = this.getAdjacentIndustries(industry);
    const adsPerAdjacent = Math.ceil(sampling.industry_adjacent / adjacentIndustries.length);

    for (const adjIndustry of adjacentIndustries.slice(0, 3)) {
      const adjAds = await this.collectByIndustry(
        platform,
        adjIndustry,
        adsPerAdjacent
      );
      collectedAds.push(...adjAds);
    }
    console.log(`   ✓ 인접 업종: ${collectedAds.length - directAds.length}개 수집`);

    // 3. 레퍼런스 광고 수집 (전체 Top 광고)
    const refAds = await this.collectTopAds(platform, sampling.industry_reference);
    collectedAds.push(...refAds);
    console.log(`   ✓ 레퍼런스: ${refAds.length}개 수집`);

    // 4. 성과 등급별 샘플링 조정
    const sampledAds = this.sampleByPerformance(
      collectedAds,
      sampling.performance_distribution
    );

    console.log(`📊 광고 수집 완료: 총 ${sampledAds.length}개`);
    console.log(`   성공: ${sampledAds.filter(a => a.performance_tier === 'success').length}개`);
    console.log(`   평균: ${sampledAds.filter(a => a.performance_tier === 'average').length}개`);
    console.log(`   실패: ${sampledAds.filter(a => a.performance_tier === 'failure').length}개`);

    return sampledAds;
  }

  /**
   * 업종별 광고 수집
   */
  private async collectByIndustry(
    platform: Platform,
    industry: string,
    limit: number
  ): Promise<CollectedAd[]> {
    try {
      switch (platform) {
        case 'instagram_feed':
        case 'instagram_story':
        case 'threads': {
          const metaAds = await metaAdLibrary.searchByIndustry(industry, {
            limit,
            platforms: platform === 'threads' ? ['facebook'] : ['instagram'],
          });

          return Promise.all(
            metaAds.map(ad => metaAdLibrary.convertToCollectedAd(ad))
          );
        }

        case 'tiktok': {
          const tiktokAds = await tiktokCreativeCenter.getTopAdsByIndustry(industry, {
            limit,
          });

          return tiktokAds.map(ad =>
            tiktokCreativeCenter.convertToCollectedAd(ad, tiktokAds)
          );
        }

        case 'youtube_shorts':
        case 'youtube_ads': {
          // YouTube는 현재 Mock 데이터 반환
          console.log(`⚠️ YouTube 플랫폼: Mock 데이터 사용`);
          return this.getMockAds(limit, 'google', platform);
        }

        default:
          return [];
      }
    } catch (error) {
      console.error(`업종별 광고 수집 실패 (${platform}, ${industry}):`, error);
      return this.getMockAds(limit, this.getPlatformSource(platform), platform);
    }
  }

  /**
   * 전체 Top 광고 수집 (업종 무관)
   */
  private async collectTopAds(
    platform: Platform,
    limit: number
  ): Promise<CollectedAd[]> {
    try {
      switch (platform) {
        case 'instagram_feed':
        case 'instagram_story':
        case 'threads': {
          const metaAds = await metaAdLibrary.searchAds({
            ad_reached_countries: ['KR'],
            ad_active_status: 'ACTIVE',
            ad_type: 'ALL',
            publisher_platforms: ['instagram'],
            limit,
          });

          return Promise.all(
            metaAds.map(ad => metaAdLibrary.convertToCollectedAd(ad))
          );
        }

        case 'tiktok': {
          const tiktokAds = await tiktokCreativeCenter.getTopAds({
            region: 'KR',
            period: 30,
            order_by: 'engagement_rate',
            page: 1,
            page_size: limit,
          });

          return tiktokAds.map(ad =>
            tiktokCreativeCenter.convertToCollectedAd(ad, tiktokAds)
          );
        }

        default:
          return this.getMockAds(limit, 'google', platform);
      }
    } catch (error) {
      console.error(`Top 광고 수집 실패 (${platform}):`, error);
      return this.getMockAds(limit, this.getPlatformSource(platform), platform);
    }
  }

  /**
   * 성과 등급별 샘플링
   */
  private sampleByPerformance(
    ads: CollectedAd[],
    distribution: { success: number; average: number; failure: number }
  ): CollectedAd[] {
    const successAds = ads.filter(a => a.performance_tier === 'success');
    const averageAds = ads.filter(a => a.performance_tier === 'average');
    const failureAds = ads.filter(a => a.performance_tier === 'failure');

    // 각 등급에서 필요한 만큼 샘플링
    const sampledSuccess = this.shuffleAndTake(successAds, distribution.success);
    const sampledAverage = this.shuffleAndTake(averageAds, distribution.average);
    const sampledFailure = this.shuffleAndTake(failureAds, distribution.failure);

    // 부족한 경우 다른 등급에서 보충
    const result = [...sampledSuccess, ...sampledAverage, ...sampledFailure];

    const targetTotal = distribution.success + distribution.average + distribution.failure;
    if (result.length < targetTotal) {
      const remaining = ads.filter(a => !result.includes(a));
      const needed = targetTotal - result.length;
      result.push(...this.shuffleAndTake(remaining, needed));
    }

    return result;
  }

  /**
   * 배열 셔플 후 n개 추출
   */
  private shuffleAndTake<T>(array: T[], n: number): T[] {
    const shuffled = [...array].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, n);
  }

  /**
   * 인접 업종 조회
   */
  private getAdjacentIndustries(industry: string): string[] {
    const adjacentMap: Record<string, string[]> = {
      cosmetics: ['beauty', 'skincare', 'fashion', 'wellness', 'health'],
      fashion: ['cosmetics', 'lifestyle', 'luxury', 'accessories', 'beauty'],
      food: ['beverage', 'restaurant', 'grocery', 'health', 'lifestyle'],
      tech: ['software', 'gadgets', 'electronics', 'gaming', 'mobile'],
      fitness: ['health', 'wellness', 'sports', 'nutrition', 'lifestyle'],
      finance: ['insurance', 'investment', 'banking', 'fintech', 'business'],
      education: ['edtech', 'career', 'courses', 'books', 'business'],
      travel: ['hospitality', 'tourism', 'lifestyle', 'food', 'luxury'],
      automotive: ['transport', 'mobility', 'tech', 'luxury', 'lifestyle'],
      gaming: ['entertainment', 'tech', 'mobile', 'esports', 'streaming'],
    };

    return adjacentMap[industry.toLowerCase()] || ['lifestyle', 'tech', 'fashion'];
  }

  /**
   * 플랫폼 소스 타입 반환
   */
  private getPlatformSource(platform: Platform): AdSource {
    switch (platform) {
      case 'instagram_feed':
      case 'instagram_story':
      case 'threads':
        return 'meta';
      case 'tiktok':
        return 'tiktok';
      case 'youtube_shorts':
      case 'youtube_ads':
        return 'google';
      default:
        return 'meta';
    }
  }

  /**
   * Mock 광고 데이터 생성
   */
  private getMockAds(
    count: number,
    source: AdSource,
    platform: Platform
  ): CollectedAd[] {
    const mockAds: CollectedAd[] = [];

    const tiers: PerformanceTier[] = ['success', 'average', 'failure'];

    for (let i = 0; i < count; i++) {
      const daysActive = Math.floor(Math.random() * 60) + 1;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysActive);

      // 성과 등급 결정 (성공:평균:실패 = 4:3:3)
      let tier: PerformanceTier;
      const rand = Math.random();
      if (rand < 0.4) tier = 'success';
      else if (rand < 0.7) tier = 'average';
      else tier = 'failure';

      mockAds.push({
        id: `mock_${source}_${platform}_${i + 1}`,
        source,
        external_id: `ext_${i + 1}`,
        image_url: `https://via.placeholder.com/${platform.includes('story') || platform === 'tiktok' ? '720x1280' : '1080x1080'}?text=${platform}+Ad+${i + 1}`,
        thumbnail_url: `https://via.placeholder.com/200x200?text=Thumb+${i + 1}`,
        advertiser: `Mock 브랜드 ${i + 1}`,
        advertiser_id: `brand_${i + 1}`,
        delivery_start: startDate,
        delivery_end: tier === 'failure' ? new Date() : undefined,
        delivery_days: daysActive,
        performance_tier: tier,
        metrics: {
          impressions_range: [10000 * (i + 1), 50000 * (i + 1)],
          engagement_rate: tier === 'success' ? 0.08 + Math.random() * 0.07 : 0.02 + Math.random() * 0.04,
        },
        ad_metadata: {
          ad_text: `이것은 ${platform} 샘플 광고입니다 #${i + 1}`,
          cta_text: '자세히 보기',
        },
      });
    }

    return mockAds;
  }
}

// ============================================================================
// Export
// ============================================================================

export const adCollectorService = new AdCollectorService();

export { AdCollectorService };
