# Design: Channel-First Ad Generator v2.0

> **Plan 문서**: `docs/01-plan/features/channel-first-ad-generator.plan.md`
> **핵심 목표**: 채널별 맞춤 광고 소재 생성, 근거 있는 분석 기반

---

## 1. 시스템 아키텍처

### 1.1 전체 아키텍처 개요

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Channel-First Ad Generator v2.0                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         CLIENT LAYER                                 │   │
│  │                                                                      │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │   │
│  │  │ 채널 선택    │  │ 분석 결과   │  │ 컨셉 생성   │              │   │
│  │  │ (Step 1)     │→│ (Step 2)     │→│ (Step 3-4)   │→ ...         │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘              │   │
│  │                                                                      │   │
│  │  React 19 + Next.js 16 + Zustand + React Query                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                      │                                      │
│                                      ▼                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                          API LAYER                                   │   │
│  │                                                                      │   │
│  │  ┌──────────────────────────────────────────────────────────────┐  │   │
│  │  │ /api/channels/:id/analyze     ← 채널 심층 분석 (핵심)        │  │   │
│  │  │ /api/channels/:id/trends      ← 채널 트렌드 조회             │  │   │
│  │  │ /api/campaigns                ← 캠페인 CRUD                  │  │   │
│  │  │ /api/campaigns/:id/concepts   ← 컨셉 생성 (분석 결과 활용)   │  │   │
│  │  │ /api/concepts/:id/generate    ← 소재 생성                    │  │   │
│  │  └──────────────────────────────────────────────────────────────┘  │   │
│  │                                                                      │   │
│  │  Next.js API Routes                                                  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                      │                                      │
│                                      ▼                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                       SERVICE LAYER                                  │   │
│  │                                                                      │   │
│  │  ┌────────────────────────────────────────────────────────────┐    │   │
│  │  │              ANALYSIS ENGINE (핵심 신규)                    │    │   │
│  │  │                                                             │    │   │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │    │   │
│  │  │  │ Ad Collector│  │ Vision     │  │ Evidence   │        │    │   │
│  │  │  │ Service     │→│ Analyzer   │→│ Validator  │        │    │   │
│  │  │  └─────────────┘  └─────────────┘  └─────────────┘        │    │   │
│  │  │         │                │                │                │    │   │
│  │  │         ▼                ▼                ▼                │    │   │
│  │  │  ┌─────────────────────────────────────────────────────┐  │    │   │
│  │  │  │              Pattern Synthesizer                     │  │    │   │
│  │  │  │  • 패턴 추출 • 통계 계산 • 근거 생성               │  │    │   │
│  │  │  └─────────────────────────────────────────────────────┘  │    │   │
│  │  └────────────────────────────────────────────────────────────┘    │   │
│  │                                                                      │   │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐        │   │
│  │  │ Concept        │  │ Creative       │  │ Copy           │        │   │
│  │  │ Generator      │  │ Generator      │  │ Generator      │        │   │
│  │  │ (분석 기반)    │  │ (Nano Banana)  │  │ (GPT-5.2)      │        │   │
│  │  └────────────────┘  └────────────────┘  └────────────────┘        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                      │                                      │
│                                      ▼                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    EXTERNAL SERVICES                                 │   │
│  │                                                                      │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │   │
│  │  │ Meta Ad      │  │ TikTok       │  │ Google Ads   │              │   │
│  │  │ Library API  │  │ Creative     │  │ Transparency │              │   │
│  │  │              │  │ Center API   │  │ API          │              │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘              │   │
│  │                                                                      │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │   │
│  │  │ Gemini       │  │ GPT-5.2      │  │ Nano Banana  │              │   │
│  │  │ Vision API   │  │ (OpenAI)     │  │ Pro          │              │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                      │                                      │
│                                      ▼                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      DATA LAYER                                      │   │
│  │                                                                      │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │   │
│  │  │ Supabase     │  │ Cloudflare   │  │ Redis        │              │   │
│  │  │ PostgreSQL   │  │ R2           │  │ (Cache)      │              │   │
│  │  │              │  │ (Images)     │  │              │              │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 분석 엔진 상세 아키텍처

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         ANALYSIS ENGINE v2.0                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  INPUT                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  • channel: Platform (단일)                                         │   │
│  │  • industry: string (업종)                                          │   │
│  │  • target_audience: string                                          │   │
│  │  • campaign_goal: string                                            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                      │                                      │
│                                      ▼                                      │
│  STEP 1: AD COLLECTION                                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                      │   │
│  │  AdCollectorService.collect({                                       │   │
│  │    platform: channel,                                               │   │
│  │    industry: industry,                                              │   │
│  │    sampling: {                                                      │   │
│  │      total: 60,                                                     │   │
│  │      industry_direct: 30,                                           │   │
│  │      industry_adjacent: 20,                                         │   │
│  │      industry_reference: 10                                         │   │
│  │    },                                                               │   │
│  │    time_range: { recent_7d: 20, recent_30d: 25, recent_90d: 15 },  │   │
│  │    performance_filter: { success: 40, average: 15, failure: 5 }    │   │
│  │  })                                                                 │   │
│  │                                                                      │   │
│  │  OUTPUT: CollectedAd[] (image_url, metadata, performance_tier)     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                      │                                      │
│                                      ▼                                      │
│  STEP 2: VISION ANALYSIS (병렬 처리)                                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                      │   │
│  │  VisionAnalyzerService.analyzeAll(ads: CollectedAd[])               │   │
│  │                                                                      │   │
│  │  각 이미지 → Gemini Vision API:                                     │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │ {                                                            │   │   │
│  │  │   layout: { grid_pattern, element_positions, visual_flow }, │   │   │
│  │  │   colors: { primary, secondary, accent, overall_tone },     │   │   │
│  │  │   text: { headline, subheadline, cta_text, font_style },    │   │   │
│  │  │   visual_style: { image_type, has_person, product_style },  │   │   │
│  │  │   ad_classification: { goal, audience, industry }           │   │   │
│  │  │ }                                                            │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  │  OUTPUT: ImageAnalysisResult[]                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                      │                                      │
│                                      ▼                                      │
│  STEP 3: PATTERN EXTRACTION                                                │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                      │   │
│  │  PatternSynthesizerService.extractPatterns(results, performance)    │   │
│  │                                                                      │   │
│  │  • 성공 광고 vs 평균 광고 vs 실패 광고 그룹화                       │   │
│  │  • 각 요소별 사용률 계산 (레이아웃, 색상, 카피 스타일 등)          │   │
│  │  • 성공 광고와 평균 광고 간 차이 계산 (percentage points)          │   │
│  │  • Top 패턴 추출                                                    │   │
│  │                                                                      │   │
│  │  OUTPUT: ExtractedPattern[]                                         │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                      │                                      │
│                                      ▼                                      │
│  STEP 4: EVIDENCE VALIDATION                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                      │   │
│  │  EvidenceValidatorService.validate(patterns: ExtractedPattern[])    │   │
│  │                                                                      │   │
│  │  각 패턴에 대해:                                                    │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │ 1. 통계적 유의성 검증 (p < 0.05)                            │   │   │
│  │  │ 2. 신뢰도 점수 계산 (0-100)                                 │   │   │
│  │  │ 3. 근거 강도 분류 (strong/moderate/weak)                    │   │   │
│  │  │ 4. 메커니즘 설명 생성 (GPT로 "왜 효과적인가" 설명)         │   │   │
│  │  │ 5. 채널/업종 적합성 매핑                                    │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  │                                                                      │   │
│  │  OUTPUT: ValidatedEvidence[]                                        │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                      │                                      │
│                                      ▼                                      │
│  STEP 5: INSIGHT GENERATION                                                │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                                                                      │   │
│  │  InsightGeneratorService.generate(evidence: ValidatedEvidence[])    │   │
│  │                                                                      │   │
│  │  • 컨셉 생성용 입력 데이터 구조화                                  │   │
│  │  • 추천 방향 정렬 (신뢰도 순)                                      │   │
│  │  • 레퍼런스 이미지 선정 (상위 3개)                                 │   │
│  │  • 사용자 표시용 인사이트 포맷팅                                   │   │
│  │                                                                      │   │
│  │  OUTPUT: ChannelAnalysisResult                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. 외부 서비스 연동

