// Export Service - 데이터 조회 및 변환
// Feature: export-api

import { createSupabaseServerClient, isDevMode } from '@/lib/db/supabase';
import { trackingService } from './tracking';
import type {
  ExportCreative,
  ExportCreativesQuery,
  ExportCampaignQuery,
  ExportBatchQuery,
  ExportCreativeMetadata,
} from '@/types/export';
import type { Campaign, Analysis, Concept, Platform } from '@/types/database';

/**
 * ExportService - 소재 데이터 내보내기 서비스
 */
class ExportService {
  /**
   * 소재 목록 조회 (Export용)
   */
  async getCreatives(
    userId: string,
    query: ExportCreativesQuery
  ): Promise<{ creatives: ExportCreative[]; total: number }> {
    // 개발 모드 - 빈 결과 반환
    if (isDevMode) {
      return { creatives: [], total: 0 };
    }

    const supabase = createSupabaseServerClient();
    if (!supabase) {
      return { creatives: [], total: 0 };
    }

    const limit = Math.min(query.limit || 100, 1000);
    const offset = query.offset || 0;

    // 기본 쿼리 - concepts와 campaigns 조인
    let dbQuery = supabase
      .from('creatives')
      .select(
        `
        *,
        concepts!inner (
          id,
          campaign_id,
          campaigns!inner (
            id,
            user_id,
            brand_name,
            campaign_goal,
            target_audience
          )
        )
      `,
        { count: 'exact' }
      );

    // 사용자 필터 (시스템 사용자는 전체 접근)
    if (userId !== 'system') {
      dbQuery = dbQuery.eq('concepts.campaigns.user_id', userId);
    }

    // 플랫폼 필터
    if (query.platform) {
      dbQuery = dbQuery.eq('platform', query.platform);
    }

    // 날짜 범위 필터
    if (query.from) {
      dbQuery = dbQuery.gte('created_at', query.from);
    }
    if (query.to) {
      dbQuery = dbQuery.lte('created_at', query.to);
    }

    // 정렬 및 페이지네이션
    dbQuery = dbQuery
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, count, error } = await dbQuery;

    if (error) {
      console.error('Export creatives query error:', error);
      throw new Error(`Failed to fetch creatives: ${error.message}`);
    }

    // ExportCreative 형식으로 변환
    const creatives = (data || []).map((item) =>
      this.toExportCreative(item, query.include_metadata !== false)
    );

