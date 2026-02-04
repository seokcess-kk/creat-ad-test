# Design: 광고 소재 생성 솔루션 (Ad Creative Generator)

> 작성일: 2026-02-05
> 상태: Draft
> Feature ID: ad-creative-generator
> Plan 참조: [ad-creative-generator.plan.md](../../01-plan/features/ad-creative-generator.plan.md)

---

## 1. 시스템 아키텍처 (System Architecture)

### 1.1 전체 구조

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Client (Browser)                                │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                     Next.js App (App Router)                         │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐            │    │
│  │  │ Campaign │  │ Analysis │  │ Creative │  │ Generate │            │    │
│  │  │   Form   │  │  Report  │  │  Select  │  │  Result  │            │    │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘            │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Next.js API Routes                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ /api/campaign│  │ /api/analyze │  │ /api/concept │  │ /api/generate│    │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    ▼                 ▼                 ▼
         ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
         │   AI Layer   │   │   Database   │   │   Storage    │
         │              │   │              │   │              │
         │ • Nano Banana│   │  PostgreSQL  │   │ Cloudflare   │
         │   Pro (Image)│   │  (Supabase)  │   │     R2       │
         │ • Claude API │   │              │   │              │
         │   (Text)     │   │              │   │              │
         └──────────────┘   └──────────────┘   └──────────────┘
```

### 1.2 기술 스택 상세

| 레이어 | 기술 | 버전 | 용도 |
|--------|------|------|------|
| **Frontend** | Next.js | 15+ | App Router, RSC |
| | Tailwind CSS | 3.4+ | 스타일링 |
| | shadcn/ui | latest | UI 컴포넌트 |
| | Zustand | 5+ | 상태관리 |
| | React Query | 5+ | 서버 상태 |
| **Backend** | Next.js API Routes | - | API 엔드포인트 |
| | Zod | 3+ | 스키마 검증 |
| **Database** | Supabase | - | PostgreSQL + Auth |
| **AI** | Nano Banana Pro | gemini-3-pro-image-preview | 이미지 생성 |
| | Claude API | claude-3-sonnet | 텍스트 생성/분석 |
| **Storage** | Cloudflare R2 | - | 이미지 저장 |
| **Image** | Sharp | 0.33+ | 이미지 리사이징 |

---

## 2. 데이터 모델 (Data Model)

### 2.1 ERD

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│      User       │       │    Campaign     │       │    Analysis     │
├─────────────────┤       ├─────────────────┤       ├─────────────────┤
│ id (PK)         │──┐    │ id (PK)         │──┐    │ id (PK)         │
│ email           │  │    │ user_id (FK)    │  │    │ campaign_id(FK) │
│ name            │  └───▶│ brand_name      │  └───▶│ target_persona  │
│ avatar_url      │       │ product_desc    │       │ platform_guide  │
│ created_at      │       │ campaign_goal   │       │ trend_insights  │
│ updated_at      │       │ target_audience │       │ created_at      │
└─────────────────┘       │ platforms[]     │       └─────────────────┘
                          │ status          │
                          │ created_at      │              │
                          │ updated_at      │              │
                          └─────────────────┘              │
                                   │                       │
                                   ▼                       ▼
                          ┌─────────────────┐       ┌─────────────────┐
                          │    Concept      │       │    Creative     │
                          ├─────────────────┤       ├─────────────────┤
                          │ id (PK)         │──┐    │ id (PK)         │
                          │ campaign_id(FK) │  │    │ concept_id (FK) │
                          │ title           │  └───▶│ type (image/    │
                          │ description     │       │       copy)     │
                          │ visual_direction│       │ platform        │
                          │ copy_direction  │       │ content_url     │
                          │ color_palette[] │       │ copy_text       │
                          │ mood_keywords[] │       │ resolution      │
                          │ is_selected     │       │ metadata        │
                          │ created_at      │       │ created_at      │
                          └─────────────────┘       └─────────────────┘
```

### 2.2 스키마 정의

