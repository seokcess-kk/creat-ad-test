/**
 * 플랫폼별 심층 프로필 데이터
 * @description 6개 플랫폼의 알고리즘, 사용자 행동, 콘텐츠 스펙, 벤치마크 데이터
 */

import type { Platform } from '@/types/database';
import type { PlatformDeepProfile } from '@/types/ai-advanced';

export const PLATFORM_DEEP_PROFILES: Record<Platform, PlatformDeepProfile> = {
  instagram_feed: {
    platform: 'instagram_feed',
    algorithm: {
      primary_signals: [
        '저장(Save) - 가장 강력한 신호',
        '공유(Share) - 두 번째 중요',
        '댓글 길이 및 품질',
        '게시 후 초기 30분 반응',
        '팔로워의 콘텐츠 소비 패턴',
      ],
      engagement_factors: [
        { factor: 'Save Rate', weight: 0.35, optimization_tip: '저장하고 싶은 가치 있는 정보 포함' },
        { factor: 'Share Rate', weight: 0.25, optimization_tip: '공유할 만한 감정적 연결 또는 유용성' },
        { factor: 'Comment Quality', weight: 0.2, optimization_tip: '질문이나 의견 유도' },
        { factor: 'Like Rate', weight: 0.1, optimization_tip: '시각적 즉각 반응' },
        { factor: 'Dwell Time', weight: 0.1, optimization_tip: '카피를 읽게 만드는 후킹' },
      ],
      optimal_posting_times: [
        { day: 'weekday', times: ['07:00-09:00', '12:00-14:00', '19:00-21:00'] },
        { day: 'weekend', times: ['10:00-12:00', '19:00-22:00'] },
      ],
      content_decay_rate: '24-48시간 후 도달 급감',
      viral_mechanics: ['Explore 페이지 노출', '해시태그 상위 노출', 'DM 공유'],
    },
    user_behavior: {
      average_session_duration: '28분',
      scroll_speed: '중간 (1.5초/콘텐츠)',
      attention_span: '첫 이미지 2초, 캡션 5초',
      interaction_patterns: ['스크롤 → 멈춤 → 좋아요/저장 → 캡션 읽기 → 댓글'],
      content_consumption_mode: 'mixed',
    },
    content_specs: {
      optimal_length: {
        video_seconds: { min: 15, optimal: 30, max: 60 },
        caption_characters: { min: 100, optimal: 200, max: 2200 },
        hashtags: { min: 3, optimal: 8, max: 15 },
      },
      visual_requirements: {
        aspect_ratio: ['1:1', '4:5'],
        resolution: '1080x1080 또는 1080x1350',
        safe_zones: { top: 10, bottom: 15, left: 5, right: 5 },
        text_overlay_limit: 20,
        motion_requirements: '정적 이미지 선호, 미세한 모션 가능',
        color_preferences: ['밝고 채도 높은 색상', '일관된 피드 미학'],
        thumbnail_importance: 0.9,
      },
      copy_guidelines: {
        tone: ['친근함', '영감', '가치 제공'],
        first_line_hook: true,
        emoji_usage: 'moderate',
        hashtag_strategy: '브랜드+카테고리+트렌딩 조합',
        mention_strategy: '관련 계정 태그로 도달 확장',
        cta_style: '부드러운 행동 유도 (댓글, 저장)',
        line_breaks: '가독성을 위한 단락 분리',
      },
      hook_requirements: {
        hook_window_seconds: 2,
        hook_types: ['시각적 충격', '질문형', '숫자/통계'],
        pattern_interrupt_techniques: ['대비 색상', '예상치 못한 이미지', '텍스트 오버레이'],
        curiosity_gap_examples: ['이것을 알기 전까진...', '90%가 모르는...'],
      },
      cta_placement: {
        primary_position: '캡션 마지막 문장',
        secondary_positions: ['첫 번째 댓글', '스토리 하이라이트'],
        button_vs_text: '텍스트 CTA (버튼 없음)',
        urgency_level: 'low',
      },
    },
    ad_characteristics: {
      ad_fatigue_threshold: '4-7회 노출',
      frequency_cap_recommendation: 2,
      creative_refresh_cycle: '2-3주',
      native_vs_polished: 0.4,
    },
    benchmarks: {
      average_engagement_rate: 0.047,
      average_ctr: 0.009,
      average_cpm_range: [5, 15],
      top_performer_threshold: 0.08,
    },
  },

  instagram_story: {
    platform: 'instagram_story',
    algorithm: {
      primary_signals: [
        '완료율 (Full Watch Rate)',
        '답장 (Reply)',
        '스티커 상호작용',
        '화면 탭 (다음으로 넘기지 않음)',
        '프로필 방문',
      ],
      engagement_factors: [
        { factor: 'Completion Rate', weight: 0.4, optimization_tip: '15초 내 핵심 전달' },
        { factor: 'Reply Rate', weight: 0.25, optimization_tip: '질문 스티커, 투표 활용' },
        { factor: 'Sticker Interaction', weight: 0.2, optimization_tip: '인터랙티브 요소 필수' },
        { factor: 'Tap Forward Rate', weight: 0.15, optimization_tip: '낮을수록 좋음 (≤30%)' },
      ],
      optimal_posting_times: [
        { day: 'weekday', times: ['08:00-10:00', '20:00-22:00'] },
        { day: 'weekend', times: ['11:00-13:00', '20:00-23:00'] },
      ],
      content_decay_rate: '24시간 자동 삭제',
      viral_mechanics: ['DM 공유', '멘션 리포스트', '하이라이트 저장'],
    },
    user_behavior: {
      average_session_duration: '3분 (스토리만)',
      scroll_speed: '빠름 (0.8초/스토리)',
      attention_span: '첫 1-2초 결정적',
      interaction_patterns: ['탭 → 홀드(관심) → 답장/스티커 → 다음'],
      content_consumption_mode: 'passive',
    },
    content_specs: {
      optimal_length: {
        video_seconds: { min: 5, optimal: 10, max: 15 },
        caption_characters: { min: 0, optimal: 50, max: 100 },
        hashtags: { min: 0, optimal: 1, max: 3 },
      },
      visual_requirements: {
        aspect_ratio: ['9:16'],
        resolution: '1080x1920',
        safe_zones: { top: 15, bottom: 20, left: 5, right: 5 },
        text_overlay_limit: 30,
        motion_requirements: '모션 필수, 정적 이미지 비권장',
        color_preferences: ['밝고 대비 높은 색상', '다크모드 고려'],
        thumbnail_importance: 0,
      },
      copy_guidelines: {
        tone: ['즉각적', '친밀한', '캐주얼'],
        first_line_hook: true,
        emoji_usage: 'heavy',
        hashtag_strategy: '최소화 또는 숨김',
        mention_strategy: '협업 시 태그',
        cta_style: '스와이프업 또는 DM 유도',
        line_breaks: '최소화 (화면 공간 제한)',
      },
      hook_requirements: {
        hook_window_seconds: 1,
        hook_types: ['움직임', '텍스트 애니메이션', '직접 말걸기'],
        pattern_interrupt_techniques: ['급격한 줌', '깜빡임', '소리'],
        curiosity_gap_examples: ['끝까지 보면...', '스와이프해서 확인'],
      },
      cta_placement: {
        primary_position: '화면 하단 1/3',
        secondary_positions: ['스티커 위치'],
        button_vs_text: '스와이프업 버튼 또는 DM 유도',
        urgency_level: 'high',
      },
    },
    ad_characteristics: {
      ad_fatigue_threshold: '3-5회 노출',
      frequency_cap_recommendation: 1,
      creative_refresh_cycle: '1-2주',
      native_vs_polished: 0.2,
    },
    benchmarks: {
      average_engagement_rate: 0.05,
      average_ctr: 0.015,
      average_cpm_range: [4, 12],
      top_performer_threshold: 0.1,
    },
  },

  tiktok: {
    platform: 'tiktok',
    algorithm: {
      primary_signals: [
        '완료율 (가장 중요)',
        '반복 시청',
        '공유',
        '댓글',
        '영상 시청 시간',
      ],
      engagement_factors: [
        { factor: 'Completion Rate', weight: 0.35, optimization_tip: '루프 가능한 구조, 예상치 못한 결말' },
        { factor: 'Rewatch Rate', weight: 0.25, optimization_tip: '놓칠 수 있는 디테일 숨기기' },
        { factor: 'Share Rate', weight: 0.2, optimization_tip: '밈화 가능성, 공감 포인트' },
        { factor: 'Comment Rate', weight: 0.15, optimization_tip: '논쟁 유도, 의견 요청' },
        { factor: 'Like Rate', weight: 0.05, optimization_tip: '부차적 지표' },
      ],
      optimal_posting_times: [
        { day: 'weekday', times: ['07:00-08:00', '12:00-13:00', '19:00-22:00'] },
        { day: 'weekend', times: ['10:00-12:00', '14:00-16:00', '19:00-23:00'] },
      ],
      content_decay_rate: '48시간 초기 부스트, 이후 롱테일 가능',
      viral_mechanics: ['For You Page', '사운드 바이럴', '듀엣/스티치', '해시태그 챌린지'],
    },
    user_behavior: {
      average_session_duration: '52분',
      scroll_speed: '매우 빠름 (0.5초/영상 판단)',
      attention_span: '첫 0.5-1초 결정적',
      interaction_patterns: ['시청 → 완료/스킵 → 좋아요 → 댓글/공유'],
      content_consumption_mode: 'passive',
    },
    content_specs: {
      optimal_length: {
        video_seconds: { min: 7, optimal: 21, max: 60 },
        caption_characters: { min: 30, optimal: 100, max: 300 },
        hashtags: { min: 2, optimal: 4, max: 6 },
      },
      visual_requirements: {
        aspect_ratio: ['9:16'],
        resolution: '1080x1920',
        safe_zones: { top: 10, bottom: 25, left: 5, right: 15 },
        text_overlay_limit: 40,
        motion_requirements: '모션 필수, 빠른 컷 선호',
        color_preferences: ['하이 콘트라스트', '트렌딩 컬러 팔레트'],
        thumbnail_importance: 0.3,
      },
      copy_guidelines: {
        tone: ['유머러스', '자기비하적', '트렌디', '밈 활용'],
        first_line_hook: true,
        emoji_usage: 'moderate',
        hashtag_strategy: '트렌딩+니치 조합',
        mention_strategy: '크리에이터 콜라보',
        cta_style: '자연스러운 내러티브 내 삽입',
        line_breaks: '최소화',
      },
      hook_requirements: {
        hook_window_seconds: 0.5,
        hook_types: ['움직임 시작', '질문', '충격적 장면', '트렌딩 사운드'],
        pattern_interrupt_techniques: ['빠른 줌', '컷 변화', '텍스트 팝업', '사운드 싱크'],
        curiosity_gap_examples: ['끝까지 보세요', 'POV:', '이거 실화임?'],
      },
      cta_placement: {
        primary_position: '영상 마지막 3초',
        secondary_positions: ['댓글 고정', '프로필 링크'],
        button_vs_text: '보이스오버 또는 텍스트',
        urgency_level: 'medium',
      },
    },
    ad_characteristics: {
      ad_fatigue_threshold: '2-4회 노출',
      frequency_cap_recommendation: 1,
      creative_refresh_cycle: '1주',
      native_vs_polished: 0.1,
    },
    benchmarks: {
      average_engagement_rate: 0.058,
      average_ctr: 0.012,
      average_cpm_range: [3, 10],
      top_performer_threshold: 0.12,
    },
  },

  threads: {
    platform: 'threads',
    algorithm: {
      primary_signals: [
        '리포스트 (가장 강력)',
        '답글 품질 및 양',
        '인용 게시',
        '좋아요',
        '팔로워 상호작용',
      ],
      engagement_factors: [
        { factor: 'Repost Rate', weight: 0.35, optimization_tip: '공유할 만한 인사이트/의견' },
        { factor: 'Reply Quality', weight: 0.3, optimization_tip: '대화 유도, 논쟁적 주제' },
        { factor: 'Quote Rate', weight: 0.2, optimization_tip: '의견 추가할 여지 남기기' },
        { factor: 'Like Rate', weight: 0.15, optimization_tip: '공감 포인트' },
      ],
      optimal_posting_times: [
        { day: 'weekday', times: ['08:00-10:00', '18:00-20:00'] },
        { day: 'weekend', times: ['10:00-12:00', '20:00-22:00'] },
      ],
      content_decay_rate: '12-24시간',
      viral_mechanics: ['피드 추천', '리포스트 체인', '트렌딩 토픽'],
    },
    user_behavior: {
      average_session_duration: '15분',
      scroll_speed: '빠름',
      attention_span: '첫 문장 결정적',
      interaction_patterns: ['스크롤 → 읽기 → 좋아요/답글 → 리포스트'],
      content_consumption_mode: 'active',
    },
    content_specs: {
      optimal_length: {
        video_seconds: { min: 0, optimal: 0, max: 5 },
        caption_characters: { min: 50, optimal: 200, max: 500 },
        hashtags: { min: 0, optimal: 0, max: 2 },
      },
      visual_requirements: {
        aspect_ratio: ['1:1', '4:5'],
        resolution: '1080x1080',
        safe_zones: { top: 0, bottom: 0, left: 0, right: 0 },
        text_overlay_limit: 0,
        motion_requirements: '정적 이미지 선호',
        color_preferences: ['심플', '미니멀'],
        thumbnail_importance: 0.3,
      },
      copy_guidelines: {
        tone: ['위트', '직설적', '대화체', '전문성'],
        first_line_hook: true,
        emoji_usage: 'minimal',
        hashtag_strategy: '거의 사용하지 않음',
        mention_strategy: '대화 시작 또는 인용',
        cta_style: '질문형 또는 의견 요청',
        line_breaks: '가독성 위해 짧은 문단',
      },
      hook_requirements: {
        hook_window_seconds: 2,
        hook_types: ['강렬한 의견', '질문', '통계', '역설'],
        pattern_interrupt_techniques: ['대담한 주장', '논쟁적 시작'],
        curiosity_gap_examples: ['unpopular opinion:', '여기 문제가 있어요'],
      },
      cta_placement: {
        primary_position: '마지막 문장',
        secondary_positions: ['첫 답글'],
        button_vs_text: '텍스트 질문',
        urgency_level: 'low',
      },
    },
    ad_characteristics: {
      ad_fatigue_threshold: '5-7회 노출',
      frequency_cap_recommendation: 2,
      creative_refresh_cycle: '3-4주',
      native_vs_polished: 0.1,
    },
    benchmarks: {
      average_engagement_rate: 0.032,
      average_ctr: 0.006,
      average_cpm_range: [6, 18],
      top_performer_threshold: 0.06,
    },
  },

  youtube_shorts: {
    platform: 'youtube_shorts',
    algorithm: {
      primary_signals: [
        '시청 시간 (Watch Time)',
        '완료율',
        '반복 시청',
        '구독 전환',
        '댓글',
      ],
      engagement_factors: [
        { factor: 'Watch Time', weight: 0.35, optimization_tip: '마지막까지 시청하게 만들기' },
        { factor: 'Completion Rate', weight: 0.25, optimization_tip: '루프 구조' },
        { factor: 'Subscribe Rate', weight: 0.2, optimization_tip: '채널 가치 제안' },
        { factor: 'Comment Rate', weight: 0.1, optimization_tip: '의견 요청' },
        { factor: 'Like Rate', weight: 0.1, optimization_tip: '즉각적 반응' },
      ],
      optimal_posting_times: [
        { day: 'weekday', times: ['12:00-14:00', '18:00-21:00'] },
        { day: 'weekend', times: ['10:00-12:00', '16:00-20:00'] },
      ],
      content_decay_rate: '롱테일 가능 (검색 기반)',
      viral_mechanics: ['Shorts 피드', '구독자 알림', 'YouTube 검색', '추천 영상'],
    },
    user_behavior: {
      average_session_duration: '26분',
      scroll_speed: '빠름',
      attention_span: '첫 2초',
      interaction_patterns: ['시청 → 좋아요 → 구독 → 댓글'],
      content_consumption_mode: 'passive',
    },
    content_specs: {
      optimal_length: {
        video_seconds: { min: 15, optimal: 30, max: 60 },
        caption_characters: { min: 50, optimal: 100, max: 200 },
        hashtags: { min: 2, optimal: 3, max: 5 },
      },
      visual_requirements: {
        aspect_ratio: ['9:16'],
        resolution: '1080x1920',
        safe_zones: { top: 10, bottom: 20, left: 5, right: 5 },
        text_overlay_limit: 30,
        motion_requirements: '모션 필수',
        color_preferences: ['밝은 색상', '하이 콘트라스트'],
        thumbnail_importance: 0.5,
      },
      copy_guidelines: {
        tone: ['교육적', '엔터테인먼트', '직접적'],
        first_line_hook: true,
        emoji_usage: 'moderate',
        hashtag_strategy: '#Shorts 필수 + 관련 키워드',
        mention_strategy: '콜라보 크리에이터',
        cta_style: '구독 유도',
        line_breaks: '최소화',
      },
      hook_requirements: {
        hook_window_seconds: 2,
        hook_types: ['질문', '예고', '시각적 훅', '결과 미리보기'],
        pattern_interrupt_techniques: ['빠른 편집', '텍스트 팝업', 'B-roll'],
        curiosity_gap_examples: ['How to...', '이렇게 하면...', '결과 충격'],
      },
      cta_placement: {
        primary_position: '영상 마지막 5초',
        secondary_positions: ['고정 댓글'],
        button_vs_text: '보이스오버 + 텍스트',
        urgency_level: 'medium',
      },
    },
    ad_characteristics: {
      ad_fatigue_threshold: '3-5회 노출',
      frequency_cap_recommendation: 2,
      creative_refresh_cycle: '2-3주',
      native_vs_polished: 0.3,
    },
    benchmarks: {
      average_engagement_rate: 0.04,
      average_ctr: 0.01,
      average_cpm_range: [4, 12],
      top_performer_threshold: 0.08,
    },
  },

  youtube_ads: {
    platform: 'youtube_ads',
    algorithm: {
      primary_signals: [
        'View Rate (30초 이상)',
        'Click-Through Rate',
        '전환율',
        '스킵률 (5초 후)',
        '브랜드 리프트',
      ],
      engagement_factors: [
        { factor: 'View Rate', weight: 0.3, optimization_tip: '5초 내 강력한 훅' },
        { factor: 'CTR', weight: 0.3, optimization_tip: '명확한 CTA' },
        { factor: 'Conversion Rate', weight: 0.25, optimization_tip: '랜딩 페이지 일관성' },
        { factor: 'Skip Rate', weight: 0.15, optimization_tip: '5초 이내 가치 전달 (낮을수록 좋음)' },
      ],
      optimal_posting_times: [{ day: 'all', times: ['24시간 운영, 시간대별 비딩 조정'] }],
      content_decay_rate: '광고 비용 기반',
      viral_mechanics: ['YouTube 검색', '추천 영상', '디스플레이 네트워크'],
    },
    user_behavior: {
      average_session_duration: '40분 (YouTube 전체)',
      scroll_speed: 'N/A (강제 노출)',
      attention_span: '5초 (스킵 전)',
      interaction_patterns: ['시청 → 스킵 or 계속 → CTA 클릭 → 전환'],
      content_consumption_mode: 'passive',
    },
    content_specs: {
      optimal_length: {
        video_seconds: { min: 6, optimal: 15, max: 30 },
        caption_characters: { min: 0, optimal: 0, max: 0 },
        hashtags: { min: 0, optimal: 0, max: 0 },
      },
      visual_requirements: {
        aspect_ratio: ['16:9', '1:1'],
        resolution: '1920x1080 또는 1080x1080',
        safe_zones: { top: 10, bottom: 15, left: 10, right: 10 },
        text_overlay_limit: 50,
        motion_requirements: '프로페셔널 품질',
        color_preferences: ['브랜드 컬러 일관성'],
        thumbnail_importance: 0.8,
      },
      copy_guidelines: {
        tone: ['전문적', '신뢰감', '행동 유도'],
        first_line_hook: true,
        emoji_usage: 'none',
        hashtag_strategy: 'N/A',
        mention_strategy: 'N/A',
        cta_style: '명확한 버튼 + 음성 안내',
        line_breaks: 'N/A',
      },
      hook_requirements: {
        hook_window_seconds: 5,
        hook_types: ['문제 제시', '충격적 통계', '감정적 장면', '질문'],
        pattern_interrupt_techniques: ['빠른 시작', '음악/효과음', '대비'],
        curiosity_gap_examples: ['지금 안 보면 후회할...', '이게 진짜 가능해?'],
      },
      cta_placement: {
        primary_position: '영상 마지막 + 항상 표시 버튼',
        secondary_positions: ['중간 삽입 CTA'],
        button_vs_text: '버튼 필수',
        urgency_level: 'high',
      },
    },
    ad_characteristics: {
      ad_fatigue_threshold: '7-10회 노출',
      frequency_cap_recommendation: 3,
      creative_refresh_cycle: '4-6주',
      native_vs_polished: 0.8,
    },
    benchmarks: {
      average_engagement_rate: 0.02,
      average_ctr: 0.014,
      average_cpm_range: [10, 30],
      top_performer_threshold: 0.03,
    },
  },
};

