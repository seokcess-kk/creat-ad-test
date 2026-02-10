'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCampaignStore } from '@/stores/campaign-store';
import type { GeneratedCreative } from './Step5CreativeGenerate';

interface Step6ResultProps {
  creatives: GeneratedCreative[];
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

export function Step6Result({ creatives }: Step6ResultProps) {
  const { selectedChannel, industry, channelAnalysis, addAnotherChannel, reset } = useCampaignStore();

  const [selectedCreative, setSelectedCreative] = useState<GeneratedCreative | null>(
    creatives[0] || null
  );
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async (creative: GeneratedCreative) => {
    setIsDownloading(true);
    try {
      const response = await fetch(creative.image_url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ad-creative-${creative.id}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Download failed:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadAll = async () => {
    for (const creative of creatives) {
      await handleDownload(creative);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-6">
      {/* 성공 헤더 */}
      <div className="text-center py-8">
        <div className="text-6xl mb-4">🎉</div>
        <h1 className="text-3xl font-bold mb-2">소재 생성 완료!</h1>
        <p className="text-muted-foreground">
          {CHANNEL_NAMES[selectedChannel || '']}에 최적화된 {creatives.length}개의 소재가 생성되었습니다
        </p>
      </div>

      {/* 분석 적용 요약 */}
      {channelAnalysis && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">✅</span>
                <div>
                  <p className="font-medium text-green-800">분석 기반 최적화 적용</p>
                  <p className="text-sm text-green-600">
                    {channelAnalysis.validated_insights.filter(i =>
                      i.evidence_strength === 'strong' || i.evidence_strength === 'moderate'
                    ).length}개 검증된 인사이트 반영
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                분석 품질 {channelAnalysis.analysis_metadata.analysis_quality_score}점
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 메인 컨텐츠 */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* 왼쪽: 선택된 크리에이티브 미리보기 */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center justify-between">
              <span>미리보기</span>
              {selectedCreative && (
                <Badge variant="secondary">
                  품질: {selectedCreative.quality_score}%
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedCreative && (
              <div className="space-y-4">
                {/* 이미지 */}
                <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
                  <img
                    src={selectedCreative.image_url}
                    alt="Generated creative"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://via.placeholder.com/512?text=Preview';
                    }}
                  />
                </div>

                {/* 카피 */}
                <div className="space-y-3">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">헤드라인</span>
                      <button
                        onClick={() => handleCopyText(selectedCreative.copy.headline)}
                        className="text-xs text-primary hover:underline"
                      >
                        복사
                      </button>
                    </div>
                    <p className="font-medium">{selectedCreative.copy.headline}</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">본문</span>
                      <button
                        onClick={() => handleCopyText(selectedCreative.copy.body)}
                        className="text-xs text-primary hover:underline"
                      >
                        복사
                      </button>
                    </div>
                    <p className="text-sm">{selectedCreative.copy.body}</p>
                  </div>
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">CTA</span>
                      <button
                        onClick={() => handleCopyText(selectedCreative.copy.cta)}
                        className="text-xs text-primary hover:underline"
                      >
                        복사
                      </button>
                    </div>
                    <p className="font-medium text-primary">{selectedCreative.copy.cta}</p>
                  </div>
                </div>

                {/* 다운로드 버튼 */}
                <Button
                  onClick={() => handleDownload(selectedCreative)}
                  className="w-full"
                  disabled={isDownloading}
                >
                  {isDownloading ? '다운로드 중...' : '이 소재 다운로드'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 오른쪽: 소재 목록 및 옵션 */}
        <div className="space-y-6">
          {/* 소재 목록 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">생성된 소재 ({creatives.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {creatives.map((creative) => (
                  <button
                    key={creative.id}
                    onClick={() => setSelectedCreative(creative)}
                    className={`
                      relative aspect-square rounded-lg overflow-hidden border-2 transition-all
                      ${selectedCreative?.id === creative.id
                        ? 'border-primary ring-2 ring-primary/20'
                        : 'border-transparent hover:border-primary/50'
                      }
                    `}
                  >
                    <img
                      src={creative.image_url}
                      alt={`Creative ${creative.id}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/128?text=Ad';
                      }}
                    />
                    {selectedCreative?.id === creative.id && (
                      <div className="absolute top-1 right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                        <span className="text-primary-foreground text-xs">✓</span>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 채널 최적화 정보 */}
          {selectedCreative?.channel_optimization && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <span>📐</span>
                  채널 최적화
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">포맷</span>
                  <Badge variant={selectedCreative.channel_optimization.format_match ? 'default' : 'secondary'}>
                    {selectedCreative.format}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">비율</span>
                  <span className="text-sm">{selectedCreative.channel_optimization.aspect_ratio}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">해상도</span>
                  <span className="text-sm">
                    {selectedCreative.dimensions.width} x {selectedCreative.dimensions.height}
                  </span>
                </div>
                {selectedCreative.channel_optimization.recommendations.length > 0 && (
                  <div className="pt-3 border-t">
                    <p className="text-sm text-muted-foreground mb-2">추천 사항</p>
                    <ul className="text-sm space-y-1">
                      {selectedCreative.channel_optimization.recommendations.map((rec, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-primary">•</span>
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* 전체 다운로드 */}
          <Button
            variant="outline"
            onClick={handleDownloadAll}
            className="w-full"
            disabled={isDownloading}
          >
            📦 모든 소재 다운로드 ({creatives.length}개)
          </Button>
        </div>
      </div>

      {/* 액션 버튼들 */}
      <Card className="bg-muted/30">
        <CardContent className="py-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              variant="outline"
              onClick={addAnotherChannel}
              className="flex-1"
            >
              🔄 다른 채널로 만들기
            </Button>
            <Button
              variant="outline"
              onClick={reset}
              className="flex-1"
            >
              🆕 처음부터 새로 만들기
            </Button>
            <Link href="/dashboard" className="flex-1">
              <Button className="w-full">
                📊 대시보드로 이동
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* 피드백 섹션 */}
      <div className="text-center py-4">
        <p className="text-sm text-muted-foreground">
          생성된 소재가 마음에 드셨나요?{' '}
          <button className="text-primary hover:underline">피드백 남기기</button>
        </p>
      </div>
    </div>
  );
}
