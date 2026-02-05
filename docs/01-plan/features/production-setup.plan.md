# Plan: production-setup (프로덕션 환경 설정)

> 작성일: 2026-02-05
> Feature ID: production-setup
> 상태: Draft

---

## 1. 개요 (Overview)

### 1.1 배경
현재 광고 소재 생성 솔루션(create-ad-test)이 개발 모드에서 목(mock) 데이터로 정상 동작합니다.
실제 AI 분석과 이미지 생성을 위해 외부 서비스 연동 및 프로덕션 환경 설정이 필요합니다.

### 1.2 목표
- 실제 AI 서비스 연동 (Claude, Nano Banana)
- 데이터베이스 설정 (Supabase)
- 파일 스토리지 설정 (Cloudflare R2)
- 프로덕션 배포 준비

---

## 2. 필요한 외부 서비스

### 2.1 Supabase (데이터베이스 + 인증)

**용도**: 사용자 인증, 캠페인/분석/컨셉/크리에이티브 데이터 저장

**필요한 설정**:
| 항목 | 환경 변수 | 획득 방법 |
|------|-----------|-----------|
| Project URL | `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Settings → API |
| Anon Key | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API |
| Service Role Key | `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API |

**설정 단계**:
1. https://supabase.com 에서 프로젝트 생성
2. SQL Editor에서 테이블 스키마 실행 (제공 예정)
3. Authentication 설정 (Email/Password 활성화)
4. RLS (Row Level Security) 정책 적용

**예상 비용**: 무료 티어 (500MB DB, 50,000 MAU)

---

### 2.2 Anthropic Claude API (AI 분석 + 카피 생성)

**용도**: 시장 분석, 타겟 페르소나 생성, 컨셉 기획, 광고 카피 작성

**필요한 설정**:
| 항목 | 환경 변수 | 획득 방법 |
|------|-----------|-----------|
| API Key | `ANTHROPIC_API_KEY` | console.anthropic.com → API Keys |

**사용 모델**: `claude-sonnet-4-20250514`

**예상 사용량 (캠페인 1건당)**:
| API 호출 | 입력 토큰 | 출력 토큰 | 예상 비용 |
|----------|-----------|-----------|-----------|
| 시장 분석 | ~500 | ~1,500 | ~$0.01 |
| 컨셉 생성 | ~1,000 | ~2,000 | ~$0.02 |
| 카피 생성 (플랫폼당) | ~300 | ~200 | ~$0.003 |
| **총 (2 플랫폼)** | | | **~$0.04** |

**설정 단계**:
1. https://console.anthropic.com 계정 생성
2. API Key 생성
3. 결제 정보 등록 (사용량 기반 과금)

---

### 2.3 Google AI (Nano Banana Pro - 이미지 생성)

**용도**: 광고 크리에이티브 이미지 생성

**필요한 설정**:
| 항목 | 환경 변수 | 획득 방법 |
|------|-----------|-----------|
| API Key | `GOOGLE_AI_API_KEY` | Google AI Studio → API Keys |

**사용 모델**: `gemini-3-pro-image-preview` (Nano Banana Pro)

**지원 해상도**:
- 1k: 1024x1024, 1024x1280, 1024x1820, 1820x1024
- 2k: 2048x2048, 2048x2560, 2048x3640, 3640x2048
- 4k: 4096x4096, 4096x5120, 4096x7280, 7280x4096

**예상 사용량 (캠페인 1건당, 2 플랫폼 × 2 variations)**:
| 해상도 | 이미지 수 | 예상 비용 |
|--------|-----------|-----------|
| 2k | 4장 | ~$0.08 |

**설정 단계**:
1. https://aistudio.google.com 계정 생성
2. API Key 생성
3. Gemini API 활성화

---

### 2.4 Cloudflare R2 (이미지 스토리지)

**용도**: 생성된 이미지 파일 저장 및 CDN 제공

**필요한 설정**:
| 항목 | 환경 변수 | 획득 방법 |
|------|-----------|-----------|
| Account ID | `R2_ACCOUNT_ID` | Cloudflare Dashboard → R2 → Overview |
| Access Key ID | `R2_ACCESS_KEY_ID` | R2 → Manage R2 API Tokens |
| Secret Access Key | `R2_SECRET_ACCESS_KEY` | R2 → Manage R2 API Tokens |
| Bucket Name | `R2_BUCKET_NAME` | 생성한 버킷 이름 (예: `ad-creatives`) |
| Public URL | `R2_PUBLIC_URL` | Custom Domain 또는 R2.dev 주소 |

