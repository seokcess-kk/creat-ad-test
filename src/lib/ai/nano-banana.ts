import { GoogleGenerativeAI } from '@google/generative-ai';
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

class NanoBananaService {
  private client: GoogleGenerativeAI;
  private model: string = 'gemini-3-pro-image-preview';

  constructor() {
    this.client = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);
  }

  async generateImage(params: ImageGenerationParams): Promise<GeneratedImage> {
    const model = this.client.getGenerativeModel({ model: this.model });

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
    const enhancedPrompt = this.buildPrompt(params);

    try {
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: enhancedPrompt }] }],
        generationConfig: {
          // @ts-expect-error - Nano Banana Pro specific config
          responseModalities: ['image'],
          imageGenerationConfig: {
            resolution: resolution,
            outputFormat: 'png',
          },
        },
      });

      // 이미지 데이터 추출
      const response = result.response;
      const candidate = response.candidates?.[0];
      const part = candidate?.content?.parts?.[0];

      const imageData = part?.inlineData;

      if (!imageData) {
        throw new Error('이미지 생성 실패: 응답에 이미지 데이터가 없습니다');
      }

      // R2에 업로드
      const imageUrl = await uploadToR2(
        Buffer.from(imageData.data, 'base64'),
        imageData.mimeType || 'image/png'
      );

      return {
        url: imageUrl,
        prompt: enhancedPrompt,
        resolution: resolution,
      };
    } catch (error) {
      console.error('Nano Banana Pro error:', error);
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
