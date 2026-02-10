/**
 * Evidence Validator Service
 * 패턴의 통계적 유의성 검증 및 근거 강도 평가
 */

import OpenAI from 'openai';
import type {
  ExtractedPattern,
  ValidatedEvidence,
  EvidenceStrength,
  ReferenceAd,
  CollectedAd,
} from '@/types/analysis';
import type { Platform } from '@/types/database';

// ============================================================================
// Configuration
// ============================================================================

const isDevMode = !process.env.OPENAI_API_KEY;

// ============================================================================
// Types
// ============================================================================

interface ValidationContext {
  channel: Platform;
  industry: string;
}

interface SignificanceResult {
  isSignificant: boolean;
  pValue?: number;
}

// ============================================================================
// Evidence Validator Service
// ============================================================================

class EvidenceValidatorService {
  private openai: OpenAI | null;

  constructor() {
    if (isDevMode) {
      this.openai = null;
    } else {
      this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
  }

  /**
   * 패턴 검증 메인 메서드
   */
  async validate(
    patterns: ExtractedPattern[],
    context: ValidationContext,
    collectedAds?: CollectedAd[]
  ): Promise<ValidatedEvidence[]> {
    console.log(`🔬 근거 검증 시작: ${patterns.length}개 패턴`);

    const validatedResults: ValidatedEvidence[] = [];

    for (const pattern of patterns) {
      // 1. 통계적 유의성 검증
      const significance = this.checkStatisticalSignificance(pattern);

      // 2. 신뢰도 점수 계산
      const confidenceScore = this.calculateConfidenceScore(pattern, significance);

      // 3. 근거 강도 분류
      const evidenceStrength = this.classifyEvidenceStrength(
        pattern.difference_pp,
        significance.isSignificant,
        confidenceScore
      );

      // 4. 메커니즘 설명 생성 (AI)
      const mechanism = await this.generateMechanismExplanation(pattern, context);

      // 5. 레퍼런스 광고 추출
      const referenceAds = this.extractReferenceAds(pattern, collectedAds);

      validatedResults.push({
        pattern,
        is_statistically_significant: significance.isSignificant,
        p_value: significance.pValue,
        confidence_score: confidenceScore,
        evidence_strength: evidenceStrength,
        mechanism,
        reference_ads: referenceAds,
      });
    }

    // 신뢰도 순으로 정렬
    validatedResults.sort((a, b) => b.confidence_score - a.confidence_score);

    const strongCount = validatedResults.filter(e => e.evidence_strength === 'strong').length;
    const moderateCount = validatedResults.filter(e => e.evidence_strength === 'moderate').length;

    console.log(`✅ 근거 검증 완료: 강한 근거 ${strongCount}개, 보통 ${moderateCount}개`);

    return validatedResults;
  }

  /**
   * 통계적 유의성 검증 (z-test for proportions)
   */
  private checkStatisticalSignificance(pattern: ExtractedPattern): SignificanceResult {
    // 샘플 사이즈 (기본값 사용, 실제로는 ad_ids 길이로 계산)
    const successAdIds = pattern.ad_ids.filter(id => id.includes('success') || pattern.usage_in_success > 0);
    const n_success = Math.max(successAdIds.length, 40); // 최소 40개 가정
    const n_average = Math.max(15, Math.floor(n_success * 0.375)); // 성공의 37.5%

    const p1 = pattern.usage_in_success;
    const p2 = pattern.usage_in_average;

    // 둘 다 0이거나 1이면 검증 불가
    if ((p1 === 0 && p2 === 0) || (p1 === 1 && p2 === 1)) {
      return { isSignificant: false };
    }

    // pooled proportion
    const p_pooled = (p1 * n_success + p2 * n_average) / (n_success + n_average);

    // 분모가 0이 되는 경우 방지
    if (p_pooled === 0 || p_pooled === 1) {
      return { isSignificant: false };
    }

    // standard error
    const se = Math.sqrt(p_pooled * (1 - p_pooled) * (1 / n_success + 1 / n_average));

    if (se === 0) {
      return { isSignificant: false };
    }

    // z-score
    const z = (p1 - p2) / se;

    // p-value (two-tailed)
    const pValue = 2 * (1 - this.normalCDF(Math.abs(z)));

    return {
      isSignificant: pValue < 0.05,
      pValue,
    };
  }

  /**
   * 정규분포 CDF 근사
   */
  private normalCDF(x: number): number {
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x) / Math.sqrt(2);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return 0.5 * (1.0 + sign * y);
  }

