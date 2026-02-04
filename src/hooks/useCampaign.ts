'use client';

import { useState, useCallback } from 'react';
import type { Campaign, CreateCampaignRequest } from '@/types/database';

export function useCampaign() {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCampaign = useCallback(async (data: CreateCampaignRequest) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      setCampaign(result.data);
      return result.data as Campaign;
    } catch (err) {
      const message = err instanceof Error ? err.message : '캠페인 생성에 실패했습니다';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getCampaign = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/campaigns/${id}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      setCampaign(result.data);
      return result.data as Campaign;
    } catch (err) {
      const message = err instanceof Error ? err.message : '캠페인을 가져오는데 실패했습니다';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const analyzeCampaign = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/campaigns/${id}/analyze`, {
        method: 'POST',
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : '분석에 실패했습니다';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    campaign,
    isLoading,
    error,
    createCampaign,
    getCampaign,
    analyzeCampaign,
    setCampaign,
    setError,
  };
}
