# Plan: AI 서비스 고도화 (ai-service-advanced)

> 작성일: 2026-02-05
> 상태: Draft
> Feature ID: ai-service-advanced
> 관련: ad-creative-generator.design.md 섹션 4 개선

---

## 1. 개요 (Overview)

### 1.1 배경
현재 AI 서비스 연동 설계는 기본적인 분석과 생성 기능만 포함하고 있어:
- 매체(플랫폼)별 특성이 충분히 반영되지 않음
- 분석 깊이가 얕음 (단순 페르소나 + 트렌드)
- 프롬프트 엔지니어링이 미흡
- 컨텍스트 연결이 부족

### 1.2 목표
- **심층 분석 시스템**: 경쟁사 분석, 시장 트렌드, 심리 분석 포함
- **매체별 최적화 엔진**: 6개 플랫폼 각각의 알고리즘/특성 반영
- **다단계 프롬프트 체인**: 분석 → 전략 → 컨셉 → 크리에이티브 연결
- **A/B 테스트 지원**: 변형 생성 및 성과 예측

---

## 2. 핵심 기능 (Core Features)

### 2.1 심층 분석 시스템 (Deep Analysis System)

#### 2.1.1 시장 분석 (Market Analysis)
```
입력: 브랜드명, 제품 설명, 타겟, 플랫폼
        ↓
┌─────────────────────────────────────────────────────┐
│ 1. 산업 분석 (Industry Analysis)                    │
│    - 시장 규모 및 트렌드                             │
│    - 경쟁 강도 분석                                  │
│    - 진입 장벽 및 기회                               │
├─────────────────────────────────────────────────────┤
│ 2. 경쟁사 분석 (Competitor Analysis)                │
│    - 주요 경쟁사 식별                                │
│    - 경쟁사 포지셔닝 맵                              │
│    - 차별화 기회 도출                                │
├─────────────────────────────────────────────────────┤
│ 3. 소비자 심층 분석 (Consumer Deep Dive)            │
│    - 페르소나 다각화 (Primary/Secondary/Anti)       │
│    - 구매 여정 분석 (AIDA + Touchpoints)           │
│    - 심리적 트리거 및 장벽                          │
├─────────────────────────────────────────────────────┤
│ 4. 트렌드 & 인사이트 (Trends & Insights)            │
│    - 소셜 버즈 분석                                  │
│    - 시즌별/이벤트별 기회                            │
│    - 문화적 컨텍스트                                 │
└─────────────────────────────────────────────────────┘
        ↓
출력: 종합 분석 리포트
```

#### 2.1.2 분석 데이터 모델 확장
```typescript
interface DeepAnalysis {
  // 기존
  target_persona: TargetPersona;
  platform_guidelines: PlatformGuideline[];
  trend_insights: TrendInsight[];

  // 신규 추가
  industry_analysis: IndustryAnalysis;
  competitor_analysis: CompetitorAnalysis;
  consumer_journey: ConsumerJourney;
  psychological_triggers: PsychologicalTrigger[];
  cultural_context: CulturalContext;
  seasonal_opportunities: SeasonalOpportunity[];
}

interface IndustryAnalysis {
  market_size: string;
  growth_rate: string;
  key_trends: string[];
  competitive_intensity: 'low' | 'medium' | 'high';
  entry_barriers: string[];
  opportunities: string[];
}

interface CompetitorAnalysis {
  direct_competitors: Competitor[];
  indirect_competitors: Competitor[];
  positioning_map: PositioningMap;
  differentiation_opportunities: string[];
  competitive_advantages: string[];
}

interface Competitor {
  name: string;
  positioning: string;
  strengths: string[];
  weaknesses: string[];
  messaging_style: string;
  target_overlap: number; // 0-1
}

interface PositioningMap {
  x_axis: { label: string; scale: [string, string] };
  y_axis: { label: string; scale: [string, string] };
  brand_position: { x: number; y: number };
  competitors: { name: string; x: number; y: number }[];
  opportunity_zones: { x: number; y: number; description: string }[];
}

interface ConsumerJourney {
  awareness: JourneyStage;
  interest: JourneyStage;
  desire: JourneyStage;
  action: JourneyStage;
  advocacy: JourneyStage;
}

interface JourneyStage {
  touchpoints: string[];
  emotions: string[];
  pain_points: string[];
  opportunities: string[];
  content_types: string[];
}

interface PsychologicalTrigger {
  trigger_type: 'fear' | 'aspiration' | 'belonging' | 'achievement' | 'curiosity' | 'urgency';
  description: string;
  application: string;
  intensity: number; // 0-1
}

interface CulturalContext {
  current_zeitgeist: string[];
  relevant_movements: string[];
  taboos: string[];
  cultural_codes: string[];
  localization_notes: string;
}

interface SeasonalOpportunity {
  period: string;
  event: string;
  relevance: number;
  messaging_angle: string;
  visual_theme: string;
}
```