```typescript
// types/database.ts

// 캠페인 목표 타입
type CampaignGoal = 'awareness' | 'conversion' | 'engagement' | 'traffic';

// 플랫폼 타입
type Platform = 'instagram_feed' | 'instagram_story' | 'tiktok' | 'threads' | 'youtube_shorts' | 'youtube_ads';

// 캠페인 상태
type CampaignStatus = 'draft' | 'analyzing' | 'planning' | 'generating' | 'completed';

// 크리에이티브 타입
type CreativeType = 'image' | 'copy' | 'video';

// User
interface User {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

// Campaign
interface Campaign {
  id: string;
  user_id: string;
  brand_name: string;
  product_description: string;
  campaign_goal: CampaignGoal;
  target_audience: string;
  platforms: Platform[];
  status: CampaignStatus;
  created_at: string;
  updated_at: string;
}

// Analysis
interface Analysis {
  id: string;
  campaign_id: string;
  target_persona: TargetPersona;
  platform_guidelines: PlatformGuideline[];
  trend_insights: TrendInsight[];
  created_at: string;
}

interface TargetPersona {
  age_range: string;
  gender: string;
  interests: string[];
  pain_points: string[];
  motivations: string[];
}

interface PlatformGuideline {
  platform: Platform;
  tone: string;
  best_practices: string[];
  avoid: string[];
}

interface TrendInsight {
  topic: string;
  relevance: number;
  description: string;
}

// Concept
interface Concept {
  id: string;
  campaign_id: string;
  title: string;
  description: string;
  visual_direction: string;
  copy_direction: string;
  color_palette: string[];
  mood_keywords: string[];
  is_selected: boolean;
  created_at: string;
}

// Creative
interface Creative {
  id: string;
  concept_id: string;
  type: CreativeType;
  platform: Platform;
  content_url: string | null;  // 이미지/영상 URL
  copy_text: string | null;    // 카피 텍스트
  resolution: string;          // '1080x1080', '1080x1920', etc.
  metadata: CreativeMetadata;
  created_at: string;
}

interface CreativeMetadata {
  prompt?: string;
  model?: string;
  generation_params?: Record<string, unknown>;
}
```

### 2.3 Supabase 테이블 SQL

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users (Supabase Auth와 연동)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaigns
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  brand_name TEXT NOT NULL,
  product_description TEXT NOT NULL,
  campaign_goal TEXT NOT NULL CHECK (campaign_goal IN ('awareness', 'conversion', 'engagement', 'traffic')),
  target_audience TEXT NOT NULL,
  platforms TEXT[] NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'analyzing', 'planning', 'generating', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analysis
CREATE TABLE analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  target_persona JSONB NOT NULL,
  platform_guidelines JSONB NOT NULL,
  trend_insights JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Concepts
CREATE TABLE concepts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  visual_direction TEXT NOT NULL,
  copy_direction TEXT NOT NULL,
  color_palette TEXT[] NOT NULL,
  mood_keywords TEXT[] NOT NULL,
  is_selected BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Creatives
CREATE TABLE creatives (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  concept_id UUID REFERENCES concepts(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('image', 'copy', 'video')),
  platform TEXT NOT NULL,
  content_url TEXT,
  copy_text TEXT,
  resolution TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_campaigns_user_id ON campaigns(user_id);
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_concepts_campaign_id ON concepts(campaign_id);
CREATE INDEX idx_creatives_concept_id ON creatives(concept_id);

-- RLS Policies
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE concepts ENABLE ROW LEVEL SECURITY;
ALTER TABLE creatives ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can view own campaigns" ON campaigns
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own campaigns" ON campaigns
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own campaigns" ON campaigns
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own campaigns" ON campaigns
  FOR DELETE USING (auth.uid() = user_id);
```

---

## 3. API 설계 (API Design)

### 3.1 API 엔드포인트 목록

| Method | Endpoint | 설명 | 요청 | 응답 |
|--------|----------|------|------|------|
| POST | `/api/campaigns` | 캠페인 생성 | CampaignInput | Campaign |
| GET | `/api/campaigns` | 캠페인 목록 | - | Campaign[] |
| GET | `/api/campaigns/:id` | 캠페인 상세 | - | CampaignDetail |
| POST | `/api/campaigns/:id/analyze` | 분석 실행 | - | Analysis |
| POST | `/api/campaigns/:id/concepts` | 컨셉 생성 | - | Concept[] |
| PUT | `/api/concepts/:id/select` | 컨셉 선택 | - | Concept |
| POST | `/api/concepts/:id/generate` | 소재 생성 | GenerateInput | Creative[] |
| GET | `/api/creatives/:id/download` | 소재 다운로드 | - | File |

### 3.2 API 상세 명세

#### 3.2.1 캠페인 생성

```typescript
// POST /api/campaigns

// Request
interface CreateCampaignRequest {
  brand_name: string;
  product_description: string;
  campaign_goal: CampaignGoal;
  target_audience: string;
  platforms: Platform[];
}

// Response
interface CreateCampaignResponse {
  success: boolean;
  data: Campaign;
}

// Example
// Request:
{
  "brand_name": "에코프렌즈",
  "product_description": "친환경 텀블러. 이중 진공 단열로 12시간 보온/보냉. 100% 재활용 가능한 스테인리스 소재.",
  "campaign_goal": "awareness",
  "target_audience": "20-35세 환경에 관심 있는 직장인",
  "platforms": ["instagram_feed", "tiktok"]
}

// Response:
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "user-uuid",
    "brand_name": "에코프렌즈",
    "product_description": "친환경 텀블러...",
    "campaign_goal": "awareness",
    "target_audience": "20-35세 환경에 관심 있는 직장인",
    "platforms": ["instagram_feed", "tiktok"],
    "status": "draft",
    "created_at": "2026-02-05T10:00:00Z",
    "updated_at": "2026-02-05T10:00:00Z"
  }
}
```

#### 3.2.2 분석 실행

```typescript
// POST /api/campaigns/:id/analyze

