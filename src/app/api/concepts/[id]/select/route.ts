import { NextRequest, NextResponse } from 'next/server';
import { selectConcept } from '@/lib/db/queries';

// PUT /api/concepts/:id/select - 컨셉 선택
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const concept = await selectConcept(id);

    return NextResponse.json({
      success: true,
      data: concept,
    });
  } catch (error) {
    console.error('Select concept error:', error);
    return NextResponse.json(
      {
        success: false,
        error: '컨셉 선택에 실패했습니다',
      },
      { status: 500 }
    );
  }
}
