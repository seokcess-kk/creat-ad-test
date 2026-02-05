import Anthropic from '@anthropic-ai/sdk';
import type {
  Campaign,
  Analysis,
  Concept,
  Platform,
  TargetPersona,
  PlatformGuideline,
  TrendInsight,
} from '@/types/database';
import type {
  DeepAnalysis,
  IndustryAnalysis,
  CompetitorAnalysis,
  ConsumerJourney,
  PsychologicalTrigger,
  CulturalContext,
  SeasonalOpportunity,
  CreativeStrategy,
  EnhancedConcept,
  PlatformAdaptation,
  QualityScore,
} from '@/types/ai-advanced';
import {
  PLATFORM_DEEP_PROFILES,
  getPlatformPromptGuide,
  getPlatformCopyTemplate,
} from '@/lib/constants/platform-profiles';

interface AnalysisInput {
  brandName: string;
  productDescription: string;
  campaignGoal: string;
  targetAudience: string;
  platforms: string[];
}

interface DeepAnalysisInput extends AnalysisInput {
  industry?: string;
  competitors?: string[];
  budget?: string;
  timeline?: string;
}

interface CopyGenerationInput {
  concept: Concept;
  platform: Platform;
  brandName: string;
}

// API 키 확인
const isDevMode = !process.env.ANTHROPIC_API_KEY;

class ClaudeService {
  private client: Anthropic | null;
  private model: string = 'claude-sonnet-4-20250514';

  constructor() {
    if (isDevMode) {
      this.client = null;
      console.log('⚠️ Claude API: 개발 모드 (ANTHROPIC_API_KEY 없음)');
    } else {
      this.client = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
    }
  }

  // 개발 모드용 기본 목 데이터
  private getMockAnalysis(input: AnalysisInput): {
    target_persona: TargetPersona;
    platform_guidelines: PlatformGuideline[];
    trend_insights: TrendInsight[];
  } {
    return {
      target_persona: {
        age_range: '25-35',
        gender: 'all',
        interests: ['라이프스타일', '트렌드', '자기계발'],
        pain_points: ['시간 부족', '선택의 어려움', '품질 불안'],
        motivations: ['편리함', '가성비', '신뢰성'],
      },
      platform_guidelines: input.platforms.map((p) => ({
        platform: p as Platform,
        tone: '친근하고 트렌디한',
        best_practices: ['비주얼 강조', '짧은 문구', '해시태그 활용'],
        avoid: ['과장 광고', '부정적 표현'],
      })),
      trend_insights: [
        { topic: '지속가능성', relevance: 0.85, description: '환경 친화적 가치 중시' },
        { topic: '개인화', relevance: 0.9, description: '맞춤형 경험 선호' },
        { topic: '간편함', relevance: 0.88, description: '원클릭/원스톱 서비스 선호' },
      ],
    };
  }