// Response
interface AnalyzeResponse {
  success: boolean;
  data: Analysis;
}

// Example Response:
{
  "success": true,
  "data": {
    "id": "analysis-uuid",
    "campaign_id": "campaign-uuid",
    "target_persona": {
      "age_range": "25-35",
      "gender": "전체",
      "interests": ["환경보호", "지속가능성", "미니멀라이프", "건강"],
      "pain_points": ["일회용품 죄책감", "좋은 디자인의 친환경 제품 부족"],
      "motivations": ["지구 환경 기여", "스타일리시한 라이프스타일"]
    },
    "platform_guidelines": [
      {
        "platform": "instagram_feed",
        "tone": "감성적이고 영감을 주는",
        "best_practices": ["고품질 제품 사진", "라이프스타일 연출", "환경 메시지"],
        "avoid": ["과도한 텍스트", "저화질 이미지"]
      }
    ],
    "trend_insights": [
      {
        "topic": "제로웨이스트",
        "relevance": 0.95,
        "description": "제로웨이스트 라이프스타일 콘텐츠 인기 상승 중"
      }
    ],
    "created_at": "2026-02-05T10:05:00Z"
  }
}
```

#### 3.2.3 컨셉 생성

```typescript
// POST /api/campaigns/:id/concepts

// Response
interface ConceptsResponse {
  success: boolean;
  data: Concept[];
}

// Example Response:
{
  "success": true,
  "data": [
    {
      "id": "concept-1-uuid",
      "campaign_id": "campaign-uuid",
      "title": "일상 속 작은 변화",
      "description": "매일 사용하는 텀블러 하나로 환경을 지키는 일상의 모습을 보여주는 컨셉",
      "visual_direction": "따뜻한 자연광, 카페/사무실 배경, 손에 든 텀블러 클로즈업",
      "copy_direction": "부드럽고 친근한 톤, '오늘도 지구를 위한 한 잔' 같은 일상적 메시지",
      "color_palette": ["#2D5A27", "#F5F5DC", "#87CEEB"],
      "mood_keywords": ["따뜻함", "일상", "지속가능", "미니멀"],
      "is_selected": false,
      "created_at": "2026-02-05T10:10:00Z"
    },
    {
      "id": "concept-2-uuid",
      "campaign_id": "campaign-uuid",
      "title": "지구를 위한 스타일",
      "description": "친환경이 힙하고 트렌디할 수 있다는 것을 보여주는 패션/라이프스타일 컨셉",
      "visual_direction": "모던하고 세련된 배경, 패션 아이템과 함께 연출, 대비되는 컬러",
      "copy_direction": "자신감 있고 트렌디한 톤, '힙하게 지구 지키기' 같은 메시지",
      "color_palette": ["#1A1A1A", "#FFFFFF", "#00FF00"],
      "mood_keywords": ["트렌디", "힙", "모던", "자신감"],
      "is_selected": false,
      "created_at": "2026-02-05T10:10:00Z"
    },
    {
      "id": "concept-3-uuid",
      "campaign_id": "campaign-uuid",
      "title": "작은 행동, 큰 변화",
      "description": "개인의 작은 실천이 모여 큰 환경 변화를 만든다는 임팩트 중심 컨셉",
      "visual_direction": "데이터 시각화 요소, 자연 풍경과 제품의 대비, 임팩트 있는 구도",
      "copy_direction": "강렬하고 영감을 주는 톤, 통계와 함께 변화의 가능성 강조",
      "color_palette": ["#006400", "#4169E1", "#FFFFFF"],
      "mood_keywords": ["임팩트", "변화", "희망", "행동"],
      "is_selected": false,
      "created_at": "2026-02-05T10:10:00Z"
    }
  ]
}
```

#### 3.2.4 소재 생성

```typescript
// POST /api/concepts/:id/generate

