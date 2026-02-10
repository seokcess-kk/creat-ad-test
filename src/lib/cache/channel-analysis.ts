/**
 * Channel Analysis Cache
 * 채널 분석 결과 캐싱 (메모리 + 선택적 Redis)
 */

import type { ChannelAnalysisResult, CachedAnalysis, ANALYSIS_CACHE_TTL_MS } from '@/types/analysis';
import type { Platform } from '@/types/database';

// ============================================================================
// In-Memory Cache
// ============================================================================

const memoryCache = new Map<string, CachedAnalysis>();

// 캐시 TTL (24시간)
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

// ============================================================================
// Channel Analysis Cache Service
// ============================================================================

class ChannelAnalysisCacheService {
  /**
   * 캐시 키 생성
   */
  private getCacheKey(channel: Platform, industry: string): string {
    return `analysis:${channel}:${industry.toLowerCase()}`;
  }

  /**
   * 캐시에서 분석 결과 조회
   */
  async get(channel: Platform, industry: string): Promise<CachedAnalysis | null> {
    const key = this.getCacheKey(channel, industry);

    // 메모리 캐시 확인
    const cached = memoryCache.get(key);

    if (cached) {
      // 만료 확인
      if (new Date() < cached.expires_at) {
        console.log(`💾 캐시 히트: ${key}`);
        return cached;
      } else {
        // 만료된 캐시 삭제
        memoryCache.delete(key);
        console.log(`⏰ 캐시 만료: ${key}`);
      }
    }

    return null;
  }

  /**
   * 분석 결과 캐시 저장
   */
  async set(
    channel: Platform,
    industry: string,
    data: ChannelAnalysisResult
  ): Promise<void> {
    const key = this.getCacheKey(channel, industry);

    const cachedData: CachedAnalysis = {
      data,
      cached_at: new Date(),
      expires_at: new Date(Date.now() + CACHE_TTL_MS),
    };

    memoryCache.set(key, cachedData);
    console.log(`💾 캐시 저장: ${key} (만료: ${cachedData.expires_at.toISOString()})`);

    // 캐시 크기 제한 (최대 100개)
    if (memoryCache.size > 100) {
      this.evictOldest();
    }
  }

  /**
   * 특정 캐시 삭제
   */
  async delete(channel: Platform, industry: string): Promise<void> {
    const key = this.getCacheKey(channel, industry);
    memoryCache.delete(key);
    console.log(`🗑️ 캐시 삭제: ${key}`);
  }

  /**
   * 채널의 모든 캐시 삭제
   */
  async deleteByChannel(channel: Platform): Promise<void> {
    const prefix = `analysis:${channel}:`;
    let count = 0;

    for (const key of memoryCache.keys()) {
      if (key.startsWith(prefix)) {
        memoryCache.delete(key);
        count++;
      }
    }

    console.log(`🗑️ 채널 캐시 삭제: ${channel} (${count}개)`);
  }

  /**
   * 모든 캐시 삭제
   */
  async clear(): Promise<void> {
    memoryCache.clear();
    console.log('🗑️ 모든 캐시 삭제됨');
  }

  /**
   * 캐시 상태 조회
   */
  getStats(): {
    size: number;
    keys: string[];
  } {
    return {
      size: memoryCache.size,
      keys: Array.from(memoryCache.keys()),
    };
  }

  /**
   * 만료된 캐시 정리
   */
  async cleanup(): Promise<number> {
    const now = new Date();
    let cleaned = 0;

    for (const [key, value] of memoryCache.entries()) {
      if (now >= value.expires_at) {
        memoryCache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`🧹 만료 캐시 정리: ${cleaned}개`);
    }

    return cleaned;
  }

  /**
   * 가장 오래된 캐시 제거 (LRU 방식)
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = new Date();

    for (const [key, value] of memoryCache.entries()) {
      if (value.cached_at < oldestTime) {
        oldestTime = value.cached_at;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      memoryCache.delete(oldestKey);
      console.log(`🗑️ LRU 캐시 제거: ${oldestKey}`);
    }
  }

  /**
   * 캐시 만료 확인
   */
  isExpired(cached: CachedAnalysis): boolean {
    return new Date() >= cached.expires_at;
  }
}

// ============================================================================
// Export
// ============================================================================

export const channelAnalysisCache = new ChannelAnalysisCacheService();

export { ChannelAnalysisCacheService };

// 주기적 캐시 정리 (5분마다)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    channelAnalysisCache.cleanup().catch(console.error);
  }, 5 * 60 * 1000);
}
