'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useCampaignStore } from '@/stores/campaign-store';
import {
  Step1ChannelSelect,
  Step2ChannelAnalysis,
  Step3BrandInfo,
  Step4ConceptSelect,
  Step5CreativeGenerate,
  Step6Result,
  type GeneratedCreative,
} from '@/components/create';

// Channel-First v2.0 6단계 플로우
const STEPS = [
  { number: 1, title: '채널 선택', icon: '📺' },
  { number: 2, title: '채널 분석', icon: '🔍' },
  { number: 3, title: '브랜드 정보', icon: '📝' },
  { number: 4, title: '컨셉 선택', icon: '🎨' },
  { number: 5, title: '소재 생성', icon: '✨' },
  { number: 6, title: '결과 확인', icon: '🎉' },
];

export default function CreatePage() {
  const {
    currentStep,
    error,
    setStep,
    nextStep,
    prevStep,
    setError,
    reset,
  } = useCampaignStore();

  const [generatedCreatives, setGeneratedCreatives] = useState<GeneratedCreative[]>([]);

  // 스텝 네비게이션 핸들러
  const handleNextStep = () => {
    setError(null);
    nextStep();
  };

  const handlePrevStep = () => {
    setError(null);
    prevStep();
  };

  // 소재 생성 완료 핸들러
  const handleCreativeComplete = (creatives: GeneratedCreative[]) => {
    setGeneratedCreatives(creatives);
    nextStep(); // Step 6으로 이동
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b sticky top-0 bg-background z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">🚀</span>
            <span className="text-xl font-bold">Channel-First Ad Generator</span>
          </Link>
          <Button variant="ghost" onClick={reset}>
            처음부터 다시
          </Button>
        </div>
      </header>

      {/* Progress */}
      <div className="border-b bg-muted/30">
        <div className="container mx-auto px-4 py-6">
          {/* Step Indicators */}
          <div className="flex items-center justify-between mb-4">
            {STEPS.map((step, index) => (
              <div
                key={step.number}
                className={`flex items-center ${
                  index < STEPS.length - 1 ? 'flex-1' : ''
                }`}
              >
                <div
                  className={`
                    flex items-center justify-center w-10 h-10 rounded-full text-lg
                    transition-all duration-300
                    ${
                      currentStep > step.number
                        ? 'bg-green-500 text-white'
                        : currentStep === step.number
                        ? 'bg-primary text-primary-foreground shadow-lg scale-110'
                        : 'bg-muted text-muted-foreground'
                    }
                  `}
                >
                  {currentStep > step.number ? '✓' : step.icon}
                </div>
                <span
                  className={`
                    ml-2 text-sm hidden md:block font-medium
                    ${
                      currentStep >= step.number
                        ? 'text-foreground'
                        : 'text-muted-foreground'
                    }
                  `}
                >
                  {step.title}
                </span>
                {index < STEPS.length - 1 && (
                  <div
                    className={`
                      flex-1 h-1 mx-4 rounded-full transition-all duration-300
                      ${currentStep > step.number ? 'bg-green-500' : 'bg-muted'}
                    `}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Progress Bar */}
          <Progress value={(currentStep / STEPS.length) * 100} className="h-2" />
          <p className="text-sm text-muted-foreground mt-2 text-center">
            {currentStep} / {STEPS.length} 단계
          </p>
        </div>
      </div>

      {/* Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-destructive/10 text-destructive rounded-lg flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-sm hover:underline"
            >
              닫기
            </button>
          </div>
        )}

        {/* Step 1: Channel & Industry Selection */}
        {currentStep === 1 && (
          <Step1ChannelSelect onNext={handleNextStep} />
        )}

        {/* Step 2: Channel Analysis */}
        {currentStep === 2 && (
          <Step2ChannelAnalysis
            onNext={handleNextStep}
            onPrev={handlePrevStep}
          />
        )}

        {/* Step 3: Brand Information */}
        {currentStep === 3 && (
          <Step3BrandInfo
            onNext={handleNextStep}
            onPrev={handlePrevStep}
          />
        )}

        {/* Step 4: Concept Selection */}
        {currentStep === 4 && (
          <Step4ConceptSelect
            onNext={handleNextStep}
            onPrev={handlePrevStep}
          />
        )}

        {/* Step 5: Creative Generation */}
        {currentStep === 5 && (
          <Step5CreativeGenerate onComplete={handleCreativeComplete} />
        )}

        {/* Step 6: Results */}
        {currentStep === 6 && generatedCreatives.length > 0 && (
          <Step6Result creatives={generatedCreatives} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t mt-auto">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div>Channel-First Ad Generator v2.0</div>
            <div className="flex items-center gap-4">
              <Link href="/help" className="hover:text-foreground">
                도움말
              </Link>
              <Link href="/feedback" className="hover:text-foreground">
                피드백
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