### 2.1 광고 라이브러리 API

#### 2.1.1 Meta Ad Library API

```typescript
// src/lib/external/meta-ad-library.ts

interface MetaAdLibraryConfig {
  access_token: string;  // Meta Business API 토큰
  api_version: string;   // "v19.0"
}

interface MetaAdSearchParams {
  search_terms?: string;           // 검색어
  ad_reached_countries: string[];  // ["KR"]
  ad_active_status: 'ACTIVE' | 'INACTIVE' | 'ALL';
  ad_type: 'POLITICAL_AND_ISSUE_ADS' | 'ALL';
  publisher_platforms: ('facebook' | 'instagram' | 'audience_network' | 'messenger')[];

  // 필터링
  search_page_ids?: string[];      // 특정 페이지 ID
  bylines?: string[];              // 광고주명 검색

  // 페이징
  limit: number;
  after?: string;
}

interface MetaAdResult {
  id: string;
  ad_creation_time: string;
  ad_creative_bodies: string[];
  ad_creative_link_captions: string[];
  ad_creative_link_titles: string[];
  ad_delivery_start_time: string;
  ad_delivery_stop_time?: string;

  // 이미지 관련
  ad_snapshot_url: string;         // 광고 스냅샷 URL (스크래핑 필요)

  // 메타데이터
  page_id: string;
  page_name: string;
  publisher_platforms: string[];

  // 성과 추정 (범위로 제공)
  impressions?: {
    lower_bound: string;
    upper_bound: string;
  };
  spend?: {
    lower_bound: string;
    upper_bound: string;
    currency: string;
  };
}

class MetaAdLibraryService {
  private config: MetaAdLibraryConfig;

  async searchAds(params: MetaAdSearchParams): Promise<MetaAdResult[]> {
    const url = `https://graph.facebook.com/${this.config.api_version}/ads_archive`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.config.access_token}`
      },
      params: {
        ...params,
        fields: 'id,ad_creation_time,ad_creative_bodies,ad_snapshot_url,page_name,impressions,spend'
      }
    });

    return response.data;
  }

  // 광고 스냅샷에서 이미지 URL 추출
  async extractImageFromSnapshot(snapshotUrl: string): Promise<string> {
    // 스냅샷 페이지를 로드하고 이미지 URL 추출
    // (실제 구현 시 headless browser 또는 HTML 파싱 필요)
  }

  // 성공 광고 판별 (Plan에서 정의한 기준)
  isSuccessfulAd(ad: MetaAdResult): boolean {
    const deliveryDays = this.calculateDeliveryDays(ad);
    return deliveryDays >= 14;  // 14일 이상 집행
  }

  private calculateDeliveryDays(ad: MetaAdResult): number {
    const start = new Date(ad.ad_delivery_start_time);
    const end = ad.ad_delivery_stop_time
      ? new Date(ad.ad_delivery_stop_time)
      : new Date();
    return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }
}

export const metaAdLibrary = new MetaAdLibraryService();
```

#### 2.1.2 TikTok Creative Center API

```typescript
// src/lib/external/tiktok-creative-center.ts

interface TikTokCreativeCenterConfig {
  access_token: string;
}

interface TikTokTopAdsParams {
  region: string;           // "KR"
  period: 7 | 30 | 120;     // 일 수
  industry_id?: string;     // 업종 ID
  objective?: 'REACH' | 'TRAFFIC' | 'VIDEO_VIEWS' | 'CONVERSIONS';
  ad_format?: 'SINGLE_VIDEO' | 'SPARK_AD' | 'COLLECTION';
  order_by: 'engagement_rate' | 'like_count' | 'share_count';
  page: number;
  page_size: number;
}

