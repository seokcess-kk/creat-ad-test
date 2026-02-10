'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCampaignStore } from '@/stores/campaign-store';

interface Step3BrandInfoProps {
  onNext: () => void;
  onPrev: () => void;
}

// 광고 목표 옵션
const AD_GOALS = [
  { id: 'awareness', name: '브랜드 인지도', icon: '👁️', description: '브랜드를 알리고 싶어요' },
  { id: 'consideration', name: '관심 유도', icon: '💭', description: '제품에 관심을 갖게 하고 싶어요' },
  { id: 'conversion', name: '전환/구매', icon: '🛒', description: '구매나 행동을 유도하고 싶어요' },
  { id: 'engagement', name: '참여 증대', icon: '💬', description: '좋아요, 댓글, 공유를 늘리고 싶어요' },
];

// 타겟 연령대
const AGE_RANGES = ['10대', '20대 초반', '20대 후반', '30대', '40대', '50대+'];

// 브랜드 톤앤매너
const BRAND_TONES = [
  { id: 'professional', name: '전문적', emoji: '💼' },
  { id: 'friendly', name: '친근한', emoji: '😊' },
  { id: 'luxurious', name: '럭셔리', emoji: '✨' },
  { id: 'playful', name: '발랄한', emoji: '🎉' },
  { id: 'minimal', name: '미니멀', emoji: '⬜' },
  { id: 'bold', name: '강렬한', emoji: '🔥' },
];

export interface BrandInfo {
  brandName: string;
  productName: string;
  productDescription: string;
  adGoal: string;
  targetAges: string[];
  targetGender: 'all' | 'male' | 'female';
  brandTone: string;
  keyMessage: string;
  competitors: string;
}

