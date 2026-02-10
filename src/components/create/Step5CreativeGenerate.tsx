'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useCampaignStore } from '@/stores/campaign-store';

interface Step5CreativeGenerateProps {
  onComplete: (creatives: GeneratedCreative[]) => void;
}

export interface GeneratedCreative {
  id: string;
  image_url: string;
  copy: {
    headline: string;
    body: string;
    cta: string;
  };
  format: string;
  dimensions: {
    width: number;
    height: number;
  };
  quality_score: number;
  channel_optimization: {
    format_match: boolean;
    aspect_ratio: string;
    recommendations: string[];
  };
}

const GENERATION_STAGES = [
  { progress: 15, message: '컨셉 분석 중...', detail: '선택한 컨셉의 비주얼 방향을 해석합니다' },
  { progress: 30, message: '이미지 구성 중...', detail: '레이아웃과 요소를 배치합니다' },
  { progress: 50, message: '이미지 생성 중...', detail: 'AI가 광고 이미지를 생성합니다' },
  { progress: 70, message: '카피 최적화 중...', detail: '채널에 맞는 카피를 작성합니다' },
  { progress: 85, message: '품질 검증 중...', detail: '생성된 소재의 품질을 확인합니다' },
  { progress: 95, message: '최종 처리 중...', detail: '결과물을 준비합니다' },
];

export function Step5CreativeGenerate({ onComplete }: Step5CreativeGenerateProps) {
  const { selectedChannel, channelAnalysis, setError } = useCampaignStore();

  const [currentStage, setCurrentStage] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    generateCreatives();
  }, []);

  const generateCreatives = async () => {
    try {
      // 저장된 컨셉 정보 가져오기
      const conceptStr = sessionStorage.getItem('selectedConcept');
      const brandInfoStr = sessionStorage.getItem('brandInfo');

      if (!conceptStr) {
        throw new Error('선택된 컨셉 정보가 없습니다');
      }

      const concept = JSON.parse(conceptStr);
      const brandInfo = brandInfoStr ? JSON.parse(brandInfoStr) : null;

      // 진행 상태 시뮬레이션
      for (let i = 0; i < GENERATION_STAGES.length; i++) {
        setCurrentStage(i);

        // 부드러운 진행률 증가
        const targetProgress = GENERATION_STAGES[i].progress;
        const startProgress = i > 0 ? GENERATION_STAGES[i - 1].progress : 0;

        for (let p = startProgress; p <= targetProgress; p += 2) {
          setProgress(p);
          await new Promise(resolve => setTimeout(resolve, 50));
        }

        // 각 단계별 대기
        await new Promise(resolve => setTimeout(resolve, 800));
      }

      // 실제 API 호출
      const response = await fetch('/api/creatives/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: selectedChannel,
          concept,
          brandInfo,
          channelAnalysis,
          variations: 3, // 3개 변형 생성
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || '소재 생성에 실패했습니다');
      }

      setProgress(100);
      await new Promise(resolve => setTimeout(resolve, 500));

      onComplete(data.data.creatives);
    } catch (err) {
      setError(err instanceof Error ? err.message : '소재 생성 중 오류가 발생했습니다');
    }
  };

  const stage = GENERATION_STAGES[currentStage] || GENERATION_STAGES[0];

  return (
    <div className="space-y-8">
      <Card>
        <CardContent className="py-16">
          <div className="text-center max-w-lg mx-auto">
            {/* 애니메이션 로더 */}
            <div className="relative w-32 h-32 mx-auto mb-8">
              {/* 외부 링 */}
              <div className="absolute inset-0 rounded-full border-4 border-muted"></div>
              <svg className="absolute inset-0 w-full h-full -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="60"
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="4"
                  strokeDasharray={`${progress * 3.77} 377`}
                  className="transition-all duration-300"
                />
              </svg>

              {/* 중앙 아이콘 */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-4xl animate-pulse">
                  {currentStage < 2 ? '🎨' : currentStage < 4 ? '🖼️' : '✨'}
                </div>
              </div>
            </div>

            {/* 메인 메시지 */}
            <h2 className="text-2xl font-bold mb-2">{stage.message}</h2>
            <p className="text-muted-foreground mb-8">{stage.detail}</p>

            {/* 진행률 바 */}
            <div className="space-y-2">
              <Progress value={progress} className="h-3" />
              <p className="text-sm text-muted-foreground">{Math.round(progress)}% 완료</p>
            </div>

            {/* 단계 표시 */}
            <div className="mt-8 flex justify-center gap-2">
              {GENERATION_STAGES.map((_, i) => (
                <div
                  key={i}
                  className={`
                    w-2 h-2 rounded-full transition-all
                    ${i <= currentStage ? 'bg-primary' : 'bg-muted'}
                  `}
                />
              ))}
            </div>

            {/* 채널 정보 */}
            <div className="mt-8 p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">
                  {selectedChannel?.replace('_', ' ').toUpperCase()}
                </span>
                에 최적화된 소재를 생성하고 있습니다
              </p>
              {channelAnalysis && (
                <p className="text-xs text-muted-foreground mt-1">
                  {channelAnalysis.analysis_metadata.success_ads_count}개 성공 광고 패턴 적용 중
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 팁 */}
      <div className="text-center text-sm text-muted-foreground">
        <p>💡 생성된 소재는 다운로드하거나 바로 사용할 수 있습니다</p>
      </div>
    </div>
  );
}