interface TikTokTopAdResult {
  ad_id: string;
  video_info: {
    video_url: string;
    cover_image_url: string;     // 썸네일 (Vision 분석용)
    duration: number;
  };
  ad_text: string;
  brand_name: string;

  // 성과 지표
  metrics: {
    play_count: number;
    like_count: number;
    comment_count: number;
    share_count: number;
    engagement_rate: number;     // 참여율
  };

  // 메타데이터
  industry: string;
  objective: string;
  country_code: string;
  first_seen_date: string;
  last_seen_date: string;
}

class TikTokCreativeCenterService {
  async getTopAds(params: TikTokTopAdsParams): Promise<TikTokTopAdResult[]> {
    // TikTok Creative Center API 호출
    // https://ads.tiktok.com/business/creativecenter/inspiration/topads/pc/en

    // 참고: 공식 API가 제한적이므로 웹 스크래핑 병행 가능
  }

  // 성공 광고 판별
  isSuccessfulAd(ad: TikTokTopAdResult, allAds: TikTokTopAdResult[]): boolean {
    // 상위 20% 기준
    const sortedByEngagement = [...allAds].sort(
      (a, b) => b.metrics.engagement_rate - a.metrics.engagement_rate
    );
    const top20Index = Math.floor(allAds.length * 0.2);
    return sortedByEngagement.indexOf(ad) < top20Index;
  }
}

export const tiktokCreativeCenter = new TikTokCreativeCenterService();
```

### 2.2 Gemini Vision API

```typescript
// src/lib/ai/gemini-vision.ts

import { GoogleGenerativeAI } from '@google/generative-ai';

interface GeminiVisionConfig {
  apiKey: string;
  model: string;  // "gemini-1.5-pro-vision"
}

// Vision 분석 결과 타입 (Plan에서 정의)
interface ImageAnalysisResult {
  layout: {
    grid_pattern: string;
    element_positions: {
      product: string;
      headline: string;
      logo: string;
      cta: string;
    };
    visual_flow: string;
    whitespace_usage: string;
  };

  colors: {
    primary: string;
    secondary: string;
    accent: string;
    overall_tone: string;
    contrast_level: string;
  };

  text: {
    headline: string;
    subheadline: string | null;
    cta_text: string | null;
    font_style: string;
    text_ratio_percent: number;
  };

  visual_style: {
    image_type: string;
    has_person: boolean;
    person_expression?: string;
    product_presentation: string;
    filters_effects: string[];
  };

  ad_classification: {
    estimated_goal: string;
    estimated_audience: string;
    industry: string;
  };
}

class GeminiVisionService {
  private genAI: GoogleGenerativeAI;
  private model: string;

  constructor(config: GeminiVisionConfig) {
    this.genAI = new GoogleGenerativeAI(config.apiKey);
    this.model = config.model;
  }

  async analyzeAdImage(imageUrl: string): Promise<ImageAnalysisResult> {
    const model = this.genAI.getGenerativeModel({ model: this.model });

    // 이미지 로드
    const imageData = await this.fetchImageAsBase64(imageUrl);

    const prompt = `
이 광고 이미지를 다음 관점에서 상세히 분석해주세요.
반드시 JSON 형식으로만 응답해주세요.

## 분석 항목

1. layout (레이아웃)
   - grid_pattern: 그리드 패턴 (예: "2-column", "centered", "asymmetric", "split-horizontal")
   - element_positions: 각 요소의 위치
     - product: 제품 위치 (예: "center", "left-third", "bottom", "none")
     - headline: 헤드라인 위치 (예: "top-center", "overlay-center")
     - logo: 로고 위치 (예: "top-left", "bottom-right")
     - cta: CTA 위치 (예: "bottom-center", "none")
   - visual_flow: 시선 흐름 (예: "F-pattern", "Z-pattern", "center-focus", "left-to-right")
   - whitespace_usage: 여백 활용 (예: "minimal", "moderate", "generous")

2. colors (색상)
   - primary: 주요 색상 hex 코드 (예: "#FF5733")
   - secondary: 보조 색상 hex 코드
   - accent: 강조 색상 hex 코드
   - overall_tone: 전체 톤 (예: "warm-bright", "cool-dark", "neutral-soft")
   - contrast_level: 대비 수준 (예: "high", "medium", "low")

3. text (텍스트)
   - headline: OCR로 추출한 메인 헤드라인 텍스트
   - subheadline: 서브 헤드라인 (없으면 null)
   - cta_text: CTA 문구 (없으면 null)
   - font_style: 폰트 스타일 (예: "bold-sans", "elegant-serif", "handwritten")
   - text_ratio_percent: 이미지 대비 텍스트 비율 (0-100)

4. visual_style (비주얼 스타일)
   - image_type: 이미지 유형 (예: "photo", "illustration", "graphic", "3d", "mixed")
   - has_person: 인물 등장 여부 (true/false)
   - person_expression: 인물 표정 (없으면 생략) (예: "smiling", "serious", "surprised")
   - product_presentation: 제품 표현 방식 (예: "closeup", "lifestyle", "before-after", "flat-lay")
   - filters_effects: 적용된 필터/효과 배열 (예: ["high-saturation", "soft-focus", "vignette"])

5. ad_classification (광고 분류)
   - estimated_goal: 추정 광고 목표 (예: "awareness", "conversion", "engagement")
   - estimated_audience: 추정 타겟 (예: "young-women-20s", "business-professionals")
   - industry: 추정 업종 (예: "cosmetics", "tech", "food", "fashion")

JSON 형식으로만 응답해주세요:
`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: imageData
        }
      }
    ]);

    const text = result.response.text();
    return this.parseJsonResponse(text);
  }

  // 병렬 분석 (여러 이미지)
  async analyzeMultiple(
    imageUrls: string[],
    concurrency: number = 5
  ): Promise<ImageAnalysisResult[]> {
    const results: ImageAnalysisResult[] = [];

    // 배치 처리
    for (let i = 0; i < imageUrls.length; i += concurrency) {
      const batch = imageUrls.slice(i, i + concurrency);
      const batchResults = await Promise.all(
        batch.map(url => this.analyzeAdImage(url))
      );
      results.push(...batchResults);
    }

    return results;
  }

  private async fetchImageAsBase64(url: string): Promise<string> {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    return Buffer.from(buffer).toString('base64');
  }

  private parseJsonResponse(text: string): ImageAnalysisResult {
    // JSON 추출 및 파싱
    const jsonMatch = text.match(/```json\s*([\s\S]*?)```/) ||
                      text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('Failed to parse JSON from response');

    const jsonText = jsonMatch[1] || jsonMatch[0];
    return JSON.parse(jsonText.trim());
  }
}