  // 고도화된 심층 분석 목 데이터
  private getMockDeepAnalysis(input: DeepAnalysisInput): DeepAnalysis {
    const basicAnalysis = this.getMockAnalysis(input);

    return {
      ...basicAnalysis,
      industry_analysis: {
        market_size: '약 5조원 규모',
        growth_rate: '연 12% 성장',
        key_trends: ['디지털 전환 가속화', 'MZ세대 소비 주도', '가치 소비 확산'],
        competitive_intensity: 'high',
        entry_barriers: ['브랜드 인지도', '유통 채널', '마케팅 비용'],
        opportunities: ['틈새 시장 공략', '온라인 D2C 채널', '커뮤니티 마케팅'],
      },
      competitor_analysis: {
        direct_competitors: [
          {
            name: '경쟁사 A',
            positioning: '프리미엄 품질',
            strengths: ['브랜드 인지도', '유통망'],
            weaknesses: ['높은 가격', '젊은 층 소구력 부족'],
            messaging_style: '고급스러운 톤',
            target_overlap: 0.6,
          },
        ],
        indirect_competitors: [],
        positioning_map: {
          x_axis: { label: '가격', scale: ['저가', '고가'] },
          y_axis: { label: '혁신성', scale: ['전통적', '혁신적'] },
          brand_position: { x: 0.5, y: 0.7 },
          competitors: [{ name: '경쟁사 A', x: 0.8, y: 0.4 }],
          opportunity_zones: [{ x: 0.4, y: 0.8, description: '혁신적이면서 합리적 가격대' }],
        },
        differentiation_opportunities: ['기술 혁신', '가격 경쟁력', 'MZ 타겟 특화'],
        competitive_advantages: ['민첩한 의사결정', '디지털 네이티브'],
      },
      consumer_journey: {
        awareness: {
          touchpoints: ['SNS 광고', '인플루언서 콘텐츠', '검색 광고'],
          emotions: ['호기심', '관심'],
          pain_points: ['브랜드 인지도 부족'],
          opportunities: ['강렬한 첫인상', '차별화된 메시지'],
          content_types: ['숏폼 영상', '비주얼 중심 피드'],
        },
        interest: {
          touchpoints: ['상세 페이지', '리뷰', '비교 콘텐츠'],
          emotions: ['기대감', '비교 심리'],
          pain_points: ['정보 부족', '신뢰 부족'],
          opportunities: ['상세한 제품 정보', '사회적 증거'],
          content_types: ['상세 리뷰', '비교 영상'],
        },
        desire: {
          touchpoints: ['프로모션', '한정 혜택', '후기'],
          emotions: ['욕구', '긴급함'],
          pain_points: ['가격 부담', '결정 장애'],
          opportunities: ['특별 혜택', '희소성 강조'],
          content_types: ['프로모션 배너', '사용자 후기'],
        },
        action: {
          touchpoints: ['구매 페이지', '결제'],
          emotions: ['확신', '만족'],
          pain_points: ['복잡한 결제 과정'],
          opportunities: ['간편한 결제', '추가 혜택'],
          content_types: ['CTA 중심 광고'],
        },
        advocacy: {
          touchpoints: ['사용 경험', 'SNS 공유'],
          emotions: ['만족', '자부심'],
          pain_points: ['공유 동기 부족'],
          opportunities: ['리뷰 보상', '공유 캠페인'],
          content_types: ['UGC 캠페인', '리뷰 이벤트'],
        },
      },
      psychological_triggers: [
        {
          trigger_type: 'aspiration',
          description: '더 나은 나를 향한 열망',
          application: '제품 사용 후 변화된 모습 강조',
          intensity: 0.85,
        },
        {
          trigger_type: 'belonging',
          description: '트렌드에 뒤처지고 싶지 않은 심리',
          application: '또래 집단의 사용 사례 제시',
          intensity: 0.75,
        },
        {
          trigger_type: 'urgency',
          description: '놓치면 안 될 것 같은 심리',
          application: '한정 수량/기간 강조',
          intensity: 0.7,
        },
      ],
      cultural_context: {
        current_zeitgeist: ['워라밸', '소확행', '자기계발', '가심비'],
        relevant_movements: ['미니멀리즘', '지속가능성', '로컬 소비'],
        taboos: ['과장 광고', '환경 파괴', '무리한 비교'],
        cultural_codes: ['인증샷 문화', '리뷰 중시', 'SNS 공유'],
        localization_notes: '한국 소비자는 가성비와 품질 모두 중시',
      },
      seasonal_opportunities: [
        {
          period: '연중',
          event: '일상 마케팅',
          relevance: 0.8,
          messaging_angle: '일상 속 작은 변화',
          visual_theme: '일상 라이프스타일',
        },
      ],
    };
  }

  private getMockConcepts(campaign: Campaign) {
    return [
      {
        title: '일상의 변화',
        description: `${campaign.brand_name}와 함께하는 새로운 일상. 작은 변화가 큰 차이를 만듭니다.`,
        visual_direction: '밝고 따뜻한 색감, 일상 속 제품 사용 장면',
        copy_direction: '공감을 이끄는 스토리텔링',
        color_palette: ['#FF6B6B', '#4ECDC4', '#FFE66D'],
        mood_keywords: ['따뜻한', '친근한', '신뢰감', '편안한'],
      },
      {
        title: '트렌드 리더',
        description: `앞서가는 당신을 위한 ${campaign.brand_name}. 트렌드를 선도하세요.`,
        visual_direction: '세련된 미니멀 디자인, 대비가 강한 컬러',
        copy_direction: '자신감 있는 톤, 차별화 강조',
        color_palette: ['#2C3E50', '#E74C3C', '#ECF0F1'],
        mood_keywords: ['세련된', '자신감', '프리미엄', '트렌디'],
      },
      {
        title: '함께하는 가치',
        description: `${campaign.brand_name}이 만드는 더 나은 내일. 우리의 선택이 세상을 바꿉니다.`,
        visual_direction: '자연 친화적 이미지, 부드러운 그린 톤',
        copy_direction: '가치 중심 메시지, 공동체 의식',
        color_palette: ['#27AE60', '#F39C12', '#9B59B6'],
        mood_keywords: ['지속가능', '진정성', '따뜻한', '책임감'],
      },
    ];
  }