### 2.2 매체별 최적화 엔진 (Platform Optimization Engine)

#### 2.2.1 플랫폼 심층 프로필

```typescript
interface PlatformDeepProfile {
  platform: Platform;

  // 알고리즘 특성
  algorithm: {
    primary_signals: string[];
    engagement_factors: EngagementFactor[];
    optimal_posting_times: PostingTime[];
    content_decay_rate: string;
    viral_mechanics: string[];
  };

  // 사용자 행동
  user_behavior: {
    average_session_duration: string;
    scroll_speed: string;
    attention_span: string;
    interaction_patterns: string[];
    content_consumption_mode: 'passive' | 'active' | 'mixed';
  };

  // 콘텐츠 특성
  content_specs: {
    optimal_length: ContentLength;
    visual_requirements: VisualRequirements;
    copy_guidelines: CopyGuidelines;
    hook_requirements: HookRequirements;
    cta_placement: CTAPlacement;
  };

  // 광고 특성
  ad_characteristics: {
    ad_fatigue_threshold: string;
    frequency_cap_recommendation: number;
    creative_refresh_cycle: string;
    native_vs_polished: number; // 0=native, 1=polished
  };

  // 성과 벤치마크
  benchmarks: {
    average_engagement_rate: number;
    average_ctr: number;
    average_cpm_range: [number, number];
    top_performer_threshold: number;
  };
}

interface EngagementFactor {
  factor: string;
  weight: number;
  optimization_tip: string;
}

interface ContentLength {
  video_seconds: { min: number; optimal: number; max: number };
  caption_characters: { min: number; optimal: number; max: number };
  hashtags: { min: number; optimal: number; max: number };
}

interface VisualRequirements {
  aspect_ratio: string[];
  resolution: string;
  safe_zones: { top: number; bottom: number; left: number; right: number };
  text_overlay_limit: number; // percentage
  motion_requirements: string;
  color_preferences: string[];
  thumbnail_importance: number;
}

interface CopyGuidelines {
  tone: string[];
  first_line_hook: boolean;
  emoji_usage: 'heavy' | 'moderate' | 'minimal' | 'none';
  hashtag_strategy: string;
  mention_strategy: string;
  cta_style: string;
  line_breaks: string;
}

interface HookRequirements {
  hook_window_seconds: number;
  hook_types: string[];
  pattern_interrupt_techniques: string[];
  curiosity_gap_examples: string[];
}

interface CTAPlacement {
  primary_position: string;
  secondary_positions: string[];
  button_vs_text: string;
  urgency_level: 'low' | 'medium' | 'high';
}
```

#### 2.2.2 플랫폼별 심층 프로필 데이터

