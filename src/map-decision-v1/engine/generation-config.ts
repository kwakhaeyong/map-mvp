// Sonnet 5는 명시하지 않으면 effort가 "high"로 기본 적용된다(Anthropic
// 공식 마이그레이션 문서: "`effort` defaults to `high` when not set"). 이
// 값이 클수록 내부 사고(thinking) 토큰을 더 많이 쓰는데, 그 토큰이
// max_tokens 예산과 과금 대상 출력 토큰에 그대로 포함된다 — 실측 결과
// 완주 1회당 출력이 최종 JSON(추정 1,000~1,500토큰)보다 훨씬 큰 이유가
// 여기 있다. medium으로 낮추면 사고 토큰이 줄어 비용이 내려가지만, 품질도
// 같이 낮아질 수 있어(공식 문서: "Sonnet 5 at medium은 Sonnet 4.6의
// high와 비슷한 수준") 재배포 없이 되돌릴 수 있게 환경변수로 뺀다.
export type GenerationEffort = "low" | "medium" | "high" | "xhigh" | "max";

const VALID_EFFORTS: readonly GenerationEffort[] = ["low", "medium", "high", "xhigh", "max"];
const DEFAULT_GENERATION_EFFORT: GenerationEffort = "medium";

// Vercel은 Sensitive로 표시된 환경변수 값을 대시보드에 보여주지 않아서,
// ANTHROPIC_GENERATION_EFFORT가 실제로 코드까지 도달했는지 대시보드만으로는
// 확인할 수 없다 — Runtime Logs로 직접 확인한다. 사용자 입력은 절대 여기
// 안 들어간다(effort는 고정된 5개 값 중 하나뿐이다).
export function getGenerationEffort(): GenerationEffort {
  const raw = process.env.ANTHROPIC_GENERATION_EFFORT;
  const effort = (VALID_EFFORTS as readonly string[]).includes(raw ?? "") ? (raw as GenerationEffort) : DEFAULT_GENERATION_EFFORT;
  console.log(`[generation] effort=${effort}`);
  return effort;
}
