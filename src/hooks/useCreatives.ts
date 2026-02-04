'use client';

import { useState, useCallback } from 'react';
import type { Creative, Platform } from '@/types/database';

interface GenerateOptions {
  platforms: Platform[];
  include_copy?: boolean;
  resolution?: '2k' | '4k';
  variations?: number;
}

export function useCreatives() {
  const [creatives, setCreatives] = useState<Creative[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateCreatives = useCallback(
    async (conceptId: string, options: GenerateOptions) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/concepts/${conceptId}/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            platforms: options.platforms,
            include_copy: options.include_copy ?? true,
            resolution: options.resolution ?? '2k',
            variations: options.variations ?? 2,
          }),
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error);
        }

        setCreatives(result.data);
        return result.data as Creative[];
      } catch (err) {
        const message = err instanceof Error ? err.message : '소재 생성에 실패했습니다';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const downloadCreative = useCallback(async (creativeId: string) => {
    try {
      const response = await fetch(`/api/creatives/${creativeId}/download`);

      if (!response.ok) {
        throw new Error('다운로드에 실패했습니다');
      }

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch?.[1] || `creative-${creativeId}.png`;

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      const message = err instanceof Error ? err.message : '다운로드에 실패했습니다';
      setError(message);
      throw err;
    }
  }, []);

  const downloadAll = useCallback(async () => {
    const imageCreatives = creatives.filter((c) => c.type === 'image');
    for (const creative of imageCreatives) {
      await downloadCreative(creative.id);
    }
  }, [creatives, downloadCreative]);

  return {
    creatives,
    isLoading,
    error,
    generateCreatives,
    downloadCreative,
    downloadAll,
    setCreatives,
    setError,
  };
}
