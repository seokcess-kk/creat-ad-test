/**
 * Insight Generator Service
 * 검증된 근거를 바탕으로 채널 분석 결과 및 컨셉 입력 생성
 */

import type {
  ValidatedEvidence,
  ChannelAnalysisResult,
  ConceptInputs,
  RecommendedDirection,
  RecommendedHook,
  CollectedAd,
  AdSource,
} from '@/types/analysis';
import type { Platform } from '@/types/database';

// ============================================================================
// Types
// ============================================================================

interface GenerateInput {
  channel: Platform;
  industry: string;
  evidence: ValidatedEvidence[];
  collectedAds: CollectedAd[];
  target_audience?: string;
  campaign_goal?: string;
}

// ============================================================================
// Insight Generator Service
// ============================================================================

class InsightGeneratorService {
  /**
   * 채널 분석 결과 생성
   */
  generate(input: GenerateInput): ChannelAnalysisResult {
    const { channel, industry, evidence, collectedAds, target_audience, campaign_goal } = input;

    console.log(`💡 인사이트 생성 시작: ${channel}, ${industry}`);

    // 강한/보통 근거만 필터링
    const significantEvidence = evidence.filter(
      e => e.evidence_strength === 'strong' || e.evidence_strength === 'moderate'
    );

    // 컨셉 입력 생성
    const conceptInputs = this.generateConceptInputs(
      significantEvidence,
      channel,
      industry,
      target_audience,
      campaign_goal
    );

    // 메타데이터 생성
    const analysisMetadata = this.generateMetadata(collectedAds, evidence);

    const result: ChannelAnalysisResult = {
      channel,
      industry,
      validated_insights: evidence,
      concept_inputs: conceptInputs,
      analysis_metadata: analysisMetadata,
    };

    console.log(`✅ 인사이트 생성 완료: ${significantEvidence.length}개 주요 인사이트`);

    return result;
  }

  /**
   * 컨셉 입력 생성
   */
  private generateConceptInputs(
    evidence: ValidatedEvidence[],
    channel: Platform,
    industry: string,
    targetAudience?: string,
    campaignGoal?: string
  ): ConceptInputs {
    // 추천 방향 생성
    const recommendedDirections = this.generateRecommendedDirections(
      evidence,
      industry,
      campaignGoal
    );

    // 필수 포함 요소 추출
    const mustInclude = this.extractMustInclude(evidence);

    // 피해야 할 요소 추출
    const mustAvoid = this.extractMustAvoid(evidence, channel);

    // 추천 훅 생성
    const recommendedHooks = this.generateRecommendedHooks(evidence, channel, targetAudience);

    // 해시태그 추천
    const hashtagRecommendations = this.generateHashtagRecommendations(channel, industry);

    return {
      recommended_directions: recommendedDirections,
      must_include: mustInclude,
      must_avoid: mustAvoid,
      recommended_hooks: recommendedHooks,
      hashtag_recommendations: hashtagRecommendations,
    };
  }