```typescript
const PLATFORM_DEEP_PROFILES: Record<Platform, PlatformDeepProfile> = {
  instagram_feed: {
    platform: 'instagram_feed',
    algorithm: {
      primary_signals: [
        '저장(Save) - 가장 강력한 신호',
        '공유(Share) - 두 번째 중요',
        '댓글 길이 및 품질',
        '게시 후 초기 30분 반응',
        '팔로워의 콘텐츠 소비 패턴'
      ],
      engagement_factors: [
        { factor: 'Save Rate', weight: 0.35, optimization_tip: '저장하고 싶은 가치 있는 정보 포함' },
        { factor: 'Share Rate', weight: 0.25, optimization_tip: '공유할 만한 감정적 연결 또는 유용성' },
        { factor: 'Comment Quality', weight: 0.20, optimization_tip: '질문이나 의견 유도' },
        { factor: 'Like Rate', weight: 0.10, optimization_tip: '시각적 즉각 반응' },
        { factor: 'Dwell Time', weight: 0.10, optimization_tip: '카피를 읽게 만드는 후킹' }
      ],
      optimal_posting_times: [
        { day: 'weekday', times: ['07:00-09:00', '12:00-14:00', '19:00-21:00'] },
        { day: 'weekend', times: ['10:00-12:00', '19:00-22:00'] }
      ],
      content_decay_rate: '24-48시간 후 도달 급감',
      viral_mechanics: ['Explore 페이지 노출', '해시태그 상위 노출', 'DM 공유']
    },
    user_behavior: {
      average_session_duration: '28분',
      scroll_speed: '중간 (1.5초/콘텐츠)',
      attention_span: '첫 이미지 2초, 캡션 5초',
      interaction_patterns: ['스크롤 → 멈춤 → 좋아요/저장 → 캡션 읽기 → 댓글'],
      content_consumption_mode: 'mixed'
    },
    content_specs: {
      optimal_length: {
        video_seconds: { min: 15, optimal: 30, max: 60 },
        caption_characters: { min: 100, optimal: 200, max: 2200 },
        hashtags: { min: 3, optimal: 8, max: 15 }
      },
      visual_requirements: {
        aspect_ratio: ['1:1', '4:5'],
        resolution: '1080x1080 또는 1080x1350',
        safe_zones: { top: 10, bottom: 15, left: 5, right: 5 },
        text_overlay_limit: 20,
        motion_requirements: '정적 이미지 선호, 미세한 모션 가능',
        color_preferences: ['밝고 채도 높은 색상', '일관된 피드 미학'],
        thumbnail_importance: 0.9
      },
      copy_guidelines: {
        tone: ['친근함', '영감', '가치 제공'],
        first_line_hook: true,
        emoji_usage: 'moderate',
        hashtag_strategy: '브랜드+카테고리+트렌딩 조합',
        mention_strategy: '관련 계정 태그로 도달 확장',
        cta_style: '부드러운 행동 유도 (댓글, 저장)',
        line_breaks: '가독성을 위한 단락 분리'
      },
      hook_requirements: {
        hook_window_seconds: 2,
        hook_types: ['시각적 충격', '질문형', '숫자/통계'],
        pattern_interrupt_techniques: ['대비 색상', '예상치 못한 이미지', '텍스트 오버레이'],
        curiosity_gap_examples: ['이것을 알기 전까진...', '90%가 모르는...']
      },
      cta_placement: {
        primary_position: '캡션 마지막 문장',
        secondary_positions: ['첫 번째 댓글', '스토리 하이라이트'],
        button_vs_text: '텍스트 CTA (버튼 없음)',
        urgency_level: 'low'
      }
    },
    ad_characteristics: {
      ad_fatigue_threshold: '4-7회 노출',
      frequency_cap_recommendation: 2,
      creative_refresh_cycle: '2-3주',
      native_vs_polished: 0.4
    },
    benchmarks: {
      average_engagement_rate: 0.047,
      average_ctr: 0.009,
      average_cpm_range: [5, 15],
      top_performer_threshold: 0.08
    }
  },

  instagram_story: {
    platform: 'instagram_story',
    algorithm: {
      primary_signals: [
        '완료율 (Full Watch Rate)',
        '답장 (Reply)',
        '스티커 상호작용',
        '화면 탭 (다음으로 넘기지 않음)',
        '프로필 방문'
      ],
      engagement_factors: [
        { factor: 'Completion Rate', weight: 0.40, optimization_tip: '15초 내 핵심 전달' },
        { factor: 'Reply Rate', weight: 0.25, optimization_tip: '질문 스티커, 투표 활용' },
        { factor: 'Sticker Interaction', weight: 0.20, optimization_tip: '인터랙티브 요소 필수' },
        { factor: 'Tap Forward Rate', weight: 0.15, optimization_tip: '낮을수록 좋음 (≤30%)' }
      ],
      optimal_posting_times: [
        { day: 'weekday', times: ['08:00-10:00', '20:00-22:00'] },
        { day: 'weekend', times: ['11:00-13:00', '20:00-23:00'] }
      ],
      content_decay_rate: '24시간 자동 삭제',
      viral_mechanics: ['DM 공유', '멘션 리포스트', '하이라이트 저장']
    },
    user_behavior: {
      average_session_duration: '3분 (스토리만)',
      scroll_speed: '빠름 (0.8초/스토리)',
      attention_span: '첫 1-2초 결정적',
      interaction_patterns: ['탭 → 홀드(관심) → 답장/스티커 → 다음'],
      content_consumption_mode: 'passive'
    },
    content_specs: {
      optimal_length: {
        video_seconds: { min: 5, optimal: 10, max: 15 },
        caption_characters: { min: 0, optimal: 50, max: 100 },
        hashtags: { min: 0, optimal: 1, max: 3 }
      },
      visual_requirements: {
        aspect_ratio: ['9:16'],
        resolution: '1080x1920',
        safe_zones: { top: 15, bottom: 20, left: 5, right: 5 },
        text_overlay_limit: 30,
        motion_requirements: '모션 필수, 정적 이미지 비권장',
        color_preferences: ['밝고 대비 높은 색상', '다크모드 고려'],
        thumbnail_importance: 0
      },
      copy_guidelines: {
        tone: ['즉각적', '친밀한', '캐주얼'],
        first_line_hook: true,
        emoji_usage: 'heavy',
        hashtag_strategy: '최소화 또는 숨김',
        mention_strategy: '협업 시 태그',
        cta_style: '스와이프업 또는 DM 유도',
        line_breaks: '최소화 (화면 공간 제한)'
      },
      hook_requirements: {
        hook_window_seconds: 1,
        hook_types: ['움직임', '텍스트 애니메이션', '직접 말걸기'],
        pattern_interrupt_techniques: ['급격한 줌', '깜빡임', '소리'],
        curiosity_gap_examples: ['끝까지 보면...', '스와이프해서 확인']
      },
      cta_placement: {
        primary_position: '화면 하단 1/3',
        secondary_positions: ['스티커 위치'],
        button_vs_text: '스와이프업 버튼 또는 DM 유도',
        urgency_level: 'high'
      }
    },
    ad_characteristics: {
      ad_fatigue_threshold: '3-5회 노출',
      frequency_cap_recommendation: 1,
      creative_refresh_cycle: '1-2주',
      native_vs_polished: 0.2
    },
    benchmarks: {
      average_engagement_rate: 0.05,
      average_ctr: 0.015,
      average_cpm_range: [4, 12],
      top_performer_threshold: 0.1
    }
  },

  tiktok: {
    platform: 'tiktok',
    algorithm: {
      primary_signals: [
        '완료율 (가장 중요)',
        '반복 시청',
        '공유',
        '댓글',
        '영상 시청 시간'
      ],
      engagement_factors: [
        { factor: 'Completion Rate', weight: 0.35, optimization_tip: '루프 가능한 구조, 예상치 못한 결말' },
        { factor: 'Rewatch Rate', weight: 0.25, optimization_tip: '놓칠 수 있는 디테일 숨기기' },
        { factor: 'Share Rate', weight: 0.20, optimization_tip: '밈화 가능성, 공감 포인트' },
        { factor: 'Comment Rate', weight: 0.15, optimization_tip: '논쟁 유도, 의견 요청' },
        { factor: 'Like Rate', weight: 0.05, optimization_tip: '부차적 지표' }
      ],
      optimal_posting_times: [
        { day: 'weekday', times: ['07:00-08:00', '12:00-13:00', '19:00-22:00'] },
        { day: 'weekend', times: ['10:00-12:00', '14:00-16:00', '19:00-23:00'] }
      ],
      content_decay_rate: '48시간 초기 부스트, 이후 롱테일 가능',
      viral_mechanics: ['For You Page', '사운드 바이럴', '듀엣/스티치', '해시태그 챌린지']
    },
    user_behavior: {
      average_session_duration: '52분',
      scroll_speed: '매우 빠름 (0.5초/영상 판단)',
      attention_span: '첫 0.5-1초 결정적',
      interaction_patterns: ['시청 → 완료/스킵 → 좋아요 → 댓글/공유'],
      content_consumption_mode: 'passive'
    },
    content_specs: {
      optimal_length: {
        video_seconds: { min: 7, optimal: 21, max: 60 },
        caption_characters: { min: 30, optimal: 100, max: 300 },
        hashtags: { min: 2, optimal: 4, max: 6 }
      },
      visual_requirements: {
        aspect_ratio: ['9:16'],
        resolution: '1080x1920',
        safe_zones: { top: 10, bottom: 25, left: 5, right: 15 },
        text_overlay_limit: 40,
        motion_requirements: '모션 필수, 빠른 컷 선호',
        color_preferences: ['하이 콘트라스트', '트렌딩 컬러 팔레트'],
        thumbnail_importance: 0.3
      },
      copy_guidelines: {
        tone: ['유머러스', '자기비하적', '트렌디', '밈 활용'],
        first_line_hook: true,
        emoji_usage: 'moderate',
        hashtag_strategy: '트렌딩+니치 조합',
        mention_strategy: '크리에이터 콜라보',
        cta_style: '자연스러운 내러티브 내 삽입',
        line_breaks: '최소화'
      },
      hook_requirements: {
        hook_window_seconds: 0.5,
        hook_types: ['움직임 시작', '질문', '충격적 장면', '트렌딩 사운드'],
        pattern_interrupt_techniques: ['빠른 줌', '컷 변화', '텍스트 팝업', '사운드 싱크'],
        curiosity_gap_examples: ['끝까지 보세요', 'POV:', '이거 실화임?']
      },
      cta_placement: {
        primary_position: '영상 마지막 3초',
        secondary_positions: ['댓글 고정', '프로필 링크'],
        button_vs_text: '보이스오버 또는 텍스트',
        urgency_level: 'medium'
      }
    },
    ad_characteristics: {
      ad_fatigue_threshold: '2-4회 노출',
      frequency_cap_recommendation: 1,
      creative_refresh_cycle: '1주',
      native_vs_polished: 0.1
    },
    benchmarks: {
      average_engagement_rate: 0.058,
      average_ctr: 0.012,
      average_cpm_range: [3, 10],
      top_performer_threshold: 0.12
    }
  },

  threads: {
    platform: 'threads',
    algorithm: {
      primary_signals: [
        '리포스트 (가장 강력)',
        '답글 품질 및 양',
        '인용 게시',
        '좋아요',
        '팔로워 상호작용'
      ],
      engagement_factors: [
        { factor: 'Repost Rate', weight: 0.35, optimization_tip: '공유할 만한 인사이트/의견' },
        { factor: 'Reply Quality', weight: 0.30, optimization_tip: '대화 유도, 논쟁적 주제' },
        { factor: 'Quote Rate', weight: 0.20, optimization_tip: '의견 추가할 여지 남기기' },
        { factor: 'Like Rate', weight: 0.15, optimization_tip: '공감 포인트' }
      ],
      optimal_posting_times: [
        { day: 'weekday', times: ['08:00-10:00', '18:00-20:00'] },
        { day: 'weekend', times: ['10:00-12:00', '20:00-22:00'] }
      ],
      content_decay_rate: '12-24시간',
      viral_mechanics: ['피드 추천', '리포스트 체인', '트렌딩 토픽']
    },
    user_behavior: {
      average_session_duration: '15분',
      scroll_speed: '빠름',
      attention_span: '첫 문장 결정적',
      interaction_patterns: ['스크롤 → 읽기 → 좋아요/답글 → 리포스트'],
      content_consumption_mode: 'active'
    },
    content_specs: {
      optimal_length: {
        video_seconds: { min: 0, optimal: 0, max: 5 },
        caption_characters: { min: 50, optimal: 200, max: 500 },
        hashtags: { min: 0, optimal: 0, max: 2 }
      },
      visual_requirements: {
        aspect_ratio: ['1:1', '4:5'],
        resolution: '1080x1080',
        safe_zones: { top: 0, bottom: 0, left: 0, right: 0 },
        text_overlay_limit: 0,
        motion_requirements: '정적 이미지 선호',
        color_preferences: ['심플', '미니멀'],
        thumbnail_importance: 0.3
      },
      copy_guidelines: {
        tone: ['위트', '직설적', '대화체', '전문성'],
        first_line_hook: true,
        emoji_usage: 'minimal',
        hashtag_strategy: '거의 사용하지 않음',
        mention_strategy: '대화 시작 또는 인용',
        cta_style: '질문형 또는 의견 요청',
        line_breaks: '가독성 위해 짧은 문단'
      },
      hook_requirements: {
        hook_window_seconds: 2,
        hook_types: ['강렬한 의견', '질문', '통계', '역설'],
        pattern_interrupt_techniques: ['대담한 주장', '논쟁적 시작'],
        curiosity_gap_examples: ['unpopular opinion:', '여기 문제가 있어요']
      },
      cta_placement: {
        primary_position: '마지막 문장',
        secondary_positions: ['첫 답글'],
        button_vs_text: '텍스트 질문',
        urgency_level: 'low'
      }
    },
    ad_characteristics: {
      ad_fatigue_threshold: '5-7회 노출',
      frequency_cap_recommendation: 2,
      creative_refresh_cycle: '3-4주',
      native_vs_polished: 0.1
    },
    benchmarks: {
      average_engagement_rate: 0.032,
      average_ctr: 0.006,
      average_cpm_range: [6, 18],
      top_performer_threshold: 0.06
    }
  },

  youtube_shorts: {
    platform: 'youtube_shorts',
    algorithm: {
      primary_signals: [
        '시청 시간 (Watch Time)',
        '완료율',
        '반복 시청',
        '구독 전환',
        '댓글'
      ],
      engagement_factors: [
        { factor: 'Watch Time', weight: 0.35, optimization_tip: '마지막까지 시청하게 만들기' },
        { factor: 'Completion Rate', weight: 0.25, optimization_tip: '루프 구조' },
        { factor: 'Subscribe Rate', weight: 0.20, optimization_tip: '채널 가치 제안' },
        { factor: 'Comment Rate', weight: 0.10, optimization_tip: '의견 요청' },
        { factor: 'Like Rate', weight: 0.10, optimization_tip: '즉각적 반응' }
      ],
      optimal_posting_times: [
        { day: 'weekday', times: ['12:00-14:00', '18:00-21:00'] },
        { day: 'weekend', times: ['10:00-12:00', '16:00-20:00'] }
      ],
      content_decay_rate: '롱테일 가능 (검색 기반)',
      viral_mechanics: ['Shorts 피드', '구독자 알림', 'YouTube 검색', '추천 영상']
    },
    user_behavior: {
      average_session_duration: '26분',
      scroll_speed: '빠름',
      attention_span: '첫 2초',
      interaction_patterns: ['시청 → 좋아요 → 구독 → 댓글'],
      content_consumption_mode: 'passive'
    },
    content_specs: {
      optimal_length: {
        video_seconds: { min: 15, optimal: 30, max: 60 },
        caption_characters: { min: 50, optimal: 100, max: 200 },
        hashtags: { min: 2, optimal: 3, max: 5 }
      },
      visual_requirements: {
        aspect_ratio: ['9:16'],
        resolution: '1080x1920',
        safe_zones: { top: 10, bottom: 20, left: 5, right: 5 },
        text_overlay_limit: 30,
        motion_requirements: '모션 필수',
        color_preferences: ['밝은 색상', '하이 콘트라스트'],
        thumbnail_importance: 0.5
      },
      copy_guidelines: {
        tone: ['교육적', '엔터테인먼트', '직접적'],
        first_line_hook: true,
        emoji_usage: 'moderate',
        hashtag_strategy: '#Shorts 필수 + 관련 키워드',
        mention_strategy: '콜라보 크리에이터',
        cta_style: '구독 유도',
        line_breaks: '최소화'
      },
      hook_requirements: {
        hook_window_seconds: 2,
        hook_types: ['질문', '예고', '시각적 훅', '결과 미리보기'],
        pattern_interrupt_techniques: ['빠른 편집', '텍스트 팝업', 'B-roll'],
        curiosity_gap_examples: ['How to...', '이렇게 하면...', '결과 충격']
      },
      cta_placement: {
        primary_position: '영상 마지막 5초',
        secondary_positions: ['고정 댓글'],
        button_vs_text: '보이스오버 + 텍스트',
        urgency_level: 'medium'
      }
    },
    ad_characteristics: {
      ad_fatigue_threshold: '3-5회 노출',
      frequency_cap_recommendation: 2,
      creative_refresh_cycle: '2-3주',
      native_vs_polished: 0.3
    },
    benchmarks: {
      average_engagement_rate: 0.04,
      average_ctr: 0.01,
      average_cpm_range: [4, 12],
      top_performer_threshold: 0.08
    }
  },

  youtube_ads: {
    platform: 'youtube_ads',
    algorithm: {
      primary_signals: [
        'View Rate (30초 이상)',
        'Click-Through Rate',
        '전환율',
        '스킵률 (5초 후)',
        '브랜드 리프트'
      ],
      engagement_factors: [
        { factor: 'View Rate', weight: 0.30, optimization_tip: '5초 내 강력한 훅' },
        { factor: 'CTR', weight: 0.30, optimization_tip: '명확한 CTA' },
        { factor: 'Conversion Rate', weight: 0.25, optimization_tip: '랜딩 페이지 일관성' },
        { factor: 'Skip Rate', weight: 0.15, optimization_tip: '5초 이내 가치 전달 (낮을수록 좋음)' }
      ],
      optimal_posting_times: [
        { day: 'all', times: ['24시간 운영, 시간대별 비딩 조정'] }
      ],
      content_decay_rate: '광고 비용 기반',
      viral_mechanics: ['YouTube 검색', '추천 영상', '디스플레이 네트워크']
    },
    user_behavior: {
      average_session_duration: '40분 (YouTube 전체)',
      scroll_speed: 'N/A (강제 노출)',
      attention_span: '5초 (스킵 전)',
      interaction_patterns: ['시청 → 스킵 or 계속 → CTA 클릭 → 전환'],
      content_consumption_mode: 'passive'
    },
    content_specs: {
      optimal_length: {
        video_seconds: { min: 6, optimal: 15, max: 30 },
        caption_characters: { min: 0, optimal: 0, max: 0 },
        hashtags: { min: 0, optimal: 0, max: 0 }
      },
      visual_requirements: {
        aspect_ratio: ['16:9', '1:1'],
        resolution: '1920x1080 또는 1080x1080',
        safe_zones: { top: 10, bottom: 15, left: 10, right: 10 },
        text_overlay_limit: 50,
        motion_requirements: '프로페셔널 품질',
        color_preferences: ['브랜드 컬러 일관성'],
        thumbnail_importance: 0.8
      },
      copy_guidelines: {
        tone: ['전문적', '신뢰감', '행동 유도'],
        first_line_hook: true,
        emoji_usage: 'none',
        hashtag_strategy: 'N/A',
        mention_strategy: 'N/A',
        cta_style: '명확한 버튼 + 음성 안내',
        line_breaks: 'N/A'
      },
      hook_requirements: {
        hook_window_seconds: 5,
        hook_types: ['문제 제시', '충격적 통계', '감정적 장면', '질문'],
        pattern_interrupt_techniques: ['빠른 시작', '음악/효과음', '대비'],
        curiosity_gap_examples: ['지금 안 보면 후회할...', '이게 진짜 가능해?']
      },
      cta_placement: {
        primary_position: '영상 마지막 + 항상 표시 버튼',
        secondary_positions: ['중간 삽입 CTA'],
        button_vs_text: '버튼 필수',
        urgency_level: 'high'
      }
    },
    ad_characteristics: {
      ad_fatigue_threshold: '7-10회 노출',
      frequency_cap_recommendation: 3,
      creative_refresh_cycle: '4-6주',
      native_vs_polished: 0.8
    },
    benchmarks: {
      average_engagement_rate: 0.02,
      average_ctr: 0.014,
      average_cpm_range: [10, 30],
      top_performer_threshold: 0.03
    }
  }
};
```

