import { createSupabaseServerClient } from './supabase';
import type {
  Campaign,
  Analysis,
  Concept,
  Creative,
  CreateCampaignRequest,
  CampaignStatus,
} from '@/types/database';

// Campaign Queries
export async function getCampaigns(userId: string): Promise<Campaign[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getCampaignById(id: string): Promise<Campaign | null> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function createCampaign(
  userId: string,
  input: CreateCampaignRequest
): Promise<Campaign> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('campaigns')
    .insert({
      user_id: userId,
      ...input,
      status: 'draft' as CampaignStatus,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateCampaignStatus(
  id: string,
  status: CampaignStatus
): Promise<Campaign> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('campaigns')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Analysis Queries
export async function getAnalysisByCampaignId(
  campaignId: string
): Promise<Analysis | null> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('analyses')
    .select('*')
    .eq('campaign_id', campaignId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function createAnalysis(
  campaignId: string,
  analysis: Omit<Analysis, 'id' | 'campaign_id' | 'created_at'>
): Promise<Analysis> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('analyses')
    .insert({
      campaign_id: campaignId,
      ...analysis,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Concept Queries
export async function getConceptsByCampaignId(
  campaignId: string
): Promise<Concept[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('concepts')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function createConcepts(
  campaignId: string,
  concepts: Omit<Concept, 'id' | 'campaign_id' | 'created_at' | 'is_selected'>[]
): Promise<Concept[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('concepts')
    .insert(
      concepts.map((concept) => ({
        campaign_id: campaignId,
        ...concept,
        is_selected: false,
      }))
    )
    .select();

  if (error) throw error;
  return data || [];
}

export async function selectConcept(id: string): Promise<Concept> {
  const supabase = createSupabaseServerClient();

  // 먼저 해당 컨셉의 캠페인 ID를 가져옴
  const { data: concept, error: fetchError } = await supabase
    .from('concepts')
    .select('campaign_id')
    .eq('id', id)
    .single();

  if (fetchError) throw fetchError;

  // 같은 캠페인의 모든 컨셉 선택 해제
  await supabase
    .from('concepts')
    .update({ is_selected: false })
    .eq('campaign_id', concept.campaign_id);

  // 선택한 컨셉만 선택
  const { data, error } = await supabase
    .from('concepts')
    .update({ is_selected: true })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// Creative Queries
export async function getCreativesByConceptId(
  conceptId: string
): Promise<Creative[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('creatives')
    .select('*')
    .eq('concept_id', conceptId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function createCreatives(
  conceptId: string,
  creatives: Omit<Creative, 'id' | 'concept_id' | 'created_at'>[]
): Promise<Creative[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from('creatives')
    .insert(
      creatives.map((creative) => ({
        concept_id: conceptId,
        ...creative,
      }))
    )
    .select();

  if (error) throw error;
  return data || [];
}
