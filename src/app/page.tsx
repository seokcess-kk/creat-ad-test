import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            AI 광고 소재 생성기
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            분석부터 기획, 생성까지. AI가 당신의 브랜드에 맞는
            <br />
            완벽한 광고 소재를 만들어드립니다.
          </p>
          <Link href="/create">
            <Button size="lg" className="text-lg px-8 py-6">
              무료로 시작하기
            </Button>
          </Link>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">📊</span> AI 분석
              </CardTitle>
              <CardDescription>
                타겟 오디언스, 경쟁사, 트렌드를 자동 분석
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                브랜드 정보만 입력하면 AI가 타겟 페르소나, 플랫폼별 가이드라인,
                최신 트렌드를 분석합니다.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">💡</span> 컨셉 기획
              </CardTitle>
              <CardDescription>
                데이터 기반의 크리에이티브 컨셉 제안
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                분석 결과를 바탕으로 3개의 차별화된 광고 컨셉을 제안합니다.
                비주얼과 카피 방향까지 포함됩니다.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span className="text-2xl">🎨</span> 소재 생성
              </CardTitle>
              <CardDescription>
                Nano Banana Pro로 고품질 이미지 생성
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                선택한 컨셉을 바탕으로 플랫폼별 최적화된 고해상도 이미지와
                카피를 자동 생성합니다.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Supported Platforms */}
        <div className="text-center mb-16">
          <h2 className="text-2xl font-bold mb-8">지원 플랫폼</h2>
          <div className="flex flex-wrap justify-center gap-4">
            {[
              'Instagram Feed',
              'Instagram Stories',
              'TikTok',
              'Threads',
              'YouTube Shorts',
              'YouTube Ads',
            ].map((platform) => (
              <div
                key={platform}
                className="px-4 py-2 bg-muted rounded-full text-sm font-medium"
              >
                {platform}
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center bg-primary/5 rounded-2xl p-12">
          <h2 className="text-3xl font-bold mb-4">
            지금 바로 시작하세요
          </h2>
          <p className="text-muted-foreground mb-8">
            5분 안에 전문가 수준의 광고 소재를 만들 수 있습니다.
          </p>
          <Link href="/create">
            <Button size="lg">
              광고 소재 만들기
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
