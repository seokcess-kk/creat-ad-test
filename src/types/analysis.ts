/**
 * Channel-First Ad Generator v2.0 - Analysis Types
 * 채널별 맞춤 분석 및 근거 기반 인사이트 타입 정의
 */

import type { Platform } from './database';

// ============================================================================
// 1. 성공 광고 판별 기준 (Success Criteria)
// ============================================================================

export interface SuccessCriteria {
  /** 최소 활성 일수 (기본: 14일) */
  min_active_days: number;
  /** 성과 등급: 상위 20% */
  performance_tier: 'top_20_percent';
  /** 동일 광고주의 패턴 재사용 여부 */
  same_advertiser_reuse?: boolean;
}

// ============================================================================
// 2. 샘플링 설계 (Sampling Configuration)
// ============================================================================

export interface SamplingConfig {
  /** 총 수집 광고 수 (기본: 60) */
  total: number;
  /** 직접 업종 광고 수 */
  industry_direct: number;
  /** 인접 업종 광고 수 */
  industry_adjacent: number;
  /** 레퍼런스 광고 수 */
  industry_reference: number;

  /** 시간 분포 */
  time_distribution: {
    recent_7d: number;
    recent_30d: number;
    recent_90d: number;
  };

  /** 성과 분포 */
  performance_distribution: {
    success: number;
    average: number;
    failure: number;
  };
}

// ============================================================================
// 3. 수집된 광고 (Collected Ad)
// ============================================================================

export type AdSource = 'meta' | 'tiktok' | 'google';
export type PerformanceTier = 'success' | 'average' | 'failure';

export interface CollectedAd {
  id: string;
  source: AdSource;
  external_id: string;

  image_url: string;
  thumbnail_url?: string;
  video_url?: string;

  advertiser: string;
  advertiser_id?: string;

  delivery_start: Date;
  delivery_end?: Date;
  delivery_days: number;

  performance_tier: PerformanceTier;

  /** 성과 지표 (있는 경우) */
  metrics?: {
    impressions_range?: [number, number];
    spend_range?: [number, number];
    engagement_rate?: number;
    like_count?: number;
    share_count?: number;
    comment_count?: number;
  };

  /** 광고 메타데이터 */
  ad_metadata?: {
    ad_text?: string;
    cta_text?: string;
    landing_url?: string;
    industry?: string;
    objective?: string;
  };
}

// ============================================================================
// 4. Vision 분석 결과 (Gemini Vision Analysis)
// ============================================================================

export interface ImageAnalysisResult {
  layout: LayoutAnalysis;
  colors: ColorAnalysis;
  text: TextAnalysis;
  visual_style: VisualStyleAnalysis;
  ad_classification: AdClassification;
}

export interface LayoutAnalysis {
  /** 그리드 패턴 (예: "2-column", "centered", "asymmetric", "split-horizontal") */
  grid_pattern: string;
  /** 요소 위치 */
  element_positions: {
    product: string;
    headline: string;
    logo: string;
    cta: string;
  };
  /** 시선 흐름 (예: "F-pattern", "Z-pattern", "center-focus") */
  visual_flow: string;
  /** 여백 활용 (예: "minimal", "moderate", "generous") */
  whitespace_usage: string;
}

export interface ColorAnalysis {
  /** 주요 색상 (hex) */
  primary: string;
  /** 보조 색상 (hex) */
  secondary: string;
  /** 강조 색상 (hex) */
  accent: string;
  /** 전체 톤 (예: "warm-bright", "cool-dark", "neutral-soft") */
  overall_tone: string;
  /** 대비 수준 (예: "high", "medium", "low") */
  contrast_level: string;
}

export interface TextAnalysis {
  /** OCR 추출 헤드라인 */
  headline: string;
  /** 서브 헤드라인 (없으면 null) */
  subheadline: string | null;
  /** CTA 문구 (없으면 null) */
  cta_text: string | null;
  /** 폰트 스타일 (예: "bold-sans", "elegant-serif", "handwritten") */
  font_style: string;
  /** 텍스트 비율 (0-100) */
  text_ratio_percent: number;
}