  // 플랫폼별 최적화된 고도화 컨셉
  private getMockEnhancedConcepts(
    campaign: Campaign,
    platforms: Platform[]
  ): Omit<EnhancedConcept, 'id' | 'campaign_id' | 'created_at'>[] {
    const baseConcepts = this.getMockConcepts(campaign);

    return baseConcepts.map((concept, index) => ({
      ...concept,
      is_selected: false,
      platform_adaptations: platforms.map((platform) => {
        const profile = PLATFORM_DEEP_PROFILES[platform];
        return {
          platform,
          adapted_hook: this.generatePlatformHook(concept.title, platform),
          adapted_copy_style: profile?.content_specs.copy_guidelines.tone.join(', ') || '친근한',
          visual_adjustments: this.getVisualAdjustments(platform),
          recommended_format: this.getRecommendedFormat(platform),
          hashtag_recommendations: this.getHashtagRecommendations(campaign.brand_name, platform),
        };
      }),
      psychological_hooks: [
        '일상의 작은 변화로 얻는 큰 만족',
        '놓치면 후회할 특별한 기회',
        '당신만을 위한 맞춤 솔루션',
      ],
      storytelling_angle:
        index === 0
          ? '문제 해결형 스토리텔링'
          : index === 1
            ? '열망 자극형 스토리텔링'
            : '가치 공감형 스토리텔링',
      differentiation_point:
        index === 0
          ? '실용적 가치 강조'
          : index === 1
            ? '프리미엄 포지셔닝'
            : '사회적 가치 연결',
    }));
  }

  private generatePlatformHook(conceptTitle: string, platform: Platform): string {
    const hookTemplates: Record<Platform, string> = {
      instagram_feed: `✨ ${conceptTitle}의 비밀, 지금 공개합니다`,
      instagram_story: `⬆️ 스와이프해서 확인하세요!`,
      tiktok: `이거 안 보면 진짜 손해...`,
      threads: `솔직히 말해서, ${conceptTitle}이 답이에요`,
      youtube_shorts: `0.5초 만에 사로잡는 ${conceptTitle}`,
      youtube_ads: `지금 바로 ${conceptTitle}을 경험하세요`,
    };
    return hookTemplates[platform];
  }

  private getVisualAdjustments(platform: Platform): string[] {
    const adjustments: Record<Platform, string[]> = {
      instagram_feed: ['1:1 정사각형', '고해상도 이미지', '텍스트 20% 이하'],
      instagram_story: ['9:16 풀스크린', '상단/하단 세이프존 확보', '동적 요소 추가'],
      tiktok: ['9:16 세로형', '첫 0.5초 임팩트', '자막 필수'],
      threads: ['텍스트 중심', '심플한 이미지', '읽기 쉬운 폰트'],
      youtube_shorts: ['9:16 세로형', '빠른 전환', '자막 포함'],
      youtube_ads: ['16:9 가로형', '고품질 프로덕션', '브랜드 로고 배치'],
    };
    return adjustments[platform];
  }

  private getRecommendedFormat(platform: Platform): string {
    const formats: Record<Platform, string> = {
      instagram_feed: '캐러셀 (3-5장) 또는 단일 이미지',
      instagram_story: '15초 영상 또는 인터랙티브 스토리',
      tiktok: '15-30초 숏폼 영상',
      threads: '텍스트 + 이미지 조합',
      youtube_shorts: '30-60초 세로 영상',
      youtube_ads: '15초/30초 스킵 가능 광고',
    };
    return formats[platform];
  }

  private getHashtagRecommendations(brandName: string, platform: Platform): string[] {
    const brandTag = `#${brandName.replace(/\s/g, '')}`;
    const commonTags = [brandTag, '#광고', '#추천'];

    const platformSpecificTags: Record<Platform, string[]> = {
      instagram_feed: ['#인스타그램', '#일상', '#라이프스타일', '#꿀템', '#추천템'],
      instagram_story: ['#스토리', '#오늘의추천'],
      tiktok: ['#틱톡', '#추천', '#fyp', '#foryou', '#viral'],
      threads: ['#threads', '#스레드'],
      youtube_shorts: ['#shorts', '#숏츠', '#유튜브'],
      youtube_ads: [],
    };

    return [...commonTags, ...platformSpecificTags[platform]].slice(0, 8);
  }

