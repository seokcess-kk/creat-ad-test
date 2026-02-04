'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CampaignForm } from '@/components/campaign/CampaignForm';
import { AnalysisReport } from '@/components/analysis/AnalysisReport';
import { ConceptSelector } from '@/components/concept/ConceptSelector';
import { CreativeGallery } from '@/components/creative/CreativeGallery';
import { useCampaignStore } from '@/stores/campaign-store';
import type { CreateCampaignRequest, Campaign, Analysis, Concept, Creative } from '@/types/database';

const STEPS = [
  { number: 1, title: '캠페인 정보' },
  { number: 2, title: '분석 결과' },
  { number: 3, title: '컨셉 선택' },
  { number: 4, title: '소재 생성' },
  { number: 5, title: '결과 확인' },
];

export default function CreatePage() {
  const {
    currentStep,
    campaign,
    analysis,
    concepts,
    selectedConcept,
    creatives,
    isLoading,
    error,
    setStep,
    nextStep,
    prevStep,
    setCampaign,
    setAnalysis,
    setConcepts,
    selectConcept,
    setCreatives,
    setLoading,
    setError,
    reset,
  } = useCampaignStore();

  // 페이지 이탈 시 상태 초기화
  useEffect(() => {
    return () => {
      // reset(); // 필요시 주석 해제
    };
  }, []);

  // Step 1: 캠페인 생성 및 분석
  const handleCampaignSubmit = async (data: CreateCampaignRequest) => {
    setLoading(true);
    setError(null);

    try {
      // 캠페인 생성
      const campaignRes = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const campaignData = await campaignRes.json();

      if (!campaignData.success) {
        throw new Error(campaignData.error);
      }

      setCampaign(campaignData.data as Campaign);

      // 분석 실행
      const analyzeRes = await fetch(
        `/api/campaigns/${campaignData.data.id}/analyze`,
        { method: 'POST' }
      );
      const analyzeData = await analyzeRes.json();

      if (!analyzeData.success) {
        throw new Error(analyzeData.error);
      }

      setAnalysis(analyzeData.data as Analysis);
      nextStep(); // Step 2로 이동
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: 분석 확인 후 컨셉 생성
  const handleAnalysisConfirm = async () => {
    if (!campaign) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/campaigns/${campaign.id}/concepts`, {
        method: 'POST',
      });
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error);
      }

      setConcepts(data.data as Concept[]);
      nextStep(); // Step 3으로 이동
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: 컨셉 선택 후 소재 생성
  const handleConceptConfirm = async () => {
    if (!selectedConcept || !campaign) return;

    setLoading(true);
    setError(null);

    try {
      // 컨셉 선택 API 호출
      await fetch(`/api/concepts/${selectedConcept.id}/select`, {
        method: 'PUT',
      });

      setStep(4); // Step 4 (생성 중)로 이동

      // 소재 생성 API 호출
      const res = await fetch(`/api/concepts/${selectedConcept.id}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platforms: campaign.platforms,
          include_copy: true,
          resolution: '2k',
          variations: 2,
        }),
      });
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error);
      }

      setCreatives(data.data as Creative[]);
      setStep(5); // Step 5 (결과)로 이동
    } catch (err) {
      setError(err instanceof Error ? err.message : '오류가 발생했습니다');
      setStep(3); // 에러 시 Step 3으로 복귀
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold">
            Ad Creative Generator
          </Link>
          <Button variant="ghost" onClick={reset}>
            처음부터 다시
          </Button>
        </div>
      </header>

      {/* Progress */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            {STEPS.map((step, index) => (
              <div
                key={step.number}
                className={`flex items-center ${
                  index < STEPS.length - 1 ? 'flex-1' : ''
                }`}
              >
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                    currentStep >= step.number
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {step.number}
                </div>
                <span
                  className={`ml-2 text-sm hidden sm:block ${
                    currentStep >= step.number
                      ? 'text-foreground'
                      : 'text-muted-foreground'
                  }`}
                >
                  {step.title}
                </span>
                {index < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-4 ${
                      currentStep > step.number ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <Progress value={(currentStep / STEPS.length) * 100} />
        </div>
      </div>

      {/* Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-destructive/10 text-destructive rounded-lg">
            {error}
          </div>
        )}

        {/* Step 1: Campaign Form */}
        {currentStep === 1 && (
          <CampaignForm onSubmit={handleCampaignSubmit} />
        )}

        {/* Step 2: Analysis Report */}
        {currentStep === 2 && analysis && (
          <div className="space-y-6">
            <AnalysisReport analysis={analysis} />
            <div className="flex gap-4">
              <Button variant="outline" onClick={prevStep} className="flex-1">
                이전
              </Button>
              <Button
                onClick={handleAnalysisConfirm}
                className="flex-1"
                disabled={isLoading}
              >
                {isLoading ? '컨셉 생성 중...' : '컨셉 생성하기'}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Concept Selection */}
        {currentStep === 3 && concepts.length > 0 && (
          <div className="space-y-6">
            <ConceptSelector
              concepts={concepts}
              selectedConcept={selectedConcept}
              onSelect={selectConcept}
              onConfirm={handleConceptConfirm}
              isLoading={isLoading}
            />
            <Button variant="outline" onClick={prevStep} className="w-full">
              이전
            </Button>
          </div>
        )}

        {/* Step 4: Generating */}
        {currentStep === 4 && (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-6"></div>
            <h2 className="text-2xl font-bold mb-2">소재 생성 중...</h2>
            <p className="text-muted-foreground">
              AI가 광고 소재를 생성하고 있습니다. 잠시만 기다려주세요.
            </p>
          </div>
        )}

        {/* Step 5: Results */}
        {currentStep === 5 && creatives.length > 0 && campaign && (
          <CreativeGallery
            creatives={creatives}
            platforms={campaign.platforms}
          />
        )}
      </main>
    </div>
  );
}