// Request
interface GenerateRequest {
  platforms: Platform[];
  include_copy: boolean;
  resolution?: '2k' | '4k';
  variations?: number;  // 1-4
}

// Response
interface GenerateResponse {
  success: boolean;
  data: Creative[];
}

// Example Request:
{
  "platforms": ["instagram_feed", "tiktok"],
  "include_copy": true,
  "resolution": "2k",
  "variations": 2
}

// Example Response:
{
  "success": true,
  "data": [
    {
      "id": "creative-1-uuid",
      "concept_id": "concept-1-uuid",
      "type": "image",
      "platform": "instagram_feed",
      "content_url": "https://r2.example.com/creatives/abc123.png",
      "copy_text": null,
      "resolution": "1080x1080",
      "metadata": {
        "prompt": "A warm, sunlit cafe scene...",
        "model": "gemini-3-pro-image-preview"
      },
      "created_at": "2026-02-05T10:15:00Z"
    },
    {
      "id": "creative-2-uuid",
      "concept_id": "concept-1-uuid",
      "type": "copy",
      "platform": "instagram_feed",
      "content_url": null,
      "copy_text": "오늘도 지구를 위한 한 잔 ☕🌍\n\n매일 아침, 작은 선택이 큰 변화를 만들어요.\n에코프렌즈 텀블러와 함께라면\n환경도 지키고, 스타일도 챙기고.\n\n#에코프렌즈 #친환경텀블러 #제로웨이스트",
      "resolution": null,
      "metadata": {
        "model": "claude-3-sonnet"
      },
      "created_at": "2026-02-05T10:15:00Z"
    }
  ]
}
```

---

## 4. AI 서비스 연동 설계

### 4.1 Nano Banana Pro 연동

```typescript
// lib/ai/nano-banana.ts

import { GoogleGenerativeAI } from '@google/generative-ai';

interface ImageGenerationParams {
  prompt: string;
  resolution: '1k' | '2k' | '4k';
  aspectRatio: '1:1' | '4:5' | '9:16' | '16:9';
  style?: string;
}

interface GeneratedImage {
  url: string;
  prompt: string;
  resolution: string;
}

class NanoBananaService {
  private client: GoogleGenerativeAI;
  private model: string = 'gemini-3-pro-image-preview';

