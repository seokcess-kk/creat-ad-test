'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { TargetPersona } from '@/types/database';

interface PersonaCardProps {
  persona: TargetPersona;
}

export function PersonaCard({ persona }: PersonaCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>타겟 페르소나</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-muted-foreground">연령대</div>
            <div className="font-medium">{persona.age_range}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">성별</div>
            <div className="font-medium">{persona.gender}</div>
          </div>
        </div>

        <div>
          <div className="text-sm text-muted-foreground mb-2">관심사</div>
          <div className="flex flex-wrap gap-2">
            {persona.interests.map((interest, i) => (
              <Badge key={i} variant="secondary">
                {interest}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <div className="text-sm text-muted-foreground mb-2">페인포인트</div>
          <ul className="list-disc list-inside space-y-1">
            {persona.pain_points.map((point, i) => (
              <li key={i} className="text-sm">
                {point}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="text-sm text-muted-foreground mb-2">동기</div>
          <ul className="list-disc list-inside space-y-1">
            {persona.motivations.map((motivation, i) => (
              <li key={i} className="text-sm">
                {motivation}
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