export const geminiVision = new GeminiVisionService({
  apiKey: process.env.GOOGLE_AI_API_KEY!,
  model: 'gemini-1.5-pro-vision'
});
```

---

## 3. 데이터 모델

### 3.1 새로운 테이블 설계

```sql
-- 기존 campaigns 테이블 수정
ALTER TABLE campaigns
  DROP COLUMN platforms,
  ADD COLUMN platform VARCHAR(50) NOT NULL,  -- 단일 채널
  ADD COLUMN industry VARCHAR(100);           -- 업종

-- 채널 분석 결과 테이블 (신규)
CREATE TABLE channel_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  channel VARCHAR(50) NOT NULL,
  industry VARCHAR(100) NOT NULL,

  -- 분석 결과 (JSONB)
  realtime_trends JSONB,           -- 실시간 트렌드 분석
  competitor_analysis JSONB,        -- 경쟁사/성공사례 분석
  target_audience_analysis JSONB,   -- 타겟 오디언스 분석

  -- 패턴 및 인사이트
  validated_patterns JSONB,         -- 검증된 패턴들
  concept_inputs JSONB,             -- 컨셉 생성용 입력 데이터

  -- 레퍼런스
  reference_ads JSONB,              -- 레퍼런스 광고 정보 (썸네일 URL 포함)

  -- 분석 메타데이터
  sample_size INTEGER,
  analysis_quality_score INTEGER,   -- 0-100
  data_sources TEXT[],              -- ['meta_ad_library', 'tiktok_creative_center']

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE  -- 캐시 만료 시점
);

-- 분석에 사용된 광고 데이터 (캐싱용)
CREATE TABLE analyzed_ads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_analysis_id UUID REFERENCES channel_analyses(id) ON DELETE CASCADE,

  -- 광고 정보
  external_ad_id VARCHAR(255),      -- 외부 API의 광고 ID
  source VARCHAR(50),               -- 'meta', 'tiktok', 'google'
  image_url TEXT,
  thumbnail_url TEXT,

  -- 성과 분류
  performance_tier VARCHAR(20),     -- 'success', 'average', 'failure'
  delivery_days INTEGER,            -- 집행 일수

  -- Vision 분석 결과
  vision_analysis JSONB,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 업종별 분석 캐시 (재사용)
CREATE TABLE industry_analysis_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel VARCHAR(50) NOT NULL,
  industry VARCHAR(100) NOT NULL,

  -- 집계된 패턴
  aggregated_patterns JSONB,

  -- 메타데이터
  ads_analyzed INTEGER,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(channel, industry)
);

-- 인덱스
CREATE INDEX idx_channel_analyses_campaign ON channel_analyses(campaign_id);
CREATE INDEX idx_channel_analyses_channel_industry ON channel_analyses(channel, industry);
CREATE INDEX idx_analyzed_ads_analysis ON analyzed_ads(channel_analysis_id);
CREATE INDEX idx_industry_cache_lookup ON industry_analysis_cache(channel, industry);
```

### 3.2 TypeScript 타입 정의

```typescript
// src/types/analysis.ts

import type { Platform } from './database';

// 성공 광고 판별 기준
export interface SuccessCriteria {
  min_active_days: number;           // 14
  performance_tier: 'top_20_percent';
  same_advertiser_reuse?: boolean;
}

// 샘플링 설계
export interface SamplingConfig {
  total: number;                     // 60
  industry_direct: number;           // 30
  industry_adjacent: number;         // 20
  industry_reference: number;        // 10

  time_distribution: {
    recent_7d: number;
    recent_30d: number;
    recent_90d: number;
  };

  performance_distribution: {
    success: number;
    average: number;
    failure: number;
  };
}

// 수집된 광고
export interface CollectedAd {
  id: string;
  source: 'meta' | 'tiktok' | 'google';
  external_id: string;

  image_url: string;
  thumbnail_url?: string;

  advertiser: string;
  delivery_start: Date;
  delivery_end?: Date;
  delivery_days: number;

  performance_tier: 'success' | 'average' | 'failure';

  // 성과 지표 (있는 경우)
  metrics?: {
    impressions_range?: [number, number];
    engagement_rate?: number;
  };
}

// Vision 분석 결과 (Gemini)
export interface ImageAnalysisResult {
  layout: {
    grid_pattern: string;
    element_positions: {
      product: string;
      headline: string;
      logo: string;
      cta: string;
    };
    visual_flow: string;
    whitespace_usage: string;
  };

  colors: {
    primary: string;
    secondary: string;
    accent: string;
    overall_tone: string;
    contrast_level: string;
  };

  text: {
    headline: string;
    subheadline: string | null;
    cta_text: string | null;
    font_style: string;
    text_ratio_percent: number;
  };

  visual_style: {
    image_type: string;
    has_person: boolean;
    person_expression?: string;
    product_presentation: string;
    filters_effects: string[];
  };

  ad_classification: {
    estimated_goal: string;
    estimated_audience: string;
    industry: string;
  };
}

// 추출된 패턴
export interface ExtractedPattern {
  pattern_type: 'layout' | 'color' | 'text' | 'visual_style';
  pattern_name: string;
  pattern_value: string;