  constructor() {
    this.client = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);
  }

  async generateImage(params: ImageGenerationParams): Promise<GeneratedImage> {
    const model = this.client.getGenerativeModel({ model: this.model });

    // 해상도 매핑
    const resolutionMap = {
      '1k': { '1:1': '1024x1024', '4:5': '1024x1280', '9:16': '1024x1820', '16:9': '1820x1024' },
      '2k': { '1:1': '2048x2048', '4:5': '2048x2560', '9:16': '2048x3640', '16:9': '3640x2048' },
      '4k': { '1:1': '4096x4096', '4:5': '4096x5120', '9:16': '4096x7280', '16:9': '7280x4096' },
    };

    const resolution = resolutionMap[params.resolution][params.aspectRatio];

    const enhancedPrompt = this.buildPrompt(params);

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: enhancedPrompt }] }],
      generationConfig: {
        responseModalities: ['image'],
        imageGenerationConfig: {
          resolution: resolution,
          outputFormat: 'png',
        },
      },
    });

    // 이미지 데이터 추출 및 R2 업로드
    const imageData = result.response.candidates?.[0]?.content?.parts?.[0]?.inlineData;

    if (!imageData) {
      throw new Error('이미지 생성 실패');
    }

    const imageUrl = await this.uploadToR2(imageData.data, imageData.mimeType);

    return {
      url: imageUrl,
      prompt: enhancedPrompt,
      resolution: resolution,
    };
  }

  private buildPrompt(params: ImageGenerationParams): string {
    const basePrompt = params.prompt;
    const styleGuide = params.style
      ? `Style: ${params.style}. `
      : '';

    return `${styleGuide}${basePrompt}

Requirements:
- High quality, professional advertising photography
- Clean composition suitable for social media
- Vibrant colors, excellent lighting
- No text overlays (text will be added separately if needed)
- Commercial use appropriate`;
  }

  private async uploadToR2(base64Data: string, mimeType: string): Promise<string> {
    // Cloudflare R2 업로드 로직
    const buffer = Buffer.from(base64Data, 'base64');
    const fileName = `creatives/${Date.now()}-${Math.random().toString(36).slice(2)}.png`;

    // R2 업로드 구현
    // ...

    return `${process.env.R2_PUBLIC_URL}/${fileName}`;
  }
}

export const nanoBanana = new NanoBananaService();
```

### 4.2 Claude API 연동 (분석/카피 생성)

```typescript
// lib/ai/claude.ts

import Anthropic from '@anthropic-ai/sdk';

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
  analysis: Analysis;
}

class ClaudeService {
  private client: Anthropic;
  private model: string = 'claude-3-sonnet-20240229';

  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  async analyzeMarket(input: AnalysisInput): Promise<Analysis> {
    const systemPrompt = `당신은 광고 마케팅 전문가입니다.
주어진 브랜드/제품 정보를 분석하여 타겟 페르소나, 플랫폼별 가이드라인, 트렌드 인사이트를 JSON 형식으로 제공해주세요.`;

    const userPrompt = `
브랜드명: ${input.brandName}
제품 설명: ${input.productDescription}
캠페인 목표: ${input.campaignGoal}
타겟 오디언스: ${input.targetAudience}
타겟 플랫폼: ${input.platforms.join(', ')}

위 정보를 바탕으로 다음을 분석해주세요:
1. 타겟 페르소나 (연령대, 성별, 관심사, 페인포인트, 동기)
2. 플랫폼별 가이드라인 (톤앤매너, 베스트 프랙티스, 피해야 할 것)
3. 관련 트렌드 인사이트

JSON 형식으로 응답해주세요.`;

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 2000,
      messages: [
        { role: 'user', content: userPrompt }
      ],
      system: systemPrompt,
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    return JSON.parse(content.text);
  }

  async generateConcepts(analysis: Analysis, campaign: Campaign): Promise<Concept[]> {
    const systemPrompt = `당신은 크리에이티브 디렉터입니다.
주어진 분석 결과를 바탕으로 3개의 광고 컨셉을 제안해주세요.
각 컨셉은 서로 다른 방향성을 가져야 합니다.`;

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 3000,
      messages: [
        {
          role: 'user',
          content: `분석 결과: ${JSON.stringify(analysis)}
캠페인 정보: ${JSON.stringify(campaign)}

3개의 크리에이티브 컨셉을 JSON 배열로 제안해주세요.
각 컨셉에는 title, description, visual_direction, copy_direction, color_palette (hex 코드 3개), mood_keywords (4개)를 포함해주세요.`
        }
      ],
      system: systemPrompt,
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    return JSON.parse(content.text);
  }

  async generateCopy(input: CopyGenerationInput): Promise<string> {
    const platformGuide = this.getPlatformCopyGuide(input.platform);

    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 500,
      messages: [
        {
          role: 'user',
          content: `컨셉: ${JSON.stringify(input.concept)}
플랫폼: ${input.platform}
${platformGuide}

위 컨셉에 맞는 ${input.platform} 광고 카피를 작성해주세요.
해시태그도 포함해주세요.`
        }
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
      instagram_feed: '- 150자 내외\n- 이모지 적절히 사용\n- 해시태그 5-10개',
      instagram_story: '- 40자 내외\n- 임팩트 있는 한 줄\n- CTA 포함',
      tiktok: '- 짧고 트렌디한 표현\n- 밈/유행어 활용 가능\n- 해시태그 3-5개',
      threads: '- 텍스트 중심\n- 대화체\n- 200자 내외',
      youtube_shorts: '- 짧은 훅 문구\n- 30자 내외',
      youtube_ads: '- CTA 명확히\n- 가치 제안 포함',
    };
    return guides[platform] || '';
  }
}

