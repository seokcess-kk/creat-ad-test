/**
 * Pattern Synthesizer Service
 * Vision 분석 결과에서 패턴 추출 및 집계
 */

import type {
  ImageAnalysisResult,
  ExtractedPattern,
  PatternType,
  PerformanceTier,
} from '@/types/analysis';

// ============================================================================
// Types
// ============================================================================

interface PatternCount {
  pattern_type: PatternType;
  pattern_name: string;
  pattern_value: string;
  count_success: number;
  count_average: number;
  count_failure: number;
  ad_ids: string[];
}

// ============================================================================
// Pattern Synthesizer Service
// ============================================================================

class PatternSynthesizerService {
  /**
   * Vision 분석 결과에서 패턴 추출
   */
  extractPatterns(
    analysisResults: ImageAnalysisResult[],
    performanceTiers: PerformanceTier[],
    adIds?: string[]
  ): ExtractedPattern[] {
    console.log(`🔍 패턴 추출 시작: ${analysisResults.length}개 분석 결과`);

    // 1. 패턴 카운트 수집
    const patternCounts = new Map<string, PatternCount>();

    analysisResults.forEach((result, index) => {
      const tier = performanceTiers[index];
      const adId = adIds?.[index] || `ad_${index}`;

      // 레이아웃 패턴
      this.countPattern(patternCounts, 'layout', 'grid_pattern', result.layout.grid_pattern, tier, adId);
      this.countPattern(patternCounts, 'layout', 'visual_flow', result.layout.visual_flow, tier, adId);
      this.countPattern(patternCounts, 'layout', 'whitespace', result.layout.whitespace_usage, tier, adId);
      this.countPattern(patternCounts, 'layout', 'product_position', result.layout.element_positions.product, tier, adId);
      this.countPattern(patternCounts, 'layout', 'headline_position', result.layout.element_positions.headline, tier, adId);
      this.countPattern(patternCounts, 'layout', 'cta_position', result.layout.element_positions.cta, tier, adId);

      // 색상 패턴
      this.countPattern(patternCounts, 'color', 'overall_tone', result.colors.overall_tone, tier, adId);
      this.countPattern(patternCounts, 'color', 'contrast_level', result.colors.contrast_level, tier, adId);
      this.countPattern(patternCounts, 'color', 'primary_color_family', this.getColorFamily(result.colors.primary), tier, adId);

      // 텍스트 패턴
      this.countPattern(patternCounts, 'text', 'font_style', result.text.font_style, tier, adId);
      this.countPattern(patternCounts, 'text', 'text_ratio', this.getTextRatioCategory(result.text.text_ratio_percent), tier, adId);
      this.countPattern(patternCounts, 'text', 'has_cta', result.text.cta_text ? 'yes' : 'no', tier, adId);
      this.countPattern(patternCounts, 'text', 'has_subheadline', result.text.subheadline ? 'yes' : 'no', tier, adId);

      // 비주얼 스타일 패턴
      this.countPattern(patternCounts, 'visual_style', 'image_type', result.visual_style.image_type, tier, adId);
      this.countPattern(patternCounts, 'visual_style', 'has_person', result.visual_style.has_person ? 'yes' : 'no', tier, adId);
      this.countPattern(patternCounts, 'visual_style', 'product_presentation', result.visual_style.product_presentation, tier, adId);

      if (result.visual_style.has_person && result.visual_style.person_expression) {
        this.countPattern(patternCounts, 'visual_style', 'person_expression', result.visual_style.person_expression, tier, adId);
      }

      // 필터/효과 패턴
      result.visual_style.filters_effects.forEach(effect => {
        this.countPattern(patternCounts, 'visual_style', 'filter_effect', effect, tier, adId);
      });

      // 광고 분류 패턴
      this.countPattern(patternCounts, 'hook', 'estimated_goal', result.ad_classification.estimated_goal, tier, adId);
    });

    // 2. 패턴을 ExtractedPattern으로 변환
    const totalSuccess = performanceTiers.filter(t => t === 'success').length;
    const totalAverage = performanceTiers.filter(t => t === 'average').length;
    const totalFailure = performanceTiers.filter(t => t === 'failure').length;

    const extractedPatterns: ExtractedPattern[] = [];

    patternCounts.forEach(count => {
      const usageSuccess = totalSuccess > 0 ? count.count_success / totalSuccess : 0;
      const usageAverage = totalAverage > 0 ? count.count_average / totalAverage : 0;
      const usageFailure = totalFailure > 0 ? count.count_failure / totalFailure : 0;

      // 차이 계산 (percentage points)
      const differencePP = (usageSuccess - usageAverage) * 100;

      // 최소 샘플 수 필터 (3개 이상에서 발견된 패턴만)
      const totalCount = count.count_success + count.count_average + count.count_failure;
      if (totalCount < 3) return;

      extractedPatterns.push({
        pattern_type: count.pattern_type,
        pattern_name: count.pattern_name,
        pattern_value: count.pattern_value,
        usage_in_success: usageSuccess,
        usage_in_average: usageAverage,
        usage_in_failure: usageFailure,
        difference_pp: differencePP,
        ad_ids: count.ad_ids,
      });
    });

    // 3. 차이가 큰 순서대로 정렬
    extractedPatterns.sort((a, b) => Math.abs(b.difference_pp) - Math.abs(a.difference_pp));

    console.log(`✅ 패턴 추출 완료: ${extractedPatterns.length}개 패턴`);
    console.log(`   상위 패턴: ${extractedPatterns.slice(0, 5).map(p => `${p.pattern_name}:${p.pattern_value}`).join(', ')}`);

    return extractedPatterns;
  }