  usage_in_success: number;      // 성공 광고 내 사용률 (0-1)
  usage_in_average: number;      // 평균 광고 내 사용률 (0-1)
  usage_in_failure: number;      // 실패 광고 내 사용률 (0-1)

  difference_pp: number;         // 성공 vs 평균 차이 (percentage points)
}

// 검증된 근거
export interface ValidatedEvidence {
  pattern: ExtractedPattern;

  // 통계적 검증
  is_statistically_significant: boolean;
  p_value?: number;
  confidence_score: number;      // 0-100
  evidence_strength: 'strong' | 'moderate' | 'weak';

  // 메커니즘 설명
  mechanism: {
    psychological_basis: string;
    channel_fit_reason: string;
    industry_fit_reason: string;
  };

  // 레퍼런스
  reference_ads: {
    thumbnail_url: string;
    advertiser: string;
    delivery_days: number;
  }[];
}

// 채널 분석 결과 (최종 출력)
export interface ChannelAnalysisResult {
  channel: Platform;
  industry: string;

  // 검증된 인사이트들
  validated_insights: ValidatedEvidence[];

  // 컨셉 생성용 입력
  concept_inputs: {
    recommended_directions: {
      direction: string;
      reasoning: string;
      confidence_score: number;
      source_insights: string[];
    }[];

    must_include: {
      visual_elements: string[];
      copy_elements: string[];
      format_elements: string[];
    };

    must_avoid: string[];

    recommended_hooks: {
      hook_type: string;
      example: string;
      effectiveness_score: number;
    }[];

    hashtag_recommendations: {
      primary: string[];
      secondary: string[];
      trending: string[];
    };
  };

  // 메타데이터
  analysis_metadata: {
    sample_size: number;
    success_ads_count: number;
    average_ads_count: number;
    data_sources: string[];
    analysis_quality_score: number;
    analyzed_at: Date;
    expires_at: Date;
  };
}
```

---

## 4. API 설계

### 4.1 채널 분석 API

```typescript
// src/app/api/channels/[id]/analyze/route.ts

import { NextRequest } from 'next/server';
import { withLogging, successResponse, errorResponse } from '@/lib/api-utils';
import { adCollectorService } from '@/lib/services/ad-collector';
import { visionAnalyzerService } from '@/lib/services/vision-analyzer';
import { patternSynthesizerService } from '@/lib/services/pattern-synthesizer';
import { evidenceValidatorService } from '@/lib/services/evidence-validator';
import { insightGeneratorService } from '@/lib/services/insight-generator';
import { channelAnalysisCache } from '@/lib/cache/channel-analysis';
import type { Platform } from '@/types/database';
import type { ChannelAnalysisResult } from '@/types/analysis';

interface AnalyzeRequest {
  industry: string;
  target_audience?: string;
  campaign_goal?: string;
  force_refresh?: boolean;  // 캐시 무시하고 재분석
}

interface AnalyzeResponse {
  success: boolean;
  data: ChannelAnalysisResult;
  cached: boolean;
}

// POST /api/channels/:id/analyze
export const POST = withLogging(async (request: NextRequest, { log, requestId, params }) => {
  const channel = params?.id as Platform;

  if (!channel) {
    return errorResponse('채널 ID가 필요합니다', requestId, 400);
  }

  const body: AnalyzeRequest = await request.json();
  const { industry, target_audience, campaign_goal, force_refresh } = body;

  if (!industry) {
    return errorResponse('업종 정보가 필요합니다', requestId, 400);
  }

  log.info('Starting channel analysis', { channel, industry });

  try {
    // 1. 캐시 확인
    if (!force_refresh) {
      const cached = await channelAnalysisCache.get(channel, industry);
      if (cached && !cached.isExpired()) {
        log.info('Returning cached analysis', { channel, industry });
        return successResponse({
          success: true,
          data: cached.data,
          cached: true
        }, requestId);
      }
    }

    // 2. 광고 수집
    log.info('Collecting ads from external sources');
    const collectedAds = await adCollectorService.collect({
      platform: channel,
      industry,
      sampling: {
        total: 60,
        industry_direct: 30,
        industry_adjacent: 20,
        industry_reference: 10
      },
      time_distribution: {
        recent_7d: 20,
        recent_30d: 25,
        recent_90d: 15
      },
      performance_distribution: {
        success: 40,
        average: 15,
        failure: 5
      }
    });

    log.info('Ads collected', {
      total: collectedAds.length,
      success: collectedAds.filter(a => a.performance_tier === 'success').length
    });

    // 3. Vision AI 분석 (병렬)
    log.info('Analyzing images with Vision AI');
    const imageUrls = collectedAds.map(ad => ad.image_url);
    const visionResults = await visionAnalyzerService.analyzeMultiple(imageUrls);

    // 4. 패턴 추출
    log.info('Extracting patterns');
    const extractedPatterns = patternSynthesizerService.extractPatterns(
      visionResults,
      collectedAds.map(ad => ad.performance_tier)
    );

    // 5. 근거 검증
    log.info('Validating evidence');
    const validatedEvidence = await evidenceValidatorService.validate(
      extractedPatterns,
      { channel, industry }
    );

    // 6. 인사이트 생성
    log.info('Generating insights');
    const analysisResult = insightGeneratorService.generate({
      channel,
      industry,
      evidence: validatedEvidence,
      collectedAds,
      target_audience,
      campaign_goal
    });

    // 7. 캐시 저장
    await channelAnalysisCache.set(channel, industry, analysisResult);

    log.info('Channel analysis completed', {
      channel,
      industry,
      insights_count: analysisResult.validated_insights.length,
      quality_score: analysisResult.analysis_metadata.analysis_quality_score
    });

    return successResponse({
      success: true,
      data: analysisResult,
      cached: false
    }, requestId);

  } catch (error) {
    log.error('Channel analysis failed', { error: String(error) });
    return errorResponse(
      `채널 분석에 실패했습니다: ${error instanceof Error ? error.message : 'Unknown error'}`,
      requestId,
      500
    );
  }
});
```

### 4.2 컨셉 생성 API (분석 결과 활용)

```typescript
// src/app/api/campaigns/[id]/concepts/route.ts

