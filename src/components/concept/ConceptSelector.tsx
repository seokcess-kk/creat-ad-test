'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Concept } from '@/types/database';

interface ConceptSelectorProps {
  concepts: Concept[];
  selectedConcept: Concept | null;
  onSelect: (concept: Concept) => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function ConceptSelector({
  concepts,
  selectedConcept,
  onSelect,
  onConfirm,
  isLoading,
}: ConceptSelectorProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">크리에이티브 컨셉 선택</h2>
        <p className="text-muted-foreground">
          AI가 3개의 컨셉을 제안했습니다. 마음에 드는 컨셉을 선택해주세요.
        </p>
      </div>

      <div className="space-y-4">
        {concepts.map((concept) => (
          <Card
            key={concept.id}
            className={`cursor-pointer transition-all ${
              selectedConcept?.id === concept.id
                ? 'ring-2 ring-primary border-primary'
                : 'hover:border-primary/50'
            }`}
            onClick={() => onSelect(concept)}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{concept.title}</CardTitle>
                {selectedConcept?.id === concept.id && (
                  <Badge>선택됨</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">{concept.description}</p>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-medium mb-1">비주얼 방향</div>
                  <div className="text-muted-foreground">
                    {concept.visual_direction}
                  </div>
                </div>
                <div>
                  <div className="font-medium mb-1">카피 방향</div>
                  <div className="text-muted-foreground">
                    {concept.copy_direction}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  {concept.color_palette.map((color, i) => (
                    <div
                      key={i}
                      className="w-6 h-6 rounded-full border"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
                <div className="flex flex-wrap gap-1">
                  {concept.mood_keywords.map((keyword, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      #{keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Button
        onClick={onConfirm}
        className="w-full"
        size="lg"
        disabled={!selectedConcept || isLoading}
      >
        {isLoading ? '소재 생성 중...' : '이 컨셉으로 소재 생성하기'}
      </Button>
    </div>
  );
}
