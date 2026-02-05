'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Campaign, Analysis, Concept, Creative } from '@/types/database';
import { PersonaCard } from '@/components/analysis/PersonaCard';
import { ConceptCard } from '@/components/concept/ConceptCard';
import { CreativeGallery } from '@/components/creative/CreativeGallery';

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [creatives, setCreatives] = useState<Creative[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProjectData();
  }, [campaignId]);

  const fetchProjectData = async () => {
    try {
      // Fetch campaign
      const campaignRes = await fetch(`/api/campaigns/${campaignId}`);
      const campaignData = await campaignRes.json();

      if (!campaignData.success) {
        setError('캠페인을 찾을 수 없습니다');
        return;
      }

      setCampaign(campaignData.data);

      // Fetch analysis if available
      try {
        const analysisRes = await fetch(`/api/campaigns/${campaignId}/analysis`);
        const analysisData = await analysisRes.json();
        if (analysisData.success) {
          setAnalysis(analysisData.data);
        }
      } catch (err) {
        console.log('No analysis data yet');
      }

      // Fetch concepts if available
      try {
        const conceptsRes = await fetch(`/api/campaigns/${campaignId}/concepts`);
        const conceptsData = await conceptsRes.json();
        if (conceptsData.success) {
          setConcepts(conceptsData.data);
        }
      } catch (err) {
        console.log('No concepts data yet');
      }

      // Fetch creatives if concepts exist
      if (concepts.length > 0) {
        const selectedConcept = concepts.find((c) => c.is_selected);
        if (selectedConcept) {
          const creativesRes = await fetch(`/api/concepts/${selectedConcept.id}/creatives`);
          const creativesData = await creativesRes.json();
          if (creativesData.success) {
            setCreatives(creativesData.data);
          }
        }
      }
    } catch (err) {
      setError('프로젝트 정보를 불러오는데 실패했습니다');
      console.error('Fetch project error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
            <p className="mt-4 text-gray-600">프로젝트를 불러오는 중...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-600 mb-4">오류 발생</div>
            <p className="text-gray-600">{error}</p>
            <Button onClick={() => router.push('/projects')} className="mt-4">
              목록으로 돌아가기
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-8">
          <Button variant="ghost" onClick={() => router.push('/projects')}>
            ← 목록으로
          </Button>
        </div>

        {/* Campaign Info */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">{campaign.brand_name}</CardTitle>
            <CardDescription>{campaign.product_description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-600">캠페인 목표</p>
                <p className="font-medium">{campaign.campaign_goal}</p>
              </div>
              <div>
                <p className="text-gray-600">타겟 오디언스</p>
                <p className="font-medium">{campaign.target_audience}</p>
              </div>
              <div>
                <p className="text-gray-600">플랫폼</p>
                <p className="font-medium">{campaign.platforms.join(', ')}</p>
              </div>
              <div>
                <p className="text-gray-600">상태</p>
                <p className="font-medium">{campaign.status}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Analysis Results */}
        {analysis && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">분석 결과</h2>
            <PersonaCard persona={analysis.target_persona} />
          </div>
        )}

        {/* Concepts */}
        {concepts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">크리에이티브 컨셉</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {concepts.map((concept) => (
                <ConceptCard
                  key={concept.id}
                  concept={concept}
                  isSelected={concept.is_selected}
                />
              ))}
            </div>
          </div>
        )}

        {/* Creatives */}
        {creatives.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">생성된 소재</h2>
            <CreativeGallery creatives={creatives} platforms={campaign.platforms} />
          </div>
        )}

        {/* Continue Campaign */}
        {campaign.status !== 'completed' && (
          <div className="text-center mt-8">
            <Button size="lg" onClick={() => router.push(`/create?campaign=${campaignId}`)}>
              캠페인 계속 진행하기
            </Button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