export function Step3BrandInfo({ onNext, onPrev }: Step3BrandInfoProps) {
  const { channelAnalysis, setError } = useCampaignStore();

  const [brandInfo, setBrandInfo] = useState<BrandInfo>({
    brandName: '',
    productName: '',
    productDescription: '',
    adGoal: '',
    targetAges: [],
    targetGender: 'all',
    brandTone: '',
    keyMessage: '',
    competitors: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: keyof BrandInfo, value: string | string[]) => {
    setBrandInfo(prev => ({ ...prev, [field]: value }));
  };

  const toggleAge = (age: string) => {
    setBrandInfo(prev => ({
      ...prev,
      targetAges: prev.targetAges.includes(age)
        ? prev.targetAges.filter(a => a !== age)
        : [...prev.targetAges, age],
    }));
  };

  const handleSubmit = async () => {
    // 필수 필드 검증
    if (!brandInfo.brandName.trim()) {
      setError('브랜드/회사명을 입력해주세요');
      return;
    }
    if (!brandInfo.productName.trim()) {
      setError('제품/서비스명을 입력해주세요');
      return;
    }
    if (!brandInfo.adGoal) {
      setError('광고 목표를 선택해주세요');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // 브랜드 정보를 세션 스토리지에 저장 (컨셉 생성 시 사용)
      sessionStorage.setItem('brandInfo', JSON.stringify(brandInfo));
      onNext();
    } catch (err) {
      setError('정보 저장에 실패했습니다');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="text-center">
        <h1 className="text-3xl font-bold">📝 브랜드 정보 입력</h1>
        <p className="text-muted-foreground mt-2">
          채널 분석 결과를 바탕으로 최적화된 컨셉을 생성합니다
        </p>
      </div>

      {/* 분석 기반 추천 표시 */}
      {channelAnalysis && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <span className="text-2xl">💡</span>
              <div>
                <p className="font-medium">분석 기반 추천</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {channelAnalysis.concept_inputs.recommended_directions[0]?.direction}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 기본 정보 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-xl">🏢</span>
            기본 정보
          </CardTitle>
          <CardDescription>
            광고할 브랜드와 제품에 대해 알려주세요
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="brandName">브랜드/회사명 *</Label>
              <Input
                id="brandName"
                value={brandInfo.brandName}
                onChange={(e) => handleInputChange('brandName', e.target.value)}
                placeholder="예: 마이브랜드"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="productName">제품/서비스명 *</Label>
              <Input
                id="productName"
                value={brandInfo.productName}
                onChange={(e) => handleInputChange('productName', e.target.value)}
                placeholder="예: 수분크림 프로"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="productDescription">제품/서비스 설명</Label>
            <Textarea
              id="productDescription"
              value={brandInfo.productDescription}
              onChange={(e) => handleInputChange('productDescription', e.target.value)}
              placeholder="제품이나 서비스의 특징, 장점을 간단히 설명해주세요"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* 광고 목표 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-xl">🎯</span>
            광고 목표 *
          </CardTitle>
          <CardDescription>
            이 광고로 달성하고 싶은 목표를 선택하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-3">
            {AD_GOALS.map((goal) => (
              <button
                key={goal.id}
                onClick={() => handleInputChange('adGoal', goal.id)}
                className={`
                  p-4 rounded-xl border-2 text-left transition-all
                  ${brandInfo.adGoal === goal.id
                    ? 'border-primary bg-primary/5 shadow-md'
                    : 'border-border hover:border-primary/50'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{goal.icon}</span>
                  <div>
                    <div className="font-medium">{goal.name}</div>
                    <div className="text-sm text-muted-foreground">{goal.description}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 타겟 오디언스 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-xl">👥</span>
            타겟 오디언스
          </CardTitle>
          <CardDescription>
            광고의 주요 타겟을 선택하세요 (복수 선택 가능)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 연령대 */}
          <div>
            <Label className="mb-2 block">연령대</Label>
            <div className="flex flex-wrap gap-2">
              {AGE_RANGES.map((age) => (
                <button
                  key={age}
                  onClick={() => toggleAge(age)}
                  className={`
                    px-4 py-2 rounded-full border text-sm font-medium transition-all
                    ${brandInfo.targetAges.includes(age)
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border hover:border-primary/50'
                    }
                  `}
                >
                  {age}
                </button>
              ))}
            </div>
          </div>

          {/* 성별 */}
          <div>
            <Label className="mb-2 block">성별</Label>
            <div className="flex gap-2">
              {[
                { id: 'all', name: '전체' },
                { id: 'female', name: '여성' },
                { id: 'male', name: '남성' },
              ].map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleInputChange('targetGender', option.id)}
                  className={`
                    px-6 py-2 rounded-lg border text-sm font-medium transition-all
                    ${brandInfo.targetGender === option.id
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border hover:border-primary/50'
                    }
                  `}
                >
                  {option.name}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 브랜드 톤앤매너 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-xl">🎨</span>
            브랜드 톤앤매너
          </CardTitle>
          <CardDescription>
            브랜드의 분위기와 성격을 선택하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {BRAND_TONES.map((tone) => (
              <button
                key={tone.id}
                onClick={() => handleInputChange('brandTone', tone.id)}
                className={`
                  px-4 py-2 rounded-lg border text-sm font-medium transition-all flex items-center gap-2
                  ${brandInfo.brandTone === tone.id
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border hover:border-primary/50'
                  }
                `}
              >
                <span>{tone.emoji}</span>
                {tone.name}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 추가 정보 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-xl">✏️</span>
            추가 정보 (선택)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="keyMessage">핵심 메시지</Label>
            <Input
              id="keyMessage"
              value={brandInfo.keyMessage}
              onChange={(e) => handleInputChange('keyMessage', e.target.value)}
              placeholder="예: 24시간 지속되는 촉촉함"
            />
            <p className="text-xs text-muted-foreground">
              광고에서 꼭 전달하고 싶은 메시지가 있다면 입력하세요
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="competitors">경쟁사/벤치마크 브랜드</Label>
            <Input
              id="competitors"
              value={brandInfo.competitors}
              onChange={(e) => handleInputChange('competitors', e.target.value)}
              placeholder="예: 브랜드A, 브랜드B"
            />
          </div>
        </CardContent>
      </Card>

      {/* 입력 요약 */}
      <div className="bg-muted/50 rounded-xl p-4">
        <h3 className="font-medium mb-2">입력 요약</h3>
        <div className="flex flex-wrap gap-2">
          {brandInfo.brandName && (
            <Badge variant="secondary">{brandInfo.brandName}</Badge>
          )}
          {brandInfo.adGoal && (
            <Badge variant="secondary">
              {AD_GOALS.find(g => g.id === brandInfo.adGoal)?.name}
            </Badge>
          )}
          {brandInfo.targetAges.length > 0 && (
            <Badge variant="secondary">{brandInfo.targetAges.join(', ')}</Badge>
          )}
          {brandInfo.brandTone && (
            <Badge variant="secondary">
              {BRAND_TONES.find(t => t.id === brandInfo.brandTone)?.name}
            </Badge>
          )}
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="flex gap-4">
        <Button variant="outline" onClick={onPrev} className="flex-1">
          ← 분석 결과 보기
        </Button>
        <Button
          onClick={handleSubmit}
          className="flex-1"
          size="lg"
          disabled={isSubmitting || !brandInfo.brandName || !brandInfo.productName || !brandInfo.adGoal}
        >
          {isSubmitting ? '저장 중...' : '컨셉 생성하기 →'}
        </Button>
      </div>
    </div>
  );
}