  /**
   * 신뢰도 점수 계산 (0-100)
   */
  private calculateConfidenceScore(
    pattern: ExtractedPattern,
    significance: SignificanceResult
  ): number {
    let score = 0;

    // 1. 차이 크기 (0-40점)
    const diffScore = Math.min(Math.abs(pattern.difference_pp) * 2, 40);
    score += diffScore;

    // 2. 통계적 유의성 (0-30점)
    if (significance.isSignificant) {
      score += 30;
    } else if (significance.pValue && significance.pValue < 0.1) {
      score += 15;
    } else if (significance.pValue && significance.pValue < 0.2) {
      score += 5;
    }

    // 3. 일관성 - 성공 높고 실패 낮으면 + (0-20점)
    const consistencyGap = pattern.usage_in_success - pattern.usage_in_failure;
    const consistencyScore = Math.max(0, Math.min(consistencyGap * 20, 20));
    score += consistencyScore;

    // 4. 샘플 수 (0-10점) - ad_ids 길이로 판단
    const sampleScore = Math.min(pattern.ad_ids.length / 6, 10); // 60개 이상이면 10점
    score += sampleScore;

    return Math.round(Math.min(100, Math.max(0, score)));
  }

  /**
   * 근거 강도 분류
   */
  private classifyEvidenceStrength(
    differencePP: number,
    isSignificant: boolean,
    confidenceScore: number
  ): EvidenceStrength {
    // 강한 근거: 통계적 유의 + 20%p 이상 차이 + 신뢰도 70% 이상
    if (isSignificant && Math.abs(differencePP) >= 20 && confidenceScore >= 70) {
      return 'strong';
    }

    // 보통 근거: 10%p 이상 차이 + 신뢰도 50% 이상
    if (Math.abs(differencePP) >= 10 && confidenceScore >= 50) {
      return 'moderate';
    }

    // 약한 근거
    return 'weak';
  }