**설정 단계**:
1. https://dash.cloudflare.com 계정 생성
2. R2 → Create bucket (`ad-creatives`)
3. Settings → Public Access 활성화
4. R2 API Token 생성 (Object Read & Write 권한)

**예상 비용**:
- 저장: 무료 (10GB/월)
- 요청: 무료 (1M 요청/월)
- 대역폭: 무료 (무제한)

---

## 3. 환경 변수 전체 목록

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key]
SUPABASE_SERVICE_ROLE_KEY=[service-role-key]

# AI Services
ANTHROPIC_API_KEY=sk-ant-[api-key]
GOOGLE_AI_API_KEY=[google-ai-key]

# Cloudflare R2
R2_ACCOUNT_ID=[account-id]
R2_ACCESS_KEY_ID=[access-key]
R2_SECRET_ACCESS_KEY=[secret-key]
R2_BUCKET_NAME=ad-creatives
R2_PUBLIC_URL=https://[bucket].r2.dev

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 4. Supabase 데이터베이스 스키마

```sql
-- Users (Supabase Auth 자동 생성)

-- Campaigns
CREATE TABLE campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  brand_name TEXT NOT NULL,
  product_description TEXT NOT NULL,
  campaign_goal TEXT NOT NULL,
  target_audience TEXT NOT NULL,
  platforms TEXT[] NOT NULL,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analyses
CREATE TABLE analyses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  target_persona JSONB NOT NULL,
  platform_guidelines JSONB NOT NULL,
  trend_insights JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Concepts
CREATE TABLE concepts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  concept_id UUID REFERENCES concepts(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'image' | 'copy'
  platform TEXT NOT NULL,
  content_url TEXT,
  copy_text TEXT,
  resolution TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE concepts ENABLE ROW LEVEL SECURITY;
ALTER TABLE creatives ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can view own campaigns" ON campaigns
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own campaigns" ON campaigns
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own campaigns" ON campaigns
  FOR UPDATE USING (auth.uid() = user_id);
```

---

## 5. 구현 체크리스트

### Phase 1: 서비스 계정 생성
- [ ] Supabase 프로젝트 생성
- [ ] Anthropic API 계정 및 키 발급
- [ ] Google AI Studio API 키 발급
- [ ] Cloudflare R2 버킷 생성

### Phase 2: 데이터베이스 설정
- [ ] Supabase에서 테이블 스키마 실행
- [ ] RLS 정책 적용
- [ ] Auth 설정 (Email/Password)

### Phase 3: 환경 변수 설정
- [ ] `.env.local` 파일 생성
- [ ] 모든 환경 변수 입력
- [ ] 서버 재시작 후 동작 확인

### Phase 4: 테스트
- [ ] 회원가입/로그인 테스트
- [ ] 캠페인 생성 테스트 (실제 DB 저장)
- [ ] AI 분석 테스트 (실제 Claude API)
- [ ] 이미지 생성 테스트 (실제 Nano Banana)
- [ ] 이미지 저장 테스트 (실제 R2)

### Phase 5: 배포 (선택)
- [ ] Vercel 배포 설정
- [ ] 환경 변수 Vercel에 등록
- [ ] 도메인 연결

---

## 6. 예상 비용 요약

| 서비스 | 월간 예상 비용 | 비고 |
|--------|----------------|------|
| Supabase | $0 | 무료 티어 |
| Claude API | ~$4 | 100 캠페인 기준 |
| Google AI | ~$8 | 100 캠페인 기준 |
| Cloudflare R2 | $0 | 무료 티어 |
| **총합** | **~$12/월** | 100 캠페인 기준 |

---

## 7. 다음 단계

1. **서비스 가입**: 위 4개 서비스에 가입
2. **환경 변수 설정**: `.env.local` 파일 작성
3. **DB 스키마 실행**: Supabase SQL Editor에서 실행
4. **통합 테스트**: 실제 API로 전체 플로우 테스트

---

**작성자**: Claude AI
**검토일**: 2026-02-05