  private getMockCopy(input: CopyGenerationInput): string {
    return `✨ ${input.brandName}과 함께하는 특별한 순간

${input.concept.description}

지금 바로 경험해보세요! 👆

#${input.brandName.replace(/\s/g, '')} #광고 #추천 #라이프스타일 #트렌드`;
  }

  async analyzeMarket(input: AnalysisInput): Promise<{
    target_persona: TargetPersona;
    platform_guidelines: PlatformGuideline[];
    trend_insights: TrendInsight[];
  }> {
    // 개발 모드: 목 데이터 반환
    if (isDevMode || !this.client) {
      console.log('📊 Claude API: 목 분석 데이터 반환');
      return this.getMockAnalysis(input);
    }

    const systemPrompt = `당신은 광고 마케팅 전문가입니다.
주어진 브랜드/제품 정보를 분석하여 타겟 페르소나, 플랫폼별 가이드라인, 트렌드 인사이트를 JSON 형식으로 제공해주세요.
반드시 유효한 JSON만 응답해주세요. 다른 텍스트 없이 JSON만 출력하세요.`;

    const userPrompt = `
브랜드명: ${input.brandName}
제품 설명: ${input.productDescription}
캠페인 목표: ${input.campaignGoal}
타겟 오디언스: ${input.targetAudience}
타겟 플랫폼: ${input.platforms.join(', ')}

위 정보를 바탕으로 다음을 분석해주세요:
1. 타겟 페르소나 (age_range, gender, interests[], pain_points[], motivations[])
2. 플랫폼별 가이드라인 (platform, tone, best_practices[], avoid[])
3. 관련 트렌드 인사이트 (topic, relevance(0-1), description)

다음 JSON 형식으로 응답해주세요:
{
  "target_persona": { "age_range": "", "gender": "", "interests": [], "pain_points": [], "motivations": [] },
  "platform_guidelines": [{ "platform": "", "tone": "", "best_practices": [], "avoid": [] }],
  "trend_insights": [{ "topic": "", "relevance": 0.0, "description": "" }]
}`;

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 2000,
      messages: [{ role: 'user', content: userPrompt }],
      system: systemPrompt,
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    return this.parseJsonResponse(content.text);
  }

