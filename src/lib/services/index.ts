/**
 * Services Index
 * Channel-First Ad Generator v2.0 핵심 서비스 모듈
 */

// Ad Collection
export { adCollectorService, AdCollectorService } from './ad-collector';

// Vision Analysis
export { visionAnalyzerService, VisionAnalyzerService } from './vision-analyzer';

// Pattern Extraction
export { patternSynthesizerService, PatternSynthesizerService } from './pattern-synthesizer';

// Evidence Validation
export { evidenceValidatorService, EvidenceValidatorService } from './evidence-validator';

// Insight Generation
export { insightGeneratorService, InsightGeneratorService } from './insight-generator';

// Concept Generation
export { conceptGeneratorService, ConceptGeneratorService } from './concept-generator';
export type { GeneratedConcept, GenerateFromAnalysisInput } from './concept-generator';

/**
 * Analysis Pipeline 실행
 * 광고 수집 → Vision 분석 → 패턴 추출 → 근거 검증 → 인사이트 생성
 */
import { adCollectorService } from './ad-collector';
import { visionAnalyzerService } from './vision-analyzer';
import { patternSynthesizerService } from './pattern-synthesizer';
import { evidenceValidatorService } from './evidence-validator';
import { insightGeneratorService } from './insight-generator';
import type { AdCollectionRequest, ChannelAnalysisResult } from '@/types/analysis';

export async function runAnalysisPipeline(
  request: AdCollectionRequest
): Promise<ChannelAnalysisResult> {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('🚀 Analysis Pipeline 시작');
  console.log(`   채널: ${request.platform}, 업종: ${request.industry}`);
  console.log('═══════════════════════════════════════════════════════════');

  const startTime = Date.now();

  // 1. 광고 수집
  console.log('\n📥 Step 1/5: 광고 수집');
  const collectedAds = await adCollectorService.collect(request);

  // 2. Vision 분석
  console.log('\n🖼️ Step 2/5: Vision 분석');
  const visionResults = await visionAnalyzerService.analyzeAds(collectedAds);

  // 3. 패턴 추출
  console.log('\n🔍 Step 3/5: 패턴 추출');
  const performanceTiers = collectedAds.map(ad => ad.performance_tier);
  const adIds = collectedAds.map(ad => ad.id);
  const extractedPatterns = patternSynthesizerService.extractPatterns(
    visionResults,
    performanceTiers,
    adIds
  );

  // 4. 근거 검증
  console.log('\n🔬 Step 4/5: 근거 검증');
  const validatedEvidence = await evidenceValidatorService.validate(
    extractedPatterns,
    { channel: request.platform, industry: request.industry },
    collectedAds
  );

  // 5. 인사이트 생성
  console.log('\n💡 Step 5/5: 인사이트 생성');
  const analysisResult = insightGeneratorService.generate({
    channel: request.platform,
    industry: request.industry,
    evidence: validatedEvidence,
    collectedAds,
  });

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log(`✅ Analysis Pipeline 완료 (${duration}초)`);
  console.log(`   총 광고: ${collectedAds.length}개`);
  console.log(`   추출 패턴: ${extractedPatterns.length}개`);
  console.log(`   검증된 인사이트: ${validatedEvidence.length}개`);
  console.log(`   분석 품질 점수: ${analysisResult.analysis_metadata.analysis_quality_score}점`);
  console.log('═══════════════════════════════════════════════════════════');

  return analysisResult;
}
