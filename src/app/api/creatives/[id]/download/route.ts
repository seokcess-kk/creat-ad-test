import { NextResponse } from 'next/server';
import { createSupabaseServerClient, isDevMode } from '@/lib/db/supabase';
import { getCreativeById } from '@/lib/db/queries';
import { withLogging, errorResponse } from '@/lib/api-utils';

// GET /api/creatives/:id/download - 소재 다운로드
export const GET = withLogging(async (_request, { log, requestId, params }) => {
  try {
    const id = params?.id;
    if (!id) {
      return errorResponse('소재 ID가 필요합니다', requestId, 400);
    }

    log.info('Download requested', { creativeId: id });

    // Creative 조회
    let creative;
    let error = null;

    if (isDevMode) {
      creative = await getCreativeById(id);
    } else {
      const supabase = createSupabaseServerClient();
      if (!supabase) {
        log.error('Database connection failed');
        return errorResponse('데이터베이스 연결에 실패했습니다', requestId, 500);
      }
      const result = await supabase
        .from('creatives')
        .select('*')
        .eq('id', id)
        .single();
      creative = result.data;
      error = result.error;
    }

    if (error || !creative) {
      log.warning('Creative not found', { creativeId: id });
      return errorResponse('소재를 찾을 수 없습니다', requestId, 404);
    }

    log.info('Creative found', {
      creativeId: id,
      type: creative.type,
      platform: creative.platform,
    });

    // 이미지 타입인 경우
    if (creative.type === 'image' && creative.content_url) {
      try {
        log.info('Fetching image from URL', {
          creativeId: id,
          url: creative.content_url.substring(0, 50) + '...',
        });

        const imageResponse = await fetch(creative.content_url);

        if (!imageResponse.ok) {
          log.error('Image fetch failed', {
            creativeId: id,
            status: imageResponse.status,
          });
          throw new Error('이미지를 가져오는데 실패했습니다');
        }

        const imageBuffer = await imageResponse.arrayBuffer();
        const contentType = imageResponse.headers.get('content-type') || 'image/png';
        const filename = `ad-creative-${creative.platform}-${id.slice(0, 8)}.png`;

        log.info('Image download prepared', {
          creativeId: id,
          filename,
          size: imageBuffer.byteLength,
        });

        return new NextResponse(imageBuffer, {
          headers: {
            'Content-Type': contentType,
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Content-Length': imageBuffer.byteLength.toString(),
            'X-Request-ID': requestId,
          },
        });
      } catch (fetchError) {
        log.error('Image fetch error', {
          creativeId: id,
          error: fetchError instanceof Error ? fetchError.message : 'Unknown error',
        });
        return errorResponse('이미지 다운로드에 실패했습니다', requestId, 500);
      }
    }

    // 카피 타입인 경우
    if (creative.type === 'copy' && creative.copy_text) {
      const filename = `ad-copy-${creative.platform}-${id.slice(0, 8)}.txt`;
      const textBuffer = new TextEncoder().encode(creative.copy_text);

      log.info('Copy download prepared', {
        creativeId: id,
        filename,
        size: textBuffer.byteLength,
      });

      return new NextResponse(textBuffer, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Length': textBuffer.byteLength.toString(),
          'X-Request-ID': requestId,
        },
      });
    }

    log.warning('No downloadable content', { creativeId: id, type: creative.type });
    return errorResponse('다운로드할 콘텐츠가 없습니다', requestId, 400);
  } catch (error) {
    log.error('Download error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    return errorResponse(
      `다운로드에 실패했습니다: ${error instanceof Error ? error.message : 'Unknown error'}`,
      requestId,
      500
    );
  }
});