/**
 * 플랫폼별 프롬프트 가이드 생성
 */
export function getPlatformPromptGuide(platform: Platform): string {
  const profile = PLATFORM_DEEP_PROFILES[platform];
  const specs = profile.content_specs;
  const hook = specs.hook_requirements;
  const copy = specs.copy_guidelines;

  return `
## ${profile.platform.toUpperCase()} 최적화 가이드

### 알고리즘 핵심
${profile.algorithm.primary_signals.map((s, i) => `${i + 1}. ${s}`).join('\n')}

### 사용자 행동
- 세션 시간: ${profile.user_behavior.average_session_duration}
- 스크롤 속도: ${profile.user_behavior.scroll_speed}
- 주의 집중: ${profile.user_behavior.attention_span}
- 소비 모드: ${profile.user_behavior.content_consumption_mode}

### 훅 요구사항 (${hook.hook_window_seconds}초 이내)
- 훅 타입: ${hook.hook_types.join(', ')}
- 패턴 인터럽트: ${hook.pattern_interrupt_techniques.join(', ')}
- 예시: ${hook.curiosity_gap_examples.join(', ')}

### 카피 가이드라인
- 톤: ${copy.tone.join(', ')}
- 첫 줄 훅 필수: ${copy.first_line_hook ? '예' : '아니오'}
- 이모지: ${copy.emoji_usage}
- 해시태그: ${copy.hashtag_strategy}
- CTA 스타일: ${copy.cta_style}

### 비주얼 요구사항
- 비율: ${specs.visual_requirements.aspect_ratio.join(', ')}
- 해상도: ${specs.visual_requirements.resolution}
- 텍스트 오버레이: 최대 ${specs.visual_requirements.text_overlay_limit}%
- 모션: ${specs.visual_requirements.motion_requirements}

### 벤치마크
- 평균 참여율: ${(profile.benchmarks.average_engagement_rate * 100).toFixed(1)}%
- 평균 CTR: ${(profile.benchmarks.average_ctr * 100).toFixed(2)}%
- 탑 퍼포머 기준: ${(profile.benchmarks.top_performer_threshold * 100).toFixed(1)}%+
`.trim();
}

/**
 * 플랫폼별 카피 템플릿 가이드
 */
export function getPlatformCopyTemplate(platform: Platform): string {
  const templates: Record<Platform, string> = {
    instagram_feed: `[첫 줄 훅 - 저장하고 싶은 가치]

[본문 - 2-3문단, 가독성 좋게]

[CTA - 부드러운 행동 유도]

[해시태그 - 브랜드 + 카테고리 + 트렌딩 8-10개]`,

    instagram_story: `[1-2줄 임팩트 문구]
[이모지 강조]
[스와이프업/DM CTA]`,

    tiktok: `[POV/질문/충격 시작]

[간결한 본문]

[해시태그 4-6개 트렌딩 포함]`,

    threads: `[강렬한 첫 문장 - 의견 또는 질문]

[짧은 본문 - 대화체]

[마무리 질문 - 답글 유도]`,

    youtube_shorts: `[How to/결과 미리보기 훅]

[간결한 설명]

#Shorts #키워드1 #키워드2`,

    youtube_ads: `[5초 내 문제/해결 제시]

[가치 제안]

[명확한 CTA]`,
  };

  return templates[platform];
}