  /**
   * 고도화된 심층 분석 (Deep Analysis)
   * - 산업/경쟁사/소비자 여정/심리적 트리거/문화적 맥락 분석
   */
  async analyzeMarketDeep(input: DeepAnalysisInput): Promise<DeepAnalysis> {
    // 개발 모드: 목 데이터 반환
    if (isDevMode || !this.client) {
      console.log('📊 Claude API: 고도화된 심층 분석 목 데이터 반환');
      return this.getMockDeepAnalysis(input);
    }

    // 플랫폼별 상세 프로파일 정보 구성
    const platformProfiles = input.platforms
      .map((p) => {
        const profile = PLATFORM_DEEP_PROFILES[p as Platform];
        if (!profile) return '';
        return `
[${p} 플랫폼 특성]
- 알고리즘 핵심 시그널: ${profile.algorithm.primary_signals.join(', ')}
- 사용자 평균 세션: ${profile.user_behavior.average_session_duration}
- 스크롤 속도: ${profile.user_behavior.scroll_speed}
- 주의 집중 시간: ${profile.user_behavior.attention_span}
- 훅 필요 시간: ${profile.content_specs.hook_requirements.hook_window_seconds}초
- 최적 영상 길이: ${profile.content_specs.optimal_length.video_seconds.optimal}초
- 평균 참여율: ${(profile.benchmarks.average_engagement_rate * 100).toFixed(1)}%
`;
      })
      .join('\n');

    const systemPrompt = `당신은 최고 수준의 광고 전략 컨설턴트입니다.
주어진 브랜드/제품 정보와 플랫폼 특성을 바탕으로 심층적인 시장 분석을 수행해주세요.
각 플랫폼의 알고리즘 특성, 사용자 행동 패턴, 콘텐츠 요구사항을 반드시 반영해주세요.

분석 결과는 반드시 유효한 JSON 형식으로만 응답해주세요.`;

    const userPrompt = `
[브랜드 정보]
브랜드명: ${input.brandName}
제품 설명: ${input.productDescription}
캠페인 목표: ${input.campaignGoal}
타겟 오디언스: ${input.targetAudience}
${input.industry ? `산업 분야: ${input.industry}` : ''}
${input.competitors?.length ? `주요 경쟁사: ${input.competitors.join(', ')}` : ''}
${input.budget ? `예산 규모: ${input.budget}` : ''}
${input.timeline ? `캠페인 기간: ${input.timeline}` : ''}

[타겟 플랫폼 상세 특성]
${platformProfiles}

위 정보를 바탕으로 다음의 심층 분석을 수행해주세요:

1. 타겟 페르소나 (target_persona)
   - age_range, gender, interests[], pain_points[], motivations[]

2. 플랫폼별 가이드라인 (platform_guidelines[])
   - 각 플랫폼의 특성을 반영한 구체적인 톤, 베스트 프랙티스, 피해야 할 것

3. 트렌드 인사이트 (trend_insights[])
   - 현재 관련 트렌드, 관련도(0-1), 설명

4. 산업 분석 (industry_analysis)
   - market_size, growth_rate, key_trends[], competitive_intensity, entry_barriers[], opportunities[]

5. 경쟁사 분석 (competitor_analysis)
   - direct_competitors[], indirect_competitors[], differentiation_opportunities[]

6. 소비자 여정 분석 (consumer_journey)
   - awareness, interest, desire, action, advocacy 각 단계별 touchpoints[], emotions[], pain_points[], opportunities[], content_types[]

7. 심리적 트리거 (psychological_triggers[])
   - trigger_type(fear/aspiration/belonging/achievement/curiosity/urgency), description, application, intensity(0-1)

8. 문화적 맥락 (cultural_context)
   - current_zeitgeist[], relevant_movements[], taboos[], cultural_codes[], localization_notes

9. 시즌별 기회 (seasonal_opportunities[])
   - period, event, relevance, messaging_angle, visual_theme

JSON 형식으로만 응답해주세요.`;

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 6000,
      messages: [{ role: 'user', content: userPrompt }],
      system: systemPrompt,
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    return this.parseJsonResponse(content.text);
  }

  async generateConcepts(
    analysis: Analysis,
    campaign: Campaign
  ): Promise<Omit<Concept, 'id' | 'campaign_id' | 'created_at' | 'is_selected'>[]> {
    // 개발 모드: 목 데이터 반환
    if (isDevMode || !this.client) {
      console.log('💡 Claude API: 목 컨셉 데이터 반환');
      return this.getMockConcepts(campaign);
    }

    const systemPrompt = `당신은 크리에이티브 디렉터입니다.
주어진 분석 결과를 바탕으로 3개의 광고 컨셉을 제안해주세요.
각 컨셉은 서로 다른 방향성을 가져야 합니다.
반드시 유효한 JSON 배열만 응답해주세요.`;

    const userPrompt = `분석 결과:
- 타겟 페르소나: ${JSON.stringify(analysis.target_persona)}
- 플랫폼 가이드라인: ${JSON.stringify(analysis.platform_guidelines)}
- 트렌드 인사이트: ${JSON.stringify(analysis.trend_insights)}

캠페인 정보:
- 브랜드명: ${campaign.brand_name}
- 제품 설명: ${campaign.product_description}
- 캠페인 목표: ${campaign.campaign_goal}
- 타겟 오디언스: ${campaign.target_audience}

3개의 크리에이티브 컨셉을 JSON 배열로 제안해주세요.
각 컨셉에는 다음을 포함해주세요:
- title: 컨셉 제목 (한글)
- description: 컨셉 설명 (2-3문장)
- visual_direction: 비주얼 방향성
- copy_direction: 카피 방향성
- color_palette: hex 코드 배열 (3개)
- mood_keywords: 분위기 키워드 배열 (4개)

JSON 배열 형식으로만 응답해주세요.`;

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 3000,
      messages: [{ role: 'user', content: userPrompt }],
      system: systemPrompt,
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    return this.parseJsonResponse(content.text, true);
  }

