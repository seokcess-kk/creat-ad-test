// 캠페인 목표 타입
export type CampaignGoal = 'awareness' | 'conversion' | 'engagement' | 'traffic';

// 플랫폼 타입
export type Platform =
  | 'instagram_feed'
  | 'instagram_story'
  | 'tiktok'
  | 'threads'
  | 'youtube_shorts'
  | 'youtube_ads';

// 캠페인 상태
export type CampaignStatus = 'draft' | 'analyzing' | 'planning' | 'generating' | 'completed';

// 크리에이티브 타입
export type CreativeType = 'image' | 'copy' | 'video';

// User
export interface User {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

// Campaign
export interface Campaign {
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
export interface Analysis {
  id: string;
  campaign_id: string;
  target_persona: TargetPersona;
  platform_guidelines: PlatformGuideline[];
  trend_insights: TrendInsight[];
  created_at: string;
}

export interface TargetPersona {
  age_range: string;
  gender: string;
  interests: string[];
  pain_points: string[];
  motivations: string[];
}

export interface PlatformGuideline {
  platform: Platform;
  tone: string;
  best_practices: string[];
  avoid: string[];
}

export interface TrendInsight {
  topic: string;
  relevance: number;
  description: string;
}

// Concept
export interface Concept {
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
export interface Creative {
  id: string;
  concept_id: string;
  type: CreativeType;
  platform: Platform;
  content_url: string | null;
  copy_text: string | null;
  resolution: string | null;
  metadata: CreativeMetadata;
  created_at: string;
}

export interface CreativeMetadata {
  prompt?: string;
  model?: string;
  generation_params?: Record<string, unknown>;
  variation?: number;
  optimized?: boolean; // 플랫폼 최적화 카피 여부
}

// API Request/Response Types
export interface CreateCampaignRequest {
  brand_name: string;
  product_description: string;
  campaign_goal: CampaignGoal;
  target_audience: string;
  platforms: Platform[];
}

export interface GenerateRequest {
  platforms: Platform[];
  include_copy: boolean;
  resolution?: '2k' | '4k';
  variations?: number;
}

// Platform Specs
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

// Campaign Goals
export const CAMPAIGN_GOALS = {
  awareness: { label: '인지도', description: '브랜드 인지도 향상' },
  conversion: { label: '전환', description: '구매/가입 유도' },
  engagement: { label: '참여', description: '좋아요/댓글/공유 유도' },
  traffic: { label: '트래픽', description: '웹사이트 방문 유도' },
} as const;
