import { create } from 'zustand';
import type { Campaign, Analysis, Concept, Creative, Platform } from '@/types/database';
import type { ChannelAnalysisResult } from '@/types/analysis';

interface CampaignStore {
  // State
  currentStep: number;

  // Channel-First Flow (v2.0)
  selectedChannel: Platform | null;
  industry: string;
  channelAnalysis: ChannelAnalysisResult | null;

  // Campaign Data
  campaign: Campaign | null;
  analysis: Analysis | null;
  concepts: Concept[];
  selectedConcept: Concept | null;
  creatives: Creative[];

  // UI State
  isLoading: boolean;
  isAnalyzing: boolean;
  error: string | null;

  // Actions - Navigation
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;

  // Actions - Channel Selection (Step 1)
  setSelectedChannel: (channel: Platform) => void;
  setIndustry: (industry: string) => void;

  // Actions - Channel Analysis (Step 2)
  setChannelAnalysis: (analysis: ChannelAnalysisResult) => void;
  setAnalyzing: (analyzing: boolean) => void;

  // Actions - Campaign Data
  setCampaign: (campaign: Campaign) => void;
  setAnalysis: (analysis: Analysis) => void;
  setConcepts: (concepts: Concept[]) => void;
  selectConcept: (concept: Concept) => void;
  setCreatives: (creatives: Creative[]) => void;

  // Actions - UI State
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;

  // Actions - Add Another Channel
  addAnotherChannel: () => void;
}

const initialState = {
  currentStep: 1,

  // Channel-First
  selectedChannel: null as Platform | null,
  industry: '',
  channelAnalysis: null as ChannelAnalysisResult | null,

  // Campaign Data
  campaign: null as Campaign | null,
  analysis: null as Analysis | null,
  concepts: [] as Concept[],
  selectedConcept: null as Concept | null,
  creatives: [] as Creative[],

  // UI State
  isLoading: false,
  isAnalyzing: false,
  error: null as string | null,
};

export const useCampaignStore = create<CampaignStore>((set) => ({
  ...initialState,

  // Navigation
  setStep: (step) => set({ currentStep: step }),
  nextStep: () => set((state) => ({ currentStep: Math.min(state.currentStep + 1, 6) })),
  prevStep: () => set((state) => ({ currentStep: Math.max(state.currentStep - 1, 1) })),

  // Channel Selection
  setSelectedChannel: (channel) => set({ selectedChannel: channel }),
  setIndustry: (industry) => set({ industry }),

  // Channel Analysis
  setChannelAnalysis: (channelAnalysis) => set({ channelAnalysis }),
  setAnalyzing: (isAnalyzing) => set({ isAnalyzing }),

  // Campaign Data
  setCampaign: (campaign) => set({ campaign }),
  setAnalysis: (analysis) => set({ analysis }),
  setConcepts: (concepts) => set({ concepts }),
  selectConcept: (concept) =>
    set((state) => ({
      selectedConcept: concept,
      concepts: state.concepts.map((c) => ({
        ...c,
        is_selected: c.id === concept.id,
      })),
    })),
  setCreatives: (creatives) => set({ creatives }),

  // UI State
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  // Reset
  reset: () => set(initialState),

  // Add Another Channel - 결과에서 다른 채널 추가 시
  addAnotherChannel: () =>
    set({
      currentStep: 1,
      selectedChannel: null,
      channelAnalysis: null,
      concepts: [],
      selectedConcept: null,
      creatives: [],
      // campaign, industry는 유지
    }),
}));