export const claude = new ClaudeService();
```

---

## 5. UI/UX 설계

### 5.1 화면 구성

```
Pages:
├── / (Home/Dashboard)
│   └── 최근 프로젝트 목록
│   └── 새 프로젝트 시작 버튼
│
├── /create (캠페인 생성 위자드)
│   ├── Step 1: 캠페인 정보 입력
│   ├── Step 2: 분석 결과 확인
│   ├── Step 3: 컨셉 선택
│   ├── Step 4: 소재 생성
│   └── Step 5: 결과 확인/다운로드
│
├── /projects/:id (프로젝트 상세)
│   └── 캠페인 정보
│   └── 분석 결과
│   └── 생성된 소재
│
└── /settings (설정)
    └── 프로필
    └── API 키 관리
```

### 5.2 컴포넌트 구조

```
components/
├── ui/                          # shadcn/ui 기본 컴포넌트
│   ├── button.tsx
│   ├── card.tsx
│   ├── input.tsx
│   └── ...
│
├── campaign/
│   ├── CampaignForm.tsx         # 캠페인 입력 폼
│   ├── PlatformSelector.tsx     # 플랫폼 선택 UI
│   └── GoalSelector.tsx         # 목표 선택 UI
│
├── analysis/
│   ├── AnalysisReport.tsx       # 분석 결과 표시
│   ├── PersonaCard.tsx          # 페르소나 카드
│   └── TrendBadge.tsx           # 트렌드 배지
│
├── concept/
│   ├── ConceptCard.tsx          # 컨셉 카드
│   ├── ConceptSelector.tsx      # 컨셉 선택 UI
│   └── ColorPalette.tsx         # 컬러 팔레트 표시
│
├── creative/
│   ├── CreativeGallery.tsx      # 생성된 소재 갤러리
│   ├── ImagePreview.tsx         # 이미지 미리보기
│   ├── CopyPreview.tsx          # 카피 미리보기
│   └── DownloadButton.tsx       # 다운로드 버튼
│
└── layout/
    ├── Header.tsx
    ├── Sidebar.tsx
    └── Footer.tsx
```

### 5.3 주요 화면 와이어프레임

#### Step 1: 캠페인 정보 입력

```
┌─────────────────────────────────────────────────────────────────┐
│  [← Back]              새 광고 소재 만들기           Step 1/5   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  브랜드/제품명 *                                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 에코프렌즈                                               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  제품/서비스 설명 *                                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 친환경 텀블러. 이중 진공 단열로 12시간 보온/보냉.        │   │
│  │ 100% 재활용 가능한 스테인리스 소재.                      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  캠페인 목표 *                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐          │
│  │ ● 인지도  │ │ ○ 전환   │ │ ○ 참여   │ │ ○ 트래픽  │          │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘          │
│                                                                 │
│  타겟 오디언스 *                                                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 20-35세 환경에 관심 있는 직장인                          │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  타겟 플랫폼 * (복수 선택 가능)                                 │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐           │
│  │ ☑ Instagram  │ │ ☑ TikTok    │ │ ☐ YouTube    │           │
│  │    Feed      │ │              │ │    Shorts    │           │
│  └──────────────┘ └──────────────┘ └──────────────┘           │
│  ┌──────────────┐ ┌──────────────┐                             │
│  │ ☐ Instagram  │ │ ☐ Threads   │                             │
│  │    Stories   │ │              │                             │
│  └──────────────┘ └──────────────┘                             │
│                                                                 │
│                              ┌────────────────────┐            │
│                              │   분석 시작하기 →  │            │
│                              └────────────────────┘            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Step 3: 컨셉 선택