### 2.3 다단계 프롬프트 체인 (Multi-Stage Prompt Chain)

#### 2.3.1 분석 → 전략 → 컨셉 → 크리에이티브 파이프라인

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Stage 1: 심층 분석 (Deep Analysis)                                          │
│ ─────────────────────────────────────────────────────────────────────────── │
│ Input: 브랜드 정보, 제품 정보, 타겟, 플랫폼                                 │
│ Process: 산업/경쟁/소비자/트렌드 분석                                       │
│ Output: DeepAnalysis 객체                                                   │
│ Model: Claude Opus (복잡한 추론)                                            │
│ Tokens: ~4000                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ Stage 2: 전략 수립 (Strategy Formulation)                                   │
│ ─────────────────────────────────────────────────────────────────────────── │
│ Input: DeepAnalysis + Platform Deep Profiles                                │
│ Process: 포지셔닝, 메시징 프레임워크, 플랫폼별 전략 수립                    │
│ Output: CreativeStrategy 객체                                               │
│ Model: Claude Sonnet                                                        │
│ Tokens: ~3000                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ Stage 3: 컨셉 개발 (Concept Development)                                    │
│ ─────────────────────────────────────────────────────────────────────────── │
│ Input: CreativeStrategy + 플랫폼별 특성                                     │
│ Process: 3개 컨셉 생성 (각각 다른 접근)                                     │
│ Output: Concept[] with Platform-specific adaptations                        │
│ Model: Claude Sonnet                                                        │
│ Tokens: ~2500                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ Stage 4: 크리에이티브 생성 (Creative Generation)                            │
│ ─────────────────────────────────────────────────────────────────────────── │
│                                                                             │
│  ┌─────────────────────────────┐    ┌─────────────────────────────┐        │
│  │ 4a. 이미지 프롬프트 최적화  │    │ 4b. 카피 생성              │        │
│  │ ─────────────────────────── │    │ ─────────────────────────── │        │
│  │ Input: Concept + Platform   │    │ Input: Concept + Platform   │        │
│  │ Process: 플랫폼 최적화      │    │ Process: 플랫폼별 카피      │        │
│  │ Output: Optimized Prompt    │    │ Output: Platform-specific   │        │
│  │ Model: Claude Haiku         │    │         Copy                │        │
│  └──────────────┬──────────────┘    │ Model: Claude Sonnet        │        │
│                 │                   └─────────────────────────────┘        │
│                 ▼                                                          │
│  ┌─────────────────────────────┐                                           │
│  │ 4c. 이미지 생성             │                                           │
│  │ ─────────────────────────── │                                           │
│  │ Input: Optimized Prompt     │                                           │
│  │ Process: AI 이미지 생성     │                                           │
│  │ Output: Generated Images    │                                           │
│  │ Model: Nano Banana Pro      │                                           │
│  └─────────────────────────────┘                                           │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ Stage 5: 품질 검증 (Quality Validation)                                     │
│ ─────────────────────────────────────────────────────────────────────────── │
│ Input: Generated Creatives                                                  │
│ Process: 브랜드 일관성, 플랫폼 적합성, 메시지 명확성 검증                   │
│ Output: QualityScore + Recommendations                                      │
│ Model: Claude Haiku                                                         │
│ Tokens: ~1000                                                               │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### 2.3.2 전략 데이터 모델

