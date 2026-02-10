/**
 * Vision Analyzer Service
 * Gemini Vision API 래퍼 및 분석 오케스트레이션
 */

import { geminiVision } from '@/lib/ai/gemini-vision';
import type { CollectedAd, ImageAnalysisResult } from '@/types/analysis';

// ============================================================================
// Types
// ============================================================================

interface AnalysisProgress {
  total: number;
  completed: number;
  failed: number;
}

interface AnalysisResultWithId {
  adId: string;
  result: ImageAnalysisResult;
  success: boolean;
  error?: string;
}

// ============================================================================
// Vision Analyzer Service
// ============================================================================

class VisionAnalyzerService {
  private progressCallback?: (progress: AnalysisProgress) => void;

  /**
   * 진행 상황 콜백 설정
   */
  onProgress(callback: (progress: AnalysisProgress) => void): void {
    this.progressCallback = callback;
  }

  /**
   * 여러 광고 이미지 분석
   */
  async analyzeAds(ads: CollectedAd[]): Promise<ImageAnalysisResult[]> {
    console.log(`🖼️ Vision 분석 시작: ${ads.length}개 광고`);

    const imageUrls = ads.map(ad => ad.image_url);
    const results = await geminiVision.analyzeMultiple(imageUrls);

    console.log(`✅ Vision 분석 완료: ${results.length}개 결과`);

    return results;
  }

  /**
   * 광고 ID와 함께 분석 (추적용)
   */
  async analyzeAdsWithIds(ads: CollectedAd[]): Promise<AnalysisResultWithId[]> {
    console.log(`🖼️ Vision 분석 시작 (ID 포함): ${ads.length}개 광고`);

    const results: AnalysisResultWithId[] = [];
    const progress: AnalysisProgress = {
      total: ads.length,
      completed: 0,
      failed: 0,
    };

    // 배치 처리 (5개씩)
    const batchSize = 5;

    for (let i = 0; i < ads.length; i += batchSize) {
      const batch = ads.slice(i, i + batchSize);

      const batchPromises = batch.map(async (ad) => {
        try {
          const result = await geminiVision.analyzeAdImage(ad.image_url);
          progress.completed++;
          return {
            adId: ad.id,
            result,
            success: true,
          };
        } catch (error) {
          progress.failed++;
          console.error(`Vision 분석 실패 (${ad.id}):`, error);
          return {
            adId: ad.id,
            result: this.getDefaultAnalysis(),
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // 진행 상황 콜백
      if (this.progressCallback) {
        this.progressCallback(progress);
      }

      // Rate limiting
      if (i + batchSize < ads.length) {
        await this.delay(500);
      }
    }

    const successCount = results.filter(r => r.success).length;
    console.log(`✅ Vision 분석 완료: 성공 ${successCount}/${results.length}`);

    return results;
  }

  /**
   * 단일 이미지 분석
   */
  async analyzeImage(imageUrl: string): Promise<ImageAnalysisResult> {
    return geminiVision.analyzeAdImage(imageUrl);
  }

  /**
   * 분석 결과 요약 생성
   */
  summarizeResults(results: ImageAnalysisResult[]): {
    layoutPatterns: Record<string, number>;
    colorTones: Record<string, number>;
    visualStyles: Record<string, number>;
    hasPersonRatio: number;
    avgTextRatio: number;
  } {
    const summary = {
      layoutPatterns: {} as Record<string, number>,
      colorTones: {} as Record<string, number>,
      visualStyles: {} as Record<string, number>,
      hasPersonRatio: 0,
      avgTextRatio: 0,
    };

    let personCount = 0;
    let totalTextRatio = 0;

    results.forEach(result => {
      // 레이아웃 패턴 카운트
      const layout = result.layout.grid_pattern;
      summary.layoutPatterns[layout] = (summary.layoutPatterns[layout] || 0) + 1;

      // 색상 톤 카운트
      const tone = result.colors.overall_tone;
      summary.colorTones[tone] = (summary.colorTones[tone] || 0) + 1;

      // 비주얼 스타일 카운트
      const style = result.visual_style.image_type;
      summary.visualStyles[style] = (summary.visualStyles[style] || 0) + 1;

      // 인물 등장 비율
      if (result.visual_style.has_person) {
        personCount++;
      }

      // 텍스트 비율
      totalTextRatio += result.text.text_ratio_percent;
    });

    summary.hasPersonRatio = results.length > 0 ? personCount / results.length : 0;
    summary.avgTextRatio = results.length > 0 ? totalTextRatio / results.length : 0;

    return summary;
  }

  /**
   * 기본 분석 결과 (에러 시 폴백)
   */
  private getDefaultAnalysis(): ImageAnalysisResult {
    return {
      layout: {
        grid_pattern: 'unknown',
        element_positions: {
          product: 'unknown',
          headline: 'unknown',
          logo: 'unknown',
          cta: 'unknown',
        },
        visual_flow: 'unknown',
        whitespace_usage: 'unknown',
      },
      colors: {
        primary: '#000000',
        secondary: '#FFFFFF',
        accent: '#FF0000',
        overall_tone: 'unknown',
        contrast_level: 'unknown',
      },
      text: {
        headline: '',
        subheadline: null,
        cta_text: null,
        font_style: 'unknown',
        text_ratio_percent: 0,
      },
      visual_style: {
        image_type: 'unknown',
        has_person: false,
        product_presentation: 'unknown',
        filters_effects: [],
      },
      ad_classification: {
        estimated_goal: 'unknown',
        estimated_audience: 'unknown',
        industry: 'unknown',
      },
    };
  }

  /**
   * 딜레이 유틸리티
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================================================
// Export
// ============================================================================

export const visionAnalyzerService = new VisionAnalyzerService();

export { VisionAnalyzerService };
