'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ValidatedEvidence } from '@/types/analysis';

interface InsightCardProps {
  evidence: ValidatedEvidence;
  index: number;
}

export function InsightCard({ evidence, index }: InsightCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const { pattern, confidence_score, evidence_strength, mechanism, reference_ads, is_statistically_significant } = evidence;

  // 근거 강도별 스타일
  const strengthStyles = {
    strong: {
      badge: 'bg-green-100 text-green-800 border-green-200',
      bar: 'bg-green-500',
      label: '강한 근거',
    },
    moderate: {
      badge: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      bar: 'bg-yellow-500',
      label: '보통 근거',
    },
    weak: {
      badge: 'bg-gray-100 text-gray-600 border-gray-200',
      bar: 'bg-gray-400',
      label: '약한 근거',
    },
  };

  const style = strengthStyles[evidence_strength];

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        {/* 헤더 */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg font-medium">
                {getPatternDisplayName(pattern.pattern_name)}
              </span>
              <Badge variant="outline" className={style.badge}>
                {style.label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {getPatternValueDisplay(pattern.pattern_value)}
            </p>
          </div>
        </div>

        {/* 신뢰도 바 */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-muted-foreground">근거 강도</span>
            <span className="font-medium">{confidence_score}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${style.bar}`}
              style={{ width: `${confidence_score}%` }}
            />
          </div>
        </div>

        {/* 통계 요약 */}
        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">성공 광고: </span>
              <span className="font-medium">{(pattern.usage_in_success * 100).toFixed(0)}%</span>
            </div>
            <div>
              <span className="text-muted-foreground">평균: </span>
              <span className="font-medium">{(pattern.usage_in_average * 100).toFixed(0)}%</span>
            </div>
            <div className={pattern.difference_pp > 0 ? 'text-green-600' : 'text-red-600'}>
              <span className="font-semibold">
                {pattern.difference_pp > 0 ? '+' : ''}{pattern.difference_pp.toFixed(0)}%p
              </span>
            </div>
            {is_statistically_significant && (
              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                통계적 유의
              </Badge>
            )}
          </div>
        </div>

        {/* 메커니즘 설명 */}
        <p className="mt-3 text-sm text-muted-foreground">
          💡 {mechanism.psychological_basis}
        </p>

        {/* 레퍼런스 썸네일 */}
        {reference_ads.length > 0 && (
          <div className="mt-3 flex gap-2">
            {reference_ads.slice(0, 3).map((ad, i) => (
              <div
                key={i}
                className="w-14 h-14 rounded-lg overflow-hidden bg-muted"
                title={`${ad.advertiser} (${ad.delivery_days}일 집행)`}
              >
                <img
                  src={ad.thumbnail_url}
                  alt={`Reference ${i + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/56?text=Ad';
                  }}
                />
              </div>
            ))}
            {reference_ads.length > 3 && (
              <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center text-xs text-muted-foreground">
                +{reference_ads.length - 3}
              </div>
            )}
          </div>
        )}

        {/* 상세 보기 토글 */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-3 text-sm text-primary hover:underline"
        >
          {isExpanded ? '간략히 보기 ▲' : '상세 분석 보기 ▼'}
        </button>

        {/* 확장 내용 */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t space-y-2 text-sm">
            <p>
              <span className="font-medium text-muted-foreground">채널 적합성:</span>{' '}
              {mechanism.channel_fit_reason}
            </p>
            <p>
              <span className="font-medium text-muted-foreground">업종 적합성:</span>{' '}
              {mechanism.industry_fit_reason}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * 패턴 이름을 사용자 친화적으로 변환
 */
function getPatternDisplayName(name: string): string {
  const nameMap: Record<string, string> = {
    has_person: '인물 등장',
    contrast_level: '색상 대비',
    visual_flow: '시선 흐름',
    grid_pattern: '레이아웃 패턴',
    overall_tone: '색상 톤',
    font_style: '폰트 스타일',
    image_type: '이미지 유형',
    product_presentation: '제품 표현',
    text_ratio: '텍스트 비율',
    has_cta: 'CTA 포함',
    whitespace: '여백 활용',
    product_position: '제품 위치',
    headline_position: '헤드라인 위치',
    cta_position: 'CTA 위치',
    person_expression: '인물 표정',
    filter_effect: '필터 효과',
    primary_color_family: '주요 색상',
    has_subheadline: '서브 헤드라인',
    estimated_goal: '광고 목표',
  };

  return nameMap[name] || name;
}

/**
 * 패턴 값을 사용자 친화적으로 변환
 */
function getPatternValueDisplay(value: string): string {
  const valueMap: Record<string, string> = {
    yes: '있음',
    no: '없음',
    high: '높음',
    medium: '중간',
    low: '낮음',
    minimal: '최소',
    moderate: '적당',
    generous: '넉넉함',
    centered: '중앙 정렬',
    'center-focus': '중앙 집중',
    'F-pattern': 'F 패턴',
    'Z-pattern': 'Z 패턴',
    photo: '사진',
    illustration: '일러스트',
    graphic: '그래픽',
    'bold-sans': '굵은 산세리프',
    'elegant-serif': '우아한 세리프',
    lifestyle: '라이프스타일',
    closeup: '클로즈업',
    'warm-bright': '따뜻하고 밝은',
    'cool-dark': '차갑고 어두운',
    'neutral-soft': '중립적이고 부드러운',
    smiling: '미소',
  };

  return valueMap[value] || value;
}

/**
 * 약한 근거 경고 컴포넌트
 */
export function WeakEvidenceWarning({
  weakEvidence,
}: {
  weakEvidence: ValidatedEvidence[];
}) {
  if (weakEvidence.length === 0) return null;

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
      <h4 className="font-medium text-amber-800">
        📌 참고용 인사이트 ({weakEvidence.length}개)
      </h4>
      <p className="text-sm text-amber-700 mt-1">
        아래 패턴들은 통계적으로 유의미하지 않아 참고만 하세요.
      </p>
      <ul className="mt-2 text-sm text-amber-600 space-y-1">
        {weakEvidence.slice(0, 3).map((e, i) => (
          <li key={i}>
            • {getPatternDisplayName(e.pattern.pattern_name)}: {getPatternValueDisplay(e.pattern.pattern_value)}
          </li>
        ))}
        {weakEvidence.length > 3 && (
          <li className="text-amber-500">... 외 {weakEvidence.length - 3}개</li>
        )}
      </ul>
    </div>
  );
}