  /**
   * 플랫폼별 최적화가 포함된 고도화 컨셉 생성
   */
  async generateEnhancedConcepts(
    deepAnalysis: DeepAnalysis,
    campaign: Campaign,
    platforms: Platform[]
  ): Promise<Omit<EnhancedConcept, 'id' | 'campaign_id' | 'created_at'>[]> {
    // 개발 모드: 목 데이터 반환
    if (isDevMode || !this.client) {
      console.log('💡 Claude API: 고도화된 컨셉 목 데이터 반환');
      return this.getMockEnhancedConcepts(campaign, platforms);
    }

    // 플랫폼별 상세 가이드 구성
    const platformGuides = platforms
      .map((p) => getPlatformPromptGuide(p))
      .filter(Boolean)
      .join('\n\n');

    const systemPrompt = `당신은 최고 수준의 크리에이티브 디렉터입니다.
심층 분석 결과와 플랫폼별 특성을 바탕으로 3개의 차별화된 광고 컨셉을 제안해주세요.
각 컨셉은 반드시 타겟 플랫폼의 알고리즘, 사용자 행동, 콘텐츠 스펙을 완벽히 반영해야 합니다.
JSON 배열 형식으로만 응답해주세요.`;

    const userPrompt = `[심층 분석 결과]

타겟 페르소나:
${JSON.stringify(deepAnalysis.target_persona, null, 2)}

산업 분석:
${JSON.stringify(deepAnalysis.industry_analysis, null, 2)}

경쟁사 분석 - 차별화 포인트:
${JSON.stringify(deepAnalysis.competitor_analysis.differentiation_opportunities, null, 2)}

소비자 심리 트리거:
${JSON.stringify(deepAnalysis.psychological_triggers, null, 2)}

문화적 맥락:
${JSON.stringify(deepAnalysis.cultural_context, null, 2)}

[캠페인 정보]
브랜드명: ${campaign.brand_name}
제품 설명: ${campaign.product_description}
캠페인 목표: ${campaign.campaign_goal}
타겟 오디언스: ${campaign.target_audience}

[플랫폼별 최적화 가이드]
${platformGuides}

위 분석을 바탕으로 3개의 크리에이티브 컨셉을 제안해주세요.
각 컨셉은 서로 다른 심리적 어필 방식을 사용해야 합니다:
1. 문제 해결형 (Pain Point 해소)
2. 열망 자극형 (Aspiration 어필)
3. 가치 공감형 (Value Alignment)

각 컨셉에는 다음을 포함해주세요:
- title: 컨셉 제목
- description: 컨셉 설명 (2-3문장)
- visual_direction: 비주얼 방향성
- copy_direction: 카피 방향성
- color_palette: hex 코드 배열 (3개)
- mood_keywords: 분위기 키워드 (4개)
- is_selected: false
- platform_adaptations: 각 플랫폼별 최적화 버전
  - platform: 플랫폼명
  - adapted_hook: 플랫폼 특성에 맞는 훅 (첫 0.5-3초용)
  - adapted_copy_style: 플랫폼에 맞는 카피 스타일
  - visual_adjustments: 비주얼 조정사항 배열
  - recommended_format: 추천 포맷
  - hashtag_recommendations: 해시태그 추천 배열
- psychological_hooks: 사용된 심리적 훅 배열 (3개)
- storytelling_angle: 스토리텔링 앵글
- differentiation_point: 경쟁사 대비 차별화 포인트

JSON 배열 형식으로만 응답해주세요.`;

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 6000,
      messages: [{ role: 'user', content: userPrompt }],
      system: systemPrompt,
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    return this.parseJsonResponse(content.text, true);
  }

  async generateCopy(input: CopyGenerationInput): Promise<string> {
    // 개발 모드: 목 데이터 반환
    if (isDevMode || !this.client) {
      console.log('✍️ Claude API: 목 카피 데이터 반환');
      return this.getMockCopy(input);
    }

    const platformGuide = this.getPlatformCopyGuide(input.platform);

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: `브랜드: ${input.brandName}
컨셉 제목: ${input.concept.title}
컨셉 설명: ${input.concept.description}
카피 방향: ${input.concept.copy_direction}
분위기: ${input.concept.mood_keywords.join(', ')}

플랫폼: ${input.platform}
${platformGuide}

위 컨셉에 맞는 ${input.platform} 광고 카피를 작성해주세요.
해시태그도 포함해주세요.
카피만 출력하세요.`,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    return content.text;
  }