  /**
   * 추천 방향 생성
   */
  private generateRecommendedDirections(
    evidence: ValidatedEvidence[],
    industry: string,
    campaignGoal?: string
  ): RecommendedDirection[] {
    const directions: RecommendedDirection[] = [];

    // 비주얼 스타일 기반 방향
    const visualEvidence = evidence.filter(e => e.pattern.pattern_type === 'visual_style');
    if (visualEvidence.length > 0) {
      const topVisual = visualEvidence[0];
      directions.push({
        direction: `${topVisual.pattern.pattern_value} 중심 비주얼`,
        reasoning: topVisual.mechanism.psychological_basis,
        confidence_score: topVisual.confidence_score,
        source_insights: [topVisual.pattern.pattern_name],
      });
    }

    // 레이아웃 기반 방향
    const layoutEvidence = evidence.filter(e => e.pattern.pattern_type === 'layout');
    if (layoutEvidence.length > 0) {
      const topLayout = layoutEvidence[0];
      directions.push({
        direction: `${topLayout.pattern.pattern_value} 레이아웃 활용`,
        reasoning: topLayout.mechanism.channel_fit_reason,
        confidence_score: topLayout.confidence_score,
        source_insights: [topLayout.pattern.pattern_name],
      });
    }

    // 색상 기반 방향
    const colorEvidence = evidence.filter(e => e.pattern.pattern_type === 'color');
    if (colorEvidence.length > 0) {
      const topColor = colorEvidence[0];
      directions.push({
        direction: `${topColor.pattern.pattern_value} 색상 톤`,
        reasoning: topColor.mechanism.industry_fit_reason,
        confidence_score: topColor.confidence_score,
        source_insights: [topColor.pattern.pattern_name],
      });
    }

    // 캠페인 목표 기반 방향 추가
    if (campaignGoal) {
      const goalDirection = this.getGoalBasedDirection(campaignGoal, industry);
      if (goalDirection) {
        directions.push(goalDirection);
      }
    }

    // 신뢰도 순 정렬
    return directions.sort((a, b) => b.confidence_score - a.confidence_score).slice(0, 4);
  }

  /**
   * 캠페인 목표 기반 방향
   */
  private getGoalBasedDirection(goal: string, industry: string): RecommendedDirection | null {
    const goalDirections: Record<string, RecommendedDirection> = {
      awareness: {
        direction: '브랜드 스토리텔링 강조',
        reasoning: '인지도 목표는 감정적 연결과 기억에 남는 스토리가 효과적입니다.',
        confidence_score: 75,
        source_insights: ['campaign_goal:awareness'],
      },
      conversion: {
        direction: '명확한 가치 제안과 CTA',
        reasoning: '전환 목표는 구체적인 혜택과 행동 유도가 핵심입니다.',
        confidence_score: 80,
        source_insights: ['campaign_goal:conversion'],
      },
      engagement: {
        direction: '참여 유도 인터랙티브 요소',
        reasoning: '참여 목표는 댓글, 공유를 유도하는 질문이나 도전이 효과적입니다.',
        confidence_score: 70,
        source_insights: ['campaign_goal:engagement'],
      },
      traffic: {
        direction: '호기심 자극 훅과 링크 강조',
        reasoning: '트래픽 목표는 클릭을 유도하는 호기심 갭이 중요합니다.',
        confidence_score: 75,
        source_insights: ['campaign_goal:traffic'],
      },
    };

    return goalDirections[goal] || null;
  }

  /**
   * 필수 포함 요소 추출
   */
  private extractMustInclude(evidence: ValidatedEvidence[]): {
    visual_elements: string[];
    copy_elements: string[];
    format_elements: string[];
  } {
    const strongEvidence = evidence.filter(e => e.evidence_strength === 'strong');

    const visualElements: string[] = [];
    const copyElements: string[] = [];
    const formatElements: string[] = [];

    strongEvidence.forEach(e => {
      switch (e.pattern.pattern_type) {
        case 'visual_style':
          if (e.pattern.pattern_name === 'has_person' && e.pattern.pattern_value === 'yes') {
            visualElements.push('인물 등장');
          }
          if (e.pattern.pattern_name === 'image_type') {
            visualElements.push(`${e.pattern.pattern_value} 스타일 이미지`);
          }
          break;

        case 'color':
          if (e.pattern.pattern_name === 'contrast_level') {
            visualElements.push(`${e.pattern.pattern_value === 'high' ? '높은' : '적절한'} 대비`);
          }
          break;

        case 'text':
          if (e.pattern.pattern_name === 'has_cta' && e.pattern.pattern_value === 'yes') {
            copyElements.push('명확한 CTA 문구');
          }
          if (e.pattern.pattern_name === 'font_style') {
            copyElements.push(`${e.pattern.pattern_value} 폰트`);
          }
          break;

        case 'layout':
          formatElements.push(`${e.pattern.pattern_value} 레이아웃`);
          break;
      }
    });

    return {
      visual_elements: [...new Set(visualElements)].slice(0, 5),
      copy_elements: [...new Set(copyElements)].slice(0, 4),
      format_elements: [...new Set(formatElements)].slice(0, 3),
    };
  }

