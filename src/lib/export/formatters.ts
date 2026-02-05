// Format Service - JSON/CSV 변환
// Feature: export-api

import type { ExportCreative, ExportFormat } from '@/types/export';

/**
 * FormatService - 데이터 포맷 변환
 */
class FormatService {
  /**
   * JSON 포맷 (기본)
   */
  toJSON<T>(data: T): string {
    return JSON.stringify(data, null, 2);
  }

  /**
   * CSV 포맷 (간단한 구현)
   * Phase 2에서 json2csv 라이브러리로 대체 가능
   */
  toCSV(creatives: ExportCreative[]): string {
    if (creatives.length === 0) {
      return '';
    }

    // CSV 헤더
    const headers = [
      'creative_id',
      'tracking_code',
      'external_id',
      'version',
      'campaign_id',
      'concept_id',
      'type',
      'platform',
      'content_url',
      'copy_text',
      'resolution',
      'model',
      'campaign_goal',
      'target_audience',
      'brand_name',
      'created_at',
    ];

    // CSV 행 생성
    const rows = creatives.map((creative) => {
      return [
        this.escapeCSV(creative.creative_id),
        this.escapeCSV(creative.tracking_code || ''),
        this.escapeCSV(creative.external_id || ''),
        creative.version.toString(),
        this.escapeCSV(creative.campaign_id),
        this.escapeCSV(creative.concept_id),
        this.escapeCSV(creative.type),
        this.escapeCSV(creative.platform),
        this.escapeCSV(creative.content_url || ''),
        this.escapeCSV(creative.copy_text || ''),
        this.escapeCSV(creative.resolution || ''),
        this.escapeCSV(creative.metadata?.model || ''),
        this.escapeCSV(creative.metadata?.campaign_goal || ''),
        this.escapeCSV(creative.metadata?.target_audience || ''),
        this.escapeCSV(creative.metadata?.brand_name || ''),
        this.escapeCSV(creative.created_at),
      ].join(',');
    });

    // BOM + 헤더 + 데이터
    const bom = '\uFEFF'; // UTF-8 BOM for Excel
    return bom + headers.join(',') + '\n' + rows.join('\n');
  }

  /**
   * CSV 값 이스케이프
   */
  private escapeCSV(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  /**
   * Content-Type 헤더 결정
   */
  getContentType(format: ExportFormat): string {
    return format === 'csv'
      ? 'text/csv; charset=utf-8'
      : 'application/json; charset=utf-8';
  }

  /**
   * Content-Disposition 헤더 (다운로드용)
   */
  getContentDisposition(prefix: string, format: ExportFormat): string {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${prefix}_${timestamp}.${format}`;
    return `attachment; filename="${filename}"`;
  }

  /**
   * 파일명 생성
   */
  getFilename(prefix: string, format: ExportFormat): string {
    const timestamp = new Date().toISOString().split('T')[0];
    return `${prefix}_${timestamp}.${format}`;
  }
}

export const formatService = new FormatService();
