'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import type { Creative, Platform } from '@/types/database';
import { PLATFORM_SPECS } from '@/types/database';

interface CreativeGalleryProps {
  creatives: Creative[];
  platforms: Platform[];
}

export function CreativeGallery({ creatives, platforms }: CreativeGalleryProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const imageCreatives = creatives.filter((c) => c.type === 'image');
  const copyCreatives = creatives.filter((c) => c.type === 'copy');

  const handleCopyText = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleDownloadAll = async () => {
    for (const creative of imageCreatives) {
      if (creative.content_url) {
        await handleDownload(
          creative.content_url,
          `ad-${creative.platform}-${creative.id.slice(0, 8)}.png`
        );
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">생성 완료!</h2>
        <p className="text-muted-foreground">
          {imageCreatives.length}개의 이미지와 {copyCreatives.length}개의 카피가
          생성되었습니다.
        </p>
      </div>

      <Tabs defaultValue={platforms[0]} className="w-full">
        <TabsList className="w-full justify-start flex-wrap h-auto gap-2 bg-transparent p-0">
          {platforms.map((platform) => (
            <TabsTrigger
              key={platform}
              value={platform}
              className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              {PLATFORM_SPECS[platform].name}
            </TabsTrigger>
          ))}
        </TabsList>

        {platforms.map((platform) => {
          const platformImages = imageCreatives.filter(
            (c) => c.platform === platform
          );
          const platformCopy = copyCreatives.find(
            (c) => c.platform === platform
          );

          return (
            <TabsContent key={platform} value={platform} className="space-y-4">
              {/* 이미지 갤러리 */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">이미지</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {platformImages.map((creative) => (
                      <div key={creative.id} className="space-y-2">
                        <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
                          {creative.content_url ? (
                            <Image
                              src={creative.content_url}
                              alt="Generated ad creative"
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                              이미지 없음
                            </div>
                          )}
                        </div>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-xs">
                            {creative.resolution}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              creative.content_url &&
                              handleDownload(
                                creative.content_url,
                                `ad-${platform}-${creative.id.slice(0, 8)}.png`
                              )
                            }
                          >
                            다운로드
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* 카피 */}
              {platformCopy && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">카피</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="relative">
                      <pre className="whitespace-pre-wrap bg-muted p-4 rounded-lg text-sm">
                        {platformCopy.copy_text}
                      </pre>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() =>
                          platformCopy.copy_text &&
                          handleCopyText(platformCopy.copy_text, platformCopy.id)
                        }
                      >
                        {copiedId === platformCopy.id ? '복사됨!' : '복사'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          );
        })}
      </Tabs>

      <div className="flex gap-4">
        <Button onClick={handleDownloadAll} className="flex-1" size="lg">
          전체 다운로드
        </Button>
        <Button variant="outline" className="flex-1" size="lg">
          다시 생성하기
        </Button>
      </div>
    </div>
  );
}