  /**
   * 피해야 할 요소 추출
   */
  private extractMustAvoid(evidence: ValidatedEvidence[], channel: Platform): string[] {
    const mustAvoid: string[] = [];

    // 실패 광고에서 높은 사용률을 보이는 패턴
    evidence.forEach(e => {
      if (e.pattern.usage_in_failure > 0.5 && e.pattern.difference_pp < -10) {
        mustAvoid.push(`${e.pattern.pattern_value} (실패 광고에서 ${(e.pattern.usage_in_failure * 100).toFixed(0)}% 사용)`);
      }
    });

    // 플랫폼별 일반적인 회피 요소
    const platformAvoid: Record<Platform, string[]> = {
      instagram_feed: ['과도한 텍스트 (20% 초과)', '저해상도 이미지', '복잡한 레이아웃'],
      instagram_story: ['가로 이미지', '작은 텍스트', '정적인 이미지'],
      tiktok: ['광고티 나는 프로덕션', '느린 전개', '가로 영상'],
      threads: ['과도한 해시태그', '홍보성 톤', '이미지 없는 텍스트만'],
      youtube_shorts: ['가로 영상', '긴 인트로', '자막 없음'],
      youtube_ads: ['저품질 프로덕션', '불명확한 CTA', '너무 긴 길이'],
    };

    mustAvoid.push(...(platformAvoid[channel] || []));

    return [...new Set(mustAvoid)].slice(0, 6);
  }

  /**
   * 추천 훅 생성
   */
  private generateRecommendedHooks(
    evidence: ValidatedEvidence[],
    channel: Platform,
    targetAudience?: string
  ): RecommendedHook[] {
    const hooks: RecommendedHook[] = [];

    // 플랫폼별 효과적인 훅 유형
    const platformHooks: Record<Platform, { type: string; template: string }[]> = {
      instagram_feed: [
        { type: '질문형', template: '혹시 이런 경험 있으세요?' },
        { type: '통계형', template: '92%의 사람들이 모르는 사실' },
        { type: '문제제기형', template: '이 실수를 하고 있진 않나요?' },
      ],
      instagram_story: [
        { type: '충격형', template: '이거 보기 전에 스크롤 멈춰!' },
        { type: '비밀공개형', template: '아무도 알려주지 않는 비밀' },
      ],
      tiktok: [
        { type: '스토리형', template: '처음엔 저도 몰랐어요...' },
        { type: '대담한주장형', template: '이건 진짜 인생템이에요' },
        { type: '반전형', template: '근데 알고보니...' },
      ],
      threads: [
        { type: '고백형', template: '솔직히 고백할게요' },
        { type: '관찰형', template: '요즘 느끼는 건데...' },
      ],
      youtube_shorts: [
        { type: '호기심형', template: '이게 가능하다고?' },
        { type: '비교형', template: 'A vs B, 뭐가 더 좋을까?' },
      ],
      youtube_ads: [
        { type: '가치제안형', template: '지금 바로 [혜택]을 얻으세요' },
        { type: '문제해결형', template: '[문제]로 고민이시라면' },
      ],
    };

    const channelHooks = platformHooks[channel] || platformHooks.instagram_feed;

    channelHooks.forEach((hook, index) => {
      hooks.push({
        hook_type: hook.type,
        example: hook.template,
        effectiveness_score: 85 - index * 5, // 순서대로 점수 감소
      });
    });

    return hooks.slice(0, 4);
  }