    return {
      creatives,
      total: count || 0,
    };
  }

  /**
   * 캠페인별 전체 데이터 조회
   */
  async getCampaignExport(
    userId: string,
    campaignId: string,
    options: ExportCampaignQuery
  ): Promise<{
    campaign: Campaign;
    analysis: Analysis | null;
    concepts: Concept[];
    creatives: ExportCreative[];
    summary: {
      total_creatives: number;
      by_platform: Partial<Record<Platform, number>>;
      by_type: Partial<Record<'image' | 'copy', number>>;
    };
  }> {
    // 개발 모드 - 에러
    if (isDevMode) {
      throw new Error('Campaign not found (dev mode)');
    }

    const supabase = createSupabaseServerClient();
    if (!supabase) {
      throw new Error('Database not available');
    }

    // 1. 캠페인 조회 및 권한 확인
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (campaignError || !campaign) {
      throw new Error('Campaign not found');
    }

    // 권한 확인 (시스템 사용자는 통과)
    if (userId !== 'system' && campaign.user_id !== userId) {
      throw new Error('Unauthorized access to campaign');
    }

    // 2. 관련 데이터 병렬 조회
    const [analysisResult, conceptsResult, creativesResult] = await Promise.all([
      // 분석 결과 (옵션)
      options.include_analysis !== false
        ? supabase
            .from('analyses')
            .select('*')
            .eq('campaign_id', campaignId)
            .single()
        : Promise.resolve({ data: null, error: null }),

      // 컨셉 목록 (옵션)
      options.include_concepts !== false
        ? supabase
            .from('concepts')
            .select('*')
            .eq('campaign_id', campaignId)
            .order('created_at', { ascending: true })
        : Promise.resolve({ data: [], error: null }),

      // 소재 목록
      supabase
        .from('creatives')
        .select(
          `
          *,
          concepts!inner (
            id,
            campaign_id
          )
        `
        )
        .eq('concepts.campaign_id', campaignId)
        .order('created_at', { ascending: false }),
    ]);

    const analysis = analysisResult.data as Analysis | null;
    const concepts = (conceptsResult.data || []) as Concept[];
    const rawCreatives = creativesResult.data || [];

    // ExportCreative 변환 (캠페인 정보 포함)
    const creatives = rawCreatives.map((item) =>
      this.toExportCreative(
        {
          ...item,
          concepts: {
            ...item.concepts,
            campaigns: campaign,
          },
        },
        true
      )
    );

    // 3. 통계 계산
    const summary = this.calculateSummary(creatives);

    return {
      campaign: campaign as Campaign,
      analysis,
      concepts,
      creatives,
      summary,
    };
  }

  /**
   * DB 결과를 ExportCreative로 변환
   */
  private toExportCreative(
    item: Record<string, unknown>,
    includeMetadata: boolean
  ): ExportCreative {
    const concepts = item.concepts as Record<string, unknown> | undefined;
    const campaigns = concepts?.campaigns as Record<string, unknown> | undefined;

    // tracking_code 생성 (없는 경우)
    let trackingCode = item.tracking_code as string | null;
    if (!trackingCode && concepts?.campaign_id) {
      trackingCode = trackingService.generate({
        campaignId: concepts.campaign_id as string,
        platform: item.platform as Platform,
        version: (item.version as number) || 1,
      });
    }

    // 메타데이터 구성
    const metadata: ExportCreativeMetadata = includeMetadata
      ? {
          ...(item.metadata as Record<string, unknown>),
          campaign_goal: campaigns?.campaign_goal as string | undefined,
          target_audience: campaigns?.target_audience as string | undefined,
          brand_name: campaigns?.brand_name as string | undefined,
        }
      : {};

    return {
      creative_id: item.id as string,
      external_id: (item.external_id as string) || null,
      tracking_code: trackingCode,
      version: (item.version as number) || 1,
      campaign_id: concepts?.campaign_id as string,
      concept_id: item.concept_id as string,
      type: item.type as 'image' | 'copy',
      platform: item.platform as Platform,
      content_url: (item.content_url as string) || null,
      copy_text: (item.copy_text as string) || null,
      resolution: (item.resolution as string) || null,
      metadata,
      created_at: item.created_at as string,
    };
  }

  /**
   * 개별 소재 상세 조회
   */
  async getCreativeById(
    userId: string,
    creativeId: string,
    options: { include_metadata?: boolean }
  ): Promise<ExportCreative> {
    // 개발 모드 - 에러
    if (isDevMode) {
      throw new Error('Creative not found (dev mode)');
    }

    const supabase = createSupabaseServerClient();
    if (!supabase) {
      throw new Error('Database not available');
    }

    // 소재 조회 (campaigns까지 조인)
    const { data, error } = await supabase
      .from('creatives')
      .select(
        `
        *,
        concepts!inner (
          id,
          campaign_id,
          campaigns!inner (
            id,
            user_id,
            brand_name,
            campaign_goal,
            target_audience
          )
        )
      `
      )
      .eq('id', creativeId)
      .single();

    if (error || !data) {
      throw new Error('Creative not found');
    }

    // 권한 확인 (시스템 사용자는 통과)
    const concepts = data.concepts as Record<string, unknown>;
    const campaigns = concepts?.campaigns as Record<string, unknown>;

    if (userId !== 'system' && campaigns?.user_id !== userId) {
      throw new Error('Unauthorized access to creative');
    }

    return this.toExportCreative(data, options.include_metadata !== false);
  }

  /**
   * 일괄 내보내기 (기간 기반)
   */
  async getBatchExport(
    userId: string,
    query: ExportBatchQuery
  ): Promise<{
    campaigns_count: number;
    creatives_count: number;
    campaigns: Array<{
      campaign: Campaign;
      creatives: ExportCreative[];
    }>;
  }> {
    // 개발 모드 - 빈 결과
    if (isDevMode) {
      return { campaigns_count: 0, creatives_count: 0, campaigns: [] };
    }

    const supabase = createSupabaseServerClient();
    if (!supabase) {
      throw new Error('Database not available');
    }

    // 1. 기간 내 캠페인 조회
    let campaignsQuery = supabase
      .from('campaigns')
      .select('*')
      .gte('created_at', query.from)
      .lte('created_at', query.to);

    // 사용자 필터 (시스템 사용자는 전체 접근)
    if (userId !== 'system') {
      campaignsQuery = campaignsQuery.eq('user_id', userId);
    }

    // 특정 캠페인 필터
    if (query.campaigns && query.campaigns.length > 0) {
      campaignsQuery = campaignsQuery.in('id', query.campaigns);
    }

    const { data: campaigns, error: campaignsError } = await campaignsQuery.order('created_at', {
      ascending: false,
    });

    if (campaignsError) {
      throw new Error(`Failed to fetch campaigns: ${campaignsError.message}`);
    }

    if (!campaigns || campaigns.length === 0) {
      return { campaigns_count: 0, creatives_count: 0, campaigns: [] };
    }

    // 2. 각 캠페인의 소재 조회
    const campaignIds = campaigns.map((c) => c.id);

    const { data: rawCreatives, error: creativesError } = await supabase
      .from('creatives')
      .select(
        `
        *,
        concepts!inner (
          id,
          campaign_id
        )
      `
      )
      .in('concepts.campaign_id', campaignIds)
      .order('created_at', { ascending: false });

    if (creativesError) {
      throw new Error(`Failed to fetch creatives: ${creativesError.message}`);
    }

    // 3. 캠페인별로 소재 그룹핑
    const result = campaigns.map((campaign) => {
      const campaignCreatives = (rawCreatives || [])
        .filter((item) => {
          const concepts = item.concepts as Record<string, unknown>;
          return concepts?.campaign_id === campaign.id;
        })
        .map((item) =>
          this.toExportCreative(
            {
              ...item,
              concepts: {
                ...(item.concepts as Record<string, unknown>),
                campaigns: campaign,
              },
            },
            true
          )
        );

      return {
        campaign: campaign as Campaign,
        creatives: campaignCreatives,
      };
    });

    const totalCreatives = result.reduce((sum, r) => sum + r.creatives.length, 0);

    return {
      campaigns_count: campaigns.length,
      creatives_count: totalCreatives,
      campaigns: result,
    };
  }

  /**
   * 소재 통계 계산
   */
  private calculateSummary(creatives: ExportCreative[]): {
    total_creatives: number;
    by_platform: Partial<Record<Platform, number>>;
    by_type: Partial<Record<'image' | 'copy', number>>;
  } {
    const byPlatform: Partial<Record<Platform, number>> = {};
    const byType: Partial<Record<'image' | 'copy', number>> = {};

    for (const creative of creatives) {
      // 플랫폼별 카운트
      byPlatform[creative.platform] = (byPlatform[creative.platform] || 0) + 1;

      // 타입별 카운트
      if (creative.type === 'image' || creative.type === 'copy') {
        byType[creative.type] = (byType[creative.type] || 0) + 1;
      }
    }

    return {
      total_creatives: creatives.length,
      by_platform: byPlatform,
      by_type: byType,
    };
  }
}

export const exportService = new ExportService();