import { NextRequest } from 'next/server';
import { withLogging, successResponse, errorResponse } from '@/lib/api-utils';
import { getCampaignById, getChannelAnalysis, createConcepts } from '@/lib/db/queries';
import { conceptGeneratorService } from '@/lib/services/concept-generator';

interface GenerateConceptsRequest {
  analysis_id: string;              // 연결된 분석 결과 ID
  preferred_direction?: string;     // 사용자 선호 방향
  exclude_patterns?: string[];      // 제외할 패턴
}

// POST /api/campaigns/:id/concepts
export const POST = withLogging(async (request: NextRequest, { log, requestId, params }) => {
  const campaignId = params?.id;

  if (!campaignId) {
    return errorResponse('캠페인 ID가 필요합니다', requestId, 400);
  }

  const body: GenerateConceptsRequest = await request.json();
  const { analysis_id, preferred_direction, exclude_patterns } = body;

  if (!analysis_id) {
    return errorResponse('분석 결과 ID가 필요합니다', requestId, 400);
  }

  try {
    // 캠페인 및 분석 결과 조회
    const [campaign, analysis] = await Promise.all([
      getCampaignById(campaignId),
      getChannelAnalysis(analysis_id)
    ]);

    if (!campaign) {
      return errorResponse('캠페인을 찾을 수 없습니다', requestId, 404);
    }

    if (!analysis) {
      return errorResponse('분석 결과를 찾을 수 없습니다', requestId, 404);
    }

    log.info('Generating concepts from analysis', {
      campaignId,
      analysisId: analysis_id,
      insightsCount: analysis.validated_insights.length
    });

    // 분석 기반 컨셉 생성
    const concepts = await conceptGeneratorService.generateFromAnalysis({
      campaign,
      analysis,
      preferred_direction,
      exclude_patterns
    });

    // 저장
    const savedConcepts = await createConcepts(campaignId, concepts);

    log.info('Concepts generated', {
      campaignId,
      conceptsCount: savedConcepts.length
    });

    return successResponse({
      success: true,
      data: savedConcepts.map(concept => ({
        ...concept,
        // 분석 기반 메타데이터 추가
        channel_fit_score: concept.metadata?.channel_fit_score,
        reasoning: concept.metadata?.reasoning,
        based_on: concept.metadata?.based_on
      }))
    }, requestId);

  } catch (error) {
    log.error('Concept generation failed', { error: String(error) });
    return errorResponse(
      `컨셉 생성에 실패했습니다: ${error instanceof Error ? error.message : 'Unknown error'}`,
      requestId,
      500
    );
  }
});
```

---

## 5. 핵심 서비스 구현

### 5.1 근거 검증 서비스

```typescript
// src/lib/services/evidence-validator.ts

import { openai } from '@/lib/ai/openai';
import type {
  ExtractedPattern,
  ValidatedEvidence
} from '@/types/analysis';

interface ValidationContext {
  channel: string;
  industry: string;
}

class EvidenceValidatorService {

  async validate(
    patterns: ExtractedPattern[],
    context: ValidationContext
  ): Promise<ValidatedEvidence[]> {

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
      const mechanism = await this.generateMechanismExplanation(
        pattern,
        context
      );

      validatedResults.push({
        pattern,
        is_statistically_significant: significance.isSignificant,
        p_value: significance.pValue,
        confidence_score: confidenceScore,
        evidence_strength: evidenceStrength,
        mechanism,
        reference_ads: []  // 이후 채워짐
      });
    }