```
┌─────────────────────────────────────────────────────────────────┐
│  [← Back]              컨셉 선택                    Step 3/5   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  AI가 3개의 크리에이티브 컨셉을 제안합니다.                     │
│  마음에 드는 컨셉을 선택해주세요.                               │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ○ 컨셉 1: 일상 속 작은 변화                              │   │
│  │                                                          │   │
│  │ 매일 사용하는 텀블러 하나로 환경을 지키는                │   │
│  │ 일상의 모습을 보여주는 컨셉                              │   │
│  │                                                          │   │
│  │ 비주얼: 따뜻한 자연광, 카페/사무실 배경                  │   │
│  │ 카피: 부드럽고 친근한 톤                                 │   │
│  │                                                          │   │
│  │ [🟢] [🟤] [🔵]  #따뜻함 #일상 #지속가능 #미니멀         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ● 컨셉 2: 지구를 위한 스타일                    [선택됨] │   │
│  │                                                          │   │
│  │ 친환경이 힙하고 트렌디할 수 있다는 것을                  │   │
│  │ 보여주는 패션/라이프스타일 컨셉                          │   │
│  │                                                          │   │
│  │ 비주얼: 모던하고 세련된 배경, 패션 아이템과 연출         │   │
│  │ 카피: 자신감 있고 트렌디한 톤                            │   │
│  │                                                          │   │
│  │ [⬛] [⬜] [🟢]  #트렌디 #힙 #모던 #자신감                │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ ○ 컨셉 3: 작은 행동, 큰 변화                             │   │
│  │   ...                                                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│                              ┌────────────────────┐            │
│                              │   소재 생성하기 →  │            │
│                              └────────────────────┘            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Step 5: 결과 확인

```
┌─────────────────────────────────────────────────────────────────┐
│  [← Back]              생성 완료!                   Step 5/5   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Instagram Feed (1080x1080)                                     │
│  ┌────────────┐ ┌────────────┐                                 │
│  │            │ │            │                                 │
│  │  [이미지1] │ │  [이미지2] │                                 │
│  │            │ │            │                                 │
│  │  [⬇️ 다운] │ │  [⬇️ 다운] │                                 │
│  └────────────┘ └────────────┘                                 │
│                                                                 │
│  📝 카피                                                        │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ 힙하게 지구 지키기 🌍✨                                   │   │
│  │                                                          │   │
│  │ 스타일도 포기 못하고, 지구도 포기 못하는 당신을 위해.    │   │
│  │ 에코프렌즈와 함께라면 둘 다 가능해요.                    │   │
│  │                                                          │   │
│  │ #에코프렌즈 #친환경텀블러 #지속가능패션 #힙한환경보호    │   │
│  │                                               [📋 복사]  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  TikTok (1080x1920)                                             │
│  ┌────────────┐ ┌────────────┐                                 │
│  │            │ │            │                                 │
│  │  [이미지1] │ │  [이미지2] │                                 │
│  │            │ │            │                                 │
│  └────────────┘ └────────────┘                                 │
│                                                                 │
│  ┌────────────────────┐ ┌────────────────────┐                 │
│  │  📦 전체 다운로드   │ │  🔄 다시 생성하기  │                 │
│  └────────────────────┘ └────────────────────┘                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. 폴더 구조 (Project Structure)

```
ad-creative-generator/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── signup/
│   │       └── page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── page.tsx                    # 대시보드
│   │   ├── create/
│   │   │   └── page.tsx                # 캠페인 생성 위자드
│   │   ├── projects/
│   │   │   ├── page.tsx                # 프로젝트 목록
│   │   │   └── [id]/
│   │   │       └── page.tsx            # 프로젝트 상세
│   │   └── settings/
│   │       └── page.tsx
│   ├── api/
│   │   ├── campaigns/
│   │   │   ├── route.ts                # GET, POST
│   │   │   └── [id]/
│   │   │       ├── route.ts            # GET, PUT, DELETE
│   │   │       ├── analyze/
│   │   │       │   └── route.ts        # POST
│   │   │       └── concepts/
│   │   │           └── route.ts        # POST
│   │   ├── concepts/
│   │   │   └── [id]/
│   │   │       ├── select/
│   │   │       │   └── route.ts        # PUT
│   │   │       └── generate/
│   │   │           └── route.ts        # POST
│   │   └── creatives/
│   │       └── [id]/
│   │           └── download/
│   │               └── route.ts        # GET
│   ├── layout.tsx
│   └── globals.css
│
├── components/
│   ├── ui/                             # shadcn/ui
│   ├── campaign/
│   ├── analysis/
│   ├── concept/
│   ├── creative/
│   └── layout/
│
├── lib/
│   ├── ai/
│   │   ├── nano-banana.ts              # 이미지 생성
│   │   └── claude.ts                   # 텍스트 생성
│   ├── db/
│   │   ├── supabase.ts                 # Supabase 클라이언트
│   │   └── queries.ts                  # DB 쿼리 함수
│   ├── storage/
│   │   └── r2.ts                       # Cloudflare R2
│   ├── utils/
│   │   ├── image.ts                    # 이미지 처리
│   │   └── validation.ts               # 입력 검증
│   └── constants/
│       └── platforms.ts                # 플랫폼 상수
│
├── types/
│   ├── database.ts                     # DB 타입
│   ├── api.ts                          # API 타입
│   └── ai.ts                           # AI 관련 타입
│
├── hooks/
│   ├── useCampaign.ts
│   ├── useAnalysis.ts
│   └── useCreatives.ts
│
├── stores/
│   └── campaign-store.ts               # Zustand 스토어
│
├── public/
│   └── ...
│
├── .env.local
├── .env.example
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## 7. 환경 변수

```bash
# .env.example

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# AI Services
GOOGLE_AI_API_KEY=xxx                    # Nano Banana Pro
ANTHROPIC_API_KEY=xxx                    # Claude

