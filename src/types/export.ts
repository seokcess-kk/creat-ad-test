// Export API Types
// Feature: export-api

import type { Platform, CampaignGoal, Campaign, Creative, Analysis, Concept } from './database';

// ─────────────────────────────────────────────────────────────────
// Export Format
// ─────────────────────────────────────────────────────────────────

export type ExportFormat = 'json' | 'csv';

// ─────────────────────────────────────────────────────────────────
// Export Request Query Types
// ─────────────────────────────────────────────────────────────────

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
// Export Creative Types
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
  campaign_goal?: CampaignGoal | string;
  target_audience?: string;
  brand_name?: string;
  generation_params?: {
    resolution: '2k' | '4k';
    variation_index: number;
  };
  tags?: string[];
  [key: string]: unknown;  // 추가 메타데이터 허용
}

// ─────────────────────────────────────────────────────────────────
// Export Response Types
// ─────────────────────────────────────────────────────────────────

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
    analysis?: Analysis | null;
    concepts?: Concept[];
    creatives: ExportCreative[];
    summary: {
      total_creatives: number;
      by_platform: Partial<Record<Platform, number>>;
      by_type: Partial<Record<'image' | 'copy', number>>;
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

// Error Response
export interface ExportErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  requestId: string;
}

// ─────────────────────────────────────────────────────────────────
// Tracking Code
// ─────────────────────────────────────────────────────────────────

export interface TrackingCodeParams {
  campaignId: string;
  platform: Platform;
  version: number;
}

// ─────────────────────────────────────────────────────────────────
// Extended Creative (with new fields)
// ─────────────────────────────────────────────────────────────────

export interface CreativeWithExportFields extends Creative {
  external_id?: string | null;
  tracking_code?: string | null;
  version?: number;
}
