'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Creative } from '@/types/database';

interface ImagePreviewProps {
  creative: Creative;
  onDownload?: () => void;
}

export function ImagePreview({ creative, onDownload }: ImagePreviewProps) {
  return (
    <div className="space-y-2">
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
        {onDownload && (
          <Button variant="ghost" size="sm" onClick={onDownload}>
            다운로드
          </Button>
        )}
      </div>
    </div>
  );
}
