/**
 * Health Check API
 * Docker 컨테이너 상태 확인용
 */

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'creat-ad-test',
    version: process.env.npm_package_version || '1.0.0',
  });
}
