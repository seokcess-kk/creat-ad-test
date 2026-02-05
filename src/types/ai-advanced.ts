/**
 * AI 서비스 고도화 타입 정의
 * @description 심층 분석, 매체별 최적화, 전략 수립을 위한 타입
 */

import type { Platform, TargetPersona, PlatformGuideline, TrendInsight } from './database';

// ============================================================================
// 1. 심층 분석 시스템 (Deep Analysis System)
// ============================================================================

export interface DeepAnalysis {
  // 기존 필드
  target_persona: TargetPersona;
  platform_guidelines: PlatformGuideline[];
  trend_insights: TrendInsight[];

  // 신규 확장 필드
  industry_analysis: IndustryAnalysis;
  competitor_analysis: CompetitorAnalysis;
  consumer_journey: ConsumerJourney;
  psychological_triggers: PsychologicalTrigger[];
  cultural_context: CulturalContext;
  seasonal_opportunities: SeasonalOpportunity[];
}

export interface IndustryAnalysis {
  market_size: string;
  growth_rate: string;
  key_trends: string[];
  competitive_intensity: 'low' | 'medium' | 'high';
  entry_barriers: string[];
  opportunities: string[];
}

export interface CompetitorAnalysis {
  direct_competitors: Competitor[];
  indirect_competitors: Competitor[];
  positioning_map: PositioningMap;
  differentiation_opportunities: string[];
  competitive_advantages: string[];
}

export interface Competitor {
  name: string;
  positioning: string;
  strengths: string[];
  weaknesses: string[];
  messaging_style: string;
  target_overlap: number; // 0-1
}

export interface PositioningMap {
  x_axis: { label: string; scale: [string, string] };
  y_axis: { label: string; scale: [string, string] };
  brand_position: { x: number; y: number };
  competitors: { name: string; x: number; y: number }[];
  opportunity_zones: { x: number; y: number; description: string }[];
}

export interface ConsumerJourney {
  awareness: JourneyStage;
  interest: JourneyStage;
  desire: JourneyStage;
  action: JourneyStage;
  advocacy: JourneyStage;
}

export interface JourneyStage {
  touchpoints: string[];
  emotions: string[];
  pain_points: string[];
  opportunities: string[];
  content_types: string[];
}

export interface PsychologicalTrigger {
  trigger_type: 'fear' | 'aspiration' | 'belonging' | 'achievement' | 'curiosity' | 'urgency';
  description: string;
  application: string;
  intensity: number; // 0-1
}

export interface CulturalContext {
  current_zeitgeist: string[];
  relevant_movements: string[];
  taboos: string[];
  cultural_codes: string[];
  localization_notes: string;
}

export interface SeasonalOpportunity {
  period: string;
  event: string;
  relevance: number;
  messaging_angle: string;
  visual_theme: string;
}

// ============================================================================
// 2. 매체별 최적화 엔진 (Platform Optimization Engine)
// ============================================================================

export interface PlatformDeepProfile {
  platform: Platform;
  algorithm: AlgorithmProfile;
  user_behavior: UserBehaviorProfile;
  content_specs: ContentSpecs;
  ad_characteristics: AdCharacteristics;
  benchmarks: PlatformBenchmarks;
}

export interface AlgorithmProfile {
  primary_signals: string[];
  engagement_factors: EngagementFactor[];
  optimal_posting_times: PostingTime[];
  content_decay_rate: string;
  viral_mechanics: string[];
}

export interface EngagementFactor {
  factor: string;
  weight: number;
  optimization_tip: string;
}

export interface PostingTime {
  day: 'weekday' | 'weekend' | 'all';
  times: string[];
}

export interface UserBehaviorProfile {
  average_session_duration: string;
  scroll_speed: string;
  attention_span: string;
  interaction_patterns: string[];
  content_consumption_mode: 'passive' | 'active' | 'mixed';
}

export interface ContentSpecs {
  optimal_length: ContentLength;
  visual_requirements: VisualRequirements;
  copy_guidelines: CopyGuidelines;
  hook_requirements: HookRequirements;
  cta_placement: CTAPlacement;
}

