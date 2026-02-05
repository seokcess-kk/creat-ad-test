import { createSupabaseServerClient, isDevMode } from './supabase';
import type {
  Campaign,
  Analysis,
  Concept,
  Creative,
  CreateCampaignRequest,
  CampaignStatus,
} from '@/types/database';

// ============================================================
// 개발 모드용 인메모리 저장소 (globalThis로 서버 재시작 전까지 유지)
// ============================================================
interface DevStore {
  campaigns: Campaign[];
  analyses: Analysis[];
  concepts: Concept[];
  creatives: Creative[];
}

// globalThis를 사용하여 Next.js 서버리스 환경에서도 데이터 유지
const globalForDev = globalThis as unknown as { devStore: DevStore };

const devStore: DevStore = globalForDev.devStore || {
  campaigns: [],
  analyses: [],
  concepts: [],
  creatives: [],
};

if (!globalForDev.devStore) {
  globalForDev.devStore = devStore;
}

function generateId(): string {
  return `dev-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// ============================================================
// Campaign Queries
// ============================================================
export async function getCampaigns(userId: string): Promise<Campaign[]> {
  if (isDevMode) {
    return devStore.campaigns
      .filter((c) => c.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  const supabase = createSupabaseServerClient();
  if (!supabase) throw new Error('Supabase client not available');

  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getCampaignById(id: string): Promise<Campaign | null> {
  if (isDevMode) {
    return devStore.campaigns.find((c) => c.id === id) || null;
  }

  const supabase = createSupabaseServerClient();
  if (!supabase) throw new Error('Supabase client not available');

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
  if (isDevMode) {
    const newCampaign: Campaign = {
      id: generateId(),
      user_id: userId,
      ...input,
      status: 'draft' as CampaignStatus,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    devStore.campaigns.push(newCampaign);
    return newCampaign;
  }

  const supabase = createSupabaseServerClient();
  if (!supabase) throw new Error('Supabase client not available');

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
  if (isDevMode) {
    const campaign = devStore.campaigns.find((c) => c.id === id);
    if (!campaign) throw new Error('Campaign not found');
    campaign.status = status;
    campaign.updated_at = new Date().toISOString();
    return campaign;
  }

  const supabase = createSupabaseServerClient();
  if (!supabase) throw new Error('Supabase client not available');

  const { data, error } = await supabase
    .from('campaigns')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================================
// Analysis Queries
// ============================================================
export async function getAnalysisByCampaignId(
  campaignId: string
): Promise<Analysis | null> {
  if (isDevMode) {
    return devStore.analyses.find((a) => a.campaign_id === campaignId) || null;
  }

  const supabase = createSupabaseServerClient();
  if (!supabase) throw new Error('Supabase client not available');

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
  if (isDevMode) {
    const newAnalysis: Analysis = {
      id: generateId(),
      campaign_id: campaignId,
      ...analysis,
      created_at: new Date().toISOString(),
    };
    devStore.analyses.push(newAnalysis);
    return newAnalysis;
  }

  const supabase = createSupabaseServerClient();
  if (!supabase) throw new Error('Supabase client not available');

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

// ============================================================
// Concept Queries
// ============================================================
export async function getConceptById(id: string): Promise<(Concept & { campaign?: Campaign }) | null> {
  if (isDevMode) {
    const concept = devStore.concepts.find((c) => c.id === id);
    if (!concept) return null;
    const campaign = devStore.campaigns.find((c) => c.id === concept.campaign_id);
    return { ...concept, campaign };
  }

  const supabase = createSupabaseServerClient();
  if (!supabase) throw new Error('Supabase client not available');

  const { data, error } = await supabase
    .from('concepts')
    .select('*, campaigns(*)')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data ? { ...data, campaign: data.campaigns } : null;
}

export async function getConceptsByCampaignId(
  campaignId: string
): Promise<Concept[]> {
  if (isDevMode) {
    return devStore.concepts
      .filter((c) => c.campaign_id === campaignId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }

  const supabase = createSupabaseServerClient();
  if (!supabase) throw new Error('Supabase client not available');

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
  if (isDevMode) {
    const newConcepts: Concept[] = concepts.map((concept) => ({
      id: generateId(),
      campaign_id: campaignId,
      ...concept,
      is_selected: false,
      created_at: new Date().toISOString(),
    }));
    devStore.concepts.push(...newConcepts);
    return newConcepts;
  }

  const supabase = createSupabaseServerClient();
  if (!supabase) throw new Error('Supabase client not available');

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
  if (isDevMode) {
    const concept = devStore.concepts.find((c) => c.id === id);
    if (!concept) throw new Error('Concept not found');
    // 같은 캠페인의 모든 컨셉 선택 해제
    devStore.concepts
      .filter((c) => c.campaign_id === concept.campaign_id)
      .forEach((c) => (c.is_selected = false));
    concept.is_selected = true;
    return concept;
  }

  const supabase = createSupabaseServerClient();
  if (!supabase) throw new Error('Supabase client not available');

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

// ============================================================
// Creative Queries
// ============================================================
export async function getCreativeById(id: string): Promise<Creative | null> {
  if (isDevMode) {
    return devStore.creatives.find((c) => c.id === id) || null;
  }

  const supabase = createSupabaseServerClient();
  if (!supabase) throw new Error('Supabase client not available');

  const { data, error } = await supabase
    .from('creatives')
    .select('*')
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function getCreativesByConceptId(
  conceptId: string
): Promise<Creative[]> {
  if (isDevMode) {
    return devStore.creatives
      .filter((c) => c.concept_id === conceptId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }

  const supabase = createSupabaseServerClient();
  if (!supabase) throw new Error('Supabase client not available');

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
  if (isDevMode) {
    const newCreatives: Creative[] = creatives.map((creative) => ({
      id: generateId(),
      concept_id: conceptId,
      ...creative,
      created_at: new Date().toISOString(),
    }));
    devStore.creatives.push(...newCreatives);
    return newCreatives;
  }

  const supabase = createSupabaseServerClient();
  if (!supabase) throw new Error('Supabase client not available');

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