export interface VisualStyleAnalysis {
  /** 이미지 유형 (예: "photo", "illustration", "graphic", "3d", "mixed") */
  image_type: string;
  /** 인물 등장 여부 */
  has_person: boolean;
  /** 인물 표정 (없으면 undefined) */
  person_expression?: string;
  /** 제품 표현 방식 (예: "closeup", "lifestyle", "before-after", "flat-lay") */
  product_presentation: string;
  /** 적용된 필터/효과 */
  filters_effects: string[];
}

export interface AdClassification {
  /** 추정 광고 목표 */
  estimated_goal: string;
  /** 추정 타겟 */
  estimated_audience: string;
  /** 추정 업종 */
  industry: string;
}

// ============================================================================
// 5. 패턴 추출 (Extracted Pattern)
// ============================================================================

export type PatternType = 'layout' | 'color' | 'text' | 'visual_style' | 'hook' | 'cta';

export interface ExtractedPattern {
  pattern_type: PatternType;
  pattern_name: string;
  pattern_value: string;

  /** 성공 광고 내 사용률 (0-1) */
  usage_in_success: number;
  /** 평균 광고 내 사용률 (0-1) */
  usage_in_average: number;
  /** 실패 광고 내 사용률 (0-1) */
  usage_in_failure: number;

  /** 성공 vs 평균 차이 (percentage points) */
  difference_pp: number;

  /** 해당 패턴 사용한 광고 ID 목록 */
  ad_ids: string[];
}

// ============================================================================
// 6. 검증된 근거 (Validated Evidence)
// ============================================================================

export type EvidenceStrength = 'strong' | 'moderate' | 'weak';

export interface ValidatedEvidence {
  pattern: ExtractedPattern;

  /** 통계적 유의성 */
  is_statistically_significant: boolean;
  p_value?: number;

  /** 신뢰도 점수 (0-100) */
  confidence_score: number;
  /** 근거 강도 */
  evidence_strength: EvidenceStrength;

  /** 메커니즘 설명 */
  mechanism: {
    psychological_basis: string;
    channel_fit_reason: string;
    industry_fit_reason: string;
  };

  /** 레퍼런스 광고 */
  reference_ads: ReferenceAd[];
}

export interface ReferenceAd {
  thumbnail_url: string;
  advertiser: string;
  delivery_days: number;
  external_id?: string;
}

// ============================================================================
// 7. 채널 분석 결과 (Channel Analysis Result)
// ============================================================================

export interface ChannelAnalysisResult {
  channel: Platform;
  industry: string;

  /** 검증된 인사이트들 */
  validated_insights: ValidatedEvidence[];

  /** 컨셉 생성용 입력 */
  concept_inputs: ConceptInputs;

  /** 분석 메타데이터 */
  analysis_metadata: AnalysisMetadata;
}

export interface ConceptInputs {
  /** 추천 방향 */
  recommended_directions: RecommendedDirection[];

  /** 필수 포함 요소 */
  must_include: {
    visual_elements: string[];
    copy_elements: string[];
    format_elements: string[];
  };

  /** 피해야 할 요소 */
  must_avoid: string[];

  /** 추천 훅 */
  recommended_hooks: RecommendedHook[];

  /** 해시태그 추천 */
  hashtag_recommendations: {
    primary: string[];
    secondary: string[];
    trending: string[];
  };
}

export interface RecommendedDirection {
  direction: string;
  reasoning: string;
  confidence_score: number;
  source_insights: string[];
}

export interface RecommendedHook {
  hook_type: string;
  example: string;
  effectiveness_score: number;
}

export interface AnalysisMetadata {
  sample_size: number;
  success_ads_count: number;
  average_ads_count: number;
  failure_ads_count: number;
  data_sources: AdSource[];
  analysis_quality_score: number;
  analyzed_at: Date;
  expires_at: Date;
}

// ============================================================================
// 8. 광고 수집 요청 (Ad Collection Request)
// ============================================================================

export interface AdCollectionRequest {
  platform: Platform;
  industry: string;
  sampling: SamplingConfig;
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
  /** 검색 키워드 (선택) */
  search_terms?: string[];
  /** 제외할 광고주 (선택) */
  exclude_advertisers?: string[];
}

