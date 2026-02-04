import { create } from 'zustand';
import type { Campaign, Analysis, Concept, Creative, Platform } from '@/types/database';

interface CampaignStore {
  // State
  currentStep: number;
  campaign: Campaign | null;
  analysis: Analysis | null;
  concepts: Concept[];
  selectedConcept: Concept | null;
  creatives: Creative[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  setCampaign: (campaign: Campaign) => void;
  setAnalysis: (analysis: Analysis) => void;
  setConcepts: (concepts: Concept[]) => void;
  selectConcept: (concept: Concept) => void;
  setCreatives: (creatives: Creative[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  currentStep: 1,
  campaign: null,
  analysis: null,
  concepts: [],
  selectedConcept: null,
  creatives: [],
  isLoading: false,
  error: null,
};

export const useCampaignStore = create<CampaignStore>((set) => ({
  ...initialState,

  setStep: (step) => set({ currentStep: step }),
  nextStep: () => set((state) => ({ currentStep: Math.min(state.currentStep + 1, 5) })),
  prevStep: () => set((state) => ({ currentStep: Math.max(state.currentStep - 1, 1) })),

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
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  reset: () => set(initialState),
}));