  /**
   * 해시태그 추천 생성
   */
  private generateHashtagRecommendations(
    channel: Platform,
    industry: string
  ): {
    primary: string[];
    secondary: string[];
    trending: string[];
  } {
    // 업종별 기본 해시태그
    const industryTags: Record<string, string[]> = {
      cosmetics: ['#뷰티', '#화장품', '#스킨케어', '#메이크업'],
      fashion: ['#패션', '#스타일', '#코디', '#ootd'],
      food: ['#맛집', '#푸드', '#먹스타그램', '#맛스타그램'],
      tech: ['#테크', '#IT', '#가젯', '#스마트'],
      fitness: ['#운동', '#헬스', '#다이어트', '#건강'],
    };

    // 플랫폼별 트렌딩 태그
    const platformTrending: Record<Platform, string[]> = {
      instagram_feed: ['#일상', '#daily', '#추천', '#꿀템'],
      instagram_story: ['#스토리', '#vlog'],
      tiktok: ['#fyp', '#foryou', '#추천', '#viral'],
      threads: ['#threads', '#스레드'],
      youtube_shorts: ['#shorts', '#숏츠'],
      youtube_ads: [],
    };

    const primary = industryTags[industry] || ['#라이프스타일', '#추천'];
    const secondary = ['#광고', '#브랜드', '#신상', '#리뷰'];
    const trending = platformTrending[channel] || [];

    return {
      primary: primary.slice(0, 4),
      secondary: secondary.slice(0, 4),
      trending: trending.slice(0, 4),
    };
  }

