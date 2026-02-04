'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Concept } from '@/types/database';

interface ConceptCardProps {
  concept: Concept;
  isSelected?: boolean;
  onClick?: () => void;
}

export function ConceptCard({ concept, isSelected, onClick }: ConceptCardProps) {
  return (
    <Card
      className={`cursor-pointer transition-all ${
        isSelected
          ? 'ring-2 ring-primary border-primary'
          : 'hover:border-primary/50'
      }`}
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{concept.title}</CardTitle>
          {isSelected && <Badge>선택됨</Badge>}
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
          <ColorPalette colors={concept.color_palette} />
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
  );
}

interface ColorPaletteProps {
  colors: string[];
}

export function ColorPalette({ colors }: ColorPaletteProps) {
  return (
    <div className="flex items-center gap-2">
      {colors.map((color, i) => (
        <div
          key={i}
          className="w-6 h-6 rounded-full border"
          style={{ backgroundColor: color }}
          title={color}
        />
      ))}
    </div>
  );
}
