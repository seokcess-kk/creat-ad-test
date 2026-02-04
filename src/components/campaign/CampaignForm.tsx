'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useCampaignStore } from '@/stores/campaign-store';
import type { CampaignGoal, Platform, CreateCampaignRequest } from '@/types/database';
import { CAMPAIGN_GOALS, PLATFORM_SPECS } from '@/types/database';

interface CampaignFormProps {
  onSubmit: (data: CreateCampaignRequest) => Promise<void>;
}

export function CampaignForm({ onSubmit }: CampaignFormProps) {
  const { isLoading, setLoading, setError } = useCampaignStore();

  const [formData, setFormData] = useState<CreateCampaignRequest>({
    brand_name: '',
    product_description: '',
    campaign_goal: 'awareness',
    target_audience: '',
    platforms: [],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.platforms.length === 0) {
      setError('최소 1개의 플랫폼을 선택해주세요');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onSubmit(formData);
    } catch (error) {
      setError(error instanceof Error ? error.message : '오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  const togglePlatform = (platform: Platform) => {
    setFormData((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter((p) => p !== platform)
        : [...prev.platforms, platform],
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>캠페인 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="brand_name">브랜드/제품명 *</Label>
            <Input
              id="brand_name"
              value={formData.brand_name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, brand_name: e.target.value }))
              }
              placeholder="예: 에코프렌즈"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="product_description">제품/서비스 설명 *</Label>
            <Textarea
              id="product_description"
              value={formData.product_description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  product_description: e.target.value,
                }))
              }
              placeholder="제품의 특징, 장점, 타겟 고객 등을 설명해주세요"
              rows={4}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="target_audience">타겟 오디언스 *</Label>
            <Input
              id="target_audience"
              value={formData.target_audience}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  target_audience: e.target.value,
                }))
              }
              placeholder="예: 20-35세 환경에 관심 있는 직장인"
              required
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>캠페인 목표</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(Object.entries(CAMPAIGN_GOALS) as [CampaignGoal, { label: string; description: string }][]).map(
              ([key, { label, description }]) => (
                <div
                  key={key}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    formData.campaign_goal === key
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, campaign_goal: key }))
                  }
                >
                  <div className="font-medium">{label}</div>
                  <div className="text-sm text-muted-foreground">{description}</div>
                </div>
              )
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>타겟 플랫폼 *</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {(Object.entries(PLATFORM_SPECS) as [Platform, { name: string }][]).map(
              ([key, { name }]) => (
                <div
                  key={key}
                  className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                    formData.platforms.includes(key)
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => togglePlatform(key)}
                >
                  <Checkbox
                    checked={formData.platforms.includes(key)}
                    onCheckedChange={() => togglePlatform(key)}
                  />
                  <span>{name}</span>
                </div>
              )
            )}
          </div>
        </CardContent>
      </Card>

      <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
        {isLoading ? '처리 중...' : '분석 시작하기'}
      </Button>
    </form>
  );
}
