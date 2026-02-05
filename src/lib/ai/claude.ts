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

interface AnalysisInput {
  brandName: string;
  productDescription: string;
  campaignGoal: string;
  targetAudience: string;
  platforms: string[];
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

  // 개발 모드용 목 데이터
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

    try {
      // JSON 블록 추출 (```json ... ``` 또는 { ... } 형식)
      let jsonText = content.text.trim();

      // 마크다운 코드 블록 제거
      const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1].trim();
      }

      // { 로 시작하지 않으면 첫 { 부터 마지막 } 까지 추출
      if (!jsonText.startsWith('{')) {
        const startIdx = jsonText.indexOf('{');
        const endIdx = jsonText.lastIndexOf('}');
        if (startIdx !== -1 && endIdx !== -1) {
          jsonText = jsonText.substring(startIdx, endIdx + 1);
        }
      }

      return JSON.parse(jsonText);
    } catch (parseError) {
      // JSON 파싱 실패 시 에러 로깅
      console.error('Failed to parse Claude response:', content.text);
      console.error('Parse error:', parseError);
      throw new Error('Failed to parse analysis response');
    }
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

    try {
      // JSON 배열 추출
      let jsonText = content.text.trim();

      // 마크다운 코드 블록 제거
      const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1].trim();
      }

      // [ 로 시작하지 않으면 첫 [ 부터 마지막 ] 까지 추출
      if (!jsonText.startsWith('[')) {
        const startIdx = jsonText.indexOf('[');
        const endIdx = jsonText.lastIndexOf(']');
        if (startIdx !== -1 && endIdx !== -1) {
          jsonText = jsonText.substring(startIdx, endIdx + 1);
        }
      }

      return JSON.parse(jsonText);
    } catch (parseError) {
      console.error('Failed to parse concepts response:', content.text);
      console.error('Parse error:', parseError);
      throw new Error('Failed to parse concepts response');
    }
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
}

export const claude = new ClaudeService();