// ============================================================================
// 9. 외부 API 응답 타입
// ============================================================================

/** Meta Ad Library API 응답 */
export interface MetaAdResult {
  id: string;
  ad_creation_time: string;
  ad_creative_bodies?: string[];
  ad_creative_link_captions?: string[];
  ad_creative_link_titles?: string[];
  ad_delivery_start_time: string;
  ad_delivery_stop_time?: string;
  ad_snapshot_url: string;
  page_id: string;
  page_name: string;
  publisher_platforms: string[];
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

/** TikTok Creative Center API 응답 */
export interface TikTokTopAdResult {
  ad_id: string;
  video_info: {
    video_url: string;
    cover_image_url: string;
    duration: number;
  };
  ad_text: string;
  brand_name: string;
  metrics: {
    play_count: number;
    like_count: number;
    comment_count: number;
    share_count: number;
    engagement_rate: number;
  };
  industry: string;
  objective: string;
  country_code: string;
  first_seen_date: string;
  last_seen_date: string;
}

/** Google Ads Transparency 응답 */
export interface GoogleAdResult {
  ad_id: string;
  advertiser_name: string;
  ad_format: string;
  creative_url: string;
  first_shown: string;
  last_shown: string;
  regions: string[];
}

// ============================================================================
// 10. 캐시 관련 타입
// ============================================================================

export interface CachedAnalysis {
  data: ChannelAnalysisResult;
  cached_at: Date;
  expires_at: Date;
}

export interface IndustryAnalysisCache {
  channel: Platform;
  industry: string;
  aggregated_patterns: ExtractedPattern[];
  ads_analyzed: number;
  last_updated: Date;
}

// ============================================================================
// 11. 분석 API 요청/응답 타입
// ============================================================================

export interface AnalyzeChannelRequest {
  industry: string;
  target_audience?: string;
  campaign_goal?: string;
  force_refresh?: boolean;
}

export interface AnalyzeChannelResponse {
  success: boolean;
  data: ChannelAnalysisResult;
  cached: boolean;
}

export interface GenerateConceptsFromAnalysisRequest {
  analysis_id: string;
  preferred_direction?: string;
  exclude_patterns?: string[];
}

// ============================================================================
// 12. 인접 업종 매핑
// ============================================================================

export const ADJACENT_INDUSTRIES: Record<string, string[]> = {
  cosmetics: ['beauty', 'skincare', 'fashion', 'wellness', 'health'],
  fashion: ['cosmetics', 'lifestyle', 'luxury', 'accessories', 'beauty'],
  food: ['beverage', 'restaurant', 'grocery', 'health', 'lifestyle'],
  tech: ['software', 'gadgets', 'electronics', 'gaming', 'mobile'],
  fitness: ['health', 'wellness', 'sports', 'nutrition', 'lifestyle'],
  finance: ['insurance', 'investment', 'banking', 'fintech', 'business'],
  education: ['edtech', 'career', 'courses', 'books', 'business'],
  travel: ['hospitality', 'tourism', 'lifestyle', 'food', 'luxury'],
  automotive: ['transport', 'mobility', 'tech', 'luxury', 'lifestyle'],
  gaming: ['entertainment', 'tech', 'mobile', 'esports', 'streaming'],
};

// ============================================================================
// 13. 기본 설정 상수
// ============================================================================

export const DEFAULT_SAMPLING_CONFIG: SamplingConfig = {
  total: 60,
  industry_direct: 30,
  industry_adjacent: 20,
  industry_reference: 10,
  time_distribution: {
    recent_7d: 20,
    recent_30d: 25,
    recent_90d: 15,
  },
  performance_distribution: {
    success: 40,
    average: 15,
    failure: 5,
  },
};

export const DEFAULT_SUCCESS_CRITERIA: SuccessCriteria = {
  min_active_days: 14,
  performance_tier: 'top_20_percent',
  same_advertiser_reuse: true,
};

/** 분석 캐시 유효 기간 (밀리초) - 24시간 */
export const ANALYSIS_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

/** 분석 품질 점수 기준 */
export const QUALITY_SCORE_THRESHOLDS = {
  excellent: 90,
  good: 70,
  acceptable: 50,
  poor: 0,
} as const;
