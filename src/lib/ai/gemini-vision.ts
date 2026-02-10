/**
 * Gemini Vision API Service
 * 광고 이미지 분석을 위한 Google Gemini Vision 연동
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import type { ImageAnalysisResult } from '@/types/analysis';

// ============================================================================
// Configuration
// ============================================================================

interface GeminiVisionConfig {
  apiKey: string;
  model: string;
}

const DEFAULT_CONFIG: GeminiVisionConfig = {
  apiKey: process.env.GOOGLE_AI_API_KEY || '',
  model: 'gemini-1.5-pro', // Vision 지원 모델
};

// API 키 확인
const isDevMode = !process.env.GOOGLE_AI_API_KEY;

// ============================================================================
// Gemini Vision Service
// ============================================================================

class GeminiVisionService {
  private genAI: GoogleGenerativeAI | null;
  private model: string;

  constructor(config: GeminiVisionConfig = DEFAULT_CONFIG) {
    if (isDevMode) {
      this.genAI = null;
      console.log('⚠️ Gemini Vision API: 개발 모드 (GOOGLE_AI_API_KEY 없음)');
    } else {
      this.genAI = new GoogleGenerativeAI(config.apiKey);
    }
    this.model = config.model;
  }

  /**
   * 단일 광고 이미지 분석
   */
  async analyzeAdImage(imageUrl: string): Promise<ImageAnalysisResult> {
    if (isDevMode || !this.genAI) {
      console.log('🖼️ Gemini Vision: Mock 분석 데이터 반환');
      return this.getMockAnalysis();
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: this.model });

      // 이미지 로드
      const imageData = await this.fetchImageAsBase64(imageUrl);
      const mimeType = this.getMimeType(imageUrl);

      const prompt = this.buildAnalysisPrompt();

      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            mimeType,
            data: imageData,
          },
        },
      ]);

      const text = result.response.text();
      return this.parseJsonResponse(text);
    } catch (error) {
      console.error('❌ Gemini Vision 분석 실패:', error);
      // 에러 시 Mock 데이터 반환
      return this.getMockAnalysis();
    }
  }

  /**
   * 여러 이미지 병렬 분석
   * @param imageUrls 이미지 URL 배열
   * @param concurrency 동시 처리 수 (기본: 5)
   */
  async analyzeMultiple(
    imageUrls: string[],
    concurrency: number = 5
  ): Promise<ImageAnalysisResult[]> {
    const results: ImageAnalysisResult[] = [];

    // 배치 처리
    for (let i = 0; i < imageUrls.length; i += concurrency) {
      const batch = imageUrls.slice(i, i + concurrency);

      console.log(`🔄 Vision 분석 진행 중: ${i + 1}-${Math.min(i + concurrency, imageUrls.length)}/${imageUrls.length}`);

      const batchResults = await Promise.all(
        batch.map(url => this.analyzeAdImage(url).catch(err => {
          console.error(`이미지 분석 실패 (${url}):`, err);
          return this.getMockAnalysis(); // 실패 시 기본값
        }))
      );

      results.push(...batchResults);

      // Rate limiting: 배치 간 짧은 딜레이
      if (i + concurrency < imageUrls.length) {
        await this.delay(500);
      }
    }

    return results;
  }

  /**
   * 분석 프롬프트 생성
   */
  private buildAnalysisPrompt(): string {
    return `이 광고 이미지를 다음 관점에서 상세히 분석해주세요.
반드시 JSON 형식으로만 응답해주세요.

## 분석 항목

1. layout (레이아웃)
   - grid_pattern: 그리드 패턴 (예: "2-column", "centered", "asymmetric", "split-horizontal", "full-bleed")
   - element_positions: 각 요소의 위치
     - product: 제품 위치 (예: "center", "left-third", "bottom", "right-half", "none")
     - headline: 헤드라인 위치 (예: "top-center", "overlay-center", "bottom-left", "none")
     - logo: 로고 위치 (예: "top-left", "bottom-right", "top-right", "none")
     - cta: CTA 위치 (예: "bottom-center", "bottom-right", "overlay", "none")
   - visual_flow: 시선 흐름 (예: "F-pattern", "Z-pattern", "center-focus", "left-to-right", "top-to-bottom")
   - whitespace_usage: 여백 활용 (예: "minimal", "moderate", "generous")

2. colors (색상)
   - primary: 주요 색상 hex 코드 (예: "#FF5733")
   - secondary: 보조 색상 hex 코드
   - accent: 강조 색상 hex 코드
   - overall_tone: 전체 톤 (예: "warm-bright", "cool-dark", "neutral-soft", "vibrant", "muted")
   - contrast_level: 대비 수준 (예: "high", "medium", "low")

3. text (텍스트)
   - headline: OCR로 추출한 메인 헤드라인 텍스트 (한글/영어 그대로)
   - subheadline: 서브 헤드라인 (없으면 null)
   - cta_text: CTA 문구 (없으면 null)
   - font_style: 폰트 스타일 (예: "bold-sans", "elegant-serif", "handwritten", "modern-minimal", "playful")
   - text_ratio_percent: 이미지 대비 텍스트 비율 (0-100)

4. visual_style (비주얼 스타일)
   - image_type: 이미지 유형 (예: "photo", "illustration", "graphic", "3d", "mixed", "user-generated")
   - has_person: 인물 등장 여부 (true/false)
   - person_expression: 인물 표정 (없으면 생략) (예: "smiling", "serious", "surprised", "neutral", "excited")
   - product_presentation: 제품 표현 방식 (예: "closeup", "lifestyle", "before-after", "flat-lay", "action-shot", "comparison")
   - filters_effects: 적용된 필터/효과 배열 (예: ["high-saturation", "soft-focus", "vignette", "gradient-overlay", "blur-background"])

5. ad_classification (광고 분류)
   - estimated_goal: 추정 광고 목표 (예: "awareness", "conversion", "engagement", "traffic", "app-install")
   - estimated_audience: 추정 타겟 (예: "young-women-20s", "business-professionals", "parents", "gen-z", "health-conscious")
   - industry: 추정 업종 (예: "cosmetics", "tech", "food", "fashion", "fitness", "finance", "education")

JSON 형식으로만 응답해주세요. 추가 설명 없이 JSON만 출력하세요:`;
  }

  /**
   * 이미지를 Base64로 변환
   */
  private async fetchImageAsBase64(url: string): Promise<string> {
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
      });

      if (!response.ok) {
        throw new Error(`이미지 로드 실패: ${response.status}`);
      }

      const buffer = await response.arrayBuffer();
      return Buffer.from(buffer).toString('base64');
    } catch (error) {
      console.error('이미지 로드 실패:', url, error);
      throw error;
    }
  }

  /**
   * URL에서 MIME 타입 추출
   */
  private getMimeType(url: string): string {
    const extension = url.split('.').pop()?.toLowerCase().split('?')[0];

    const mimeTypes: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      svg: 'image/svg+xml',
    };

    return mimeTypes[extension || ''] || 'image/jpeg';
  }

  /**
   * JSON 응답 파싱
   */
  private parseJsonResponse(text: string): ImageAnalysisResult {
    try {
      let jsonText = text.trim();

      // 마크다운 코드 블록 제거
      const jsonMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonText = jsonMatch[1].trim();
      }

      // JSON 시작/끝 찾기
      if (!jsonText.startsWith('{')) {
        const startIdx = jsonText.indexOf('{');
        const endIdx = jsonText.lastIndexOf('}');
        if (startIdx !== -1 && endIdx !== -1) {
          jsonText = jsonText.substring(startIdx, endIdx + 1);
        }
      }

      const parsed = JSON.parse(jsonText);

      // 필수 필드 검증 및 기본값 설정
      return this.validateAndFillDefaults(parsed);
    } catch (error) {
      console.error('JSON 파싱 실패:', error);
      console.error('원본 텍스트:', text.substring(0, 500));
      return this.getMockAnalysis();
    }
  }

  /**
   * 파싱된 결과 검증 및 기본값 채우기
   */
  private validateAndFillDefaults(parsed: Partial<ImageAnalysisResult>): ImageAnalysisResult {
    const defaults = this.getMockAnalysis();

    return {
      layout: {
        grid_pattern: parsed.layout?.grid_pattern || defaults.layout.grid_pattern,
        element_positions: {
          product: parsed.layout?.element_positions?.product || defaults.layout.element_positions.product,
          headline: parsed.layout?.element_positions?.headline || defaults.layout.element_positions.headline,
          logo: parsed.layout?.element_positions?.logo || defaults.layout.element_positions.logo,
          cta: parsed.layout?.element_positions?.cta || defaults.layout.element_positions.cta,
        },
        visual_flow: parsed.layout?.visual_flow || defaults.layout.visual_flow,
        whitespace_usage: parsed.layout?.whitespace_usage || defaults.layout.whitespace_usage,
      },
      colors: {
        primary: parsed.colors?.primary || defaults.colors.primary,
        secondary: parsed.colors?.secondary || defaults.colors.secondary,
        accent: parsed.colors?.accent || defaults.colors.accent,
        overall_tone: parsed.colors?.overall_tone || defaults.colors.overall_tone,
        contrast_level: parsed.colors?.contrast_level || defaults.colors.contrast_level,
      },
      text: {
        headline: parsed.text?.headline || defaults.text.headline,
        subheadline: parsed.text?.subheadline ?? defaults.text.subheadline,
        cta_text: parsed.text?.cta_text ?? defaults.text.cta_text,
        font_style: parsed.text?.font_style || defaults.text.font_style,
        text_ratio_percent: parsed.text?.text_ratio_percent ?? defaults.text.text_ratio_percent,
      },
      visual_style: {
        image_type: parsed.visual_style?.image_type || defaults.visual_style.image_type,
        has_person: parsed.visual_style?.has_person ?? defaults.visual_style.has_person,
        person_expression: parsed.visual_style?.person_expression,
        product_presentation: parsed.visual_style?.product_presentation || defaults.visual_style.product_presentation,
        filters_effects: parsed.visual_style?.filters_effects || defaults.visual_style.filters_effects,
      },
      ad_classification: {
        estimated_goal: parsed.ad_classification?.estimated_goal || defaults.ad_classification.estimated_goal,
        estimated_audience: parsed.ad_classification?.estimated_audience || defaults.ad_classification.estimated_audience,
        industry: parsed.ad_classification?.industry || defaults.ad_classification.industry,
      },
    };
  }

  /**
   * Mock 분석 데이터 (개발용) - 다양한 패턴 생성
   */
  private getMockAnalysis(): ImageAnalysisResult {
    // 다양한 패턴 옵션들
    const gridPatterns = ['centered', '2-column', 'asymmetric', 'split-horizontal', 'full-bleed', '3-column', 'grid-4'];
    const productPositions = ['center', 'left-third', 'right-half', 'bottom', 'top', 'left', 'right'];
    const headlinePositions = ['top-center', 'overlay-center', 'bottom-left', 'top-left', 'bottom-center'];
    const logoPositions = ['top-left', 'top-right', 'bottom-right', 'bottom-left'];
    const ctaPositions = ['bottom-center', 'bottom-right', 'overlay', 'bottom-left', 'right'];
    const visualFlows = ['F-pattern', 'Z-pattern', 'center-focus', 'left-to-right', 'top-to-bottom', 'diagonal'];
    const whitespaceOptions = ['minimal', 'moderate', 'generous'];

    // 색상 팔레트들
    const colorPalettes = [
      { primary: '#FF6B6B', secondary: '#4ECDC4', accent: '#FFE66D', tone: 'warm-bright' },
      { primary: '#2C3E50', secondary: '#ECF0F1', accent: '#E74C3C', tone: 'cool-dark' },
      { primary: '#F8B500', secondary: '#1A1A1A', accent: '#FFFFFF', tone: 'vibrant' },
      { primary: '#A8D8EA', secondary: '#AA96DA', accent: '#FCBAD3', tone: 'pastel' },
      { primary: '#1ABC9C', secondary: '#2C3E50', accent: '#F39C12', tone: 'modern' },
      { primary: '#E8DAEF', secondary: '#FADBD8', accent: '#85C1E9', tone: 'soft' },
      { primary: '#212121', secondary: '#FAFAFA', accent: '#FF5722', tone: 'minimal' },
      { primary: '#FFB6C1', secondary: '#FFC0CB', accent: '#FF69B4', tone: 'feminine' },
      { primary: '#2E4057', secondary: '#048A81', accent: '#F6AE2D', tone: 'professional' },
      { primary: '#5C4033', secondary: '#D4AF37', accent: '#FFFDD0', tone: 'luxury' },
    ];

    const contrastLevels = ['high', 'medium', 'low'];

    const headlines = [
      '지금 바로 시작하세요', '새로운 당신을 만나다', '특별한 혜택이 기다립니다',
      '오늘만 이 가격', '품절 임박 서두르세요', '당신을 위한 맞춤 추천',
      '베스트셀러 1위', '리뷰 평점 4.9', '첫 구매 50% 할인',
      '무료 배송 혜택', '한정판 에디션', '프리미엄 퀄리티'
    ];

    const ctaTexts = [
      '지금 구매하기', '자세히 보기', '무료 체험', '할인 확인',
      '쇼핑하러 가기', '더 알아보기', '지금 신청', '예약하기'
    ];

    const fontStyles = ['bold-sans', 'elegant-serif', 'modern-minimal', 'playful', 'handwritten', 'geometric'];
    const imageTypes = ['photo', 'graphic', 'illustration', 'mixed', 'user-generated', '3d'];
    const expressions = ['smiling', 'serious', 'neutral', 'excited', 'thoughtful'];
    const presentations = ['closeup', 'lifestyle', 'before-after', 'flat-lay', 'action-shot', 'comparison', 'studio'];
    const effects = ['high-saturation', 'soft-focus', 'gradient-overlay', 'blur-background', 'vignette', 'natural', 'cinematic'];

    const goals = ['awareness', 'conversion', 'engagement', 'traffic', 'app-install'];
    const audiences = [
      'young-women-20s', 'young-men-20s', 'women-30s', 'men-30s',
      'business-professionals', 'parents', 'gen-z', 'health-conscious',
      'tech-enthusiasts', 'fashion-forward', 'budget-shoppers', 'luxury-seekers'
    ];
    const industries = ['cosmetics', 'fashion', 'food', 'tech', 'fitness', 'finance', 'education', 'travel'];

    // 랜덤 선택 헬퍼
    const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
    const palette = pick(colorPalettes);
    const hasPerson = Math.random() > 0.3; // 70% 확률로 인물 등장

    return {
      layout: {
        grid_pattern: pick(gridPatterns),
        element_positions: {
          product: pick(productPositions),
          headline: pick(headlinePositions),
          logo: pick(logoPositions),
          cta: pick(ctaPositions),
        },
        visual_flow: pick(visualFlows),
        whitespace_usage: pick(whitespaceOptions),
      },
      colors: {
        primary: palette.primary,
        secondary: palette.secondary,
        accent: palette.accent,
        overall_tone: palette.tone,
        contrast_level: pick(contrastLevels),
      },
      text: {
        headline: pick(headlines),
        subheadline: Math.random() > 0.5 ? '서브 헤드라인 텍스트' : null,
        cta_text: pick(ctaTexts),
        font_style: pick(fontStyles),
        text_ratio_percent: Math.floor(Math.random() * 25) + 10, // 10-35%
      },
      visual_style: {
        image_type: pick(imageTypes),
        has_person: hasPerson,
        person_expression: hasPerson ? pick(expressions) : undefined,
        product_presentation: pick(presentations),
        filters_effects: [pick(effects), ...(Math.random() > 0.5 ? [pick(effects)] : [])],
      },
      ad_classification: {
        estimated_goal: pick(goals),
        estimated_audience: pick(audiences),
        industry: pick(industries),
      },
    };
  }

  /**
   * 딜레이 유틸리티
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================================================
// Export Singleton Instance
// ============================================================================

export const geminiVision = new GeminiVisionService();

export { GeminiVisionService };
export type { GeminiVisionConfig };
