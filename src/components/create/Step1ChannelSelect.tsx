'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useCampaignStore } from '@/stores/campaign-store';
import type { Platform } from '@/types/database';

// 채널 정보 정의
const CHANNELS: {
  id: Platform;
  name: string;
  icon: string;
  description: string;
  supported: boolean;
}[] = [
  {
    id: 'instagram_feed',
    name: 'Instagram Feed',
    icon: '📸',
    description: '정사각형/세로 이미지, 캐러셀',
    supported: true,
  },
  {
    id: 'instagram_story',
    name: 'Instagram Story',
    icon: '📱',
    description: '풀스크린 세로 포맷',
    supported: true,
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: '🎵',
    description: '숏폼 세로 영상/이미지',
    supported: true,
  },
  {
    id: 'threads',
    name: 'Threads',
    icon: '🧵',
    description: '텍스트 중심 + 이미지',
    supported: true,
  },
  {
    id: 'youtube_shorts',
    name: 'YouTube Shorts',
    icon: '▶️',
    description: '숏폼 세로 영상',
    supported: true,
  },
  {
    id: 'youtube_ads',
    name: 'YouTube Ads',
    icon: '🎬',
    description: '가로 영상 광고',
    supported: true,
  },
];

// 업종 목록
const INDUSTRIES = [
  { id: 'cosmetics', name: '화장품/뷰티' },
  { id: 'fashion', name: '패션/의류' },
  { id: 'food', name: '식품/음료' },
  { id: 'tech', name: '테크/전자' },
  { id: 'fitness', name: '피트니스/건강' },
  { id: 'finance', name: '금융/보험' },
  { id: 'education', name: '교육/학습' },
  { id: 'travel', name: '여행/관광' },
  { id: 'automotive', name: '자동차/모빌리티' },
  { id: 'gaming', name: '게임/엔터테인먼트' },
];

interface Step1ChannelSelectProps {
  onNext: () => void;
}

export function Step1ChannelSelect({ onNext }: Step1ChannelSelectProps) {
  const { selectedChannel, industry, setSelectedChannel, setIndustry, setError } = useCampaignStore();
  const [customIndustry, setCustomIndustry] = useState('');

  const handleChannelSelect = (channel: Platform) => {
    setSelectedChannel(channel);
  };

  const handleIndustrySelect = (industryId: string) => {
    setIndustry(industryId);
    setCustomIndustry('');
  };

  const handleCustomIndustryChange = (value: string) => {
    setCustomIndustry(value);
    if (value.trim()) {
      setIndustry(value.trim());
    }
  };

  const handleNext = () => {
    if (!selectedChannel) {
      setError('채널을 선택해주세요');
      return;
    }
    if (!industry) {
      setError('업종을 선택해주세요');
      return;
    }
    setError(null);
    onNext();
  };

  return (
    <div className="space-y-8">
      {/* 채널 선택 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">1️⃣</span>
            채널 선택
          </CardTitle>
          <CardDescription>
            광고를 게재할 채널을 선택하세요. 채널별 맞춤 분석과 최적화된 소재를 생성합니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {CHANNELS.map((channel) => (
              <button
                key={channel.id}
                onClick={() => handleChannelSelect(channel.id)}
                disabled={!channel.supported}
                className={`
                  relative p-4 rounded-xl border-2 text-left transition-all
                  ${
                    selectedChannel === channel.id
                      ? 'border-primary bg-primary/5 shadow-md'
                      : 'border-border hover:border-primary/50 hover:bg-muted/50'
                  }
                  ${!channel.supported ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                {/* 선택 표시 */}
                {selectedChannel === channel.id && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-primary-foreground text-sm">✓</span>
                  </div>
                )}

                <div className="text-3xl mb-2">{channel.icon}</div>
                <div className="font-semibold">{channel.name}</div>
                <div className="text-sm text-muted-foreground mt-1">
                  {channel.description}
                </div>

                {!channel.supported && (
                  <div className="text-xs text-amber-600 mt-2">준비 중</div>
                )}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 업종 선택 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">2️⃣</span>
            업종 선택
          </CardTitle>
          <CardDescription>
            업종에 따라 경쟁사 분석과 트렌드 인사이트가 달라집니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 업종 버튼들 */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {INDUSTRIES.map((ind) => (
              <button
                key={ind.id}
                onClick={() => handleIndustrySelect(ind.id)}
                className={`
                  px-4 py-3 rounded-lg border text-sm font-medium transition-all
                  ${
                    industry === ind.id
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border hover:border-primary/50'
                  }
                `}
              >
                {ind.name}
              </button>
            ))}
          </div>

          {/* 직접 입력 */}
          <div className="pt-4 border-t">
            <Label htmlFor="customIndustry" className="text-sm text-muted-foreground">
              또는 직접 입력
            </Label>
            <Input
              id="customIndustry"
              value={customIndustry}
              onChange={(e) => handleCustomIndustryChange(e.target.value)}
              placeholder="예: 펫케어, 인테리어, 보석 등"
              className="mt-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* 선택 요약 및 다음 버튼 */}
      <div className="bg-muted/50 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-medium">선택 요약</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {selectedChannel
                ? `${CHANNELS.find((c) => c.id === selectedChannel)?.name}`
                : '채널 미선택'}
              {' / '}
              {industry
                ? INDUSTRIES.find((i) => i.id === industry)?.name || industry
                : '업종 미선택'}
            </p>
          </div>
          <Button
            onClick={handleNext}
            size="lg"
            disabled={!selectedChannel || !industry}
            className="min-w-[200px]"
          >
            채널 분석 시작 →
          </Button>
        </div>
      </div>
    </div>
  );
}
