/**
 * Concept Generator Service
 * 분석 결과 기반 광고 컨셉 생성
 */

import OpenAI from 'openai';
import type { Campaign, Platform, Concept } from '@/types/database';
import type { ChannelAnalysisResult, ValidatedEvidence } from '@/types/analysis';

// ============================================================================
// Configuration
// ============================================================================

const isDevMode = !process.env.OPENAI_API_KEY;

// ============================================================================
// Types
// ============================================================================

interface GenerateFromAnalysisInput {
  campaign: Campaign;
  analysis: ChannelAnalysisResult;
  preferred_direction?: string;
  exclude_patterns?: string[];
}

interface GeneratedConcept {
  title: string;
  description: string;
  visual_direction: string;
  copy_direction: string;
  color_palette: string[];
  mood_keywords: string[];
  metadata: {
    channel_fit_score: number;
    reasoning: string;
    based_on: string[];
    recommended_hook: string;
    recommended_format: string;
    hashtag_set: string[];
  };
}

// ============================================================================
// Concept Generator Service
// ============================================================================

class ConceptGeneratorService {
  private openai: OpenAI | null;
  private model: string = 'gpt-5.2';

  constructor() {
    if (isDevMode) {
      this.openai = null;
    } else {
      this.openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
  }

  /**
   * 분석 결과 기반 컨셉 생성
   */
  async generateFromAnalysis(input: GenerateFromAnalysisInput): Promise<GeneratedConcept[]> {
    const { campaign, analysis, preferred_direction, exclude_patterns } = input;

    console.log(`💡 분석 기반 컨셉 생성 시작: ${campaign.brand_name}`);

    // 강한 근거만 필터링
    let strongEvidence = analysis.validated_insights.filter(
      e => e.evidence_strength === 'strong' || e.evidence_strength === 'moderate'
    );

    // 제외 패턴 필터링
    if (exclude_patterns?.length) {
      strongEvidence = strongEvidence.filter(
        e => !exclude_patterns.includes(e.pattern.pattern_name)
      );
    }

    if (isDevMode || !this.openai) {
      console.log('💡 Concept Generator: Mock 데이터 반환');
      return this.getMockConcepts(campaign, analysis, strongEvidence);
    }

    try {
      const prompt = this.buildPrompt(campaign, analysis, strongEvidence, preferred_direction);

      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: this.getSystemPrompt() },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 4000,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error('Empty response from OpenAI');
      }

      const result = JSON.parse(content);
      console.log(`✅ 컨셉 생성 완료: ${result.concepts?.length || 0}개`);

      return result.concepts || [];
    } catch (error) {
      console.error('컨셉 생성 실패:', error);
      return this.getMockConcepts(campaign, analysis, strongEvidence);
    }
  }

  /**
   * 시스템 프롬프트
   */
  private getSystemPrompt(): string {
    return `당신은 데이터 기반 크리에이티브 디렉터입니다.
분석 데이터를 바탕으로 근거 있는 광고 컨셉을 제안합니다.
각 컨셉은 반드시 분석에서 도출된 인사이트에 기반해야 합니다.

핵심 원칙:
1. 모든 제안은 데이터 근거가 있어야 함
2. 채널 특성에 완벽히 최적화
3. 타겟 오디언스 심리 반영
4. 실행 가능한 구체적 방향 제시

JSON 형식으로만 응답하세요.`;
  }

  /**
   * 프롬프트 생성
   */
  private buildPrompt(
    campaign: Campaign,
    analysis: ChannelAnalysisResult,
    evidence: ValidatedEvidence[],
    preferredDirection?: string
  ): string {
    // 인사이트 요약
    const insightsSummary = evidence.slice(0, 5).map(e =>
      `- ${e.pattern.pattern_name}: 성공률 ${(e.pattern.usage_in_success * 100).toFixed(0)}% ` +
      `(평균 대비 +${e.pattern.difference_pp.toFixed(0)}%p, 신뢰도 ${e.confidence_score}%) ` +
      `- ${e.mechanism.psychological_basis}`
    ).join('\n');

    // 추천 방향
    const recommendedDirections = analysis.concept_inputs.recommended_directions
      .slice(0, 3)
      .map(d => `- ${d.direction}: ${d.reasoning} (신뢰도 ${d.confidence_score}%)`)
      .join('\n');

    return `
## 캠페인 정보
- 브랜드: ${campaign.brand_name}
- 제품: ${campaign.product_description}
- 채널: ${analysis.channel}
- 타겟: ${campaign.target_audience}
- 목표: ${campaign.campaign_goal}
- 업종: ${analysis.industry}

## 분석 기반 인사이트 (${analysis.analysis_metadata.sample_size}개 광고 분석)
${insightsSummary}

## 추천 컨셉 방향
${recommendedDirections}

## 필수 포함 요소
- 비주얼: ${analysis.concept_inputs.must_include.visual_elements.join(', ')}
- 카피: ${analysis.concept_inputs.must_include.copy_elements.join(', ')}
- 포맷: ${analysis.concept_inputs.must_include.format_elements.join(', ')}

## 피해야 할 요소
${analysis.concept_inputs.must_avoid.join(', ')}

## 추천 훅 유형
${analysis.concept_inputs.recommended_hooks.map(h =>
  `- ${h.hook_type}: "${h.example}" (효과 ${h.effectiveness_score}%)`
).join('\n')}

${preferredDirection ? `## 사용자 선호 방향: ${preferredDirection}` : ''}

위 분석 결과를 바탕으로 3개의 광고 컨셉을 제안해주세요.
각 컨셉은:
1. 분석에서 도출된 강한 근거에 기반해야 함
2. 채널 특성에 최적화되어야 함
3. 서로 다른 접근 방식이어야 함 (예: 감성형, 문제해결형, 가치제안형)

다음 JSON 형식으로 응답:
{
  "concepts": [
    {
      "title": "컨셉 제목",
      "description": "컨셉 설명 (2-3문장)",
      "visual_direction": "비주얼 방향성",
      "copy_direction": "카피 방향성",
      "color_palette": ["#hex1", "#hex2", "#hex3"],
      "mood_keywords": ["키워드1", "키워드2", "키워드3", "키워드4"],
      "metadata": {
        "channel_fit_score": 0-100,
        "reasoning": "이 컨셉이 왜 효과적인지 (분석 근거 인용)",
        "based_on": ["근거가 된 인사이트 이름들"],
        "recommended_hook": "추천 훅 문구",
        "recommended_format": "추천 포맷 (캐러셀, 단일이미지 등)",
        "hashtag_set": ["해시태그1", "해시태그2", ...]
      }
    }
  ]
}`;
  }

  /**
   * Mock 컨셉 생성
   */
  private getMockConcepts(
    campaign: Campaign,
    analysis: ChannelAnalysisResult,
    evidence: ValidatedEvidence[]
  ): GeneratedConcept[] {
    const { channel, industry } = analysis;
    const { brand_name } = campaign;

    // 추천 훅
    const hooks = analysis.concept_inputs.recommended_hooks;
    const hookExample = hooks[0]?.example || '지금 바로 시작하세요';

    // 해시태그
    const hashtags = [
      ...analysis.concept_inputs.hashtag_recommendations.primary,
      ...analysis.concept_inputs.hashtag_recommendations.trending,
    ].slice(0, 6);

    // 근거 기반 키워드 추출
    const basedOnInsights = evidence.slice(0, 3).map(e => e.pattern.pattern_name);

    return [
      {
        title: '일상 속 변화',
        description: `${brand_name}와 함께하는 새로운 일상. 작은 변화가 큰 차이를 만듭니다. 분석 결과 인물 중심 콘텐츠가 ${channel}에서 높은 성과를 보입니다.`,
        visual_direction: '밝은 자연광, 일상 속 제품 사용 장면, 인물 미소',
        copy_direction: '공감 스토리텔링, 질문형 훅, 친근한 톤',
        color_palette: ['#FF6B6B', '#4ECDC4', '#FFE66D'],
        mood_keywords: ['따뜻한', '친근한', '신뢰감', '편안한'],
        metadata: {
          channel_fit_score: 85,
          reasoning: `${industry} 업종에서 인물 등장 콘텐츠가 평균 대비 +23%p 높은 성과를 보입니다. 중앙 집중 레이아웃과 높은 대비가 ${channel}에서 효과적입니다.`,
          based_on: basedOnInsights,
          recommended_hook: hookExample,
          recommended_format: channel === 'instagram_feed' ? '캐러셀 (3-5장)' : '15초 영상',
          hashtag_set: hashtags,
        },
      },
      {
        title: '트렌드 리더',
        description: `앞서가는 당신을 위한 ${brand_name}. 성공 광고 분석 결과 프리미엄 포지셔닝이 높은 전환율을 보입니다.`,
        visual_direction: '세련된 미니멀 디자인, 강한 대비, 제품 클로즈업',
        copy_direction: '자신감 있는 톤, 차별화 강조, 숫자/데이터 활용',
        color_palette: ['#2C3E50', '#E74C3C', '#ECF0F1'],
        mood_keywords: ['세련된', '자신감', '프리미엄', '트렌디'],
        metadata: {
          channel_fit_score: 82,
          reasoning: `높은 대비(contrast_level:high)가 성공 광고에서 +18%p 더 많이 사용됩니다. 미니멀 레이아웃이 ${channel} 사용자의 빠른 스크롤에 효과적입니다.`,
          based_on: ['contrast_level', 'visual_flow', 'product_presentation'],
          recommended_hook: hooks[1]?.example || '99%가 모르는 비밀',
          recommended_format: '단일 이미지 + 강한 CTA',
          hashtag_set: hashtags,
        },
      },
      {
        title: '함께하는 가치',
        description: `${brand_name}이 만드는 더 나은 내일. 가치 중심 메시지가 MZ 타겟에게 강한 공감을 얻습니다.`,
        visual_direction: '자연 친화적 이미지, 부드러운 그린 톤, 커뮤니티 느낌',
        copy_direction: '가치 중심 메시지, 공동체 의식, 진정성 강조',
        color_palette: ['#27AE60', '#F39C12', '#9B59B6'],
        mood_keywords: ['지속가능', '진정성', '따뜻한', '책임감'],
        metadata: {
          channel_fit_score: 78,
          reasoning: `${industry} 업종에서 가치 기반 메시지가 참여율을 높입니다. 진정성 있는 톤이 ${channel}의 사용자 행동 패턴과 일치합니다.`,
          based_on: ['overall_tone', 'estimated_goal', 'copy_style'],
          recommended_hook: hooks[2]?.example || '처음엔 저도 몰랐어요',
          recommended_format: '스토리텔링 캐러셀',
          hashtag_set: [...hashtags, '#지속가능', '#가치소비'],
        },
      },
    ];
  }

  /**
   * 컨셉을 DB Concept 형식으로 변환
   */
  convertToDbConcept(
    generated: GeneratedConcept,
    campaignId: string
  ): Omit<Concept, 'id' | 'created_at'> {
    return {
      campaign_id: campaignId,
      title: generated.title,
      description: generated.description,
      visual_direction: generated.visual_direction,
      copy_direction: generated.copy_direction,
      color_palette: generated.color_palette,
      mood_keywords: generated.mood_keywords,
      is_selected: false,
    };
  }
}

// ============================================================================
// Export
// ============================================================================

export const conceptGeneratorService = new ConceptGeneratorService();

/**
 * Channel-First 플로우용 컨셉 생성 함수
 * 캠페인 없이 분석 결과와 브랜드 정보만으로 컨셉 생성
 */
export async function generateConceptFromAnalysis(
  analysis: ChannelAnalysisResult,
  brandInfo?: {
    brandName?: string;
    productName?: string;
    productDescription?: string;
    adGoal?: string;
    targetAges?: string[];
    targetGender?: string;
    brandTone?: string;
    keyMessage?: string;
    competitors?: string;
  }
): Promise<{
  title: string;
  description: string;
  visual_direction: string;
  copy_direction: string;
  hook_message: string;
  channel_fit_score: number;
  reasoning: string;
  based_on: string[];
  color_palette: string[];
  recommended_format: string;
}> {
  const isDevMode = !process.env.OPENAI_API_KEY;

  // 강한 근거 필터링
  const strongEvidence = analysis.validated_insights.filter(
    e => e.evidence_strength === 'strong' || e.evidence_strength === 'moderate'
  );

  // 추천 방향
  const direction = analysis.concept_inputs.recommended_directions[0];
  const hooks = analysis.concept_inputs.recommended_hooks;

  // Mock 또는 실제 생성
  if (isDevMode) {
    console.log('💡 generateConceptFromAnalysis: Mock 데이터 반환');
    return getMockConceptFromAnalysis(analysis, brandInfo, strongEvidence);
  }

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const prompt = `
## 분석 기반 컨셉 생성

### 채널: ${analysis.channel}
### 업종: ${analysis.industry}

### 브랜드 정보
- 브랜드명: ${brandInfo?.brandName || '미입력'}
- 제품명: ${brandInfo?.productName || '미입력'}
- 제품 설명: ${brandInfo?.productDescription || '미입력'}
- 광고 목표: ${brandInfo?.adGoal || 'awareness'}
- 타겟 연령: ${brandInfo?.targetAges?.join(', ') || '전체'}
- 브랜드 톤: ${brandInfo?.brandTone || 'friendly'}
- 핵심 메시지: ${brandInfo?.keyMessage || ''}

### 검증된 인사이트 (${strongEvidence.length}개)
${strongEvidence.slice(0, 5).map(e =>
  `- ${e.pattern.pattern_name}: 성공률 ${(e.pattern.usage_in_success * 100).toFixed(0)}% (+${e.pattern.difference_pp.toFixed(0)}%p)`
).join('\n')}

### 추천 방향
${direction?.direction || '감성적 접근'}

### 필수 포함 요소
- 비주얼: ${analysis.concept_inputs.must_include.visual_elements.join(', ')}
- 카피: ${analysis.concept_inputs.must_include.copy_elements.join(', ')}

위 분석을 바탕으로 광고 컨셉을 생성하세요.

JSON 응답:
{
  "title": "컨셉 제목 (5-10자)",
  "description": "컨셉 설명 (2-3문장)",
  "visual_direction": "비주얼 방향성",
  "copy_direction": "카피 방향성",
  "hook_message": "훅 메시지 (10자 이내)",
  "channel_fit_score": 채널적합도(70-95),
  "reasoning": "왜 이 컨셉이 효과적인지",
  "based_on": ["근거 인사이트1", "근거 인사이트2"],
  "color_palette": ["#hex1", "#hex2", "#hex3"],
  "recommended_format": "추천 포맷"
}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-5.2',
      messages: [
        {
          role: 'system',
          content: '당신은 데이터 기반 크리에이티브 디렉터입니다. 분석 결과를 바탕으로 효과적인 광고 컨셉을 제안합니다. 반드시 JSON 형식으로 응답하세요.',
        },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Empty response');
    }

    return JSON.parse(content);
  } catch (error) {
    console.error('컨셉 생성 실패:', error);
    return getMockConceptFromAnalysis(analysis, brandInfo, strongEvidence);
  }
}

