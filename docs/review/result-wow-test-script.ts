// RESULT WOW 재생성 테스트 도구 — CLI (2026-08).
//
// 목적: taste-generator.ts의 SYSTEM_PROMPT를 고칠 때마다 Persona A/B/C를
// 사람이 20문항 다시 입력하지 않고, 같은 고정 입력으로 결과 생성만
// 반복 실행하기 위한 개발/검증 전용 스크립트다. 이 파일은 production
// 코드가 아니다 — 앱 어디에서도 import되지 않고, 빌드에도 포함되지
// 않는다. package.json의 review:taste:a/b/c 스크립트로만 실행한다.
//
// 오너가 터미널 명령을 직접 실행하지 않아도 되는 버전은
// app/dev/result-wow-review(페이지)/app/api/review-taste-a(API)에
// 별도로 있다 — 둘 다 이 파일과 같은 fixture(src/map-decision-v1/engine/
// review-fixtures.ts)를 공유한다. 이 CLI는 B/C까지 포함해 터미널에서
// 빠르게 돌려보고 싶을 때, 또는 페이지 없이 파일로 결과를 남기고 싶을
// 때 계속 유용해서 남겨둔다.
//
// 실행 방법 (저장소 루트에서):
//   npm run review:taste:a   # Persona A만 재생성
//   npm run review:taste:b   # Persona B만
//   npm run review:taste:c   # Persona C만
// 또는 직접:
//   ANTHROPIC_API_KEY=sk-ant-... npx tsx docs/review/result-wow-test-script.ts A
//
// 키를 이 파일이나 다른 어떤 파일에도 저장하지 않는다 — 환경변수로만
// 넘긴다. 로그에도 키 값을 절대 출력하지 않는다(존재 여부만 확인).
// ANTHROPIC_API_KEY가 없으면 세션은 만들어 검증하되(라벨 오타 확인),
// API를 호출하지 않고 명확한 에러 메시지만 남기고 종료한다(exit 1).
//
// 결과는 docs/review/result-wow-current-{a,b,c}.json(원문 그대로) +
// docs/review/result-wow-current-{a,b,c}.md(사람이 읽기 쉬운 요약) 두
// 형태로 저장한다. "current"라는 이름은 "지금 이 브랜치의 generator로
// 방금 생성한 결과"라는 뜻이다 — production mapdecision.com에서 사람이
// 직접 만든 결과와 구분하기 위해 의도적으로 다른 이름을 썼다(그런
// production 결과는 이 브랜치의 프롬프트 변경 효과 판정 자료로 쓸 수
// 없다 — docs/CURRENT_STATE.md의 RESULT WOW 절 참고).

import * as fs from "fs";
import * as path from "path";
import { buildReviewPersonaSession, formatReviewPersonaInputSummary, ReviewPersonaId } from "../../src/map-decision-v1/engine/review-fixtures";
import { generateTasteResult } from "../../src/map-decision-v1/engine/taste-generator";
import { TasteResult } from "../../src/map-decision-v1/types";

// raw JSON을 그대로 옮기지 않고, 8개 필드(title/oneLiner/tasteCore/
// patterns/matrix/tasteMap/selfReflection/roadmap) + tags/statusLabel을
// 사람이 훑어보기 쉬운 문서 형태로 편집한다. 문장 자체는 절대 고치지
// 않는다 — 배열을 목록으로, 객체를 소제목으로 펼치기만 한다.
function formatResultMarkdown(personaId: string, result: TasteResult): string {
  const lines: string[] = [];
  lines.push(`# RESULT WOW 재생성 결과 — Persona ${personaId}`, "");
  lines.push(`- 생성 시각: ${result.generatedAt}`, `- 모델: ${result.model}`, "");

  lines.push("## title", "", result.title, "");
  lines.push("## oneLiner", "", result.oneLiner, "");
  if (result.statusLabel) lines.push("## statusLabel", "", result.statusLabel, "");
  if (result.tags && result.tags.length > 0) lines.push("## tags", "", result.tags.map((t) => `- ${t}`).join("\n"), "");

  lines.push("## tasteCore", "");
  lines.push("**certain**", result.tasteCore.certain.map((i) => `- ${i}`).join("\n"), "");
  lines.push("**conditional**", result.tasteCore.conditional.map((i) => `- ${i}`).join("\n"), "");
  lines.push("**indifferent**", result.tasteCore.indifferent.map((i) => `- ${i}`).join("\n"), "");

  lines.push("## patterns", "", result.patterns.map((i) => `- ${i}`).join("\n"), "");

  lines.push("## matrix", "");
  lines.push(`- x축: ${result.matrix.xAxisLabel.low} ↔ ${result.matrix.xAxisLabel.high}`);
  lines.push(`- y축: ${result.matrix.yAxisLabel.low} ↔ ${result.matrix.yAxisLabel.high}`, "");
  lines.push(
    result.matrix.types.map((t) => `- **${t.label}** (x=${t.x}, y=${t.y}) — ${t.description}`).join("\n"),
    "",
  );

  lines.push("## tasteMap", "");
  lines.push("**넓혀볼 방향(expand)**", result.tasteMap.expand.map((i) => `- ${i}`).join("\n"), "");
  lines.push("**안 맞을 방향(avoid)**", result.tasteMap.avoid.map((i) => `- ${i}`).join("\n"), "");

  lines.push("## selfReflection", "");
  lines.push("**awareness**", result.selfReflection.awareness.map((i) => `- ${i}`).join("\n"), "");
  lines.push("**blindSpots**", result.selfReflection.blindSpots.map((i) => `- ${i}`).join("\n"), "");

  lines.push("## roadmap", "");
  lines.push(`**firstAction**: ${result.roadmap.firstAction}`, "");
  for (const phase of result.roadmap.phases) {
    lines.push(`**${phase.label}**`, phase.actions.map((a) => `- ${a}`).join("\n"), "");
  }

  return lines.join("\n");
}