    // 신뢰도 순으로 정렬
    return validatedResults.sort((a, b) => b.confidence_score - a.confidence_score);
  }

  private checkStatisticalSignificance(pattern: ExtractedPattern): {
    isSignificant: boolean;
    pValue?: number;
  } {
    // 간단한 비율 검정 (z-test for proportions)
    const n_success = 40;  // 성공 광고 샘플 수
    const n_average = 15;  // 평균 광고 샘플 수

    const p1 = pattern.usage_in_success;
    const p2 = pattern.usage_in_average;

    // pooled proportion
    const p_pooled = (p1 * n_success + p2 * n_average) / (n_success + n_average);

    // standard error
    const se = Math.sqrt(p_pooled * (1 - p_pooled) * (1/n_success + 1/n_average));

    // z-score
    const z = (p1 - p2) / se;

    // p-value (two-tailed)
    const pValue = 2 * (1 - this.normalCDF(Math.abs(z)));

    return {
      isSignificant: pValue < 0.05,
      pValue
    };
  }

  private normalCDF(x: number): number {
    // 정규분포 CDF 근사
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;

    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x) / Math.sqrt(2);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return 0.5 * (1.0 + sign * y);
  }

  private calculateConfidenceScore(
    pattern: ExtractedPattern,
    significance: { isSignificant: boolean; pValue?: number }
  ): number {
    let score = 0;

    // 1. 차이 크기 (0-40점)
    const diffScore = Math.min(pattern.difference_pp * 2, 40);
    score += diffScore;

    // 2. 통계적 유의성 (0-30점)
    if (significance.isSignificant) {
      score += 30;
    } else if (significance.pValue && significance.pValue < 0.1) {
      score += 15;
    }

    // 3. 일관성 (성공 높고 실패 낮으면 +) (0-20점)
    const consistencyScore = (pattern.usage_in_success - pattern.usage_in_failure) * 20;
    score += Math.max(0, Math.min(consistencyScore, 20));

    // 4. 베이스라인 (0-10점) - 너무 희귀하거나 너무 흔하면 감점
    const avgUsage = (pattern.usage_in_success + pattern.usage_in_average) / 2;
    if (avgUsage > 0.1 && avgUsage < 0.9) {
      score += 10;
    } else {
      score += 5;
    }

    return Math.round(Math.min(100, Math.max(0, score)));
  }

  private classifyEvidenceStrength(
    differencePP: number,
    isSignificant: boolean,
    confidenceScore: number
  ): 'strong' | 'moderate' | 'weak' {
    if (isSignificant && differencePP >= 20 && confidenceScore >= 70) {
      return 'strong';
    } else if (differencePP >= 10 && confidenceScore >= 50) {
      return 'moderate';
    } else {
      return 'weak';
    }
  }

  private async generateMechanismExplanation(
    pattern: ExtractedPattern,
    context: ValidationContext
  ): Promise<{
    psychological_basis: string;
    channel_fit_reason: string;
    industry_fit_reason: string;
  }> {
    const prompt = `
광고 패턴의 효과성을 설명해주세요.

패턴: ${pattern.pattern_name} (${pattern.pattern_value})
채널: ${context.channel}
업종: ${context.industry}
성공 광고 사용률: ${(pattern.usage_in_success * 100).toFixed(1)}%
평균 광고 사용률: ${(pattern.usage_in_average * 100).toFixed(1)}%
차이: +${pattern.difference_pp.toFixed(1)}%p

다음 형식으로 JSON 응답해주세요:
{
  "psychological_basis": "이 패턴이 심리학적으로 왜 효과적인지 1-2문장",
  "channel_fit_reason": "이 채널에서 왜 특히 효과적인지 1문장",
  "industry_fit_reason": "이 업종에서 왜 효과적인지 1문장"
}
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' }
    });

    return JSON.parse(response.choices[0].message.content || '{}');
  }
}

export const evidenceValidatorService = new EvidenceValidatorService();
```

### 5.2 컨셉 생성 서비스 (분석 기반)

```typescript
// src/lib/services/concept-generator.ts

import { openai } from '@/lib/ai/openai';
import type { Campaign } from '@/types/database';
import type { ChannelAnalysisResult, ValidatedEvidence } from '@/types/analysis';

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

  // 분석 기반 메타데이터
  metadata: {
    channel_fit_score: number;
    reasoning: string;
    based_on: string[];
    recommended_hook: string;
    recommended_format: string;
    hashtag_set: string[];
  };
}

class ConceptGeneratorService {

  async generateFromAnalysis(
    input: GenerateFromAnalysisInput
  ): Promise<GeneratedConcept[]> {
    const { campaign, analysis, preferred_direction, exclude_patterns } = input;

    // 강한 근거만 필터링
    const strongEvidence = analysis.validated_insights.filter(
      e => e.evidence_strength === 'strong' || e.evidence_strength === 'moderate'
    );

    // 제외 패턴 필터링
    const filteredEvidence = exclude_patterns
      ? strongEvidence.filter(e => !exclude_patterns.includes(e.pattern.pattern_name))
      : strongEvidence;

    // 컨셉 생성 프롬프트 구성
    const prompt = this.buildPrompt(campaign, analysis, filteredEvidence, preferred_direction);

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: this.getSystemPrompt() },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' }
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    return result.concepts || [];
  }

  private getSystemPrompt(): string {
    return `당신은 데이터 기반 크리에이티브 디렉터입니다.
분석 데이터를 바탕으로 근거 있는 광고 컨셉을 제안합니다.
각 컨셉은 반드시 분석에서 도출된 인사이트에 기반해야 합니다.
JSON 형식으로만 응답하세요.`;
  }

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
- 채널: ${campaign.platform}
- 타겟: ${campaign.target_audience}
- 목표: ${campaign.campaign_goal}

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
}
`;
  }
}

export const conceptGeneratorService = new ConceptGeneratorService();
```

---

## 6. UI 컴포넌트 구조

### 6.1 새로운 페이지 구조

```
src/app/
├── (dashboard)/
│   ├── create/
│   │   ├── page.tsx              # 6단계 위자드 (리팩토링)
│   │   ├── layout.tsx
│   │   └── components/
│   │       ├── StepIndicator.tsx
│   │       ├── Step1ChannelSelect.tsx    # 단일 채널 선택 (신규)
│   │       ├── Step2ChannelAnalysis.tsx  # 분석 결과 표시 (신규)
│   │       ├── Step3BrandInfo.tsx        # 브랜드 정보 (간소화)
│   │       ├── Step4ConceptSelect.tsx    # 컨셉 선택 (적합도 표시)
│   │       ├── Step5CreativeGen.tsx      # 소재 생성
│   │       └── Step6Result.tsx           # 결과 + 다른 채널 추가
│   │
│   └── ...
```

### 6.2 핵심 컴포넌트: 분석 결과 표시

```tsx
// src/components/analysis/ChannelAnalysisView.tsx

import { useState } from 'react';
import type { ChannelAnalysisResult, ValidatedEvidence } from '@/types/analysis';

interface Props {
  analysis: ChannelAnalysisResult;
  onContinue: () => void;
}

export function ChannelAnalysisView({ analysis, onContinue }: Props) {
  const [expandedInsight, setExpandedInsight] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="text-center">
        <h2 className="text-2xl font-bold">
          {analysis.channel} 완전 정복 가이드
        </h2>
        <p className="text-muted-foreground mt-2">
          {analysis.industry} 업종 | {analysis.analysis_metadata.sample_size}개 광고 분석
        </p>
      </div>

      {/* 인사이트 카드들 */}
      <div className="space-y-4">
        {analysis.validated_insights
          .filter(e => e.evidence_strength !== 'weak')
          .map((evidence, i) => (
            <InsightCard
              key={i}
              evidence={evidence}
              isExpanded={expandedInsight === evidence.pattern.pattern_name}
              onToggle={() => setExpandedInsight(
                expandedInsight === evidence.pattern.pattern_name
                  ? null
                  : evidence.pattern.pattern_name
              )}
            />
          ))
        }
      </div>

      {/* 약한 근거 경고 */}
      <WeakEvidenceWarning
        weakEvidence={analysis.validated_insights.filter(e => e.evidence_strength === 'weak')}
      />

      {/* 다음 단계 */}
      <button
        onClick={onContinue}
        className="w-full py-3 bg-primary text-primary-foreground rounded-lg"
      >
        분석 기반 컨셉 생성하기
      </button>
    </div>
  );
}

