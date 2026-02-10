'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useCampaignStore } from '@/stores/campaign-store';
import type { BrandInfo } from './Step3BrandInfo';

interface Step4ConceptSelectProps {
  onNext: () => void;
  onPrev: () => void;
}

interface GeneratedConcept {
  id: string;
  title: string;
  description: string;
  visual_direction: string;
  copy_direction: string;
  hook_message: string;
  channel_fit_score: number;
  reasoning: string;
  based_on: string[];
  color_palette: string[];
  recommended_format: string;
}

export function Step4ConceptSelect({ onNext, onPrev }: Step4ConceptSelectProps) {
  const {
    selectedChannel,
    industry,
    channelAnalysis,
    selectedConcept,
    selectConcept,
    setLoading,
    setError,
  } = useCampaignStore();

  const [concepts, setConcepts] = useState<GeneratedConcept[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [selectedConceptId, setSelectedConceptId] = useState<string | null>(null);

  // 컨셉 생성
  useEffect(() => {
    if (channelAnalysis && concepts.length === 0 && !isGenerating) {
      generateConcepts();
    }
  }, [channelAnalysis]);

  const generateConcepts = async () => {
    if (!selectedChannel || !channelAnalysis) return;

    setIsGenerating(true);
    setError(null);
    setGenerationProgress(0);

    // 진행률 시뮬레이션
    const progressInterval = setInterval(() => {
      setGenerationProgress((prev) => Math.min(prev + Math.random() * 20, 90));
    }, 400);

    try {
      // 브랜드 정보 가져오기
      const brandInfoStr = sessionStorage.getItem('brandInfo');
      const brandInfo: BrandInfo | null = brandInfoStr ? JSON.parse(brandInfoStr) : null;

      const response = await fetch('/api/concepts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: selectedChannel,
          industry,
          channelAnalysis,
          brandInfo,
          count: 3, // 3개 컨셉 생성
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || '컨셉 생성에 실패했습니다');
      }

      clearInterval(progressInterval);
      setGenerationProgress(100);

      setTimeout(() => {
        setConcepts(data.data.concepts);
        setIsGenerating(false);
      }, 300);
    } catch (err) {
      clearInterval(progressInterval);
      setError(err instanceof Error ? err.message : '컨셉 생성 중 오류가 발생했습니다');
      setIsGenerating(false);
    }
  };

  const handleConceptSelect = (concept: GeneratedConcept) => {
    setSelectedConceptId(concept.id);
    // store에도 저장 (기존 Concept 타입에 맞춰서)
    selectConcept({
      id: concept.id,
      campaign_id: '',
      title: concept.title,
      description: concept.description,
      visual_direction: concept.visual_direction,
      copy_direction: concept.copy_direction,
      color_palette: concept.color_palette || [],
      mood_keywords: [],
      is_selected: true,
      created_at: new Date().toISOString(),
    });
  };

  const handleNext = () => {
    if (!selectedConceptId) {
      setError('컨셉을 선택해주세요');
      return;
    }
    // 선택된 컨셉 정보 저장
    const selected = concepts.find(c => c.id === selectedConceptId);
    if (selected) {
      sessionStorage.setItem('selectedConcept', JSON.stringify(selected));
    }
    onNext();
  };

  // 생성 중 화면
  if (isGenerating || concepts.length === 0) {
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
                  ✨
                </div>
              </div>

              <h2 className="text-2xl font-bold mb-2">
                분석 기반 컨셉 생성 중...
              </h2>
              <p className="text-muted-foreground mb-6">
                채널 분석 인사이트를 활용해 최적의 컨셉을 만들고 있습니다
              </p>

              {/* 진행률 */}
              <div className="space-y-2">
                <Progress value={generationProgress} className="h-2" />
                <p className="text-sm text-muted-foreground">
                  {generationProgress < 30 && '인사이트 분석 중...'}
                  {generationProgress >= 30 && generationProgress < 60 && '컨셉 방향 설정 중...'}
                  {generationProgress >= 60 && generationProgress < 85 && '비주얼/카피 방향 생성 중...'}
                  {generationProgress >= 85 && '최종 검증 중...'}
                </p>
              </div>

              {/* 적용 인사이트 미리보기 */}
              {channelAnalysis && (
                <div className="mt-8 text-left bg-muted/50 rounded-lg p-4">
                  <h3 className="font-medium mb-2">적용 중인 인사이트</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {channelAnalysis.validated_insights.slice(0, 3).map((insight, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="text-green-500">✓</span>
                        {insight.pattern.pattern_name}: {insight.pattern.pattern_value}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Button variant="outline" onClick={onPrev} className="w-full">
          ← 브랜드 정보 수정
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="text-center">
        <h1 className="text-3xl font-bold">🎨 컨셉 선택</h1>
        <p className="text-muted-foreground mt-2">
          채널 분석 기반으로 생성된 컨셉 중 하나를 선택하세요
        </p>
      </div>

      {/* 채널 적합도 안내 */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="py-3">
          <div className="flex items-center gap-2 text-sm text-blue-700">
            <span>💡</span>
            <span>
              채널 적합도는 분석된 {channelAnalysis?.analysis_metadata.sample_size}개 광고의
              성공 패턴과 일치도를 나타냅니다
            </span>
          </div>
        </CardContent>
      </Card>

      {/* 컨셉 카드들 */}
      <div className="space-y-4">
        {concepts.map((concept, index) => (
          <Card
            key={concept.id}
            className={`
              cursor-pointer transition-all
              ${selectedConceptId === concept.id
                ? 'border-primary shadow-lg ring-2 ring-primary/20'
                : 'hover:border-primary/50'
              }
            `}
            onClick={() => handleConceptSelect(concept)}
          >
            <CardContent className="p-6">
              {/* 헤더 */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {/* 선택 인디케이터 */}
                  <div
                    className={`
                      w-6 h-6 rounded-full border-2 flex items-center justify-center
                      ${selectedConceptId === concept.id
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-muted-foreground/30'
                      }
                    `}
                  >
                    {selectedConceptId === concept.id && <span className="text-sm">✓</span>}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{concept.title}</h3>
                    <p className="text-sm text-muted-foreground">{concept.description}</p>
                  </div>
                </div>

                {/* 채널 적합도 */}
                <div className="text-right">
                  <div className="text-sm text-muted-foreground mb-1">채널 적합도</div>
                  <div className={`
                    text-2xl font-bold
                    ${concept.channel_fit_score >= 85 ? 'text-green-600' :
                      concept.channel_fit_score >= 70 ? 'text-yellow-600' : 'text-orange-600'}
                  `}>
                    {concept.channel_fit_score}%
                  </div>
                </div>
              </div>

              {/* 훅 메시지 */}
              <div className="bg-muted/50 rounded-lg p-4 mb-4">
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  Hook Message
                </div>
                <p className="text-lg font-medium">"{concept.hook_message}"</p>
              </div>

              {/* 방향성 */}
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    비주얼 방향
                  </div>
                  <p className="text-sm">{concept.visual_direction}</p>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1">
                    카피 방향
                  </div>
                  <p className="text-sm">{concept.copy_direction}</p>
                </div>
              </div>

              {/* 컬러 팔레트 */}
              {concept.color_palette && concept.color_palette.length > 0 && (
                <div className="mb-4">
                  <div className="text-sm font-medium text-muted-foreground mb-2">
                    추천 컬러
                  </div>
                  <div className="flex gap-2">
                    {concept.color_palette.map((color, i) => (
                      <div
                        key={i}
                        className="w-8 h-8 rounded-lg border shadow-sm"
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* 근거 */}
              <div className="pt-4 border-t">
                <div className="text-sm font-medium text-muted-foreground mb-2">
                  분석 기반 근거
                </div>
                <p className="text-sm text-muted-foreground mb-2">{concept.reasoning}</p>
                <div className="flex flex-wrap gap-1">
                  {concept.based_on.map((basis, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {basis}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* 추천 포맷 */}
              <div className="mt-3 flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  추천: {concept.recommended_format}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 다시 생성 버튼 */}
      <Button
        variant="ghost"
        onClick={generateConcepts}
        className="w-full"
        disabled={isGenerating}
      >
        🔄 다른 컨셉 생성하기
      </Button>

      {/* 액션 버튼 */}
      <div className="flex gap-4">
        <Button variant="outline" onClick={onPrev} className="flex-1">
          ← 브랜드 정보 수정
        </Button>
        <Button
          onClick={handleNext}
          className="flex-1"
          size="lg"
          disabled={!selectedConceptId}
        >
          소재 생성하기 →
        </Button>
      </div>
    </div>
  );
}
