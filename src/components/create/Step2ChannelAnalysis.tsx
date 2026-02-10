'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useCampaignStore } from '@/stores/campaign-store';
import { InsightCard, WeakEvidenceWarning } from './InsightCard';
import type { ChannelAnalysisResult } from '@/types/analysis';

interface Step2ChannelAnalysisProps {
  onNext: () => void;
  onPrev: () => void;
}

// 채널 이름 매핑
const CHANNEL_NAMES: Record<string, string> = {
  instagram_feed: 'Instagram Feed',
  instagram_story: 'Instagram Story',
  tiktok: 'TikTok',
  threads: 'Threads',
  youtube_shorts: 'YouTube Shorts',
  youtube_ads: 'YouTube Ads',
};

// 업종 이름 매핑
const INDUSTRY_NAMES: Record<string, string> = {
  cosmetics: '화장품/뷰티',
  fashion: '패션/의류',
  food: '식품/음료',
  tech: '테크/전자',
  fitness: '피트니스/건강',
  finance: '금융/보험',
  education: '교육/학습',
  travel: '여행/관광',
  automotive: '자동차/모빌리티',
  gaming: '게임/엔터테인먼트',
};

export function Step2ChannelAnalysis({ onNext, onPrev }: Step2ChannelAnalysisProps) {
  const {
    selectedChannel,
    industry,
    channelAnalysis,
    isAnalyzing,
    error,
    setChannelAnalysis,
    setAnalyzing,
    setError,
  } = useCampaignStore();

  const [analysisProgress, setAnalysisProgress] = useState(0);

  // 분석 실행
  useEffect(() => {
    if (selectedChannel && industry && !channelAnalysis && !isAnalyzing) {
      runAnalysis();
    }
  }, [selectedChannel, industry]);

  const runAnalysis = async () => {
    if (!selectedChannel || !industry) return;

    setAnalyzing(true);
    setError(null);
    setAnalysisProgress(0);

    // 진행률 시뮬레이션
    const progressInterval = setInterval(() => {
      setAnalysisProgress((prev) => Math.min(prev + Math.random() * 15, 90));
    }, 500);

    try {
      const response = await fetch(`/api/channels/${selectedChannel}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          industry,
          force_refresh: false,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || '분석에 실패했습니다');
      }

      clearInterval(progressInterval);
      setAnalysisProgress(100);

      // 잠시 후 결과 표시
      setTimeout(() => {
        setChannelAnalysis(data.data as ChannelAnalysisResult);
        setAnalyzing(false);
      }, 500);
    } catch (err) {
      clearInterval(progressInterval);
      setError(err instanceof Error ? err.message : '분석 중 오류가 발생했습니다');
      setAnalyzing(false);
    }
  };

  // 분석 중 화면
  if (isAnalyzing || !channelAnalysis) {
    return (
      <div className="space-y-8">
        <Card>
          <CardContent className="py-16">
            <div className="text-center max-w-md mx-auto">
              {/* 로딩 애니메이션 */}
              <div className="relative w-24 h-24 mx-auto mb-6">
                <div className="absolute inset-0 rounded-full border-4 border-muted"></div>
                <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center text-3xl">
                  🔍
                </div>
              </div>

              <h2 className="text-2xl font-bold mb-2">
                {CHANNEL_NAMES[selectedChannel || '']} 분석 중...
              </h2>
              <p className="text-muted-foreground mb-6">
                {INDUSTRY_NAMES[industry] || industry} 업종의 성공 광고를 분석하고 있습니다
              </p>

              {/* 진행률 */}
              <div className="space-y-2">
                <Progress value={analysisProgress} className="h-2" />
                <p className="text-sm text-muted-foreground">
                  {analysisProgress < 20 && '광고 데이터 수집 중...'}
                  {analysisProgress >= 20 && analysisProgress < 40 && '이미지 분석 중...'}
                  {analysisProgress >= 40 && analysisProgress < 60 && '패턴 추출 중...'}
                  {analysisProgress >= 60 && analysisProgress < 80 && '근거 검증 중...'}
                  {analysisProgress >= 80 && '인사이트 생성 중...'}
                </p>
              </div>

              {/* 분석 과정 설명 */}
              <div className="mt-8 text-left bg-muted/50 rounded-lg p-4">
                <h3 className="font-medium mb-2">분석 과정</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li className={analysisProgress >= 20 ? 'text-foreground' : ''}>
                    ✓ 60개 광고 수집 (성공 40, 평균 15, 실패 5)
                  </li>
                  <li className={analysisProgress >= 40 ? 'text-foreground' : ''}>
                    ✓ AI Vision으로 이미지 분석
                  </li>
                  <li className={analysisProgress >= 60 ? 'text-foreground' : ''}>
                    ✓ 성공 vs 평균 패턴 비교
                  </li>
                  <li className={analysisProgress >= 80 ? 'text-foreground' : ''}>
                    ✓ 통계적 유의성 검증
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 이전 버튼 */}
        <Button variant="outline" onClick={onPrev} className="w-full">
          ← 채널 다시 선택
        </Button>
      </div>
    );
  }

  // 분석 결과 화면
  const strongEvidence = channelAnalysis.validated_insights.filter(
    (e) => e.evidence_strength === 'strong' || e.evidence_strength === 'moderate'
  );
  const weakEvidence = channelAnalysis.validated_insights.filter(
    (e) => e.evidence_strength === 'weak'
  );

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="text-center">
        <h1 className="text-3xl font-bold">
          🎯 {CHANNEL_NAMES[channelAnalysis.channel]} 완전 정복 가이드
        </h1>
        <p className="text-muted-foreground mt-2">
          {INDUSTRY_NAMES[channelAnalysis.industry] || channelAnalysis.industry} 업종 |{' '}
          {channelAnalysis.analysis_metadata.sample_size}개 광고 분석
        </p>
      </div>

      {/* 분석 품질 */}
      <Card>
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-sm">
                분석 품질: {channelAnalysis.analysis_metadata.analysis_quality_score}점
              </Badge>
              <span className="text-sm text-muted-foreground">
                성공 광고 {channelAnalysis.analysis_metadata.success_ads_count}개 분석
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={runAnalysis}>
              🔄 다시 분석
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 핵심 인사이트 */}
      <div>
        <h2 className="text-xl font-semibold mb-4">
          💡 핵심 인사이트 ({strongEvidence.length}개)
        </h2>
        <div className="space-y-4">
          {strongEvidence.slice(0, 6).map((evidence, index) => (
            <InsightCard key={index} evidence={evidence} index={index} />
          ))}
        </div>
      </div>

      {/* 약한 근거 경고 */}
      <WeakEvidenceWarning weakEvidence={weakEvidence} />

      {/* 추천 방향 요약 */}
      <Card>
        <CardHeader>
          <CardTitle>🚀 추천 컨셉 방향</CardTitle>
          <CardDescription>분석 결과를 바탕으로 한 추천 방향입니다</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {channelAnalysis.concept_inputs.recommended_directions.slice(0, 3).map((dir, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg"
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{dir.direction}</div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {dir.reasoning}
                  </div>
                  <div className="mt-2">
                    <Badge variant="outline" className="text-xs">
                      신뢰도 {dir.confidence_score}%
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 필수/회피 요소 */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">✅ 필수 포함 요소</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">비주얼</div>
              <div className="flex flex-wrap gap-1">
                {channelAnalysis.concept_inputs.must_include.visual_elements.map((el, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {el}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground mb-1">카피</div>
              <div className="flex flex-wrap gap-1">
                {channelAnalysis.concept_inputs.must_include.copy_elements.map((el, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {el}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">⚠️ 피해야 할 요소</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm">
              {channelAnalysis.concept_inputs.must_avoid.slice(0, 5).map((item, i) => (
                <li key={i} className="flex items-center gap-2">
                  <span className="text-red-500">✗</span>
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* 액션 버튼 */}
      <div className="flex gap-4">
        <Button variant="outline" onClick={onPrev} className="flex-1">
          ← 채널 다시 선택
        </Button>
        <Button onClick={onNext} className="flex-1" size="lg">
          분석 기반 컨셉 생성하기 →
        </Button>
      </div>
    </div>
  );
}
