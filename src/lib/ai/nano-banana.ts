import { GoogleGenAI } from '@google/genai';
import { uploadToR2 } from '@/lib/storage/r2';

type AspectRatio = '1:1' | '4:5' | '9:16' | '16:9';
type Resolution = '1k' | '2k' | '4k';

interface ImageGenerationParams {
  prompt: string;
  resolution: Resolution;
  aspectRatio: AspectRatio;
  style?: string;
}

interface GeneratedImage {
  url: string;
  prompt: string;
  resolution: string;
}

// API 키 확인
const isDevMode = !process.env.GOOGLE_AI_API_KEY;

class NanoBananaService {
  private client: GoogleGenAI | null;
  // Nano Banana Pro (Gemini 3 Pro Image) - 최고 품질 이미지 생성 모델
  private model: string = 'gemini-3-pro-image-preview';

  constructor() {
    if (isDevMode) {
      this.client = null;
      console.log('⚠️ Nano Banana API: 개발 모드 (GOOGLE_AI_API_KEY 없음)');
    } else {
      this.client = new GoogleGenAI({
        apiKey: process.env.GOOGLE_AI_API_KEY!,
      });
    }
  }

  // 개발 모드용 플레이스홀더 이미지
  private getPlaceholderImage(aspectRatio: AspectRatio, resolution: string): GeneratedImage {
    const sizeMap: Record<AspectRatio, { w: number; h: number }> = {
      '1:1': { w: 800, h: 800 },
      '4:5': { w: 800, h: 1000 },
      '9:16': { w: 720, h: 1280 },
      '16:9': { w: 1280, h: 720 },
    };
    const size = sizeMap[aspectRatio];
    return {
      url: `https://placehold.co/${size.w}x${size.h}/4ECDC4/FFFFFF?text=Ad+Creative\\n${aspectRatio}`,
      prompt: '[개발 모드 - 플레이스홀더 이미지]',
      resolution,
    };
  }

  async generateImage(params: ImageGenerationParams): Promise<GeneratedImage> {
    // 해상도 매핑
    const resolutionMap: Record<Resolution, Record<AspectRatio, string>> = {
      '1k': {
        '1:1': '1024x1024',
        '4:5': '1024x1280',
        '9:16': '1024x1820',
        '16:9': '1820x1024',
      },
      '2k': {
        '1:1': '2048x2048',
        '4:5': '2048x2560',
        '9:16': '2048x3640',
        '16:9': '3640x2048',
      },
      '4k': {
        '1:1': '4096x4096',
        '4:5': '4096x5120',
        '9:16': '4096x7280',
        '16:9': '7280x4096',
      },
    };

    const resolution = resolutionMap[params.resolution][params.aspectRatio];

    // 개발 모드: 플레이스홀더 이미지 반환
    if (isDevMode || !this.client) {
      console.log('🖼️ Nano Banana: 플레이스홀더 이미지 반환');
      return this.getPlaceholderImage(params.aspectRatio, resolution);
    }

    const enhancedPrompt = this.buildPrompt(params);

    try {
      console.log('🎨 Nano Banana: 이미지 생성 시작...');
      console.log('📝 프롬프트:', enhancedPrompt.substring(0, 100) + '...');

      // 새로운 @google/genai SDK 사용
      const response = await this.client.models.generateContent({
        model: this.model,
        contents: enhancedPrompt,
        config: {
          responseModalities: ['TEXT', 'IMAGE'],
        },
      });

      // 이미지 데이터 추출
      const candidate = response.candidates?.[0];
      const parts = candidate?.content?.parts;

      if (!parts || parts.length === 0) {
        console.error('Nano Banana: 응답에 parts가 없습니다');
        throw new Error('이미지 생성 실패: 응답에 데이터가 없습니다');
      }

      // parts에서 이미지 데이터 찾기
      let imageData: { data: string; mimeType: string } | null = null;
      for (const part of parts) {
        if ('inlineData' in part && part.inlineData) {
          imageData = {
            data: part.inlineData.data as string,
            mimeType: (part.inlineData.mimeType as string) || 'image/png',
          };
          break;
        }
      }

      if (!imageData) {
        console.error('Nano Banana: 이미지 데이터를 찾을 수 없습니다');
        console.error('Parts:', JSON.stringify(parts, null, 2));
        throw new Error('이미지 생성 실패: 응답에 이미지 데이터가 없습니다');
      }

      console.log('✅ Nano Banana: 이미지 데이터 수신 완료');

      // R2에 업로드
      const imageUrl = await uploadToR2(
        Buffer.from(imageData.data, 'base64'),
        imageData.mimeType
      );

      console.log('✅ Nano Banana: R2 업로드 완료 -', imageUrl);

      return {
        url: imageUrl,
        prompt: enhancedPrompt,
        resolution: resolution,
      };
    } catch (error) {
      console.error('Nano Banana error:', error);

      // 상세 에러 정보 출력
      if (error instanceof Error) {
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);

        // 할당량 초과 에러 체크
        if (error.message.includes('429') || error.message.includes('quota') || error.message.includes('RESOURCE_EXHAUSTED')) {
          throw new Error('이미지 생성 할당량 초과: Google AI 결제 계정이 필요합니다. https://ai.google.dev/pricing 에서 결제 정보를 등록해주세요.');
        }

        // Imagen 결제 필요 에러 체크
        if (error.message.includes('billed users')) {
          throw new Error('Imagen API는 유료 사용자만 이용 가능합니다. Google AI Studio에서 결제 정보를 등록해주세요.');
        }
      }

      throw new Error(
        `이미지 생성 실패: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  private buildPrompt(params: ImageGenerationParams): string {
    const basePrompt = params.prompt;
    const styleGuide = params.style ? `Style: ${params.style}. ` : '';

    return `${styleGuide}${basePrompt}

Requirements:
- High quality, professional advertising photography
- Clean composition suitable for social media
- Vibrant colors, excellent lighting
- No text overlays (text will be added separately if needed)
- Commercial use appropriate
- Modern, contemporary aesthetic`;
  }

  // 플랫폼에 맞는 이미지 생성
  async generateForPlatform(
    prompt: string,
    platform: string,
    resolution: Resolution = '2k'
  ): Promise<GeneratedImage> {
    const aspectRatioMap: Record<string, AspectRatio> = {
      instagram_feed: '1:1',
      instagram_story: '9:16',
      tiktok: '9:16',
      threads: '1:1',
      youtube_shorts: '9:16',
      youtube_ads: '16:9',
    };

    const aspectRatio = aspectRatioMap[platform] || '1:1';

    return this.generateImage({
      prompt,
      resolution,
      aspectRatio,
    });
  }
}

export const nanoBanana = new NanoBananaService();