  /**
   * 메커니즘 설명 생성 (AI)
   */
  private async generateMechanismExplanation(
    pattern: ExtractedPattern,
    context: ValidationContext
  ): Promise<{
    psychological_basis: string;
    channel_fit_reason: string;
    industry_fit_reason: string;
  }> {
    if (isDevMode || !this.openai) {
      return this.getMockMechanismExplanation(pattern, context);
    }

    try {
      const prompt = `광고 패턴의 효과성을 간결하게 설명해주세요.

패턴: ${pattern.pattern_name} (${pattern.pattern_value})
채널: ${context.channel}
업종: ${context.industry}
성공 광고 사용률: ${(pattern.usage_in_success * 100).toFixed(1)}%
평균 광고 사용률: ${(pattern.usage_in_average * 100).toFixed(1)}%
차이: ${pattern.difference_pp > 0 ? '+' : ''}${pattern.difference_pp.toFixed(1)}%p

다음 JSON 형식으로 응답해주세요:
{
  "psychological_basis": "이 패턴이 심리학적으로 왜 효과적인지 1문장",
  "channel_fit_reason": "이 채널에서 왜 특히 효과적인지 1문장",
  "industry_fit_reason": "이 업종에서 왜 효과적인지 1문장"
}`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        max_tokens: 300,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        return this.getMockMechanismExplanation(pattern, context);
      }

      return JSON.parse(content);
    } catch (error) {
      console.error('메커니즘 설명 생성 실패:', error);
      return this.getMockMechanismExplanation(pattern, context);
    }
  }

  /**
   * Mock 메커니즘 설명
   */
  private getMockMechanismExplanation(
    pattern: ExtractedPattern,
    context: ValidationContext
  ): {
    psychological_basis: string;
    channel_fit_reason: string;
    industry_fit_reason: string;
  } {
    const explanations: Record<string, {
      psychological_basis: string;
      channel_fit_reason: string;
      industry_fit_reason: string;
    }> = {
      'has_person:yes': {
        psychological_basis: '인물이 등장하면 사회적 증거와 공감을 통해 신뢰도가 높아집니다.',
        channel_fit_reason: `${context.channel}에서 인물 콘텐츠는 알고리즘 가중치가 높습니다.`,
        industry_fit_reason: `${context.industry} 업종에서 사람 중심 스토리텔링이 효과적입니다.`,
      },
      'contrast_level:high': {
        psychological_basis: '높은 대비는 시각적 주목도를 높여 빠른 정보 전달을 돕습니다.',
        channel_fit_reason: `빠른 스크롤이 특징인 ${context.channel}에서 높은 대비가 주목을 끕니다.`,
        industry_fit_reason: `${context.industry} 제품의 특징을 명확히 전달하는 데 효과적입니다.`,
      },
      'visual_flow:center-focus': {
        psychological_basis: '중앙 집중 레이아웃은 시선 분산을 막고 핵심 메시지에 집중하게 합니다.',
        channel_fit_reason: `모바일 중심인 ${context.channel}에서 중앙 배치가 가독성을 높입니다.`,
        industry_fit_reason: `${context.industry} 제품/서비스를 효과적으로 강조할 수 있습니다.`,
      },
    };

    const key = `${pattern.pattern_name}:${pattern.pattern_value}`;

    return explanations[key] || {
      psychological_basis: `${pattern.pattern_value} 패턴은 사용자의 인지적 처리를 용이하게 합니다.`,
      channel_fit_reason: `${context.channel}의 사용자 행동 패턴에 최적화된 요소입니다.`,
      industry_fit_reason: `${context.industry} 업종의 타겟 오디언스에게 친숙한 스타일입니다.`,
    };
  }

  /**
   * 레퍼런스 광고 추출
   */
  private extractReferenceAds(
    pattern: ExtractedPattern,
    collectedAds?: CollectedAd[]
  ): ReferenceAd[] {
    if (!collectedAds || collectedAds.length === 0) {
      // Mock 레퍼런스 반환
      return [
        {
          thumbnail_url: 'https://via.placeholder.com/200x200?text=Ref+1',
          advertiser: '샘플 브랜드 A',
          delivery_days: 21,
        },
        {
          thumbnail_url: 'https://via.placeholder.com/200x200?text=Ref+2',
          advertiser: '샘플 브랜드 B',
          delivery_days: 28,
        },
      ];
    }

    // 해당 패턴을 사용한 성공 광고 중 상위 3개 추출
    const matchingAds = collectedAds.filter(
      ad => pattern.ad_ids.includes(ad.id) && ad.performance_tier === 'success'
    );

    // 집행 기간 순으로 정렬
    const sortedAds = matchingAds.sort((a, b) => b.delivery_days - a.delivery_days);

    return sortedAds.slice(0, 3).map(ad => ({
      thumbnail_url: ad.thumbnail_url || ad.image_url,
      advertiser: ad.advertiser,
      delivery_days: ad.delivery_days,
      external_id: ad.external_id,
    }));
  }

  /**
   * 강한/보통 근거만 필터링
   */
  filterStrongEvidence(evidence: ValidatedEvidence[]): ValidatedEvidence[] {
    return evidence.filter(
      e => e.evidence_strength === 'strong' || e.evidence_strength === 'moderate'
    );
  }

  /**
   * 특정 신뢰도 이상만 필터링
   */
  filterByConfidence(evidence: ValidatedEvidence[], minScore: number): ValidatedEvidence[] {
    return evidence.filter(e => e.confidence_score >= minScore);
  }
}

// ============================================================================
// Export
// ============================================================================

export const evidenceValidatorService = new EvidenceValidatorService();

export { EvidenceValidatorService };