  /**
   * 패턴 카운트 증가
   */
  private countPattern(
    map: Map<string, PatternCount>,
    patternType: PatternType,
    patternName: string,
    patternValue: string,
    tier: PerformanceTier,
    adId: string
  ): void {
    const key = `${patternType}:${patternName}:${patternValue}`;

    if (!map.has(key)) {
      map.set(key, {
        pattern_type: patternType,
        pattern_name: patternName,
        pattern_value: patternValue,
        count_success: 0,
        count_average: 0,
        count_failure: 0,
        ad_ids: [],
      });
    }

    const count = map.get(key)!;

    switch (tier) {
      case 'success':
        count.count_success++;
        break;
      case 'average':
        count.count_average++;
        break;
      case 'failure':
        count.count_failure++;
        break;
    }

    count.ad_ids.push(adId);
  }

  /**
   * 색상 패밀리 추출 (hex -> 색상 계열)
   */
  private getColorFamily(hexColor: string): string {
    try {
      const hex = hexColor.replace('#', '');
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);

      // HSL로 변환
      const max = Math.max(r, g, b) / 255;
      const min = Math.min(r, g, b) / 255;
      const l = (max + min) / 2;

      if (max === min) {
        // 무채색
        if (l > 0.9) return 'white';
        if (l < 0.1) return 'black';
        return 'gray';
      }

      const d = max - min;
      const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      let h: number;
      if (max === r / 255) {
        h = ((g / 255 - b / 255) / d + (g < b ? 6 : 0)) / 6;
      } else if (max === g / 255) {
        h = ((b / 255 - r / 255) / d + 2) / 6;
      } else {
        h = ((r / 255 - g / 255) / d + 4) / 6;
      }

      // 색상 범위 판별
      const hue = h * 360;

      if (s < 0.15) return 'neutral';
      if (hue < 15 || hue >= 345) return 'red';
      if (hue < 45) return 'orange';
      if (hue < 75) return 'yellow';
      if (hue < 150) return 'green';
      if (hue < 210) return 'cyan';
      if (hue < 270) return 'blue';
      if (hue < 330) return 'purple';
      return 'pink';
    } catch {
      return 'unknown';
    }
  }

  /**
   * 텍스트 비율 카테고리화
   */
  private getTextRatioCategory(ratio: number): string {
    if (ratio <= 10) return 'minimal';
    if (ratio <= 20) return 'low';
    if (ratio <= 35) return 'moderate';
    if (ratio <= 50) return 'high';
    return 'text-heavy';
  }

  /**
   * 특정 패턴 타입만 필터링
   */
  filterByType(patterns: ExtractedPattern[], type: PatternType): ExtractedPattern[] {
    return patterns.filter(p => p.pattern_type === type);
  }

  /**
   * 성공/평균 차이가 큰 패턴만 필터링
   */
  filterSignificant(patterns: ExtractedPattern[], minDifferencePP: number = 10): ExtractedPattern[] {
    return patterns.filter(p => Math.abs(p.difference_pp) >= minDifferencePP);
  }

  /**
   * 성공 광고에서 높은 사용률을 보이는 패턴
   */
  filterHighSuccessUsage(patterns: ExtractedPattern[], minUsage: number = 0.5): ExtractedPattern[] {
    return patterns.filter(p => p.usage_in_success >= minUsage && p.difference_pp > 0);
  }
}

// ============================================================================
// Export
// ============================================================================

export const patternSynthesizerService = new PatternSynthesizerService();

export { PatternSynthesizerService };
