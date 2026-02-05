# Design: Export API (소재 데이터 내보내기 API)

> 작성일: 2026-02-06
> 상태: Draft
> Feature ID: export-api
> Plan 참조: [export-api.plan.md](../../01-plan/features/export-api.plan.md)

---

## 1. 시스템 아키텍처 (System Architecture)

### 1.1 전체 구조

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              Client (Browser / External System)              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                     Request Types                                    │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │    │
│  │  │  UI Export   │  │  API Client  │  │  Batch Job   │              │    │
│  │  │   Button     │  │  (External)  │  │  (Cron)      │              │    │
│  │  └──────────────┘  └──────────────┘  └──────────────┘              │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                        ┌─────────────┼─────────────┐
                        │   Auth      │   Auth      │
                        │   Bearer    │   API Key   │
                        ▼             ▼             ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           Next.js API Routes                                 │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                        /api/export/*                                  │   │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐         │   │
│  │  │ /creatives     │  │ /campaigns/:id │  │ /batch         │         │   │
│  │  │ GET (list)     │  │ GET (detail)   │  │ GET (bulk)     │         │   │
│  │  └────────────────┘  └────────────────┘  └────────────────┘         │   │
│  │  ┌────────────────┐                                                  │   │
│  │  │ /creatives/:id │                                                  │   │
│  │  │ GET (single)   │                                                  │   │
│  │  └────────────────┘                                                  │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                      │                                       │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                      Export Service Layer                             │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐     │   │
│  │  │ Formatters │  │ Filters    │  │ Tracking   │  │ Auth       │     │   │
│  │  │ JSON/CSV   │  │ Query      │  │ Code Gen   │  │ Middleware │     │   │
│  │  └────────────┘  └────────────┘  └────────────┘  └────────────┘     │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    ▼                 ▼                 ▼
         ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
         │   Supabase   │   │ Cloudflare   │   │   External   │
         │  PostgreSQL  │   │     R2       │   │   Systems    │
         │              │   │              │   │              │
         │ • campaigns  │   │ • images     │   │ • Analytics  │
         │ • creatives  │   │ • assets     │   │ • BI Tools   │
         │ • concepts   │   │              │   │ • Ad Platform│
         └──────────────┘   └──────────────┘   └──────────────┘
```

### 1.2 기술 스택 상세

| 레이어 | 기술 | 버전 | 용도 |
|--------|------|------|------|
| **API** | Next.js API Routes | 15+ | Export 엔드포인트 |
| **Validation** | Zod | 3+ | 쿼리 파라미터 검증 |
| **Format** | json2csv | 6+ | CSV 변환 |
| **Archive** | archiver | 6+ | ZIP 생성 (Phase 2) |
| **ID Gen** | nanoid | 5+ | tracking_code 생성 |
| **Database** | Supabase | - | 데이터 조회 |
| **Storage** | Cloudflare R2 | - | 이미지 URL |

---

## 2. 데이터 모델 (Data Model)

### 2.1 기존 테이블 확장

```
┌─────────────────────────────────────────────────────────────────┐
│                      creatives (확장)                            │
├─────────────────────────────────────────────────────────────────┤
│ id (PK)              UUID           기존                         │
│ concept_id (FK)      UUID           기존                         │
│ type                 TEXT           기존                         │
│ platform             TEXT           기존                         │
│ content_url          TEXT           기존                         │
│ copy_text            TEXT           기존                         │
│ resolution           TEXT           기존                         │
│ metadata             JSONB          기존                         │
│ created_at           TIMESTAMPTZ    기존                         │
│ ─────────────────────────────────────────────────────────────── │
│ external_id          TEXT           신규 (외부 시스템 ID)         │
│ tracking_code        TEXT           신규 (추적 코드)              │
│ version              INTEGER        신규 (소재 버전)              │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 데이터베이스 마이그레이션

```sql
-- Migration: add_export_fields_to_creatives
-- Version: 2026_02_06_001

-- 1. 새 컬럼 추가
ALTER TABLE creatives ADD COLUMN IF NOT EXISTS external_id TEXT;
ALTER TABLE creatives ADD COLUMN IF NOT EXISTS tracking_code TEXT;
ALTER TABLE creatives ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_creatives_external_id ON creatives(external_id);
CREATE INDEX IF NOT EXISTS idx_creatives_tracking_code ON creatives(tracking_code);
CREATE INDEX IF NOT EXISTS idx_creatives_created_at ON creatives(created_at);
CREATE INDEX IF NOT EXISTS idx_creatives_platform ON creatives(platform);

-- 3. 기존 데이터에 tracking_code 생성 (선택적)
-- UPDATE creatives
-- SET tracking_code = 'crt_' || SUBSTRING(concept_id::text, 1, 8) || '_' || platform || '_v1'
-- WHERE tracking_code IS NULL;
```

### 2.3 TypeScript 타입 정의

```typescript
// src/types/export.ts

import type { Platform, CampaignGoal, Campaign, Creative, Analysis, Concept } from './database';

// ─────────────────────────────────────────────────────────────────
// Export Request Types
// ─────────────────────────────────────────────────────────────────

export type ExportFormat = 'json' | 'csv';

export interface ExportCreativesQuery {
  format?: ExportFormat;
  platform?: Platform;
  from?: string;       // ISO date
  to?: string;         // ISO date
  limit?: number;      // default: 100, max: 1000
  offset?: number;     // default: 0
  include_metadata?: boolean;  // default: true
}

export interface ExportCampaignQuery {
  format?: ExportFormat;
  include_analysis?: boolean;   // default: false
  include_concepts?: boolean;   // default: true
}

export interface ExportBatchQuery {
  from: string;        // ISO date (required)
  to: string;          // ISO date (required)
  format?: ExportFormat;
  campaigns?: string[];  // campaign IDs filter
}

// ─────────────────────────────────────────────────────────────────
// Export Response Types
// ─────────────────────────────────────────────────────────────────

export interface ExportCreative {
  creative_id: string;
  external_id: string | null;
  tracking_code: string | null;
  version: number;
  campaign_id: string;
  concept_id: string;
  type: 'image' | 'copy';
  platform: Platform;
  content_url: string | null;
  copy_text: string | null;
  resolution: string | null;
  metadata: ExportCreativeMetadata;
  created_at: string;
}

export interface ExportCreativeMetadata {
  prompt?: string;
  model?: string;
  campaign_goal?: CampaignGoal;
  target_audience?: string;
  brand_name?: string;
  generation_params?: {
    resolution: '2k' | '4k';
    variation_index: number;
  };
  tags?: string[];
}

export interface ExportInfo {
  exported_at: string;
  format: ExportFormat;
  filters_applied: Record<string, unknown>;
  total_count?: number;
}

// Creatives List Response
export interface ExportCreativesResponse {
  success: boolean;
  data: {
    total: number;
    limit: number;
    offset: number;
    creatives: ExportCreative[];
  };
  export_info: ExportInfo;
}

// Single Creative Response
export interface ExportCreativeDetailResponse {
  success: boolean;
  data: ExportCreative;
  export_info: ExportInfo;
}

// Campaign Export Response
export interface ExportCampaignResponse {
  success: boolean;
  data: {
    campaign: Campaign;
    analysis?: Analysis;
    concepts?: Concept[];
    creatives: ExportCreative[];
    summary: {
      total_creatives: number;
      by_platform: Record<Platform, number>;
      by_type: Record<'image' | 'copy', number>;
    };
  };
  export_info: ExportInfo;
}

// Batch Export Response
export interface ExportBatchResponse {
  success: boolean;
  data: {
    campaigns_count: number;
    creatives_count: number;
    campaigns: Array<{
      campaign: Campaign;
      creatives: ExportCreative[];
    }>;
  };
  export_info: ExportInfo;
}

// ─────────────────────────────────────────────────────────────────
// Tracking Code
// ─────────────────────────────────────────────────────────────────

export interface TrackingCodeParams {
  campaignId: string;
  platform: Platform;
  version: number;
}

// Format: crt_{campaign_short}_{platform}_{version}
// Example: crt_abc123_instagram_feed_v1
```

---

## 3. API 설계 (API Design)

### 3.1 API 엔드포인트 목록

| Method | Endpoint | 설명 | 인증 | 우선순위 |
|--------|----------|------|------|----------|
| GET | `/api/export/creatives` | 소재 목록 내보내기 | Bearer/API Key | P0 |
| GET | `/api/export/creatives/:id` | 단일 소재 상세 | Bearer/API Key | P1 |
| GET | `/api/export/campaigns/:id` | 캠페인별 내보내기 | Bearer/API Key | P0 |
| GET | `/api/export/batch` | 일괄 내보내기 | API Key | P1 |

### 3.2 API 상세 명세

#### 3.2.1 GET /api/export/creatives

```typescript
// src/app/api/export/creatives/route.ts

import { z } from 'zod';

// Query Schema
const ExportCreativesQuerySchema = z.object({
  format: z.enum(['json', 'csv']).default('json'),
  platform: z.enum([
    'instagram_feed', 'instagram_story', 'tiktok',
    'threads', 'youtube_shorts', 'youtube_ads'
  ]).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  limit: z.coerce.number().min(1).max(1000).default(100),
  offset: z.coerce.number().min(0).default(0),
  include_metadata: z.coerce.boolean().default(true),
});

// Response Example
{
  "success": true,
  "data": {
    "total": 156,
    "limit": 100,
    "offset": 0,
    "creatives": [
      {
        "creative_id": "550e8400-e29b-41d4-a716-446655440000",
        "external_id": null,
        "tracking_code": "crt_abc123_instagram_feed_v1",
        "version": 1,
        "campaign_id": "campaign-uuid",
        "concept_id": "concept-uuid",
        "type": "image",
        "platform": "instagram_feed",
        "content_url": "https://r2.example.com/creatives/abc123.png",
        "copy_text": null,
        "resolution": "1080x1080",
        "metadata": {
          "prompt": "A warm, sunlit cafe scene...",
          "model": "gemini-3-pro-image-preview",
          "campaign_goal": "awareness",
          "target_audience": "20-35세 환경에 관심 있는 직장인",
          "brand_name": "에코프렌즈"
        },
        "created_at": "2026-02-05T10:15:00Z"
      }
    ]
  },
  "export_info": {
    "exported_at": "2026-02-06T09:00:00Z",
    "format": "json",
    "filters_applied": {
      "platform": "instagram_feed",
      "from": "2026-02-01"
    },
    "total_count": 156
  }
}
```

#### 3.2.2 GET /api/export/campaigns/:id

```typescript
// src/app/api/export/campaigns/[id]/route.ts

import { z } from 'zod';

// Query Schema
const ExportCampaignQuerySchema = z.object({
  format: z.enum(['json', 'csv']).default('json'),
  include_analysis: z.coerce.boolean().default(false),
  include_concepts: z.coerce.boolean().default(true),
});

// Response Example
{
  "success": true,
  "data": {
    "campaign": {
      "id": "campaign-uuid",
      "brand_name": "에코프렌즈",
      "product_description": "친환경 텀블러...",
      "campaign_goal": "awareness",
      "target_audience": "20-35세 환경에 관심 있는 직장인",
      "platforms": ["instagram_feed", "tiktok"],
      "status": "completed",
      "created_at": "2026-02-05T10:00:00Z"
    },
    "analysis": {
      "target_persona": {
        "age_range": "25-35",
        "gender": "전체",
        "interests": ["환경보호", "지속가능성"]
      },
      "platform_guidelines": [...],
      "trend_insights": [...]
    },
    "concepts": [
      {
        "id": "concept-uuid",
        "title": "일상 속 작은 변화",
        "is_selected": true
      }
    ],
    "creatives": [...],
    "summary": {
      "total_creatives": 8,
      "by_platform": {
        "instagram_feed": 4,
        "tiktok": 4
      },
      "by_type": {
        "image": 4,
        "copy": 4
      }
    }
  },
  "export_info": {
    "exported_at": "2026-02-06T09:00:00Z",
    "format": "json",
    "filters_applied": {
      "campaign_id": "campaign-uuid",
      "include_analysis": true
    }
  }
}
```

#### 3.2.3 GET /api/export/batch

```typescript
// src/app/api/export/batch/route.ts

import { z } from 'zod';

// Query Schema
const ExportBatchQuerySchema = z.object({
  from: z.string().datetime(),  // required
  to: z.string().datetime(),    // required
  format: z.enum(['json', 'csv']).default('json'),
  campaigns: z.string().transform(s => s.split(',')).optional(),
});

// Response Example
{
  "success": true,
  "data": {
    "campaigns_count": 5,
    "creatives_count": 42,
    "campaigns": [
      {
        "campaign": {...},
        "creatives": [...]
      }
    ]
  },
  "export_info": {
    "exported_at": "2026-02-06T09:00:00Z",
    "format": "json",
    "filters_applied": {
      "from": "2026-02-01T00:00:00Z",
      "to": "2026-02-06T23:59:59Z"
    }
  }
}
```

---

## 4. 서비스 레이어 설계

### 4.1 Export Service

```typescript
// src/lib/export/service.ts

import { ExportCreativesQuery, ExportCreative, ExportFormat } from '@/types/export';

export class ExportService {

  // 소재 목록 조회
  async getCreatives(
    userId: string,
    query: ExportCreativesQuery
  ): Promise<{ creatives: ExportCreative[]; total: number }> {
    // 1. 필터 조건 구성
    // 2. DB 조회 (Supabase)
    // 3. 메타데이터 보강 (campaign 정보 조인)
    // 4. tracking_code 생성 (없는 경우)
    // 5. 결과 반환
  }

  // 캠페인별 내보내기
  async getCampaignExport(
    userId: string,
    campaignId: string,
    options: { includeAnalysis: boolean; includeConcepts: boolean }
  ): Promise<CampaignExportData> {
    // 1. 캠페인 조회 (권한 확인)
    // 2. 관련 데이터 조회 (analysis, concepts, creatives)
    // 3. 통계 계산 (by_platform, by_type)
    // 4. 결과 반환
  }

  // 일괄 내보내기
  async getBatchExport(
    userId: string,
    query: ExportBatchQuery
  ): Promise<BatchExportData> {
    // 1. 기간 내 캠페인 조회
    // 2. 각 캠페인의 소재 조회
    // 3. 결과 집계
  }
}

export const exportService = new ExportService();
```

### 4.2 Format Service

```typescript
// src/lib/export/formatters.ts

import { Parser } from 'json2csv';
import type { ExportCreative } from '@/types/export';

export class FormatService {

  // JSON 포맷 (기본)
  toJSON<T>(data: T): string {
    return JSON.stringify(data, null, 2);
  }

  // CSV 포맷
  toCSV(creatives: ExportCreative[]): string {
    const fields = [
      'creative_id',
      'tracking_code',
      'campaign_id',
      'type',
      'platform',
      'content_url',
      'copy_text',
      'resolution',
      'created_at',
      // metadata 필드 평탄화
      'metadata.model',
      'metadata.campaign_goal',
      'metadata.target_audience',
    ];

    const parser = new Parser({ fields });
    return parser.parse(creatives);
  }

  // Content-Type 헤더 결정
  getContentType(format: 'json' | 'csv'): string {
    return format === 'csv'
      ? 'text/csv; charset=utf-8'
      : 'application/json; charset=utf-8';
  }

  // 파일명 생성
  getFilename(prefix: string, format: 'json' | 'csv'): string {
    const timestamp = new Date().toISOString().split('T')[0];
    return `${prefix}_${timestamp}.${format}`;
  }
}

export const formatService = new FormatService();
```

### 4.3 Tracking Code Service

```typescript
// src/lib/export/tracking.ts

import { nanoid } from 'nanoid';
import type { Platform, TrackingCodeParams } from '@/types/export';

export class TrackingService {

  // tracking_code 생성
  // Format: crt_{campaign_short}_{platform}_{version}
  generate(params: TrackingCodeParams): string {
    const campaignShort = params.campaignId.substring(0, 8);
    const platformCode = this.getPlatformCode(params.platform);
    return `crt_${campaignShort}_${platformCode}_v${params.version}`;
  }

  // 플랫폼 코드 (짧은 형태)
  private getPlatformCode(platform: Platform): string {
    const codes: Record<Platform, string> = {
      instagram_feed: 'ig_feed',
      instagram_story: 'ig_story',
      tiktok: 'tiktok',
      threads: 'threads',
      youtube_shorts: 'yt_short',
      youtube_ads: 'yt_ads',
    };
    return codes[platform];
  }

  // 고유 external_id 생성 (외부 시스템 연동 시)
  generateExternalId(): string {
    return `ext_${nanoid(12)}`;
  }
}

export const trackingService = new TrackingService();
```

---

## 5. 인증 및 보안 설계

### 5.1 인증 미들웨어

```typescript
// src/lib/export/auth.ts

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/db/supabase';

export type AuthResult =
  | { success: true; userId: string; authType: 'bearer' | 'apikey' }
  | { success: false; error: string };

export async function authenticateExportRequest(
  request: NextRequest
): Promise<AuthResult> {

  // 1. API Key 확인 (X-API-Key 헤더)
  const apiKey = request.headers.get('X-API-Key');
  if (apiKey) {
    const result = await validateApiKey(apiKey);
    if (result.valid) {
      return { success: true, userId: result.userId, authType: 'apikey' };
    }
  }

  // 2. Bearer Token 확인 (Authorization 헤더)
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const supabase = createClient();
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (user && !error) {
      return { success: true, userId: user.id, authType: 'bearer' };
    }
  }

  // 3. 인증 실패
  return { success: false, error: 'Unauthorized' };
}

async function validateApiKey(apiKey: string): Promise<{ valid: boolean; userId?: string }> {
  // API Key 검증 로직 (Phase 2에서 구현)
  // 현재는 환경 변수로 단일 키 검증
  if (apiKey === process.env.EXPORT_API_KEY) {
    return { valid: true, userId: 'system' };
  }
  return { valid: false };
}
```

### 5.2 Rate Limiting (Phase 2)

```typescript
// src/lib/export/rate-limit.ts

export interface RateLimitConfig {
  windowMs: number;      // 시간 창 (밀리초)
  maxRequests: number;   // 최대 요청 수
}

export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  bearer: { windowMs: 60000, maxRequests: 100 },   // 100 req/min
  apikey: { windowMs: 60000, maxRequests: 1000 },  // 1000 req/min
  batch: { windowMs: 3600000, maxRequests: 10 },   // 10 req/hour
};
```

---

## 6. 폴더 구조 (Project Structure)

```
src/
├── app/api/export/
│   ├── creatives/
│   │   ├── route.ts                 # GET /api/export/creatives
│   │   └── [id]/
│   │       └── route.ts             # GET /api/export/creatives/:id
│   ├── campaigns/
│   │   └── [id]/
│   │       └── route.ts             # GET /api/export/campaigns/:id
│   └── batch/
│       └── route.ts                 # GET /api/export/batch
│
├── lib/
│   └── export/
│       ├── index.ts                 # 모듈 export
│       ├── service.ts               # ExportService
│       ├── formatters.ts            # FormatService (JSON/CSV)
│       ├── tracking.ts              # TrackingService
│       ├── auth.ts                  # 인증 미들웨어
│       ├── filters.ts               # 쿼리 필터 유틸리티
│       └── rate-limit.ts            # Rate Limiting (Phase 2)
│
├── types/
│   └── export.ts                    # Export 관련 타입
│
└── lib/db/
    └── queries.ts                   # 기존 + Export 쿼리 추가
```

---

## 7. 데이터베이스 쿼리

### 7.1 Export 쿼리 함수

```typescript
// src/lib/db/queries.ts (추가)

// 소재 목록 조회 (Export용)
export async function getCreativesForExport(
  userId: string,
  filters: {
    platform?: Platform;
    from?: string;
    to?: string;
    limit: number;
    offset: number;
  }
): Promise<{ creatives: Creative[]; total: number }> {
  const supabase = createClient();

  let query = supabase
    .from('creatives')
    .select(`
      *,
      concepts!inner (
        campaign_id,
        campaigns!inner (
          user_id,
          brand_name,
          campaign_goal,
          target_audience
        )
      )
    `, { count: 'exact' })
    .eq('concepts.campaigns.user_id', userId);

  // 필터 적용
  if (filters.platform) {
    query = query.eq('platform', filters.platform);
  }
  if (filters.from) {
    query = query.gte('created_at', filters.from);
  }
  if (filters.to) {
    query = query.lte('created_at', filters.to);
  }

  // 페이지네이션
  query = query
    .order('created_at', { ascending: false })
    .range(filters.offset, filters.offset + filters.limit - 1);

  const { data, count, error } = await query;

  if (error) throw error;

  return {
    creatives: data || [],
    total: count || 0,
  };
}

// 캠페인 전체 데이터 조회 (Export용)
export async function getCampaignFullDataForExport(
  userId: string,
  campaignId: string
): Promise<{
  campaign: Campaign;
  analysis: Analysis | null;
  concepts: Concept[];
  creatives: Creative[];
}> {
  // 병렬 조회
  const [campaign, analysis, concepts, creatives] = await Promise.all([
    getCampaignById(campaignId),
    getAnalysisByCampaignId(campaignId),
    getConceptsByCampaignId(campaignId),
    getCreativesByCampaignId(campaignId),
  ]);

  // 권한 확인
  if (!campaign || campaign.user_id !== userId) {
    throw new Error('Campaign not found or unauthorized');
  }

  return { campaign, analysis, concepts, creatives };
}

// tracking_code 업데이트
export async function updateCreativeTrackingCode(
  creativeId: string,
  trackingCode: string
): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from('creatives')
    .update({ tracking_code: trackingCode })
    .eq('id', creativeId);

  if (error) throw error;
}
```

---

## 8. 구현 순서 (Implementation Order)

### Phase 1: MVP (P0)

1. [ ] **타입 정의** - `src/types/export.ts`
2. [ ] **DB 마이그레이션** - external_id, tracking_code, version 컬럼 추가
3. [ ] **Tracking Service** - `src/lib/export/tracking.ts`
4. [ ] **Export Service** - `src/lib/export/service.ts`
5. [ ] **API: GET /api/export/creatives** - 소재 목록 (JSON)
6. [ ] **API: GET /api/export/campaigns/:id** - 캠페인별 (JSON)
7. [ ] **인증 미들웨어** - Bearer Token 지원

### Phase 2: 확장 (P1)

8. [ ] **Format Service** - CSV 변환 지원
9. [ ] **API: GET /api/export/creatives/:id** - 단일 소재
10. [ ] **API: GET /api/export/batch** - 일괄 내보내기
11. [ ] **API Key 인증** - X-API-Key 헤더
12. [ ] **Rate Limiting** - 요청 제한

### Phase 3: 고도화 (P2)

13. [ ] **ZIP 패키지** - 이미지 포함 내보내기
14. [ ] **UI 내보내기 버튼** - 프로젝트 상세 페이지
15. [ ] **Webhook 알림** - 내보내기 완료 통지

---

## 9. 에러 처리

### 9.1 에러 코드

| 코드 | 상태 | 설명 |
|------|------|------|
| `UNAUTHORIZED` | 401 | 인증 실패 |
| `FORBIDDEN` | 403 | 권한 없음 |
| `NOT_FOUND` | 404 | 리소스 없음 |
| `INVALID_PARAMS` | 400 | 잘못된 파라미터 |
| `RATE_LIMITED` | 429 | 요청 제한 초과 |
| `INTERNAL_ERROR` | 500 | 서버 오류 |

### 9.2 에러 응답 형식

```typescript
interface ExportErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  requestId: string;
}

// Example
{
  "success": false,
  "error": {
    "code": "INVALID_PARAMS",
    "message": "Invalid date format for 'from' parameter",
    "details": {
      "field": "from",
      "received": "2026-02-30",
      "expected": "ISO 8601 date string"
    }
  },
  "requestId": "req_abc123"
}
```

---

## 10. 테스트 계획

### 10.1 단위 테스트

| 모듈 | 테스트 항목 |
|------|------------|
| TrackingService | tracking_code 생성 형식 |
| FormatService | JSON/CSV 변환 정확성 |
| Auth | Bearer/API Key 검증 |

### 10.2 통합 테스트

| API | 테스트 항목 |
|-----|------------|
| GET /export/creatives | 필터링, 페이지네이션 |
| GET /export/campaigns/:id | 권한 검증, 데이터 완전성 |
| GET /export/batch | 기간 필터, 대용량 처리 |

### 10.3 성능 테스트

| 시나리오 | 목표 |
|---------|------|
| 100건 조회 | < 500ms |
| 1000건 조회 | < 2s |
| CSV 변환 (1000건) | < 1s |

---

## 11. 환경 변수

```bash
# .env.local (추가)

# Export API
EXPORT_API_KEY=your_secure_api_key_here

# Rate Limiting (Phase 2)
EXPORT_RATE_LIMIT_ENABLED=true
```

---

**작성자**: Claude AI
**검토자**: (사용자 확인 필요)
**승인일**: (승인 대기)
