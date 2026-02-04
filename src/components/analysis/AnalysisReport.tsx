'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Analysis } from '@/types/database';

interface AnalysisReportProps {
  analysis: Analysis;
}

export function AnalysisReport({ analysis }: AnalysisReportProps) {
  const { target_persona, platform_guidelines, trend_insights } = analysis;

  return (
    <div className="space-y-6">
      {/* 타겟 페르소나 */}
      <Card>
        <CardHeader>
          <CardTitle>타겟 페르소나</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">연령대</div>
              <div className="font-medium">{target_persona.age_range}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">성별</div>
              <div className="font-medium">{target_persona.gender}</div>
            </div>
          </div>

          <div>
            <div className="text-sm text-muted-foreground mb-2">관심사</div>
            <div className="flex flex-wrap gap-2">
              {target_persona.interests.map((interest, i) => (
                <Badge key={i} variant="secondary">
                  {interest}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <div className="text-sm text-muted-foreground mb-2">페인포인트</div>
            <ul className="list-disc list-inside space-y-1">
              {target_persona.pain_points.map((point, i) => (
                <li key={i} className="text-sm">
                  {point}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <div className="text-sm text-muted-foreground mb-2">동기</div>
            <ul className="list-disc list-inside space-y-1">
              {target_persona.motivations.map((motivation, i) => (
                <li key={i} className="text-sm">
                  {motivation}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* 플랫폼 가이드라인 */}
      <Card>
        <CardHeader>
          <CardTitle>플랫폼별 가이드라인</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {platform_guidelines.map((guide, i) => (
              <div key={i} className="p-4 bg-muted rounded-lg">
                <div className="font-medium mb-2">{guide.platform}</div>
                <div className="text-sm text-muted-foreground mb-2">
                  톤앤매너: {guide.tone}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Best Practices</div>
                    <ul className="text-sm space-y-1">
                      {guide.best_practices.map((practice, j) => (
                        <li key={j} className="text-green-600">
                          + {practice}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">피해야 할 것</div>
                    <ul className="text-sm space-y-1">
                      {guide.avoid.map((item, j) => (
                        <li key={j} className="text-red-600">
                          - {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 트렌드 인사이트 */}
      <Card>
        <CardHeader>
          <CardTitle>트렌드 인사이트</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {trend_insights.map((trend, i) => (
              <div
                key={i}
                className="flex items-start gap-4 p-3 border rounded-lg"
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{
                    backgroundColor: `hsl(${trend.relevance * 120}, 70%, 90%)`,
                    color: `hsl(${trend.relevance * 120}, 70%, 30%)`,
                  }}
                >
                  {Math.round(trend.relevance * 100)}%
                </div>
                <div>
                  <div className="font-medium">{trend.topic}</div>
                  <div className="text-sm text-muted-foreground">
                    {trend.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