  /**
   * 플랫폼 특성이 완전히 반영된 고도화 카피 생성
   */
  async generateOptimizedCopy(
    input: CopyGenerationInput,
    deepAnalysis?: DeepAnalysis
  ): Promise<string> {
    // 개발 모드: 목 데이터 반환
    if (isDevMode || !this.client) {
      console.log('✍️ Claude API: 최적화된 카피 목 데이터 반환');
      return this.getMockOptimizedCopy(input);
    }

    const profile = PLATFORM_DEEP_PROFILES[input.platform];
    const copyTemplate = getPlatformCopyTemplate(input.platform);

    const systemPrompt = `당신은 ${input.platform} 플랫폼 광고 카피 전문 작가입니다.
이 플랫폼의 알고리즘과 사용자 행동 패턴을 완벽히 이해하고 있습니다.
주어진 컨셉과 플랫폼 특성에 최적화된 광고 카피를 작성해주세요.
카피만 출력하세요. 설명이나 주석 없이 실제 사용 가능한 카피만 작성하세요.`;

    const userPrompt = `[브랜드 & 컨셉]
브랜드: ${input.brandName}
컨셉 제목: ${input.concept.title}
컨셉 설명: ${input.concept.description}
카피 방향: ${input.concept.copy_direction}
분위기: ${input.concept.mood_keywords.join(', ')}

[${input.platform} 플랫폼 특성]
- 사용자 평균 세션: ${profile?.user_behavior.average_session_duration || '알 수 없음'}
- 스크롤 속도: ${profile?.user_behavior.scroll_speed || '빠름'}
- 주의 집중 시간: ${profile?.user_behavior.attention_span || '짧음'}
- 콘텐츠 소비 방식: ${profile?.user_behavior.content_consumption_mode || 'passive'}

[카피 작성 가이드라인]
- 톤앤매너: ${profile?.content_specs.copy_guidelines.tone.join(', ') || '친근한'}
- 첫 줄 훅 필수: ${profile?.content_specs.copy_guidelines.first_line_hook ? '예' : '아니오'}
- 이모지 사용: ${profile?.content_specs.copy_guidelines.emoji_usage || 'moderate'}
- 최적 글자수: ${profile?.content_specs.optimal_length.caption_characters.optimal || 100}자
- 해시태그 전략: ${profile?.content_specs.copy_guidelines.hashtag_strategy || '5-10개'}
- CTA 스타일: ${profile?.content_specs.copy_guidelines.cta_style || '자연스러운'}
- 줄바꿈 방식: ${profile?.content_specs.copy_guidelines.line_breaks || '가독성 고려'}

[훅 작성 요구사항]
- 훅 시간: 첫 ${profile?.content_specs.hook_requirements.hook_window_seconds || 1}초 내 주목
- 효과적인 훅 유형: ${profile?.content_specs.hook_requirements.hook_types?.join(', ') || '질문, 충격, 공감'}
- 패턴 인터럽트 기법: ${profile?.content_specs.hook_requirements.pattern_interrupt_techniques?.join(', ') || '예상 깨기'}

${copyTemplate ? `[카피 템플릿 참고]\n${copyTemplate}` : ''}

${
  deepAnalysis
    ? `[타겟 심리 트리거]
${deepAnalysis.psychological_triggers?.map((t) => `- ${t.trigger_type}: ${t.application}`).join('\n') || ''}

[문화적 맥락]
- 현재 시대정신: ${deepAnalysis.cultural_context?.current_zeitgeist?.join(', ') || ''}
- 관련 문화 코드: ${deepAnalysis.cultural_context?.cultural_codes?.join(', ') || ''}`
    : ''
}

위 모든 요소를 반영하여 ${input.platform}에 완벽히 최적화된 광고 카피를 작성해주세요.
해시태그도 포함해주세요.`;

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 800,
      messages: [{ role: 'user', content: userPrompt }],
      system: systemPrompt,
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    return content.text;
  }