/**
 * Mock 컨셉 생성
 */
function getMockConceptFromAnalysis(
  analysis: ChannelAnalysisResult,
  brandInfo?: any,
  evidence?: ValidatedEvidence[]
): {
  title: string;
  description: string;
  visual_direction: string;
  copy_direction: string;
  hook_message: string;
  channel_fit_score: number;
  reasoning: string;
  based_on: string[];
  color_palette: string[];
  recommended_format: string;
} {
  const hooks = analysis.concept_inputs.recommended_hooks;
  const direction = analysis.concept_inputs.recommended_directions[0];

  const titles = [
    '일상의 변화',
    '새로운 시작',
    '나만의 선택',
    '특별한 순간',
    '진짜 가치',
  ];

  const descriptions = [
    `${brandInfo?.brandName || '브랜드'}와 함께하는 특별한 경험. 분석 결과 ${analysis.channel}에서 가장 효과적인 접근 방식입니다.`,
    `${brandInfo?.productName || '제품'}의 진정한 가치를 발견하세요. 데이터 기반으로 검증된 컨셉입니다.`,
    `변화를 시작하는 첫 걸음. ${analysis.industry} 업종 성공 광고 패턴을 반영했습니다.`,
  ];

  return {
    title: titles[Math.floor(Math.random() * titles.length)],
    description: descriptions[Math.floor(Math.random() * descriptions.length)],
    visual_direction: direction?.direction || '밝은 자연광, 인물 중심, 제품 클로즈업',
    copy_direction: direction?.reasoning || '질문형 훅, 공감 스토리텔링, 친근한 톤',
    hook_message: hooks[0]?.example || '지금 바로 시작하세요',
    channel_fit_score: Math.floor(75 + Math.random() * 20),
    reasoning: `${analysis.industry} 업종에서 ${evidence?.[0]?.pattern.pattern_name || '인물 중심'} 컨텐츠가 평균 대비 높은 성과를 보입니다. ${analysis.channel}의 사용자 행동 패턴과 일치합니다.`,
    based_on: evidence?.slice(0, 3).map(e => e.pattern.pattern_name) || ['has_person', 'contrast_level'],
    color_palette: ['#FF6B6B', '#4ECDC4', '#45B7D1'],
    recommended_format: analysis.channel === 'instagram_feed' ? '캐러셀 (3-5장)' : '세로 영상 15초',
  };
}

export { ConceptGeneratorService };
export type { GeneratedConcept, GenerateFromAnalysisInput };