function InsightCard({
  evidence,
  isExpanded,
  onToggle
}: {
  evidence: ValidatedEvidence;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border rounded-lg p-4">
      {/* 제목 + 신뢰도 바 */}
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">{evidence.pattern.pattern_name}</h3>
        <EvidenceStrengthBadge strength={evidence.evidence_strength} />
      </div>

      {/* 신뢰도 바 */}
      <div className="mt-2">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">근거 강도:</span>
          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full"
              style={{ width: `${evidence.confidence_score}%` }}
            />
          </div>
          <span className="text-sm font-medium">{evidence.confidence_score}%</span>
        </div>
      </div>

      {/* 통계 요약 */}
      <div className="mt-3 text-sm">
        <p>
          성공 광고 {(evidence.pattern.usage_in_success * 100).toFixed(0)}% vs
          평균 {(evidence.pattern.usage_in_average * 100).toFixed(0)}%
          <span className="text-green-600 font-medium">
            (+{evidence.pattern.difference_pp.toFixed(0)}%p)
          </span>
          {evidence.is_statistically_significant && (
            <span className="ml-1 text-xs text-green-600">✓ 통계적 유의</span>
          )}
        </p>
      </div>

      {/* 메커니즘 설명 */}
      <p className="mt-2 text-sm text-muted-foreground">
        {evidence.mechanism.psychological_basis}
      </p>

      {/* 레퍼런스 썸네일 */}
      {evidence.reference_ads.length > 0 && (
        <div className="mt-3 flex gap-2">
          {evidence.reference_ads.slice(0, 3).map((ad, i) => (
            <img
              key={i}
              src={ad.thumbnail_url}
              alt={`Reference ${i + 1}`}
              className="w-16 h-16 object-cover rounded"
            />
          ))}
        </div>
      )}

      {/* 상세 보기 토글 */}
      <button
        onClick={onToggle}
        className="mt-3 text-sm text-primary hover:underline"
      >
        {isExpanded ? '간략히 보기' : '상세 분석 보기'}
      </button>

      {/* 확장 내용 */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t space-y-2 text-sm">
          <p><strong>채널 적합성:</strong> {evidence.mechanism.channel_fit_reason}</p>
          <p><strong>업종 적합성:</strong> {evidence.mechanism.industry_fit_reason}</p>
        </div>
      )}
    </div>
  );
}

function EvidenceStrengthBadge({ strength }: { strength: 'strong' | 'moderate' | 'weak' }) {
  const styles = {
    strong: 'bg-green-100 text-green-800',
    moderate: 'bg-yellow-100 text-yellow-800',
    weak: 'bg-gray-100 text-gray-800'
  };

  const labels = {
    strong: '강한 근거',
    moderate: '보통 근거',
    weak: '약한 근거'
  };

  return (
    <span className={`text-xs px-2 py-1 rounded-full ${styles[strength]}`}>
      {labels[strength]}
    </span>
  );
}

function WeakEvidenceWarning({ weakEvidence }: { weakEvidence: ValidatedEvidence[] }) {
  if (weakEvidence.length === 0) return null;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
      <h4 className="font-medium text-amber-800">참고용 인사이트 ({weakEvidence.length}개)</h4>
      <p className="text-sm text-amber-700 mt-1">
        아래 패턴들은 통계적으로 유의미하지 않아 참고만 하세요.
      </p>
      <ul className="mt-2 text-sm text-amber-600">
        {weakEvidence.slice(0, 3).map((e, i) => (
          <li key={i}>• {e.pattern.pattern_name}</li>
        ))}
      </ul>
    </div>
  );
}
```

---

## 7. 구현 순서

### Phase 1: 분석 인프라 구축 (핵심)

```
Week 1-2: 외부 API 연동
├── [ ] Meta Ad Library API 클라이언트 구현
├── [ ] TikTok Creative Center API 클라이언트 구현
├── [ ] Gemini Vision API 연동
└── [ ] 이미지 수집 → Vision 분석 파이프라인

Week 3: 근거 검증 시스템
├── [ ] 통계적 유의성 검증 로직
├── [ ] 신뢰도 점수 계산 로직
├── [ ] 메커니즘 설명 생성 (AI)
└── [ ] 패턴 추출 및 집계

Week 4: 인사이트 → 컨셉 연결
├── [ ] InsightGeneratorService 구현
├── [ ] ConceptGeneratorService 리팩토링 (분석 기반)
└── [ ] 분석 결과 캐싱 시스템
```

### Phase 2: UI/워크플로우 변경

```
Week 5: 6단계 위자드 리팩토링
├── [ ] Step1: 단일 채널 선택 UI
├── [ ] Step2: 분석 결과 표시 컴포넌트
├── [ ] Step3: 브랜드 입력 간소화
└── [ ] Step4: 컨셉 선택 (적합도 표시)

Week 6: 마무리
├── [ ] Step5-6: 기존 로직 수정
├── [ ] 상태 관리 업데이트 (Zustand)
├── [ ] API 연동 테스트
└── [ ] E2E 테스트
```

---

## 8. 환경 변수

```env
# 기존
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
GOOGLE_AI_API_KEY=

# 신규: 외부 광고 라이브러리 API
META_AD_LIBRARY_ACCESS_TOKEN=     # Meta Business API 토큰
TIKTOK_CREATIVE_CENTER_API_KEY=   # TikTok API 키 (있는 경우)

# 신규: 캐시 (선택)
REDIS_URL=                        # 분석 결과 캐싱용 (선택사항)
```

---

## 문서 정보

| 항목 | 값 |
|------|---|
| **버전** | 2.0 |
| **생성일** | 2026-02-10 |
| **Plan 문서** | `docs/01-plan/features/channel-first-ad-generator.plan.md` |
| **상태** | Design 작성 완료 |
| **핵심 변경** | 분석 엔진 재설계, 근거 검증 시스템, 외부 API 연동 |