  /**
   * 생성된 크리에이티브 품질 검증
   */
  async validateQuality(
    copy: string,
    platform: Platform,
    concept: Concept
  ): Promise<QualityScore> {
    if (isDevMode || !this.client) {
      return this.getMockQualityScore();
    }

    const profile = PLATFORM_DEEP_PROFILES[platform];

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 1500,
      messages: [
        {
          role: 'user',
          content: `다음 광고 카피의 품질을 평가해주세요.

[카피]
${copy}

[컨셉]
제목: ${concept.title}
설명: ${concept.description}

[플랫폼]: ${platform}
[플랫폼 벤치마크]
- 평균 참여율: ${profile?.benchmarks.average_engagement_rate || 0.03}
- 평균 CTR: ${profile?.benchmarks.average_ctr || 0.02}

다음 JSON 형식으로 품질 점수를 평가해주세요:
{
  "overall_score": 0-100,
  "brand_consistency": 0-100,
  "platform_fit": 0-100,
  "message_clarity": 0-100,
  "visual_appeal": 0-100,
  "cta_effectiveness": 0-100,
  "recommendations": [
    { "area": "영역", "issue": "문제점", "suggestion": "개선 제안", "priority": "high/medium/low" }
  ]
}`,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    return this.parseJsonResponse(content.text);
  }

  private getMockOptimizedCopy(input: CopyGenerationInput): string {
    const profile = PLATFORM_DEEP_PROFILES[input.platform];
    const emojiLevel = profile?.content_specs.copy_guidelines.emoji_usage;

    const templates: Record<Platform, string> = {
      instagram_feed: `${emojiLevel === 'heavy' ? '✨ ' : ''}${input.concept.title}의 비밀

${input.concept.description}

${input.brandName}과 함께라면 당신도 할 수 있어요.
지금 바로 경험해보세요! 👆

#${input.brandName.replace(/\s/g, '')} #광고 #추천 #라이프스타일 #트렌드 #일상 #꿀템`,

      instagram_story: `⬆️ 스와이프!
${input.concept.title}
지금 확인하세요 👆`,

      tiktok: `이거 안 보면 진짜 손해...
${input.brandName} ${input.concept.title} 🔥
#${input.brandName.replace(/\s/g, '')} #추천 #fyp`,

      threads: `솔직히 말해서,
${input.concept.description}

${input.brandName}이 답이에요.
써보신 분들은 아실 거예요.`,

      youtube_shorts: `${input.concept.title}
${input.brandName}
#shorts #${input.brandName.replace(/\s/g, '')}`,

      youtube_ads: `[${input.brandName}]
${input.concept.title}

${input.concept.description}

지금 바로 시작하세요.`,
    };

    return templates[input.platform];
  }

  private getMockQualityScore(): QualityScore {
    return {
      overall_score: 85,
      brand_consistency: 88,
      platform_fit: 82,
      message_clarity: 90,
      visual_appeal: 80,
      cta_effectiveness: 85,
      recommendations: [
        {
          area: '훅',
          issue: '첫 줄의 임팩트가 약함',
          suggestion: '질문형 또는 충격적인 문구로 시작',
          priority: 'medium',
        },
      ],
    };
  }

  private getPlatformCopyGuide(platform: Platform): string {
    const guides: Record<Platform, string> = {
      instagram_feed: '가이드:\n- 150자 내외\n- 이모지 적절히 사용\n- 해시태그 5-10개',
      instagram_story: '가이드:\n- 40자 내외\n- 임팩트 있는 한 줄\n- CTA 포함',
      tiktok: '가이드:\n- 짧고 트렌디한 표현\n- 밈/유행어 활용 가능\n- 해시태그 3-5개',
      threads: '가이드:\n- 텍스트 중심\n- 대화체\n- 200자 내외',
      youtube_shorts: '가이드:\n- 짧은 훅 문구\n- 30자 내외',
      youtube_ads: '가이드:\n- CTA 명확히\n- 가치 제안 포함',
    };
    return guides[platform] || '';
  }

  /**
   * JSON 응답 파싱 헬퍼
   */
  private parseJsonResponse<T>(text: string, isArray = false): T {
    try {
      let jsonText = text.trim();

      // 마크다운 코드 블록 제거
      const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1].trim();
      }

      const startChar = isArray ? '[' : '{';
      const endChar = isArray ? ']' : '}';

      if (!jsonText.startsWith(startChar)) {
        const startIdx = jsonText.indexOf(startChar);
        const endIdx = jsonText.lastIndexOf(endChar);
        if (startIdx !== -1 && endIdx !== -1) {
          jsonText = jsonText.substring(startIdx, endIdx + 1);
        }
      }

      return JSON.parse(jsonText);
    } catch (parseError) {
      console.error('Failed to parse JSON response:', text);
      console.error('Parse error:', parseError);
      throw new Error('Failed to parse JSON response');
    }
  }
}

export const claude = new ClaudeService();