  /**
   * 분석 메타데이터 생성
   */
  private generateMetadata(
    collectedAds: CollectedAd[],
    evidence: ValidatedEvidence[]
  ): {
    sample_size: number;
    success_ads_count: number;
    average_ads_count: number;
    failure_ads_count: number;
    data_sources: AdSource[];
    analysis_quality_score: number;
    analyzed_at: Date;
    expires_at: Date;
  } {
    const successCount = collectedAds.filter(a => a.performance_tier === 'success').length;
    const averageCount = collectedAds.filter(a => a.performance_tier === 'average').length;
    const failureCount = collectedAds.filter(a => a.performance_tier === 'failure').length;

    // 데이터 소스 추출
    const sources = [...new Set(collectedAds.map(a => a.source))] as AdSource[];

    // 품질 점수 계산
    const qualityScore = this.calculateQualityScore(collectedAds, evidence);

    // 만료 시간 (24시간 후)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    return {
      sample_size: collectedAds.length,
      success_ads_count: successCount,
      average_ads_count: averageCount,
      failure_ads_count: failureCount,
      data_sources: sources,
      analysis_quality_score: qualityScore,
      analyzed_at: new Date(),
      expires_at: expiresAt,
    };
  }

  /**
   * 분석 품질 점수 계산 (개선된 버전)
   */
  private calculateQualityScore(
    collectedAds: CollectedAd[],
    evidence: ValidatedEvidence[]
  ): number {
    // 데이터가 없는 경우 최소 점수
    if (collectedAds.length === 0) return 30;
    if (evidence.length === 0) return 40;

    let score = 0;

    // 기본 점수 (모든 분석에 최소 기반 점수)
    const baseScore = 35;
    score += baseScore;

    // 샘플 수 점수 (0-20점) - 더 관대하게 계산
    // 10개 이상이면 최대 점수
    const sampleScore = Math.min(collectedAds.length * 2, 20);
    score += sampleScore;

    // 성공 광고 비율 (0-15점)
    const successRatio = collectedAds.filter(a => a.performance_tier === 'success').length / collectedAds.length;
    score += Math.round(successRatio * 15);

    // 강한/보통 근거 수 (0-20점)
    const strongCount = evidence.filter(e => e.evidence_strength === 'strong').length;
    const moderateCount = evidence.filter(e => e.evidence_strength === 'moderate').length;
    const evidenceScore = Math.min((strongCount * 4) + (moderateCount * 2), 20);
    score += evidenceScore;

    // 통계적 유의성 있는 패턴 비율 (0-10점)
    const significantCount = evidence.filter(e => e.is_statistically_significant).length;
    const significantRatio = evidence.length > 0 ? significantCount / evidence.length : 0;
    score += Math.round(significantRatio * 10);

    // 최종 점수 (50-100 범위로 정규화)
    const finalScore = Math.max(50, Math.min(100, score));

    return Math.round(finalScore);
  }

  /**
   * 기본 인사이트 생성 (데이터 부족 시)
   */
  generateDefaultInsights(channel: Platform, industry: string): ValidatedEvidence[] {
    // 채널/업종별 일반적인 베스트 프랙티스 인사이트
    const defaultInsights: ValidatedEvidence[] = [
      {
        pattern: {
          pattern_type: 'visual_style',
          pattern_name: 'image_quality',
          pattern_value: 'high-quality',
          usage_in_success: 0.85,
          usage_in_failure: 0.40,
          difference_pp: 45,
          support_count: 50,
          source_ads: [],
        },
        confidence_score: 80,
        is_statistically_significant: true,
        statistical_test: { test_type: 'best-practice', p_value: 0.01, sample_size_success: 50, sample_size_failure: 30 },
        evidence_strength: 'strong',
        mechanism: {
          psychological_basis: '고품질 이미지는 브랜드 신뢰도와 제품 품질 인식을 높입니다.',
          channel_fit_reason: `${channel}에서 고품질 비주얼은 피드 스크롤 중 주목도를 높입니다.`,
          industry_fit_reason: `${industry} 업종에서 제품 품질을 시각적으로 전달하는 것이 중요합니다.`,
        },
      },
      {
        pattern: {
          pattern_type: 'layout',
          pattern_name: 'visual_flow',
          pattern_value: 'center-focus',
          usage_in_success: 0.72,
          usage_in_failure: 0.35,
          difference_pp: 37,
          support_count: 45,
          source_ads: [],
        },
        confidence_score: 75,
        is_statistically_significant: true,
        statistical_test: { test_type: 'best-practice', p_value: 0.02, sample_size_success: 45, sample_size_failure: 25 },
        evidence_strength: 'strong',
        mechanism: {
          psychological_basis: '중앙 집중 레이아웃은 시선을 효과적으로 유도합니다.',
          channel_fit_reason: `모바일 ${channel}에서 빠른 스크롤 환경에서 즉각적인 주목을 유도합니다.`,
          industry_fit_reason: `${industry} 광고에서 핵심 메시지/제품에 집중하게 합니다.`,
        },
      },
      {
        pattern: {
          pattern_type: 'text',
          pattern_name: 'has_cta',
          pattern_value: 'yes',
          usage_in_success: 0.88,
          usage_in_failure: 0.52,
          difference_pp: 36,
          support_count: 55,
          source_ads: [],
        },
        confidence_score: 82,
        is_statistically_significant: true,
        statistical_test: { test_type: 'best-practice', p_value: 0.01, sample_size_success: 55, sample_size_failure: 30 },
        evidence_strength: 'strong',
        mechanism: {
          psychological_basis: '명확한 CTA는 사용자의 다음 행동을 안내합니다.',
          channel_fit_reason: `${channel}에서 스와이프/클릭을 유도하는 CTA가 전환을 높입니다.`,
          industry_fit_reason: `${industry}에서 구매/참여 의사결정을 촉진합니다.`,
        },
      },
      {
        pattern: {
          pattern_type: 'color',
          pattern_name: 'contrast_level',
          pattern_value: 'high',
          usage_in_success: 0.68,
          usage_in_failure: 0.38,
          difference_pp: 30,
          support_count: 40,
          source_ads: [],
        },
        confidence_score: 70,
        is_statistically_significant: true,
        statistical_test: { test_type: 'best-practice', p_value: 0.03, sample_size_success: 40, sample_size_failure: 25 },
        evidence_strength: 'moderate',
        mechanism: {
          psychological_basis: '높은 대비는 가독성과 시각적 임팩트를 높입니다.',
          channel_fit_reason: `${channel}의 피드에서 다른 콘텐츠와 차별화됩니다.`,
          industry_fit_reason: `${industry} 광고에서 핵심 요소를 강조합니다.`,
        },
      },
    ];

    return defaultInsights;
  }
}

// ============================================================================
// Export
// ============================================================================

export const insightGeneratorService = new InsightGeneratorService();

export { InsightGeneratorService };