```typescript
interface CreativeStrategy {
  positioning: BrandPositioning;
  messaging_framework: MessagingFramework;
  platform_strategies: PlatformStrategy[];
  creative_direction: CreativeDirection;
  kpi_targets: KPITargets;
}

interface BrandPositioning {
  unique_value_proposition: string;
  competitive_advantage: string;
  emotional_benefit: string;
  functional_benefit: string;
  brand_personality: string[];
  tone_of_voice: string;
}

interface MessagingFramework {
  primary_message: string;
  supporting_messages: string[];
  proof_points: string[];
  call_to_action_options: string[];
  headline_templates: string[];
}

interface PlatformStrategy {
  platform: Platform;
  objective: string;
  content_pillars: string[];
  posting_frequency: string;
  optimal_formats: string[];
  hook_strategy: string;
  engagement_tactics: string[];
  hashtag_strategy: string[];
}

interface CreativeDirection {
  visual_style: string;
  color_strategy: string;
  typography_notes: string;
  imagery_guidelines: string[];
  mood_board_keywords: string[];
  do_list: string[];
  dont_list: string[];
}

interface KPITargets {
  awareness_metrics: { metric: string; target: number }[];
  engagement_metrics: { metric: string; target: number }[];
  conversion_metrics: { metric: string; target: number }[];
}
```

