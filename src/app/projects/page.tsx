'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Campaign } from '@/types/database';

export default function ProjectsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const response = await fetch('/api/campaigns');
      const data = await response.json();

      if (data.success) {
        setCampaigns(data.data);
      } else {
        setError(data.error || '캠페인을 불러오는데 실패했습니다');
      }
    } catch (err) {
      setError('네트워크 오류가 발생했습니다');
      console.error('Fetch campaigns error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      draft: { label: '작성중', className: 'bg-gray-100 text-gray-800' },
      analyzing: { label: '분석중', className: 'bg-blue-100 text-blue-800' },
      planning: { label: '기획중', className: 'bg-yellow-100 text-yellow-800' },
      generating: { label: '생성중', className: 'bg-purple-100 text-purple-800' },
      completed: { label: '완료', className: 'bg-green-100 text-green-800' },
    };

    const statusInfo = statusMap[status] || statusMap.draft;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.className}`}>
        {statusInfo.label}
      </span>
    );
  };

  const getGoalLabel = (goal: string) => {
    const goalMap: Record<string, string> = {
      awareness: '인지도',
      conversion: '전환',
      engagement: '참여',
      traffic: '트래픽',
    };
    return goalMap[goal] || goal;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">내 프로젝트</h1>
            <p className="text-gray-600 mt-2">생성한 캠페인을 관리하고 확인하세요</p>
          </div>
          <Link href="/create">
            <Button size="lg">새 캠페인 만들기</Button>
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
            <p className="mt-4 text-gray-600">캠페인을 불러오는 중...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-red-600 mb-4">오류 발생</div>
            <p className="text-gray-600">{error}</p>
            <Button onClick={fetchCampaigns} className="mt-4">
              다시 시도
            </Button>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-600 mb-4">아직 생성된 캠페인이 없습니다</p>
            <Link href="/create">
              <Button>첫 캠페인 만들기</Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((campaign) => (
              <Link key={campaign.id} href={`/projects/${campaign.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <CardTitle className="text-xl">{campaign.brand_name}</CardTitle>
                      {getStatusBadge(campaign.status)}
                    </div>
                    <CardDescription className="line-clamp-2">
                      {campaign.product_description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">캠페인 목표:</span>
                        <span className="font-medium">{getGoalLabel(campaign.campaign_goal)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">타겟 플랫폼:</span>
                        <span className="font-medium">{campaign.platforms.length}개</span>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>생성일:</span>
                        <span>{new Date(campaign.created_at).toLocaleDateString('ko-KR')}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