function parsePersonaArg(): ReviewPersonaId {
  const arg = (process.argv[2] ?? "").trim().toUpperCase();
  if (arg === "A" || arg === "B" || arg === "C") return arg;
  console.error(
    [
      "사용법: npx tsx docs/review/result-wow-test-script.ts <A|B|C>",
      "또는: npm run review:taste:a  (b / c도 동일)",
      `받은 값: "${process.argv[2] ?? "(없음)"}"`,
    ].join("\n"),
  );
  process.exit(1);
}

async function main() {
  const personaId = parsePersonaArg();
  const outDir = path.join(__dirname);

  console.log(`=== persona ${personaId} ===`);
  const session = buildReviewPersonaSession(personaId);
  console.log(`session built OK — messages=${session.messages.length}, quizAnswers keys=${Object.keys(session.quizAnswers ?? {}).length}`);

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error(
      [
        "",
        "❌ ANTHROPIC_API_KEY 환경변수가 설정돼 있지 않습니다.",
        "실제 생성 결과를 만들려면 키를 환경변수로 넘긴 뒤 다시 실행하세요:",
        `  ANTHROPIC_API_KEY=sk-ant-... npm run review:taste:${personaId.toLowerCase()}`,
        "(세션 구성 자체는 정상입니다 — 위 'session built OK' 로그 참고. API 호출 직전에만 멈췄습니다.)",
      ].join("\n"),
    );
    process.exit(1);
  }

  const outcome = await generateTasteResult(session);
  const inputSummary = formatReviewPersonaInputSummary(personaId);

  if (!outcome.result) {
    const mdPath = path.join(outDir, `result-wow-current-${personaId.toLowerCase()}.md`);
    const body = [
      `# RESULT WOW 재생성 결과 — Persona ${personaId}`,
      "",
      "## 테스트용 입력 요약",
      "",
      "```",
      inputSummary,
      "```",
      "",
      "## 생성 실패",
      "",
      `category=${outcome.category ?? "null"}, attempts=${outcome.attempts}, countsAsFailure=${outcome.countsAsFailure}. 콘솔 로그(스크립트 실행 터미널)를 참고하세요. 재시도하려면 같은 명령을 다시 실행하세요.`,
      "",
    ].join("\n");
    fs.writeFileSync(mdPath, body, "utf-8");
    console.error(`생성 실패 — ${mdPath}에 사유만 기록했습니다.`);
    process.exit(1);
  }

  const jsonPath = path.join(outDir, `result-wow-current-${personaId.toLowerCase()}.json`);
  const mdPath = path.join(outDir, `result-wow-current-${personaId.toLowerCase()}.md`);

  fs.writeFileSync(jsonPath, JSON.stringify(outcome.result, null, 2), "utf-8");

  const md = [
    formatResultMarkdown(personaId, outcome.result),
    "---",
    "",
    "## 테스트용 입력 요약",
    "",
    "```",
    inputSummary,
    "```",
    "",
  ].join("\n");
  fs.writeFileSync(mdPath, md, "utf-8");

  console.log(`wrote ${jsonPath}`);
  console.log(`wrote ${mdPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