### 2.4 A/B 테스트 지원 (A/B Testing Support)

```typescript
interface ABTestConfig {
  test_id: string;
  creative_variants: CreativeVariant[];
  test_parameters: TestParameters;
  performance_predictions: PerformancePrediction[];
}

interface CreativeVariant {
  variant_id: string;
  variant_name: string;
  changes: {
    hook_style?: string;
    color_palette?: string[];
    copy_tone?: string;
    cta_style?: string;
    visual_style?: string;
  };
  creative: Creative;
}

interface TestParameters {
  split_ratio: number[];
  minimum_sample_size: number;
  test_duration_days: number;
  primary_metric: string;
  secondary_metrics: string[];
  confidence_level: number;
}

interface PerformancePrediction {
  variant_id: string;
  predicted_metrics: {
    engagement_rate: { low: number; mid: number; high: number };
    ctr: { low: number; mid: number; high: number };
    conversion_rate: { low: number; mid: number; high: number };
  };
  confidence_score: number;
  reasoning: string;
}
```

---

## 3. 구현 범위 (Scope)

### 3.1 Phase 1 (필수)
- [ ] 심층 분석 시스템 데이터 모델 확장
- [ ] 매체별 Deep Profile 데이터 구현
- [ ] 분석 프롬프트 고도화
- [ ] 플랫폼별 최적화 프롬프트

### 3.2 Phase 2 (권장)
- [ ] 다단계 프롬프트 체인 구현
- [ ] 전략 수립 단계 추가
- [ ] 품질 검증 단계 추가

### 3.3 Phase 3 (선택)
- [ ] A/B 테스트 지원
- [ ] 성과 예측 기능
- [ ] 경쟁사 분석 자동화

---

## 4. 예상 일정

| Phase | 기간 | 주요 작업 |
|-------|------|----------|
| Phase 1 | 2-3일 | 데이터 모델, 프롬프트 고도화 |
| Phase 2 | 3-4일 | 프롬프트 체인, 전략 단계 |
| Phase 3 | 2-3일 | A/B 테스트, 성과 예측 |

---

## 5. 참고 자료

- 현재 설계: `docs/02-design/features/ad-creative-generator.design.md`
- 플랫폼 공식 문서
  - [Instagram Creator Best Practices](https://creators.instagram.com)
  - [TikTok Creator Portal](https://www.tiktok.com/creators)
  - [YouTube Creator Academy](https://creatoracademy.youtube.com)
  - [Meta Business Help Center](https://www.facebook.com/business/help)

---

**작성자**: Claude AI
**작성일**: 2026-02-05
**상태**: Plan Draft