export interface ContentLength {
  video_seconds: { min: number; optimal: number; max: number };
  caption_characters: { min: number; optimal: number; max: number };
  hashtags: { min: number; optimal: number; max: number };
}

export interface VisualRequirements {
  aspect_ratio: string[];
  resolution: string;
  safe_zones: { top: number; bottom: number; left: number; right: number };
  text_overlay_limit: number;
  motion_requirements: string;
  color_preferences: string[];
  thumbnail_importance: number;
}

export interface CopyGuidelines {
  tone: string[];
  first_line_hook: boolean;
  emoji_usage: 'heavy' | 'moderate' | 'minimal' | 'none';
  hashtag_strategy: string;
  mention_strategy: string;
  cta_style: string;
  line_breaks: string;
}

export interface HookRequirements {
  hook_window_seconds: number;
  hook_types: string[];
  pattern_interrupt_techniques: string[];
  curiosity_gap_examples: string[];
}

export interface CTAPlacement {
  primary_position: string;
  secondary_positions: string[];
  button_vs_text: string;
  urgency_level: 'low' | 'medium' | 'high';
}

export interface AdCharacteristics {
  ad_fatigue_threshold: string;
  frequency_cap_recommendation: number;
  creative_refresh_cycle: string;
  native_vs_polished: number; // 0=native, 1=polished
}

export interface PlatformBenchmarks {
  average_engagement_rate: number;
  average_ctr: number;
  average_cpm_range: [number, number];
  top_performer_threshold: number;
}

// ============================================================================
// 3. 전략 수립 (Strategy Formulation)
// ============================================================================

export interface CreativeStrategy {
  positioning: BrandPositioning;
  messaging_framework: MessagingFramework;
  platform_strategies: PlatformStrategy[];
  creative_direction: CreativeDirection;
  kpi_targets: KPITargets;
}

export interface BrandPositioning {
  unique_value_proposition: string;
  competitive_advantage: string;
  emotional_benefit: string;
  functional_benefit: string;
  brand_personality: string[];
  tone_of_voice: string;
}

export interface MessagingFramework {
  primary_message: string;
  supporting_messages: string[];
  proof_points: string[];
  call_to_action_options: string[];
  headline_templates: string[];
}

export interface PlatformStrategy {
  platform: Platform;
  objective: string;
  content_pillars: string[];
  posting_frequency: string;
  optimal_formats: string[];
  hook_strategy: string;
  engagement_tactics: string[];
  hashtag_strategy: string[];
}

export interface CreativeDirection {
  visual_style: string;
  color_strategy: string;
  typography_notes: string;
  imagery_guidelines: string[];
  mood_board_keywords: string[];
  do_list: string[];
  dont_list: string[];
}

export interface KPITargets {
  awareness_metrics: { metric: string; target: number }[];
  engagement_metrics: { metric: string; target: number }[];
  conversion_metrics: { metric: string; target: number }[];
}

// ============================================================================
// 4. 고도화된 컨셉 (Enhanced Concept)
// ============================================================================

export interface EnhancedConcept {
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

  // 고도화 필드
  platform_adaptations: PlatformAdaptation[];
  psychological_hooks: string[];
  storytelling_angle: string;
  differentiation_point: string;
}

export interface PlatformAdaptation {
  platform: Platform;
  adapted_hook: string;
  adapted_copy_style: string;
  visual_adjustments: string[];
  recommended_format: string;
  hashtag_recommendations: string[];
}

// ============================================================================
// 5. 품질 검증 (Quality Validation)
// ============================================================================

export interface QualityScore {
  overall_score: number;
  brand_consistency: number;
  platform_fit: number;
  message_clarity: number;
  visual_appeal: number;
  cta_effectiveness: number;
  recommendations: QualityRecommendation[];
}

export interface QualityRecommendation {
  area: string;
  issue: string;
  suggestion: string;
  priority: 'high' | 'medium' | 'low';
}
