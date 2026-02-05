import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient, isDevMode } from '@/lib/db/supabase';
import { getCreativeById } from '@/lib/db/queries';

// GET /api/creatives/:id/download - 소재 다운로드
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Creative 조회 (개발 모드 지원)
    let creative;
    let error = null;

    if (isDevMode) {
      creative = await getCreativeById(id);
    } else {
      const supabase = createSupabaseServerClient();
      if (!supabase) {
        return NextResponse.json(
          { success: false, error: '데이터베이스 연결에 실패했습니다' },
          { status: 500 }
        );
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
      return NextResponse.json(
        { success: false, error: '소재를 찾을 수 없습니다' },
        { status: 404 }
      );
    }

    // 이미지 타입인 경우
    if (creative.type === 'image' && creative.content_url) {
      try {
        // 외부 URL에서 이미지 fetch
        const imageResponse = await fetch(creative.content_url);

        if (!imageResponse.ok) {
          throw new Error('이미지를 가져오는데 실패했습니다');
        }

        const imageBuffer = await imageResponse.arrayBuffer();
        const contentType = imageResponse.headers.get('content-type') || 'image/png';

        // 파일명 생성
        const filename = `ad-creative-${creative.platform}-${id.slice(0, 8)}.png`;

        return new NextResponse(imageBuffer, {
          headers: {
            'Content-Type': contentType,
            'Content-Disposition': `attachment; filename="${filename}"`,
            'Content-Length': imageBuffer.byteLength.toString(),
          },
        });
      } catch (fetchError) {
        console.error('Image fetch error:', fetchError);
        return NextResponse.json(
          { success: false, error: '이미지 다운로드에 실패했습니다' },
          { status: 500 }
        );
      }
    }

    // 카피 타입인 경우
    if (creative.type === 'copy' && creative.copy_text) {
      const filename = `ad-copy-${creative.platform}-${id.slice(0, 8)}.txt`;
      const textBuffer = new TextEncoder().encode(creative.copy_text);

      return new NextResponse(textBuffer, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Length': textBuffer.byteLength.toString(),
        },
      });
    }

    return NextResponse.json(
      { success: false, error: '다운로드할 콘텐츠가 없습니다' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      {
        success: false,
        error: `다운로드에 실패했습니다: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
      { status: 500 }
    );
  }
}