# Cloudflare R2
R2_ACCOUNT_ID=xxx
R2_ACCESS_KEY_ID=xxx
R2_SECRET_ACCESS_KEY=xxx
R2_BUCKET_NAME=ad-creatives
R2_PUBLIC_URL=https://xxx.r2.dev

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 8. 구현 순서 (Implementation Order)

### Phase 1: 기반 구축
1. [ ] Next.js 프로젝트 초기화
2. [ ] Supabase 설정 및 테이블 생성
3. [ ] 인증 구현 (Supabase Auth)
4. [ ] 기본 레이아웃 및 UI 컴포넌트

### Phase 2: 핵심 기능
5. [ ] 캠페인 CRUD API
6. [ ] Claude 분석 기능 연동
7. [ ] 컨셉 생성 기능
8. [ ] Nano Banana Pro 이미지 생성 연동
9. [ ] Cloudflare R2 스토리지 연동

### Phase 3: UI 완성
10. [ ] 캠페인 생성 위자드 UI
11. [ ] 분석 결과 화면
12. [ ] 컨셉 선택 화면
13. [ ] 소재 갤러리 및 다운로드

### Phase 4: 마무리
14. [ ] 에러 핸들링 및 로딩 상태
15. [ ] 반응형 디자인
16. [ ] 테스트 및 버그 수정

---

## 9. 부록: 플랫폼별 규격 상수

```typescript
// lib/constants/platforms.ts

export const PLATFORM_SPECS = {
  instagram_feed: {
    name: 'Instagram Feed',
    resolutions: ['1080x1080', '1080x1350'],
    aspectRatios: ['1:1', '4:5'],
    maxFileSize: '30MB',
    formats: ['jpg', 'png'],
  },
  instagram_story: {
    name: 'Instagram Stories',
    resolutions: ['1080x1920'],
    aspectRatios: ['9:16'],
    maxFileSize: '30MB',
    formats: ['jpg', 'png'],
  },
  tiktok: {
    name: 'TikTok',
    resolutions: ['1080x1920'],
    aspectRatios: ['9:16'],
    maxFileSize: '287MB',
    formats: ['mp4', 'jpg', 'png'],
  },
  threads: {
    name: 'Threads',
    resolutions: ['1080x1080'],
    aspectRatios: ['1:1'],
    maxFileSize: '30MB',
    formats: ['jpg', 'png'],
  },
  youtube_shorts: {
    name: 'YouTube Shorts',
    resolutions: ['1080x1920'],
    aspectRatios: ['9:16'],
    maxFileSize: '256GB',
    formats: ['mp4'],
  },
  youtube_ads: {
    name: 'YouTube Ads',
    resolutions: ['1920x1080', '1080x1080'],
    aspectRatios: ['16:9', '1:1'],
    maxFileSize: '256GB',
    formats: ['mp4', 'jpg', 'png'],
  },
} as const;
```

---

**작성자**: Claude AI
**검토자**: (사용자 확인 필요)
**승인일**: (승인 대기)
