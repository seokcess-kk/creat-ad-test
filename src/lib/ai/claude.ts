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

class ClaudeService {
  private client: Anthropic;
  private model: string = 'claude-sonnet-4-20250514';

  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  async analyzeMarket(input: AnalysisInput): Promise<{
    target_persona: TargetPersona;
    platform_guidelines: PlatformGuideline[];
    trend_insights: TrendInsight[];
  }> {
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
      return JSON.parse(content.text);
    } catch {
      // JSON 파싱 실패 시 기본값 반환
      console.error('Failed to parse Claude response:', content.text);
      throw new Error('Failed to parse analysis response');
    }
  }

  async generateConcepts(
    analysis: Analysis,
    campaign: Campaign
  ): Promise<Omit<Concept, 'id' | 'campaign_id' | 'created_at' | 'is_selected'>[]> {
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
      return JSON.parse(content.text);
    } catch {
      console.error('Failed to parse concepts response:', content.text);
      throw new Error('Failed to parse concepts response');
    }
  }

  async generateCopy(input: CopyGenerationInput): Promise<string> {
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
